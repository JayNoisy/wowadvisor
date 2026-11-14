// Retail talent calculator: build on the real trees, import or export loadout codes, share by link.

import { CLASSES } from "../../data/classes.js";
import { $, html, raw, copyText, flashLabel } from "../../lib/dom.js";
import { navigate } from "../../lib/router.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { setClassColor } from "../../lib/color.js";
import { toast } from "../../lib/toast.js";
import { getBuild } from "../builds/data.js";
import { loadSpecTree, ICON } from "../talents/tree.js";
import { BUDGET, activeNodes, blockedReason, buildFromCode, canAdd, canRemove, chooseHero, codeFromBuild, emptyBuild, isChoice, rankOf, spent } from "./model.mjs";

const MODES = [["aoe", "Mythic+"], ["raid", "Raid"], ["pvp", "PvP"]];
let els = {};
let tree = null;
let build = null;
let sel = { cls: null, spec: null };
let removeMode = false;
let request = 0;

const findClass = (slug) => CLASSES.find((c) => c.slug === slug) || null;
const findSpec = (cls, slug) => cls?.specs.find((s) => s.slug === slug) || null;

export function initCalcView() {
  els = { body: $("#calcBody") };

  els.body.addEventListener("change", (e) => {
    if (e.target.matches("[data-calc-class]")) {
      const cls = findClass(e.target.value);
      navigate({ view: "calc", args: [cls.slug, cls.specs[0].slug] });
    }
    if (e.target.matches("[data-calc-spec]")) navigate({ view: "calc", args: [sel.cls.slug, e.target.value] });
  });

  els.body.addEventListener("submit", (e) => {
    if (!e.target.matches("#calcImport")) return;
    e.preventDefault();
    const input = $("#calcImportCode", els.body);
    const code = input.value.trim();
    if (!code) return;
    const next = buildFromCode(tree, code);
    if (!next) {
      toast(`That code doesn't fit the ${sel.spec.name} ${sel.cls.name} tree on the current patch. Pick the code's class and spec first.`, "error");
      return;
    }
    build = next;
    input.value = "";
    commit();
    toast("Loadout loaded.");
  });

  els.body.addEventListener("click", async (e) => {
    const node = e.target.closest("[data-node]");
    if (node) { act(Number(node.dataset.node), removeMode || e.shiftKey ? "remove" : "add"); return; }

    const hero = e.target.closest("[data-hero]");
    if (hero) { build = chooseHero(tree, build, Number(hero.dataset.hero)); commit(`[data-hero="${hero.dataset.hero}"]`); return; }

    const preset = e.target.closest("[data-calc-preset]");
    if (preset) {
      const b = getBuild(sel.cls.name, sel.spec.name, preset.dataset.calcPreset);
      const next = b?.exportString ? buildFromCode(tree, b.exportString) : null;
      if (next) { build = next; commit(`[data-calc-preset="${preset.dataset.calcPreset}"]`); }
      else toast("That build isn't available right now.", "error");
      return;
    }
    const a = e.target.closest("[data-action]")?.dataset.action;
    if (a === "calc-clear") { build = chooseHero(tree, emptyBuild(tree), build.hero); commit("[data-action='calc-clear']"); }
    if (a === "calc-mode") { removeMode = !removeMode; renderStatus(); renderTree(); $("[data-action='calc-mode']", els.body)?.focus(); }
    if (a === "calc-copy") {
      const btn = e.target.closest("[data-action]");
      const ok = await copyText(codeFromBuild(tree, build));
      flashLabel(btn, ok ? "Copied" : "Copy failed");
      if (ok) toast("Code copied. In game: Talents, loadout dropdown, Import, paste.");
    }
    if (a === "calc-link") {
      const ok = await copyText(window.location.href);
      toast(ok ? "Link copied. Anyone who opens it sees this build." : "Couldn't reach the clipboard. Copy the address from your browser instead.", ok ? undefined : "error");
    }
  });

  // Right-click removes a point, like the in-game window.
  els.body.addEventListener("contextmenu", (e) => {
    const node = e.target.closest("[data-node]");
    if (!node) return;
    e.preventDefault();
    act(Number(node.dataset.node), "remove");
  });
  els.body.addEventListener("keydown", (e) => {
    const node = e.target.closest?.("[data-node]");
    if (node && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); act(Number(node.dataset.node), "remove"); }
  });
}

