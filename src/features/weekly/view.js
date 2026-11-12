// "This week": reset countdowns, a Great Vault planner and a weekly checklist, per character.

import { VAULT_ROWS, KEY_LEVELS } from "../../data/weekly.js";
import { findClass } from "../../data/classes.js";
import { $, html, raw } from "../../lib/dom.js";
import { formatCountdown, formatDateTime, plural } from "../../lib/format.js";
import { on } from "../../lib/events.js";
import { classStyle } from "../../lib/color.js";
import { icon } from "../../lib/icons.js";
import { toast } from "../../lib/toast.js";
import { listCharacters, weeklyPeriod } from "../tracker/store.js";
import { fetchProfile } from "../../lib/raiderio.js";
import { fetchTokenPrice, formatGold } from "../../lib/token.js";
import {
  GENERAL_ID, getWeek, getTasks, setCount, addKey, setKeys, removeKey, toggleTask, addTask, removeTask, resetTasks, slotsFor
} from "./store.js";

let els = {};
let activeId = null;
let keyLevel = KEY_LEVELS.start;
let tick = null;
let importing = false;
const tokens = {}; // region -> { gold } | null, filled in when the price arrives

export function initWeeklyView() {
  els = {
    view: $("#view-weekly"),
    resets: $("#weeklyResets"),
    chars: $("#weeklyChars"),
    body: $("#weeklyBody")
  };

  els.chars.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-char]");
    if (!chip) return;
    activeId = chip.dataset.char;
    render();
  });

  els.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const c = active();
    const a = btn.dataset.action;
    if (a === "step") setCount(c.id, c.region, btn.dataset.row, (Number(getWeek(c.id, c.region)[btn.dataset.row]) || 0) + Number(btn.dataset.step));
    if (a === "key-step") { keyLevel = Math.max(KEY_LEVELS.min, Math.min(KEY_LEVELS.max, keyLevel + Number(btn.dataset.step))); render(); }
    if (a === "add-key") addKey(c.id, c.region, keyLevel);
    if (a === "remove-key") removeKey(c.id, c.region, Number(btn.dataset.index));
    if (a === "toggle-task") toggleTask(c.id, c.region, btn.dataset.task);
    if (a === "remove-task") removeTask(btn.dataset.task);
    if (a === "import-keys") importKeys(c);
    if (a === "reset-tasks") { resetTasks(); toast("Checklist reset to the starter list."); }
  });

  els.body.addEventListener("submit", (e) => {
    if (!e.target.matches("#taskForm")) return;
    e.preventDefault();
    const input = $("#taskInput", els.body);
    if (addTask(input.value)) requestAnimationFrame(() => $("#taskInput", els.body)?.focus());
  });

  on("weekly:changed", () => { if (!els.view.hidden) render(); });
  on("characters:changed", () => { if (!els.view.hidden) render(); });
}

export function showWeekly() {
  render();
  clearInterval(tick);
  tick = setInterval(() => {
    if (els.view.hidden) return clearInterval(tick);
    renderResets();
  }, 60_000);
}

async function importKeys(c) {
  if (importing) return;
  importing = true;
  renderBody();
  const profile = await fetchProfile({ region: c.region, realm: c.realmSlug || c.realm, name: c.name });
  importing = false;
  if (!profile) {
    toast(`Couldn't get ${c.name}'s runs from Raider.IO. You can still log keys by hand.`, "error");
    renderBody();
    return;
  }
  const levels = profile.weeklyRuns.map((r) => r.level);
  setKeys(c.id, c.region, levels);
  toast(levels.length
    ? `Imported ${plural(levels.length, "key")} for ${c.name} from Raider.IO.`
    : `Raider.IO shows no keys for ${c.name} this week yet.`);
}

function loadToken(region) {
  if (region in tokens) return;
  tokens[region] = null;
  fetchTokenPrice(region).then((price) => {
    if (!price) return;
    tokens[region] = price;
    if (!els.view.hidden) renderResets();
  });
}

