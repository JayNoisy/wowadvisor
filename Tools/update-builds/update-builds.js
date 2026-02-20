// tools/update-builds/update-builds.js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getMeta, getMurlokPveBuilds, getMurlokPvpBuilds } from "./sources/murlok.js";
import { getPeaversBuilds } from "./sources/peavers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODES = ["aoe", "raid", "pvp"];
const ENABLE_MURLOK_PVE = process.env.ENABLE_MURLOK_PVE !== "false";

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

function ageDays(updated) {
  const d = parseDateSafe(updated);
  if (!d) return null;
  const ms = Date.now() - d.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function scoreCandidate(candidate, mode) {
  let score = 0;
  const source = String(candidate.source || "").toLowerCase();
  const isMurlok = source.includes("murlok");
  const isPeavers = source.includes("peavers");

  if (isMurlok) score += 20;
  if (isPeavers) score += 16;

  if (mode === "pvp" && isMurlok) score += 20;

  const days = ageDays(candidate.updated);
  if (days === null) {
    score -= 6;
  } else if (days <= 3) {
    score += 24;
  } else if (days <= 7) {
    score += 18;
  } else if (days <= 14) {
    score += 12;
  } else if (days <= 30) {
    score += 6;
  } else if (days > 45) {
    score -= 8;
  }

  // If Peavers is stale or missing dates, make it easier for a fresher source to win.
  if (isPeavers && (days === null || days > 30)) score -= 8;

  if (Array.isArray(candidate.notes) && candidate.notes.length > 0) score += 1;
  return score;
}

function chooseBestPerSpec(candidates) {
  const groups = new Map();
  for (const b of candidates) {
    if (!b?.className || !b?.specName || !b?.mode) continue;
    if (!MODES.includes(b.mode)) continue;
    if (!isValidTalentString(b.exportString)) continue;

    const k = keyOf(b);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(b);
  }

  const chosen = {};

  for (const arr of groups.values()) {
    const mode = arr[0]?.mode;

    arr.sort((a, b) => {
      const scoreDiff = scoreCandidate(b, mode) - scoreCandidate(a, mode);
      if (scoreDiff !== 0) return scoreDiff;

      const bd = parseDateSafe(b.updated)?.getTime() ?? 0;
      const ad = parseDateSafe(a.updated)?.getTime() ?? 0;
      if (bd !== ad) return bd - ad;

      return String(a.source || "").localeCompare(String(b.source || ""));
    });

    const best = arr[0];
    const { className, specName } = best;

    const classNode = ensure(chosen, className);
    const specNode = ensure(classNode, specName);

    specNode[mode] = {
      title: best.title ?? `${specName} - ${mode.toUpperCase()}`,
      source: best.source ?? "Unknown",
      updated: best.updated ?? null,
      exportString: best.exportString ?? "",
      notes: Array.isArray(best.notes) ? best.notes : []
    };
  }

  return chosen;
}

async function main() {
  const out = makeEmptyBuildsJson();

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
  const candidates = [...peaversBuilds, ...murlokPveBuilds, ...murlokPvpBuilds];
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