function act(id, what) {
  const node = tree.nodes.find((n) => n.id === id);
  if (!node) return;
  const have = build.ranks.get(id) || 0;
  if (what === "remove") {
    if (!canRemove(tree, build, node)) {
      if (have) toast("Other talents depend on that one. Remove those first.", "error");
      return;
    }
    if (have === 1) build.ranks.delete(id); else build.ranks.set(id, have - 1);
  } else if (canAdd(tree, build, node)) {
    build.ranks.set(id, have + 1);
  } else if (isChoice(node) && have) {
    // Already taken: a click swaps to the other option.
    build.entry.set(id, ((build.entry.get(id) || 0) + 1) % node.entries.length);
  } else {
    return;
  }
  commit(`[data-node="${id}"]`);
}

function commit(focusSel) {
  const code = codeFromBuild(tree, build);
  writeJson(KEYS.calc, { classSlug: sel.cls.slug, specSlug: sel.spec.slug, code });
  history.replaceState(null, "", `#calc/${sel.cls.slug}/${sel.spec.slug}/${encodeURIComponent(code)}`);
  renderStatus();
  renderTree();
  if (focusSel) $(focusSel, els.body)?.focus();
}

export async function showCalc(route) {
  const [classArg, specArg, codeArg] = route.args || [];
  const saved = readJson(KEYS.calc, null);
  let cls = findClass(String(classArg || "").toLowerCase());
  if (!cls) {
    const back = findClass(saved?.classSlug) || CLASSES[0];
    navigate({ view: "calc", args: [back.slug, findSpec(back, saved?.specSlug)?.slug || back.specs[0].slug] }, { replace: true });
    return;
  }
  const spec = findSpec(cls, String(specArg || "").toLowerCase()) || cls.specs[0];
  sel = { cls, spec };
  setClassColor(document.documentElement, cls.color);

  const mine = ++request;
  renderShell();
  const loaded = await loadSpecTree(cls.slug, spec.slug);
  if (mine !== request) return;
  if (!loaded) {
    $("#calcTree", els.body).innerHTML = html`<p class="tree-state">The talent tree for ${spec.name} ${cls.name} couldn't be loaded. Check your connection and try again.</p>`;
    return;
  }
  tree = loaded;
  const fromLink = codeArg ? buildFromCode(tree, codeArg) : null;
  const fromSaved = !codeArg && saved?.classSlug === cls.slug && saved?.specSlug === spec.slug ? buildFromCode(tree, saved.code) : null;
  build = fromLink || fromSaved || chooseHero(tree, emptyBuild(tree), tree.heroTrees[0]?.id ?? null);
  if (codeArg && !fromLink) toast("The code in that link doesn't fit the current talent tree, so the calculator started empty.", "error");
  renderStatus();
  renderTree();
}

function renderShell() {
  const { cls, spec } = sel;
  els.body.innerHTML = html`
    <section class="card calc-bar">
      <label class="field">
        <span>Class</span>
        <select data-calc-class>${CLASSES.map((c) => raw(html`<option value="${c.slug}" ${c.slug === cls.slug ? "selected" : ""}>${c.name}</option>`))}</select>
      </label>
      <label class="field">
        <span>Specialization</span>
        <select data-calc-spec>${cls.specs.map((s) => raw(html`<option value="${s.slug}" ${s.slug === spec.slug ? "selected" : ""}>${s.name}</option>`))}</select>
      </label>
      <form id="calcImport" class="calc-import">
        <label class="field">
          <span>Import a loadout code</span>
          <input id="calcImportCode" type="text" spellcheck="false" autocomplete="off" placeholder="Paste a ${spec.name} code" />
        </label>
        <button type="submit" class="btn btn-quiet">Load</button>
      </form>
    </section>
    <section class="card calc-status" id="calcStatus"></section>
    <section class="card tree-card" id="calcTree" aria-label="Talent trees"><p class="tree-state">Loading the ${spec.name} tree…</p></section>
    <p class="fine">Click a talent to add a point; click a taken choice talent to swap it. Right-click, Shift-click or press Delete to take a point back. The calculator follows the game's rules for gates and connections, and its codes are checked against real players' loadouts, but it can't show what each talent does yet.</p>
  `;
}

