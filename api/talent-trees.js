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

function normalizeNode(raw, idx) {
  if (!raw || typeof raw !== "object") return null;
  const id = Number(raw.id ?? raw.node?.id ?? raw.talent?.id ?? idx + 1);
  if (!Number.isFinite(id)) return null;

  const row = Number(raw.display_row ?? raw.row ?? raw.ui_row ?? 0) || 0;
  const col = Number(raw.display_col ?? raw.column ?? raw.ui_col ?? 0) || 0;

  const entry = Array.isArray(raw.entries) && raw.entries.length > 0 ? raw.entries[0] : null;
  const name = firstNonEmpty(
    raw.name,
    raw.spell_tooltip?.spell?.name,
    entry?.spell_tooltip?.spell?.name,
    entry?.name,
    `Talent ${id}`
  );
  const maxRank = Number(raw.ranks ?? raw.max_ranks ?? entry?.max_ranks ?? 1) || 1;
  const treeType = String(raw.tree_type || raw.type || "spec");

  return {
    id,
    name,
    row: Math.max(0, row),
    col: Math.max(0, col),
    maxRank: Math.max(1, maxRank),
    treeType
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

async function collectTalentTrees(region, token, locale, namespace) {
  const indexPayload = await fetchApi(
    `https://${region}.api.blizzard.com/data/wow/talent-tree/index`,
    token,
    locale,
    namespace
  );

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
    const specs = await collectTalentTrees(region, token, locale, namespace);

    res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return json(res, 200, {
      generatedAt: new Date().toISOString(),
      source: "blizzard-api",
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
