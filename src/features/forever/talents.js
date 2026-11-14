// The talent section of a WoW Forever tree page: the recommended build drawn on the real trees,
// and the order to take its talents in while leveling.

import { html, raw } from "../../lib/dom.js";
import { FOREVER_TALENTS, FOREVER_TALENTS_REVIEWED, FOREVER_TALENTS_SOURCE, FOREVER_LAYOUT_SOURCE } from "../../data/forever-talents.js";
import { foreverTreeGridHtml } from "./tree-grid.js";

const FIRST_POINT_LEVEL = 10;

/** The planner's link format: one digit per talent, trees joined with "-". */
function planCode(data, build) {
  return data.trees.map((t) => t.talents.map((x) => build.points[t.name]?.[x.name] || 0).join("").replace(/0+$/, "")).join("-");
}

/** Collapse the point-by-point order into "levels 10 to 12: Improved Rend" steps. */
export function levelingSteps(data, build) {
  const steps = [];
  const have = new Map();
  (build.order || []).forEach((key, n) => {
    const [ti, i] = key.split(".").map(Number);
    const talent = data.trees[ti].talents[i];
    have.set(key, (have.get(key) || 0) + 1);
    const level = FIRST_POINT_LEVEL + n;
    const last = steps[steps.length - 1];
    if (last && last.key === key) { last.to = level; last.rank = have.get(key); }
    else steps.push({ key, from: level, to: level, tree: data.trees[ti].name, talent, rank: have.get(key) });
  });
  return steps;
}

function orderHtml(data, build) {
  const steps = levelingSteps(data, build);
  if (!steps.length) return "";
  const main = data.trees[build.split.indexOf(Math.max(...build.split))].name;
  return html`
    <section class="level-order" aria-labelledby="orderHeading">
      <h4 id="orderHeading">What to take at each level</h4>
      <p class="tree-build-note">You get one point per level from 10. This order goes as deep into ${main} as it can, picks up new abilities the moment they open, and reaches the final talent at level 40 where the build has one.</p>
      <ol class="level-steps">
        ${steps.map((s) => raw(html`
          <li class="level-step${s.talent.max === 1 ? " is-key" : ""}">
            <span class="level-range">${s.from === s.to ? s.from : `${s.from} to ${s.to}`}</span>
            <span class="level-talent"><strong>${s.talent.name}</strong> <span class="muted">${s.rank}/${s.talent.max}${s.tree !== main ? `, ${s.tree}` : ""}</span></span>
            <span class="level-text">${s.talent.text}</span>
          </li>`))}
      </ol>
    </section>`;
}

/** The talent section for one Forever tree, or "" when there's no data for it. */
export function foreverTalentsHtml(cls, tree) {
  const data = FOREVER_TALENTS[cls.slug];
  const build = data?.builds?.[tree.slug];
  if (!data || !build) return "";
  const mainIndex = build.split.indexOf(Math.max(...build.split));
  const left = 51 - build.total;
  return html`
    <section class="tree-build" aria-labelledby="buildHeading">
      <header class="tree-build-head">
        <div>
          <p class="pick-badge">Recommended build</p>
          <h4 id="buildHeading">${build.split.join(" / ")} <span class="tree-build-for">${build.purpose}</span></h4>
        </div>
        <div class="tree-build-side">
          <p class="tree-build-total"><strong>${build.total}</strong> of 51 points</p>
          <a class="btn btn-quiet btn-sm" href="#planner/${cls.slug}/${planCode(data, build)}">Change it in the planner</a>
        </div>
      </header>
      <p class="tree-build-note">
        Lit talents are the ones to take. Point at a talent to see what it does.
        ${left > 0 ? `This build stops at ${build.total} points; spend the last ${left} wherever suits how you play.` : ""}
      </p>
      <div class="ftrees fgrids">
        ${data.trees.map((t, i) => raw(foreverTreeGridHtml(t, t.talents.map((x) => build.points[t.name]?.[x.name] || 0), { main: i === mainIndex })))}
      </div>
      ${raw(orderHtml(data, build))}
      <p class="tree-build-source">
        Build credited to ${build.credit}, taken from
        <a href="${FOREVER_TALENTS_SOURCE.url(cls.slug, tree.slug)}" target="_blank" rel="noopener noreferrer">${FOREVER_TALENTS_SOURCE.name}'s ${tree.name} page</a>.
        Tree layout and talent summaries from <a href="${FOREVER_LAYOUT_SOURCE.url}" target="_blank" rel="noopener noreferrer">${FOREVER_LAYOUT_SOURCE.name}</a> (${FOREVER_LAYOUT_SOURCE.license}).
        The two sources were checked against each other on ${FOREVER_TALENTS_REVIEWED}. The level-by-level order is worked out by this site from the build and the game's talent rules.
      </p>
    </section>`;
}
