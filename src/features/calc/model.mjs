// Talent calculator rules for one Retail spec tree (the files in assets/talents/). Pure functions, no DOM.
//
// A build is { ranks: Map<nodeId, points>, entry: Map<nodeId, chosen entry index>, hero: heroTreeId | null }.
// Free talents (granted by the spec) are always on and never appear in `ranks`.

import { decodeLoadoutCode, encodeLoadoutCode } from "../../lib/loadout-code.mjs";

/** A real choice between entries (a few two-entry nodes are fixed for a given spec). */
export const isChoice = (node) => node.kind === "choice" && !node.single;

export const BUDGET = { class: 34, spec: 34, hero: 13 };

export function emptyBuild(tree) {
  return { ranks: new Map(), entry: new Map(), hero: tree.heroTrees[0]?.id ?? null };
}

/** Nodes that belong to the build's side of the tree: class, spec and the chosen hero tree. */
export const activeNodes = (tree, build) => tree.nodes.filter((n) => n.tree !== "hero" || n.hero === build.hero);

const parentsOf = (tree) => {
  if (!tree._parents) {
    const map = new Map();
    for (const n of tree.nodes) for (const to of n.next || []) {
      if (!map.has(to)) map.set(to, []);
      map.get(to).push(n);
    }
    tree._parents = map;
  }
  return tree._parents;
};

export const rankOf = (build, node) => (node.free ? node.max : build.ranks.get(node.id) || 0);

export function spent(tree, build, treeName) {
  let sum = 0;
  for (const n of activeNodes(tree, build)) if (n.tree === treeName && !n.free) sum += build.ranks.get(n.id) || 0;
  return sum;
}

// Hero trees have no real gates: their one requirement is the free keystone at the top.
const gateOf = (node) => (node.tree === "hero" ? 0 : node.req || 0);

/** Points spent in talents that sit above a gate (talents whose own requirement is lower than `req`). */
function spentAbove(tree, build, node) {
  let sum = 0;
  for (const n of activeNodes(tree, build)) {
    if (n.tree !== node.tree || n.free || gateOf(n) >= gateOf(node)) continue;
    sum += build.ranks.get(n.id) || 0;
  }
  return sum;
}

/** A talent is reachable when it starts a tree or a talent leading into it is fully taken. */
function reachable(tree, build, node) {
  const parents = (parentsOf(tree).get(node.id) || []).filter((p) => p.tree !== "hero" || p.hero === build.hero);
  if (!parents.length) return true;
  return parents.some((p) => rankOf(build, p) >= p.max);
}

/** Why a point can't go into this talent right now, or "" when it can. */
export function blockedReason(tree, build, node) {
  if (node.free) return "Granted for free";
  if ((build.ranks.get(node.id) || 0) >= node.max) return "Full";
  if (spent(tree, build, node.tree) >= BUDGET[node.tree]) return `All ${BUDGET[node.tree]} points spent`;
  if (gateOf(node) && spentAbove(tree, build, node) < gateOf(node)) return `Needs ${gateOf(node)} points spent above it`;
  if (!reachable(tree, build, node)) return "Take a talent leading to it first";
  return "";
}

export const canAdd = (tree, build, node) => blockedReason(tree, build, node) === "";

/** Every taken talent must still be reachable and past its gate. */
export function isValid(tree, build) {
  for (const n of activeNodes(tree, build)) {
    if (n.free || !(build.ranks.get(n.id) > 0)) continue;
    if (gateOf(n) && spentAbove(tree, build, n) < gateOf(n)) return false;
    if (!reachable(tree, build, n)) return false;
  }
  for (const name of ["class", "spec", "hero"]) if (spent(tree, build, name) > BUDGET[name]) return false;
  return true;
}

export function canRemove(tree, build, node) {
  const have = build.ranks.get(node.id) || 0;
  if (node.free || have < 1) return false;
  const trial = { ...build, ranks: new Map(build.ranks) };
  if (have === 1) trial.ranks.delete(node.id); else trial.ranks.set(node.id, have - 1);
  return isValid(tree, trial);
}

/** Switch hero tree. Hero trees are small enough that you take everything, so it fills the tree for you. */
export function chooseHero(tree, build, heroId) {
  const ranks = new Map(build.ranks);
  const entry = new Map(build.entry);
  for (const n of tree.nodes) {
    if (n.tree !== "hero") continue;
    if (n.hero === heroId && !n.free) ranks.set(n.id, n.max);
    else { ranks.delete(n.id); entry.delete(n.id); }
  }
  return { ranks, entry, hero: heroId };
}

/** Read a loadout code into a build. Returns null if the code doesn't fit this spec's tree. */
export function buildFromCode(tree, code) {
  const d = decodeLoadoutCode(code, tree.order);
  if (!d.ok || (d.specId && d.specId !== tree.specId)) return null;
  const build = { ranks: new Map(), entry: new Map(), hero: null };
  const heroCount = new Map();
  const picked = [];
  for (const n of tree.nodes) {
    const sel = d.nodes.get(n.id) || (n.alt || []).map((id) => d.nodes.get(id)).find(Boolean);
    if (!sel) continue;
    picked.push([n, sel]);
    if (n.tree === "hero") heroCount.set(n.hero, (heroCount.get(n.hero) || 0) + 1);
  }
  const choice = d.nodes.get(tree.selectionNode)?.choice;
  build.hero = (choice != null && tree.heroTrees[choice]?.id)
    ?? [...heroCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? tree.heroTrees[0]?.id ?? null;
  for (const [n, sel] of picked) {
    if (n.tree === "hero" && n.hero !== build.hero) continue;
    if (isChoice(n)) build.entry.set(n.id, Math.min(sel.choice ?? 0, n.entries.length - 1));
    if (n.free || !sel.purchased) continue;
    build.ranks.set(n.id, Math.min(sel.rank ?? n.max, n.max));
  }
  return build;
}

/** The node states an export code needs for this build. */
export function nodeStates(tree, build) {
  const nodes = new Map();
  for (const n of activeNodes(tree, build)) {
    if (n.free) { nodes.set(n.id, { purchased: false, rank: null, choice: null }); continue; }
    const rank = build.ranks.get(n.id) || 0;
    if (!rank) continue;
    nodes.set(n.id, {
      purchased: true,
      rank: rank < n.max ? rank : null,
      choice: isChoice(n) ? build.entry.get(n.id) || 0 : null
    });
  }
  const heroIndex = tree.heroTrees.findIndex((h) => h.id === build.hero);
  if (tree.selectionNode && heroIndex >= 0 && spent(tree, build, "hero") > 0) {
    nodes.set(tree.selectionNode, { purchased: true, rank: null, choice: heroIndex });
  }
  return nodes;
}

export function codeFromBuild(tree, build) {
  return encodeLoadoutCode({ specId: tree.specId, nodeOrder: tree.order, nodes: nodeStates(tree, build) });
}
