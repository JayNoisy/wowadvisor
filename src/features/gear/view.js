// Gear and upgrades: what a key, raid boss or delve drops, the upgrade tracks, and an upgrade cost calculator.

import { TRACKS, CRESTS, MPLUS_REWARDS, DUNGEON_REWARDS, RAID, DELVES, CRAFTED, GEAR_SEASON, trackByKey, ilvlOf, label, mplusRow } from "../../data/gear.js";
import { KEY_LEVEL } from "../../data/mythic.js";
import { $, html, raw } from "../../lib/dom.js";
import { on } from "../../lib/events.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { getMythicContext, setKeyLevel } from "../builds/mythic-context.js";

let els = {};
const saved = readJson(KEYS.gearCalc, null);
const calc = {
  track: trackByKey(saved?.track) ? saved.track : "hero",
  rank: Number(saved?.rank) >= 1 && Number(saved?.rank) <= 6 ? Number(saved.rank) : 1,
  pieces: Number(saved?.pieces) >= 1 && Number(saved?.pieces) <= 16 ? Number(saved.pieces) : 1
};

const range = (r) => (r.to == null ? `+${r.from} and up` : r.from === r.to ? `+${r.from}` : `+${r.from} to +${r.to}`);
const reward = (x) => html`<strong>${ilvlOf(x)}</strong> <span class="gear-track">${label(x)}</span>`;
const crestName = (key) => `${trackByKey(key).name} Mistcrest`;

export function initGearView() {
  els = { view: $("#view-gear"), body: $("#gearBody") };

  els.body.addEventListener("click", (e) => {
    const step = e.target.closest("[data-gear-key-step]");
    if (step) {
      setKeyLevel(getMythicContext().keyLevel + Number(step.dataset.gearKeyStep));
      $(`[data-gear-key-step="${step.dataset.gearKeyStep}"]`, els.body)?.focus();
      return;
    }
    const rank = e.target.closest("[data-calc-rank]");
    if (rank) {
      calc.rank = Number(rank.dataset.calcRank);
      saveCalc();
      $(`[data-calc-rank="${calc.rank}"]`, els.body)?.focus();
    }
  });
  els.body.addEventListener("change", (e) => {
    if (e.target.matches("[data-gear-key]")) setKeyLevel(Number(e.target.value));
    if (e.target.matches("[data-calc-track]")) { calc.track = e.target.value; saveCalc(); }
    if (e.target.matches("[data-calc-pieces]")) { calc.pieces = Math.min(16, Math.max(1, Number(e.target.value) || 1)); saveCalc(); }
  });
  on("mythic:changed", () => { if (!els.view.hidden) renderKey(); });
}

function saveCalc() {
  writeJson(KEYS.gearCalc, calc);
  renderCalc();
}

export function showGear() {
  els.body.innerHTML = html`
    <div class="gear-top">
      <section class="card" id="gearKey" aria-labelledby="gearKeyHeading"></section>
      <section class="card" id="gearCalc" aria-labelledby="gearCalcHeading"></section>
    </div>
    ${raw(tracksHtml())}
    ${raw(mplusHtml())}
    ${raw(raidHtml())}
    ${raw(delvesHtml())}
    ${raw(craftedHtml())}
    <p class="fine">Item levels are for ${GEAR_SEASON}, from the Warcraft Wiki and the Method and Icy Veins season guides. Blizzard tunes these during a season, so trust the tooltip in game if it differs.</p>
  `;
  renderKey();
  renderCalc();
}

/* ---------- What does my key give? ---------- */
function renderKey() {
  const el = $("#gearKey", els.body);
  if (!el) return;
  const { keyLevel } = getMythicContext();
  const row = mplusRow(keyLevel);
  const focused = document.activeElement?.closest?.("#gearKey")?.dataset;
  el.innerHTML = html`
    <h2 id="gearKeyHeading" class="card-title">What does my key give?</h2>
    <p class="card-sub">Shared with the Mythic+ page and your build pages.</p>
    <div class="key-level">
      <label for="gearKeyLevel">Key level</label>
      <div class="stepper">
        <button type="button" class="stepper-btn" data-gear-key-step="-1" aria-label="Lower key level" ${keyLevel <= KEY_LEVEL.min ? "disabled" : ""}>−</button>
        <input id="gearKeyLevel" data-gear-key type="number" inputmode="numeric" min="${KEY_LEVEL.min}" max="${KEY_LEVEL.max}" value="${keyLevel}" />
        <button type="button" class="stepper-btn" data-gear-key-step="1" aria-label="Raise key level" ${keyLevel >= KEY_LEVEL.max ? "disabled" : ""}>+</button>
      </div>
    </div>
    <dl class="gear-answer" aria-live="polite">
      <div><dt>End of the dungeon</dt><dd>${raw(reward(row.loot))}</dd></div>
      <div><dt>Great Vault next week</dt><dd>${raw(reward(row.vault))}</dd></div>
      <div><dt>Crests from the run</dt><dd><strong>${trackByKey(row.crest).name}</strong> <span class="gear-track">upgrades ${trackByKey(row.crest).name} gear</span></dd></div>
    </dl>
    <p class="gear-hint">${keyLevel >= 10
      ? "Loot and vault rewards stop climbing at +10. Higher keys are for rating."
      : `Next step up: ${nextStep(keyLevel)}`}</p>
  `;
  if (focused?.gearKeyStep) {
    const btn = $(`[data-gear-key-step="${focused.gearKeyStep}"]`, el);
    (btn && !btn.disabled ? btn : $("[data-gear-key]", el))?.focus();
  }
}

