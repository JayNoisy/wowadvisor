// The tool tiles under the class picker, each with a live status line where there's something to say.

import { DUNGEON_POOL, SEASON } from "../../data/mythic.js";
import { getMythicContext, activeAffixNames } from "../builds/mythic-context.js";
import { FOREVER_RAIDS_OPEN } from "../../data/forever.js";
import { $, html, raw } from "../../lib/dom.js";
import { formatCountdown } from "../../lib/format.js";
import { on } from "../../lib/events.js";
import { icon } from "../../lib/icons.js";
import { fetchTokenPrice, formatGold } from "../../lib/token.js";
import { listCharacters, weeklyPeriod, lockoutPeriod } from "../tracker/store.js";
import { GENERAL_ID, weeklySummary } from "../weekly/store.js";

let token = null;
let tokenAsked = false;

function retailTiles() {
  const chars = listCharacters();
  const main = chars[0] || null;
  const region = main?.region || "us";
  if (!tokenAsked) {
    tokenAsked = true;
    fetchTokenPrice(region).then((price) => { if (price) { token = price; renderToolkit(); } });
  }
  const week = weeklySummary(main?.id || GENERAL_ID, region);
  const lock = lockoutPeriod(region);

  let lockoutLine = "Tick off Mythic dungeons per character";
  if (main) {
    const done = DUNGEON_POOL.filter((d) => main.lockouts[d]).length;
    lockoutLine = `${main.name}: ${done} of ${DUNGEON_POOL.length} cleared ${lock.cadence === "daily" ? "today" : "this week"}`;
  }

  return [
    { href: "#weekly", icon: "weekly", name: "This week", text: "Great Vault planner and weekly checklist", live: `Reset in ${formatCountdown(weeklyPeriod(region).next)}, ${week.slots}/9 vault slots` },
    { href: "#tracker", icon: "tracker", name: "Lockouts", text: lockoutLine, live: `Resets in ${formatCountdown(lock.next)}` },
    { href: "#mplus", icon: "mplus", name: "Mythic+", text: "Affixes by key level and the timer to beat in every dungeon", live: `Your +${getMythicContext().keyLevel}: ${activeAffixNames().join(", ")}` },
    { href: "#party", icon: "party", name: "Group check", text: "See what your party covers before the key goes in" },
    { href: "#armory", icon: "armory", name: "Armory", text: "Inspect any character and copy their talents", live: chars.length ? `${chars.length} saved` : "" },
    { href: "#macros", icon: "macros", name: "Macros", text: "Mouseover, focus and cursor macros, ready to paste" },
    { href: "#links", icon: "links", name: "Resources", text: "Sims, logs, routes and guides, sorted by need" },
    // Only shown once a price has arrived, so there's never a tile promising a number it can't show.
    ...(token ? [{ href: "#weekly", icon: "coins", name: "WoW Token", text: "The gold price of a token right now", live: `${formatGold(token.gold)} in ${token.region.toUpperCase()}` }] : [])
  ];
}

function foreverTiles() {
  const opens = new Date(FOREVER_RAIDS_OPEN);
  const raidLine = Date.now() < opens.getTime() ? `Raids open in ${formatCountdown(opens)}` : "Raids are open";
  return [
    { href: "#atlas", icon: "atlas", name: "Dungeons and raids", text: "Every dungeon by level, with a done list", live: raidLine },
    { href: "#levels", icon: "levels", name: "Level guide", text: "Talent points and unlocks for your level" },
    { href: "#todo", icon: "weekly", name: "To-do list", text: "The chores that are easy to forget between quests" },
    { href: "#macros", icon: "macros", name: "Macros", text: "Mouseover, focus and cursor macros, ready to paste" }
  ];
}

function tilesHtml(tiles) {
  return tiles.map((t) => html`
    <a class="tool" href="${t.href}">
      <span class="tool-icon">${raw(icon(t.icon))}</span>
      <span class="tool-name">${t.name}</span>
      <span class="tool-text">${t.text}</span>
      ${t.live ? raw(html`<span class="tool-live">${t.live}</span>`) : ""}
    </a>`).join("");
}

export function renderToolkit() {
  const retail = $("#toolkitGrid");
  const forever = $("#fvToolkitGrid");
  if (retail) retail.innerHTML = tilesHtml(retailTiles());
  if (forever) forever.innerHTML = tilesHtml(foreverTiles());
}

export function initToolkit() {
  renderToolkit();
  on("characters:changed", renderToolkit);
  on("weekly:changed", renderToolkit);
  on("mythic:changed", renderToolkit);
}
