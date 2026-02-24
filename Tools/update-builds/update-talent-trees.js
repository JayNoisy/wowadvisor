import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import luaparse from "luaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.BLIZZARD_REGION || "us";
const LOCALE = process.env.BLIZZARD_LOCALE || "en_US";
let ACTIVE_NAMESPACE = `static-${REGION}`;
const LIB_TALENT_INFO_RETAIL_URL =
  "https://raw.githubusercontent.com/Snakybo/LibTalentInfo-1.0/master/LibTalentInfo-1.0/TalentDataRetail.lua";
const CLASS_FILE_TO_NAME = {
  DEATHKNIGHT: "Death Knight",
  DEMONHUNTER: "Demon Hunter",
  DRUID: "Druid",
  EVOKER: "Evoker",
  HUNTER: "Hunter",
  MAGE: "Mage",
  MONK: "Monk",
  PALADIN: "Paladin",
  PRIEST: "Priest",
  ROGUE: "Rogue",
  SHAMAN: "Shaman",
  WARLOCK: "Warlock",
  WARRIOR: "Warrior"
};

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function getAccessToken() {
  const clientId = requireEnv("BLIZZARD_CLIENT_ID");
  const clientSecret = requireEnv("BLIZZARD_CLIENT_SECRET");
  const tokenUrl = `https://${REGION}.battle.net/oauth/token`;

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
  if (!res.ok) throw new Error(`OAuth failed: ${res.status}`);
  const data = await res.json();
  if (!data?.access_token) throw new Error("No access_token in OAuth response");
  return data.access_token;
}

async function tryGetAccessToken() {
  if (!process.env.BLIZZARD_CLIENT_ID || !process.env.BLIZZARD_CLIENT_SECRET) {
    console.log("Blizzard credentials not set; skipping Blizzard API routes.");
    return null;
  }
  try {
    return await getAccessToken();
  } catch (err) {
    console.log(`Blizzard token request failed; skipping Blizzard API routes. ${String(err)}`);
    return null;
  }
}

async function fetchApi(url, token, namespaceOverride = ACTIVE_NAMESPACE) {
  const u = new URL(url);
  if (!u.searchParams.get("namespace") && namespaceOverride) {
    u.searchParams.set("namespace", namespaceOverride);
  }
  if (!u.searchParams.get("locale")) u.searchParams.set("locale", LOCALE);
  if (!u.searchParams.get("access_token")) u.searchParams.set("access_token", token);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`Blizzard API ${res.status}: ${u}`);
  return res.json();
}

async function fetchApiStatus(url, token, namespaceOverride = ACTIVE_NAMESPACE) {
  const u = new URL(url);
  if (!u.searchParams.get("namespace") && namespaceOverride) {
    u.searchParams.set("namespace", namespaceOverride);
  }
  if (!u.searchParams.get("locale")) u.searchParams.set("locale", LOCALE);
  if (!u.searchParams.get("access_token")) u.searchParams.set("access_token", token);
  const res = await fetch(u.toString());
  return { ok: res.ok, status: res.status, url: u.toString() };
}

async function tryFetchApi(url, token, namespaceOverride = ACTIVE_NAMESPACE) {
  try {
    return await fetchApi(url, token, namespaceOverride);
  } catch {
    return null;
  }
}

function namespaceFromSelf(payload) {
  const href = payload?._links?.self?.href;
  if (!href) return null;
  try {
    const ns = new URL(href).searchParams.get("namespace");
    return ns || null;
  } catch {
    return null;
  }
}

async function resolveWorkingNamespace(token) {
  const probeUrls = [
    `https://${REGION}.api.blizzard.com/data/wow/playable-race/index`,
    `https://${REGION}.api.blizzard.com/data/wow/item-class/index`,
    `https://${REGION}.api.blizzard.com/data/wow/playable-class/index`
  ];
  const candidates = [`static-${REGION}`, `dynamic-${REGION}`];

  for (const ns of candidates) {
    for (const url of probeUrls) {
      const payload = await tryFetchApi(url, token, ns);
      if (!payload) continue;
      const hinted = namespaceFromSelf(payload);
      return hinted || ns;
    }
  }

  return ACTIVE_NAMESPACE;
}

