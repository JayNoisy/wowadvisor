// WoW Forever classes view: class hall, launch clock, class sheet with talent trees, races and class changes.

import { $, $$, html, raw } from "../../lib/dom.js";
import { classStyle, setClassColor } from "../../lib/color.js";
import { navigate } from "../../lib/router.js";
import { KEYS, readString, writeJson, writeString } from "../../lib/storage.js";
import { foreverTalentsHtml } from "./talents.js";
import {
  FOREVER_CLASSES, FOREVER_RULES, FOREVER_LAUNCH, FOREVER_RAIDS_OPEN,
  TALENT_CALC_URL, findForeverClass, findTree, racesFor, roleLabel
} from "../../data/forever.js";

const sel = { cls: null, tree: null };
const FACTIONS = [
  { key: "both", label: "Both" },
  { key: "horde", label: "Horde" },
  { key: "alliance", label: "Alliance" }
];
let faction = readString(KEYS.foreverFaction, "both");
let els = {};
let clockTimer = null;
let rendered = false; // deep links shouldn't jump the page on first load

export function initForeverView() {
  els = {
    view: $("#view-forever"),
    hero: $("#foreverHero"),
    grid: $("#foreverGrid"),
    strip: $("#foreverStrip"),
    clock: $("#foreverClock"),
    sheet: $("#foreverSheet"),
    crest: $("#fvSheetCrest"),
    name: $("#fvSheetName"),
    roles: $("#fvSheetRoles"),
    tabs: $("#treeTabs"),
    plate: $("#treePlate"),
    stats: $("#fvStats"),
    races: $("#fvRaces"),
    baseline: $("#fvBaseline")
  };

  // Tiles and strip items are real links, so the router handles them.
  els.grid.innerHTML = FOREVER_CLASSES.map((c) => html`
    <article class="tile" data-class="${c.slug}" style="${classStyle(c.color)}">
      <a class="tile-link" href="#forever/${c.slug}"><span class="tile-name">${c.name}</span></a>
      <img class="tile-art" src="${c.icon}" alt="" width="96" height="96" decoding="async" />
      <ul class="tile-specs" aria-label="${c.name} talent trees">
        ${c.trees.map((tr) => raw(html`<li><a href="#forever/${c.slug}/${tr.slug}" title="${tr.name} ${c.name}, ${roleLabel(tr.roles)}">${tr.name}</a></li>`))}
      </ul>
    </article>`).join("") + html`
    <a class="tile tile-promo" href="#builds">
      <span class="tile-name">Playing Retail?</span>
      <span class="tile-promo-text">Live talent builds, Great Vault planner, group check and more for Midnight.</span>
    </a>`;

  els.strip.innerHTML = FOREVER_CLASSES.map((c) => html`
    <a class="strip-item" href="#forever/${c.slug}" data-class="${c.slug}" style="${classStyle(c.color)}" title="${c.name}" aria-label="${c.name}">
      <img src="${c.icon}" alt="" width="40" height="40" decoding="async" />
    </a>`).join("");

  els.tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tree]");
    if (!btn || !sel.cls) return;
    navigate({ view: "forever", classSlug: sel.cls.slug, specSlug: btn.dataset.tree }, { replace: true });
  });

  els.tabs.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const items = $$("button", els.tabs);
    const idx = items.indexOf(document.activeElement);
    if (idx < 0) return;
    e.preventDefault();
    let next = idx;
    if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = items.length - 1;
    items[next].focus();
    items[next].click();
  });

  $("#fvChangeClassBtn").addEventListener("click", () => navigate({ view: "forever" }));

  els.races.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-faction]");
    if (!btn) return;
    faction = btn.dataset.faction;
    writeString(KEYS.foreverFaction, faction);
    renderRaces();
  });
}

export function showForeverRoute(route) {
  const cls = findForeverClass(route.classSlug);
  const tree = findTree(cls, route.specSlug) || cls?.trees[0] || null;
  const changedClass = sel.cls?.slug !== cls?.slug;
  sel.cls = cls;
  sel.tree = tree;
  writeJson(KEYS.foreverLast, cls ? { view: "forever", classSlug: cls.slug, specSlug: tree.slug } : { view: "forever" });

  setClassColor(document.documentElement, cls?.color);

  els.view.dataset.state = cls ? "class" : "pick";
  els.hero.hidden = Boolean(cls);
  els.strip.hidden = !cls;
  $$(".strip-item", els.strip).forEach((a) => {
    const active = a.dataset.class === cls?.slug;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });

  startClock();
  els.sheet.hidden = !cls;
  if (!cls) { rendered = true; return; }
  renderSheet();
  if (changedClass && rendered) window.scrollTo({ top: 0 });
  rendered = true;
}

/* ---------- Launch clock ---------- */

function startClock() {
  renderClock();
  clearInterval(clockTimer);
  clockTimer = setInterval(() => {
    if (els.view.hidden) return clearInterval(clockTimer);
    renderClock();
  }, 30_000);
}

function parts(ms) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
}

function renderClock() {
  const now = Date.now();
  const launch = new Date(FOREVER_LAUNCH).getTime();
  const raids = new Date(FOREVER_RAIDS_OPEN).getTime();
  if (now < launch) {
    const { d, h, m } = parts(launch - now);
    els.clock.innerHTML = html`
      <div class="clock-units" aria-label="${d} days, ${h} hours and ${m} minutes until launch">
        <span><strong>${d}</strong>days</span><span><strong>${h}</strong>hours</span><span><strong>${m}</strong>min</span>
      </div>
      <p>until launch on <strong>November 4 at 3:00 p.m. PST</strong>. Raids open December 9.</p>`;
  } else if (now < raids) {
    const { d } = parts(raids - now);
    els.clock.innerHTML = html`
      <div class="clock-units"><span><strong>${d}</strong>${d === 1 ? "day" : "days"}</span></div>
      <p>The servers are live. Barrow Deeps, Hyjal Summit and Onyxia's Lair open on <strong>December 9</strong>.</p>`;
  } else {
    els.clock.innerHTML = html`<p class="clock-live">Live now, with Barrow Deeps, Hyjal Summit and Onyxia's Lair open.</p>`;
  }
}

