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
  const res = await fetch(u.toString(), {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
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
  const edgeMap = new Map();
  const maxRow = Math.max(0, ...list.map((n) => Number(n?.row ?? 0)));
  const maxCol = Math.max(0, ...list.map((n) => Number(n?.col ?? 0)));
  for (const node of list) {
    const toNodeId = Number(node?.id);
    if (!Number.isFinite(toNodeId)) continue;
    const req = Array.isArray(node?.requiredNodeIds) ? node.requiredNodeIds : [];
    const lockedBy = Array.isArray(node?.lockedByNodeIds) ? node.lockedByNodeIds : [];
    const unlocks = Array.isArray(node?.unlocksNodeIds) ? node.unlocksNodeIds : [];
    for (const fromNodeId of [...req, ...lockedBy]) {
      const from = Number(fromNodeId);
      if (!Number.isFinite(from)) continue;
      edgeMap.set(`${from}->${toNodeId}`, { fromNodeId: from, toNodeId });
    }
    for (const unlockId of unlocks) {
      const to = Number(unlockId);
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

function enrichSpecShape(spec) {
  const nodes = Array.isArray(spec?.nodes) ? spec.nodes : [];
  const classNodes = [];
  const specNodes = [];
  const heroNodes = [];
  const otherNodes = [];
  for (const node of nodes) {
    const type = String(node?.treeType || "").toLowerCase();
    if (type.includes("class")) classNodes.push(node);
    else if (type.includes("hero")) heroNodes.push(node);
    else if (type.includes("spec")) specNodes.push(node);
    else otherNodes.push(node);
  }
  if (classNodes.length === 0 && specNodes.length === 0 && heroNodes.length === 0 && otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  } else if (otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  }
  const classTree = buildPane(classNodes, "class", "Class Tree");
  const heroTree = buildPane(heroNodes, "hero", "Hero Tree");
  const specTree = buildPane(specNodes, "spec", "Spec Tree");
  return {
    className: spec?.className || "",
    specName: spec?.specName || "",
    specId: Number.isFinite(Number(spec?.specId)) ? Number(spec.specId) : null,
    treeId: Number.isFinite(Number(spec?.treeId)) ? Number(spec.treeId) : null,
    nodeOrder: Array.isArray(spec?.nodeOrder) ? spec.nodeOrder : [],
    nodes,
    trees: {
      class: classTree,
      hero: heroTree,
      spec: specTree
    },
    summary: {
      totalNodes: nodes.length,
      classNodes: classTree.nodes.length,
      heroNodes: heroTree.nodes.length,
      specNodes: specTree.nodes.length,
      edgeCount: classTree.edges.length + heroTree.edges.length + specTree.edges.length
    }
  };
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
    heroNodes.push(...heroList.map((node, idx) => normalizeNode(node, idx, "hero", orderIndexById)).filter(Boolean));
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

  return enrichSpecShape({
    className,
    specName,
    specId,
    treeId,
    nodeOrder,
    nodes: mergedNodes
  });
}

async function fetchTreeAndLayoutForSpec(specPayload, region, token, locale, namespace) {
  const specId = Number(specPayload?.id);
  if (!Number.isFinite(specId)) return null;
  const { treeId, href } = resolveTreeRef(specPayload);
  let treePayload = null;
  if (href) treePayload = await tryFetchApi(href, token, locale, namespace);
  if (!treePayload && Number.isFinite(treeId)) {
    treePayload = await tryFetchApi(
      `https://${region}.api.blizzard.com/data/wow/talent-tree/${treeId}`,
      token,
      locale,
      namespace
    );
  }
  if (!treePayload) return null;

  const resolvedTreeId = Number(treePayload?.id);
  const finalTreeId = Number.isFinite(resolvedTreeId) ? resolvedTreeId : treeId;
  let layoutPayload = null;
  if (Number.isFinite(finalTreeId)) {
    layoutPayload = await tryFetchApi(
      `https://${region}.api.blizzard.com/data/wow/talent-tree/${finalTreeId}/playable-specialization/${specId}`,
      token,
      locale,
      namespace
    );
  }
  if (!layoutPayload) layoutPayload = treePayload;
  return {
    specId,
    treeId: finalTreeId,
    treePayload,
    layoutPayload
  };
}

async function listPlayableSpecializationRefs(region, token, locale, namespace) {
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
    `https://${region}.api.blizzard.com/data/wow/playable-specialization/index`,
    token,
    locale,
    namespace
  );
  const fromIndex = Array.isArray(specIndex?.character_specializations)
    ? specIndex.character_specializations
    : Array.isArray(specIndex?.specializations)
      ? specIndex.specializations
      : [];
  fromIndex.forEach(addRef);
  if (out.length > 0) return out;

  const classIndex = await tryFetchApi(
    `https://${region}.api.blizzard.com/data/wow/playable-class/index`,
    token,
    locale,
    namespace
  );
  const classRefs = Array.isArray(classIndex?.classes) ? classIndex.classes : [];
  for (const classRef of classRefs) {
    const classHref = classRef?.key?.href || classRef?.href;
    if (!classHref) continue;
    const classPayload = await tryFetchApi(classHref, token, locale, namespace);
    const refs = Array.isArray(classPayload?.specializations) ? classPayload.specializations : [];
    refs.forEach(addRef);
  }
  return out;
}

async function collectCanonicalSpecsForNamespace(region, token, locale, namespace) {
  const specRefs = await listPlayableSpecializationRefs(region, token, locale, namespace);
  if (specRefs.length === 0) return [];

  const classNameCache = new Map();
  const bySpecKey = new Map();
  for (const ref of specRefs) {
    const specHref = ref?.key?.href || ref?.href;
    const fallbackSpecId = Number(ref?.id ?? parseIdFromHref(specHref));
    let specPayload = null;
    if (specHref) specPayload = await tryFetchApi(specHref, token, locale, namespace);
    if (!specPayload && Number.isFinite(fallbackSpecId)) {
      specPayload = await tryFetchApi(
        `https://${region}.api.blizzard.com/data/wow/playable-specialization/${fallbackSpecId}`,
        token,
        locale,
        namespace
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
        const classPayload = await tryFetchApi(classHref, token, locale, namespace);
        const resolved = toName(classPayload?.name);
        if (resolved) {
          className = resolved;
          classNameCache.set(classHref, resolved);
        }
      }
    }
    if (!className || !specName) continue;

    const bundle = await fetchTreeAndLayoutForSpec(specPayload, region, token, locale, namespace);
    if (!bundle) continue;

    const record = buildCanonicalSpecRecord({
      className,
      specName,
      specId: bundle.specId,
      treeId: bundle.treeId,
      treePayload: bundle.treePayload,
      layoutPayload: bundle.layoutPayload
    });
    const key = `${className.toLowerCase()}::${specName.toLowerCase()}`;
    const existing = bySpecKey.get(key);
    const incomingCount = Number(record?.summary?.totalNodes) || 0;
    const existingCount = Number(existing?.summary?.totalNodes) || 0;
    if (!existing || incomingCount > existingCount) bySpecKey.set(key, record);
  }

  return Array.from(bySpecKey.values()).sort((a, b) => {
    const c = String(a.className || "").localeCompare(String(b.className || ""));
    if (c !== 0) return c;
    return String(a.specName || "").localeCompare(String(b.specName || ""));
  });
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

function mergeEnrichedSpecsByRichness(target, incoming) {
  for (const spec of incoming) {
    const classKey = toName(spec?.className).toLowerCase();
    const specKey = toName(spec?.specName).toLowerCase();
    if (!classKey || !specKey) continue;
    const key = `${classKey}::${specKey}`;
    const existing = target.get(key);
    const incomingCount = Number(spec?.summary?.totalNodes) || (Array.isArray(spec?.nodes) ? spec.nodes.length : 0);
    const existingCount = Number(existing?.summary?.totalNodes) || (Array.isArray(existing?.nodes) ? existing.nodes.length : 0);
    if (!existing || incomingCount > existingCount) target.set(key, spec);
  }
}

async function collectTalentTreesForNamespace(region, token, locale, namespace) {
  const canonical = await collectCanonicalSpecsForNamespace(region, token, locale, namespace);
  if (canonical.length > 0) return canonical;

  const bySpecKey = new Map();

  const fromIndex = await collectFromTalentTreeIndex(region, token, locale, namespace);
  upsertByRichness(bySpecKey, fromIndex);

  const fromSearch = await collectFromSpecSearch(region, token, locale, namespace);
  upsertByRichness(bySpecKey, fromSearch);

  const fromClassRoute = await collectFromPlayableClassRoute(region, token, locale, namespace);
  upsertByRichness(bySpecKey, fromClassRoute);

  return Array.from(bySpecKey.values()).map(enrichSpecShape);
}

async function collectTalentTrees(region, token, locale, resolvedNamespace) {
  const namespaces = Array.from(new Set([
    resolvedNamespace,
    `static-${region}`,
    `dynamic-${region}`
  ].filter(Boolean)));

  const merged = new Map();
  let namespaceUsed = resolvedNamespace;

  for (const ns of namespaces) {
    const specs = await collectTalentTreesForNamespace(region, token, locale, ns);
    if (specs.length > 0) namespaceUsed = ns;
    mergeEnrichedSpecsByRichness(merged, specs);
  }

  return {
    specs: Array.from(merged.values()),
    namespaceUsed
  };
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
    const collected = await collectTalentTrees(region, token, locale, namespace);
    let specs = collected.specs;
    let namespaceUsed = collected.namespaceUsed || namespace;
    let source = "blizzard-api";

    if (specs.length === 0) {
      const fallbackSpecs = await loadLocalTalentTreeFallback();
      if (fallbackSpecs.length > 0) {
        specs = fallbackSpecs;
        namespaceUsed = namespace;
        source = "local-fallback";
      }
    }

    res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return json(res, 200, {
      generatedAt: new Date().toISOString(),
      source,
      region,
      locale,
      namespace: namespaceUsed,
      specs
    });
  } catch (error) {
    return json(res, 500, {
      error: "Failed to fetch Blizzard talent trees",
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