function toName(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v.en_US || v.name || "").trim();
  return "";
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = toName(v);
    if (s) return s;
  }
  return "";
}

function iconUrlFromName(iconNameLike) {
  const iconName = String(iconNameLike || "").trim().toLowerCase();
  if (!iconName) return null;
  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
}

function luaNodeToJs(node) {
  if (!node) return null;

  switch (node.type) {
    case "StringLiteral":
      return typeof node.value === "string" ? node.value : null;
    case "NumericLiteral":
      return node.value;
    case "BooleanLiteral":
      return node.value;
    case "NilLiteral":
      return null;
    case "Identifier":
      return node.name;
    case "TableConstructorExpression": {
      const obj = {};
      const arr = [];
      let isArrayLike = true;
      for (const field of node.fields || []) {
        if (field.type === "TableValue") {
          arr.push(luaNodeToJs(field.value));
          continue;
        }
        isArrayLike = false;
        if (field.type === "TableKeyString") {
          obj[field.key?.name] = luaNodeToJs(field.value);
          continue;
        }
        if (field.type === "TableKey") {
          obj[String(luaNodeToJs(field.key))] = luaNodeToJs(field.value);
        }
      }
      return isArrayLike ? arr : obj;
    }
    default:
      return null;
  }
}

function findSetProviderArg(ast) {
  for (const stmt of ast.body || []) {
    if (stmt.type !== "CallStatement") continue;
    const expr = stmt.expression;
    if (!expr || expr.type !== "CallExpression") continue;
    const base = expr.base;
    if (!base || base.type !== "MemberExpression") continue;
    if (base.identifier?.name !== "SetProvider") continue;
    const args = expr.arguments || [];
    const first = args[0];
    if (first?.type === "TableConstructorExpression") return first;
  }
  return null;
}

function buildNodesFromTalentList(talents) {
  const list = Array.isArray(talents) ? talents : [];
  return list
    .map((t, i) => {
      if (!t || typeof t !== "object") return null;
      const id = Number(t.id ?? i + 1);
      const name = toName(t.name) || `Talent ${id}`;
      return {
        id,
        name,
        row: Math.floor(i / 4),
        col: i % 4,
        maxRank: 1,
        treeType: "spec"
      };
    })
    .filter(Boolean);
}

function extractLuaTableByMarker(luaText, marker) {
  const markerIdx = luaText.indexOf(marker);
  if (markerIdx < 0) return null;
  const start = luaText.indexOf("{", markerIdx);
  if (start < 0) return null;

  let depth = 0;
  for (let i = start; i < luaText.length; i++) {
    const ch = luaText[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) return luaText.slice(start, i + 1);
  }
  return null;
}

function parseSpecMetaFromLua(luaText) {
  const specMeta = new Map(); // specId -> { className, specName }
  const classTable = extractLuaTableByMarker(luaText, "specializations =");
  if (!classTable) return specMeta;

  const classBlockRe = /\["([A-Z]+)"\]\s*=\s*\{([\s\S]*?)\n\s*\},/g;
  let classMatch;
  while ((classMatch = classBlockRe.exec(classTable))) {
    const classFile = classMatch[1];
    const className = CLASS_FILE_TO_NAME[classFile] || classFile;
    const body = classMatch[2] || "";
    const specRe = /id\s*=\s*(\d+),\s*name\s*=\s*("([^"]*)"|nil)/g;
    let specMatch;
    while ((specMatch = specRe.exec(body))) {
      const specId = Number(specMatch[1]);
      const specName = specMatch[3] || "";
      if (!Number.isFinite(specId) || !specName) continue;
      specMeta.set(specId, { className, specName });
    }
  }

  return specMeta;
}

