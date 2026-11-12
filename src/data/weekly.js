// Great Vault rules and the starter weekly checklist.
// Thresholds: 2/4/6 raid bosses, 1/4/8 Mythic+ runs, 2/4/8 world activities (Midnight Season 2).

export const VAULT_ROWS = [
  {
    key: "raid",
    label: "Raid",
    unit: "boss",
    unitPlural: "bosses",
    thresholds: [2, 4, 6],
    max: 8,
    help: "Unique bosses killed this week, on any difficulty."
  },
  {
    key: "dungeons",
    label: "Mythic+",
    unit: "run",
    unitPlural: "runs",
    thresholds: [1, 4, 8],
    max: 8,
    help: "Each slot pays out from your best, 4th-best and 8th-best key of the week."
  },
  {
    key: "world",
    label: "World",
    unit: "activity",
    unitPlural: "activities",
    thresholds: [2, 4, 8],
    max: 8,
    help: "Delves, Prey hunts and other world activities."
  }
];

export const KEY_LEVELS = { min: 2, max: 30, start: 10 };

// A starting point. Players can remove any of these and add their own.
export const DEFAULT_TASKS = [
  { id: "vault", label: "Open the Great Vault" },
  { id: "world-boss", label: "Kill the world boss" },
  { id: "weekly-event", label: "Finish the weekly event quest" },
  { id: "delves", label: "Run your Bountiful Delves" },
  { id: "prey", label: "Claim the weekly Prey bonus" },
  { id: "professions", label: "Do profession weeklies" }
];
