// World of Warcraft: Forever data.
// Sources: Blizzard's beta class deep dives (Sept–Oct 2026, as summarised by Warcraft Tavern),
// Blizzard's "Explore the New Dungeons" article, and the launch roadmap.
// Blizzard has said talents can change before and after launch, so treat tiers as the beta layout.

import { findClass } from "./classes.js";

export const FOREVER_LAUNCH = "2026-11-04T23:00:00Z"; // Nov 4, 3:00 p.m. PST
export const FOREVER_RAIDS_OPEN = "2026-12-09T00:00:00Z"; // date announced, time not yet
export const FOREVER_LEVEL_CAP = 60;

export const FOREVER_RULES = [
  "Talents start at level 10. Gold talents sit at 11, 16, 21 and 31 points in a tree.",
  "Dual specialization unlocks at level 40.",
  "Change talents at your class trainer in a major city.",
  "The level cap stays at 60. No flying and no level scaling."
];

export const TALENT_CALC_URL = (slug) => `https://www.warcrafttavern.com/forever/tools/talent-calculator/${slug}`;

const ROLE = { dps: "Damage", healer: "Healer", tank: "Tank" };
export const roleLabel = (roles) => roles.map((r) => ROLE[r]).join(" or ");

// Rule-of-thumb stat orders. Forever's talents change a few of these, noted per tree.
const STATS = {
  caster: ["Spell hit, up to the cap", "Spell power", "Spell crit", "Intellect"],
  healer: ["Healing power", "Spirit and mana per 5", "Intellect", "Spell crit"],
  plate: ["Hit, up to the cap", "Strength", "Crit", "Agility"],
  agile: ["Hit, up to the cap", "Agility", "Attack power", "Crit"],
  tank: ["Defense, until crits can't land", "Stamina", "Armor", "Dodge and parry"]
};

const t = (name, text) => ({ name, text });
const p = (points, name, text) => ({ points, name, text });