function parseTalentListsFromLua(luaText) {
  const out = new Map(); // specId -> [{id,name}]
  const pvpTable = extractLuaTableByMarker(luaText, "pvpTalents =");
  if (!pvpTable) return out;

  const specTalentBlockRe = /\[(\d+)\]\s*=\s*\{([\s\S]*?)\n\s*\},/g;
  let specBlock;
  while ((specBlock = specTalentBlockRe.exec(pvpTable))) {
    const specId = Number(specBlock[1]);
    const body = specBlock[2] || "";
    if (!Number.isFinite(specId)) continue;

    const talents = [];
    const talentRe = /\{\s*id\s*=\s*(\d+),\s*name\s*=\s*"([^"]+)"/g;
    let tMatch;
    while ((tMatch = talentRe.exec(body))) {
      talents.push({ id: Number(tMatch[1]), name: tMatch[2] });
    }

    if (talents.length > 0) out.set(specId, talents);
  }

  return out;
}

async function collectFromLibTalentInfoGithub() {
  const res = await fetch(LIB_TALENT_INFO_RETAIL_URL, {
    headers: { "user-agent": "wowadvisor-updater" }
  });
  if (!res.ok) {
    console.log(`LibTalentInfo fetch failed: HTTP ${res.status}`);
    return [];
  }

  const luaText = await res.text();
  let ast;
  try {
    ast = luaparse.parse(luaText, { luaVersion: "5.1" });
  } catch {
    console.log("LibTalentInfo parse failed");
    return [];
  }

  const providerTable = findSetProviderArg(ast);
  if (providerTable) {
    const provider = luaNodeToJs(providerTable);
    const specsByClass = provider?.specializations && typeof provider.specializations === "object"
      ? provider.specializations
      : {};
    const pvpTalentsBySpec = provider?.pvpTalents && typeof provider.pvpTalents === "object"
      ? provider.pvpTalents
      : {};
    const talentsBySpec = provider?.talents && typeof provider.talents === "object"
      ? provider.talents
      : {};

    const out = [];
    for (const [classFile, specMap] of Object.entries(specsByClass)) {
      const className = CLASS_FILE_TO_NAME[classFile] || classFile;
      if (!specMap || typeof specMap !== "object") continue;

      for (const spec of Object.values(specMap)) {
        if (!spec || typeof spec !== "object") continue;
        const specId = Number(spec.id);
        const specName = toName(spec.name);
        if (!specName || !Number.isFinite(specId)) continue;

        const rawList = pvpTalentsBySpec[String(specId)] || talentsBySpec[String(specId)] || [];
        const nodes = buildNodesFromTalentList(rawList);
        if (nodes.length === 0) continue;

        out.push({ className, specName, nodes });
      }
    }
    if (out.length > 0) return out;
  }

  // Fallback parser for when AST/provider extraction changes upstream.
  const specMeta = parseSpecMetaFromLua(luaText);
  const talentsBySpec = parseTalentListsFromLua(luaText);
  const out = [];
  for (const [specId, talents] of talentsBySpec.entries()) {
    const meta = specMeta.get(specId);
    if (!meta) continue;
    const nodes = buildNodesFromTalentList(talents);
    if (nodes.length === 0) continue;
    out.push({
      className: meta.className,
      specName: meta.specName,
      nodes
    });
  }

  if (out.length === 0) console.log("LibTalentInfo fallback parse produced 0 specs");
  return out;
}

function normalizeEntry(rawEntry, fallbackName, fallbackMaxRank) {
  if (!rawEntry || typeof rawEntry !== "object") return null;
  const spell = rawEntry.spell_tooltip?.spell || rawEntry.spell || null;
  const spellId = Number(spell?.id);
  const iconName = String(
    spell?.icon ||
    rawEntry.icon ||
    ""
  ).trim().toLowerCase();
  return {
    id: Number(rawEntry.id) || null,
    name: firstNonEmpty(rawEntry.name, spell?.name, fallbackName) || "Unknown Talent",
    spellId: Number.isFinite(spellId) ? spellId : null,
    iconName: iconName || null,
    iconUrl: iconUrlFromName(iconName),
    maxRank: Math.max(1, Number(rawEntry.max_ranks ?? rawEntry.ranks ?? fallbackMaxRank ?? 1) || 1)
  };
}

