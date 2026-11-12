// What each spec brings to a group. Spell names are listed so players can check them in game.
// Covers baseline kits and the talents nearly every build takes; rarely-picked talents are left out.
// Raid buff list follows the Midnight changes (Hunter's Mark is now 3% damage taken on one target).

const DISPEL = { magic: "Magic", curse: "Curse", poison: "Poison", disease: "Disease", bleed: "Bleed" };
export const DISPEL_TYPES = Object.entries(DISPEL).map(([key, label]) => ({ key, label }));

// Class-wide kit. `specs` overrides or extends it per spec.
const KITS = {
  Warrior: {
    buff: { name: "Battle Shout", text: "5% attack power" },
    interrupt: "Pummel"
  },
  Paladin: {
    brez: "Intercession",
    buff: { name: "Devotion Aura", text: "3% less damage taken" },
    interrupt: "Rebuke",
    dispels: { poison: "Cleanse Toxins", disease: "Cleanse Toxins" },
    specs: { Holy: { dispels: { magic: "Cleanse", poison: "Cleanse", disease: "Cleanse" } } }
  },
  Hunter: {
    lust: "Primal Rage (pet)",
    buff: { name: "Hunter's Mark", text: "3% more damage taken by one target" },
    interrupt: "Counter Shot",
    soothe: "Tranquilizing Shot",
    purge: "Tranquilizing Shot",
    specs: { Survival: { interrupt: "Muzzle" } }
  },
  Rogue: {
    buff: { name: "Atrophic Poison", text: "enemies deal 3% less damage" },
    interrupt: "Kick",
    soothe: "Shiv"
  },
  Priest: {
    buff: { name: "Power Word: Fortitude", text: "5% Stamina" },
    purge: "Dispel Magic",
    dispels: { magic: "Purify", disease: "Purify" },
    specs: { Shadow: { interrupt: "Silence", dispels: { disease: "Purify Disease" } } }
  },
  "Death Knight": {
    brez: "Raise Ally",
    interrupt: "Mind Freeze"
  },
  Shaman: {
    lust: "Bloodlust / Heroism",
    buff: { name: "Skyfury", text: "2% Mastery and extra auto attacks" },
    interrupt: "Wind Shear",
    purge: "Purge",
    dispels: { curse: "Cleanse Spirit", poison: "Poison Cleansing Totem" },
    specs: { Restoration: { dispels: { magic: "Purify Spirit", curse: "Purify Spirit", poison: "Poison Cleansing Totem" } } }
  },
  Mage: {
    lust: "Time Warp",
    buff: { name: "Arcane Intellect", text: "3% Intellect" },
    interrupt: "Counterspell",
    purge: "Spellsteal",
    dispels: { curse: "Remove Curse" }
  },
  Warlock: {
    brez: "Soulstone",
    interrupt: "Spell Lock (Felhunter)",
    purge: "Devour Magic (Felhunter)",
    dispels: { magic: "Singe Magic (Imp)" },
    specs: { Demonology: { interrupt: "Axe Toss (Felguard)" } }
  },
  Monk: {
    buff: { name: "Mystic Touch", text: "5% more physical damage taken by enemies" },
    interrupt: "Spear Hand Strike",
    dispels: { poison: "Detox", disease: "Detox" },
    specs: { Mistweaver: { dispels: { magic: "Detox", poison: "Detox", disease: "Detox" } } }
  },
  Druid: {
    brez: "Rebirth",
    buff: { name: "Mark of the Wild", text: "3% Versatility" },
    interrupt: "Skull Bash",
    soothe: "Soothe",
    dispels: { curse: "Remove Corruption", poison: "Remove Corruption" },
    specs: {
      Balance: { interrupt: "Solar Beam" },
      Restoration: { interrupt: "Skull Bash (needs cat or bear form)", dispels: { magic: "Nature's Cure", curse: "Nature's Cure", poison: "Nature's Cure" } }
    }
  },
  "Demon Hunter": {
    buff: { name: "Chaos Brand", text: "3% more magic damage taken by enemies" },
    interrupt: "Disrupt",
    purge: "Consume Magic"
  },
  Evoker: {
    lust: "Fury of the Aspects",
    buff: { name: "Blessing of the Bronze", text: "shorter movement cooldowns" },
    interrupt: "Quell",
    dispels: { poison: "Expunge", bleed: "Cauterizing Flame", curse: "Cauterizing Flame", disease: "Cauterizing Flame" },
    specs: { Preservation: { dispels: { magic: "Naturalize", poison: "Naturalize", bleed: "Cauterizing Flame", curse: "Cauterizing Flame", disease: "Cauterizing Flame" } } }
  }
};

/** Resolved kit for one spec: { lust, brez, buff, interrupt, soothe, purge, dispels } with null for anything missing. */
export function kitFor(className, specName) {
  const base = KITS[className] || {};
  const over = base.specs?.[specName] || {};
  const pick = (k) => (k in over ? over[k] : base[k]) ?? null;
  return {
    lust: pick("lust"),
    brez: pick("brez"),
    buff: pick("buff"),
    interrupt: pick("interrupt"),
    soothe: pick("soothe"),
    purge: pick("purge"),
    dispels: pick("dispels") || {}
  };
}

/** Every raid buff a full group could have, for the "missing buffs" list. */
export const ALL_BUFFS = Object.entries(KITS)
  .filter(([, kit]) => kit.buff)
  .map(([className, kit]) => ({ className, ...kit.buff }));

export const PARTY_SLOTS = [
  { role: "tank", label: "Tank" },
  { role: "healer", label: "Healer" },
  { role: "dps", label: "Damage" },
  { role: "dps", label: "Damage" },
  { role: "dps", label: "Damage" }
];
