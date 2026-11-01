// Tracker view: one card per saved character with a toggle per dungeon.

import { DUNGEON_POOL } from "../../data/mythic.js";
import { findClass } from "../../data/classes.js";
import { $, html, raw } from "../../lib/dom.js";
import { formatDateTime, formatCountdown } from "../../lib/format.js";
import { on } from "../../lib/events.js";
import { navigate } from "../../lib/router.js";
import { listCharacters, lockoutPeriod, rollOverResets, toggleLockout, clearLockouts, removeCharacter, getCharacter } from "./store.js";
import { toast } from "../../lib/toast.js";

let els = {};
let tick = null;

export function initTrackerView() {
  els = {
    window: $("#trackerWindow"),
    list: $("#trackerList")
  };

  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.char;
    const action = btn.dataset.action;
    if (action === "toggle") toggleLockout(id, btn.dataset.dungeon);
    if (action === "clear") clearLockouts(id);
    if (action === "remove") {
      const c = getCharacter(id);
      removeCharacter(id);
      if (c) toast(`Removed ${c.name} from your characters.`);
    }
    if (action === "go-armory") navigate({ view: "armory" });
  });

  on("characters:changed", render);
}

export function showTracker() {
  rollOverResets();
  render();
  clearInterval(tick);
  // Keep the countdown honest and roll over automatically if the page stays open across reset.
  tick = setInterval(() => {
    if ($("#view-tracker").hidden) return clearInterval(tick);
    rollOverResets();
    renderWindow();
  }, 60_000);
}

function renderWindow() {
  const chars = listCharacters();
  const region = chars[0]?.region || "us";
  const p = lockoutPeriod(region);
  const cadence = p.cadence === "daily" ? "Daily" : "Weekly";
  els.window.innerHTML = html`
    <span class="window-cadence">${cadence} lockouts</span>
    <span>Resets in <strong>${formatCountdown(p.next)}</strong> (${formatDateTime(p.next)}, ${p.region.toUpperCase()})</span>
    ${p.cadence === "weekly" ? raw(html`<span class="muted">Switches to daily on ${formatDateTime(p.switchAt)}</span>`) : ""}`;
}

function render() {
  renderWindow();
  const chars = listCharacters();
  if (!chars.length) {
    els.list.innerHTML = `
      <div class="empty-state">
        <h3>No characters yet</h3>
        <p>Look up a character in Armory and it's added here automatically, ready to mark off dungeons as you clear them.</p>
        <button type="button" class="btn btn-primary" data-action="go-armory">Find a character</button>
      </div>`;
    return;
  }

  els.list.innerHTML = chars.map((c) => {
    const cls = findClass(c.className);
    const done = DUNGEON_POOL.filter((d) => c.lockouts[d]).length;
    const p = lockoutPeriod(c.region);
    const sub = [c.specName && c.className ? `${c.specName} ${c.className}` : c.className, `${c.realm} (${c.region.toUpperCase()})`].filter(Boolean).join(", ");
    return html`
      <article class="char-card" style="--cc:${cls?.color || "var(--accent)"}">
        <header class="char-head">
          ${cls ? raw(html`<img class="char-crest" src="${cls.icon}" alt="" width="48" height="48" loading="lazy" />`) : raw(`<span class="char-crest char-crest-blank" aria-hidden="true"></span>`)}
          <div class="char-id">
            <h3>${c.name}</h3>
            <p>${sub}</p>
          </div>
          <div class="char-progress" aria-label="${done} of ${DUNGEON_POOL.length} dungeons done">
            <span class="char-count"><strong>${done}</strong>/${DUNGEON_POOL.length}</span>
            <span class="char-bar"><span style="width:${(done / DUNGEON_POOL.length) * 100}%"></span></span>
          </div>
        </header>
        <ul class="dungeons">
          ${DUNGEON_POOL.map((d) => raw(html`
            <li>
              <button type="button" class="dungeon${c.lockouts[d] ? " is-done" : ""}" data-action="toggle" data-char="${c.id}" data-dungeon="${d}" aria-pressed="${String(Boolean(c.lockouts[d]))}">
                <span class="dungeon-mark" aria-hidden="true"></span>
                <span class="dungeon-name">${d}</span>
              </button>
            </li>`))}
        </ul>
        <footer class="char-actions">
          <button type="button" class="link-btn" data-action="clear" data-char="${c.id}" ${done ? "" : "disabled"}>Clear ${p.cadence === "daily" ? "today" : "this week"}</button>
          <button type="button" class="link-btn link-danger" data-action="remove" data-char="${c.id}">Remove character</button>
        </footer>
      </article>`;
  }).join("");
}
