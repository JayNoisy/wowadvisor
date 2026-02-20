// tools/update-builds/update-builds.js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getMeta, getMurlokPvpBuilds } from "./sources/murlok.js";
import { getPeaversBuilds } from "./sources/peavers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODES = ["aoe", "raid", "pvp"];

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
  console.log(`✅ Wrote builds.json to: ${outPath}`);
}

function keyOf(b) {
  return `${b.className}|||${b.specName}|||${b.mode}`;
}

function parseDateSafe(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

// Rule: PvP → prefer Murlok if available
function chooseBestPerSpec(candidates) {
  const groups = new Map();
  for (const b of candidates) {
    if (!b?.className || !b?.specName || !b?.mode) continue;
    if (!MODES.includes(b.mode)) continue;

    const k = keyOf(b);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(b);
  }

  const chosen = {};

  for (const [k, arr] of groups.entries()) {
    const mode = arr[0]?.mode;

    const hasMurlok = arr.some((b) =>
      String(b.source || "").toLowerCase().includes("murlok")
    );

    const pool =
      mode === "pvp" && hasMurlok
        ? arr.filter((b) =>
            String(b.source || "").toLowerCase().includes("murlok")
          )
        : arr;

    pool.sort((a, b) => {
      const aValid = typeof a.exportString === "string" && a.exportString.length > 20;
      const bValid = typeof b.exportString === "string" && b.exportString.length > 20;
      if (aValid !== bValid) return bValid - aValid;

      const ad = parseDateSafe(a.updated)?.getTime() ?? 0;
      const bd = parseDateSafe(b.updated)?.getTime() ?? 0;
      if (bd !== ad) return bd - ad;

      const aM = String(a.source || "").toLowerCase().includes("murlok");
      const bM = String(b.source || "").toLowerCase().includes("murlok");
      if (aM !== bM) return bM - aM;

      return String(a.source || "").localeCompare(String(b.source || ""));
    });

    const best = pool[0];
    const { className, specName } = best;

    const classNode = ensure(chosen, className);
    const specNode = ensure(classNode, specName);

    specNode[mode] = {
      title: best.title ?? `${specName} — ${mode.toUpperCase()}`,
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

  // 3) Murlok PvP builds (Solo Shuffle)
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

  // 4) Merge + select best per spec with PvP override rule
  const candidates = [...peaversBuilds, ...murlokPvpBuilds];
  out.builds = chooseBestPerSpec(candidates);

  // 5) Preserve existing builds if something went wrong and we generated nothing
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
  console.error("❌ Updater failed:", err);
  process.exit(1);
});