function normalizeNode(raw, idx) {
  if (!raw || typeof raw !== "object") return null;
  const id = Number(raw.id ?? raw.node?.id ?? raw.talent?.id ?? idx + 1);
  if (!Number.isFinite(id)) return null;

  const row = Number(raw.display_row ?? raw.row ?? raw.ui_row ?? 0) || 0;
  const col = Number(raw.display_col ?? raw.column ?? raw.ui_col ?? 0) || 0;

  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const entry = rawEntries.length > 0 ? rawEntries[0] : null;
  const spell = raw.spell_tooltip?.spell || entry?.spell_tooltip?.spell || null;
  const spellId = Number(spell?.id);
  const iconName = String(
    spell?.icon ||
    raw.icon ||
    entry?.icon ||
    ""
  ).trim().toLowerCase();
  const iconUrl = iconName
    ? iconUrlFromName(iconName)
    : null;
  const name = firstNonEmpty(
    raw.name,
    raw.spell_tooltip?.spell?.name,
    entry?.spell_tooltip?.spell?.name,
    entry?.name,
    `Talent ${id}`
  );
  const maxRank = Number(raw.ranks ?? raw.max_ranks ?? entry?.max_ranks ?? 1) || 1;
  const treeType = String(raw.tree_type || raw.type || "spec");
  const nodeTypeRaw = String(raw.node_type || raw.type || "").toLowerCase();
  const requiredNodeIds = Array.isArray(raw.required_node_ids)
    ? raw.required_node_ids.map(Number).filter(Number.isFinite)
    : Array.isArray(raw.prerequisite_node_ids)
      ? raw.prerequisite_node_ids.map(Number).filter(Number.isFinite)
      : [];
  const entries = rawEntries
    .map((e) => normalizeEntry(e, name, maxRank))
    .filter(Boolean);
  if (entries.length === 0) {
    entries.push({
      id: null,
      name,
      spellId: Number.isFinite(spellId) ? spellId : null,
      iconName: iconName || null,
      iconUrl,
      maxRank: Math.max(1, maxRank)
    });
  }
  let nodeKind = "passive";
  if (entries.length > 1 || nodeTypeRaw.includes("choice")) nodeKind = "choice";
  else if (nodeTypeRaw.includes("active") || entries[0]?.spellId) nodeKind = "active";

  return {
    id,
    name,
    row: Math.max(0, row),
    col: Math.max(0, col),
    maxRank: Math.max(1, maxRank),
    treeType,
    requiredNodeIds,
    spellId: Number.isFinite(spellId) ? spellId : null,
    iconName: iconName || null,
    iconUrl,
    nodeKind,
    entries
  };
}

function extractNodes(treePayload) {
  const buckets = [];
  if (Array.isArray(treePayload?.class_talent_nodes)) buckets.push(...treePayload.class_talent_nodes);
  if (Array.isArray(treePayload?.spec_talent_nodes)) buckets.push(...treePayload.spec_talent_nodes);
  if (Array.isArray(treePayload?.talent_nodes)) buckets.push(...treePayload.talent_nodes);
  return buckets.map((n, i) => normalizeNode(n, i)).filter(Boolean);
}

async function resolveTalentTreePayload(specPayload, token) {
  const maybeHrefs = [
    specPayload?.talent_tree?.key?.href,
    specPayload?.talent_tree?.href,
    specPayload?.talent_trees?.[0]?.key?.href,
    specPayload?.talent_trees?.[0]?.href
  ].filter(Boolean);

  for (const href of maybeHrefs) {
    try {
      return await fetchApi(href, token);
    } catch {
      // try next href
    }
  }
  return null;
}

async function resolveClassAndSpecNames(treePayload, token) {
  let specName = firstNonEmpty(treePayload?.playable_specialization?.name, treePayload?.specialization?.name);
  let className = firstNonEmpty(
    treePayload?.playable_specialization?.playable_class?.name,
    treePayload?.playable_class?.name,
    treePayload?.character_class?.name
  );

  const specHref =
    treePayload?.playable_specialization?.key?.href ||
    treePayload?.playable_specialization?.href ||
    treePayload?.specialization?.key?.href ||
    treePayload?.specialization?.href;

  if ((!className || !specName) && specHref) {
    const specPayload = await tryFetchApi(specHref, token);
    if (specPayload) {
      if (!specName) specName = toName(specPayload?.name);
      if (!className) {
        className = firstNonEmpty(specPayload?.playable_class?.name, specPayload?.character_class?.name);
      }
    }
  }

  return { className, specName };
}

