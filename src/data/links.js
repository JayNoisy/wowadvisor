// Community sites worth knowing, grouped by what a player is trying to do.
// `character` builds a deep link for a saved character: { region, realmSlug, characterSlug, name }.

const enc = encodeURIComponent;

export const LINK_GROUPS = [
  {
    title: "Check a character",
    links: [
      {
        name: "Raider.IO",
        url: "https://raider.io/",
        what: "Mythic+ score, best runs and raid progress.",
        character: (c) => `https://raider.io/characters/${c.region}/${enc(c.realmSlug)}/${enc(c.name)}`
      },
      {
        name: "Warcraft Logs",
        url: "https://www.warcraftlogs.com/",
        what: "Raid and dungeon performance rankings.",
        character: (c) => `https://www.warcraftlogs.com/character/${c.region}/${enc(c.realmSlug)}/${enc(c.characterSlug)}`
      },
      {
        name: "Official Armory",
        url: "https://worldofwarcraft.blizzard.com/en-us/search",
        what: "Blizzard's own profile page: gear, achievements, collections.",
        character: (c) => `https://worldofwarcraft.blizzard.com/en-us/character/${c.region}/${enc(c.realmSlug)}/${enc(c.characterSlug)}`
      }
    ]
  },
  {
    title: "Sim and upgrade your gear",
    links: [
      {
        name: "Raidbots",
        url: "https://www.raidbots.com/simbot",
        what: "Simulate your damage and find your best gear, trinkets and vault pick.",
        character: (c) => `https://www.raidbots.com/simbot/quick?region=${c.region}&realm=${enc(c.realmSlug)}&name=${enc(c.characterSlug)}`
      },
      { name: "QE Live", url: "https://questionablyepic.com/live/", what: "The gear comparison tool for healers." },
      { name: "Bloodmallet", url: "https://bloodmallet.com/", what: "Trinket and stat charts for every damage spec." }
    ]
  },
  {
    title: "Learn your class",
    links: [
      { name: "Wowhead guides", url: "https://www.wowhead.com/guides/classes", what: "Full guides for every spec, updated each patch." },
      { name: "Icy Veins", url: "https://www.icy-veins.com/wow/class-guides", what: "Step-by-step guides that are easy to follow when you're new to a spec." },
      { name: "Archon", url: "https://www.archon.gg/wow", what: "What the best players are actually using, from live log data." },
      { name: "Murlok.io", url: "https://murlok.io/", what: "Talents and gear of the top-rated Mythic+ and PvP players." }
    ]
  },
  {
    title: "Mythic+ and raids",
    links: [
      { name: "Keystone.guru", url: "https://keystone.guru/", what: "Dungeon route planner. Browse popular routes or draw your own." },
      { name: "Mythic Trap", url: "https://mythictrap.com/", what: "Short, visual boss and dungeon guides." },
      { name: "WoWAnalyzer", url: "https://wowanalyzer.com/", what: "Paste a log and get plain-language tips on what to improve." },
      { name: "Method", url: "https://www.method.gg/guides", what: "Raid boss strategy and tier lists from a world-first guild." }
    ]
  },
  {
    title: "Addons and UI",
    links: [
      { name: "CurseForge", url: "https://www.curseforge.com/wow", what: "The largest addon library, with an app that keeps them updated." },
      { name: "Wago", url: "https://wago.io/", what: "Shared UI profiles and import strings." },
      { name: "Wago Addons", url: "https://addons.wago.io/", what: "An alternative addon host and updater." }
    ]
  },
  {
    title: "Gold and the auction house",
    links: [
      { name: "Undermine Exchange", url: "https://undermine.exchange/", what: "Auction house prices and history for your realm." }
    ]
  },
  {
    title: "News and server status",
    links: [
      { name: "Wowhead news", url: "https://www.wowhead.com/news", what: "Patch notes, hotfixes and datamining as they happen." },
      { name: "Blizzard news", url: "https://worldofwarcraft.blizzard.com/en-us/news", what: "Official announcements and schedules." },
      { name: "Realm status", url: "https://worldofwarcraft.blizzard.com/en-us/game/status", what: "See whether your realm is up." }
    ]
  }
];
