// Mythic+ season guide: what each key level adds, this week's Bargain, dungeon timers and rating rewards.

import { SEASON, AFFIX_LADDER, BARGAINS } from "../../data/mythic.js";
import { $, html, raw } from "../../lib/dom.js";
import { on } from "../../lib/events.js";
import { fetchWeeklyAffixes } from "../../lib/raiderio.js";
import { listCharacters } from "../tracker/store.js";
import { getMythicContext, setBargain, applyLiveAffixes } from "../builds/mythic-context.js";
import { keyPanelHtml, bindKeyPanel } from "./key-panel.js";

let els = {};
let askedLive = false;

export function initMplusView() {
  els = {
    view: $("#view-mplus"),
    ladder: $("#mplusLadder"),
    key: $("#mplusKey"),
    bargains: $("#mplusBargains"),
    dungeons: $("#mplusDungeons"),
    rewards: $("#mplusRewards")
  };

  bindKeyPanel(els.key);

  els.bargains.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bargain-pick]");
    if (!btn) return;
    const { bargain } = getMythicContext();
    setBargain(btn.dataset.bargainPick === bargain ? "" : btn.dataset.bargainPick);
  });

  on("mythic:changed", () => { if (!els.view.hidden) renderLive(); });
}

export function showMplus() {
  renderLive();
  renderDungeons();
  renderRewards();
  if (!askedLive) {
    askedLive = true;
    const region = listCharacters()[0]?.region || "us";
    fetchWeeklyAffixes(region).then((names) => { if (names) applyLiveAffixes(names); });
  }
}

/** The parts that change with the key settings. */
function renderLive() {
  renderLadder();
  renderKey();
  renderBargains();
}

const range = (r) => (r.to == null ? `+${r.from} and up` : r.from === r.to ? `+${r.from}` : `+${r.from} to +${r.to}`);

function renderLadder() {
  const { keyLevel } = getMythicContext();
  els.ladder.innerHTML = html`
    <header class="card-head">
      <div>
        <h2 class="card-title">What each key level adds</h2>
        <p class="card-sub">Affixes come from the key level now, not a weekly list. The rows that apply to your +${keyLevel} are lit.</p>
      </div>
    </header>
    <ol class="ladder">
      ${AFFIX_LADDER.map((r) => {
        const on = keyLevel >= r.from && (r.to == null || keyLevel <= r.to);
        return raw(html`
          <li class="rung${on ? " is-on" : ""}">
            <span class="rung-range">${range(r)}</span>
            <div>
              <p class="rung-name">${r.name}${on ? raw(`<span class="visually-hidden"> (active at your key level)</span>`) : ""}</p>
              <p class="rung-text">${r.text}</p>
            </div>
          </li>`);
      })}
    </ol>
  `;
}

function renderKey() {
  const focused = document.activeElement?.closest?.("#mplusKey") ? document.activeElement : null;
  const focusKey = focused?.dataset.keyStep ? `[data-key-step="${focused.dataset.keyStep}"]`
    : focused?.dataset.weekAffix ? `[data-week-affix="${focused.dataset.weekAffix}"]`
    : focused?.matches("[data-bargain]") ? "[data-bargain]" : focused?.matches("[data-key-level]") ? "[data-key-level]" : null;
  els.key.innerHTML = html`
    <h2 class="card-title">Your key</h2>
    <p class="card-sub">Set it once. Build pages use it to re-rank stats and add reminders.</p>
    ${raw(keyPanelHtml("mplusKey"))}
  `;
  if (focusKey) {
    const next = $(focusKey, els.key);
    (next && !next.disabled ? next : $("[data-key-level]", els.key))?.focus();
  }
}

function renderBargains() {
  const { bargain, keyLevel, active } = getMythicContext();
  const note = active.bargain
    ? "Tap the one that's up this week."
    : keyLevel >= 12
      ? `At +${keyLevel} the Bargain is replaced by Xal'atath's Guile.`
      : `Bargains start at +5, so your +${keyLevel} doesn't have one.`;
  els.bargains.innerHTML = html`
    <header class="section-head">
      <div>
        <h2 class="section-title">Xal'atath's Bargains</h2>
        <p class="muted">One is active each week on +5 to +11. ${note}</p>
      </div>
    </header>
    <div class="bargains">
      ${BARGAINS.map((b) => raw(html`
        <button type="button" class="bargain${b.key === bargain ? " is-active" : ""}" data-bargain-pick="${b.key}" aria-pressed="${String(b.key === bargain)}">
          <span class="bargain-name">${b.name}</span>
          <span class="bargain-todo">${b.todo}</span>
          <span class="bargain-reward">Reward: ${b.reward.toLowerCase()}</span>
        </button>`))}
    </div>
  `;
}

const clock = (minutes) => {
  const total = Math.round(minutes * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function renderDungeons() {
  els.dungeons.innerHTML = html`
    <header class="section-head">
      <div>
        <h2 class="section-title">${SEASON.name} dungeons</h2>
        <p class="muted">Beat the timer to upgrade your key by one level. Finish with 20% of the timer left for +2, or 40% left for +3.</p>
      </div>
    </header>
    <div class="table-wrap card">
      <table class="timers">
        <thead>
          <tr><th scope="col">Dungeon</th><th scope="col">Timer</th><th scope="col">+2 by</th><th scope="col">+3 by</th></tr>
        </thead>
        <tbody>
          ${SEASON.dungeons.map((d) => raw(html`
            <tr>
              <th scope="row">
                <span class="timer-name">${d.name}</span>
                <span class="timer-from">${d.isNew ? "New this season" : d.from}</span>
              </th>
              <td>${clock(d.minutes)}</td>
              <td>${clock(d.minutes * 0.8)}</td>
              <td>${clock(d.minutes * 0.6)}</td>
            </tr>`))}
        </tbody>
      </table>
    </div>
    <p class="fine">Timers are from community guides for Season 2. Blizzard adjusts them now and then, so trust the in-game timer if they differ.</p>
  `;
}

function renderRewards() {
  els.rewards.innerHTML = html`
    <header class="section-head">
      <div>
        <h2 class="section-title">What to aim for</h2>
        <p class="muted">Rating comes from your best timed run in each dungeon.</p>
      </div>
    </header>
    <ul class="milestones-row">
      ${SEASON.milestones.map((m) => raw(html`
        <li class="card milestone-card">
          <p class="stat-card-num">${m.rating.toLocaleString()}</p>
          <p class="stat-card-label">${m.name}</p>
          <p class="muted">${m.reward}</p>
        </li>`))}
    </ul>
    <ul class="mplus-notes">
      <li>Time a +10 in a dungeon to unlock its teleport for the season.</li>
      <li>The Great Vault's dungeon row pays out from your best, 4th-best and 8th-best run of the week. <a href="#weekly">Plan it in This week</a>.</li>
      <li>Missing a lust or a dispel for the week's Bargain? <a href="#party">Check your group</a> before the key goes in.</li>
    </ul>
  `;
}
