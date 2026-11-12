// Weekly progress per character: Great Vault counts, logged keys and checklist ticks.
// Progress belongs to one game week and clears itself when that character's region resets.

import { DEFAULT_TASKS, VAULT_ROWS, KEY_LEVELS } from "../../data/weekly.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { clamp } from "../../lib/format.js";
import { emit } from "../../lib/events.js";
import { weeklyPeriod } from "../tracker/store.js";

/** Used when the player hasn't saved any characters yet. */
export const GENERAL_ID = "general";

const emptyWeek = (weekKey) => ({ weekKey, raid: 0, world: 0, keys: [], done: {} });

function load() {
  const raw = readJson(KEYS.weekly, null);
  const tasks = Array.isArray(raw?.tasks) && raw.tasks.length
    ? raw.tasks.filter((t) => t && t.id && t.label).map((t) => ({ id: String(t.id), label: String(t.label) }))
    : DEFAULT_TASKS.map((t) => ({ ...t }));
  return { tasks, chars: raw?.chars && typeof raw.chars === "object" ? raw.chars : {} };
}

let state = load();

function save() {
  writeJson(KEYS.weekly, state);
  emit("weekly:changed");
}

/** Returns this week's record for a character, starting a fresh one after a reset. */
export function getWeek(charId, region) {
  const weekKey = weeklyPeriod(region).key;
  const current = state.chars[charId];
  if (!current || current.weekKey !== weekKey) {
    state.chars[charId] = emptyWeek(weekKey);
    writeJson(KEYS.weekly, state);
  }
  const week = state.chars[charId];
  week.keys = Array.isArray(week.keys) ? week.keys : [];
  week.done = week.done && typeof week.done === "object" ? week.done : {};
  return week;
}

export function getTasks() {
  return state.tasks;
}

export function setCount(charId, region, rowKey, value) {
  const row = VAULT_ROWS.find((r) => r.key === rowKey);
  if (!row || rowKey === "dungeons") return;
  getWeek(charId, region)[rowKey] = clamp(Math.round(Number(value) || 0), 0, row.max);
  save();
}

export function addKey(charId, region, level) {
  const week = getWeek(charId, region);
  week.keys.push(clamp(Math.round(Number(level) || KEY_LEVELS.start), KEY_LEVELS.min, KEY_LEVELS.max));
  week.keys.sort((a, b) => b - a);
  save();
}

/** Replace this week's logged keys in one go (used by the Raider.IO import). */
export function setKeys(charId, region, levels) {
  const week = getWeek(charId, region);
  week.keys = (Array.isArray(levels) ? levels : [])
    .map((l) => Math.round(Number(l)))
    .filter((l) => Number.isFinite(l) && l >= 0)
    .map((l) => clamp(l, KEY_LEVELS.min, KEY_LEVELS.max))
    .sort((a, b) => b - a)
    .slice(0, 30);
  save();
}

export function removeKey(charId, region, index) {
  const week = getWeek(charId, region);
  week.keys.splice(index, 1);
  save();
}

export function toggleTask(charId, region, taskId) {
  const week = getWeek(charId, region);
  if (week.done[taskId]) delete week.done[taskId];
  else week.done[taskId] = true;
  save();
}

export function addTask(label) {
  const text = String(label || "").trim().slice(0, 80);
  if (!text) return false;
  state.tasks.push({ id: `custom-${Date.now().toString(36)}`, label: text });
  save();
  return true;
}

export function removeTask(taskId) {
  state.tasks = state.tasks.filter((t) => t.id !== taskId);
  save();
}

export function resetTasks() {
  state.tasks = DEFAULT_TASKS.map((t) => ({ ...t }));
  save();
}

/** Vault slots unlocked for a row, given this week's record. */
export function slotsFor(row, week) {
  const count = row.key === "dungeons" ? week.keys.length : Number(week[row.key]) || 0;
  const unlocked = row.thresholds.filter((t) => count >= t).length;
  const next = row.thresholds.find((t) => count < t) ?? null;
  return { count, unlocked, next };
}

/** Short status line for the home page tile. */
export function weeklySummary(charId, region) {
  const week = getWeek(charId, region);
  const slots = VAULT_ROWS.reduce((sum, row) => sum + slotsFor(row, week).unlocked, 0);
  const done = state.tasks.filter((t) => week.done[t.id]).length;
  return { slots, tasksDone: done, tasksTotal: state.tasks.length };
}
