// Builds src/data/forever-talents.js from trees.txt (every talent, its max rank and the points its tier needs)
// and builds.txt (one recommended build per tree). Every build is checked against the trees before it is written.
//   node Tools/forever/build-forever-talents.mjs
// Source for both files: timesaver.gg's WoW Forever talent calculator pages (per class and per tree).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, f), "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
const REVIEWED = process.env.REVIEWED || new Date().toISOString().slice(0, 10);
const MAX_POINTS = 51; // level 60

const classes = {};
let cls = null;
for (const line of read("trees.txt")) {
  if (line.startsWith("#")) { cls = classes[line.slice(1).trim()] = { trees: [] }; continue; }
  const m = line.match(/^TREE (.+?):\s*(.*)$/);
  if (!m) throw new Error(`Bad tree line: ${line}`);
  const talents = m[2].split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
    const t = s.match(/^(.*)\((\d+),\s*(\d+)\)$/);
    if (!t) throw new Error(`Bad talent: ${s}`);
    return { name: t[1].trim(), max: Number(t[2]), needs: Number(t[3]) };
  });
  cls.trees.push({ name: m[1].trim(), talents });
}

const problems = [];

// Positions, icons, prerequisites and one-line summaries (layout.txt, from talentsforever.com's CC BY 4.0 export).
// Two independent sources have to agree: same talents, same max rank, and row N must be the tier that needs (N-1)*5 points.
{
  let c = null;
  let tree = null;
  const seen = new Set();
  for (const line of read("layout.txt")) {
    if (line.startsWith("#")) { c = classes[line.slice(1).trim()]; continue; }
    if (line.startsWith("TREE ")) { tree = c.trees.find((t) => t.name === line.slice(5).trim()); if (!tree) problems.push(`layout: unknown tree ${line}`); continue; }
    const [pos, name, max, icon, req, text] = line.split("|").map((x) => x.trim());
    const [row, col] = pos.split(" ").map(Number);
    const t = tree?.talents.find((x) => x.name === name);
    if (!t) { problems.push(`layout: ${tree?.name} has no talent "${name}"`); continue; }
    if (t.max !== Number(max)) problems.push(`layout: ${name} max ${max} vs ${t.max}`);
    if (t.needs !== (row - 1) * 5) problems.push(`layout: ${name} row ${row} vs tier ${t.needs}`);
    const cell = `${tree.name}:${row}:${col}`;
    if (seen.has(cell + c.trees.indexOf(tree) + Object.keys(classes).find((k) => classes[k] === c))) problems.push(`layout: two talents at ${cell}`);
    seen.add(cell + c.trees.indexOf(tree) + Object.keys(classes).find((k) => classes[k] === c));
    Object.assign(t, { row, col, icon, text, ...(req && req !== "-" ? { req } : {}) });
  }
  for (const [slug, cl] of Object.entries(classes)) for (const tree of cl.trees) for (const t of tree.talents) {
    if (!t.row) problems.push(`layout: missing ${slug} ${tree.name} ${t.name}`);
    if (t.req) {
      const parent = tree.talents.find((x) => x.name === t.req);
      if (!parent) problems.push(`layout: ${t.name} requires unknown "${t.req}"`);
      else if (parent.row > t.row || (parent.row === t.row && Math.abs(parent.col - t.col) !== 1)) problems.push(`layout: ${t.name} requires ${t.req}, which is not above or beside it`);
    }
  }
}

/** A sensible level-by-level order for a build: go as deep as the main tree allows, prerequisites first, then back-fill. */
function levelingOrder(c, b) {
  const have = c.trees.map((t) => t.talents.map(() => 0));
  const want = c.trees.map((t) => t.talents.map((x) => b.points[t.name]?.[x.name] || 0));
  const treeOrder = c.trees.map((_, i) => i).sort((x, y) => b.split[y] - b.split[x]);
  const order = [];
  const below = (ti, row) => c.trees[ti].talents.reduce((sum, t, i) => sum + (t.row < row ? have[ti][i] : 0), 0);
  const legal = (ti, i) => {
    const t = c.trees[ti].talents[i];
    if (have[ti][i] >= want[ti][i] || below(ti, t.row) < t.needs) return false;
    if (t.req) { const pi = c.trees[ti].talents.findIndex((x) => x.name === t.req); if (have[ti][pi] < c.trees[ti].talents[pi].max) return false; }
    return true;
  };
  const total = want.flat().reduce((a, z) => a + z, 0);
  while (order.length < total) {
    let pick = null;
    for (const ti of treeOrder) {
      const tree = c.trees[ti];
      const cands = tree.talents.map((t, i) => i).filter((i) => legal(ti, i));
      if (!cands.length) continue;
      // Talents a deeper pick depends on come first, then new one-point abilities, then the deepest open row.
      const isPrereq = (i) => tree.talents.some((x, j) => x.req === tree.talents[i].name && want[ti][j] > 0 && have[ti][j] === 0);
      // Stay on a talent until it's finished, so the order reads in blocks.
      const last = order.length ? order[order.length - 1].split(".").map(Number) : null;
      const key = (i) => [isPrereq(i) ? 0 : 1, tree.talents[i].max === 1 ? 0 : 1, last && last[0] === ti && last[1] === i ? 0 : 1, -tree.talents[i].row, tree.talents[i].col];
      cands.sort((x, y) => { const kx = key(x), ky = key(y); for (let k = 0; k < kx.length; k++) if (kx[k] !== ky[k]) return kx[k] - ky[k]; return 0; });
      pick = [ti, cands[0]];
      break;
    }
    if (!pick) return null;
    have[pick[0]][pick[1]]++;
    order.push(`${pick[0]}.${pick[1]}`);
  }
  return order;
}

