// Saved characters + Mythic dungeon lockouts. Shared by the Tracker and Armory views.
// Stored in localStorage under the same key as v1, so existing characters carry over.

import { DUNGEON_POOL, WEEKLY_RESET_RULES, DAILY_LOCKOUT_START, REGIONS } from "../../data/mythic.js";
import { slugify } from "../../lib/format.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { emit } from "../../lib/events.js";

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export function normalizeRegion(value) {
  const r = String(value || "us").trim().toLowerCase();
  return REGIONS.includes(r) ? r : "us";
}

/** The lockout window that contains `now` for a region: weekly until the daily switch date, daily after. */
export function lockoutPeriod(region, now = new Date()) {
  const reg = normalizeRegion(region);
  const rule = WEEKLY_RESET_RULES[reg];
  const dailyStart = new Date(DAILY_LOCKOUT_START[reg]);
  const nowMs = now.getTime();
  const todayReset = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), rule.hourUTC);

  if (nowMs >= dailyStart.getTime()) {
    let start = todayReset;
    if (nowMs < start) start -= DAY;
    return {
      region: reg,
      cadence: "daily",
      start: new Date(start),
      next: new Date(start + DAY),
      key: `${reg}:daily:${new Date(start).toISOString().slice(0, 16)}`,
      switchAt: dailyStart
    };
  }
  const dayDiff = (now.getUTCDay() - rule.day + 7) % 7;
  let start = todayReset - dayDiff * DAY;
  if (nowMs < start) start -= WEEK;
  return {
    region: reg,
    cadence: "weekly",
    start: new Date(start),
    next: new Date(start + WEEK),
    key: `${reg}:weekly:${new Date(start).toISOString().slice(0, 16)}`,
    switchAt: dailyStart
  };
}

/** The game week that contains `now` for a region (Great Vault, weekly quests, raid lockouts). */
export function weeklyPeriod(region, now = new Date()) {
  const reg = normalizeRegion(region);
  const rule = WEEKLY_RESET_RULES[reg];
  const todayReset = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), rule.hourUTC);
  const dayDiff = (now.getUTCDay() - rule.day + 7) % 7;
  let start = todayReset - dayDiff * DAY;
  if (now.getTime() < start) start -= WEEK;
  return {
    region: reg,
    start: new Date(start),
    next: new Date(start + WEEK),
    key: `${reg}:week:${new Date(start).toISOString().slice(0, 13)}`
  };
}

export const characterId = (region, realm, name) => `${normalizeRegion(region)}:${slugify(realm)}:${slugify(name)}`;

const emptyLockouts = () => Object.fromEntries(DUNGEON_POOL.map((d) => [d, false]));

function normalizeCharacter(raw) {
  if (!raw || typeof raw !== "object") return null;
  const region = normalizeRegion(raw.region);
  const realmSlug = slugify(raw.realmSlug || raw.realm);
  const characterSlug = slugify(raw.characterSlug || raw.name);
  if (!realmSlug || !characterSlug) return null;
  const period = lockoutPeriod(region);
  const prevKey = String(raw.periodKey || raw.weekKey || "");
  const incoming = prevKey === period.key && raw.lockouts && typeof raw.lockouts === "object" ? raw.lockouts : {};
  const lockouts = emptyLockouts();
  DUNGEON_POOL.forEach((d) => { lockouts[d] = Boolean(incoming[d]); });
  return {
    id: characterId(region, realmSlug, characterSlug),
    region,
    name: String(raw.name || characterSlug).trim(),
    realm: String(raw.realm || realmSlug).trim(),
    realmSlug,
    characterSlug,
    className: String(raw.className || "").trim(),
    specName: String(raw.specName || "").trim(),
    periodKey: period.key,
    periodStart: period.start.toISOString(),
    cadence: period.cadence,
    lockouts
  };
}

let state = load();

function load() {
  const raw = readJson(KEYS.lockouts, { characters: {} });
  const list = Array.isArray(raw?.characters) ? raw.characters : Object.values(raw?.characters || {});
  const characters = {};
  list.forEach((entry) => {
    const c = normalizeCharacter(entry);
    if (c) characters[c.id] = c;
  });
  return { characters };
}

function save() {
  writeJson(KEYS.lockouts, state);
  emit("characters:changed", listCharacters());
}

/** Clears lockouts for any character whose window has rolled over. */
export function rollOverResets() {
  let changed = false;
  Object.values(state.characters).forEach((c) => {
    const period = lockoutPeriod(c.region);
    if (c.periodKey === period.key) return;
    Object.assign(c, { periodKey: period.key, periodStart: period.start.toISOString(), cadence: period.cadence, lockouts: emptyLockouts() });
    changed = true;
  });
  if (changed) save();
}

export function listCharacters() {
  return Object.values(state.characters).sort((a, b) =>
    `${a.name}-${a.realm}`.localeCompare(`${b.name}-${b.realm}`, undefined, { sensitivity: "base" }));
}

export function getCharacter(id) {
  return state.characters[id] || null;
}

/** Adds or updates a character, keeping this window's lockouts. Returns the saved character. */
export function upsertCharacter(input) {
  const id = characterId(input.region, input.realmSlug || input.realm, input.characterSlug || input.name);
  const existing = state.characters[id];
  const next = normalizeCharacter({ ...(existing || {}), ...input, periodKey: existing?.periodKey });
  if (!next) return null;
  if (existing && existing.periodKey === next.periodKey) next.lockouts = { ...next.lockouts, ...existing.lockouts };
  // Don't wipe known class/spec with blanks.
  if (!next.className && existing?.className) next.className = existing.className;
  if (!next.specName && existing?.specName) next.specName = existing.specName;
  state.characters[next.id] = next;
  save();
  return next;
}

export function removeCharacter(id) {
  if (!state.characters[id]) return;
  delete state.characters[id];
  save();
}

export function toggleLockout(id, dungeon) {
  rollOverResets();
  const c = state.characters[id];
  if (!c || !DUNGEON_POOL.includes(dungeon)) return;
  c.lockouts[dungeon] = !c.lockouts[dungeon];
  save();
}

export function clearLockouts(id) {
  const c = state.characters[id];
  if (!c) return;
  c.lockouts = emptyLockouts();
  save();
}