/* ---------- Class sheet ---------- */

function renderSheet() {
  const { cls, tree } = sel;
  setClassColor(els.sheet, cls.color);
  els.crest.src = cls.icon;
  els.name.textContent = cls.name;
  els.roles.textContent = cls.summary;

  els.tabs.innerHTML = cls.trees.map((tr) => html`
    <button type="button" role="tab" class="spec-tab${tr.slug === tree.slug ? " is-active" : ""}" data-tree="${tr.slug}"
      aria-selected="${String(tr.slug === tree.slug)}" tabindex="${tr.slug === tree.slug ? "0" : "-1"}" aria-controls="treePlate">
      <span class="spec-tab-name">${tr.name}</span>
      <span class="spec-tab-role">${roleLabel(tr.roles)}</span>
    </button>`).join("");

  renderTree();
  renderStats();
  renderRaces();
  renderBaseline();
}

function renderTree() {
  const { cls, tree } = sel;
  const path = tree.path;
  els.plate.innerHTML = html`
    <header class="tree-head">
      <div>
        <h3 class="tree-title">${tree.name}</h3>
        <p class="tree-focus">${tree.focus}</p>
      </div>
    </header>

    ${raw(foreverTalentsHtml(cls, tree))}

    <section class="tree-path" aria-labelledby="pathHeading">
      <h4 id="pathHeading">Gold talents by points spent</h4>
      ${path.length
        ? raw(html`<ol class="milestones">${path.map((m) => raw(html`
            <li class="milestone">
              <span class="milestone-points" aria-label="${m.points} points">${m.points}</span>
              <div>
                <p class="milestone-name">${m.name}</p>
                <p class="milestone-text">${m.text}</p>
              </div>
            </li>`))}</ol>`)
        : raw(html`<p class="muted">Blizzard hasn't shared which ${tree.name} talents sit at the gold tiers yet. The key talents below are confirmed.</p>`)}
    </section>

    <section class="tree-key" aria-labelledby="keyHeading">
      <h4 id="keyHeading">Other talents worth knowing</h4>
      <dl class="key-list">
        ${tree.key.map((k) => raw(html`<div><dt>${k.name}</dt><dd>${k.text}</dd></div>`))}
      </dl>
    </section>

    <section class="tree-loop" aria-labelledby="loopHeading">
      <h4 id="loopHeading">How it plays</h4>
      <ol class="loop">${tree.loop.map((s) => raw(html`<li>${s}</li>`))}</ol>
    </section>

    <footer class="tree-foot">
      <a class="btn btn-primary" href="${TALENT_CALC_URL(cls.slug)}" target="_blank" rel="noopener noreferrer">Plan it in a talent calculator</a>
      <p class="muted">Opens Warcraft Tavern's ${cls.name} calculator in a new tab.</p>
    </footer>
  `;
}

function renderStats() {
  const { tree } = sel;
  els.stats.innerHTML = html`
    <h3 class="panel-title">Stat priority</h3>
    <p class="panel-sub">A starting point for ${tree.name}. Theorycraft will sharpen it after launch.</p>
    <ol class="stat-ladder">
      ${tree.stats.map((s, i) => raw(html`
        <li><span class="stat-rung" style="--w:${Math.max(28, 100 - i * 20)}%"><span class="stat-rank">${i + 1}</span><span class="stat-name">${s}</span></span></li>`))}
    </ol>
    ${tree.statsNote ? raw(html`<p class="stat-note">${tree.statsNote}</p>`) : ""}
  `;
}

function renderRaces() {
  const { cls } = sel;
  if (!cls) return;
  const all = racesFor(cls.slug);
  const shown = faction === "both" ? all : all.filter((r) => r.faction === faction);
  els.races.innerHTML = html`
    <h3 class="panel-title">Who can play a ${cls.name}</h3>
    <div class="segmented faction-filter" role="radiogroup" aria-label="Faction">
      ${FACTIONS.map((f) => raw(html`<button type="button" role="radio" data-faction="${f.key}" class="${f.key === faction ? "is-active" : ""}" aria-checked="${String(f.key === faction)}">${f.label}</button>`))}
    </div>
    ${shown.length
      ? raw(html`<ul class="race-list">${shown.map((r) => raw(html`
          <li class="race faction-${r.faction}">
            <span class="race-name">${r.name}</span>
            <span class="race-meta">${r.faction === "horde" ? "Horde" : "Alliance"}${r.note ? `, ${r.note.toLowerCase()}` : ""}</span>
          </li>`))}</ul>`)
      : raw(html`<p class="muted race-empty">No ${faction === "horde" ? "Horde" : "Alliance"} race can be a ${cls.name}.</p>`)}
  `;
}

function renderBaseline() {
  const { cls } = sel;
  els.baseline.innerHTML = html`
    <h3 class="panel-title">What changed for every ${cls.name}</h3>
    <dl class="key-list key-list-compact">
      ${cls.baseline.map((b) => raw(html`<div><dt>${b.name}</dt><dd>${b.text}</dd></div>`))}
    </dl>
    <details class="rules">
      <summary>How talents work in Forever</summary>
      <ul>${FOREVER_RULES.map((r) => raw(html`<li>${r}</li>`))}</ul>
    </details>
  `;
}