async function collectFromTalentTreeIndex(token) {
  const out = [];
  const indexPayload = await tryFetchApi(`https://${REGION}.api.blizzard.com/data/wow/talent-tree/index`, token);
  if (!indexPayload) {
    console.log("talent-tree/index unavailable in current namespace");
    return out;
  }

  const refs = Array.isArray(indexPayload?.spec_talent_trees)
    ? indexPayload.spec_talent_trees
    : Array.isArray(indexPayload?.talent_trees)
      ? indexPayload.talent_trees
      : [];

  for (const ref of refs) {
    const href = ref?.key?.href || ref?.href;
    if (!href) continue;

    const treePayload = await tryFetchApi(href, token);
    if (!treePayload) continue;

    const { className, specName } = await resolveClassAndSpecNames(treePayload, token);
    if (!className || !specName) continue;

    out.push({
      className,
      specName,
      nodes: extractNodes(treePayload)
    });
  }

  return out;
}

async function collectFromSpecSearch(token) {
  const out = [];
  const seen = new Set();

  // Search endpoint often works even when some index endpoints do not.
  const searchPayload = await tryFetchApi(
    `https://${REGION}.api.blizzard.com/data/wow/search/playable-specialization?orderby=id&_page=1`,
    token
  );
  const rows = Array.isArray(searchPayload?.results) ? searchPayload.results : [];
  if (rows.length === 0) {
    console.log("search/playable-specialization returned 0 rows or is unavailable");
    return out;
  }

  for (const row of rows) {
    const data = row?.data || {};
    const specId = Number(data?.id);
    const specName = toName(data?.name);
    const className = firstNonEmpty(data?.playable_class?.name, data?.character_class?.name);
    if (!Number.isFinite(specId) || !specName || !className) continue;
    if (seen.has(specId)) continue;
    seen.add(specId);

    // Blizzard sometimes maps talent-tree IDs independently. We try both common patterns.
    const candidates = [
      `https://${REGION}.api.blizzard.com/data/wow/talent-tree/${specId}`,
      `https://${REGION}.api.blizzard.com/data/wow/talent-tree/${specId}/playable-specialization/${specId}`
    ];

    let treePayload = null;
    for (const href of candidates) {
      treePayload = await tryFetchApi(href, token);
      if (treePayload) break;
    }
    if (!treePayload) continue;

    const nodes = extractNodes(treePayload);
    if (nodes.length === 0) continue;

    out.push({ className, specName, nodes });
  }

  return out;
}

async function logEndpointDiagnostics(token) {
  const probes = [
    `https://${REGION}.api.blizzard.com/data/wow/playable-race/index`,
    `https://${REGION}.api.blizzard.com/data/wow/playable-class/index`,
    `https://${REGION}.api.blizzard.com/data/wow/playable-specialization/index`,
    `https://${REGION}.api.blizzard.com/data/wow/talent-tree/index`,
    `https://${REGION}.api.blizzard.com/data/wow/search/playable-specialization?orderby=id&_page=1`
  ];

  for (const p of probes) {
    const r = await fetchApiStatus(p, token);
    console.log(`Probe ${r.status}: ${r.url}`);
  }
}

