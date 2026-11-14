// WoW Forever talent planner: spend 51 points across a class's three trees and share the result as a link.
// Rules are the classic ones: a tier opens once you've spent enough points in the tiers above it.

import { FOREVER_TALENTS } from "../../data/forever-talents.js";
import { FOREVER_CLASSES } from "../../data/forever.js";
import { $, html, raw, copyText } from "../../lib/dom.js";
import { navigate } from "../../lib/router.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { setClassColor } from "../../lib/color.js";
import { toast } from "../../lib/toast.js";
import { foreverTreeGridHtml } from "../forever/tree-grid.js";

const MAX_POINTS = 51;
const FIRST_POINT_LEVEL = 10;
let els = {};
let state = { classSlug: null, points: [] }; // points[treeIndex][talentIndex]
let removeMode = false;

const classData = (slug) => FOREVER_TALENTS[slug] || null;
const classInfo = (slug) => FOREVER_CLASSES.find((c) => c.slug === slug) || null;
const treeTotal = (ti) => state.points[ti].reduce((a, b) => a + b, 0);
const total = () => state.points.reduce((sum, _, ti) => sum + treeTotal(ti), 0);

function blank(slug) {
  return classData(slug).trees.map((t) => t.talents.map(() => 0));
}

/** Points string for the URL: one digit per talent, trees joined with "-", trailing zeros trimmed. */
function encode() {
  return state.points.map((tree) => tree.join("").replace(/0+$/, "")).join("-");
}

function decode(slug, text) {
  const data = classData(slug);
  const parts = String(text || "").split("-");
  const points = data.trees.map((tree, ti) => tree.talents.map((t, i) => Math.min(t.max, Number(parts[ti]?.[i]) || 0)));
  // Drop anything that breaks the tier rules or the point cap, so a hand-edited link can't show an impossible build.
  const candidate = { classSlug: slug, points };
  const keep = state;
  state = candidate;
  let spent = 0;
  data.trees.forEach((tree, ti) => {
    const tiers = [...new Set(tree.talents.map((t) => t.needs))].sort((a, b) => a - b);
    let below = 0;
    for (const needs of tiers) {
      tree.talents.forEach((t, i) => {
        if (t.needs !== needs) return;
        if (below < needs) points[ti][i] = 0;
        const room = MAX_POINTS - spent;
        if (points[ti][i] > room) points[ti][i] = room;
        spent += points[ti][i];
      });
      below = tree.talents.reduce((sum, t, i) => sum + (t.needs <= needs ? points[ti][i] : 0), 0);
    }
  });
  // A talent whose prerequisite isn't full can't hold points.
  data.trees.forEach((tree, ti) => {
    let changed = true;
    while (changed) {
      changed = false;
      tree.talents.forEach((t, i) => {
        if (!t.req || !points[ti][i]) return;
        const pi = tree.talents.findIndex((x) => x.name === t.req);
        if (points[ti][pi] < tree.talents[pi].max) { points[ti][i] = 0; changed = true; }
      });
    }
  });
  state = keep;
  return points;
}

function fromBuild(slug, build) {
  const data = classData(slug);
  return data.trees.map((tree) => tree.talents.map((t) => build.points[tree.name]?.[t.name] || 0));
}

const below = (ti, needs) => classData(state.classSlug).trees[ti].talents.reduce((sum, t, i) => sum + (t.needs < needs ? state.points[ti][i] : 0), 0);

function parentIndex(ti, i) {
  const tree = classData(state.classSlug).trees[ti];
  return tree.talents[i].req ? tree.talents.findIndex((t) => t.name === tree.talents[i].req) : -1;
}

