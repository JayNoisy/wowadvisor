// Macro templates. {spell} and {spell2} are replaced with what the player types.
// These use standard macro conditionals that work in both Retail and WoW Forever.

export const MACRO_LIMIT = 255;

export const MACROS = [
  {
    id: "mouseover-help",
    name: "Heal or buff on mouseover",
    blurb: "Casts on whoever your mouse is over. Falls back to your target, then yourself.",
    fields: ["spell"],
    example: { spell: "Flash Heal" },
    body: "#showtooltip\n/cast [@mouseover,help,nodead][help,nodead][@player] {spell}"
  },
  {
    id: "mouseover-harm",
    name: "Attack on mouseover",
    blurb: "Hits the enemy under your mouse without changing target. Good for DoTs and interrupts.",
    fields: ["spell"],
    example: { spell: "Flame Shock" },
    body: "#showtooltip\n/cast [@mouseover,harm,nodead][harm,nodead] {spell}"
  },
  {
    id: "focus-interrupt",
    name: "Interrupt your focus",
    blurb: "Kicks your focus target if you have one, otherwise your current target.",
    fields: ["spell"],
    example: { spell: "Wind Shear" },
    body: "#showtooltip\n/cast [@focus,harm,nodead][] {spell}"
  },
  {
    id: "set-focus",
    name: "Set focus on mouseover",
    blurb: "Focuses the unit under your mouse, or your target if nothing is there.",
    fields: [],
    body: "/focus [@mouseover,exists][]"
  },
  {
    id: "cursor",
    name: "Cast at your cursor",
    blurb: "Drops a ground spell where your mouse is, with no second click.",
    fields: ["spell"],
    example: { spell: "Blizzard" },
    body: "#showtooltip\n/cast [@cursor] {spell}"
  },
  {
    id: "self",
    name: "Always cast on yourself",
    blurb: "Uses the spell on you no matter what you have targeted.",
    fields: ["spell"],
    example: { spell: "Power Word: Shield" },
    body: "#showtooltip\n/cast [@player] {spell}"
  },
  {
    id: "stopcast",
    name: "Cancel your cast, then cast",
    blurb: "Stops whatever you're casting so an urgent spell goes off right away.",
    fields: ["spell"],
    example: { spell: "Counterspell" },
    body: "#showtooltip\n/stopcasting\n/cast {spell}"
  },
  {
    id: "burst",
    name: "Cooldown with trinkets",
    blurb: "Fires both trinkets and your big cooldown from one button.",
    fields: ["spell"],
    example: { spell: "Avenging Wrath" },
    body: "#showtooltip {spell}\n/use 13\n/use 14\n/cast {spell}"
  },
  {
    id: "modifier",
    name: "Two spells, one button",
    blurb: "Casts the first spell normally and the second while you hold Shift.",
    fields: ["spell", "spell2"],
    example: { spell: "Frostbolt", spell2: "Ice Lance" },
    body: "#showtooltip\n/cast [mod:shift] {spell2}; {spell}"
  },
  {
    id: "help-harm",
    name: "Friend or foe",
    blurb: "Casts the first spell on enemies and the second on friendly targets.",
    fields: ["spell", "spell2"],
    example: { spell: "Smite", spell2: "Heal" },
    body: "#showtooltip\n/cast [harm,nodead] {spell}; [help,nodead][@player] {spell2}"
  },
  {
    id: "startattack",
    name: "Attack and cast",
    blurb: "Starts auto attack with your ability so you never stand idle. Handy for melee.",
    fields: ["spell"],
    example: { spell: "Mortal Strike" },
    body: "#showtooltip\n/startattack\n/cast {spell}"
  },
  {
    id: "pet",
    name: "Send pet and cast",
    blurb: "Orders your pet onto the target as you cast.",
    fields: ["spell"],
    example: { spell: "Kill Command" },
    body: "#showtooltip\n/petattack\n/cast {spell}"
  },
  {
    id: "cancelaura",
    name: "Cancel a buff",
    blurb: "Removes a buff from yourself, such as an immunity you want to end early.",
    fields: ["spell"],
    example: { spell: "Ice Block" },
    body: "/cancelaura {spell}"
  }
];
