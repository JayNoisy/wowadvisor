// WoW Forever dungeons and raids: a level ruler that shows which dungeons fit your level, plus raid cards.

import { $, html, raw } from "../../lib/dom.js";
import { clamp } from "../../lib/format.js";
import { KEYS, readJson, writeJson, readString, writeString } from "../../lib/storage.js";
import { toast } from "../../lib/toast.js";
import { FOREVER_DUNGEONS, FOREVER_RAIDS, FOREVER_RAIDS_OPEN, FOREVER_LEVEL_CAP } from "../../data/forever.js";

const AXIS_MIN = 10;
const AXIS_MAX = FOREVER_LEVEL_CAP;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New in Forever" },
  { key: "classic", label: "Classic" }
];

let els = {};
let level = clamp(Number(readString(KEYS.foreverLevel, "20")) || 20, 1, AXIS_MAX);
let filter = readString(KEYS.foreverDungeonFilter, "all");
let cleared = new Set(readJson(KEYS.foreverCleared, []));

const pos = (lvl) => ((clamp(lvl, AXIS_MIN, AXIS_MAX) - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;

export function initAtlasView() {
  els = {
    level: $("#atlasLevel"),
    out: $("#atlasLevelOut"),
    filter: $("#atlasFilter"),
    ruler: $("#atlasRuler"),
    raids: $("#atlasRaids"),
    raidsSub: $("#raidsSub")
  };
  els.level.value = String(level);

  els.level.addEventListener("input", () => {
    level = clamp(Number(els.level.value) || 1, 1, AXIS_MAX);
    writeString(KEYS.foreverLevel, String(level));
    renderRuler();
  });

  els.filter.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    filter = btn.dataset.filter;
    writeString(KEYS.foreverDungeonFilter, filter);
    renderFilter();
    renderRuler();
  });

  els.ruler.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dungeon]");
    if (!btn) return;
    const name = btn.dataset.dungeon;
    if (cleared.has(name)) cleared.delete(name);
    else {
      cleared.add(name);
      toast(`${name} marked as done.`);
    }
    writeJson(KEYS.foreverCleared, [...cleared]);
    renderRuler();
  });
}

export function showAtlas() {
  renderFilter();
  renderRuler();
  renderRaids();
}

function renderFilter() {
  els.filter.innerHTML = FILTERS.map((f) => html`
    <button type="button" role="radio" data-filter="${f.key}" class="${f.key === filter ? "is-active" : ""}" aria-checked="${String(f.key === filter)}">${f.label}</button>`).join("");
}

function fit(d) {
  if (level >= d.min && level <= d.max) return "now";
  if (d.min > level && d.min - level <= 5) return "soon";
  return d.max < level ? "past" : "later";
}

function renderRuler() {
  els.out.textContent = String(level);
  els.level.style.setProperty("--fill", `${((level - 1) / (AXIS_MAX - 1)) * 100}%`);
  const list = FOREVER_DUNGEONS.filter((d) => filter === "all" || (filter === "new" ? d.isNew : !d.isNew));
  const nowCount = list.filter((d) => fit(d) === "now").length;
  const ticks = [10, 20, 30, 40, 50, 60];

  els.ruler.style.setProperty("--you", `${pos(level)}%`);
  els.ruler.innerHTML = html`
    <p class="ruler-summary">${nowCount
      ? `${nowCount} ${nowCount === 1 ? "dungeon fits" : "dungeons fit"} level ${level}.`
      : `Nothing fits level ${level} exactly. Dungeons just above you are marked as coming up.`}</p>
    <div class="ruler-axis" aria-hidden="true">
      ${ticks.map((t) => raw(html`<span style="left:${pos(t)}%">${t}</span>`))}
    </div>
    <ul class="ruler-rows">
      ${list.map((d) => {
        const state = fit(d);
        const done = cleared.has(d.name);
        const side = d.side ? (d.side === "horde" ? "Horde side" : "Alliance side") : "";
        return raw(html`
          <li class="ruler-row fit-${state}${d.isNew ? " is-new" : ""}${done ? " is-done" : ""}">
            <button type="button" class="ruler-btn" data-dungeon="${d.name}" aria-pressed="${String(done)}"
              aria-label="${d.name}, levels ${d.min} to ${d.max}${done ? ", done" : ""}. ${state === "now" ? "Fits your level." : state === "soon" ? "Coming up soon." : ""}">
              <span class="ruler-label">
                <span class="ruler-name">${d.name}</span>
                <span class="ruler-zone">${d.zone}${side ? `, ${side.toLowerCase()}` : ""}</span>
              </span>
              <span class="ruler-track">
                <span class="ruler-bar" style="left:${pos(d.min)}%;width:${Math.max(pos(d.max) - pos(d.min), 2.4)}%">
                  <span class="ruler-range">${d.min}–${d.max}</span>
                </span>
              </span>
              <span class="ruler-check" aria-hidden="true"></span>
            </button>
            ${d.blurb ? raw(html`<p class="ruler-blurb">${d.blurb}</p>`) : ""}
          </li>`);
      })}
    </ul>
    <p class="ruler-note">New dungeon ranges are from Blizzard's preview. Classic dungeon ranges are the ones used in WoW Classic.</p>
  `;
}

function renderRaids() {
  const opens = new Date(FOREVER_RAIDS_OPEN).getTime();
  const days = Math.ceil((opens - Date.now()) / 86_400_000);
  els.raidsSub.textContent = days > 0
    ? `All three open on December 9, ${days === 1 ? "tomorrow" : `in ${days} days`}.`
    : "All three are open.";
  els.raids.innerHTML = FOREVER_RAIDS.map((r) => html`
    <article class="raid${r.isNew ? " is-new" : ""}">
      <h3 class="raid-name">${r.name}</h3>
      <p class="raid-size">${r.size} players</p>
      <span class="raid-pips" aria-hidden="true">${raw("<i></i>".repeat(r.size))}</span>
      <p class="raid-blurb">${r.blurb}</p>
    </article>`).join("");
}