function nextStep(level) {
  const now = mplusRow(level);
  for (let l = level + 1; l <= 10; l++) {
    const r = mplusRow(l);
    if (ilvlOf(r.loot) > ilvlOf(now.loot)) return `a +${l} drops ${ilvlOf(r.loot)} at the end.`;
    if (ilvlOf(r.vault) > ilvlOf(now.vault)) return `a +${l} puts ${ilvlOf(r.vault)} in the vault.`;
  }
  return "";
}

/* ---------- Upgrade cost ---------- */
function renderCalc() {
  const el = $("#gearCalc", els.body);
  if (!el) return;
  const track = trackByKey(calc.track);
  const steps = 6 - calc.rank;
  const crests = steps * CRESTS.perUpgrade * calc.pieces;
  const weeks = Math.ceil(crests / CRESTS.weeklyCap);
  el.innerHTML = html`
    <h2 id="gearCalcHeading" class="card-title">Cost to max a piece</h2>
    <p class="card-sub">Each upgrade costs ${CRESTS.perUpgrade} crests of the piece's own track and a little gold. You can earn ${CRESTS.weeklyCap} of each crest a week.</p>
    <div class="calc-row">
      <label class="field">
        <span>Track</span>
        <select data-calc-track>${TRACKS.map((x) => raw(html`<option value="${x.key}" ${x.key === calc.track ? "selected" : ""}>${x.name}</option>`))}</select>
      </label>
      <label class="field">
        <span>Pieces</span>
        <input data-calc-pieces type="number" inputmode="numeric" min="1" max="16" value="${calc.pieces}" />
      </label>
    </div>
    <p class="calc-label" id="calcRankLabel">Current rank</p>
    <div class="segmented rank-pick" role="radiogroup" aria-labelledby="calcRankLabel">
      ${track.ilvls.map((ilvl, i) => raw(html`<button type="button" role="radio" data-calc-rank="${i + 1}" class="${calc.rank === i + 1 ? "is-active" : ""}" aria-checked="${String(calc.rank === i + 1)}" aria-label="Rank ${i + 1} of 6, item level ${ilvl}">${i + 1}/6</button>`))}
    </div>
    <p class="calc-result" aria-live="polite">
      ${steps === 0
        ? raw(html`<strong>Already maxed</strong> at item level ${track.ilvls[5]}.`)
        : raw(html`<strong>${crests.toLocaleString()} ${track.name} Mistcrests</strong> to go from ${track.ilvls[calc.rank - 1]} to ${track.ilvls[5]}${calc.pieces > 1 ? ` on ${calc.pieces} pieces` : ""}. ${weeks > 1 ? `That's at least ${weeks} weeks of the weekly cap.` : "That fits inside one week's cap."}`)}
    </p>
  `;
}

/* ---------- Reference tables ---------- */
function tracksHtml() {
  return html`
    <section class="gear-section" aria-labelledby="tracksHeading">
      <header class="section-head"><div>
        <h2 id="tracksHeading" class="section-title">Upgrade tracks</h2>
        <p class="muted">A piece's track decides how high it can go. The last two ranks of a track match the first two of the next.</p>
      </div></header>
      <div class="table-wrap card">
        <table class="gear-table">
          <thead><tr><th scope="col">Track</th>${[1, 2, 3, 4, 5, 6].map((r) => raw(`<th scope="col">${r}/6</th>`))}<th scope="col" class="col-wide">Where its crests come from</th></tr></thead>
          <tbody>
            ${TRACKS.map((x) => raw(html`
              <tr>
                <th scope="row">${x.name}</th>
                ${x.ilvls.map((i) => raw(`<td>${i}</td>`))}
                <td class="col-wide">${CRESTS.sources[x.key]}</td>
              </tr>`))}
          </tbody>
        </table>
      </div>
    </section>`;
}