function renderStatus() {
  const el = $("#calcStatus", els.body);
  if (!el || !tree) return;
  const counts = ["class", "spec", "hero"].map((name) => [name, spent(tree, build, name), BUDGET[name]]);
  const names = { class: sel.cls.name, spec: sel.spec.name, hero: "Hero" };
  const done = counts.every(([, have, max]) => have === max);
  const anything = counts.some(([, have]) => have > 0);
  el.innerHTML = html`
    <div class="calc-counts" aria-live="polite">
      ${counts.map(([name, have, max]) => raw(html`<p class="calc-count${have === max ? " is-full" : ""}"><strong>${have}</strong><span>/${max} ${names[name]}</span></p>`))}
    </div>
    <div class="calc-heroes">
      <span class="calc-label" id="calcHeroLabel">Hero talents</span>
      <div class="segmented" role="radiogroup" aria-labelledby="calcHeroLabel">
        ${tree.heroTrees.map((h) => raw(html`<button type="button" role="radio" data-hero="${h.id}" class="${h.id === build.hero ? "is-active" : ""}" aria-checked="${String(h.id === build.hero)}">${h.name}</button>`))}
      </div>
    </div>
    <div class="calc-presets">
      <span class="muted">Start from this site's pick:</span>
      ${MODES.map(([mode, label]) => (getBuild(sel.cls.name, sel.spec.name, mode)?.exportString ? raw(html`<button type="button" class="btn btn-quiet btn-sm" data-calc-preset="${mode}">${label}</button>`) : ""))}
      <button type="button" class="btn btn-quiet btn-sm" data-action="calc-clear" ${anything ? "" : "disabled"}>Clear</button>
      <button type="button" class="btn btn-quiet btn-sm calc-mode${removeMode ? " is-active" : ""}" data-action="calc-mode" aria-pressed="${String(removeMode)}">${removeMode ? "Removing points: tap to stop" : "Remove points by tapping"}</button>
    </div>
    <label class="loadout-label" for="calcCode">Your loadout code${done ? "" : raw(` <span class="muted">(points left to spend)</span>`)}</label>
    <div class="codebox loadout-row">
      <input id="calcCode" class="loadout-code" type="text" readonly spellcheck="false" value="${codeFromBuild(tree, build)}" />
      <button type="button" class="btn btn-primary" data-action="calc-copy">Copy code</button>
      <button type="button" class="btn btn-quiet" data-action="calc-link">Copy link</button>
    </div>
  `;
}

function nodeLabel(n, have, open, why) {
  const chosen = isChoice(n) ? n.entries[build.entry.get(n.id) || 0] : n.entries[0];
  const name = isChoice(n) && !have ? n.entries.map((e) => e.name).join(" or ") : chosen.name;
  const rank = n.max > 1 ? `${have} of ${n.max}` : have ? "taken" : "not taken";
  const hint = n.free ? "Granted for free"
    : open ? "Click to add a point"
    : isChoice(n) && have ? `Click to swap to ${n.entries[((build.entry.get(n.id) || 0) + 1) % n.entries.length].name}`
    : why;
  return `${name} (${rank}). ${hint}`;
}

