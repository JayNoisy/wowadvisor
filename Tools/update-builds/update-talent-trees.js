import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import luaparse from "luaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.BLIZZARD_REGION || "us";
const LOCALE = process.env.BLIZZARD_LOCALE || "en_US";
const FAIL_ON_FALLBACK = /^(1|true|yes)$/i.test(String(process.env.FAIL_ON_FALLBACK || ""));
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
    const message = "Blizzard credentials not set.";
    if (FAIL_ON_FALLBACK) throw new Error(`${message} Canonical talent tree fetch is required.`);
    console.log(`${message} Skipping Blizzard API routes.`);
    return null;
  }
  try {
    return await getAccessToken();
  } catch (err) {
    const message = `Blizzard token request failed: ${String(err)}`;
    if (FAIL_ON_FALLBACK) throw new Error(`${message}. Canonical talent tree fetch is required.`);
    console.log(`${message}. Skipping Blizzard API routes.`);
    return null;
  }
}

async function fetchApi(url, token, namespaceOverride = ACTIVE_NAMESPACE) {
  const u = new URL(url);
  if (!u.searchParams.get("namespace") && namespaceOverride) {
    u.searchParams.set("namespace", namespaceOverride);
  }
  if (!u.searchParams.get("locale")) u.searchParams.set("locale", LOCALE);
  const res = await fetch(u.toString(), {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error(`Blizzard API ${res.status}: ${u}`);
  return res.json();
}

async function fetchApiStatus(url, token, namespaceOverride = ACTIVE_NAMESPACE) {
  const u = new URL(url);
  if (!u.searchParams.get("namespace") && namespaceOverride) {
    u.searchParams.set("namespace", namespaceOverride);
  }
  if (!u.searchParams.get("locale")) u.searchParams.set("locale", LOCALE);
  const res = await fetch(u.toString(), {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    bodyText = "";
  }
  const bodyPreview = bodyText ? bodyText.slice(0, 240).replace(/\s+/g, " ").trim() : "";
  return { ok: res.ok, status: res.status, url: u.toString(), bodyPreview };
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

function parseIdFromHref(href) {
  const text = String(href || "");
  if (!text) return null;
  const match = text.match(/\/(\d+)(?:\/)?(?:\?|$)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function normalizeRefNodeId(value) {
  if (Number.isFinite(Number(value))) return Number(value);
  if (!value || typeof value !== "object") return null;
  const candidates = [
    value.id,
    value.node_id,
    value.talent_node_id,
    value.node?.id,
    value.talent_node?.id,
    value.key?.id
  ];
  for (const candidate of candidates) {
    const n = Number(candidate);
    if (Number.isFinite(n)) return n;
  }
  const hrefCandidates = [value.href, value.key?.href, value.node?.key?.href];
  for (const href of hrefCandidates) {
    const id = parseIdFromHref(href);
    if (Number.isFinite(id)) return id;
  }
  return null;
}

function normalizeRefNodeList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((v) => normalizeRefNodeId(v))
    .filter((v) => Number.isFinite(v));
}

function normalizeNode(raw, idx, forcedTreeType = null, orderIndexById = null) {
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
  const treeType = String(forcedTreeType || raw.tree_type || raw.type || "spec");
  const nodeTypeRaw = String(raw.node_type || raw.type || "").toLowerCase();
  const requiredNodeIds = Array.isArray(raw.required_node_ids)
    ? raw.required_node_ids.map(Number).filter(Number.isFinite)
    : Array.isArray(raw.prerequisite_node_ids)
      ? raw.prerequisite_node_ids.map(Number).filter(Number.isFinite)
      : [];
  const lockedByNodeIds = normalizeRefNodeList(raw.locked_by);
  const unlocksNodeIds = normalizeRefNodeList(raw.unlocks);
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
    lockedByNodeIds,
    unlocksNodeIds,
    orderIndex: orderIndexById instanceof Map && orderIndexById.has(id) ? orderIndexById.get(id) : null,
    spellId: Number.isFinite(spellId) ? spellId : null,
    iconName: iconName || null,
    iconUrl,
    nodeKind,
    entries
  };
}

function extractNodes(treePayload, forcedTreeType = null, orderIndexById = null) {
  const buckets = [];
  if (Array.isArray(treePayload?.class_talent_nodes)) buckets.push(...treePayload.class_talent_nodes);
  if (Array.isArray(treePayload?.spec_talent_nodes)) buckets.push(...treePayload.spec_talent_nodes);
  if (Array.isArray(treePayload?.talent_nodes)) buckets.push(...treePayload.talent_nodes);
  return buckets.map((n, i) => normalizeNode(n, i, forcedTreeType, orderIndexById)).filter(Boolean);
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

function extractNodeOrder(treePayload) {
  const rawNodes = Array.isArray(treePayload?.talent_nodes) ? treePayload.talent_nodes : [];
  const seen = new Set();
  const order = [];
  for (const raw of rawNodes) {
    const id = normalizeRefNodeId(raw);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  return order;
}

function buildPane(key, label, nodes) {
  const list = Array.isArray(nodes) ? nodes : [];
  const maxRow = Math.max(0, ...list.map((n) => Number(n?.row ?? 0)));
  const maxCol = Math.max(0, ...list.map((n) => Number(n?.col ?? 0)));
  const edgeMap = new Map();
  for (const node of list) {
    const toNodeId = Number(node?.id);
    if (!Number.isFinite(toNodeId)) continue;
    const req = Array.isArray(node?.requiredNodeIds) ? node.requiredNodeIds : [];
    const locked = Array.isArray(node?.lockedByNodeIds) ? node.lockedByNodeIds : [];
    const unlocks = Array.isArray(node?.unlocksNodeIds) ? node.unlocksNodeIds : [];
    for (const fromNodeId of [...req, ...locked]) {
      const from = Number(fromNodeId);
      if (!Number.isFinite(from)) continue;
      edgeMap.set(`${from}->${toNodeId}`, { fromNodeId: from, toNodeId });
    }
    for (const toRef of unlocks) {
      const to = Number(toRef);
      if (!Number.isFinite(to)) continue;
      edgeMap.set(`${toNodeId}->${to}`, { fromNodeId: toNodeId, toNodeId: to });
    }
  }

  return {
    key,
    label,
    grid: { rows: maxRow + 1, cols: maxCol + 1 },
    nodes: list,
    edges: Array.from(edgeMap.values())
  };
}

function dedupeNodesById(nodes) {
  const out = [];
  const seen = new Set();
  for (const node of Array.isArray(nodes) ? nodes : []) {
    const id = Number(node?.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(node);
  }
  return out;
}

function buildCanonicalSpecRecord({ className, specName, specId, treeId, treePayload, layoutPayload }) {
  const nodeOrder = extractNodeOrder(treePayload);
  const orderIndexById = new Map(nodeOrder.map((id, idx) => [id, idx]));

  const classNodes = Array.isArray(layoutPayload?.class_talent_nodes)
    ? layoutPayload.class_talent_nodes.map((node, idx) => normalizeNode(node, idx, "class", orderIndexById)).filter(Boolean)
    : [];
  const specNodes = Array.isArray(layoutPayload?.spec_talent_nodes)
    ? layoutPayload.spec_talent_nodes.map((node, idx) => normalizeNode(node, idx, "spec", orderIndexById)).filter(Boolean)
    : [];

  const heroNodes = [];
  const heroTrees = Array.isArray(layoutPayload?.hero_talent_trees) ? layoutPayload.hero_talent_trees : [];
  for (const heroTree of heroTrees) {
    const heroList = Array.isArray(heroTree?.hero_talent_nodes)
      ? heroTree.hero_talent_nodes
      : Array.isArray(heroTree?.talent_nodes)
        ? heroTree.talent_nodes
        : Array.isArray(heroTree?.nodes)
          ? heroTree.nodes
          : [];
    heroNodes.push(
      ...heroList.map((node, idx) => normalizeNode(node, idx, "hero", orderIndexById)).filter(Boolean)
    );
  }
  if (heroNodes.length === 0 && Array.isArray(layoutPayload?.hero_talent_nodes)) {
    heroNodes.push(
      ...layoutPayload.hero_talent_nodes.map((node, idx) => normalizeNode(node, idx, "hero", orderIndexById)).filter(Boolean)
    );
  }

  let mergedNodes = dedupeNodesById([...classNodes, ...heroNodes, ...specNodes]);
  if (mergedNodes.length === 0) {
    mergedNodes = extractNodes(layoutPayload || treePayload, null, orderIndexById);
  }
  if (mergedNodes.length === 0) {
    mergedNodes = extractNodes(treePayload, null, orderIndexById);
  }

  mergedNodes.sort((a, b) => {
    const oa = Number(a?.orderIndex);
    const ob = Number(b?.orderIndex);
    if (Number.isFinite(oa) && Number.isFinite(ob) && oa !== ob) return oa - ob;
    if (a.treeType !== b.treeType) return String(a.treeType).localeCompare(String(b.treeType));
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    return a.id - b.id;
  });

  const classPane = buildPane("class", "Class Tree", classNodes);
  const heroPane = buildPane("hero", "Hero Tree", heroNodes);
  const specPane = buildPane("spec", "Spec Tree", specNodes);

  return {
    className,
    specName,
    specId: Number.isFinite(Number(specId)) ? Number(specId) : null,
    treeId: Number.isFinite(Number(treeId)) ? Number(treeId) : null,
    nodeOrder,
    nodes: mergedNodes,
    trees: {
      class: classPane,
      hero: heroPane,
      spec: specPane
    },
    restrictionLines: Array.isArray(layoutPayload?.restriction_lines) ? layoutPayload.restriction_lines : [],
    summary: {
      totalNodes: mergedNodes.length,
      classNodes: classNodes.length,
      heroNodes: heroNodes.length,
      specNodes: specNodes.length,
      edgeCount: classPane.edges.length + heroPane.edges.length + specPane.edges.length
    }
  };
}

function enrichMinimalSpecShape(spec) {
  const nodes = Array.isArray(spec?.nodes) ? spec.nodes : [];
  const classNodes = [];
  const heroNodes = [];
  const specNodes = [];
  const otherNodes = [];
  for (const node of nodes) {
    const type = String(node?.treeType || "").toLowerCase();
    if (type.includes("class")) classNodes.push(node);
    else if (type.includes("hero")) heroNodes.push(node);
    else if (type.includes("spec")) specNodes.push(node);
    else otherNodes.push(node);
  }
  if (classNodes.length === 0 && heroNodes.length === 0 && specNodes.length === 0 && otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  } else if (otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  }

  const classPane = buildPane("class", "Class Tree", classNodes);
  const heroPane = buildPane("hero", "Hero Tree", heroNodes);
  const specPane = buildPane("spec", "Spec Tree", specNodes);

  return {
    className: spec?.className || "",
    specName: spec?.specName || "",
    specId: Number.isFinite(Number(spec?.specId)) ? Number(spec.specId) : null,
    treeId: Number.isFinite(Number(spec?.treeId)) ? Number(spec.treeId) : null,
    nodeOrder: Array.isArray(spec?.nodeOrder) ? spec.nodeOrder : [],
    nodes,
    trees: {
      class: classPane,
      hero: heroPane,
      spec: specPane
    },
    summary: {
      totalNodes: nodes.length,
      classNodes: classPane.nodes.length,
      heroNodes: heroPane.nodes.length,
      specNodes: specPane.nodes.length,
      edgeCount: classPane.edges.length + heroPane.edges.length + specPane.edges.length
    }
  };
}

function resolveTreeRef(specPayload) {
  const href =
    specPayload?.spec_talent_tree?.key?.href ||
    specPayload?.spec_talent_tree?.href ||
    specPayload?.talent_tree?.key?.href ||
    specPayload?.talent_tree?.href ||
    specPayload?.talent_trees?.[0]?.key?.href ||
    specPayload?.talent_trees?.[0]?.href ||
    null;
  const idCandidates = [
    Number(specPayload?.spec_talent_tree?.id),
    Number(specPayload?.talent_tree?.id),
    Number(specPayload?.talent_trees?.[0]?.id),
    Number(parseIdFromHref(href))
  ];
  const treeId = idCandidates.find((id) => Number.isFinite(id)) ?? null;
  return { treeId, href };
}

async function fetchTreeAndLayoutForSpec(specPayload, token) {
  const specId = Number(specPayload?.id);
  if (!Number.isFinite(specId)) return null;

  const { treeId, href } = resolveTreeRef(specPayload);
  let treePayload = null;
  if (href) treePayload = await tryFetchApi(href, token);
  if (!treePayload && Number.isFinite(treeId)) {
    treePayload = await tryFetchApi(`https://${REGION}.api.blizzard.com/data/wow/talent-tree/${treeId}`, token);
  }
  if (!treePayload) return null;

  const resolvedTreeId = Number(treePayload?.id);
  const finalTreeId = Number.isFinite(resolvedTreeId) ? resolvedTreeId : treeId;
  let layoutPayload = null;
  if (Number.isFinite(finalTreeId)) {
    layoutPayload = await tryFetchApi(
      `https://${REGION}.api.blizzard.com/data/wow/talent-tree/${finalTreeId}/playable-specialization/${specId}`,
      token
    );
  }
  if (!layoutPayload) layoutPayload = treePayload;

  return { specId, treeId: finalTreeId, treePayload, layoutPayload };
}

async function listPlayableSpecializationRefs(token) {
  const out = [];
  const seen = new Set();
  const addRef = (ref) => {
    if (!ref) return;
    const href = ref?.key?.href || ref?.href || "";
    const id = Number(ref?.id ?? parseIdFromHref(href));
    const key = Number.isFinite(id) ? `id:${id}` : (href ? `href:${href}` : "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(ref);
  };

  const specIndex = await tryFetchApi(
    `https://${REGION}.api.blizzard.com/data/wow/playable-specialization/index`,
    token
  );
  const fromIndex = Array.isArray(specIndex?.character_specializations)
    ? specIndex.character_specializations
    : Array.isArray(specIndex?.specializations)
      ? specIndex.specializations
      : [];
  fromIndex.forEach(addRef);
  if (out.length > 0) return out;

  const classIndex = await tryFetchApi(`https://${REGION}.api.blizzard.com/data/wow/playable-class/index`, token);
  const classRefs = Array.isArray(classIndex?.classes) ? classIndex.classes : [];
  for (const classRef of classRefs) {
    const classHref = classRef?.key?.href || classRef?.href;
    if (!classHref) continue;
    const classPayload = await tryFetchApi(classHref, token);
    const refs = Array.isArray(classPayload?.specializations) ? classPayload.specializations : [];
    refs.forEach(addRef);
  }
  if (out.length > 0) return out;

  const knownClassIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  for (const classId of knownClassIds) {
    const classPayload = await tryFetchApi(
      `https://${REGION}.api.blizzard.com/data/wow/playable-class/${classId}`,
      token
    );
    const refs = Array.isArray(classPayload?.specializations) ? classPayload.specializations : [];
    refs.forEach(addRef);
  }

  return out;
}

async function collectCanonicalTalentTrees(token) {
  const specRefs = await listPlayableSpecializationRefs(token);
  if (specRefs.length === 0) return [];

  const classNameCache = new Map();
  const bySpecKey = new Map();
  for (const ref of specRefs) {
    const specHref = ref?.key?.href || ref?.href;
    const fallbackSpecId = Number(ref?.id ?? parseIdFromHref(specHref));
    let specPayload = null;
    if (specHref) {
      specPayload = await tryFetchApi(specHref, token);
    }
    if (!specPayload && Number.isFinite(fallbackSpecId)) {
      specPayload = await tryFetchApi(
        `https://${REGION}.api.blizzard.com/data/wow/playable-specialization/${fallbackSpecId}`,
        token
      );
    }
    if (!specPayload) continue;

    const specName = toName(specPayload?.name);
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
        const classPayload = await tryFetchApi(classHref, token);
        const resolved = toName(classPayload?.name);
        if (resolved) {
          className = resolved;
          classNameCache.set(classHref, resolved);
        }
      }
    }
    if (!className || !specName) continue;

    const treeBundle = await fetchTreeAndLayoutForSpec(specPayload, token);
    if (!treeBundle) continue;

    const record = buildCanonicalSpecRecord({
      className,
      specName,
      specId: treeBundle.specId,
      treeId: treeBundle.treeId,
      treePayload: treeBundle.treePayload,
      layoutPayload: treeBundle.layoutPayload
    });
    const specKey = `${className.toLowerCase()}::${specName.toLowerCase()}`;
    const existing = bySpecKey.get(specKey);
    const incomingCount = Number(record?.summary?.totalNodes) || 0;
    const existingCount = Number(existing?.summary?.totalNodes) || 0;
    if (!existing || incomingCount > existingCount) {
      bySpecKey.set(specKey, record);
    }
  }

  return Array.from(bySpecKey.values()).sort((a, b) => {
    const c = String(a.className || "").localeCompare(String(b.className || ""));
    if (c !== 0) return c;
    return String(a.specName || "").localeCompare(String(b.specName || ""));
  });
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
    const suffix = r.bodyPreview ? ` | ${r.bodyPreview}` : "";
    console.log(`Probe ${r.status}: ${r.url}${suffix}`);
  }
}

async function buildTalentTrees() {
  const token = await tryGetAccessToken();
  let specs = [];
  let source = "none";

  if (token) {
    ACTIVE_NAMESPACE = await resolveWorkingNamespace(token);
    console.log(`Using WoW API namespace: ${ACTIVE_NAMESPACE}`);
    await logEndpointDiagnostics(token);

    const canonicalSpecs = await collectCanonicalTalentTrees(token);
    if (canonicalSpecs.length > 0) {
      specs = canonicalSpecs;
      source = "blizzard-api-canonical";
      console.log(`Collected ${canonicalSpecs.length} specs from canonical specialization -> tree route`);
    } else {
      console.log("Canonical specialization -> tree route returned 0 specs");
    }
  }

  if (specs.length === 0) {
    const fromLibTalentInfo = await collectFromLibTalentInfoGithub();
    if (fromLibTalentInfo.length > 0) {
      console.log(`Collected ${fromLibTalentInfo.length} specs from LibTalentInfo GitHub fallback`);
      specs = fromLibTalentInfo.map((spec) => enrichMinimalSpecShape(spec));
      source = "libtalentinfo-fallback";
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    region: REGION,
    locale: LOCALE,
    namespace: ACTIVE_NAMESPACE,
    source,
    specs
  };
}

async function main() {
  const payload = await buildTalentTrees();
  const specs = Array.isArray(payload?.specs) ? payload.specs : [];
  const withNodeOrder = specs.filter((spec) => Array.isArray(spec?.nodeOrder) && spec.nodeOrder.length > 0).length;
  if (FAIL_ON_FALLBACK) {
    if (payload?.source !== "blizzard-api-canonical") {
      throw new Error(`Expected source=blizzard-api-canonical but got ${String(payload?.source || "unknown")}`);
    }
    if (withNodeOrder === 0) {
      throw new Error("Expected canonical nodeOrder data, but none was generated.");
    }
  }

  const projectRoot = path.resolve(__dirname, "..", "..");
  const outPath = path.join(projectRoot, "talent-trees.json");
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote talent trees: ${outPath} (${specs.length} specs, source=${payload.source}, withNodeOrder=${withNodeOrder})`);
}

main().catch((err) => {
  console.error("Talent trees update failed:", err);
  process.exit(1);
});
