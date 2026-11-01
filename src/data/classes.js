// Every playable class and spec. `stats` is the fallback stat priority when builds.json has none.
// `archetype` drives stat explanations and generic rotation advice.
export const CLASSES = [
  {
    name: "Warrior", slug: "warrior", color: "#C69B6D", icon: "/assets/class-icons/warrior.webp",
    specs: [
      { name: "Arms", slug: "arms", role: "dps", archetype: "melee-burst", stats: ["Critical Strike","Mastery","Haste","Versatility"] },
      { name: "Fury", slug: "fury", role: "dps", archetype: "melee-haste", stats: ["Haste","Mastery","Critical Strike","Versatility"] },
      { name: "Protection", slug: "protection", role: "tank", archetype: "tank", stats: ["Haste","Versatility","Critical Strike","Mastery"] }
    ]
  },
  {
    name: "Paladin", slug: "paladin", color: "#F48CBA", icon: "/assets/class-icons/paladin.webp",
    specs: [
      { name: "Holy", slug: "holy", role: "healer", archetype: "healer", stats: ["Haste","Critical Strike","Mastery","Versatility"] },
      { name: "Protection", slug: "protection", role: "tank", archetype: "tank", stats: ["Haste","Mastery","Versatility","Critical Strike"] },
      { name: "Retribution", slug: "retribution", role: "dps", archetype: "melee-burst", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Hunter", slug: "hunter", color: "#AAD372", icon: "/assets/class-icons/hunter.webp",
    specs: [
      { name: "Beast Mastery", slug: "beast-mastery", role: "dps", archetype: "ranged-pet", stats: ["Critical Strike","Mastery","Haste","Versatility"] },
      { name: "Marksmanship", slug: "marksmanship", role: "dps", archetype: "ranged-burst", stats: ["Mastery","Critical Strike","Haste","Versatility"] },
      { name: "Survival", slug: "survival", role: "dps", archetype: "melee-haste", stats: ["Haste","Critical Strike","Mastery","Versatility"] }
    ]
  },
  {
    name: "Rogue", slug: "rogue", color: "#FFF468", icon: "/assets/class-icons/rogue.webp",
    specs: [
      { name: "Assassination", slug: "assassination", role: "dps", archetype: "dot-melee", stats: ["Mastery","Haste","Critical Strike","Versatility"] },
      { name: "Outlaw", slug: "outlaw", role: "dps", archetype: "melee-haste", stats: ["Haste","Versatility","Critical Strike","Mastery"] },
      { name: "Subtlety", slug: "subtlety", role: "dps", archetype: "melee-burst", stats: ["Mastery","Critical Strike","Versatility","Haste"] }
    ]
  },
  {
    name: "Priest", slug: "priest", color: "#FFFFFF", icon: "/assets/class-icons/priest.webp",
    specs: [
      { name: "Discipline", slug: "discipline", role: "healer", archetype: "healer", stats: ["Haste","Critical Strike","Mastery","Versatility"] },
      { name: "Holy", slug: "holy", role: "healer", archetype: "healer", stats: ["Mastery","Critical Strike","Haste","Versatility"] },
      { name: "Shadow", slug: "shadow", role: "dps", archetype: "dot-caster", stats: ["Haste","Mastery","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Death Knight", slug: "death-knight", color: "#C41E3A", icon: "/assets/class-icons/death-knight.webp",
    specs: [
      { name: "Blood", slug: "blood", role: "tank", archetype: "tank", stats: ["Haste","Versatility","Mastery","Critical Strike"] },
      { name: "Frost", slug: "frost", role: "dps", archetype: "melee-burst", stats: ["Mastery","Haste","Critical Strike","Versatility"] },
      { name: "Unholy", slug: "unholy", role: "dps", archetype: "dot-melee", stats: ["Haste","Mastery","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Shaman", slug: "shaman", color: "#0070DD", icon: "/assets/class-icons/shaman.webp",
    specs: [
      { name: "Elemental", slug: "elemental", role: "dps", archetype: "caster", stats: ["Mastery","Haste","Critical Strike","Versatility"] },
      { name: "Enhancement", slug: "enhancement", role: "dps", archetype: "melee-haste", stats: ["Haste","Mastery","Critical Strike","Versatility"] },
      { name: "Restoration", slug: "restoration", role: "healer", archetype: "healer", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Mage", slug: "mage", color: "#3FC7EB", icon: "/assets/class-icons/mage.webp",
    specs: [
      { name: "Arcane", slug: "arcane", role: "dps", archetype: "caster", stats: ["Mastery","Haste","Versatility","Critical Strike"] },
      { name: "Fire", slug: "fire", role: "dps", archetype: "crit-caster", stats: ["Critical Strike","Haste","Mastery","Versatility"] },
      { name: "Frost", slug: "frost", role: "dps", archetype: "caster", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Warlock", slug: "warlock", color: "#8788EE", icon: "/assets/class-icons/warlock.webp",
    specs: [
      { name: "Affliction", slug: "affliction", role: "dps", archetype: "dot-caster", stats: ["Haste","Mastery","Critical Strike","Versatility"] },
      { name: "Demonology", slug: "demonology", role: "dps", archetype: "caster", stats: ["Haste","Mastery","Critical Strike","Versatility"] },
      { name: "Destruction", slug: "destruction", role: "dps", archetype: "crit-caster", stats: ["Haste","Critical Strike","Mastery","Versatility"] }
    ]
  },
  {
    name: "Monk", slug: "monk", color: "#00FF98", icon: "/assets/class-icons/monk.webp",
    specs: [
      { name: "Brewmaster", slug: "brewmaster", role: "tank", archetype: "tank", stats: ["Versatility","Haste","Critical Strike","Mastery"] },
      { name: "Mistweaver", slug: "mistweaver", role: "healer", archetype: "healer", stats: ["Critical Strike","Mastery","Haste","Versatility"] },
      { name: "Windwalker", slug: "windwalker", role: "dps", archetype: "melee-burst", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Druid", slug: "druid", color: "#FF7C0A", icon: "/assets/class-icons/druid.webp",
    specs: [
      { name: "Balance", slug: "balance", role: "dps", archetype: "caster", stats: ["Mastery","Haste","Critical Strike","Versatility"] },
      { name: "Feral", slug: "feral", role: "dps", archetype: "dot-melee", stats: ["Mastery","Critical Strike","Haste","Versatility"] },
      { name: "Guardian", slug: "guardian", role: "tank", archetype: "tank", stats: ["Versatility","Haste","Mastery","Critical Strike"] },
      { name: "Restoration", slug: "restoration", role: "healer", archetype: "healer", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Demon Hunter", slug: "demon-hunter", color: "#A330C9", icon: "/assets/class-icons/demon-hunter.webp",
    specs: [
      { name: "Havoc", slug: "havoc", role: "dps", archetype: "melee-burst", stats: ["Critical Strike","Mastery","Versatility","Haste"] },
      { name: "Vengeance", slug: "vengeance", role: "tank", archetype: "tank", stats: ["Haste","Versatility","Critical Strike","Mastery"] },
      { name: "Devourer", slug: "devourer", role: "dps", archetype: "caster", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  },
  {
    name: "Evoker", slug: "evoker", color: "#33937F", icon: "/assets/class-icons/evoker.webp",
    specs: [
      { name: "Devastation", slug: "devastation", role: "dps", archetype: "caster", stats: ["Mastery","Haste","Critical Strike","Versatility"] },
      { name: "Preservation", slug: "preservation", role: "healer", archetype: "healer", stats: ["Mastery","Critical Strike","Haste","Versatility"] },
      { name: "Augmentation", slug: "augmentation", role: "dps", archetype: "support-caster", stats: ["Mastery","Haste","Critical Strike","Versatility"] }
    ]
  }
];

export const MODES = [
  { key: "aoe", label: "Mythic+", long: "Mythic+ (AoE)" },
  { key: "raid", label: "Raid", long: "Raid" },
  { key: "pvp", label: "PvP", long: "PvP" }
];

export const ROLE_LABELS = { tank: "Tank", healer: "Healer", dps: "Damage" };

export function findClass(nameOrSlug) {
  const key = String(nameOrSlug || "").toLowerCase();
  return CLASSES.find((c) => c.slug === key || c.name.toLowerCase() === key) || null;
}

export function findSpec(cls, nameOrSlug) {
  if (!cls) return null;
  const key = String(nameOrSlug || "").toLowerCase();
  return cls.specs.find((s) => s.slug === key || s.name.toLowerCase() === key) || null;
}

export function findMode(key) {
  return MODES.find((m) => m.key === String(key || "").toLowerCase()) || null;
}

export function modeLabel(key) {
  return findMode(key)?.long || String(key || "");
}