const CLASS_DATA = [
  {
    slug: "warrior",
    summary: "Melee specialist with the best sustained multi-target damage and unique raid buffs, but little self-healing once things go wrong.",
    baseline: [
      t("Rage", "Taking damage now generates Rage as if you had 50% armor, so better gear no longer starves you. Rage from hits scales with weapon speed."),
      t("Victory Rush", "Level 20. Usable for 20 seconds after a kill and heals 10% of your health."),
      t("Tactical Mastery", "Level 14 baseline. You keep 10 Rage when changing stances."),
      t("Separate cooldowns", "Recklessness, Retaliation and Shield Wall no longer share a cooldown. Thunder Clap works in Defensive Stance.")
    ],
    trees: [
      {
        name: "Arms", slug: "arms", roles: ["dps"],
        focus: "Big two-handed hits, Overpower procs and a new anti-mount strike.",
        path: [p(16, "Spearing Strike", "15 Rage instant hit on a 20 sec cooldown. Dismounts, and deals double damage to mounted, dragon and giant targets.")],
        key: [
          t("Weaponmaster", "Replaces the old weapon specializations: axes and polearms add crit, maces and staves ignore armor, swords grant extra swings."),
          t("Bloodthrill", "Main-hand hits on a Rend target can light up Overpower for 6 seconds."),
          t("Improved Slam", "Now 2 points and no longer delays your auto attacks."),
          t("Iron Will", "Moved here from Protection. Shortens stuns on you.")
        ],
        stats: STATS.plate,
        loop: ["Keep Rend on targets that will live long enough.", "Overpower whenever Bloodthrill or a dodge lights it up.", "Spearing Strike on cooldown, especially on dragons and giants.", "Slam to spend extra Rage now that it doesn't clip auto attacks."]
      },
      {
        name: "Fury", slug: "fury", roles: ["dps"],
        focus: "Dual-wield or two-hander frenzy fed by crit-driven Rage.",
        path: [p(16, "Raging Blows", "Whirlwind hits with both weapons and Cleave costs less Rage.")],
        key: [
          t("Boundless Rage", "Raises your maximum Rage."),
          t("Precision", "Row 5. Increases hit chance."),
          t("Enrage", "Now triggers from any damage taken."),
          t("Bloodthirst", "No longer heals. Grants 10% movement speed for 10 seconds instead.")
        ],
        stats: ["Hit, up to the cap", "Crit", "Strength", "Agility"],
        statsNote: "Crits generate 75% more Rage than normal hits in Forever, so crit climbs above Strength for Fury.",
        loop: ["Bloodthirst on cooldown.", "Whirlwind on packs; Raging Blows makes it hit with both weapons.", "Cleave as a Rage dump on two or more targets.", "Death Wish for burst, knowing it now raises damage you take."]
      },
      {
        name: "Protection", slug: "protection", roles: ["tank"],
        focus: "Shield tank with steadier Rage and a Defensive Stance Charge.",
        path: [p(16, "Vanguard", "Lets you Charge while in Defensive Stance.")],
        key: [
          t("Master of Defense", "Chance for 5 Rage when you dodge or parry with a shield."),
          t("Bastion", "Increases all damage while a shield is equipped."),
          t("Focused Rage", "Cuts the Rage cost of offensive abilities."),
          t("Shield Slam", "Scales harder with Block Value.")
        ],
        stats: STATS.tank,
        loop: ["Charge in with Vanguard and open with Shield Slam.", "Sunder Armor and Revenge for single-target threat.", "Thunder Clap, now usable in Defensive Stance, on packs.", "Shield Block ahead of big hits."]
      }
    ]
  },
  {
    slug: "paladin",
    summary: "Tough holy warrior, strongest against Undead and Demons. Has no interrupt, no slow and limited range.",
    baseline: [
      t("Holy Strike", "Learned at level 6. Instant Holy damage based on your weapon."),
      t("Seal of Fury", "Level 10. Holy damage on every swing plus a small absorb shield. Its Judgement taunts from 10 yards."),
      t("Consecration", "Now baseline at level 20 for every Paladin."),
      t("Judgement and Lay on Hands", "Judgement no longer eats your Seal. Lay on Hands is down to a 20 minute cooldown.")
    ],
    trees: [
      {
        name: "Holy", slug: "holy", roles: ["healer"],
        focus: "The strongest single-target healer, with a supported Shockadin hybrid.",
        path: [
          p(11, "Voice of Truth", "6 seconds of immunity to silence and interrupts. 3 minute cooldown."),
          p(16, "Divine Favor", "Moved down from 21 points."),
          p(21, "Holy Shock", "Moved down from 31 points, and its cooldown drops from 30 to 10 seconds."),
          p(31, "Light's Vigil", "Heals the target's party, or damages an enemy, and makes your next Holy Shock on that target free of cooldown.")
        ],
        key: [
          t("Infusion of Light", "Holy Shock and Flash of Light crits speed up your next Holy Light."),
          t("Reverence", "Keeps up to 30% of Spirit regen while casting."),
          t("Illumination", "Now requires Reverence and refunds 50% of base cost."),
          t("Divine Precision", "Up to 18% hit with Holy spells, for Shockadin builds.")
        ],
        stats: ["Healing power", "Intellect", "Spell crit", "Spirit and mana per 5"],
        statsNote: "Illumination still rewards crit, and Reverence makes Spirit useful mid-fight for the first time.",
        loop: ["Holy Shock on cooldown, every 10 seconds.", "Flash of Light to fish for Infusion of Light.", "Holy Light when Infusion makes it faster.", "Light's Vigil when the whole party is taking damage."]
      },
      {
        name: "Protection", slug: "protection", roles: ["tank"],
        focus: "Seal of Fury tank with real emergency cooldowns.",
        path: [
          p(11, "Improved Seal of Fury", "Returns mana when a Seal of Fury shield is fully used up."),
          p(16, "Swift Judgement", "Resets Judgement and makes the next one free. 1 minute cooldown."),
          p(21, "Templar's Bulwark", "Absorbs damage equal to 100% of your health for 8 seconds. 5 minute cooldown.")
        ],
        key: [
          t("Holy Shield", "Now follows Templar's Bulwark."),
          t("Iron Creed", "More Holy Strike threat, and damage reduction from Holy Strike while Righteous Fury is up."),
          t("Sacred Duty", "More Stamina and shorter Divine Shield, Divine Protection and Bulwark cooldowns."),
          t("Shield Specialization", "Blocks can restore 6% of your mana, once every 3 seconds.")
        ],
        stats: STATS.tank,
        loop: ["Seal of Fury up at all times; judge it to taunt from range.", "Consecration and Holy Shield on packs.", "Holy Strike for single-target threat.", "Templar's Bulwark or Swift Judgement when a pull goes bad."]
      },
      {
        name: "Retribution", slug: "retribution", roles: ["dps"],
        focus: "Consistent melee damage, group Judgements and the return of Seal twisting.",
        path: [
          p(16, "Sacred Arbiter", "Holy Strike hits 20% harder and refreshes every Judgement on the target."),
          p(21, "Repentance", "Moved down from 31 points."),
          p(31, "Twist of Light", "Seal twisting returns: a replaced Seal leaves an Echo that fires alongside the new one on your next swing.")
        ],
        key: [
          t("Vengeance", "Up to 9% more damage for 30 seconds at 3 stacks."),
          t("Sanctified Judgement", "Judgement refunds part of the judged Seal's cost."),
          t("Champion of the Light", "Adds spell damage equal to part of your Intellect."),
          t("Instrument of the Law", "Instant Holy Wrath.")
        ],
        stats: ["Hit, up to the cap", "Strength", "Crit", "Intellect"],
        statsNote: "Champion of the Light turns Intellect into spell damage, so Intellect matters more than it did in Classic.",
        loop: ["Keep a Seal up and Judge on cooldown.", "Holy Strike on cooldown to refresh Judgements with Sacred Arbiter.", "With Twist of Light, swap Seals just before a swing lands.", "Exorcism and Holy Wrath on Undead and Demons."]
      }
    ]
  },
  {
    slug: "hunter",
    summary: "Longest range in the game and a pet that can tank solo content. Can't fire inside 8 yards and has no stun or interrupt.",
    baseline: [
      t("Aimed Shot", "Every Hunter gets it at level 20. Multi-Shot now shares its cooldown; Arcane Shot doesn't."),
      t("Traps in combat", "Traps can be dropped mid-fight on a 30 second cooldown. Frost and Fire traps cool down separately."),
      t("Pets", "Pets scale from your gear. Every family gets one unique ability, and Foxes are a new family."),
      t("Aspect of the Beast", "Now also grants melee attack power.")
    ],
    trees: [
      {
        name: "Beast Mastery", slug: "beast-mastery", roles: ["dps"],
        focus: "You and your pet hit harder together, now with summoned Hawks.",
        path: [p(16, "Summon Hawk", "Instant damage plus a Hawk for 18 seconds, up to two at once. Shares a cooldown with Arcane Shot.")],
        key: [
          t("Focused Fire", "More damage from you and your pet while it's out."),
          t("Deadly Aspects", "Attack speed on melee hits while Aspect of the Beast is active."),
          t("Intimidation", "Now also gives your pet a guaranteed bonus crit on its next attack."),
          t("Bestial Discipline", "Adds Spirit-based mana regen while casting.")
        ],
        stats: STATS.agile,
        loop: ["Send the pet first and let it build threat.", "Summon Hawk on cooldown in place of Arcane Shot.", "Aimed Shot or Multi-Shot on their shared cooldown.", "Auto Shot in between; Serpent Sting on longer fights."]
      },
      {
        name: "Marksmanship", slug: "marksmanship", roles: ["dps"],
        focus: "Shot-based damage with a no-pet option and a long-range sniper capstone.",
        path: [
          p(11, "Lone Wolf", "20% more damage while you have no active pet."),
          p(21, "Trueshot Aura", "Moved to 21 points, with new lower ranks."),
          p(31, "Sniper Shot", "4 second cast, 15 second cooldown. Extends the range of your next three shots.")
        ],
        key: [
          t("Careful Aim", "Adds attack power from Intellect."),
          t("Rapid Killing", "Kills shorten Rapid Fire and empower your next shot."),
          t("Barrage", "Now also boosts Aimed Shot and Multi-Shot."),
          t("Lethal Attacks", "Crit for every attack, moved to row 1.")
        ],
        stats: ["Hit, up to the cap", "Agility", "Intellect", "Crit"],
        statsNote: "Careful Aim turns Intellect into attack power, which lifts Intellect well above where it sat in Classic.",
        loop: ["Decide early: pet out, or Lone Wolf.", "Sniper Shot to open and on cooldown.", "Aimed Shot or Multi-Shot on cooldown, Arcane Shot between them.", "Rapid Fire after kills thanks to Rapid Killing."]
      },
      {
        name: "Survival", slug: "survival", roles: ["dps"],
        focus: "A real melee Hunter: bleeds, Mongoose Bite and trap control.",
        path: [
          p(16, "Counterattack", "Moved to the 16-point slot."),
          p(21, "Strider Kick", "Instant attack with a short burst of movement speed."),
          p(31, "Lacerating Strikes", "Mongoose Bite leaves a long bleed.")
        ],
        key: [
          t("Savage Strikes", "All melee damage goes up slightly."),
          t("Predator's Edge", "More melee crit damage and stronger off-hand hits when dual-wielding."),
          t("Expose Prey", "Attacks on your Hunter's Mark target can trigger Mongoose Bite."),
          t("Improved Tracking", "Bonus damage against whatever creature type you're tracking.")
        ],
        stats: STATS.agile,
        loop: ["Hunter's Mark the target to feed Expose Prey.", "Mongoose Bite whenever it's available to keep the bleed going.", "Raptor Strike and Strider Kick between Bites.", "Traps in combat for adds; Counterattack after parries."]
      }
    ]
  },
  {
    slug: "rogue",
    summary: "Stealthy damage with the best control in a dungeon. Sap no longer breaks Stealth, so you can lock down packs.",
    baseline: [
      t("Sap", "No longer breaks Stealth."),
      t("Poisons", "More charges, and they stack with sharpening stones."),
      t("Distract", "Also lowers enemy Stealth detection for 10 seconds."),
      t("One-handed axes", "Rogues can now use them.")
    ],
    trees: [
      {
        name: "Assassination", slug: "assassination", roles: ["dps"],
        focus: "Poison-heavy dagger play built around Mutilate.",
        path: [
          p(16, "Cold Blood", "Moved to the 16-point slot and works with Mutilate."),
          p(21, "Mutilate", "60 Energy dual-dagger strike, extra damage on poisoned targets, 2 combo points."),
          p(31, "Venom", "25 Energy finisher. Poison damage up 30% and application chance up 10%.")
        ],
        key: [
          t("Improved Poisons", "Large chance that a poison proc doesn't spend a charge."),
          t("Malice", "Crit for every attack and poison."),
          t("Seal Fate", "No longer needs Cold Blood."),
          t("Improved Expose Armor", "Cheaper, and refunds combo points at 5.")
        ],
        stats: STATS.agile,
        loop: ["Poison both weapons and open from Stealth.", "Mutilate to build combo points.", "Keep Venom up as your main finisher.", "Spend remaining finishers on Eviscerate or Rupture."]
      },
      {
        name: "Combat", slug: "combat", roles: ["dps"],
        focus: "Sustained weapon damage with any weapon type.",
        path: [p(16, "Flawless Execution", "Eviscerate costs 10 less Energy.")],
        key: [
          t("Hack and Slash", "Replaces all weapon specs. Axes get extra attacks like swords, and maces ignore armor instead of stunning."),
          t("Weapon Expertise", "Reduces the target's chance to dodge or parry."),
          t("Precision", "Hit chance for every attack, including poisons."),
          t("Improved Eviscerate", "Moved to row 1 with a bigger bonus.")
        ],
        stats: STATS.agile,
        loop: ["Sinister Strike to build.", "Slice and Dice up before anything else.", "Eviscerate at 5 combo points, cheaper with Flawless Execution.", "Blade Flurry and Adrenaline Rush lined up for burst."]
      },
      {
        name: "Subtlety", slug: "subtlety", roles: ["dps"],
        focus: "Ambush openers, Hemorrhage and a Rupture-fueled capstone.",
        path: [
          p(16, "Premeditation", "Moved to the 16-point slot with a 20 second duration."),
          p(31, "Thousand Cuts", "Every Rupture tick makes your next Hemorrhage or Backstab cheaper.")
        ],
        key: [
          t("Cutthroat", "Backstab can let your next Ambush skip the Stealth requirement."),
          t("Quietus", "Sinister Strike, Ghostly Strike and Hemorrhage hit harder below 35% health."),
          t("Hemorrhage", "Now prefers daggers and boosts Rupture for 15 seconds."),
          t("Dirty Tricks", "Cheaper Sap and Blind.")
        ],
        stats: STATS.agile,
        loop: ["Premeditation into Ambush from Stealth.", "Rupture early to start Thousand Cuts.", "Hemorrhage or Backstab as builders while Rupture ticks.", "Watch for Cutthroat procs to Ambush again."]
      }
    ]
  },
  {
    slug: "priest",
    summary: "The most versatile healer, with shields, heals over time and direct heals. Shadow brings strong sustained damage.",
    baseline: [
      t("Shadow Word: Death", "Level 32 for everyone. Instant Shadow damage; if it doesn't kill, you take 10% of your health."),
      t("Fear Ward and Devouring Plague", "Available to every Priest at level 20."),
      t("Prayer of Healing", "Now heals the target's party, so you can heal any group in a raid."),
      t("Racial spells", "Every race has its own Priest spells, including new ones for Gnome, Dwarf, Human and Undead.")
    ],
    trees: [
      {
        name: "Discipline", slug: "discipline", roles: ["healer"],
        focus: "Shields and Penance, with damage that feeds your healing.",
        path: [
          p(16, "Soul Warding", "Shorter cooldown and lower cost on Power Word: Shield."),
          p(21, "Penance", "2 second channel on a 12 second cooldown that heals an ally or hits an enemy.")
        ],
        key: [
          t("Divine Aegis", "Critical heals leave a 12 second absorb shield."),
          t("Renewed Hope", "More crit on heals and Penance against targets with Weakened Soul."),
          t("Power in Light", "Smite and Penance hit harder on targets with your Holy Fire."),
          t("Meditation", "Much more mana from Spirit while casting.")
        ],
        stats: STATS.healer,
        loop: ["Shield whoever is about to take damage.", "Penance on cooldown, on an ally or an enemy.", "Flash Heal and Greater Heal to land crits for Divine Aegis.", "Smite with Holy Fire up when healing is quiet."]
      },
      {
        name: "Holy", slug: "holy", roles: ["healer"],
        focus: "Raw healing output with Binding Heal and Prayer of Mending.",
        path: [
          p(16, "Binding Heal", "1.5 second heal on you and your target with no cooldown."),
          p(31, "Prayer of Mending", "A heal that jumps between party or raid members up to 5 times.")
        ],
        key: [
          t("Litany of Light", "Refunds mana when you alternate between different heals."),
          t("Inspiration", "Now triggers from any non-periodic critical heal."),
          t("Spiritual Healing", "Full effect at 3 points."),
          t("Twilight Focus", "Pushback protection on every cast.")
        ],
        stats: STATS.healer,
        loop: ["Prayer of Mending on cooldown on the tank.", "Renew on players taking steady damage; it now stacks across Priests.", "Binding Heal when you're hurt too.", "Mix heals to keep Litany of Light refunding mana."]
      },
      {
        name: "Shadow", slug: "shadow", roles: ["dps"],
        focus: "Damage over time with a stronger Shadowform and an execute.",
        path: [p(16, "Vampiric Embrace", "Lasts 30 seconds on a 1 minute cooldown.")],
        key: [
          t("Shadowform", "Halves Shadow spell costs and doubles your Shadow crit bonus."),
          t("Improved Mind Flay", "More damage and range, smaller slow."),
          t("Devouring Contagion", "Cheaper Devouring Plague that jumps when its target dies."),
          t("Early Demise", "More Shadow Word: Death crit under 20% health.")
        ],
        stats: STATS.caster,
        loop: ["Shadow Word: Pain and Devouring Plague on the target.", "Vampiric Embrace up for party healing.", "Mind Blast on cooldown, Mind Flay as filler.", "Shadow Word: Death to finish targets under 20%."]
      }
    ]
  },
  {
    slug: "shaman",
    summary: "Sturdy mail-and-shield hybrid that brings totems to the group. Lacks strong crowd control.",
    baseline: [
      t("Totem sets", "Call of the Elements (20), Call of the Spirits (30) and Call of the Ancestors (40) drop four preset totems with one cast."),
      t("Totem quality of life", "Totems are on a 1 second global cooldown, buff totems last 5 minutes, and a tracker shows what's active."),
      t("Windfury and Flametongue Totem", "Now party-wide buffs instead of weapon enchants."),
      t("Weapon imbues", "Last 60 minutes and stack with sharpening stones and oils."),
      t("Fire Nova", "A spell that erupts from your current Fire totem, replacing Fire Nova Totem.")
    ],
    trees: [
      {
        name: "Elemental", slug: "elemental", roles: ["dps"],
        focus: "Lightning caster with Lava Burst and Lightning Overload.",
        path: [
          p(16, "Call of Thunder", "Moved here and adds 3% crit to Lightning Bolt and Chain Lightning."),
          p(21, "Earthbound", "Earthbind Totem roots nearby enemies for 5 seconds when placed."),
          p(31, "Lava Burst", "2.5 second Fire cast on a 10 second cooldown, 20% stronger if your Flame Shock is on the target.")
        ],
        key: [
          t("Lightning Overload", "Lightning Bolt and Chain Lightning can cast a free half-damage copy."),
          t("Elemental Alacrity", "Up to 0.5 seconds off Lightning Bolt, Chain Lightning and Lava Burst."),
          t("Eye of the Storm", "Pushback protection while casting your main nukes."),
          t("Elemental Mastery", "Removed in Forever.")
        ],
        stats: STATS.caster,
        loop: ["Flame Shock on the target.", "Lava Burst on cooldown while Flame Shock is up.", "Lightning Bolt as filler.", "Chain Lightning on packs; Fire Nova from your Fire totem when enemies are close."]
      },
      {
        name: "Enhancement", slug: "enhancement", roles: ["dps"],
        focus: "Melee that weaves instant Lightning Bolts, and can off-tank small groups.",
        path: [
          p(11, "Shamanistic Focus", "Much cheaper Shocks and Lightning Shield."),
          p(16, "Stormstrike", "8 second cooldown. Empowers your next Lightning Bolt, Chain Lightning or Earth Shock by 20%."),
          p(21, "Spirit Weapons", "Less threat normally, more threat while Rockbiter is on, for tanking small groups."),
          p(31, "Rage of the Farseer", "30% attack speed for 25 seconds. 3 minute cooldown.")
        ],
        key: [
          t("Maelstrom Weapon", "Melee hits build stacks that make Lightning Bolt faster, then instant."),
          t("Mental Dexterity", "Adds attack power from Intellect."),
          t("Mental Quickness", "Adds spell damage and healing from Intellect."),
          t("Improved Stormstrike", "Chance to restore mana and to reset Stormstrike when you dodge or parry.")
        ],
        stats: ["Hit, up to the cap", "Strength", "Intellect", "Crit"],
        statsNote: "Mental Dexterity and Mental Quickness both run on Intellect, so Enhancement wants far more of it than in Classic.",
        loop: ["Windfury Weapon on your weapon; it stops you benefiting from Windfury Totem.", "Stormstrike on cooldown, every 8 seconds.", "Earth Shock or an instant Lightning Bolt right after Stormstrike.", "Spend full Maelstrom stacks on instant Lightning Bolts; Rage of the Farseer for burst."]
      },
      {
        name: "Restoration", slug: "restoration", roles: ["healer"],
        focus: "Chain Heal group healer with Riptide and Water Shield mana.",
        path: [
          p(11, "Water Shield", "Globes return mana when you're hit or land a critical heal."),
          p(16, "Mana Tide Totem", "Moved down from 31 points."),
          p(31, "Riptide", "Instant heal plus a heal over time. Chain Heal does 25% more to Riptide targets. 6 second cooldown.")
        ],
        key: [
          t("Healing Way", "Now a flat percentage boost to Healing Wave."),
          t("Mindfulness", "Spirit regen keeps going while you cast."),
          t("Restorative Totems", "Healing Stream Totem bonus doubled."),
          t("Totemic Focus", "Also discounts Totemic Projection and the Call spells.")
        ],
        stats: STATS.healer,
        loop: ["Water Shield up at all times.", "Riptide on cooldown on whoever is hurt.", "Chain Heal bouncing through Riptide targets.", "Healing Wave for big single-target heals; Mana Tide when you run low."]
      }
    ]
  },
  {
    slug: "mage",
    summary: "Ranged damage with strong area damage and Polymorph. Fragile up close; brings food, water and buffs.",
    baseline: [
      t("Frostfire Bolt", "Level 40. Counts as Fire and Frost, uses your better bonus, and leaves a damage over time with a slow."),
      t("Comprehension", "A new minor tradeskill for reading scrolls that drop from creatures."),
      t("Mage Armor", "More mana regen from Spirit."),
      t("Farming nerfs", "Shorter Cone of Cold and a weaker Improved Blizzard slow.")
    ],
    trees: [
      {
        name: "Arcane", slug: "arcane", roles: ["dps"],
        focus: "Arcane Blast stacks that power up every other spell.",
        path: [
          p(11, "Arcane Blast", "2.5 second cast. Each cast adds a stack (up to 4) that boosts your other Mage spells, and raises its own cost."),
          p(16, "Missile Barrage", "Chance for a free Arcane Missiles at double speed. Twice as likely from Arcane Blast.")
        ],
        key: [
          t("Arcane Mind", "Now raises Intellect and Arcane crit damage."),
          t("Arcane Impact", "Crit for all Arcane spells."),
          t("Arcane Focus", "Hit chance for Arcane spells."),
          t("Arcane Power", "Now requires Presence of Mind.")
        ],
        stats: STATS.caster,
        loop: ["Arcane Blast to build stacks.", "Spend Missile Barrage procs on Arcane Missiles.", "Cast another school's spell to cash in your stacks.", "Arcane Power with Presence of Mind for burst."]
      },
      {
        name: "Fire", slug: "fire", roles: ["dps"],
        focus: "Crit-chaining into fast Pyroblasts.",
        path: [],
        key: [
          t("Heating Up", "Crits from Fireball, Frostfire Bolt, Fire Blast and Scorch cut Pyroblast's cast; at 3 stacks it's 1.5 seconds."),
          t("Ignite", "Every Mage now has their own Ignite, and close crits no longer lose damage."),
          t("Wake of Fire", "Shorter Fire Blast cooldown, and a big crit bonus on your next Fire Blast after a kill."),
          t("Improved Fireball", "Also speeds up Frostfire Bolt.")
        ],
        stats: STATS.caster,
        loop: ["Fireball or Frostfire Bolt as your main cast.", "Fire Blast and Scorch while moving.", "Fast Pyroblast at 3 Heating Up stacks.", "Blast Wave on packs; it no longer needs Pyroblast."]
      },
      {
        name: "Frost", slug: "frost", roles: ["dps"],
        focus: "Control and shatter combos with Ice Lance and Fingers of Frost.",
        path: [
          p(11, "Ice Lance", "Instant; deals 300% more to frozen targets."),
          p(16, "Ice Block", "Moved down to the 16-point slot."),
          p(21, "Cold Snap", "Now 21 points, with a 10 minute cooldown.")
        ],
        key: [
          t("Fingers of Frost", "Chill effects grant charges that make targets count as frozen."),
          t("Shatter", "No longer requires Improved Frost Nova."),
          t("Elemental Precision", "Hit chance with Fire and Frost spells."),
          t("Winter's Chill", "Only helps you, and only Frostbolt and Ice Lance.")
        ],
        stats: STATS.caster,
        loop: ["Frostbolt to apply chills and build Fingers of Frost.", "Ice Lance with Fingers of Frost or on a frozen target.", "Frost Nova into Ice Lance when enemies close in.", "Frostfire Bolt from level 40 for extra damage over time."]
      }
    ]
  },
  {
    slug: "warlock",
    summary: "Damage dealer who relies on demons for protection, now viable across all three trees.",
    baseline: [
      t("Banes", "Curse of Agony and Curse of Doom are now Banes; one Bane per Warlock per target."),
      t("Firestone and Spellstone", "Now weapon imbues that stack with wizard oil."),
      t("Life Tap", "Scales with Spirit."),
      t("Drain Soul", "Guaranteed to give a Soul Shard after enough tries.")
    ],
    trees: [
      {
        name: "Affliction", slug: "affliction", roles: ["dps"],
        focus: "Stacked damage over time capped by Wrack.",
        path: [
          p(16, "Curse of Exhaustion", "Moved to 16 points; slows by 30%."),
          p(31, "Wrack", "Shadow damage over time that boosts your other Shadow DoTs.")
        ],
        key: [
          t("Pandemic", "More crit damage on several DoTs and drains."),
          t("Malediction", "Boosts all periodic Warlock damage."),
          t("Soul Siphon", "Drains hit harder for each of your Affliction effects on the target."),
          t("Nightfall", "Can now proc from Drain Soul and Wrack.")
        ],
        stats: STATS.caster,
        statsNote: "Life Tap now scales with Spirit, so a little Spirit goes further than it used to.",
        loop: ["Corruption, a Bane and Wrack on the target.", "Drain Life or Drain Soul as filler to proc Nightfall.", "Shadow Bolt on Nightfall procs.", "Life Tap when mana runs low."]
      },
      {
        name: "Demonology", slug: "demonology", roles: ["dps"],
        focus: "Pet damage and long-lasting sacrifice buffs.",
        path: [
          p(11, "Demonic Sacrifice", "Sacrifice buffs last 2 hours, with a new effect per demon."),
          p(16, "Fel Domination", "Now needs Master Summoner."),
          p(21, "Soul Link", "Moved to the 21-point slot."),
          p(31, "Demonic Pact", "Keeps your Demonic Sacrifice buff when you summon a different demon.")
        ],
        key: [
          t("Demonic Knowledge", "More spell damage for you and your demon while it's out."),
          t("Decimation", "Cheaper, faster Soul Fire against targets under 35%."),
          t("Master Demonologist", "New bonuses for each demon type."),
          t("Demonic Brand", "Searing Pain makes your pet's next attacks deal Fire or Shadow damage.")
        ],
        stats: STATS.caster,
        loop: ["Sacrifice a demon for its buff, then summon another with Demonic Pact.", "Shadow Bolt as your main cast.", "Searing Pain to brand the target for your pet.", "Soul Fire when Decimation procs."]
      },
      {
        name: "Destruction", slug: "destruction", roles: ["dps"],
        focus: "Fire burst with Conflagrate and the new Incinerate.",
        path: [
          p(16, "Conflagrate", "Moved down to 16 points."),
          p(21, "Bane of Havoc", "Redirects 15% of your damage to the cursed target for 5 minutes."),
          p(31, "Incinerate", "2.5 second Fire cast that hits harder on targets with Immolate.")
        ],
        key: [
          t("Shadow and Flame", "Conflagrate and Shadowburn boost your next spells and can refund Immolate or a shard."),
          t("Ruin", "Moved to row 3 as a 5-point talent."),
          t("Agonizing Flames", "More Destruction damage and Searing Pain crit."),
          t("Molten Skin", "Up to 10% less damage taken.")
        ],
        stats: STATS.caster,
        loop: ["Immolate the target.", "Incinerate as your main cast while Immolate is up.", "Conflagrate on cooldown.", "Bane of Havoc on a second target in multi-target fights."]
      }
    ]
  },
  {
    slug: "druid",
    summary: "Can fill any role with the right gear and talents, but has no slows, silences or interrupts and needs a group around it.",
    baseline: [
      t("Shapeshifting", "Most potions, Rage potions and Thistle Tea work in form, and weapon enchants and procs work too."),
      t("Form damage", "Bear and Cat auto attacks use your weapon's DPS."),
      t("Lacerate", "Baseline at level 42: a stacking bleed with high threat."),
      t("Revive", "Out-of-combat resurrection at level 12.")
    ],
    trees: [
      {
        name: "Balance", slug: "balance", roles: ["dps"],
        focus: "Moonkin caster with Eclipse and Insect Swarm.",
        path: [
          p(11, "Nature's Splendor", "Extends several heal and damage over time effects."),
          p(16, "Insect Swarm", "Moved here from Restoration. Nature damage over time that lowers enemy hit chance.")
        ],
        key: [
          t("Eclipse", "Wrath shortens your next two Starfire casts, stacking to 4."),
          t("Nature's Grace", "Haste and a shorter global cooldown for 3 seconds."),
          t("Moonkin Form", "Party crit for spells and attacks, and doubled Omen of Clarity procs."),
          t("Moonfury", "Boosts all damage spells.")
        ],
        stats: STATS.caster,
        loop: ["Moonfire and Insect Swarm on the target.", "Wrath to build Eclipse.", "Starfire while Eclipse makes it faster.", "Hurricane on packs; it no longer has a cooldown."]
      },
      {
        name: "Feral", slug: "feral", roles: ["tank", "dps"],
        focus: "Bear tank or Cat damage, with Shifting Power bringing back powershifting.",
        path: [
          p(11, "Feral Charge", "Adds a Cat Form version on a 30 second cooldown."),
          p(16, "Shifting Power or Primal Bite", "Cat: instantly gain 40 Energy. Bear: a 20 Rage high-threat bite that replaces Mangle."),
          p(31, "Berserk", "15 seconds of fear immunity, Primal Bite hitting 3 targets, and double crit on Cat combo abilities.")
        ],
        key: [
          t("Leader of the Pack", "Party crit for spells and attacks."),
          t("Predatory Strikes", "Up to 20% more crit damage."),
          t("Natural Reaction", "Bear: more dodge, and Rage when you dodge."),
          t("Rend and Tear", "More melee damage against bleeding targets.")
        ],
        stats: ["Hit, up to the cap", "Agility", "Strength", "Stamina for Bear"],
        statsNote: "Bear tanks should still reach the defense they need before anything else.",
        loop: ["Bear: Lacerate stacks and Primal Bite for threat, Swipe on packs.", "Cat: Rake and Shred to build combo points.", "Cat: Shifting Power when Energy runs dry.", "Berserk for burst or a hard pull."]
      },
      {
        name: "Restoration", slug: "restoration", roles: ["healer"],
        focus: "Heal-over-time healer with Wild Growth and a stronger Swiftmend.",
        path: [
          p(11, "Gift of the Earthmother", "Shorter global cooldown on Rejuvenation, Swiftmend and Wild Growth."),
          p(16, "Swiftmend", "No longer eats your Rejuvenation or Regrowth."),
          p(31, "Wild Growth", "Decaying heal over time on a whole party, pets included. 6 second cooldown.")
        ],
        key: [
          t("Reflection", "Much more mana regen while casting."),
          t("Living Spirit", "Increases Spirit by a percentage."),
          t("Improved Tranquility", "Up to 60% shorter Tranquility cooldown."),
          t("Regrowth", "Costs much less mana.")
        ],
        stats: STATS.healer,
        loop: ["Rejuvenation on the tank and anyone taking damage.", "Wild Growth on cooldown on the hurt party.", "Swiftmend for emergencies; it keeps your HoTs now.", "Regrowth for a fast top-off."]
      }
    ]
  }
];

