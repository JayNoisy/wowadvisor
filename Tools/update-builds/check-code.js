// Check one or more loadout codes for a spec, and compare them with the site's current pick.
//   node check-code.js "Shaman" "Elemental" aoe CODE [CODE...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectCode, diffBuilds } from "./lib/build-check.js";

const [className, specName, mode, ...codes] = process.argv.slice(2);
if (!className || !specName || !mode) {
  console.error('Usage: node check-code.js "<Class>" "<Spec>" <aoe|raid|pvp> [CODE...]');
  process.exit(2);
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const builds = JSON.parse(fs.readFileSync(path.join(ROOT, "builds.json"), "utf8")).builds;
const current = builds?.[className]?.[specName]?.[mode];
const base = current?.exportString ? inspectCode(className, specName, current.exportString) : null;
if (base) {
  console.log(`CURRENT ${mode}: ${base.ok ? "valid" : "INVALID " + base.problems.join("; ")} | hero ${base.hero} | sample ${current.sampleSize}, ${current.agreementCount} agree, confidence ${current.confidenceScore}`);
} else console.log(`CURRENT ${mode}: none`);

codes.forEach((code, i) => {
  const r = inspectCode(className, specName, code);
  if (!r.ok && !r.talents) return console.log(`#${i + 1}: INVALID ${r.problems.join("; ")}`);
  let line = `#${i + 1}: ${r.ok ? "valid" : "PROBLEM " + r.problems.join("; ")} | hero ${r.hero} | points ${r.points.class}/${r.points.spec}/${r.points.hero}`;
  if (code === current?.exportString) line += " | identical to current";
  else if (base?.talents) {
    const d = diffBuilds(r, base);
    line += `\n     takes, current doesn't: ${d.onlyA.join(", ") || "-"}\n     current takes, this doesn't: ${d.onlyB.join(", ") || "-"}${d.rankDiff.length ? `\n     ranks: ${d.rankDiff.join(", ")}` : ""}`;
  }
  console.log(line);
});