/** Why a point can't go here right now, or "" when it can. */
function blocked(ti, i) {
  const tree = classData(state.classSlug).trees[ti];
  const t = tree.talents[i];
  if (state.points[ti][i] >= t.max) return "Full";
  if (total() >= MAX_POINTS) return "No points left";
  if (below(ti, t.needs) < t.needs) return `Opens after ${t.needs} points in ${tree.name}`;
  const pi = parentIndex(ti, i);
  if (pi >= 0 && state.points[ti][pi] < tree.talents[pi].max) return `Needs ${tree.talents[pi].name} ${tree.talents[pi].max}/${tree.talents[pi].max} first`;
  return "";
}
const canAdd = (ti, i) => blocked(ti, i) === "";

/** A point can come out only if every deeper tier you've spent in stays open and nothing depends on this talent. */
function canRemove(ti, i) {
  if (state.points[ti][i] < 1) return false;
  const tree = classData(state.classSlug).trees[ti];
  const mine = tree.talents[i].needs;
  if (tree.talents.some((t, j) => t.req === tree.talents[i].name && state.points[ti][j] > 0)) return false;
  return tree.talents.every((t, j) => !(state.points[ti][j] > 0 && t.needs > mine) || below(ti, t.needs) - 1 >= t.needs);
}

function commit(focusSel) {
  writeJson(KEYS.foreverPlanner, { classSlug: state.classSlug, code: encode() });
  const code = encode().replace(/^-+$/, "");
  navigate({ view: "planner", args: [state.classSlug, code] }, { replace: true });
  if (focusSel) {
    const el = $(focusSel, els.body);
    (el && !el.disabled ? el : $(focusSel.replace("data-sub", "data-add"), els.body))?.focus();
  }
}

export function initPlannerView() {
  els = { body: $("#plannerBody") };

  els.body.addEventListener("click", async (e) => {
    const cls = e.target.closest("[data-plan-class]");
    if (cls) { navigate({ view: "planner", args: [cls.dataset.planClass] }); return; }

    const add = e.target.closest("[data-add]");
    if (add) {
      const [ti, i] = add.dataset.add.split(".").map(Number);
      if (removeMode || e.shiftKey) {
        if (canRemove(ti, i)) { state.points[ti][i]--; commit(`[data-add="${ti}.${i}"]`); }
        else if (state.points[ti][i]) toast("Other talents depend on that one. Remove those first.", "error");
      } else if (canAdd(ti, i)) { state.points[ti][i]++; commit(`[data-add="${ti}.${i}"]`); }
      return;
    }
    if (e.target.closest("[data-action='plan-mode']")) { removeMode = !removeMode; render(); $("[data-action='plan-mode']", els.body)?.focus(); return; }
    const sub = e.target.closest("[data-sub]");
    if (sub) {
      const [ti, i] = sub.dataset.sub.split(".").map(Number);
      if (canRemove(ti, i)) { state.points[ti][i]--; commit(`[data-sub="${ti}.${i}"]`); }
      return;
    }
    const preset = e.target.closest("[data-preset]");
    if (preset) {
      const build = classData(state.classSlug).builds?.[preset.dataset.preset];
      if (build) { state.points = fromBuild(state.classSlug, build); commit(`[data-preset="${preset.dataset.preset}"]`); }
      return;
    }
    if (e.target.closest("[data-action='plan-reset']")) { state.points = blank(state.classSlug); commit("[data-action='plan-reset']"); return; }
    if (e.target.closest("[data-action='plan-share']")) {
      const ok = await copyText(window.location.href);
      toast(ok ? "Link copied. Anyone who opens it sees this build." : "Couldn't reach the clipboard. Copy the address from your browser instead.", ok ? undefined : "error");
    }
  });

  // Right-click takes a point out, like the in-game talent window.
  els.body.addEventListener("contextmenu", (e) => {
    const add = e.target.closest("[data-add]");
    if (!add) return;
    e.preventDefault();
    const [ti, i] = add.dataset.add.split(".").map(Number);
    if (canRemove(ti, i)) { state.points[ti][i]--; commit(`[data-add="${ti}.${i}"]`); }
  });
}

