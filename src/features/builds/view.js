// Builds view: class crests, class sheet (spec + mode), loadout plate, stats, rotation, Mythic+ context.

import { CLASSES, MODES, ROLE_LABELS, findClass, findSpec, findMode, modeLabel } from "../../data/classes.js";
import { AFFIXES } from "../../data/mythic.js";
import { $, $$, html, raw, copyText, flashLabel, scrollToEl } from "../../lib/dom.js";
import { timeAgo, plural } from "../../lib/format.js";
import { navigate } from "../../lib/router.js";
import { on } from "../../lib/events.js";
import { KEYS, writeJson } from "../../lib/storage.js";
import { toast } from "../../lib/toast.js";
import { getBuild, getBuildsMeta } from "./data.js";
import { resolveStatPriority, explainStat, rotationFor, rotationModeTip, spellInStep, TIP_ICON, FALLBACK_ICON } from "./guidance.js";
import { getMythicContext, setKeyLevel, toggleAffix, clearAffixes, adaptStatsForMythic, mythicBuildReminders } from "./mythic-context.js";
import { recordCopy } from "./tracking.js";

const sel = { cls: null, spec: null, mode: "aoe", statIndex: 0 };
let els = {};
let rendered = false; // deep links shouldn't jump the page on first load

export function initBuildsView() {
  els = {
    view: $("#view-builds"),
    hero: $("#buildsHero"),
    grid: $("#classGrid"),
    sheet: $("#classSheet"),
    sheetCrest: $("#sheetCrest"),
    sheetName: $("#sheetName"),
    sheetRoles: $("#sheetRoles"),
    specTabs: $("#specTabs"),
    modeSwitch: $("#modeSwitch"),
    body: $("#sheetBody"),
    pickSpec: $("#pickSpecPrompt"),
    loadout: $("#loadoutPlate"),
    stats: $("#statsPanel"),
    mythic: $("#mythicPanel"),
    rotation: $("#rotationPanel")
  };

  renderClassGrid();

  els.grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-class]");
    if (!btn) return;
    const cls = findClass(btn.dataset.class);
    if (!cls) return;
    const sameClass = sel.cls?.slug === cls.slug;
    navigate({ view: "builds", classSlug: cls.slug, specSlug: sameClass ? sel.spec?.slug : null, mode: sameClass ? sel.mode : null });
  });

  els.specTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-spec]");
    if (!btn || !sel.cls) return;
    navigate({ view: "builds", classSlug: sel.cls.slug, specSlug: btn.dataset.spec, mode: sel.mode || "aoe" }, { replace: Boolean(sel.spec) });
  });

  els.modeSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn || !sel.cls || !sel.spec) return;
    navigate({ view: "builds", classSlug: sel.cls.slug, specSlug: sel.spec.slug, mode: btn.dataset.mode }, { replace: true });
  });

  // Arrow-key navigation inside the spec tabs and mode switch.
  [els.specTabs, els.modeSwitch].forEach((group) => {
    group.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      const items = $$("button", group);
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
  });

  $("#changeClassBtn").addEventListener("click", () => {
    navigate({ view: "builds" });
    requestAnimationFrame(() => scrollToEl(els.hero));
  });

  els.loadout.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action='copy-build']");
    if (!btn) return;
    const build = currentBuild();
    if (!build?.exportString) return;
    const ok = await copyText(build.exportString);
    if (!ok) {
      flashLabel(btn, "Copy failed");
      toast("Couldn't reach the clipboard. Select the code and copy it manually.", "error");
      return;
    }
    flashLabel(btn, "Copied");
    toast(`${sel.spec.name} ${sel.cls.name} loadout copied. Paste it into Import in your talent window.`);
    recordCopy(sel.cls, sel.spec, sel.mode, build);
  });

  els.loadout.addEventListener("focusin", (e) => {
    if (e.target.matches(".loadout-code")) e.target.select();
  });

  els.stats.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-stat-index]");
    if (!btn) return;
    sel.statIndex = Number(btn.dataset.statIndex) || 0;
    renderStats();
  });

  els.mythic.addEventListener("click", (e) => {
    const affixBtn = e.target.closest("[data-affix]");
    if (affixBtn) toggleAffix(affixBtn.dataset.affix);
    if (e.target.closest("[data-action='clear-affixes']")) clearAffixes();
    const step = e.target.closest("[data-key-step]");
    if (step) setKeyLevel(getMythicContext().keyLevel + Number(step.dataset.keyStep));
  });
  els.mythic.addEventListener("change", (e) => {
    if (e.target.matches("#keyLevelInput")) setKeyLevel(e.target.value);
  });

  on("mythic:changed", () => {
    if (!sel.spec) return;
    renderMythic();
    renderStats();
    renderLoadout();
  });
  on("builds:loaded", () => renderSelection());
}