/** Forever classes, enriched with name, color and icon from the shared class list. */
export const FOREVER_CLASSES = CLASS_DATA.map((c) => {
  const base = findClass(c.slug);
  const roles = [...new Set(c.trees.flatMap((tr) => tr.roles))];
  return { ...c, name: base.name, color: base.color, icon: base.icon, roles };
});

export function findForeverClass(slug) {
  return FOREVER_CLASSES.find((c) => c.slug === String(slug || "").toLowerCase()) || null;
}

export function findTree(cls, slug) {
  if (!cls) return null;
  return cls.trees.find((tr) => tr.slug === String(slug || "").toLowerCase()) || null;
}

// Races and the classes each can play. Skyborne picks a faction at creation and needs an upgrade pack.
export const FOREVER_RACES = [
  { name: "Dwarf", faction: "alliance", classes: ["hunter", "paladin", "priest", "rogue", "shaman", "warrior"] },
  { name: "Gnome", faction: "alliance", classes: ["mage", "priest", "rogue", "warlock", "warrior"] },
  { name: "Human", faction: "alliance", classes: ["hunter", "mage", "paladin", "priest", "rogue", "warlock", "warrior"] },
  { name: "Night Elf", faction: "alliance", classes: ["druid", "hunter", "priest", "rogue", "warrior"] },
  { name: "High Order Skyborne", faction: "alliance", classes: ["druid", "hunter", "mage", "rogue", "warrior"], note: "Upgrade pack" },
  { name: "Orc", faction: "horde", classes: ["hunter", "mage", "rogue", "shaman", "warlock", "warrior"] },
  { name: "Tauren", faction: "horde", classes: ["druid", "hunter", "shaman", "warrior"] },
  { name: "Troll", faction: "horde", classes: ["hunter", "mage", "priest", "rogue", "shaman", "warlock", "warrior"] },
  { name: "Undead", faction: "horde", classes: ["mage", "paladin", "priest", "rogue", "warlock", "warrior"] },
  { name: "Windshaper Skyborne", faction: "horde", classes: ["druid", "hunter", "rogue", "shaman", "warrior"], note: "Upgrade pack" }
];