function roster() {
  const chars = listCharacters();
  return chars.length ? chars : [{ id: GENERAL_ID, region: "us", name: "My character", realm: "", className: "" }];
}

function active() {
  const list = roster();
  return list.find((c) => c.id === activeId) || list[0];
}

function render() {
  renderResets();
  renderChars();
  renderBody();
}

function renderResets() {
  const c = active();
  const regions = c.id === GENERAL_ID ? ["us", "eu"] : [c.region];
  regions.forEach(loadToken);
  els.resets.innerHTML = regions.map((r) => {
    const p = weeklyPeriod(r);
    return html`
      <div class="reset-chip">
        ${raw(icon("clock"))}
        <span><strong>${formatCountdown(p.next)}</strong> until the ${r.toUpperCase()} weekly reset</span>
        <span class="muted">${formatDateTime(p.next)}, your time</span>
      </div>
      ${tokens[r] ? raw(html`
        <div class="reset-chip token-price">
          ${raw(icon("coins"))}
          <span>WoW Token: <strong>${formatGold(tokens[r].gold)}</strong></span>
          <span class="muted">${r.toUpperCase()} price right now</span>
        </div>`) : ""}`;
  }).join("");
}

function renderChars() {
  const list = roster();
  const c = active();
  if (list.length === 1 && list[0].id === GENERAL_ID) {
    els.chars.innerHTML = html`<p class="char-picker-empty muted">Tracking one general list. <a href="#armory">Look up a character in Armory</a> to track each of your characters separately.</p>`;
    return;
  }
  els.chars.innerHTML = list.map((ch) => {
    const cls = findClass(ch.className);
    return html`
      <button type="button" class="char-tab${ch.id === c.id ? " is-active" : ""}" data-char="${ch.id}" aria-pressed="${String(ch.id === c.id)}" style="${classStyle(cls?.color || "#8f96a3")}">
        ${cls ? raw(html`<img src="${cls.icon}" alt="" width="28" height="28" />`) : ""}
        <span>${ch.name}</span>
      </button>`;
  }).join("");
}

function vaultRow(row, week, canImport) {
  const { count, unlocked, next } = slotsFor(row, week);
  const isKeys = row.key === "dungeons";
  const hint = next == null
    ? "All three slots unlocked."
    : `${plural(next - count, `more ${row.unit}`, `more ${row.unitPlural}`)} for slot ${unlocked + 1}.`;

  return html`
    <div class="vault-row">
      <div class="vault-row-head">
        <h3>${row.label}</h3>
        <p class="muted">${row.help}</p>
      </div>
      <ol class="vault-slots" aria-label="${row.label}: ${unlocked} of 3 slots unlocked">
        ${row.thresholds.map((t, i) => {
          const open = count >= t;
          const keyNote = isKeys && open ? `+${week.keys[t - 1]}` : null;
          return raw(html`
            <li class="vault-slot${open ? " is-open" : ""}">
              <span class="vault-slot-mark">${raw(open ? icon("check") : icon("tracker"))}</span>
              <span class="vault-slot-need">${keyNote ? `Pays out at ${keyNote}` : `${t} ${t === 1 ? row.unit : row.unitPlural}`}</span>
            </li>`);
        })}
      </ol>
      <div class="vault-input">
        ${isKeys ? raw(html`
          <div class="key-log">
            <div class="stepper" role="group" aria-label="Key level to log">
              <button type="button" class="stepper-btn" data-action="key-step" data-step="-1" aria-label="Lower key level" ${keyLevel <= KEY_LEVELS.min ? "disabled" : ""}>−</button>
              <input type="text" value="+${keyLevel}" readonly aria-label="Key level" tabindex="-1" />
              <button type="button" class="stepper-btn" data-action="key-step" data-step="1" aria-label="Raise key level" ${keyLevel >= KEY_LEVELS.max ? "disabled" : ""}>+</button>
            </div>
            <button type="button" class="btn btn-quiet btn-sm" data-action="add-key">Log a +${keyLevel}</button>
          </div>
          ${week.keys.length ? raw(html`
            <ul class="key-chips" aria-label="Keys logged this week">
              ${week.keys.map((k, i) => raw(html`<li><button type="button" class="key-chip${[0, 3, 7].includes(i) ? " is-slot" : ""}" data-action="remove-key" data-index="${i}" aria-label="Remove +${k}" title="Remove">+${k}</button></li>`))}
            </ul>`) : ""}
          ${canImport ? raw(html`
            <div class="vault-import">
              <button type="button" class="btn btn-quiet btn-sm" data-action="import-keys" ${importing ? "disabled" : ""}>${raw(icon("refresh"))}${importing ? "Importing…" : "Import from Raider.IO"}</button>
              <span class="muted">Replaces the list with this week's runs.</span>
            </div>`) : ""}`)
        : raw(html`
          <div class="stepper" role="group" aria-label="${row.label} count">
            <button type="button" class="stepper-btn" data-action="step" data-row="${row.key}" data-step="-1" aria-label="One fewer" ${count <= 0 ? "disabled" : ""}>−</button>
            <input type="text" value="${count}" readonly aria-label="${row.label}: ${count} ${row.unitPlural}" tabindex="-1" />
            <button type="button" class="stepper-btn" data-action="step" data-row="${row.key}" data-step="1" aria-label="One more" ${count >= row.max ? "disabled" : ""}>+</button>
          </div>`)}
        <p class="vault-hint">${hint}</p>
      </div>
    </div>`;
}