/** Called by the app shell whenever the route targets the builds view. */
export function showBuildsRoute(route) {
  const cls = findClass(route.classSlug);
  const spec = findSpec(cls, route.specSlug);
  const mode = findMode(route.mode)?.key || "aoe";
  const changedSpec = sel.spec?.slug !== spec?.slug || sel.cls?.slug !== cls?.slug;
  const changedClass = sel.cls?.slug !== cls?.slug;
  sel.cls = cls;
  sel.spec = spec;
  sel.mode = mode;
  if (changedSpec) sel.statIndex = 0;
  if (cls && spec) writeJson(KEYS.lastBuild, { classSlug: cls.slug, specSlug: spec.slug, mode });
  renderSelection();
  if (changedClass && cls && rendered) requestAnimationFrame(() => scrollToEl(els.sheet));
  rendered = true;
}

export function openBuild(className, specName, mode) {
  const cls = findClass(className);
  const spec = findSpec(cls, specName);
  if (!cls || !spec) return false;
  navigate({ view: "builds", classSlug: cls.slug, specSlug: spec.slug, mode: findMode(mode)?.key || "aoe" });
  return true;
}

function currentBuild() {
  if (!sel.cls || !sel.spec) return null;
  return getBuild(sel.cls.name, sel.spec.name, sel.mode);
}

function renderClassGrid() {
  els.grid.innerHTML = CLASSES.map((c) => html`
    <button type="button" class="crest" data-class="${c.slug}" style="--cc:${c.color}" aria-pressed="false">
      <img class="crest-art" src="${c.icon}" alt="" width="128" height="128" decoding="async" />
      <span class="crest-name">${c.name}</span>
    </button>`).join("");
}

