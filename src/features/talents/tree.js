// Retail talent tree viewer. Draws a spec's class, hero and spec trees and lights up the talents
// a loadout code selects. View-only: it shows a build, it doesn't edit one.

import { html, raw } from "../../lib/dom.js";
import { decodeLoadoutCode } from "../../lib/loadout-code.mjs";

export const ICON = (name) => `https://wow.zamimg.com/images/wow/icons/large/${name || "inv_misc_questionmark"}.jpg`;
const SPELL_URL = (id) => `https://www.wowhead.com/spell=${id}`;
const cache = new Map(); // "class-spec" -> Promise<tree | null>

export function loadSpecTree(classSlug, specSlug) {
  const key = `${classSlug}-${specSlug}`;
  if (!cache.has(key)) {
    cache.set(key, fetch(`/assets/talents/${key}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null));
  }
  return cache.get(key);
}

/**
 * Works out what a loadout code selects on a tree.
 * Returns null when the code can't be read against this tree (for example after a patch reshuffles nodes).
 */
export function readBuild(tree, code) {
  const decoded = decodeLoadoutCode(code, tree.order);
  if (!decoded.ok || (decoded.specId && decoded.specId !== tree.specId)) return null;

  const picks = new Map(); // node id -> { rank, entry }
  const points = { class: 0, spec: 0, hero: 0 };
  const heroCount = new Map();
  for (const node of tree.nodes) {
    const sel = decoded.nodes.get(node.id) || (node.alt || []).map((id) => decoded.nodes.get(id)).find(Boolean);
    if (!sel) continue;
    const rank = sel.rank ?? node.max;
    const entry = node.kind === "choice" ? Math.min(sel.choice ?? 0, node.entries.length - 1) : 0;
    picks.set(node.id, { rank, entry, free: !sel.purchased });
    if (sel.purchased) points[node.tree] += rank;
    if (node.tree === "hero") heroCount.set(node.hero, (heroCount.get(node.hero) || 0) + 1);
  }
  // The active hero tree is the one the build actually put points in.
  const activeHero = [...heroCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? tree.heroTrees[0]?.id ?? null;
  // Only count hero points in the active tree.
  points.hero = tree.nodes
    .filter((n) => n.tree === "hero" && n.hero === activeHero && picks.has(n.id) && !picks.get(n.id).free)
    .reduce((sum, n) => sum + picks.get(n.id).rank, 0);
  return { picks, points, activeHero };
}

function shownEntry(node, pick) {
  if (node.kind === "tiered") {
    // Tiered talents stack ranks through their entries; show the tier the build has reached.
    let left = pick ? pick.rank : 0;
    for (const e of node.entries) {
      if (left <= (e.ranks || 1)) return e;
      left -= e.ranks || 1;
    }
    return node.entries[node.entries.length - 1];
  }
  return node.entries[pick ? pick.entry : 0];
}

function nodeLabel(node, pick) {
  const entry = shownEntry(node, pick);
  const names = node.kind === "choice" ? node.entries.map((e) => e.name).join(" or ") : entry.name;
  if (!pick) return `${names}, not taken`;
  const rank = node.max > 1 ? `, rank ${pick.rank} of ${node.max}` : "";
  const chosen = node.kind === "choice" ? `${entry.name} (chosen over ${node.entries.filter((e) => e !== entry).map((e) => e.name).join(", ")})` : entry.name;
  return `${chosen}, taken${rank}`;
}

function panelHtml(title, nodes, picks, note = "") {
  if (!nodes.length) return "";
  const minRow = Math.min(...nodes.map((n) => n.row));
  const minCol = Math.min(...nodes.map((n) => n.col));
  const rows = Math.max(...nodes.map((n) => n.row)) - minRow + 1;
  const cols = Math.max(...nodes.map((n) => n.col)) - minCol + 1;
  const at = new Map(nodes.map((n) => [n.id, { x: n.col - minCol + 0.5, y: n.row - minRow + 0.5 }]));

  const lines = [];
  for (const n of nodes) {
    for (const to of n.next || []) {
      const a = at.get(n.id);
      const b = at.get(to);
      if (!b) continue;
      const lit = picks.has(n.id) && picks.has(to);
      lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${lit ? "is-on" : ""}" />`);
    }
  }

  const cells = nodes.map((n) => {
    const pick = picks.get(n.id);
    const entry = shownEntry(n, pick);
    const other = n.kind === "choice" && !pick ? n.entries[1] : null;
    return html`
      <a class="tnode${pick ? " is-on" : ""}${n.kind ? ` is-${n.kind}` : ""}" style="grid-row:${n.row - minRow + 1};grid-column:${n.col - minCol + 1}"
        href="${SPELL_URL(entry.spell)}" target="_blank" rel="noopener noreferrer" aria-label="${nodeLabel(n, pick)}" data-tip="${nodeLabel(n, pick)}">
        <img src="${ICON(entry.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async" />
        ${other ? raw(html`<img class="tnode-alt" src="${ICON(other.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async" />`) : ""}
        ${pick && n.max > 1 ? raw(html`<span class="tnode-rank" aria-hidden="true">${pick.rank}/${n.max}</span>`) : ""}
      </a>`;
  }).join("");

  return html`
    <section class="tree-panel">
      <header class="tree-panel-head">
        <h4>${title}</h4>
        ${note ? raw(html`<span class="muted">${note}</span>`) : ""}
      </header>
      <div class="tree-scroll">
        <div class="tree-grid" style="--cols:${cols};--rows:${rows}">
          <svg class="tree-lines" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" aria-hidden="true">${raw(lines.join(""))}</svg>
          ${raw(cells)}
        </div>
      </div>
    </section>`;
}

