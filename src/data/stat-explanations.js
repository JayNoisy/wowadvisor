// Why each secondary stat matters, by spec archetype.
export const STAT_EXPLANATIONS = {
  "tank": {
    "haste": "Improves resource generation and cooldown flow, smoothing mitigation uptime.",
    "versatility": "Gives flat damage reduction and damage gain, making it the safest all-around defensive stat.",
    "mastery": "Strengthens spec-specific mitigation value, especially in sustained damage windows.",
    "critical strike": "Adds offensive pressure and can improve proc-based durability effects."
  },
  "healer": {
    "haste": "Increases cast frequency and HoT/DoT tick rate, helping react faster to incoming damage.",
    "critical strike": "Boosts burst healing moments and improves clutch recovery windows.",
    "mastery": "Amplifies core healing profile for your spec’s specialty throughput.",
    "versatility": "Provides stable healing and survivability with no conditionals."
  },
  "caster": {
    "haste": "Speeds casts and periodic effects, increasing overall throughput and rotational fluidity.",
    "mastery": "Amplifies your spec’s primary damage pattern, making major abilities hit harder.",
    "critical strike": "Improves burst potential and scales well with high-impact spells.",
    "versatility": "Adds consistent damage and survivability when other stats are close."
  },
  "support-caster": {
    "haste": "Improves buff cadence and rotational tempo, enabling stronger team uptime windows.",
    "mastery": "Scales your core support/damage amplifiers effectively for group value.",
    "critical strike": "Adds extra burst potential during coordinated cooldown windows.",
    "versatility": "Reliable throughput and defense for predictable performance."
  },
  "crit-caster": {
    "critical strike": "High value because your kit converts crits into major burst or extra effect chains.",
    "haste": "Keeps casts flowing to capitalize on proc windows and maintain pressure.",
    "mastery": "Strongly scales core spell packages and sustained priority-target damage.",
    "versatility": "Steady fallback throughput and durability."
  },
  "dot-caster": {
    "haste": "Increases periodic tick frequency and reduces ramp friction for DoT-centric gameplay.",
    "mastery": "Boosts sustained pressure from core periodic or shadow/flame effects.",
    "critical strike": "Improves spike damage on key casts layered into DoT windows.",
    "versatility": "Consistent gain to both offense and defense."
  },
  "melee-haste": {
    "haste": "Improves attack/resource tempo so your rotation stays smooth and ability-dense.",
    "mastery": "Boosts core melee toolkit damage and scales your primary spenders.",
    "critical strike": "Adds burst and improves finisher impact during cooldowns.",
    "versatility": "Reliable all-purpose stat for damage and toughness."
  },
  "melee-burst": {
    "mastery": "Typically scales your strongest burst abilities and cooldown windows.",
    "critical strike": "Enables higher spike damage and better kill pressure.",
    "haste": "Improves rotational speed and resource flow between burst windows.",
    "versatility": "Stable throughput with bonus survivability in difficult content."
  },
  "dot-melee": {
    "mastery": "Amplifies bleed/poison or sustained profile damage where your spec gains most value.",
    "critical strike": "Increases pressure spikes and finisher impact.",
    "haste": "Improves energy/rune pacing to keep effects and uptime stable.",
    "versatility": "Consistent fallback throughput and defense."
  },
  "ranged-pet": {
    "critical strike": "Strong burst contribution for both player and pet damage events.",
    "mastery": "Scales signature pet-focused damage patterns effectively.",
    "haste": "Smooths cast and focus flow for cleaner ability chaining.",
    "versatility": "Reliable all-round gain, especially for difficult pulls."
  },
  "ranged-burst": {
    "mastery": "Scales high-impact windows and signature shots very efficiently.",
    "critical strike": "Adds burst consistency for priority-target damage.",
    "haste": "Improves cast cadence and global throughput.",
    "versatility": "Steady output and extra survivability."
  },
  "generic": {
    "haste": "Improves rotational speed and ability cadence.",
    "critical strike": "Raises burst potential and high-roll outcomes.",
    "mastery": "Scales your spec’s signature damage/healing profile.",
    "versatility": "Provides stable offense and defense with no conditions."
  }
};