export const racesFor = (classSlug) => FOREVER_RACES.filter((r) => r.classes.includes(classSlug));

// Five-player dungeons. `isNew` marks the nine Forever dungeons. Classic ranges are the WoW Classic ones.
export const FOREVER_DUNGEONS = [
  { name: "Hall of Thanes", zone: "Beneath Ironforge, Dun Morogh", min: 13, max: 18, isNew: true, side: "alliance", blurb: "Dwarven royal tombs overrun by intruders and restless spirits." },
  { name: "Ruins of Lordaeron", zone: "Above the Undercity, Tirisfal Glades", min: 15, max: 20, isNew: true, side: "horde", blurb: "The Forsaken push to reclaim the ruins while a necromancer gathers power." },
  { name: "Excavation Site", zone: "Wetlands, near Thelgen Rock", min: 24, max: 29, isNew: true, blurb: "A time-frozen dig guarded by titan constructs." },
  { name: "City of Dalaran", zone: "Alterac Mountains", min: 28, max: 33, isNew: true, blurb: "The barrier is down. Enter through the sewers; each faction has its own attunement." },
  { name: "The Drowned City", zone: "Off the coast of Stranglethorn Vale", min: 35, max: 40, isNew: true, blurb: "Sunken troll ruins risen from the sea, now held by trolls and naga." },
  { name: "Krol'dok Stronghold", zone: "Riverglades", min: 40, max: 45, isNew: true, blurb: "The ogre fortress behind the raids on travelers." },
  { name: "Alcaz Prison", zone: "Alcaz Island, Dustwallow Marsh", min: 48, max: 53, isNew: true, blurb: "The Defias and naga fight over a long-sealed prison." },
  { name: "Blackmaw Hold", zone: "Azshara", min: 55, max: 60, isNew: true, blurb: "A furbolg city with multiple routes and bosses." },
  { name: "Shaper's Terrace", zone: "Un'Goro Crater", min: 58, max: 60, isNew: true, blurb: "A titan facility powered by crystals you gather outside." },

  { name: "Ragefire Chasm", zone: "Orgrimmar", min: 13, max: 18, side: "horde" },
  { name: "Wailing Caverns", zone: "The Barrens", min: 17, max: 24 },
  { name: "The Deadmines", zone: "Westfall", min: 17, max: 26, side: "alliance" },
  { name: "Shadowfang Keep", zone: "Silverpine Forest", min: 22, max: 30 },
  { name: "Blackfathom Deeps", zone: "Ashenvale", min: 24, max: 32 },
  { name: "The Stockade", zone: "Stormwind", min: 24, max: 32, side: "alliance" },
  { name: "Gnomeregan", zone: "Dun Morogh", min: 29, max: 38 },
  { name: "Razorfen Kraul", zone: "The Barrens", min: 29, max: 38 },
  { name: "Scarlet Monastery", zone: "Tirisfal Glades", min: 26, max: 45 },
  { name: "Razorfen Downs", zone: "The Barrens", min: 37, max: 46 },
  { name: "Uldaman", zone: "Badlands", min: 41, max: 51 },
  { name: "Zul'Farrak", zone: "Tanaris", min: 42, max: 46 },
  { name: "Maraudon", zone: "Desolace", min: 46, max: 55 },
  { name: "Sunken Temple", zone: "Swamp of Sorrows", min: 50, max: 56 },
  { name: "Blackrock Depths", zone: "Blackrock Mountain", min: 52, max: 60 },
  { name: "Lower Blackrock Spire", zone: "Blackrock Mountain", min: 55, max: 60 },
  { name: "Dire Maul", zone: "Feralas", min: 55, max: 60 },
  { name: "Scholomance", zone: "Western Plaguelands", min: 58, max: 60 },
  { name: "Stratholme", zone: "Eastern Plaguelands", min: 58, max: 60 }
].sort((a, b) => a.min - b.min || a.max - b.max);

export const FOREVER_RAIDS = [
  { name: "Barrow Deeps", size: 10, isNew: true, blurb: "A new 10-player raid." },
  { name: "Hyjal Summit", size: 20, isNew: true, blurb: "A new 20-player raid. It and Barrow Deeps share more than 20 new bosses." },
  { name: "Onyxia's Lair", size: 40, isNew: false, blurb: "The classic 40-player dragon fight in Dustwallow Marsh." }
];
