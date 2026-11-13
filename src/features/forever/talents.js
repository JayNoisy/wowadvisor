// WoW Forever talent trees with a recommended build lit up. View-only.
// Forever uses classic-style trees: three per class, tiers that unlock every 5 points, 51 points at level 60.

import { html, raw } from "../../lib/dom.js";
import { FOREVER_TALENTS, FOREVER_TALENTS_REVIEWED, FOREVER_TALENTS_SOURCE } from "../../data/forever-talents.js";

const tierLabel = (needs) => (needs === 0 ? "Start" : `${needs} pts`);

function treeColumn(tree, points, isMain) {
  const spent = tree.talents.reduce((sum, t) => sum + (points[t.name] || 0), 0);
  const tiers = [...new Set(tree.talents.map((t) => t.needs))].sort((a, b) => a - b);
  return html`
    <section class="ftree${isMain ? " is-main" : ""}${spent ? "" : " is-empty"}">
      <header class="ftree-head">
        <h5>${tree.name}</h5>
        <span class="ftree-spent">${spent} ${spent === 1 ? "point" : "points"}</span>
      </header>
      <ol class="ftree-tiers">
        ${tiers.map((needs) => raw(html`
          <li class="ftree-tier">
            <span class="ftree-tier-label">${tierLabel(needs)}</span>
            <ul class="ftree-row">
              ${tree.talents.filter((t) => t.needs === needs).map((t) => {
                const have = points[t.name] || 0;
                return raw(html`
                  <li class="ftalent${have ? " is-on" : ""}${have && have < t.max ? " is-part" : ""}" aria-label="${t.name}: ${have ? `${have} of ${t.max} points` : "not taken"}">
                    <span class="ftalent-name">${t.name}</span>
                    <span class="ftalent-rank" aria-hidden="true">${have}/${t.max}</span>
                  </li>`);
              })}
            </ul>
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
        <p class="tree-build-total"><strong>${build.total}</strong> of 51 points</p>
      </header>
      <p class="tree-build-note">
        Lit talents are the ones to take, with how many points each gets. Tiers open as you spend points in that tree, so fill each row before moving down.
        ${left > 0 ? `This build stops at ${build.total} points; spend the last ${left} wherever suits how you play.` : ""}
      </p>
      <div class="ftrees">
        ${data.trees.map((t, i) => raw(treeColumn(t, build.points[t.name] || {}, i === mainIndex)))}
      </div>
      <p class="tree-build-source">
        Build credited to ${build.credit}, taken from
        <a href="${FOREVER_TALENTS_SOURCE.url(cls.slug, tree.slug)}" target="_blank" rel="noopener noreferrer">${FOREVER_TALENTS_SOURCE.name}'s ${tree.name} page</a>
        and checked against the full trees on ${FOREVER_TALENTS_REVIEWED}.
        Rows show each tier; the exact position inside a tier and prerequisite arrows aren't shown.
      </p>
    </section>`;
}
