// Hand-written priority lists per spec. "default" applies to every mode unless a mode key overrides it.
export const ROTATIONS = {
  "Warrior": {
    "Arms": {
      "default": [
        "Keep Rend active on your main target.",
        "Use Colossus Smash or Warbreaker on cooldown.",
        "Use Mortal Strike on cooldown for core pressure.",
        "Use Overpower to empower your next Mortal Strike.",
        "Use Execute as top priority in execute range."
      ],
      "aoe": [
        "Open with Warbreaker for cleave setup.",
        "Keep Rend applied to priority targets.",
        "Use Bladestorm in stacked pulls.",
        "Spend globals on Mortal Strike and Cleave windows.",
        "Use Execute to finish priority mobs quickly."
      ]
    },
    "Fury": {
      "default": [
        "Maintain Enrage uptime at all times.",
        "Use Rampage to trigger or refresh Enrage.",
        "Use Bloodthirst on cooldown to feed Rage and sustain.",
        "Use Raging Blow as a primary filler.",
        "Use Execute when available and in execute windows."
      ],
      "aoe": [
        "Activate Whirlwind before core single-target spenders for cleave.",
        "Use Odyn's Fury in large pull windows.",
        "Use Rampage to keep Enrage rolling.",
        "Use Bloodthirst and Raging Blow as Rage builders.",
        "Use Execute on dangerous low-health targets."
      ]
    },
    "Protection": {
      "default": [
        "Keep Shield Block active for physical hits.",
        "Spend Rage on Ignore Pain to smooth incoming damage.",
        "Use Shield Slam on cooldown for Rage generation.",
        "Use Revenge as filler or when free procs appear.",
        "Use Demoralizing Shout and Last Stand proactively."
      ]
    }
  },
  "Paladin": {
    "Holy": {
      "default": [
        "Keep Beacon target management correct before damage events.",
        "Use Holy Shock on cooldown for Holy Power generation.",
        "Spend Holy Power with Word of Glory or Light of Dawn as needed.",
        "Use Crusader Strike to generate Holy Power during low healing load.",
        "Rotate Aura Mastery and major cooldowns for raid damage spikes."
      ]
    },
    "Protection": {
      "default": [
        "Maintain Shield of the Righteous uptime for mitigation.",
        "Use Judgment and Avenger's Shield on cooldown.",
        "Spend Holy Power to sustain mitigation first, damage second.",
        "Use Consecration uptime for defensive value.",
        "Cycle Ardent Defender and Guardian of Ancient Kings proactively."
      ]
    },
    "Retribution": {
      "default": [
        "Build Holy Power with Blade of Justice and Judgment.",
        "Spend Holy Power with Templar's Verdict on single target.",
        "Use Wake of Ashes on cooldown for burst generation.",
        "Use Final Reckoning and Avenging Wrath in aligned burst windows.",
        "Use Execution Sentence in planned damage windows."
      ],
      "aoe": [
        "Use Divine Storm as your Holy Power spender in cleave.",
        "Use Wake of Ashes and Divine Toll in stacked pulls.",
        "Build with Blade of Justice and Judgment between spenders.",
        "Align Avenging Wrath with large pull size.",
        "Keep priority-target pressure with Templar's Verdict when needed."
      ]
    }
  },
  "Hunter": {
    "Beast Mastery": {
      "default": [
        "Keep Barbed Shot stacks and Frenzy uptime stable.",
        "Use Kill Command on cooldown.",
        "Spend Focus with Cobra Shot without starving Kill Command.",
        "Use Bestial Wrath on cooldown and align with trinkets.",
        "Use Kill Shot as high priority in execute."
      ],
      "aoe": [
        "Keep Beast Cleave active via Multi-Shot in packs.",
        "Use Kill Command and Barbed Shot on cooldown.",
        "Use Bestial Wrath with pull size peaks.",
        "Spend excess Focus with Cobra Shot.",
        "Use Kill Shot to remove dangerous targets."
      ]
    },
    "Marksmanship": {
      "default": [
        "Use Aimed Shot charges efficiently; do not overcap.",
        "Use Rapid Fire on cooldown.",
        "Use Arcane Shot or Chimaera Shot as Focus filler.",
        "Use Trueshot in planned burst windows.",
        "Use Kill Shot as a top execute priority."
      ],
      "aoe": [
        "Use Multi-Shot and Trick Shots setup before Aimed Shot or Rapid Fire.",
        "Use Volley and Salvo during stacked pulls.",
        "Spend Aimed Shot charges into Trick Shots windows.",
        "Use Rapid Fire on cooldown.",
        "Use Kill Shot on priority low-health targets."
      ]
    },
    "Survival": {
      "default": [
        "Maintain Serpent Sting if your build uses it.",
        "Use Kill Command and Raptor Strike or Mongoose Bite as core loop.",
        "Spend bombs on cooldown with Wildfire Bomb.",
        "Use Coordinated Assault in burst windows.",
        "Use Kill Shot as execute priority."
      ]
    }
  },
  "Rogue": {
    "Assassination": {
      "default": [
        "Maintain Garrote and Rupture uptime on your target.",
        "Build Combo Points with Mutilate or Fan of Knives.",
        "Spend with Envenom while avoiding energy overcap.",
        "Use Kingsbane and Deathmark in stacked burst windows.",
        "Refresh bleeds cleanly before high-buff phases."
      ],
      "aoe": [
        "Maintain Garrote and Rupture on priority enemies.",
        "Build with Fan of Knives in multi-target packs.",
        "Spend with Envenom while preserving bleed uptime.",
        "Use Deathmark and Kingsbane in coordinated pulls.",
        "Use Crimson Tempest if your build calls for it."
      ]
    },
    "Outlaw": {
      "default": [
        "Keep Slice and Dice active.",
        "Build Combo Points with Sinister Strike and Pistol Shot procs.",
        "Spend with Between the Eyes and Dispatch at efficient points.",
        "Use Adrenaline Rush on cooldown.",
        "Use Roll the Bones and play around strong buff combinations."
      ]
    },
    "Subtlety": {
      "default": [
        "Pool Combo Points and Energy before Shadow Dance windows.",
        "Use Shadowstrike inside Dance windows.",
        "Spend with Eviscerate in buffed burst windows.",
        "Maintain Rupture if your build uses it.",
        "Align Symbols of Death and Secret Technique with Dance."
      ]
    }
  },
  "Priest": {
    "Discipline": {
      "default": [
        "Apply Atonement ahead of incoming damage windows.",
        "Use Power Word: Radiance to expand Atonement coverage.",
        "Deal damage with Penance, Mind Blast, and Smite for healing transfer.",
        "Use Power Word: Shield and Rapture proactively.",
        "Use Evangelism or Barrier for large planned damage events."
      ]
    },
    "Holy": {
      "default": [
        "Use Holy Word: Serenity for high-priority single-target healing.",
        "Use Holy Word: Sanctify for grouped healing windows.",
        "Use Prayer of Mending and Renew efficiently between spikes.",
        "Cast Heal or Flash Heal based on urgency and mana plan.",
        "Use Apotheosis and Divine Hymn for heavy raid damage."
      ]
    },
    "Shadow": {
      "default": [
        "Keep Vampiric Touch and Shadow Word: Pain active.",
        "Use Mind Blast and Devouring Plague on cooldown cadence.",
        "Spend Insanity without capping.",
        "Use Void Eruption or Dark Ascension in burst windows.",
        "Use Shadow Word: Death in execute and movement moments."
      ],
      "aoe": [
        "Maintain Vampiric Touch spread on relevant targets.",
        "Use Mind Sear or your AoE spender package for packs.",
        "Use Void Eruption or Dark Ascension in pull spikes.",
        "Spend Insanity aggressively during multi-target windows.",
        "Prioritize dangerous targets with Devouring Plague."
      ]
    }
  },
  "Death Knight": {
    "Blood": {
      "default": [
        "Use Marrowrend to maintain Bone Shield stacks.",
        "Use Death Strike after meaningful damage intake.",
        "Use Blood Boil on cooldown for threat and utility.",
        "Spend runes efficiently with Heart Strike.",
        "Cycle Vampiric Blood and Icebound Fortitude proactively."
      ]
    },
    "Frost": {
      "default": [
        "Use Obliterate as your primary rune spender in single target.",
        "Spend Runic Power with Frost Strike or Glacial Advance by build.",
        "Use Howling Blast to maintain Fever and consume procs.",
        "Use Pillar of Frost in planned burst windows.",
        "Use Remorseless Winter on cooldown in melee uptime."
      ],
      "aoe": [
        "Use Remorseless Winter and Howling Blast on pull.",
        "Spend Runic Power with Glacial Advance or Frost Strike by build.",
        "Use Obliterate with cleave synergies active.",
        "Align Pillar of Frost to large pull timings.",
        "Keep diseases active while maintaining rune flow."
      ]
    },
    "Unholy": {
      "default": [
        "Keep Virulent Plague active.",
        "Use Festering Strike to apply wounds, then burst with Scourge Strike.",
        "Spend Runic Power with Death Coil or Epidemic by target count.",
        "Use Dark Transformation and Apocalypse in burst windows.",
        "Use Summon Gargoyle and Army of the Dead in planned cooldown phases."
      ],
      "aoe": [
        "Use Epidemic as your primary Runic Power spender in packs.",
        "Spread disease uptime before heavy spend phases.",
        "Maintain wound generation and burst cycles.",
        "Use Dark Transformation and Apocalypse on big pulls.",
        "Align major cooldowns with priority pack timing."
      ]
    }
  },
  "Shaman": {
    "Elemental": {
      "default": [
        "Keep Flame Shock active on priority targets.",
        "Use Lava Burst on cooldown and proc windows.",
        "Use Earth Shock or Elemental Blast as your Maelstrom spender.",
        "Use Primordial Wave and Stormkeeper in burst timing.",
        "Use Lightning Bolt filler while managing movement."
      ],
      "aoe": [
        "Spread Flame Shock before your AoE spend windows.",
        "Use Chain Lightning as core filler in multi-target pulls.",
        "Spend Maelstrom with Earthquake in stacked packs.",
        "Use Stormkeeper and Primordial Wave for burst AoE.",
        "Prioritize dangerous targets with Lava Burst procs."
      ]
    },
    "Enhancement": {
      "default": [
        "Maintain Flame Shock if your build uses it.",
        "Use Stormstrike and Lava Lash on cooldown cadence.",
        "Spend Maelstrom Weapon stacks efficiently with Lightning Bolt or Elemental Blast.",
        "Use Doom Winds or Ascendance in burst windows.",
        "Keep Crash Lightning active when cleave value is present."
      ],
      "aoe": [
        "Use Crash Lightning early to enable cleave.",
        "Spend Maelstrom stacks with Chain Lightning in packs.",
        "Use Stormstrike and Lava Lash to maintain tempo.",
        "Use Primordial Wave and burst cooldowns on pull peaks.",
        "Keep Flame Shock spread where practical."
      ]
    },
    "Restoration": {
      "default": [
        "Keep Riptide rolling on likely damage targets.",
        "Use Healing Wave or Healing Surge by urgency and mana plan.",
        "Use Healing Rain and Chain Heal for group damage windows.",
        "Use Cloudburst Totem and Spirit Link proactively.",
        "Weave Lava Burst or Lightning Bolt during stable periods."
      ]
    }
  },
  "Mage": {
    "Arcane": {
      "default": [
        "Manage mana around burn and conserve phases.",
        "Use Arcane Blast as core builder and spender setup.",
        "Use Arcane Barrage at planned clear points.",
        "Use Touch of the Magi and Arcane Surge in burst windows.",
        "Use Arcane Missiles on high-value proc opportunities."
      ]
    },
    "Fire": {
      "default": [
        "Chain Hot Streak procs into instant Pyroblast casts.",
        "Use Fire Blast to convert Heating Up into Hot Streak.",
        "Use Phoenix Flames strategically for proc and AoE value.",
        "Use Combustion in planned burst windows.",
        "Keep filler casts flowing with Fireball or Scorch."
      ],
      "aoe": [
        "Use Flamestrike for Hot Streak spenders in stacked packs.",
        "Leverage Phoenix Flames for cleave and proc generation.",
        "Use Combustion on large pulls with cooldown alignment.",
        "Maintain instant-cast flow while moving.",
        "Prioritize dangerous targets with Pyroblast or execute tools."
      ]
    },
    "Frost": {
      "default": [
        "Use Frozen Orb on cooldown for proc generation.",
        "Spend Fingers of Frost with Ice Lance promptly.",
        "Use Flurry to shatter high-value casts.",
        "Use Glacial Spike windows cleanly if talented.",
        "Use Icy Veins in planned burst phases."
      ],
      "aoe": [
        "Open with Frozen Orb and Blizzard in packs.",
        "Spend procs rapidly with Ice Lance cleave windows.",
        "Use Cone of Cold or Comet Storm by build and pull size.",
        "Maintain cooldown cadence with Icy Veins in big pulls.",
        "Focus priority-target delete windows when possible."
      ]
    }
  },
  "Warlock": {
    "Affliction": {
      "default": [
        "Maintain Agony, Corruption, and Unstable Affliction uptime.",
        "Use Malefic Rapture in empowered DoT windows.",
        "Spend shards without capping while preserving setup.",
        "Use Soul Rot and Darkglare in synchronized burst windows.",
        "Use Drain Soul or Shadow Bolt filler based on build."
      ],
      "aoe": [
        "Apply and maintain DoTs across priority targets.",
        "Use Seed of Corruption for packed targets.",
        "Spend shards on Malefic Rapture when multiple DoTs are active.",
        "Use Soul Rot and cooldowns in stacked pull windows.",
        "Maintain execute pressure on dangerous mobs."
      ]
    },
    "Demonology": {
      "default": [
        "Build and spend shards to maintain demon summon cadence.",
        "Use Hand of Gul'dan at efficient shard counts.",
        "Use Call Dreadstalkers and Demonbolt procs on cooldown.",
        "Use Summon Demonic Tyrant in high-value setup windows.",
        "Keep Shadow Bolt filler flowing between summon spikes."
      ]
    },
    "Destruction": {
      "default": [
        "Keep Immolate active on your primary target.",
        "Generate shards with Incinerate and Conflagrate.",
        "Spend shards on Chaos Bolt in single-target windows.",
        "Use Havoc to duplicate key casts in cleave.",
        "Use Summon Infernal and cooldowns in burst windows."
      ],
      "aoe": [
        "Use Rain of Fire as your primary shard spender in packs.",
        "Maintain Immolate spread where practical.",
        "Use Havoc for priority cleave duplication.",
        "Use Infernal and cooldown package on large pulls.",
        "Manage shard generation to avoid capping."
      ]
    }
  },
  "Monk": {
    "Brewmaster": {
      "default": [
        "Use Keg Smash and Tiger Palm to maintain brew flow.",
        "Use Purifying Brew to clear heavy stagger damage.",
        "Maintain Shuffle via Blackout Kick interactions.",
        "Use Breath of Fire for mitigation and control uptime.",
        "Rotate Celestial Brew and Fortifying Brew proactively."
      ]
    },
    "Mistweaver": {
      "default": [
        "Keep Renewing Mist on cooldown for broad coverage.",
        "Use Vivify cleave and Enveloping Mist on priority targets.",
        "Use Essence Font and Chi Burst by encounter profile.",
        "Use Thunder Focus Tea to amplify key casts.",
        "Use Revival in planned heavy damage moments."
      ]
    },
    "Windwalker": {
      "default": [
        "Follow Mastery: avoid repeating the same ability twice in a row.",
        "Use Rising Sun Kick and Fists of Fury on cooldown.",
        "Spend Chi efficiently with Blackout Kick and Spinning Crane Kick by target count.",
        "Use Strike of the Windlord in burst windows.",
        "Use Touch of Death for priority delete windows."
      ],
      "aoe": [
        "Use Spinning Crane Kick as your AoE spender.",
        "Keep Rising Sun Kick and Fists of Fury on cooldown.",
        "Use Whirling Dragon Punch when available.",
        "Maintain Hit Combo style sequencing.",
        "Use burst cooldowns at large pull starts."
      ]
    }
  },
  "Druid": {
    "Balance": {
      "default": [
        "Keep Moonfire and Sunfire active.",
        "Generate Astral Power with Wrath and Starfire by eclipse state.",
        "Spend Astral Power with Starsurge on single target.",
        "Use Celestial Alignment or Incarnation in burst windows.",
        "Use Fury of Elune and cooldowns on planned timing."
      ],
      "aoe": [
        "Maintain Sunfire spread across packs.",
        "Spend Astral Power with Starfall in multi-target pulls.",
        "Use Starfire during Lunar-focused cleave windows.",
        "Use Celestial Alignment or Incarnation for pull spikes.",
        "Prioritize dangerous targets with Starsurge when needed."
      ]
    },
    "Feral": {
      "default": [
        "Keep Rake, Rip, and Moonfire (if talented) active.",
        "Build Combo Points with Shred or Brutal Slash by build.",
        "Spend Combo Points on Ferocious Bite at efficient energy windows.",
        "Use Tiger's Fury and Berserk in synchronized burst windows.",
        "Maintain bleed uptime before refreshing burst cycles."
      ]
    },
    "Guardian": {
      "default": [
        "Maintain Ironfur stacks during physical pressure.",
        "Use Mangle and Thrash on cooldown for threat and Rage.",
        "Spend Rage on Ironfur or Frenzied Regeneration by damage profile.",
        "Use Moonfire for range pull and filler pressure.",
        "Cycle Barkskin and Survival Instincts proactively."
      ]
    },
    "Restoration": {
      "default": [
        "Maintain Lifebloom and key HoTs before incoming damage.",
        "Use Swiftmend and Regrowth for spot healing windows.",
        "Use Wild Growth for group healing spikes.",
        "Use Efflorescence where group uptime is high.",
        "Use Tranquility and Incarnation for heavy damage phases."
      ]
    }
  },
  "Demon Hunter": {
    "Havoc": {
      "default": [
        "Maintain Immolation Aura and core Fury generation.",
        "Spend Fury with Chaos Strike or Annihilation in burst windows.",
        "Use Blade Dance or Death Sweep on cooldown.",
        "Use Eye Beam to trigger core burst interactions.",
        "Use Metamorphosis in planned high-value windows."
      ],
      "aoe": [
        "Use Eye Beam and Blade Dance aggressively in packs.",
        "Keep Immolation Aura on cooldown for Fury and AoE.",
        "Spend Fury with Chaos Strike while maintaining tempo.",
        "Use Throw Glaive synergies by build.",
        "Use Metamorphosis for large pull spikes."
      ]
    },
    "Vengeance": {
      "default": [
        "Maintain Demon Spikes for predictable physical damage.",
        "Use Fracture and Shear to generate Soul Fragments.",
        "Spend with Soul Cleave for healing and mitigation.",
        "Use Immolation Aura and Sigils to control pull tempo.",
        "Rotate Fiery Brand and Metamorphosis proactively."
      ]
    }
  },
  "Evoker": {
    "Devastation": {
      "default": [
        "Use Fire Breath and Eternity Surge at high empower value.",
        "Spend Essence on Disintegrate in single target.",
        "Use Living Flame as filler between empowered casts.",
        "Use Dragonrage in planned burst windows.",
        "Manage movement with instant casts to protect uptime."
      ],
      "aoe": [
        "Empower Fire Breath and Eternity Surge for pull size.",
        "Spend Essence on Pyre in stacked packs.",
        "Use Disintegrate for priority-target pressure.",
        "Use Dragonrage on large pulls with cooldown alignment.",
        "Keep movement-safe cast flow with instant globals."
      ]
    },
    "Preservation": {
      "default": [
        "Plan Echo application before heavy healing windows.",
        "Use Verdant Embrace and Dream Breath for burst recovery.",
        "Use Reversion and Spiritbloom by damage profile.",
        "Leverage empowered spells at the right charge level.",
        "Use Rewind and major cooldowns for scripted raid damage."
      ]
    },
    "Augmentation": {
      "default": [
        "Maintain Ebon Might uptime as your highest support priority.",
        "Use Prescience and utility buffs before ally burst windows.",
        "Spend Essence and empower casts without capping resources.",
        "Use Breath of Eons in coordinated group cooldown windows.",
        "Keep damage globals active while maintaining buff cadence."
      ]
    }
  }
};

