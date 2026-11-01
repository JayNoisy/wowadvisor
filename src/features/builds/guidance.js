// Stat priority resolution, stat explanations and rotation steps.

import { ROTATIONS, ROTATIONS_BY_ARCHETYPE } from "../../data/rotations.js";
import { STAT_EXPLANATIONS } from "../../data/stat-explanations.js";
import { SPELL_ICON_MAP, SPELL_ICON_ALIASES } from "../../data/spell-icons.js";
import { getBuild, getRawSpec } from "./data.js";

const ICON_BASE = "https://wow.zamimg.com/images/wow/icons/large/";
export const FALLBACK_ICON = `${ICON_BASE}inv_misc_questionmark.jpg`;
export const TIP_ICON = `${ICON_BASE}inv_misc_book_11.jpg`;

/** builds.json stat data wins; otherwise the hand-written fallback in classes.js. */
export function resolveStatPriority(cls, spec, mode) {
  const build = getBuild(cls.name, spec.name, mode);
  if (Array.isArray(build?.statPriority) && build.statPriority.length) return build.statPriority;
  const raw = getRawSpec(cls.name, spec.name);
  const sp = raw?.statPriorities;
  if (sp && typeof sp === "object") {
    if (Array.isArray(sp[mode]) && sp[mode].length) return sp[mode];
    if (Array.isArray(sp.default) && sp.default.length) return sp.default;
  }
  return Array.isArray(spec.stats) ? spec.stats : [];
}

export function explainStat(spec, stat, mode) {
  const key = String(stat || "").toLowerCase();
  const text =
    STAT_EXPLANATIONS[spec.archetype]?.[key] ||
    STAT_EXPLANATIONS.generic[key] ||
    "A solid stat for consistent performance in most content.";
  const modeNote =
    mode === "pvp"
      ? "In PvP, Versatility and defensive value often climb depending on your comp and matchup."
      : mode === "raid"
        ? "In raid, priority-target consistency and planned cooldown windows matter most."
        : "In Mythic+, value shifts with pull size and damage profile.";
  return { text, modeNote };
}

export function rotationFor(cls, spec, mode) {
  const entry = ROTATIONS[cls.name]?.[spec.name];
  if (entry) {
    const steps = Array.isArray(entry[mode]) && entry[mode].length ? entry[mode] : entry.default || [];
    if (steps.length) return { steps, generic: false };
  }
  return { steps: ROTATIONS_BY_ARCHETYPE[spec.archetype] || ROTATIONS_BY_ARCHETYPE.generic, generic: true };
}

export function rotationModeTip(mode) {
  if (mode === "pvp") return "Hold burst for crowd-control chains and trade defensives early.";
  if (mode === "raid") return "Line cooldowns up with boss timers and execute phases.";
  return "Frontload AoE and rotate defensives through dangerous pulls.";
}

const lookup = (v) => String(v || "").toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
const SPELLS = Object.keys(SPELL_ICON_MAP)
  .map((name) => ({ name, needle: lookup(name) }))
  .sort((a, b) => b.needle.length - a.needle.length);
const ALIASES = Object.entries(SPELL_ICON_ALIASES)
  .map(([alias, name]) => ({ needle: lookup(alias), name }))
  .sort((a, b) => b.needle.length - a.needle.length);

/** Finds the first known spell mentioned in a rotation step so we can show its icon. */
export function spellInStep(text) {
  const t = lookup(text);
  if (!t) return null;
  const hit = SPELLS.find((s) => t.includes(s.needle)) || ALIASES.find((a) => t.includes(a.needle));
  if (!hit || !SPELL_ICON_MAP[hit.name]) return null;
  return { name: hit.name, icon: `${ICON_BASE}${SPELL_ICON_MAP[hit.name]}.jpg` };
}
