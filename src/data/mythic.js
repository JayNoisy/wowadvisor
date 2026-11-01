// Mythic+ data: affixes for the build context, the current dungeon pool, and lockout reset timing.

export const AFFIXES = [
  "Fortified",
  "Tyrannical",
  "Bolstering",
  "Bursting",
  "Raging",
  "Sanguine",
  "Spiteful",
  "Volcanic",
  "Storming",
  "Entangling",
  "Afflicted",
  "Incorporeal"
];

export const DUNGEON_POOL = [
  "Windrunner Spire",
  "Murder Row",
  "Maisara Caverns",
  "The Blinding Vale",
  "Den of Nalorakk",
  "Magisters' Terrace",
  "Nexus-Point Xenas",
  "Voidscar Arena"
];

export const REGIONS = ["us", "eu", "kr", "tw"];

// Weekly reset: day is the UTC weekday (0 = Sunday).
export const WEEKLY_RESET_RULES = {
  us: { day: 2, hourUTC: 15 },
  eu: { day: 3, hourUTC: 7 },
  kr: { day: 3, hourUTC: 1 },
  tw: { day: 3, hourUTC: 1 }
};

// From these moments on, lockouts reset daily at the same hour instead of weekly.
export const DAILY_LOCKOUT_START = {
  us: "2026-03-17T15:00:00Z",
  eu: "2026-03-18T07:00:00Z",
  kr: "2026-03-18T01:00:00Z",
  tw: "2026-03-18T01:00:00Z"
};
