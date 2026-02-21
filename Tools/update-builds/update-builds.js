// tools/update-builds/update-builds.js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getMeta, getMurlokPveBuilds, getMurlokPvpBuilds } from "./sources/murlok.js";
import { getPeaversBuilds } from "./sources/peavers.js";
import { getExternalJsonBuilds } from "./sources/external-json.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODES = ["aoe", "raid", "pvp"];
const ENABLE_MURLOK_PVE = process.env.ENABLE_MURLOK_PVE !== "false";

const DEFAULT_WEIGHT_CONFIG = {
  sourceBase: {
    murlok: 20,
    peavers: 16,
    archon: 20,
    wowhead: 15,
    icyveins: 14,
    method: 14,
    external: 16,
    other: 10
  },
  modeBonus: {
    pvp: { murlok: 22, wowhead: 5, archon: 8 },
    aoe: { peavers: 8, archon: 10, method: 6 },
    raid: { peavers: 8, archon: 10, method: 6 }
  },
  freshness: {
    unknown: -6,
    le3d: 24,
    le7d: 18,
    le14d: 12,
    le30d: 6,
    gt45d: -8,
    peaversPenaltyOver30d: -8
  },
  misc: {
    notesBonus: 1
  }
};

function makeEmptyBuildsJson() {
  return {
    generatedAt: new Date().toISOString(),
    sources: {},
    builds: {}
  };
}

function ensure(obj, key) {
  if (!obj[key]) obj[key] = {};
  return obj[key];
}

function mergeWeightConfig(base, override) {
  const merged = JSON.parse(JSON.stringify(base));
  if (!override || typeof override !== "object") return merged;

  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === "object" && !Array.isArray(v) && merged[k] && typeof merged[k] === "object") {
      merged[k] = { ...merged[k], ...v };
      if (k === "modeBonus") {
        for (const mk of Object.keys(merged.modeBonus)) {
          merged.modeBonus[mk] = {
            ...(base.modeBonus?.[mk] || {}),
            ...(override.modeBonus?.[mk] || {})
          };
        }
      }
    } else {
      merged[k] = v;
    }
  }
  return merged;
}

async function loadWeightConfig() {
  const cfgPath = process.env.SOURCE_WEIGHT_CONFIG_PATH
    ? path.resolve(process.cwd(), process.env.SOURCE_WEIGHT_CONFIG_PATH)
    : path.join(__dirname, "source-weights.json");
  try {
    const raw = await fs.readFile(cfgPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      config: mergeWeightConfig(DEFAULT_WEIGHT_CONFIG, parsed),
      source: cfgPath
    };
  } catch {
    return {
      config: DEFAULT_WEIGHT_CONFIG,
      source: "defaults"
    };
  }
}

