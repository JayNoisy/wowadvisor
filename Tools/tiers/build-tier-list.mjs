// Builds src/data/tier-list.json from sources.txt. Each list (edition + content type + role) is the average of the
// sources that rank it. Every spec name is checked against the site's class data, so a typo can't slip through.
//   node Tools/tiers/build-tier-list.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = (f) => pathToFileURL(path.join(here, "../../src/data", f)).href;
const { CLASSES } = await import(src("classes.js"));
const { FOREVER_TALENTS } = await import(src("forever-talents.js"));

const SCORE = { "S+": 6, S: 5, "A+": 4.5, A: 4, "B+": 3.5, B: 3, "C+": 2.5, C: 2, D: 1, F: 0.5 };
const tierOf = (score) => (score >= 4.75 ? "S" : score >= 3.75 ? "A" : score >= 2.75 ? "B" : score >= 1.75 ? "C" : "D");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const titleCase = (s) => s.replace(/(^|-)([a-z])/g, (_, a, b) => (a ? " " : "") + b.toUpperCase());

const problems = [];
function findSpec(edition, text) {
  if (edition === "retail") {
    // Longest class name first, so "Demon Hunter" isn't read as "Hunter".
    const cls = [...CLASSES].sort((a, b) => b.name.length - a.name.length).find((c) => text.endsWith(` ${c.name}`));
    const spec = cls?.specs.find((s) => s.name === text.slice(0, -cls.name.length - 1));
    return spec ? { classSlug: cls.slug, specSlug: spec.slug, className: cls.name, specName: spec.name, role: spec.role } : null;
  }
  for (const [classSlug, c] of Object.entries(FOREVER_TALENTS)) {
    const className = titleCase(classSlug);
    if (!text.endsWith(` ${className}`)) continue;
    const want = text.slice(0, -className.length - 1).replace(/^Feral Combat$/, "Feral");
    const tree = c.trees.find((t) => t.name === want);
    if (tree) return { classSlug, specSlug: slug(tree.name), className, specName: tree.name };
  }
  return null;
}

const blocks = [];
let cur = null;
for (const raw of fs.readFileSync(path.join(here, "sources.txt"), "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || (line.startsWith("#") && !line.startsWith("##"))) continue;
  if (line.startsWith("##")) {
    const [edition, mode, name, url, updated, basis] = line.slice(2).split("|").map((s) => s.trim());
    cur = { edition, mode, name, url, updated, basis, rows: [] };
    blocks.push(cur);
    continue;
  }
  const m = line.match(/^(dps|healer|tank)\s+([SABCDF]\+?):\s*(.*)$/);
  if (!m) { problems.push(`Can't read line: ${line}`); continue; }
  for (const text of m[3].split(",").map((s) => s.trim()).filter(Boolean)) {
    const spec = findSpec(cur.edition, text);
    if (!spec) { problems.push(`${cur.name} ${cur.mode}: unknown spec "${text}"`); continue; }
    if (spec.role && spec.role !== m[1]) problems.push(`${cur.name} ${cur.mode}: ${text} listed as ${m[1]} but is a ${spec.role}`);
    cur.rows.push({ role: m[1], tier: m[2], ...spec });
  }
}

const lists = [];
const keys = [...new Set(blocks.map((b) => `${b.edition}|${b.mode}`))];
for (const key of keys) {
  const [edition, mode] = key.split("|");
  const sources = blocks.filter((b) => b.edition === edition && b.mode === mode);
  for (const role of ["dps", "healer", "tank"]) {
    const specs = new Map();
    for (const s of sources) for (const r of s.rows.filter((x) => x.role === role)) {
      const id = `${r.classSlug}/${r.specSlug}`;
      if (!specs.has(id)) specs.set(id, { classSlug: r.classSlug, specSlug: r.specSlug, className: r.className, specName: r.specName, by: {} });
      if (specs.get(id).by[s.name]) problems.push(`${s.name} ${mode}: ${r.specName} ${r.className} listed twice`);
      specs.get(id).by[s.name] = r.tier;
    }
    if (!specs.size) continue;
    const ranked = [...specs.values()].map((s) => {
      const scores = Object.values(s.by).map((t) => SCORE[t]);
      const score = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { ...s, score: Math.round(score * 100) / 100, tier: tierOf(score) };
    }).sort((a, b) => b.score - a.score || a.specName.localeCompare(b.specName));
    lists.push({
      edition, mode, role,
      sources: sources.filter((s) => s.rows.some((r) => r.role === role)).map(({ name, url, updated, basis }) => ({ name, url, updated, basis })),
      specs: ranked
    });
  }
}

if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
const out = { reviewedAt: process.env.REVIEWED || new Date().toISOString().slice(0, 10), lists };
fs.writeFileSync(path.join(here, "../../src/data/tier-list.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`Wrote ${lists.length} tier lists: ${lists.map((l) => `${l.edition}/${l.mode}/${l.role} (${l.specs.length})`).join(", ")}`);
