// Raider.IO's public API (no key needed): Mythic+ rating, runs, raid progress and the week's affixes.
// Every call fails soft and returns null, so pages keep working when Raider.IO is down or blocked.

const BASE = "https://raider.io/api/v1";
const cache = new Map(); // url -> { at, data }
const TTL = 5 * 60_000;

async function get(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(url, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

function normalizeRun(run) {
  if (!run || typeof run !== "object") return null;
  const level = num(run.mythic_level);
  if (level == null) return null;
  const clear = num(run.clear_time_ms);
  const par = num(run.par_time_ms);
  return {
    dungeon: String(run.dungeon || run.short_name || "Unknown dungeon"),
    level,
    upgrades: num(run.num_keystone_upgrades) ?? 0, // 0 = over time, 1-3 = timed
    score: num(run.score),
    clearMs: clear,
    parMs: par,
    completedAt: run.completed_at || null,
    url: typeof run.url === "string" && run.url.startsWith("https://") ? run.url : null
  };
}

/**
 * Character profile: rating, best run per dungeon, this week's runs and raid progress.
 * `realm` can be a name or slug; Raider.IO accepts both.
 */
export async function fetchProfile({ region, realm, name }) {
  const data = await get("/characters/profile", {
    region,
    realm,
    name,
    fields: "mythic_plus_scores_by_season:current,mythic_plus_best_runs,mythic_plus_weekly_highest_level_runs,raid_progression"
  });
  if (!data || data.error || data.statusCode >= 400) return null;

  const season = Array.isArray(data.mythic_plus_scores_by_season) ? data.mythic_plus_scores_by_season[0] : null;
  const seg = season?.segments?.all;
  const raids = data.raid_progression && typeof data.raid_progression === "object" ? data.raid_progression : {};
  const list = (arr) => (Array.isArray(arr) ? arr.map(normalizeRun).filter(Boolean) : []);

  return {
    rating: num(seg?.score ?? season?.scores?.all),
    ratingColor: /^#[0-9a-f]{6}$/i.test(seg?.color || "") ? seg.color : null,
    bestRuns: list(data.mythic_plus_best_runs).sort((a, b) => b.level - a.level || (b.score ?? 0) - (a.score ?? 0)),
    weeklyRuns: list(data.mythic_plus_weekly_highest_level_runs).sort((a, b) => b.level - a.level),
    raids: Object.entries(raids)
      .map(([slug, r]) => ({
        name: slug.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" "),
        summary: String(r?.summary || "").trim(),
        total: num(r?.total_bosses) ?? 0,
        normal: num(r?.normal_bosses_killed) ?? 0,
        heroic: num(r?.heroic_bosses_killed) ?? 0,
        mythic: num(r?.mythic_bosses_killed) ?? 0
      }))
      .filter((r) => r.total > 0),
    profileUrl: typeof data.profile_url === "string" && data.profile_url.startsWith("https://") ? data.profile_url : null
  };
}

/** This week's affix names for a region, e.g. ["Xal'atath's Bargain: Voidbound", "Tyrannical", ...]. */
export async function fetchWeeklyAffixes(region) {
  const data = await get("/mythic-plus/affixes", { region, locale: "en" });
  const details = Array.isArray(data?.affix_details) ? data.affix_details : null;
  if (!details) return null;
  return details.map((a) => String(a?.name || "")).filter(Boolean);
}

export function formatClock(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
