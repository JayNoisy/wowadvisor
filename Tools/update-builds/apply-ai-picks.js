// Applies the weekly AI review (ai-picks.json) on top of the top-player consensus in builds.json.
//
// For every class / spec / mode with a reviewed pick whose code is still valid on the current talent tree,
// the pick becomes the build's `selected` entry (the site and the API both read `selected` first).
// The consensus build stays in place underneath, so the site can show both.
//
// Used by update-builds.js on every data refresh, and runnable by hand:  node apply-ai-picks.js

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectCode, diffBuilds } from "./lib/build-check.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MODE_NAMES = { aoe: "Mythic+", raid: "Raid", pvp: "PvP" };

export async function readAiPicks() {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, "ai-picks.json"), "utf8"));
  } catch {
    return null;
  }
}

/** Mutates `payload.builds` in place. Returns a small report for builds.json's `sources` block. */
export function applyAiPicks(payload, aiPicks) {
  const builds = payload?.builds;
  const report = { ok: true, reviewedAt: aiPicks?.reviewedAt || null, applied: 0, skipped: [] };
  if (!builds || typeof builds !== "object") return { ...report, ok: false, error: "no builds" };

  // Start clean so a pick that was withdrawn or went stale doesn't linger.
  for (const specs of Object.values(builds)) {
    for (const modes of Object.values(specs || {})) {
      for (const entry of Object.values(modes || {})) {
        if (entry && typeof entry === "object" && entry.selected?.ai) delete entry.selected;
      }
    }
  }
  if (!aiPicks?.picks) return report;

  for (const [className, specs] of Object.entries(aiPicks.picks)) {
    for (const [specName, modes] of Object.entries(specs || {})) {
      for (const [mode, pick] of Object.entries(modes || {})) {
        const where = `${className} ${specName} ${mode}`;
        const code = String(pick?.code || "").trim();
        if (!code) continue;
        const checked = inspectCode(className, specName, code);
        if (!checked.ok) {
          report.skipped.push(`${where}: ${checked.problems.join("; ")}`);
          continue;
        }
        builds[className] ||= {};
        builds[className][specName] ||= {};
        const entry = (builds[className][specName][mode] ||= {});
        const consensusCode = String(entry.exportString || "").trim();
        const consensus = consensusCode ? inspectCode(className, specName, consensusCode) : null;
        const same = consensusCode === code;
        let differs = null;
        if (!same && consensus?.talents) {
          const d = diffBuilds(checked, consensus);
          differs = { takes: d.onlyA, skips: d.onlyB, sameHero: checked.hero === consensus.hero, consensusHero: consensus.hero };
        }
        entry.selected = {
          title: `${checked.hero || specName} ${MODE_NAMES[mode] || mode}`,
          exportString: code,
          updated: pick.reviewedAt || aiPicks.reviewedAt || null,
          source: "ai-pick",
          notes: [],
          ai: {
            hero: checked.hero,
            headline: String(pick.headline || ""),
            why: Array.isArray(pick.why) ? pick.why.map(String) : [],
            players: pick.players || null,
            sources: Array.isArray(pick.sources) ? pick.sources : [],
            reviewedAt: pick.reviewedAt || aiPicks.reviewedAt || null,
            sameAsConsensus: same,
            differs
          }
        };
        report.applied++;
      }
    }
  }
  return report;
}

// Run directly: re-apply picks to the builds.json on disk.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, "builds.json");
  const payload = JSON.parse(await fs.readFile(file, "utf8"));
  const report = applyAiPicks(payload, await readAiPicks());
  payload.sources = { ...(payload.sources || {}), aiPicks: report };
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  console.log(`AI picks applied: ${report.applied}. Skipped: ${report.skipped.length}`);
  if (report.skipped.length) console.log(report.skipped.join("\n"));
}