function renderBody() {
  const c = active();
  const week = getWeek(c.id, c.region);
  const tasks = getTasks();
  const totalSlots = VAULT_ROWS.reduce((sum, row) => sum + slotsFor(row, week).unlocked, 0);
  const done = tasks.filter((t) => week.done[t.id]).length;

  els.body.innerHTML = html`
    <section class="card vault" aria-labelledby="vaultHeading">
      <header class="card-head">
        <div>
          <h2 id="vaultHeading" class="card-title">Great Vault</h2>
          <p class="card-sub">Count what you've done and see which reward slots open next reset.</p>
        </div>
        <p class="big-count" aria-label="${totalSlots} of 9 slots unlocked"><strong>${totalSlots}</strong><span>/9 slots</span></p>
      </header>
      ${VAULT_ROWS.map((row) => raw(vaultRow(row, week, c.id !== GENERAL_ID)))}
    </section>

    <section class="card checklist" aria-labelledby="checkHeading">
      <header class="card-head">
        <div>
          <h2 id="checkHeading" class="card-title">Weekly checklist</h2>
          <p class="card-sub">Make it yours: remove what you skip and add your own.</p>
        </div>
        <p class="big-count" aria-label="${done} of ${tasks.length} done"><strong>${done}</strong><span>/${tasks.length} done</span></p>
      </header>
      <ul class="tasks">
        ${tasks.map((t) => raw(html`
          <li class="task${week.done[t.id] ? " is-done" : ""}">
            <button type="button" class="task-toggle" data-action="toggle-task" data-task="${t.id}" aria-pressed="${String(Boolean(week.done[t.id]))}">
              <span class="task-box">${raw(icon("check"))}</span>
              <span class="task-label">${t.label}</span>
            </button>
            <button type="button" class="icon-btn task-remove" data-action="remove-task" data-task="${t.id}" aria-label="Remove ${t.label} from the checklist">${raw(icon("x"))}</button>
          </li>`))}
      </ul>
      ${tasks.length ? "" : raw(`<p class="muted">Your checklist is empty. Add a task below.</p>`)}
      <form id="taskForm" class="task-form">
        <label class="visually-hidden" for="taskInput">New task</label>
        <input id="taskInput" type="text" maxlength="80" placeholder="Add your own, like &quot;Guild raid Thursday&quot;" autocomplete="off" />
        <button type="submit" class="btn btn-quiet btn-sm">Add task</button>
      </form>
      <button type="button" class="link-btn" data-action="reset-tasks">Restore the starter list</button>
    </section>
  `;
}
