// Tier lists: how specs rank right now for Mythic+, raid and PvP (Retail) or PvE (WoW Forever), by role.
// The data is rebuilt each week from the sources named under every list.

import TIERS from "../../data/tier-list.json";
import { CLASSES } from "../../data/classes.js";
import { FOREVER_CLASSES } from "../../data/forever.js";
import { $, html, raw } from "../../lib/dom.js";
import { classStyle } from "../../lib/color.js";

const MODES = {
  retail: [["mplus", "Mythic+"], ["raid", "Raid"], ["pvp", "PvP"]],
  forever: [["pve", "Dungeons and raids"]]
};
const ROLES = [["dps", "Damage"], ["healer", "Healers"], ["tank", "Tanks"]];
const TIER_ORDER = ["S", "A", "B", "C", "D"];
const BUILD_MODE = { mplus: "aoe", raid: "raid", pvp: "pvp" };

let els = {};
const state = { retail: { mode: "mplus", role: "dps" }, forever: { mode: "pve", role: "dps" } };
const editionNow = () => (document.documentElement.dataset.edition === "forever" ? "forever" : "retail");
const dateText = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function initTiersView() {
  els = { body: $("#tiersBody") };
  els.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tier-mode], [data-tier-role]");
    if (!btn) return;
    const s = state[editionNow()];
    if (btn.dataset.tierMode) s.mode = btn.dataset.tierMode;
    if (btn.dataset.tierRole) s.role = btn.dataset.tierRole;
    render();
    $(btn.dataset.tierMode ? `[data-tier-mode="${s.mode}"]` : `[data-tier-role="${s.role}"]`, els.body)?.focus();
  });
}

export function showTiers() {
  render();
}

function specMeta(edition, spec) {
  const cls = (edition === "retail" ? CLASSES : FOREVER_CLASSES).find((c) => c.slug === spec.classSlug);
  return { color: cls?.color || null, icon: cls?.icon || null };
}

function render() {
  const edition = editionNow();
  const s = state[edition];
  const modes = MODES[edition];
  if (!modes.some(([m]) => m === s.mode)) s.mode = modes[0][0];
  const list = TIERS.lists.find((l) => l.edition === edition && l.mode === s.mode && l.role === s.role);
  const multi = (list?.sources.length || 0) > 1;

  els.body.innerHTML = html`
    <div class="tiers-bar">
      ${modes.length > 1 ? raw(html`
        <div class="segmented" role="radiogroup" aria-label="Content">
          ${modes.map(([m, label]) => raw(html`<button type="button" role="radio" data-tier-mode="${m}" class="${m === s.mode ? "is-active" : ""}" aria-checked="${String(m === s.mode)}">${label}</button>`))}
        </div>`) : ""}
      <div class="segmented" role="radiogroup" aria-label="Role">
        ${ROLES.map(([r, label]) => raw(html`<button type="button" role="radio" data-tier-role="${r}" class="${r === s.role ? "is-active" : ""}" aria-checked="${String(r === s.role)}">${label}</button>`))}
      </div>
    </div>
    ${list ? raw(listHtml(edition, s, list, multi)) : raw(`<p class="muted tiers-empty">No ranking for this yet.</p>`)}
  `;
}

function listHtml(edition, s, list, multi) {
  const rows = TIER_ORDER.map((tier) => [tier, list.specs.filter((x) => x.tier === tier)]).filter(([, specs]) => specs.length);
  return html`
    <section class="card tiers-card" aria-live="polite">
      <ol class="tier-rows">
        ${rows.map(([tier, specs]) => raw(html`
          <li class="tier-row">
            <span class="tier-letter tier-${tier.toLowerCase()}" aria-label="${tier} tier">${tier}</span>
            <ul class="tier-specs">
              ${specs.map((spec) => {
                const meta = specMeta(edition, spec);
                const href = edition === "retail"
                  ? `#builds/${spec.classSlug}/${spec.specSlug}/${BUILD_MODE[s.mode]}`
                  : `#forever/${spec.classSlug}/${spec.specSlug}`;
                const detail = multi ? Object.entries(spec.by).map(([name, t]) => `${name}: ${t}`).join(", ") : "";
                return raw(html`
                  <li>
                    <a class="tier-spec" href="${href}" style="${meta.color ? classStyle(meta.color) : ""}">
                      ${meta.icon ? raw(html`<img src="${meta.icon}" alt="" width="28" height="28" loading="lazy" />`) : ""}
                      <span class="tier-spec-name"><strong>${spec.specName}</strong> ${spec.className}</span>
                      ${detail ? raw(html`<span class="tier-spec-by">${detail}</span>`) : ""}
                    </a>
                  </li>`);
              })}
            </ul>
          </li>`))}
      </ol>
    </section>
    <section class="tiers-about">
      <h2 class="section-title">Where this comes from</h2>
      <ul class="tiers-sources">
        ${list.sources.map((src) => raw(html`<li><a href="${src.url}" target="_blank" rel="noopener noreferrer">${src.name}</a>, updated ${dateText(src.updated)}. ${src.basis}.</li>`))}
      </ul>
      <p class="fine">${multi
        ? "Each spec's tier is the average of the sources above; the small print on each spec shows what each one said."
        : "This list has one source, so treat it as that source's view."}
        Checked ${dateText(TIERS.reviewedAt)} and refreshed weekly. A tier list is a snapshot of opinion and popularity: every spec here clears the content, and the player matters more than the letter. Pick a spec to open its build.</p>
    </section>`;
}