function mplusHtml() {
  return html`
    <section class="gear-section" aria-labelledby="mplusLootHeading">
      <header class="section-head"><div>
        <h2 id="mplusLootHeading" class="section-title">Dungeons and Mythic+</h2>
        <p class="muted">The vault column is what that run offers in next week's Great Vault. <a href="#weekly">Plan your vault in This week</a>.</p>
      </div></header>
      <div class="table-wrap card">
        <table class="gear-table">
          <thead><tr><th scope="col">Run</th><th scope="col">End of dungeon</th><th scope="col">Great Vault</th><th scope="col">Crest</th></tr></thead>
          <tbody>
            ${DUNGEON_REWARDS.map((d) => raw(html`<tr><th scope="row">${d.name}</th><td>${raw(reward(d.loot))}</td><td>${raw(reward(d.vault))}</td><td>${trackByKey(d.loot.track).name === "Adventurer" ? "Veteran" : "Champion"}</td></tr>`))}
            ${MPLUS_REWARDS.map((r) => raw(html`<tr><th scope="row">${range(r)}</th><td>${raw(reward(r.loot))}</td><td>${raw(reward(r.vault))}</td><td>${trackByKey(r.crest).name}</td></tr>`))}
          </tbody>
        </table>
      </div>
    </section>`;
}

function raidHtml() {
  return html`
    <section class="gear-section" aria-labelledby="raidLootHeading">
      <header class="section-head"><div>
        <h2 id="raidLootHeading" class="section-title">${RAID.name}</h2>
        <p class="muted">Each difficulty drops one track. Later bosses drop higher ranks of it.</p>
      </div></header>
      <div class="table-wrap card">
        <table class="gear-table">
          <thead><tr><th scope="col">Bosses</th>${RAID.difficulties.map((d) => raw(html`<th scope="col">${d.name}</th>`))}</tr></thead>
          <tbody>
            ${RAID.groups.map((g, gi) => raw(html`
              <tr>
                <th scope="row"><span class="timer-name">${g.name}</span><span class="timer-from">${g.bosses}</span></th>
                ${RAID.difficulties.map((d) => {
                  const special = d.track === "myth" && gi === RAID.groups.length - 1;
                  return raw(special
                    ? html`<td><strong>${RAID.mythicFinalIlvl}</strong> <span class="gear-track">above Myth 6/6</span></td>`
                    : html`<td>${raw(reward({ track: d.track, rank: g.rank }))}</td>`);
                })}
              </tr>`))}
          </tbody>
        </table>
      </div>
    </section>`;
}

function delvesHtml() {
  return html`
    <section class="gear-section" aria-labelledby="delveLootHeading">
      <header class="section-head"><div>
        <h2 id="delveLootHeading" class="section-title">Delves</h2>
        <p class="muted">The chest at the end of a Bountiful delve, and what that tier adds to the vault.</p>
      </div></header>
      <div class="table-wrap card">
        <table class="gear-table">
          <thead><tr><th scope="col">Tier</th><th scope="col">Bountiful chest</th><th scope="col">Great Vault</th></tr></thead>
          <tbody>
            ${DELVES.map((d) => raw(html`<tr><th scope="row">Tier ${d.tier}${d.andUp ? " and up" : ""}</th><td>${raw(reward(d.loot))}</td><td>${raw(reward(d.vault))}</td></tr>`))}
          </tbody>
        </table>
      </div>
    </section>`;
}

function craftedHtml() {
  return html`
    <section class="gear-section" aria-labelledby="craftedHeading">
      <header class="section-head"><div>
        <h2 id="craftedHeading" class="section-title">Crafted gear</h2>
        <p class="muted">Item level depends on what goes into the order and the quality the crafter reaches.</p>
      </div></header>
      <div class="table-wrap card">
        <table class="gear-table">
          <thead><tr><th scope="col">Made with</th>${[1, 2, 3, 4, 5].map((q) => raw(`<th scope="col">Quality ${q}</th>`))}</tr></thead>
          <tbody>
            ${CRAFTED.map((c) => raw(html`<tr><th scope="row"><span class="timer-name">${c.name}</span><span class="timer-from">${c.cost}</span></th>${c.ilvls.map((i) => raw(`<td>${i}</td>`))}</tr>`))}
          </tbody>
        </table>
      </div>
    </section>`;
}
