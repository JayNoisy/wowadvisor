// WoW Forever level guide: talent points for your level, what unlocks next, and which dungeons fit.
// Derived from the rules in data/forever.js: first talent point at 10, gold talents at 11/16/21/31
// points in one tree, dual specialization at 40, level cap 60.

import { $, html, raw } from "../../lib/dom.js";
import { clamp, plural } from "../../lib/format.js";
import { KEYS, readString, writeString } from "../../lib/storage.js";
import { icon } from "../../lib/icons.js";
import { FOREVER_DUNGEONS, FOREVER_LEVEL_CAP, FOREVER_RULES } from "../../data/forever.js";

const FIRST_TALENT_LEVEL = 10;
const GOLD_TIERS = [11, 16, 21, 31];
const pointsAt = (level) => Math.max(0, level - (FIRST_TALENT_LEVEL - 1));
const levelFor = (points) => points + (FIRST_TALENT_LEVEL - 1);

const MILESTONES = [
  { level: FIRST_TALENT_LEVEL, title: "First talent point", text: "You earn one point every level from here to 60." },
  ...GOLD_TIERS.map((pts, i) => ({
    level: levelFor(pts),
    title: `${["First", "Second", "Third", "Final"][i]} gold talent`,
    text: `Needs ${pts} points in one tree, so this is the earliest level you can reach it.`
  })),
  { level: 40, title: "Dual specialization", text: "Keep two talent builds and swap between them." },
  { level: FOREVER_LEVEL_CAP, title: "Level cap", text: `${pointsAt(FOREVER_LEVEL_CAP)} talent points in total. Raids and endgame dungeons from here.` }
].sort((a, b) => a.level - b.level);

let els = {};
let level = 20;

export function initLevelsView() {
  els = { body: $("#levelsBody") };

  els.body.addEventListener("input", (e) => {
    if (!e.target.matches("#levelsRange")) return;
    level = clamp(Number(e.target.value) || 1, 1, FOREVER_LEVEL_CAP);
    writeString(KEYS.foreverLevel, String(level));
    renderDetail();
  });
}

export function showLevels() {
  level = clamp(Number(readString(KEYS.foreverLevel, "20")) || 20, 1, FOREVER_LEVEL_CAP);
  els.body.innerHTML = html`
    <div class="card atlas-controls">
      <label class="level-dial" for="levelsRange">
        <span>Your level</span>
        <output id="levelsOut" for="levelsRange">${level}</output>
        <input id="levelsRange" type="range" min="1" max="${FOREVER_LEVEL_CAP}" step="1" value="${level}" />
      </label>
    </div>
    <div id="levelsDetail" class="levels-detail"></div>`;
  renderDetail();
}

function renderDetail() {
  const range = $("#levelsRange", els.body);
  $("#levelsOut", els.body).textContent = String(level);
  range.style.setProperty("--fill", `${((level - 1) / (FOREVER_LEVEL_CAP - 1)) * 100}%`);

  const points = pointsAt(level);
  const next = MILESTONES.find((m) => m.level > level) || null;
  const tiersReached = GOLD_TIERS.filter((t) => points >= t).length;
  const fits = FOREVER_DUNGEONS.filter((d) => level >= d.min && level <= d.max);
  const soon = FOREVER_DUNGEONS.filter((d) => d.min > level && d.min - level <= 5);

  $("#levelsDetail", els.body).innerHTML = html`
    <div class="levels-stats">
      <div class="card stat-card">
        <p class="stat-card-num">${points}</p>
        <p class="stat-card-label">${points === 1 ? "talent point" : "talent points"}</p>
        <p class="muted">${level < FIRST_TALENT_LEVEL
          ? `Talents start at level ${FIRST_TALENT_LEVEL}, ${plural(FIRST_TALENT_LEVEL - level, "level")} from now.`
          : level >= FOREVER_LEVEL_CAP ? "That's every point you'll get."
          : `${plural(pointsAt(FOREVER_LEVEL_CAP) - points, "more point")} by level ${FOREVER_LEVEL_CAP}.`}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-card-num">${tiersReached}<span>/${GOLD_TIERS.length}</span></p>
        <p class="stat-card-label">gold talents in reach</p>
        <p class="muted">If you put every point into one tree.</p>
      </div>
      <div class="card stat-card">
        <p class="stat-card-num">${next ? next.level - level : 0}</p>
        <p class="stat-card-label">${next ? (next.level - level === 1 ? "level to go" : "levels to go") : "levels to go"}</p>
        <p class="muted">${next ? `Next up: ${next.title.toLowerCase()} at ${next.level}.` : "You've unlocked everything on this list."}</p>
      </div>
    </div>

    <div class="levels-cols">
      <section class="card" aria-labelledby="pathTitle">
        <h2 id="pathTitle" class="card-title">Your road to 60</h2>
        <ol class="road">
          ${MILESTONES.map((m) => {
            const state = level >= m.level ? "done" : m === next ? "next" : "later";
            return raw(html`
              <li class="road-stop is-${state}">
                <span class="road-level">${m.level}</span>
                <div>
                  <p class="road-title">${m.title}${state === "done" ? raw(html`<span class="road-check">${raw(icon("check"))}<span class="visually-hidden">Unlocked</span></span>`) : ""}</p>
                  <p class="road-text">${m.text}</p>
                </div>
              </li>`);
          })}
        </ol>
      </section>

      <div class="levels-side">
        <section class="card" aria-labelledby="runTitle">
          <h2 id="runTitle" class="card-title">Dungeons to run now</h2>
          ${fits.length
            ? raw(html`<ul class="mini-list">${fits.map((d) => raw(html`<li><span><strong>${d.name}</strong> <span class="muted">${d.zone}</span></span><span class="mini-range">${d.min}–${d.max}</span></li>`))}</ul>`)
            : raw(html`<p class="card-sub">Nothing fits level ${level} exactly.</p>`)}
          ${soon.length ? raw(html`
            <h3 class="mini-head">Coming up</h3>
            <ul class="mini-list is-soon">${soon.map((d) => raw(html`<li><span><strong>${d.name}</strong> <span class="muted">${d.zone}</span></span><span class="mini-range">${d.min}–${d.max}</span></li>`))}</ul>`) : ""}
          <a class="btn btn-quiet btn-sm mini-more" href="#atlas">See every dungeon and raid</a>
        </section>

        <section class="card" aria-labelledby="rulesTitle">
          <h2 id="rulesTitle" class="card-title">How talents work in Forever</h2>
          <ul class="rule-list">${FOREVER_RULES.map((r) => raw(html`<li>${r}</li>`))}</ul>
        </section>
      </div>
    </div>
  `;
}
