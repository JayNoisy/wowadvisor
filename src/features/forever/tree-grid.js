// Draws one WoW Forever talent tree the way the game does: a four-column grid of icons with rank counters
// and arrows from each prerequisite. Used by the class pages (view-only) and the planner (clickable).

import { html, raw } from "../../lib/dom.js";
import { ICON } from "../talents/tree.js";

/**
 * @param tree     one tree from FOREVER_TALENTS
 * @param ranks    points per talent, in the tree's talent order
 * @param options  { title, note, main, interactive, treeIndex, state(talent, index) -> { open, why } }
 */
export function foreverTreeGridHtml(tree, ranks, options = {}) {
  const { note = "", main = false, interactive = false, treeIndex = 0, state = () => ({ open: false, why: "" }) } = options;
  const rows = Math.max(...tree.talents.map((t) => t.row));
  const cols = 4;
  const at = (t) => ({ x: t.col - 0.5, y: t.row - 0.5 });

  const lines = tree.talents.filter((t) => t.req).map((t) => {
    const parent = tree.talents.find((x) => x.name === t.req);
    const pi = tree.talents.indexOf(parent);
    const a = at(parent);
    const b = at(t);
    const lit = ranks[pi] >= parent.max;
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${lit ? "is-on" : ""}" />`;
  });

  const cells = tree.talents.map((t, i) => {
    const have = ranks[i] || 0;
    const { open, why } = state(t, i);
    const status = have >= t.max ? "Full" : open ? "Click to add a point" : why;
    const tip = `${t.name} (${have}/${t.max}). ${t.text}${t.req ? ` Requires ${t.req}.` : ""}${interactive && status ? ` ${status}.` : ""}`;
    const cls = `tnode fnode${have ? " is-on" : ""}${have && have < t.max ? " is-part" : ""}${open ? " is-open" : ""}`;
    const style = `grid-row:${t.row};grid-column:${t.col}`;
    const inner = html`
      <img src="${ICON(t.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async" />
      <span class="tnode-rank${have ? "" : " is-zero"}" aria-hidden="true">${have}/${t.max}</span>`;
    return interactive
      ? html`<button type="button" class="${cls}" style="${style}" data-add="${treeIndex}.${i}" aria-label="${tip}" data-tip="${tip}">${raw(inner)}</button>`
      : html`<span class="${cls}" style="${style}" tabindex="0" role="img" aria-label="${tip}" data-tip="${tip}">${raw(inner)}</span>`;
  }).join("");

  const spent = ranks.reduce((a, b) => a + (b || 0), 0);
  return html`
    <section class="ftree fgrid${main ? " is-main" : ""}${spent || interactive ? "" : " is-empty"}">
      <header class="ftree-head">
        <h5>${tree.name}</h5>
        <span class="ftree-spent">${note || `${spent} ${spent === 1 ? "point" : "points"}`}</span>
      </header>
      <div class="tree-grid ftree-grid" style="--cols:${cols};--rows:${rows}">
        <svg class="tree-lines" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" aria-hidden="true">${raw(lines.join(""))}</svg>
        ${raw(cells)}
      </div>
    </section>`;
}

// Swap in a placeholder for any talent icon that fails to load (error events don't bubble, so listen in capture).
document.addEventListener("error", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.closest?.(".fnode")) return;
  const fallback = ICON("");
  if (img.src !== fallback) img.src = fallback;
}, true);