function renderSelection() {
  const { cls, spec } = sel;
  if (cls) document.documentElement.style.setProperty("--cc", cls.color);
  else document.documentElement.style.removeProperty("--cc");
  els.view.dataset.state = cls ? "class" : "pick";
  $$(".crest", els.grid).forEach((b) => {
    const active = b.dataset.class === cls?.slug;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  els.sheet.hidden = !cls;
  if (!cls) return;

  els.sheet.style.setProperty("--cc", cls.color);
  els.sheetCrest.src = cls.icon;
  els.sheetName.textContent = cls.name;
  const roles = [...new Set(cls.specs.map((s) => ROLE_LABELS[s.role]))];
  els.sheetRoles.textContent = `${plural(cls.specs.length, "spec")}: ${roles.join(", ")}`;

  els.specTabs.innerHTML = cls.specs.map((s) => html`
    <button type="button" role="tab" class="spec-tab${s.slug === spec?.slug ? " is-active" : ""}"
      data-spec="${s.slug}" aria-selected="${String(s.slug === spec?.slug)}" tabindex="${s.slug === spec?.slug || (!spec && s === cls.specs[0]) ? "0" : "-1"}">
      <span class="spec-tab-name">${s.name}</span>
      <span class="spec-tab-role role-${s.role}">${ROLE_LABELS[s.role]}</span>
    </button>`).join("");

  // On narrow screens the spec strip scrolls; keep the active tab visible.
  const activeTab = $(".spec-tab.is-active", els.specTabs);
  if (activeTab && els.specTabs.scrollWidth > els.specTabs.clientWidth) {
    els.specTabs.scrollLeft = activeTab.offsetLeft - els.specTabs.offsetLeft - 16;
  }

  els.pickSpec.hidden = Boolean(spec);
  els.modeSwitch.hidden = !spec;
  els.body.hidden = !spec;
  if (!spec) return;

  els.modeSwitch.innerHTML = MODES.map((m) => html`
    <button type="button" role="radio" class="mode-btn${m.key === sel.mode ? " is-active" : ""}" data-mode="${m.key}"
      aria-checked="${String(m.key === sel.mode)}" tabindex="${m.key === sel.mode ? "0" : "-1"}">${m.label}</button>`).join("");

  renderLoadout();
  renderStats();
  renderMythic();
  renderRotation();
}

function confidenceTier(build) {
  const score = Number(build?.confidenceScore);
  const label = String(build?.confidence || "").toLowerCase();
  if (!Number.isFinite(score) && !label) return null;
  const tier = label || (score >= 75 ? "high" : score >= 55 ? "medium" : "low");
  const text = { high: "Strong agreement", medium: "Some agreement", low: "Split opinions" }[tier] || "Unrated";
  return { tier, score: Number.isFinite(score) ? Math.round(score) : null, text };
}

function renderLoadout() {
  const meta = getBuildsMeta();
  const build = currentBuild();
  const { cls, spec, mode } = sel;

  if (!meta.loaded) {
    els.loadout.innerHTML = `<div class="plate-empty"><p>Loading builds…</p></div>`;
    return;
  }
  if (!meta.ok) {
    els.loadout.innerHTML = html`<div class="plate-empty"><h3>Builds didn't load</h3><p>builds.json couldn't be fetched (${meta.error || "unknown error"}). Refresh the page to try again.</p></div>`;
    return;
  }
  if (!build || !build.exportString) {
    els.loadout.innerHTML = html`<div class="plate-empty"><h3>No ${modeLabel(mode)} build yet</h3><p>There isn't enough data for ${spec.name} ${cls.name} in ${modeLabel(mode)} right now. Try another mode; the data refreshes every 12 hours.</p></div>`;
    return;
  }

  const conf = confidenceTier(build);
  const updated = timeAgo(build.updated);
  const reminders = mode === "aoe" ? mythicBuildReminders() : [];
  const notes = [...build.notes, ...reminders];
  const families = build.sourceFamilies.length ? build.sourceFamilies.map(prettySource).join(" and ") : null;

  els.loadout.innerHTML = html`
    <header class="plate-head">
      <div>
        <h3 class="plate-title">${build.title || `${spec.name} ${modeLabel(mode)}`}</h3>
        <p class="plate-sub">${spec.name} ${cls.name}, ${modeLabel(mode)}${updated ? raw(html`<span class="plate-sep" aria-hidden="true"></span>updated ${updated}`) : ""}</p>
      </div>
      ${conf ? raw(html`
        <div class="confidence tier-${conf.tier}" title="${build.confidenceRationale || ""}">
          <span class="confidence-gauge" style="--v:${conf.score ?? 50}" aria-hidden="true"></span>
          <span class="confidence-copy"><strong>${conf.text}</strong>${conf.score != null ? raw(html`<span>${conf.score}/100 confidence</span>`) : ""}</span>
        </div>`) : ""}
    </header>

    <label class="loadout-label" for="loadoutCode">Loadout code</label>
    <div class="loadout-row">
      <input id="loadoutCode" class="loadout-code" type="text" readonly spellcheck="false" value="${build.exportString}" />
      <button type="button" class="btn btn-primary" data-action="copy-build">Copy code</button>
    </div>
    <p class="plate-help">In game: open Talents, choose the loadout dropdown, Import, then paste.</p>

    ${build.sampleSize != null || families ? raw(html`
      <p class="plate-basis">
        Chosen from ${build.sampleSize != null ? plural(Number(build.sampleSize), "top-player build") : "top-player builds"}${families ? ` across ${families}` : ""}${build.agreementCount != null && build.sampleSize ? `; ${build.agreementCount} matched this exact loadout` : ""}.
      </p>`) : ""}

    ${notes.length ? raw(html`<ul class="plate-notes">${notes.map((n) => raw(html`<li>${n}</li>`))}</ul>`) : ""}
  `;
}

function prettySource(key) {
  const map = { peavers: "Peavers", archon: "Archon", murlok: "Murlok", curatedGuides: "curated guides", curated: "curated guides", externalJson: "external feeds" };
  return map[key] || key;
}

function renderStats() {
  const { cls, spec, mode } = sel;
  const base = resolveStatPriority(cls, spec, mode);
  if (!base.length) {
    els.stats.innerHTML = html`<h3 class="panel-title">Stat priority</h3><p class="muted">No stat priority recorded for ${spec.name} ${cls.name}.</p>`;
    return;
  }
  const adapted = mode === "aoe" ? adaptStatsForMythic(base, spec.role) : { stats: base, reasons: [] };
  const stats = adapted.stats;
  const idx = Math.min(sel.statIndex, stats.length - 1);
  const shifted = mode === "aoe" && stats.join() !== base.join();
  const { text, modeNote } = explainStat(spec, stats[idx], mode);

  els.stats.innerHTML = html`
    <h3 class="panel-title">Stat priority</h3>
    <p class="panel-sub">${shifted ? "Re-ranked for your key settings below." : `Secondary stats for ${modeLabel(mode)}.`}</p>
    <ol class="stat-ladder">
      ${stats.map((s, i) => raw(html`
        <li>
          <button type="button" class="stat-rung${i === idx ? " is-active" : ""}" data-stat-index="${i}" aria-pressed="${String(i === idx)}" style="--w:${Math.max(28, 100 - i * 20)}%">
            <span class="stat-rank">${i + 1}</span>
            <span class="stat-name">${s}</span>
          </button>
        </li>`))}
    </ol>
    <div class="stat-why">
      <p><strong>${stats[idx]}:</strong> ${text}</p>
      <p class="muted">${modeNote}</p>
    </div>
    ${shifted && adapted.reasons.length ? raw(html`<details class="stat-reasons"><summary>Why the order changed</summary><ul>${adapted.reasons.map((r) => raw(html`<li>${r}</li>`))}</ul></details>`) : ""}
  `;
}

function renderMythic() {
  const show = sel.mode === "aoe";
  els.mythic.hidden = !show;
  if (!show) return;
  const { keyLevel, affixes } = getMythicContext();
  els.mythic.innerHTML = html`
    <h3 class="panel-title">Your key</h3>
    <p class="panel-sub">Tunes stat order and reminders for the key you're running.</p>
    <div class="key-level">
      <label for="keyLevelInput">Key level</label>
      <div class="stepper">
        <button type="button" class="stepper-btn" data-key-step="-1" aria-label="Lower key level">−</button>
        <input id="keyLevelInput" type="number" inputmode="numeric" min="2" max="35" value="${keyLevel}" />
        <button type="button" class="stepper-btn" data-key-step="1" aria-label="Raise key level">+</button>
      </div>
    </div>
    <fieldset class="affixes">
      <legend>Affixes this week</legend>
      <div class="affix-list">
        ${AFFIXES.map((a) => raw(html`<button type="button" class="affix${affixes.includes(a) ? " is-on" : ""}" data-affix="${a}" aria-pressed="${String(affixes.includes(a))}">${a}</button>`))}
      </div>
      ${affixes.length ? raw(`<button type="button" class="link-btn" data-action="clear-affixes">Clear affixes</button>`) : ""}
    </fieldset>
  `;
}

function renderRotation() {
  const { cls, spec, mode } = sel;
  const { steps, generic } = rotationFor(cls, spec, mode);
  const all = [...steps, rotationModeTip(mode)];
  els.rotation.innerHTML = html`
    <h3 class="panel-title">Rotation priority</h3>
    <p class="panel-sub">${generic ? `General ${spec.archetype.replace("-", " ")} guidance for ${modeLabel(mode)}.` : `Top to bottom: do the highest line you can.`}</p>
    <ol class="rotation">
      ${all.map((step, i) => {
        const isTip = i === all.length - 1;
        const spell = isTip ? null : spellInStep(step);
        return raw(html`
          <li class="rotation-step${isTip ? " is-tip" : ""}">
            <img class="spell-icon" src="${spell?.icon || TIP_ICON}" alt="" width="36" height="36" loading="lazy" decoding="async" data-fallback="${FALLBACK_ICON}" />
            <div>
              ${spell ? raw(html`<span class="spell-name">${spell.name}</span>`) : isTip ? raw(html`<span class="spell-name">${modeLabel(mode)} tip</span>`) : ""}
              <span class="step-text">${step}</span>
            </div>
          </li>`);
      })}
    </ol>
  `;
  $$(".spell-icon", els.rotation).forEach((img) => {
    img.addEventListener("error", () => { if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback; }, { once: true });
  });
}
