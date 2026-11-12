// Reads loadout codes against the generated spec trees (assets/talents): validity, points, hero tree,
// the talents taken, and the difference between two builds. Used by the review tools and the weekly AI review.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeLoadoutCode } from "../../../src/lib/loadout-code.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const trees = new Map();

export function loadTree(className, specName) {
  const key = `${slug(className)}-${slug(specName)}`;
  if (!trees.has(key)) {
    const file = path.join(ROOT, "assets", "talents", `${key}.json`);
    trees.set(key, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null);
  }
  return trees.get(key);
}

/**
 * Returns { ok, problems[], points, hero, talents: Map<label, rank>, taken: Map<nodeId, ...> }.
 * A code is only `ok` when it decodes exactly, is for this spec, every taken talent connects back to the
 * top of its tree, and the point totals are a full build. That makes a mistyped code very unlikely to pass.
 */
export function inspectCode(className, specName, code) {
  const tree = loadTree(className, specName);
  if (!tree) return { ok: false, problems: [`No tree file for ${className} ${specName}`] };
  const problems = [];
  const d = decodeLoadoutCode(code, tree.order);
  if (!d.ok) return { ok: false, problems: ["Code does not decode cleanly against the current tree"] };
  if (d.specId !== tree.specId) return { ok: false, problems: [`Code is for spec id ${d.specId}, not ${tree.specId}`] };

  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const taken = new Map();
  const heroCount = new Map();
  for (const n of tree.nodes) {
    const sel = d.nodes.get(n.id) || (n.alt || []).map((id) => d.nodes.get(id)).find(Boolean);
    if (!sel) continue;
    const rank = sel.rank ?? n.max;
    const entry = n.kind === "choice" ? n.entries[Math.min(sel.choice ?? 0, n.entries.length - 1)] : n.entries[0];
    taken.set(n.id, { node: n, rank, entry, free: !sel.purchased });
    if (n.tree === "hero") heroCount.set(n.hero, (heroCount.get(n.hero) || 0) + 1);
  }
  const heroId = [...heroCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const hero = tree.heroTrees.find((h) => h.id === heroId)?.name || null;
  // Exported codes can carry leftover picks from the other hero tree; only the active tree counts.
  const points = { class: 0, spec: 0, hero: 0 };
  for (const t of taken.values()) {
    if (t.free) continue;
    if (t.node.tree === "hero" && t.node.hero !== heroId) continue;
    points[t.node.tree] += t.rank;
  }

  // Connectivity: every taken node that has parents must have at least one taken parent.
  const parents = new Map();
  for (const n of tree.nodes) for (const to of n.next || []) {
    if (!parents.has(to)) parents.set(to, []);
    parents.get(to).push(n.id);
  }
  let orphans = 0;
  for (const id of taken.keys()) {
    const ps = parents.get(id);
    if (ps && ps.length && !ps.some((p) => taken.has(p))) orphans++;
  }
  if (orphans) problems.push(`${orphans} taken talent(s) not connected to the rest of the build`);

  // A level-capped build spends 34 class, 34 spec and 13 hero points.
  const full = points.class === 34 && points.spec === 34 && points.hero === 13;
  if (!full) problems.push(`Unusual point totals ${points.class}/${points.spec}/${points.hero} (expected 34/34/13)`);

  const talents = new Map();
  for (const t of taken.values()) {
    if (t.node.tree === "hero" && t.node.hero !== heroId) continue;
    const label = `${t.entry.name}`;
    talents.set(`${t.node.tree}:${label}`, { name: label, tree: t.node.tree, rank: t.rank, max: t.node.max, choice: t.node.kind === "choice" });
  }
  return { ok: problems.length === 0, problems, points, hero, talents, taken, byId };
}

/** Talents (with ranks) that differ between two inspected builds, grouped by tree. */
export function diffBuilds(a, b) {
  const out = { onlyA: [], onlyB: [], rankDiff: [] };
  for (const [key, t] of a.talents) {
    const other = b.talents.get(key);
    if (!other) out.onlyA.push(`${t.name} (${t.tree})`);
    else if (other.rank !== t.rank) out.rankDiff.push(`${t.name} ${t.rank} vs ${other.rank}`);
  }
  for (const [key, t] of b.talents) if (!a.talents.has(key)) out.onlyB.push(`${t.name} (${t.tree})`);
  return out;
}
