// The "Your key" controls: key level, this week's Fortified/Tyrannical and Bargain.
// Used on build pages and on the Mythic+ page; both stay in sync through the shared context.

import { BARGAINS, WEEKLY_AFFIX, KEY_LEVEL } from "../../data/mythic.js";
import { html, raw } from "../../lib/dom.js";
import { getMythicContext, setKeyLevel, setWeekAffix, setBargain, activeAffixNames } from "../builds/mythic-context.js";

/** `id` keeps form ids unique when the panel appears on more than one page. */
export function keyPanelHtml(id) {
  const { keyLevel, weekAffix, bargain, live } = getMythicContext();
  const names = activeAffixNames(keyLevel);
  return html`
    <div class="key-level">
      <label for="${id}Level">Key level</label>
      <div class="stepper">
        <button type="button" class="stepper-btn" data-key-step="-1" aria-label="Lower key level" ${keyLevel <= KEY_LEVEL.min ? "disabled" : ""}>−</button>
        <input id="${id}Level" data-key-level type="number" inputmode="numeric" min="${KEY_LEVEL.min}" max="${KEY_LEVEL.max}" value="${keyLevel}" />
        <button type="button" class="stepper-btn" data-key-step="1" aria-label="Raise key level" ${keyLevel >= KEY_LEVEL.max ? "disabled" : ""}>+</button>
      </div>
    </div>

    <div class="key-week">
      <span class="key-week-label" id="${id}WeekLabel">This week is</span>
      <div class="segmented" role="radiogroup" aria-labelledby="${id}WeekLabel">
        ${WEEKLY_AFFIX.map((a) => raw(html`<button type="button" role="radio" data-week-affix="${a.key}" class="${a.key === weekAffix ? "is-active" : ""}" aria-checked="${String(a.key === weekAffix)}">${a.name}</button>`))}
      </div>
    </div>

    <label class="field key-bargain">
      <span>This week's Bargain</span>
      <select data-bargain>
        <option value="">Not sure</option>
        ${BARGAINS.map((b) => raw(html`<option value="${b.key}" ${b.key === bargain ? "selected" : ""}>${b.name}</option>`))}
      </select>
    </label>
    ${live ? raw(`<p class="key-live">This week's affixes were filled in from Raider.IO.</p>`) : ""}

    <div class="key-active">
      <p class="key-active-label">Active on a +${keyLevel}</p>
      <ul class="affix-list">${names.map((n) => raw(html`<li class="affix">${n}</li>`))}</ul>
    </div>
  `;
}

/** Wire a container once; it keeps working across re-renders of its contents. */
export function bindKeyPanel(container) {
  container.addEventListener("click", (e) => {
    const step = e.target.closest("[data-key-step]");
    if (step) setKeyLevel(getMythicContext().keyLevel + Number(step.dataset.keyStep));
    const week = e.target.closest("[data-week-affix]");
    if (week) setWeekAffix(week.dataset.weekAffix);
  });
  container.addEventListener("change", (e) => {
    if (e.target.matches("[data-key-level]")) setKeyLevel(e.target.value);
    if (e.target.matches("[data-bargain]")) setBargain(e.target.value);
  });
}
