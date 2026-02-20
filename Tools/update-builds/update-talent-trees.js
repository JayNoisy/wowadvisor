import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.BLIZZARD_REGION || "us";
const LOCALE = process.env.BLIZZARD_LOCALE || "en_US";
const NAMESPACE = `static-${REGION}`;

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

async function fetchApi(url, token) {
  const u = new URL(url);
  if (!u.searchParams.get("namespace")) u.searchParams.set("namespace", NAMESPACE);
  if (!u.searchParams.get("locale")) u.searchParams.set("locale", LOCALE);
  if (!u.searchParams.get("access_token")) u.searchParams.set("access_token", token);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`Blizzard API ${res.status}: ${u}`);
  return res.json();
}

async function tryFetchApi(url, token) {
  try {
    return await fetchApi(url, token);
  } catch {
    return null;
  }
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

async function buildTalentTrees() {
  const token = await getAccessToken();
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
  const specs = [];

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
