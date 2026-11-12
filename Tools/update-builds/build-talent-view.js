// Builds the per-spec talent tree files the website draws (assets/talents/<class>-<spec>.json).
//
// Three public sources are merged:
//   - talent-trees.json (Blizzard API, already in this repo): which nodes each spec sees and how they connect
//   - SimulationCraft trait table: names, spell ids, grid positions, ranks, node order for loadout codes
//   - WoWAnalyzer talent lists: icon names
//
// Run: node build-talent-view.js            (downloads the two GitHub sources)
//      SOURCE_DIR=./cache node build-talent-view.js   (reads trait_data.inc and wa_<class>.ts from a folder)

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTraitData, CLASS_BY_ID, SIMC_TRAIT_URL } from "./lib/simc-traits.js";
import { decodeLoadoutCode } from "../../src/lib/loadout-code.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "assets", "talents");
const SOURCE_DIR = process.env.SOURCE_DIR ? path.resolve(process.env.SOURCE_DIR) : null;
const WA_URL = (file) => `https://raw.githubusercontent.com/WoWAnalyzer/WoWAnalyzer/master/src/common/TALENTS/${file}.ts`;

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const waFile = (className) => className.toLowerCase().replace(/[^a-z]/g, "");

async function source(localName, url) {
  if (SOURCE_DIR) return fs.readFile(path.join(SOURCE_DIR, localName), "utf8");
  const res = await fetch(url, { headers: { "user-agent": "wowadvisor-talent-view" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.text();
}

/** Returns icon names keyed by spell id, and by talent name as a fallback for spells WoWAnalyzer lists under another id. */
function parseWowAnalyzerIcons(text) {
  const byId = new Map();
  const byName = new Map();
  const re = /id:\s*(\d+),\s*name:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"),\s*icon:\s*'([^']*)'/g;
  for (const m of text.matchAll(re)) {
    byId.set(Number(m[1]), m[4]);
    byName.set((m[2] ?? m[3]).replace(/\\(.)/g, "$1").toLowerCase(), m[4]);
  }
  return { byId, byName };
}

async function main() {
  const blizzard = JSON.parse(await fs.readFile(path.join(ROOT, "talent-trees.json"), "utf8"));
  const { build, traits, subTrees } = parseTraitData(await source("trait_data.inc", SIMC_TRAIT_URL));
  if (traits.length < 2000) throw new Error(`Trait table looks wrong: only ${traits.length} rows parsed`);

  const classNames = [...new Set(blizzard.specs.map((s) => s.className))];
  const icons = new Map();
  const iconsByName = new Map(); // "<class>|<talent name>" -> icon
  for (const className of classNames) {
    const text = await source(`wa_${waFile(className)}.ts`, WA_URL(waFile(className)));
    const parsed = parseWowAnalyzerIcons(text);
    for (const [id, icon] of parsed.byId) icons.set(id, icon);
    for (const [name, icon] of parsed.byName) iconsByName.set(`${className}|${name}`, icon);
  }

  // Group simc rows per class, then per node (a node has several rows when it is a choice).
  const classId = Object.fromEntries(Object.entries(CLASS_BY_ID).map(([id, name]) => [name, Number(id)]));
  const report = [];
  await fs.mkdir(OUT_DIR, { recursive: true });
  const index = { build, generatedAt: new Date().toISOString(), specs: [] };

  for (const spec of blizzard.specs) {
    const rows = traits.filter((t) => t.classId === classId[spec.className]);
    const byNode = new Map();
    for (const t of rows) {
      if (!byNode.has(t.nodeId)) byNode.set(t.nodeId, []);
      byNode.get(t.nodeId).push(t);
    }
    for (const list of byNode.values()) list.sort((a, b) => a.selectionIndex - b.selectionIndex);
    const order = [...byNode.keys()].sort((a, b) => a - b);

    const forSpec = (t) => t.specIds.length === 0 || t.specIds.includes(spec.specId);

    // The hero-tree choice node for this spec tells us which two hero trees it can pick.
    const selection = [...byNode.values()].find((list) => list[0].tree === "selection" && list.some(forSpec));
    const heroChoices = selection
      ? selection.filter(forSpec).map((t) => ({ id: t.subTreeId, name: subTrees.get(t.subTreeId)?.name || `Hero tree ${t.subTreeId}` }))
      : [];
    const heroIds = new Set(heroChoices.map((h) => h.id));

    // Connections come from Blizzard's data. Hero trees are shared between specs and sometimes only
    // listed under one of them, so collect connections from every spec of the class.
    const next = new Map();
    for (const other of blizzard.specs.filter((s) => s.className === spec.className)) {
      for (const tree of Object.values(other.trees || {})) {
        for (const e of tree.edges || []) {
          if (!next.has(e.fromNodeId)) next.set(e.fromNodeId, new Set());
          next.get(e.fromNodeId).add(e.toNodeId);
        }
      }
    }

    // Class and spec nodes: what Blizzard lists for this spec. Hero nodes: everything in its two hero trees.
    const visible = new Set(spec.nodes.map((n) => n.id));
    for (const [id, list] of byNode) if (list[0].tree === "hero" && heroIds.has(list[0].subTreeId)) visible.add(id);
    const nodes = [];
    let missingIcons = 0;
    for (const id of visible) {
      // Rows with no spell are placeholders in the game data.
      // Hero trees are shared by two specs, but the trait table often tags their rows with only one of them,
      // so hero rows are matched by hero tree, not by spec.
      const list = (byNode.get(id) || []).filter((t) => (t.tree === "hero" || forSpec(t)) && t.spellId > 0 && t.name && t.name !== "0");
      if (!list.length) continue;
      const first = list[0];
      if (first.tree === "selection" || first.row < 1 || first.col < 1) continue;
      if (first.tree === "hero" && !heroIds.has(first.subTreeId)) continue;
      const entries = list.map((t) => {
        const icon = icons.get(t.spellId) || iconsByName.get(`${spec.className}|${t.name.toLowerCase()}`) || null;
        if (!icon) missingIcons++;
        return { name: t.name, spell: t.spellId, icon, ...(list.length > 1 ? { ranks: t.maxRanks } : {}) };
      });
      // simc node types: 0 one talent, 1 tiered (entries are successive ranks of one talent), 2 choice between entries.
      const tiered = list.length > 1 && first.nodeType === 1;
      nodes.push({
        id,
        tree: first.tree,
        ...(first.tree === "hero" ? { hero: first.subTreeId } : {}),
        row: first.row,
        col: first.col,
        max: tiered ? list.reduce((sum, t) => sum + t.maxRanks, 0) : Math.max(...list.map((t) => t.maxRanks)),
        ...(list.length > 1 ? { kind: tiered ? "tiered" : "choice" } : {}),
        ...(first.reqPoints ? { req: first.reqPoints } : {}),
        entries,
        next: [...(next.get(id) || [])].filter((to) => visible.has(to)),
        _explicit: list.some((t) => t.specIds.includes(spec.specId))
      });
    }

    // A hero tree's top talent can differ per spec (two nodes in the top row). Keep the one for this spec,
    // drawn where the tree's usual top talent sits.
    for (const hero of heroChoices) {
      const top = nodes.filter((n) => n.tree === "hero" && n.hero === hero.id && n.row === 1);
      if (top.length < 2) continue;
      const tagOf = (n) => (byNode.get(n.id) || [])[0]?.specIds.join(",") || "";
      const tags = nodes.filter((n) => n.tree === "hero" && n.hero === hero.id).map(tagOf);
      const common = [...new Set(tags)].sort((x, y) => tags.filter((t) => t === y).length - tags.filter((t) => t === x).length)[0];
      const usual = top.find((n) => tagOf(n) === common) || top[0];
      const keep = top.find((n) => n._explicit) || usual;
      keep.col = usual.col;
      for (const n of top) {
        if (n === keep) continue;
        keep.next = [...new Set([...keep.next, ...n.next])];
        nodes.splice(nodes.indexOf(n), 1);
      }
    }

    // Some talents exist as two nodes in the same cell (one per group of specs). Keep the better match for this
    // spec and remember the other id, so a build that uses either one still lights the cell.
    const byCell = new Map();
    for (const n of nodes) {
      const key = `${n.tree}:${n.hero || ""}:${n.row}:${n.col}`;
      if (!byCell.has(key)) byCell.set(key, []);
      byCell.get(key).push(n);
    }
    const score = (n) => (n._explicit ? 4 : 0) + (n.entries.every((e) => e.icon) ? 2 : 0) + (n.next.length ? 1 : 0);
    for (const group of byCell.values()) {
      if (group.length < 2) continue;
      group.sort((a, b) => score(b) - score(a) || a.id - b.id);
      const [keep, ...drop] = group;
      keep.alt = drop.map((n) => n.id);
      keep.next = [...new Set([...keep.next, ...drop.flatMap((n) => n.next)])];
      for (const n of drop) {
        nodes.splice(nodes.indexOf(n), 1);
        // Re-point connections that led to the dropped node.
        for (const other of nodes) if (other.next?.includes(n.id)) other.next = [...new Set(other.next.map((to) => (to === n.id ? keep.id : to)))];
      }
    }
    for (const n of nodes) delete n._explicit;
    // Drop connections to nodes we filtered out (other hero trees).
    const kept = new Set(nodes.map((n) => n.id));
    for (const n of nodes) {
      n.next = n.next.filter((to) => kept.has(to));
      if (!n.next.length) delete n.next;
    }

    // Two nodes of one tree should never share a cell.
    const cells = new Set();
    let clashes = 0;
    for (const n of nodes) {
      const key = `${n.tree}:${n.hero || ""}:${n.row}:${n.col}`;
      if (cells.has(key)) clashes++;
      cells.add(key);
    }

    const file = `${slug(spec.className)}-${slug(spec.specName)}.json`;
    const out = {
      build,
      className: spec.className,
      specName: spec.specName,
      specId: spec.specId,
      heroTrees: heroChoices,
      selectionNode: selection ? selection[0].nodeId : null,
      order,
      nodes: nodes.sort((a, b) => a.id - b.id)
    };
    await fs.writeFile(path.join(OUT_DIR, file), JSON.stringify(out));
    index.specs.push({ className: spec.className, specName: spec.specName, specId: spec.specId, file });
    const count = (tree) => nodes.filter((n) => n.tree === tree).length;
    report.push(`${spec.className.padEnd(13)}${spec.specName.padEnd(14)} class ${count("class")} spec ${count("spec")} hero ${count("hero")} (${heroChoices.map((h) => h.name).join(", ")}) missing icons ${missingIcons} clashes ${clashes}`);
  }

  await fs.writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(index));
  console.log(`Game build ${build}. Wrote ${index.specs.length} spec files to assets/talents/`);
  console.log(report.join("\n"));

  // Self-check: every recommended build must decode cleanly against the node order we just wrote.
  const builds = JSON.parse(await fs.readFile(path.join(ROOT, "builds.json"), "utf8")).builds || {};
  let ok = 0;
  const bad = [];
  for (const s of index.specs) {
    const data = JSON.parse(await fs.readFile(path.join(OUT_DIR, s.file), "utf8"));
    for (const mode of ["aoe", "raid", "pvp"]) {
      const code = builds[s.className]?.[s.specName]?.[mode]?.exportString;
      if (!code) continue;
      const d = decodeLoadoutCode(code, data.order);
      if (d.ok && d.specId === s.specId) ok++;
      else bad.push(`${s.className} ${s.specName} ${mode}`);
    }
  }
  console.log(`Loadout codes decoded: ${ok} ok, ${bad.length} failed${bad.length ? `: ${bad.join("; ")}` : ""}`);
  if (bad.length > ok) throw new Error("Most loadout codes failed to decode; the node order is probably out of date.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
