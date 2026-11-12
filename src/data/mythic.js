// Mythic+ data: the current season (pool, affixes, milestones), the Mythic dungeon lockout list, and reset timing.

/* ---------- Current season ----------
   Midnight Season 2 (patch 12.1). Mythic+ opened August 18, 2026.
   Update this block when a new season starts. Timers come from community guides, so verify in game. */

export const SEASON = {
  name: "Midnight Season 2",
  // Timer in minutes. Finish with 20% of the timer left for +2, 40% left for +3.
  dungeons: [
    { name: "Altar of Fangs", from: "Midnight", minutes: 30, isNew: true },
    { name: "Murder Row", from: "Midnight", minutes: 34 },
    { name: "Den of Nalorakk", from: "Midnight", minutes: 32 },
    { name: "The Blinding Vale", from: "Midnight", minutes: 31 },
    { name: "Voidscar Arena", from: "Midnight", minutes: 30 },
    { name: "Kings' Rest", from: "Battle for Azeroth", minutes: 33 },
    { name: "Temple of Sethraliss", from: "Battle for Azeroth", minutes: 33 },
    { name: "Ruby Life Pools", from: "Dragonflight", minutes: 28 }
  ],
  // Rating rewards. The first three are long-standing breakpoints; confirm titles and mounts in game.
  milestones: [
    { rating: 2000, name: "Keystone Master", reward: "Seasonal mount" },
    { rating: 2500, name: "Keystone Hero", reward: "Warband tier-set appearance" },
    { rating: 3000, name: "Keystone Legend", reward: "Second seasonal mount" },
    { rating: 3400, name: "Keystone Myth", reward: "Title and a mount token" }
  ]
};

export const KEY_LEVEL = { min: 2, max: 30 };

/** Affixes are tied to key level. `from`/`to` are inclusive key levels; `to: null` means no upper limit. */
export const AFFIX_LADDER = [
  {
    key: "guidance", name: "Lindormi's Guidance", from: 2, to: 5,
    text: "Marked enemies have 5% less health and deal 5% less damage, and deaths don't cost time. It's the learning bracket."
  },
  {
    key: "bargain", name: "Xal'atath's Bargain", from: 5, to: 11,
    text: "One of four Bargains each week. Handle its mechanic and your group gets a buff; ignore it and enemies get stronger."
  },
  {
    key: "fortTyr", name: "Fortified or Tyrannical", from: 7, to: 9,
    text: "One is active, swapping each week. Fortified: trash has 20% more health and damage. Tyrannical: bosses have 25% more health and 15% more damage."
  },
  {
    key: "both", name: "Fortified and Tyrannical", from: 10, to: null,
    text: "Both are active at once, so trash and bosses are all tougher."
  },
  {
    key: "guile", name: "Xal'atath's Guile", from: 12, to: null,
    text: "Replaces the weekly Bargain. Each death takes 15 seconds off the timer, except in the final minute."
  }
];

/** The four weekly Bargains (active on +5 to +11). */
export const BARGAINS = [
  { key: "ascendant", name: "Ascendant", todo: "Interrupt, stun, knock or purge the Orbs of Ascendance before they finish casting.", reward: "Haste and movement speed" },
  { key: "voidbound", name: "Voidbound", todo: "Swap to the Void Emissary and break its shield before Dark Prayer finishes.", reward: "Versatility and faster cooldowns" },
  { key: "pulsar", name: "Pulsar", todo: "Run into another player's tethered orb within 15 seconds to soak it.", reward: "Mastery and Leech" },
  { key: "devour", name: "Devour", todo: "Heal through or dispel the shield on all five players.", reward: "Stops enemies gaining damage and damage reduction" }
];

export const WEEKLY_AFFIX = [
  { key: "fortified", name: "Fortified" },
  { key: "tyrannical", name: "Tyrannical" }
];

/* ---------- Mythic (non-keystone) dungeon lockouts ---------- */

// Midnight dungeons that have a Mythic lockout. Used by the Lockouts tracker.
export const DUNGEON_POOL = [
  "Windrunner Spire",
  "Murder Row",
  "Maisara Caverns",
  "The Blinding Vale",
  "Den of Nalorakk",
  "Magisters' Terrace",
  "Nexus-Point Xenas",
  "Voidscar Arena",
  "Altar of Fangs"
];

export const REGIONS = ["us", "eu", "kr", "tw"];

// Weekly reset: day is the UTC weekday (0 = Sunday).
// US: Tuesday 15:00 UTC. EU: Wednesday 04:00 UTC. KR/TW values are unverified.
export const WEEKLY_RESET_RULES = {
  us: { day: 2, hourUTC: 15 },
  eu: { day: 3, hourUTC: 4 },
  kr: { day: 3, hourUTC: 1 },
  tw: { day: 3, hourUTC: 1 }
};

// From these moments on, lockouts reset daily at the same hour instead of weekly.
export const DAILY_LOCKOUT_START = {
  us: "2026-03-17T15:00:00Z",
  eu: "2026-03-18T04:00:00Z",
  kr: "2026-03-18T01:00:00Z",
  tw: "2026-03-18T01:00:00Z"
};