export function showPlanner(route) {
  const [slugArg, code] = route.args || [];
  const saved = readJson(KEYS.foreverPlanner, null);
  const slug = classData(String(slugArg || "").toLowerCase()) ? slugArg.toLowerCase() : null;

  if (!slug) {
    // Reopen whatever you were planning last, otherwise show the class picker.
    if (saved && classData(saved.classSlug) && !slugArg) {
      navigate({ view: "planner", args: [saved.classSlug, saved.code] }, { replace: true });
      return;
    }
    state = { classSlug: null, points: [] };
    setClassColor(document.documentElement, null);
    renderPicker();
    return;
  }
  const useSaved = code == null && saved?.classSlug === slug;
  state = { classSlug: slug, points: [] };
  state.points = decode(slug, code ?? (useSaved ? saved.code : ""));
  const info = classInfo(slug);
  if (info?.color) setClassColor(document.documentElement, info.color);
  render();
}

function classButtons(active) {
  return html`
    <div class="plan-classes" role="group" aria-label="Class">
      ${Object.keys(FOREVER_TALENTS).map((slug) => {
        const info = classInfo(slug);
        return raw(html`<button type="button" class="plan-class${slug === active ? " is-active" : ""}" data-plan-class="${slug}" aria-pressed="${String(slug === active)}">${info?.name || slug}</button>`);
      })}
    </div>`;
}

function renderPicker() {
  els.body.innerHTML = html`
    <p class="plan-pick">Pick a class to start.</p>
    ${raw(classButtons(null))}
  `;
}

function render() {
  const data = classData(state.classSlug);
  const spent = total();
  const left = MAX_POINTS - spent;
  const level = spent === 0 ? null : spent + FIRST_POINT_LEVEL - 1;
  const split = state.points.map((_, ti) => treeTotal(ti)).join(" / ");
  els.body.innerHTML = html`
    ${raw(classButtons(state.classSlug))}
    <section class="card plan-summary" aria-live="polite">
      <div>
        <p class="plan-split">${split}</p>
        <p class="muted">${left === 0 ? "All 51 points spent." : `${left} ${left === 1 ? "point" : "points"} left.`} ${level ? `This build needs level ${level}.` : "Your first talent point arrives at level 10."}</p>
      </div>
      <div class="plan-actions">
        <button type="button" class="btn btn-primary" data-action="plan-share" ${spent ? "" : "disabled"}>Copy link</button>
        <button type="button" class="btn btn-quiet" data-action="plan-reset" ${spent ? "" : "disabled"}>Clear all</button>
      </div>
    </section>
    <div class="plan-presets">
      <span class="muted">Start from a recommended leveling build:</span>
      ${data.trees.map((t) => {
        const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const b = data.builds?.[slug];
        return b ? raw(html`<button type="button" class="btn btn-quiet btn-sm" data-preset="${slug}">${t.name} ${b.split.join("/")}</button>`) : "";
      })}
    </div>
    <div class="plan-presets">
      <button type="button" class="btn btn-quiet btn-sm calc-mode${removeMode ? " is-active" : ""}" data-action="plan-mode" aria-pressed="${String(removeMode)}">${removeMode ? "Removing points: tap to stop" : "Remove points by tapping"}</button>
      <span class="muted">Click a talent to add a point. Right-click or Shift-click takes one back.</span>
    </div>
    <div class="ftrees fgrids plan-trees${removeMode ? " is-removing" : ""}">
      ${data.trees.map((tree, ti) => raw(foreverTreeGridHtml(tree, state.points[ti], {
        interactive: true,
        treeIndex: ti,
        main: treeTotal(ti) > 0 && treeTotal(ti) === Math.max(...state.points.map((_, k) => treeTotal(k))),
        state: (t, i) => { const why = blocked(ti, i); return { open: why === "", why }; }
      })))}
    </div>
    <p class="fine">Tree layout and talent summaries come from Talents Forever (CC BY 4.0), checked against timesaver.gg's calculator. Summaries describe the first rank and may trail the live game after a hotfix.</p>
  `;
}