async function writeProjectBuildsJson(payload) {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const outPath = path.join(projectRoot, "builds.json");
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote builds.json to: ${outPath}`);
}

function keyOf(b) {
  return `${b.className}|||${b.specName}|||${b.mode}`;
}

function parseDateSafe(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function isValidTalentString(s) {
  if (typeof s !== "string") return false;
  const trimmed = s.trim();
  if (trimmed.length < 40 || trimmed.length > 260) return false;
  if (trimmed[0] !== "C") return false;
  return /^[A-Za-z0-9+/=]+$/.test(trimmed);
}

function normalizeTalentString(s) {
  return typeof s === "string" ? s.trim() : "";
}

function ageDays(updated) {
  const d = parseDateSafe(updated);
  if (!d) return null;
  const ms = Date.now() - d.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function sourceFamily(source) {
  const s = String(source || "").toLowerCase();
  if (s.includes("murlok")) return "murlok";
  if (s.includes("peavers")) return "peavers";
  if (s.includes("archon")) return "archon";
  if (s.includes("wowhead")) return "wowhead";
  if (s.includes("icy-veins") || s.includes("icyveins")) return "icyveins";
  if (s.includes("method")) return "method";
  if (s.includes("communityjson") || s.includes("externaljson")) return "external";
  return "other";
}

function sourceWeight(candidate, mode) {
  const fam = sourceFamily(candidate.source);
  const base = WEIGHT_CONFIG.sourceBase?.[fam] ?? WEIGHT_CONFIG.sourceBase?.other ?? 10;
  const modeDelta = WEIGHT_CONFIG.modeBonus?.[mode]?.[fam] ?? 0;
  return base + modeDelta;
}

function freshnessWeight(updated) {
  let score = 0;
  const days = ageDays(updated);
  if (days === null) {
    score += WEIGHT_CONFIG.freshness.unknown ?? -6;
  } else if (days <= 3) {
    score += WEIGHT_CONFIG.freshness.le3d ?? 24;
  } else if (days <= 7) {
    score += WEIGHT_CONFIG.freshness.le7d ?? 18;
  } else if (days <= 14) {
    score += WEIGHT_CONFIG.freshness.le14d ?? 12;
  } else if (days <= 30) {
    score += WEIGHT_CONFIG.freshness.le30d ?? 6;
  } else if (days > 45) {
    score += WEIGHT_CONFIG.freshness.gt45d ?? -8;
  }
  return score;
}

function scoreCandidate(candidate, mode) {
  let score = 0;
  const fam = sourceFamily(candidate.source);

  score += sourceWeight(candidate, mode);
  score += freshnessWeight(candidate.updated);

  // If Peavers is stale or missing dates, make it easier for a fresher source to win.
  const days = ageDays(candidate.updated);
  if (fam === "peavers" && (days === null || days > 30)) {
    score += WEIGHT_CONFIG.freshness.peaversPenaltyOver30d ?? -8;
  }

  if (Array.isArray(candidate.notes) && candidate.notes.length > 0) {
    score += WEIGHT_CONFIG.misc.notesBonus ?? 1;
  }
  return score;
}

let WEIGHT_CONFIG = DEFAULT_WEIGHT_CONFIG;

function chooseBestPerSpec(candidates) {
  const groups = new Map();
  for (const b of candidates) {
    if (!b?.className || !b?.specName || !b?.mode) continue;
    if (!MODES.includes(b.mode)) continue;
    const exportString = normalizeTalentString(b.exportString);
    if (!isValidTalentString(exportString)) continue;

    const k = keyOf(b);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ ...b, exportString });
  }

  const chosen = {};

  for (const arr of groups.values()) {
    const mode = arr[0]?.mode;

    // Cluster candidates by identical talent string, then pick the strongest consensus.
    const clusters = new Map();
    for (const c of arr) {
      const tk = c.exportString;
      if (!clusters.has(tk)) clusters.set(tk, []);
      clusters.get(tk).push(c);
    }

    const clusterList = Array.from(clusters.values()).map((members) => {
      const distinctFamilies = new Set(members.map((m) => sourceFamily(m.source)));
      const supportScore = members.reduce((sum, m) => sum + scoreCandidate(m, mode), 0);
      const bestMember = [...members].sort((a, b) => {
        const scoreDiff = scoreCandidate(b, mode) - scoreCandidate(a, mode);
        if (scoreDiff !== 0) return scoreDiff;
        const bd = parseDateSafe(b.updated)?.getTime() ?? 0;
        const ad = parseDateSafe(a.updated)?.getTime() ?? 0;
        return bd - ad;
      })[0];
      return {
        members,
        bestMember,
        supportScore,
        distinctSourceCount: distinctFamilies.size
      };
    });

    clusterList.sort((a, b) => {
      if (b.supportScore !== a.supportScore) return b.supportScore - a.supportScore;
      if (b.distinctSourceCount !== a.distinctSourceCount) return b.distinctSourceCount - a.distinctSourceCount;
      const bd = parseDateSafe(b.bestMember?.updated)?.getTime() ?? 0;
      const ad = parseDateSafe(a.bestMember?.updated)?.getTime() ?? 0;
      return bd - ad;
    });

    const bestCluster = clusterList[0];
    const runnerUpCluster = clusterList[1] || null;
    const best = bestCluster.bestMember;
    const withSelectedTalents = bestCluster.members.find((m) => m?.selectedTalents && typeof m.selectedTalents === "object") || null;
    const { className, specName } = best;

    const classNode = ensure(chosen, className);
    const specNode = ensure(classNode, specName);

    const margin = Math.max(
      0,
      bestCluster.supportScore - (runnerUpCluster ? runnerUpCluster.supportScore : 0)
    );
    const recencyBonus = (() => {
      const d = ageDays(best.updated);
      if (d === null) return 0;
      if (d <= 3) return 10;
      if (d <= 7) return 7;
      if (d <= 14) return 4;
      return 0;
    })();
    const sourceDiversityBonus = Math.min(12, bestCluster.distinctSourceCount * 6);
    const baseConfidence = Math.min(100, Math.max(5, 45 + margin + recencyBonus + sourceDiversityBonus));
    const confidenceScore = Math.round(baseConfidence);
    const confidence =
      confidenceScore >= 80 ? "high" :
      confidenceScore >= 60 ? "medium" :
      "low";

    const rationale = [
      `support=${bestCluster.supportScore.toFixed(1)}`,
      `sources=${bestCluster.distinctSourceCount}`,
      `agreement=${bestCluster.members.length}/${arr.length}`,
      runnerUpCluster ? `margin=${margin.toFixed(1)}` : "margin=max",
      best.updated ? `updated=${best.updated}` : "updated=unknown"
    ].join(", ");

    specNode[mode] = {
      title: best.title ?? `${specName} - ${mode.toUpperCase()}`,
      source: best.source ?? "Unknown",
      updated: best.updated ?? null,
      exportString: best.exportString ?? "",
      notes: Array.isArray(best.notes) ? best.notes : [],
      confidence,
      confidenceScore,
      confidenceRationale: rationale,
      sampleSize: arr.length,
      agreementCount: bestCluster.members.length,
      selectedTalents: withSelectedTalents?.selectedTalents ?? null
    };
  }

  return chosen;
}

async function main() {
  const out = makeEmptyBuildsJson();
  const loadedWeights = await loadWeightConfig();
  WEIGHT_CONFIG = loadedWeights.config;
  out.sources.weightConfig = {
    ok: true,
    source: loadedWeights.source
  };

  // 1) Murlok freshness
  try {
    const mplusMeta = await getMeta("dps", "m+");
    out.sources.murlok = {
      ok: true,
      mplusMetaUpdatedAt: mplusMeta?.UpdatedAt ?? null
    };
  } catch (err) {
    out.sources.murlok = { ok: false, error: String(err) };
  }

  // 2) Peavers builds
  let peaversBuilds = [];
  try {
    peaversBuilds = await getPeaversBuilds();
    out.sources.peavers = { ok: true, count: peaversBuilds.length };
  } catch (err) {
    out.sources.peavers = { ok: false, error: String(err) };
  }

  // 3) Murlok PvP builds
  let murlokPvpBuilds = [];
  try {
    murlokPvpBuilds = await getMurlokPvpBuilds();
    out.sources.murlok = {
      ...(out.sources.murlok || {}),
      pvpOk: true,
      pvpCount: murlokPvpBuilds.length
    };
  } catch (err) {
    out.sources.murlok = {
      ...(out.sources.murlok || {}),
      pvpOk: false,
      pvpError: String(err)
    };
  }

  // 4) Optional Murlok PvE builds for AoE/Raid comparison and fallback.
  let murlokPveBuilds = [];
  if (ENABLE_MURLOK_PVE) {
    try {
      murlokPveBuilds = await getMurlokPveBuilds();
      out.sources.murlok = {
        ...(out.sources.murlok || {}),
        pveOk: true,
        pveCount: murlokPveBuilds.length
      };
    } catch (err) {
      out.sources.murlok = {
        ...(out.sources.murlok || {}),
        pveOk: false,
        pveError: String(err)
      };
    }
  } else {
    out.sources.murlok = {
      ...(out.sources.murlok || {}),
      pveOk: false,
      pveError: "Disabled by ENABLE_MURLOK_PVE=false"
    };
  }

  // 5) Merge + choose best per spec/mode using validation + scoring.
  let externalBuilds = [];
  try {
    const external = await getExternalJsonBuilds();
    externalBuilds = Array.isArray(external?.builds) ? external.builds : [];
    out.sources.externalJson = {
      ok: true,
      count: externalBuilds.length,
      localCount: external?.stats?.localCount ?? 0,
      remote: external?.stats?.remote ?? []
    };
  } catch (err) {
    out.sources.externalJson = {
      ok: false,
      error: String(err)
    };
  }

  const candidates = [...peaversBuilds, ...murlokPveBuilds, ...murlokPvpBuilds, ...externalBuilds];
  out.builds = chooseBestPerSpec(candidates);

  // 6) Preserve existing builds if something went wrong and we generated nothing
  const projectRoot = path.resolve(__dirname, "..", "..");
  const existingPath = path.join(projectRoot, "builds.json");

  try {
    const existingRaw = await fs.readFile(existingPath, "utf8");
    const existing = JSON.parse(existingRaw);
    const existingBuilds = existing?.builds ? existing.builds : existing;

    if (Object.keys(out.builds).length === 0 && existingBuilds && typeof existingBuilds === "object") {
      out.builds = existingBuilds.builds ? existingBuilds.builds : existingBuilds;
      out.sources.note = "Generated builds were empty; preserved existing builds.json builds.";
    }
  } catch {
    // ignore
  }

  await writeProjectBuildsJson(out);
}

main().catch((err) => {
  console.error("Updater failed:", err);
  process.exit(1);
});
