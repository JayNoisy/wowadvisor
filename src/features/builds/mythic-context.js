// Mythic+ key level + affix context. Re-ranks stats and adds reminders for the AoE (Mythic+) mode.

import { AFFIXES } from "../../data/mythic.js";
import { clamp } from "../../lib/format.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { emit } from "../../lib/events.js";

const saved = readJson(KEYS.mythicContext, null);
const context = {
  keyLevel: clamp(Number(saved?.keyLevel) || 10, 2, 35),
  affixes: new Set((Array.isArray(saved?.affixes) ? saved.affixes : ["Fortified"]).filter((a) => AFFIXES.includes(a)))
};

function persist() {
  writeJson(KEYS.mythicContext, { keyLevel: context.keyLevel, affixes: [...context.affixes] });
  emit("mythic:changed", getMythicContext());
}

export function getMythicContext() {
  return { keyLevel: context.keyLevel, affixes: [...context.affixes] };
}

export function setKeyLevel(level) {
  const next = clamp(Math.round(Number(level) || 10), 2, 35);
  if (next === context.keyLevel) return;
  context.keyLevel = next;
  persist();
}

export function toggleAffix(affix) {
  if (!AFFIXES.includes(affix)) return;
  if (context.affixes.has(affix)) {
    context.affixes.delete(affix);
  } else {
    context.affixes.add(affix);
    // Fortified and Tyrannical alternate weekly; picking one replaces the other.
    if (affix === "Fortified") context.affixes.delete("Tyrannical");
    if (affix === "Tyrannical") context.affixes.delete("Fortified");
  }
  persist();
}

export function clearAffixes() {
  context.affixes.clear();
  persist();
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
  const { keyLevel, affixes } = getMythicContext();
  const has = (a) => affixes.includes(a);
  const bonus = {};
  const reasons = [];
  const add = (stat, amount) => { bonus[stat] = (bonus[stat] || 0) + amount; };

  if (keyLevel >= 12) {
    add("Versatility", 22);
    reasons.push(`At +${keyLevel}, survivability and consistency count for more.`);
    if (role === "tank" || role === "healer") {
      add("Versatility", 12);
      add("Haste", 8);
      reasons.push("As a tank or healer, defensive throughput and reaction speed gain extra value.");
    }
  }
  if (has("Fortified")) {
    add("Haste", 18);
    add("Mastery", 10);
    reasons.push("Fortified favours repeatable trash damage and pull-to-pull cooldowns.");
  }
  if (has("Tyrannical")) {
    add("Mastery", 16);
    add("Critical Strike", 10);
    reasons.push("Tyrannical shifts value toward priority-target and boss damage.");
  }
  if (has("Raging") || has("Bolstering")) {
    add("Versatility", 10);
    add("Critical Strike", 6);
    reasons.push("Raging and Bolstering reward controlled kill timing.");
  }
  if (has("Bursting") || has("Spiteful") || has("Sanguine")) {
    add("Versatility", 12);
    add("Haste", 6);
    reasons.push("Bursting, Spiteful and Sanguine favour stability and quick defensive reactions.");
  }
  if (has("Afflicted") || has("Incorporeal") || has("Entangling")) {
    add("Haste", 10);
    reasons.push("Utility affixes reward faster globals for dispels, stops and interrupts.");
  }
  if (has("Volcanic") || has("Storming")) {
    add("Versatility", 8);
    reasons.push("Movement affixes make Versatility's safety more valuable.");
  }

  return { stats: rankWithBonus(baseStats, bonus), reasons };
}

export function mythicBuildReminders() {
  const { keyLevel, affixes } = getMythicContext();
  const out = [];
  if (keyLevel >= 12) out.push("High key: plan defensives and externals before optimising damage cooldowns.");
  if (affixes.includes("Tyrannical")) out.push("Hold major cooldowns for bosses and dangerous mini-boss pulls.");
  if (affixes.includes("Fortified")) out.push("Frontload AoE cooldowns on large trash pulls.");
  if (affixes.includes("Bursting")) out.push("Stagger kills to avoid lethal Bursting stacks.");
  if (affixes.includes("Spiteful") || affixes.includes("Storming") || affixes.includes("Volcanic")) {
    out.push("Pre-position before burst windows so movement doesn't cost uptime.");
  }
  return out;
}
