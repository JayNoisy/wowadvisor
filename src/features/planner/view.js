// WoW Forever talent planner: spend 51 points across a class's three trees and share the result as a link.
// Rules are the classic ones: a tier opens once you've spent enough points in the tiers above it.

import { FOREVER_TALENTS } from "../../data/forever-talents.js";
import { FOREVER_CLASSES } from "../../data/forever.js";
import { $, html, raw, copyText } from "../../lib/dom.js";
import { navigate } from "../../lib/router.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { setClassColor } from "../../lib/color.js";
import { toast } from "../../lib/toast.js";

const MAX_POINTS = 51;
const FIRST_POINT_LEVEL = 10;
let els = {};
let state = { classSlug: null, points: [] }; // points[treeIndex][talentIndex]

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
  state = keep;
  return points;
}

function fromBuild(slug, build) {
  const data = classData(slug);
  return data.trees.map((tree) => tree.talents.map((t) => build.points[tree.name]?.[t.name] || 0));
}

const below = (ti, needs) => classData(state.classSlug).trees[ti].talents.reduce((sum, t, i) => sum + (t.needs < needs ? state.points[ti][i] : 0), 0);

function canAdd(ti, i) {
  const t = classData(state.classSlug).trees[ti].talents[i];
  return total() < MAX_POINTS && state.points[ti][i] < t.max && below(ti, t.needs) >= t.needs;
}

/** A point can come out only if every deeper tier you've spent in would still be open. */
function canRemove(ti, i) {
  if (state.points[ti][i] < 1) return false;
  const tree = classData(state.classSlug).trees[ti];
  const mine = tree.talents[i].needs;
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
      if (canAdd(ti, i)) { state.points[ti][i]++; commit(`[data-add="${ti}.${i}"]`); }
      return;
    }
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
    <p class="plan-help">Click a talent to add a point. Right-click it, or use the minus button, to take one back.</p>
    <div class="ftrees plan-trees">
      ${data.trees.map((tree, ti) => raw(treeHtml(tree, ti)))}
    </div>
    <p class="fine">Talents and tiers come from timesaver.gg's WoW Forever calculator. Rows show each tier; exact positions and prerequisite arrows between talents aren't included, so the game may ask for one talent before another in a few places.</p>
  `;
}

function treeHtml(tree, ti) {
  const spent = treeTotal(ti);
  const tiers = [...new Set(tree.talents.map((t) => t.needs))].sort((a, b) => a - b);
  return html`
    <section class="ftree${spent ? " is-main" : ""}">
      <header class="ftree-head">
        <h5>${tree.name}</h5>
        <span class="ftree-spent">${spent} ${spent === 1 ? "point" : "points"}</span>
      </header>
      <ol class="ftree-tiers">
        ${tiers.map((needs) => {
          const open = below(ti, needs) >= needs;
          return raw(html`
            <li class="ftree-tier${open ? "" : " is-locked"}">
              <span class="ftree-tier-label">${needs === 0 ? "Start" : `${needs} pts`}</span>
              <ul class="ftree-row">
                ${tree.talents.map((t, i) => {
                  if (t.needs !== needs) return "";
                  const have = state.points[ti][i];
                  const addable = canAdd(ti, i);
                  return raw(html`
                    <li class="ptalent">
                      <button type="button" class="ftalent${have ? " is-on" : ""}${have && have < t.max ? " is-part" : ""}" data-add="${ti}.${i}"
                        aria-label="${t.name}, ${have} of ${t.max} points. ${addable ? "Add a point" : have >= t.max ? "Full" : open ? "No points left" : `Opens after ${needs} points in ${tree.name}`}" ${addable || have ? "" : "disabled"} ${addable ? "" : 'aria-disabled="true"'}>
                        <span class="ftalent-name">${t.name}</span>
                        <span class="ftalent-rank" aria-hidden="true">${have}/${t.max}</span>
                      </button>
                      ${have ? raw(html`<button type="button" class="ptalent-sub" data-sub="${ti}.${i}" aria-label="Take a point out of ${t.name}" ${canRemove(ti, i) ? "" : "disabled"}>−</button>`) : ""}
                    </li>`);
                })}
              </ul>
            </li>`);
        })}
      </ol>
    </section>`;
}
