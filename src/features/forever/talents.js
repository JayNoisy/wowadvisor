// The talent section of a WoW Forever tree page: the recommended build drawn on the real trees,
// and the order to take its talents in while leveling.

import { html, raw } from "../../lib/dom.js";
import { FOREVER_TALENTS, FOREVER_TALENTS_REVIEWED, FOREVER_TALENTS_SOURCE, FOREVER_LAYOUT_SOURCE, FOREVER_LEVELING_SOURCE } from "../../data/forever-talents.js";
import { foreverTreeGridHtml } from "./tree-grid.js";

const FIRST_POINT_LEVEL = 10;

/** The planner's link format: one digit per talent, trees joined with "-". */
function planCode(data, build) {
  return data.trees.map((t) => t.talents.map((x) => build.points[t.name]?.[x.name] || 0).join("").replace(/0+$/, "")).join("-");
}

/** Collapse the point-by-point order into "levels 10 to 12: Improved Rend" steps. */
export function levelingSteps(data, build, order = build.order, startLevel = FIRST_POINT_LEVEL, have = new Map()) {
  const steps = [];
  (order || []).forEach((key, n) => {
    const [ti, i] = key.split(".").map(Number);
    const talent = data.trees[ti].talents[i];
    have.set(key, (have.get(key) || 0) + 1);
    const level = startLevel + n;
    const last = steps[steps.length - 1];
    if (last && last.key === key) { last.to = level; last.rank = have.get(key); }
    else steps.push({ key, from: level, to: level, tree: data.trees[ti].name, talent, rank: have.get(key) });
  });
  return steps;
}

const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const pct = (n) => `${n}%`;

function stepsHtml(steps, main) {
  return html`
    <ol class="level-steps">
      ${steps.map((s) => raw(html`
        <li class="level-step${s.talent.max === 1 ? " is-key" : ""}">
          <span class="level-range">${s.from === s.to ? s.from : `${s.from} to ${s.to}`}</span>
          <span class="level-talent"><strong>${s.talent.name}</strong> <span class="muted">${s.rank}/${s.talent.max}${s.tree !== main ? `, ${s.tree}` : ""}</span></span>
          <span class="level-text">${s.talent.text}</span>
        </li>`))}
    </ol>`;
}

/** What's left of the recommended build after the players' order, in a legal order. Null if the two don't fit together. */
function finishOrder(data, build, taken) {
  const have = data.trees.map((t) => t.talents.map(() => 0));
  for (const key of taken) { const [ti, i] = key.split(".").map(Number); have[ti][i]++; }
  const fits = data.trees.every((t, ti) => t.talents.every((x, i) => have[ti][i] <= (build.points[t.name]?.[x.name] || 0)));
  if (!fits) return null;
  const skip = have.map((row) => [...row]);
  return (build.order || []).filter((key) => {
    const [ti, i] = key.split(".").map(Number);
    if (skip[ti][i] > 0) { skip[ti][i]--; return false; }
    return true;
  });
}

function codeOf(data, order) {
  const have = data.trees.map((t) => t.talents.map(() => 0));
  for (const key of order) { const [ti, i] = key.split(".").map(Number); have[ti][i]++; }
  return have.map((row) => row.join("").replace(/0+$/, "")).join("-");
}

/** How this class's players split between the three trees while leveling. */
function sharesHtml(cls, data, tree) {
  if (!data.leveling?.length) return "";
  return html`
    <ul class="level-shares" aria-label="How ${cls.name}s level">
      ${data.leveling.map((l, n) => {
        const name = data.trees.find((t) => slugOf(t.name) === l.tree)?.name || l.tree;
        return raw(html`
          <li class="level-share${l.tree === tree.slug ? " is-current" : ""}">
            <a href="#forever/${cls.slug}/${l.tree}"><strong>${pct(l.share)}</strong> ${name}${n === 0 ? raw(` <span class="level-share-top">most popular</span>`) : ""}</a>
            <span class="level-share-bar" aria-hidden="true"><i style="width:${Math.max(4, l.share)}%"></i></span>
          </li>`);
      })}
    </ul>`;
}

