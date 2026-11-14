// localStorage wrapper that never throws (private mode, blocked storage, quota).

export const KEYS = {
  copiedBuilds: "wowadvisor_copied_builds_v1",
  authRemember: "wowadvisor_auth_remember_v1",
  lockouts: "wowadvisor_mythic_lockouts_v1",
  mythicContext: "wowadvisor_mythic_context_v3",
  lastBuild: "wowadvisor_last_build_v2",
  // WoW Forever edition
  edition: "wowadvisor_edition_v1",
  foreverLast: "wowadvisor_forever_last_v1",
  foreverFaction: "wowadvisor_forever_faction_v1",
  foreverLevel: "wowadvisor_forever_level_v1",
  foreverCleared: "wowadvisor_forever_cleared_v1",
  foreverDungeonFilter: "wowadvisor_forever_dungeon_filter_v1",
  foreverTodo: "wowadvisor_forever_todo_v1",
  // Shell
  theme: "wowadvisor_theme_v1",
  // Tools
  weekly: "wowadvisor_weekly_v1",
  party: "wowadvisor_party_v1",
  macro: "wowadvisor_macro_v1",
  gearCalc: "wowadvisor_gear_calc_v1",
  calc: "wowadvisor_talent_calc_v1",
  foreverPlanner: "wowadvisor_forever_planner_v1"
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable; the app keeps working in memory.
  }
}

export function readString(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}