/** HTML for a full tree with a build applied. `build` comes from readBuild(). */
export function treeHtml(tree, build) {
  const { picks, points, activeHero } = build;
  const hero = tree.heroTrees.find((h) => h.id === activeHero) || tree.heroTrees[0];
  const of = (name) => tree.nodes.filter((n) => n.tree === name);
  const heroNodes = hero ? tree.nodes.filter((n) => n.tree === "hero" && n.hero === hero.id) : [];
  return html`
    <div class="tree-panels">
      ${raw(panelHtml(`${tree.className} tree`, of("class"), picks, `${points.class} points`))}
      ${raw(panelHtml(hero ? hero.name : "Hero talents", heroNodes, picks, `Hero talents, ${points.hero} points`))}
      ${raw(panelHtml(`${tree.specName} tree`, of("spec"), picks, `${points.spec} points`))}
    </div>`;
}

/* ---------- Tooltips ----------
   Wowhead's tooltip script gives full spell tooltips on hover. It loads on demand; until it has (or if it's
   blocked) a small built-in label shows the talent's name instead. */

let wowheadAsked = false;

function loadWowheadTooltips() {
  if (wowheadAsked) return;
  wowheadAsked = true;
  window.whTooltips = { colorLinks: false, iconizeLinks: false, renameLinks: false };
  const s = document.createElement("script");
  s.src = "https://wow.zamimg.com/js/tooltips.js";
  s.async = true;
  s.onload = () => {
    document.documentElement.classList.add("has-wowhead");
    window.$WowheadPower?.refreshLinks?.();
  };
  document.head.appendChild(s);
}

/** Call after inserting treeHtml() into the page. */
export function activateTree(container) {
  loadWowheadTooltips();
  window.$WowheadPower?.refreshLinks?.();
  container.querySelectorAll(".tnode img").forEach((img) => {
    img.addEventListener("error", () => {
      const fallback = ICON("");
      if (img.src !== fallback) img.src = fallback;
    }, { once: true });
  });
}

/* Built-in label: one floating element shared by every tree on the page. */
let tip = null;

function showTip(node) {
  // Wowhead only decorates links; buttons (the calculator) always use the built-in label.
  if (node.tagName === "A" && document.documentElement.classList.contains("has-wowhead")) return;
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "tree-tip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
  }
  tip.textContent = node.dataset.tip || "";
  tip.hidden = false;
  const r = node.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const left = Math.max(8, Math.min(window.innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2));
  const top = r.top - t.height - 10 < 8 ? r.bottom + 10 : r.top - t.height - 10;
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

function hideTip() {
  if (tip) tip.hidden = true;
}

document.addEventListener("pointerover", (e) => {
  const node = e.target.closest?.(".tnode");
  if (node) showTip(node);
  else hideTip();
});
document.addEventListener("focusin", (e) => {
  const node = e.target.closest?.(".tnode");
  if (node) showTip(node);
  else hideTip();
});
window.addEventListener("scroll", hideTip, { passive: true });
