const fs = require("node:fs/promises");
const path = require("node:path");

const REGION_DEFAULT = "us";
const LOCALE_DEFAULT = "en_US";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
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

async function fetchOAuthToken(region) {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET");
  }

  const tokenUrl = `https://${region}.battle.net/oauth/token`;
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!res.ok) throw new Error(`OAuth failed with status ${res.status}`);
  const data = await res.json();
  if (!data?.access_token) throw new Error("OAuth response missing access_token");
  return data.access_token;
}

async function fetchApi(url, token, locale, namespaceOverride) {
  const u = new URL(url);
  if (!u.searchParams.get("namespace") && namespaceOverride) {
    u.searchParams.set("namespace", namespaceOverride);
  }
  if (!u.searchParams.get("locale")) u.searchParams.set("locale", locale);
  if (!u.searchParams.get("access_token")) u.searchParams.set("access_token", token);

  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`Blizzard API ${res.status}: ${u.toString()}`);
  return res.json();
}

async function tryFetchApi(url, token, locale, namespaceOverride) {
  try {
    return await fetchApi(url, token, locale, namespaceOverride);
  } catch {
    return null;
  }
}

async function resolveNamespace(region, token, locale) {
  const probes = [
    `https://${region}.api.blizzard.com/data/wow/playable-race/index`,
    `https://${region}.api.blizzard.com/data/wow/item-class/index`,
    `https://${region}.api.blizzard.com/data/wow/playable-class/index`
  ];
  const candidates = [`static-${region}`, `dynamic-${region}`];

  for (const ns of candidates) {
    for (const url of probes) {
      const payload = await tryFetchApi(url, token, locale, ns);
      if (!payload) continue;
      const hinted = namespaceFromSelf(payload);
      return hinted || ns;
    }
  }

  return `static-${region}`;
}

async function resolveClassAndSpecNames(treePayload, token, locale, namespace) {
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
    const specPayload = await tryFetchApi(specHref, token, locale, namespace);
    if (specPayload) {
      if (!specName) specName = toName(specPayload?.name);
      if (!className) {
        className = firstNonEmpty(specPayload?.playable_class?.name, specPayload?.character_class?.name);
      }
    }
  }

  return { className, specName };
}

function upsertByRichness(target, incoming) {
  for (const spec of incoming) {
    const classKey = toName(spec?.className).toLowerCase();
    const specKey = toName(spec?.specName).toLowerCase();
    if (!classKey || !specKey) continue;
    const key = `${classKey}::${specKey}`;
    const existing = target.get(key);
    if (!existing || (Array.isArray(spec?.nodes) ? spec.nodes.length : 0) > (Array.isArray(existing?.nodes) ? existing.nodes.length : 0)) {
      target.set(key, spec);
    }
  }
}

function buildPane(nodes, key, label) {
  const list = Array.isArray(nodes) ? nodes : [];
  const edges = [];
  const maxRow = Math.max(0, ...list.map((n) => Number(n?.row ?? 0)));
  const maxCol = Math.max(0, ...list.map((n) => Number(n?.col ?? 0)));
  for (const node of list) {
    const toNodeId = Number(node?.id);
    const req = Array.isArray(node?.requiredNodeIds) ? node.requiredNodeIds : [];
    for (const fromNodeId of req) {
      if (!Number.isFinite(toNodeId) || !Number.isFinite(Number(fromNodeId))) continue;
      edges.push({ fromNodeId: Number(fromNodeId), toNodeId });
    }
  }
  return {
    key,
    label,
    grid: { rows: maxRow + 1, cols: maxCol + 1 },
    nodes: list,
    edges
  };
}

function enrichSpecShape(spec) {
  const nodes = Array.isArray(spec?.nodes) ? spec.nodes : [];
  const classNodes = [];
  const specNodes = [];
  const otherNodes = [];
  for (const node of nodes) {
    const type = String(node?.treeType || "").toLowerCase();
    if (type.includes("class")) classNodes.push(node);
    else if (type.includes("spec")) specNodes.push(node);
    else otherNodes.push(node);
  }
  if (classNodes.length === 0 && specNodes.length === 0 && otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  } else if (otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  }
  const classTree = buildPane(classNodes, "class", "Class Tree");
  const specTree = buildPane(specNodes, "spec", "Spec Tree");
  return {
    className: spec?.className || "",
    specName: spec?.specName || "",
    nodes,
    trees: {
      class: classTree,
      spec: specTree
    },
    summary: {
      totalNodes: nodes.length,
      classNodes: classTree.nodes.length,
      specNodes: specTree.nodes.length,
      edgeCount: classTree.edges.length + specTree.edges.length
    }
  };
}

async function resolveTalentTreePayload(specPayload, token, region, locale, namespace) {
  const maybeHrefs = [
    specPayload?.talent_tree?.key?.href,
    specPayload?.talent_tree?.href,
    specPayload?.talent_trees?.[0]?.key?.href,
    specPayload?.talent_trees?.[0]?.href
  ].filter(Boolean);

  for (const href of maybeHrefs) {
    const payload = await tryFetchApi(href, token, locale, namespace);
    if (payload) return payload;
  }

  const specId = Number(specPayload?.id);
  if (!Number.isFinite(specId)) return null;
  const candidates = [
    `https://${region}.api.blizzard.com/data/wow/talent-tree/${specId}`,
    `https://${region}.api.blizzard.com/data/wow/talent-tree/${specId}/playable-specialization/${specId}`
  ];
  for (const href of candidates) {
    const payload = await tryFetchApi(href, token, locale, namespace);
    if (payload) return payload;
  }

  return null;
}