async function buildTalentTrees() {
  const token = await tryGetAccessToken();
  let specs = [];

  if (token) {
    ACTIVE_NAMESPACE = await resolveWorkingNamespace(token);
    console.log(`Using WoW API namespace: ${ACTIVE_NAMESPACE}`);
    await logEndpointDiagnostics(token);

    const fromTalentTreeIndex = await collectFromTalentTreeIndex(token);
    if (fromTalentTreeIndex.length > 0) {
      console.log(`Collected ${fromTalentTreeIndex.length} specs from talent-tree/index`);
      return {
        generatedAt: new Date().toISOString(),
        region: REGION,
        locale: LOCALE,
        specs: fromTalentTreeIndex
      };
    }

    const fromSpecSearch = await collectFromSpecSearch(token);
    if (fromSpecSearch.length > 0) {
      console.log(`Collected ${fromSpecSearch.length} specs from search/playable-specialization fallback`);
      return {
        generatedAt: new Date().toISOString(),
        region: REGION,
        locale: LOCALE,
        specs: fromSpecSearch
      };
    }

    // Try multiple discovery routes because Blizzard endpoints can vary by region/api version.
    let specRefs = [];

    const specIndex = await tryFetchApi(
      `https://${REGION}.api.blizzard.com/data/wow/playable-specialization/index`,
      token
    );
    if (specIndex) {
      specRefs = Array.isArray(specIndex?.character_specializations)
        ? specIndex.character_specializations
        : Array.isArray(specIndex?.specializations)
          ? specIndex.specializations
          : [];
    }

    if (specRefs.length === 0) {
      const classIndex = await tryFetchApi(
        `https://${REGION}.api.blizzard.com/data/wow/playable-class/index`,
        token
      );
      const classRefs = Array.isArray(classIndex?.classes) ? classIndex.classes : [];

      for (const classRef of classRefs) {
        const classHref = classRef?.key?.href || classRef?.href;
        if (!classHref) continue;
        const classPayload = await tryFetchApi(classHref, token);
        if (!classPayload) continue;
        const refs = Array.isArray(classPayload?.specializations) ? classPayload.specializations : [];
        specRefs.push(...refs);
      }
    }

    if (specRefs.length === 0) {
      // Last resort: enumerate known class IDs directly.
      const knownClassIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      for (const classId of knownClassIds) {
        const classPayload = await tryFetchApi(
          `https://${REGION}.api.blizzard.com/data/wow/playable-class/${classId}`,
          token
        );
        if (!classPayload) continue;
        const refs = Array.isArray(classPayload?.specializations) ? classPayload.specializations : [];
        specRefs.push(...refs);
      }
    }

    const classNameCache = new Map();
    specs = [];

    for (const specRef of specRefs) {
      const specHref = specRef?.key?.href || specRef?.href;
      if (!specHref) continue;

      let specPayload;
      try {
        specPayload = await fetchApi(specHref, token);
      } catch {
        continue;
      }

      const specName = toName(specPayload?.name);
      if (!specName) continue;

      let className = firstNonEmpty(specPayload?.playable_class?.name, specPayload?.character_class?.name);
      const classHref =
        specPayload?.playable_class?.key?.href ||
        specPayload?.playable_class?.href ||
        specPayload?.character_class?.key?.href ||
        specPayload?.character_class?.href;

      if (!className && classHref) {
        if (classNameCache.has(classHref)) {
          className = classNameCache.get(classHref);
        } else {
          try {
            const classPayload = await fetchApi(classHref, token);
            className = toName(classPayload?.name);
            if (className) classNameCache.set(classHref, className);
          } catch {
            // keep empty and skip below
          }
        }
      }

      if (!className) continue;

      const treePayload = await resolveTalentTreePayload(specPayload, token);
      const nodes = treePayload ? extractNodes(treePayload) : [];

      specs.push({
        className,
        specName,
        nodes
      });
    }

    console.log(`Collected ${specs.length} specs from class/specialization route fallback`);
  }

  if (specs.length === 0) {
    const fromLibTalentInfo = await collectFromLibTalentInfoGithub();
    if (fromLibTalentInfo.length > 0) {
      console.log(`Collected ${fromLibTalentInfo.length} specs from LibTalentInfo GitHub fallback`);
      return {
        generatedAt: new Date().toISOString(),
        region: REGION,
        locale: LOCALE,
        specs: fromLibTalentInfo
      };
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    region: REGION,
    locale: LOCALE,
    specs
  };
}

async function main() {
  const payload = await buildTalentTrees();
  const projectRoot = path.resolve(__dirname, "..", "..");
  const outPath = path.join(projectRoot, "talent-trees.json");
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote talent trees: ${outPath} (${payload.specs.length} specs)`);
}

main().catch((err) => {
  console.error("Talent trees update failed:", err);
  process.exit(1);
});
