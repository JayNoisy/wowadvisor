// Adds reviewed picks to ai-picks.json after validating every code against the current talent tree.
//   node add-picks.js picks-file.json [more.json...]
//
// A picks file is  { "Class": { "Spec": { "aoe": { code | "consensus": true, headline, why[], players?, sources[] } } } }
// `"consensus": true` means "the top-player build already on the site is the pick"; its code is copied in.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectCode } from "./lib/build-check.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const today = new Date().toISOString().slice(0, 10);
const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node add-picks.js picks-file.json [...]");
  process.exit(2);
}

const target = path.join(ROOT, "ai-picks.json");
let store;
try { store = JSON.parse(await fs.readFile(target, "utf8")); } catch { store = { picks: {} }; }
const builds = JSON.parse(await fs.readFile(path.join(ROOT, "builds.json"), "utf8")).builds;

let added = 0;
const rejected = [];
for (const file of files) {
  const incoming = JSON.parse(await fs.readFile(file, "utf8"));
  for (const [className, specs] of Object.entries(incoming)) {
    for (const [specName, modes] of Object.entries(specs)) {
      for (const [mode, pick] of Object.entries(modes)) {
        const where = `${className} ${specName} ${mode}`;
        // The consensus code lives at the top level of the entry (a previous AI pick sits under `selected`).
        const code = pick.consensus ? String(builds?.[className]?.[specName]?.[mode]?.exportString || "") : String(pick.code || "").trim();
        if (!code) { rejected.push(`${where}: no code`); continue; }
        const checked = inspectCode(className, specName, code);
        if (!checked.ok) { rejected.push(`${where}: ${checked.problems.join("; ")}`); continue; }
        if (!pick.headline || !Array.isArray(pick.why) || !pick.why.length) { rejected.push(`${where}: needs a headline and at least one reason`); continue; }
        store.picks[className] ||= {};
        store.picks[className][specName] ||= {};
        store.picks[className][specName][mode] = {
          code,
          hero: checked.hero,
          headline: pick.headline,
          why: pick.why,
          ...(pick.players ? { players: pick.players } : {}),
          sources: pick.sources || [],
          reviewedAt: pick.reviewedAt || today
        };
        added++;
      }
    }
  }
}
store.reviewedAt = today;
store.reviewer = "Claude (weekly AI review)";
await fs.writeFile(target, JSON.stringify(store, null, 2) + "\n", "utf8");
console.log(`Added or updated ${added} pick(s). Rejected ${rejected.length}.`);
if (rejected.length) console.log(rejected.join("\n"));
