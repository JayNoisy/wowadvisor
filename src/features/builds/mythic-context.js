// Your Mythic+ key: level, this week's Fortified/Tyrannical and this week's Bargain.
// Affixes follow from the key level (see AFFIX_LADDER). The context re-ranks stats and adds reminders
// on Mythic+ builds, and drives the Mythic+ page.

import { AFFIX_LADDER, BARGAINS, WEEKLY_AFFIX, KEY_LEVEL } from "../../data/mythic.js";
import { clamp } from "../../lib/format.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { emit } from "../../lib/events.js";

const saved = readJson(KEYS.mythicContext, null);
const context = {
  keyLevel: clamp(Number(saved?.keyLevel) || 10, KEY_LEVEL.min, KEY_LEVEL.max),
  weekAffix: WEEKLY_AFFIX.some((a) => a.key === saved?.weekAffix) ? saved.weekAffix : "fortified",
  bargain: BARGAINS.some((b) => b.key === saved?.bargain) ? saved.bargain : null,
  // True once the week's affixes were filled in from live data rather than by hand.
  live: false
};

function persist() {
  writeJson(KEYS.mythicContext, { keyLevel: context.keyLevel, weekAffix: context.weekAffix, bargain: context.bargain });
  emit("mythic:changed", getMythicContext());
}

export function getMythicContext() {
  return { ...context, active: activeAffixes(context.keyLevel) };
}

export function setKeyLevel(level) {
  const next = clamp(Math.round(Number(level) || 10), KEY_LEVEL.min, KEY_LEVEL.max);
  if (next === context.keyLevel) return;
  context.keyLevel = next;
  persist();
}

export function setWeekAffix(key) {
  if (!WEEKLY_AFFIX.some((a) => a.key === key) || key === context.weekAffix) return;
  context.weekAffix = key;
  context.live = false;
  persist();
}

export function setBargain(key) {
  const next = BARGAINS.some((b) => b.key === key) ? key : null;
  if (next === context.bargain) return;
  context.bargain = next;
  context.live = false;
  persist();
}

/** Fill in the week from live affix names (e.g. from Raider.IO). Unknown names are ignored. */
export function applyLiveAffixes(names) {
  const lower = (names || []).map((n) => String(n || "").toLowerCase());
  const hasFort = lower.some((n) => n.includes("fortified"));
  const hasTyr = lower.some((n) => n.includes("tyrannical"));
  const bargain = BARGAINS.find((b) => lower.some((n) => n.includes(b.key)));
  let changed = false;
  // Both show up in the list on weeks where +10s have both; only trust a clear single answer.
  if (hasFort !== hasTyr) {
    const wk = hasFort ? "fortified" : "tyrannical";
    if (wk !== context.weekAffix) { context.weekAffix = wk; changed = true; }
  }
  if (bargain && bargain.key !== context.bargain) { context.bargain = bargain.key; changed = true; }
  if (bargain || hasFort !== hasTyr) context.live = true;
  if (changed || context.live) persist();
}

const inRange = (rung, level) => level >= rung.from && (rung.to == null || level <= rung.to);

/** What's actually in play at a key level, resolved against this week's rotation. */
export function activeAffixes(level = context.keyLevel) {
  const rungs = Object.fromEntries(AFFIX_LADDER.map((r) => [r.key, inRange(r, level)]));
  const both = rungs.both;
  return {
    guidance: rungs.guidance,
    bargain: rungs.bargain ? BARGAINS.find((b) => b.key === context.bargain) || { key: null, name: "this week's Bargain" } : null,
    fortified: both || (rungs.fortTyr && context.weekAffix === "fortified"),
    tyrannical: both || (rungs.fortTyr && context.weekAffix === "tyrannical"),
    guile: rungs.guile
  };
}

/** Short labels for the affixes at a key level, e.g. ["Fortified", "Tyrannical", "Xal'atath's Guile"]. */
export function activeAffixNames(level = context.keyLevel) {
  const a = activeAffixes(level);
  const out = [];
  if (a.guidance) out.push("Lindormi's Guidance");
  if (a.bargain) out.push(a.bargain.key ? `Bargain: ${a.bargain.name}` : "Xal'atath's Bargain");
  if (a.fortified) out.push("Fortified");
  if (a.tyrannical) out.push("Tyrannical");
  if (a.guile) out.push("Xal'atath's Guile");
  return out;
}

function rankWithBonus(base, bonusByStat) {
  const deduped = [...new Set(base.map((s) => String(s || "").trim()).filter(Boolean))];
  const weight = (stat, idx) => (deduped.length - idx) * 100 + (bonusByStat[stat] || 0);
  return deduped
    .map((stat, idx) => ({ stat, idx, w: weight(stat, idx) }))
    .sort((a, b) => b.w - a.w || a.idx - b.idx)
    .map((r) => r.stat);
}

/** Returns the stat order adjusted for the current key, plus the reasons for each shift. */
export function adaptStatsForMythic(baseStats, role) {
  const { keyLevel } = context;
  const a = activeAffixes(keyLevel);
  const bonus = {};
  const reasons = [];
  const add = (stat, amount) => { bonus[stat] = (bonus[stat] || 0) + amount; };

  if (keyLevel >= 12) {
    add("Versatility", 22);
    reasons.push(`At +${keyLevel}, every death costs 15 seconds, so survivability counts for more.`);
    if (role === "tank" || role === "healer") {
      add("Versatility", 12);
      add("Haste", 8);
      reasons.push("As a tank or healer, defensive throughput and reaction speed gain extra value.");
    }
  }
  if (a.fortified && !a.tyrannical) {
    add("Haste", 18);
    add("Mastery", 10);
    reasons.push("Fortified favours repeatable trash damage and pull-to-pull cooldowns.");
  }
  if (a.tyrannical && !a.fortified) {
    add("Mastery", 16);
    add("Critical Strike", 10);
    reasons.push("Tyrannical shifts value toward priority-target and boss damage.");
  }
  if (a.bargain?.key === "ascendant" || a.bargain?.key === "devour") {
    add("Haste", 8);
    reasons.push(`${a.bargain.name} rewards faster globals for stops, dispels and spot healing.`);
  }
  return { stats: rankWithBonus(baseStats, bonus), reasons };
}

export function mythicBuildReminders() {
  const { keyLevel } = context;
  const a = activeAffixes(keyLevel);
  const out = [];
  if (a.guile) out.push("Deaths cost 15 seconds each at this level: plan defensives and externals before damage cooldowns.");
  if (a.fortified && a.tyrannical) out.push("Fortified and Tyrannical are both active: split cooldowns between big pulls and bosses.");
  else if (a.tyrannical) out.push("Tyrannical week: hold major cooldowns for bosses.");
  else if (a.fortified) out.push("Fortified week: frontload AoE cooldowns on large trash pulls.");
  if (a.bargain?.key) out.push(`${a.bargain.name}: ${a.bargain.todo}`);
  return out;
}