function orderHtml(cls, tree, data, build) {
  const main = data.trees[build.split.indexOf(Math.max(...build.split))].name;
  const community = data.leveling?.find((l) => l.tree === tree.slug);

  if (!community) {
    const steps = levelingSteps(data, build);
    if (!steps.length) return "";
    return html`
      <section class="level-order" aria-labelledby="orderHeading">
        <h4 id="orderHeading">What to take at each level</h4>
        <p class="tree-build-note">You get one point per level from 10. This order goes as deep into ${main} as it can, picks up new abilities the moment they open, and reaches the final talent at level 40 where the build has one.</p>
        ${raw(stepsHtml(steps, main))}
      </section>`;
  }

  const have = new Map();
  const steps = levelingSteps(data, build, community.order, FIRST_POINT_LEVEL, have);
  const rest = community.endsAt < 60 ? finishOrder(data, build, community.order) : null;
  const restSteps = rest?.length ? levelingSteps(data, build, rest, community.endsAt + 1, have) : [];
  const top = data.leveling[0];
  const topName = data.trees.find((t) => slugOf(t.name) === top.tree)?.name;
  const full = [...community.order, ...(rest || [])];
  return html`
    <section class="level-order" aria-labelledby="orderHeading">
      <h4 id="orderHeading">What to take at each level</h4>
      <p class="tree-build-note">
        You get one talent point per level from 10. This is the order most players who level as ${tree.name} take them:
        ${pct(community.share)} of ${cls.name} leveling builds lead with ${tree.name}${top.tree === tree.slug ? `, which makes it the most popular way to level a ${cls.name}` : `; ${topName} is the most popular at ${pct(top.share)}`}.
      </p>
      ${raw(sharesHtml(cls, data, tree))}
      ${raw(stepsHtml(steps, tree.name))}
      ${community.endsAt < 60 ? raw(html`
        <p class="level-gap">Players' builds stop agreeing after level ${community.endsAt}. ${restSteps.length
          ? `From there, this finishes the recommended ${build.split.join("/")} build above:`
          : `Their picks so far don't all match the recommended ${build.split.join("/")} build above, so from here either keep going your own way or follow that build's full order instead:`}</p>
        ${restSteps.length ? raw(stepsHtml(restSteps, tree.name)) : raw(html`
          <details class="level-alt">
            <summary>Recommended ${build.split.join("/")} build, level 10 to ${9 + build.total}</summary>
            ${raw(stepsHtml(levelingSteps(data, build), main))}
          </details>`)}`) : ""}
      <p class="level-actions"><a class="btn btn-quiet btn-sm" href="#planner/${cls.slug}/${codeOf(data, full)}">Open where this ends up in the planner</a></p>
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
      ${raw(orderHtml(cls, tree, data, build))}
      <p class="tree-build-source">
        Build credited to ${build.credit}, taken from
        <a href="${FOREVER_TALENTS_SOURCE.url(cls.slug, tree.slug)}" target="_blank" rel="noopener noreferrer">${FOREVER_TALENTS_SOURCE.name}'s ${tree.name} page</a>.
        Tree layout and talent summaries from <a href="${FOREVER_LAYOUT_SOURCE.url}" target="_blank" rel="noopener noreferrer">${FOREVER_LAYOUT_SOURCE.name}</a> (${FOREVER_LAYOUT_SOURCE.license}).
        The two sources were checked against each other on ${FOREVER_TALENTS_REVIEWED}.
        Leveling orders are the most common ones among builds planned on <a href="${FOREVER_LEVELING_SOURCE.url(cls.slug)}" target="_blank" rel="noopener noreferrer">${FOREVER_LEVELING_SOURCE.name}</a> (counted ${FOREVER_LEVELING_SOURCE.counted}), replayed against the game's talent rules; where they stop early, this site works out the rest from the recommended build.
      </p>
    </section>`;
}