function panelHtml(title, nodes, note) {
  if (!nodes.length) return "";
  const minRow = Math.min(...nodes.map((n) => n.row));
  const minCol = Math.min(...nodes.map((n) => n.col));
  const rows = Math.max(...nodes.map((n) => n.row)) - minRow + 1;
  const cols = Math.max(...nodes.map((n) => n.col)) - minCol + 1;
  const at = new Map(nodes.map((n) => [n.id, { x: n.col - minCol + 0.5, y: n.row - minRow + 0.5 }]));
  const lines = [];
  for (const n of nodes) for (const to of n.next || []) {
    const a = at.get(n.id);
    const b = at.get(to);
    if (!b) continue;
    const lit = rankOf(build, n) >= n.max && rankOf(build, nodes.find((x) => x.id === to)) > 0;
    lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${lit ? "is-on" : ""}" />`);
  }
  const cells = nodes.map((n) => {
    const have = rankOf(build, n);
    const why = blockedReason(tree, build, n);
    const open = why === "";
    const entryIndex = isChoice(n) ? build.entry.get(n.id) || 0 : 0;
    const entry = n.kind === "tiered" ? tierEntry(n, have) : n.entries[entryIndex];
    const other = isChoice(n) && !have ? n.entries[1] : null;
    const label = nodeLabel(n, have, open, why);
    return html`
      <button type="button" class="tnode cnode${have ? " is-on" : ""}${open ? " is-open" : ""}${n.free ? " is-free" : ""}${n.kind ? ` is-${n.kind}` : ""}"
        style="grid-row:${n.row - minRow + 1};grid-column:${n.col - minCol + 1}" data-node="${n.id}" aria-label="${label}" data-tip="${label}" ${n.free ? 'aria-disabled="true"' : ""}>
        <img src="${ICON(entry.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async" />
        ${other ? raw(html`<img class="tnode-alt" src="${ICON(other.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async" />`) : ""}
        ${n.max > 1 && (have || open) ? raw(html`<span class="tnode-rank" aria-hidden="true">${have}/${n.max}</span>`) : ""}
      </button>`;
  }).join("");
  return html`
    <section class="tree-panel">
      <header class="tree-panel-head"><h4>${title}</h4><span class="muted">${note}</span></header>
      <div class="tree-scroll">
        <div class="tree-grid" style="--cols:${cols};--rows:${rows}">
          <svg class="tree-lines" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" aria-hidden="true">${raw(lines.join(""))}</svg>
          ${raw(cells)}
        </div>
      </div>
    </section>`;
}

function tierEntry(n, have) {
  let left = have;
  for (const e of n.entries) {
    if (left <= (e.ranks || 1)) return e;
    left -= e.ranks || 1;
  }
  return n.entries[n.entries.length - 1];
}

function renderTree() {
  const el = $("#calcTree", els.body);
  if (!el || !tree) return;
  const nodes = activeNodes(tree, build);
  const of = (name) => nodes.filter((n) => n.tree === name);
  const hero = tree.heroTrees.find((h) => h.id === build.hero);
  const cols = ["class", "hero", "spec"].reduce((sum, name) => {
    const list = of(name);
    return sum + (list.length ? Math.max(...list.map((n) => n.col)) - Math.min(...list.map((n) => n.col)) + 1 : 0);
  }, 0);
  el.style.setProperty("--total-cols", String(cols));
  el.classList.toggle("is-removing", removeMode);
  el.innerHTML = html`
    <div class="tree-panels">
      ${raw(panelHtml(`${tree.className} tree`, of("class"), `${spent(tree, build, "class")} of ${BUDGET.class} points`))}
      ${raw(panelHtml(hero ? hero.name : "Hero talents", of("hero"), `${spent(tree, build, "hero")} of ${BUDGET.hero} points`))}
      ${raw(panelHtml(`${tree.specName} tree`, of("spec"), `${spent(tree, build, "spec")} of ${BUDGET.spec} points`))}
    </div>
    <footer class="tree-foot"><p class="muted">Tree data for game build ${tree.build}.</p></footer>
  `;
  el.querySelectorAll(".tnode img").forEach((img) => {
    img.addEventListener("error", () => { const fb = ICON(""); if (img.src !== fb) img.src = fb; }, { once: true });
  });
}