let cur = null;
const builds = [];
for (const line of read("builds.txt")) {
  if (line.startsWith("##")) {
    const [key, split, purpose, credit] = line.slice(2).split("|").map((s) => s.trim());
    cur = { key, split: split.split("/").map(Number), purpose, credit, points: {} };
    builds.push(cur);
    continue;
  }
  const i = line.indexOf(":");
  const tree = line.slice(0, i).trim();
  cur.points[tree] = Object.fromEntries(line.slice(i + 1).split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
    const j = s.lastIndexOf("=");
    return [s.slice(0, j).trim(), Number(s.slice(j + 1))];
  }));
}

for (const b of builds) {
  const [classSlug, treeSlug] = b.key.split("/");
  const c = classes[classSlug];
  if (!c) { problems.push(`${b.key}: unknown class`); continue; }
  let total = 0;
  c.trees.forEach((tree, idx) => {
    const pts = b.points[tree.name] || {};
    for (const name of Object.keys(pts)) if (!tree.talents.some((t) => t.name === name)) problems.push(`${b.key}: "${name}" is not a ${tree.name} talent`);
    let spent = 0;
    for (const tier of [...new Set(tree.talents.map((t) => t.needs))].sort((a, z) => a - z)) {
      const inTier = tree.talents.filter((t) => t.needs === tier);
      const tierPoints = inTier.reduce((s, t) => s + (pts[t.name] || 0), 0);
      if (tierPoints && spent < tier) problems.push(`${b.key}: ${tree.name} tier ${tier} needs ${tier} points below it, has ${spent}`);
      for (const t of inTier) if ((pts[t.name] || 0) > t.max) problems.push(`${b.key}: ${t.name} ${pts[t.name]}/${t.max}`);
      spent += tierPoints;
    }
    if (spent !== b.split[idx]) problems.push(`${b.key}: ${tree.name} adds up to ${spent}, split says ${b.split[idx]}`);
    total += spent;
  });
  for (const name of Object.keys(b.points)) if (!c.trees.some((t) => t.name === name)) problems.push(`${b.key}: unknown tree "${name}"`);
  if (total > MAX_POINTS) problems.push(`${b.key}: ${total} points (max ${MAX_POINTS})`);
  for (const tree of c.trees) for (const t of tree.talents) {
    if (!t.req || !(b.points[tree.name]?.[t.name] > 0)) continue;
    const parent = tree.talents.find((x) => x.name === t.req);
    if (parent && (b.points[tree.name]?.[parent.name] || 0) < parent.max) problems.push(`${b.key}: ${t.name} needs ${parent.name} ${parent.max}/${parent.max}`);
  }
  b.total = total;
  const order = problems.length ? null : levelingOrder(c, b);
  if (!problems.length && !order) problems.push(`${b.key}: no legal leveling order found`);
  (c.builds ||= {})[treeSlug] = { split: b.split, total, purpose: b.purpose, credit: b.credit, points: b.points, order };
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const out = `// Generated by Tools/forever/build-forever-talents.mjs. Edit trees.txt / builds.txt there, not this file.
// Trees: every talent with its position, icon, max rank, prerequisite and a one-line summary.
// Builds are leveling builds credited to the named guide; "order" is a legal point-by-point order from level 10.

export const FOREVER_TALENTS_REVIEWED = ${JSON.stringify(REVIEWED)};
export const FOREVER_LAYOUT_SOURCE = { name: "Talents Forever", url: "https://talentsforever.com/", license: "CC BY 4.0" };
export const FOREVER_TALENTS_SOURCE = { name: "timesaver.gg", url: (classSlug, treeSlug) => \`https://timesaver.gg/tools/wow-forever/talent-calculator/\${classSlug}\${treeSlug ? \`/\${treeSlug}\` : ""}\` };

export const FOREVER_TALENTS = ${JSON.stringify(classes, null, 1)};
`;
fs.writeFileSync(path.join(here, "../../src/data/forever-talents.js"), out);
console.log(`Wrote ${builds.length} builds across ${Object.keys(classes).length} classes.`);