// Fallback guidance when a spec has no entry above.
export const ROTATIONS_BY_ARCHETYPE = {
  "tank": [
    "Keep active mitigation rolling before heavy enemy casts or tank-buster windows.",
    "Spend resources on survivability first, damage second when pressure is high.",
    "Cycle defensives instead of stacking them unless a lethal hit is imminent.",
    "Use interrupts and stops aggressively to reduce incoming group damage."
  ],
  "healer": [
    "Maintain key HoTs/shields before damage events so recovery starts earlier.",
    "Use efficient filler healing between spikes and save major cooldowns for scripted bursts.",
    "Keep damage contribution active during stable moments without risking coverage.",
    "Plan mobility and instant casts for high movement windows."
  ],
  "caster": [
    "Open with your major cooldown package and align trinkets with burst windows.",
    "Maintain core DoTs/debuffs and avoid clipping high-value casts.",
    "Spend procs quickly when near cap; do not overcap resources.",
    "Pre-position for mechanics to protect long casts and uptime."
  ],
  "support-caster": [
    "Align support buffs with team cooldown windows rather than using on cooldown blindly.",
    "Keep your highest value debuffs/buffs active on priority targets.",
    "Use utility globals only when they preserve net team damage or survival.",
    "Track ally burst cycles and hold short cooldowns for coordinated setups."
  ],
  "crit-caster": [
    "Build for burst windows and pool resources before major cooldown usage.",
    "Prioritize high-impact casts during proc/crit amplification windows.",
    "Keep DoTs/debuffs active so burst casts gain full multipliers.",
    "Avoid overcapping procs by spending them early in movement-safe windows."
  ],
  "dot-caster": [
    "Apply and maintain full DoT coverage before committing to filler casts.",
    "Refresh DoTs in efficient windows; avoid early clipping unless buffed.",
    "Use cooldowns when multiple DoTs and debuffs are already established.",
    "Route execute or shard spenders into priority-target windows."
  ],
  "melee-haste": [
    "Keep generators and spenders flowing to avoid empty globals.",
    "Pool briefly before cooldown windows so burst openers are clean.",
    "Prioritize high-value procs and avoid capping class resources.",
    "Maintain uptime by pre-moving for mechanics and sticking to targets."
  ],
  "melee-burst": [
    "Pool resources before burst so cooldowns start with full pressure.",
    "Stack damage amps and major abilities in the same short window.",
    "Use filler priority that feeds next burst instead of random spending.",
    "Preserve uptime and frontload damage into vulnerability phases."
  ],
  "dot-melee": [
    "Maintain bleeds/poisons first; then spend on finishers efficiently.",
    "Reapply DoTs during buff windows when possible for stronger snapshots.",
    "Avoid energy/rune capping by planning spender cadence.",
    "Use mobility tools proactively to keep melee uptime high."
  ],
  "ranged-pet": [
    "Keep pet active on target and avoid desync with your core cooldowns.",
    "Spend focus/resources to avoid capping while preserving burst setup.",
    "Use high-value proc shots/skills immediately in priority windows.",
    "Pre-position to minimize movement downtime during rapid casts."
  ],
  "ranged-burst": [
    "Enter burst windows with resources pooled and major cooldowns aligned.",
    "Prioritize instant/high-impact shots during movement-heavy mechanics.",
    "Keep core debuffs up so burst casts gain full value.",
    "Use defensive utility early to avoid losing cast uptime."
  ],
  "generic": [
    "Maintain core buffs/debuffs and avoid resource overcap.",
    "Use major cooldowns in planned burst windows.",
    "Prioritize uptime and movement discipline for consistent output.",
    "Adjust utility and defensives to encounter damage patterns."
  ]
};
