// Midnight Season 2 item levels: upgrade tracks, crests, and what drops where.
// Sources: warcraft.wiki.gg "Midnight Season 2", Method and Icy Veins season guides (checked 2026-11-13).
// Update this file when a new season starts.

export const GEAR_SEASON = "Midnight Season 2";
export const GEAR_CHECKED = "2026-11-13";

/** Every track has six ranks. Rank 5 and 6 of a track equal rank 1 and 2 of the next one. */
export const TRACKS = [
  { key: "adventurer", name: "Adventurer", ilvls: [266, 269, 272, 276, 279, 282] },
  { key: "veteran", name: "Veteran", ilvls: [279, 282, 285, 289, 292, 295] },
  { key: "champion", name: "Champion", ilvls: [292, 295, 298, 302, 305, 308] },
  { key: "hero", name: "Hero", ilvls: [305, 308, 311, 315, 318, 321] },
  { key: "myth", name: "Myth", ilvls: [318, 321, 324, 328, 331, 334] }
];

export const CRESTS = {
  perUpgrade: 20,
  weeklyCap: 100,
  // The crest shares its track's name.
  sources: {
    adventurer: "Repeatable outdoor events and Tier 4 delves",
    veteran: "Raid Finder, Heroic dungeons, Tier 5 to 6 delves and outdoor events",
    champion: "Normal raid, Mythic dungeons, +2 and +3 keys, Tier 7 to 10 delves and weekly outdoor events",
    hero: "Heroic raid, +4 to +8 keys and Tier 11 delves",
    myth: "Mythic raid and keys at +9 and above"
  }
};

const t = (track, rank) => ({ track, rank });

/** Mythic+ rewards. `to: null` means "and above". `crest` is the Mistcrest the run awards. */
export const MPLUS_REWARDS = [
  { from: 2, to: 3, loot: t("champion", 2), vault: t("hero", 1), crest: "champion" },
  { from: 4, to: 4, loot: t("champion", 3), vault: t("hero", 2), crest: "hero" },
  { from: 5, to: 5, loot: t("champion", 4), vault: t("hero", 2), crest: "hero" },
  { from: 6, to: 6, loot: t("hero", 1), vault: t("hero", 3), crest: "hero" },
  { from: 7, to: 7, loot: t("hero", 1), vault: t("hero", 4), crest: "hero" },
  { from: 8, to: 8, loot: t("hero", 2), vault: t("hero", 4), crest: "hero" },
  { from: 9, to: 9, loot: t("hero", 2), vault: t("hero", 4), crest: "myth" },
  { from: 10, to: null, loot: t("hero", 3), vault: t("myth", 1), crest: "myth" }
];

export const DUNGEON_REWARDS = [
  { name: "Heroic dungeon", loot: t("adventurer", 4), vault: t("veteran", 4) },
  { name: "Mythic dungeon (no key)", loot: t("champion", 1), vault: t("champion", 4) }
];

/** The Venomous Abyss. Later bosses drop higher ranks of the same track. */
export const RAID = {
  name: "The Venomous Abyss",
  groups: [
    { name: "First boss", bosses: "Nek'zali the Soulcoiler", rank: 1 },
    { name: "Middle bosses", bosses: "Entombed Sentinels, The Lost Explorers", rank: 2 },
    { name: "Late bosses", bosses: "Vashnik the Malignant, Sszorak, The Twin Fangs", rank: 3 },
    { name: "Final bosses", bosses: "The Coiled Altar, Ula'tek", rank: 4 }
  ],
  difficulties: [
    { name: "Raid Finder", track: "veteran" },
    { name: "Normal", track: "champion" },
    { name: "Heroic", track: "hero" },
    { name: "Mythic", track: "myth" }
  ],
  // The last two Mythic bosses drop above the Myth track.
  mythicFinalIlvl: 344
};

/** Delves: the Bountiful chest and the Great Vault's world row. */
export const DELVES = [
  { tier: 1, loot: t("adventurer", 1), vault: t("veteran", 1) },
  { tier: 2, loot: t("adventurer", 2), vault: t("veteran", 2) },
  { tier: 3, loot: t("adventurer", 3), vault: t("veteran", 3) },
  { tier: 4, loot: t("adventurer", 4), vault: t("veteran", 4) },
  { tier: 5, loot: t("veteran", 1), vault: t("champion", 1) },
  { tier: 6, loot: t("veteran", 2), vault: t("champion", 3) },
  { tier: 7, loot: t("champion", 1), vault: t("champion", 4) },
  { tier: 8, loot: t("champion", 2), vault: t("hero", 1), andUp: true }
];

/** Crafted gear by what you put in it (rank 1 materials to rank 5). */
export const CRAFTED = [
  { name: "No crest", cost: "Nothing extra", ilvls: [259, 262, 265, 268, 271] },
  { name: "Adventurer", cost: "80 Adventurer Mistcrests", ilvls: [266, 270, 273, 276, 279] },
  { name: "Veteran", cost: "80 Veteran Mistcrests", ilvls: [279, 283, 286, 289, 292] },
  { name: "Spark only", cost: "Spark of Tides", ilvls: [292, 296, 299, 302, 305] },
  { name: "Hero", cost: "Spark of Tides and 80 Hero Mistcrests", ilvls: [305, 309, 312, 315, 318] },
  { name: "Myth", cost: "Spark of Tides and 80 Myth Mistcrests", ilvls: [318, 322, 325, 328, 331] }
];

export const trackByKey = (key) => TRACKS.find((x) => x.key === key);
export const ilvlOf = ({ track, rank }) => trackByKey(track).ilvls[rank - 1];
export const label = ({ track, rank }) => `${trackByKey(track).name} ${rank}/6`;
export const mplusRow = (level) => MPLUS_REWARDS.find((r) => level >= r.from && (r.to == null || level <= r.to)) || MPLUS_REWARDS[0];