async function collectFromTalentTreeIndex(region, token, locale, namespace) {
  const indexPayload = await tryFetchApi(
    `https://${region}.api.blizzard.com/data/wow/talent-tree/index`,
    token,
    locale,
    namespace
  );
  if (!indexPayload) return [];

  const refs = Array.isArray(indexPayload?.spec_talent_trees)
    ? indexPayload.spec_talent_trees
    : Array.isArray(indexPayload?.talent_trees)
      ? indexPayload.talent_trees
      : [];

  const specs = [];
  for (const ref of refs) {
    const href = ref?.key?.href || ref?.href;
    if (!href) continue;

    const treePayload = await tryFetchApi(href, token, locale, namespace);
    if (!treePayload) continue;

    const { className, specName } = await resolveClassAndSpecNames(treePayload, token, locale, namespace);
    if (!className || !specName) continue;

    specs.push({ className, specName, nodes: extractNodes(treePayload) });
  }

  return specs;
}

async function collectFromSpecSearch(region, token, locale, namespace) {
  const searchPayload = await tryFetchApi(
    `https://${region}.api.blizzard.com/data/wow/search/playable-specialization?orderby=id&_page=1`,
    token,
    locale,
    namespace
  );
  const rows = Array.isArray(searchPayload?.results) ? searchPayload.results : [];
  if (rows.length === 0) return [];

  const out = [];
  for (const row of rows) {
    const data = row?.data || {};
    const specId = Number(data?.id);
    const className = firstNonEmpty(data?.playable_class?.name, data?.character_class?.name);
    const specName = toName(data?.name);
    if (!Number.isFinite(specId) || !className || !specName) continue;

    const specPayload = await tryFetchApi(
      `https://${region}.api.blizzard.com/data/wow/playable-specialization/${specId}`,
      token,
      locale,
      namespace
    );
    if (!specPayload) continue;

    const treePayload = await resolveTalentTreePayload(specPayload, token, region, locale, namespace);
    if (!treePayload) continue;

    out.push({ className, specName, nodes: extractNodes(treePayload) });
  }

  return out;
}

async function collectFromPlayableClassRoute(region, token, locale, namespace) {
  const classIndex = await tryFetchApi(
    `https://${region}.api.blizzard.com/data/wow/playable-class/index`,
    token,
    locale,
    namespace
  );
  const classRefs = Array.isArray(classIndex?.classes) ? classIndex.classes : [];
  if (classRefs.length === 0) return [];

  const out = [];
  for (const classRef of classRefs) {
    const classHref = classRef?.key?.href || classRef?.href;
    if (!classHref) continue;
    const classPayload = await tryFetchApi(classHref, token, locale, namespace);
    const className = toName(classPayload?.name);
    const specRefs = Array.isArray(classPayload?.specializations) ? classPayload.specializations : [];

    for (const specRef of specRefs) {
      const specHref = specRef?.key?.href || specRef?.href;
      if (!specHref) continue;
      const specPayload = await tryFetchApi(specHref, token, locale, namespace);
      if (!specPayload) continue;

      const specName = toName(specPayload?.name);
      const resolvedClassName = className || firstNonEmpty(specPayload?.playable_class?.name, specPayload?.character_class?.name);
      if (!resolvedClassName || !specName) continue;

      const treePayload = await resolveTalentTreePayload(specPayload, token, region, locale, namespace);
      if (!treePayload) continue;

      out.push({ className: resolvedClassName, specName, nodes: extractNodes(treePayload) });
    }
  }

  return out;
}

async function collectTalentTrees(region, token, locale, namespace) {
  const bySpecKey = new Map();

  const fromIndex = await collectFromTalentTreeIndex(region, token, locale, namespace);
  upsertByRichness(bySpecKey, fromIndex);

  const fromSearch = await collectFromSpecSearch(region, token, locale, namespace);
  upsertByRichness(bySpecKey, fromSearch);

  const fromClassRoute = await collectFromPlayableClassRoute(region, token, locale, namespace);
  upsertByRichness(bySpecKey, fromClassRoute);

  return Array.from(bySpecKey.values()).map(enrichSpecShape);
}

async function loadLocalTalentTreeFallback() {
  try {
    const filePath = path.join(process.cwd(), "talent-trees.json");
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    const specs = Array.isArray(payload?.specs) ? payload.specs : [];
    return specs.map(enrichSpecShape);
  } catch {
    return [];
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const region = String(req.query.region || REGION_DEFAULT).toLowerCase();
  const locale = String(req.query.locale || LOCALE_DEFAULT);

  try {
    const token = await fetchOAuthToken(region);
    const namespace = await resolveNamespace(region, token, locale);
    let specs = await collectTalentTrees(region, token, locale, namespace);
    let source = "blizzard-api";

    if (specs.length === 0) {
      const fallbackSpecs = await loadLocalTalentTreeFallback();
      if (fallbackSpecs.length > 0) {
        specs = fallbackSpecs;
        source = "local-fallback";
      }
    }

    res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return json(res, 200, {
      generatedAt: new Date().toISOString(),
      source,
      region,
      locale,
      namespace,
      specs
    });
  } catch (error) {
    return json(res, 500, {
      error: "Failed to fetch Blizzard talent trees",
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
