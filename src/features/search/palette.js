// Search (Ctrl+K or /): jump to any spec, tool or saved character from anywhere.

import { CLASSES, ROLE_LABELS } from "../../data/classes.js";
import { FOREVER_CLASSES, roleLabel } from "../../data/forever.js";
import { $, $$, html, raw } from "../../lib/dom.js";
import { normalizeKey } from "../../lib/format.js";
import { icon } from "../../lib/icons.js";
import { classStyle } from "../../lib/color.js";
import { listCharacters } from "../tracker/store.js";
import { on } from "../../lib/events.js";

const PAGES = [
  { title: "Builds", sub: "Retail talent builds", href: "#builds", icon: "builds", words: "home classes talents loadout" },
  { title: "This week", sub: "Great Vault and weekly checklist", href: "#weekly", icon: "weekly", words: "vault weekly reset checklist chores tasks" },
  { title: "Lockouts", sub: "Mythic dungeon lockouts per character", href: "#tracker", icon: "tracker", words: "tracker dungeons mythic saved" },
  { title: "Mythic+", sub: "Affixes by key level, dungeon timers, rating rewards", href: "#mplus", icon: "mplus", words: "mythic plus m+ keystone keys affix affixes fortified tyrannical bargain guile timer timers season dungeons rating score portal" },
  { title: "Group check", sub: "What your party covers", href: "#party", icon: "party", words: "party comp composition bloodlust lust brez dispel interrupt buffs" },
  { title: "Armory", sub: "Look up a character", href: "#armory", icon: "armory", words: "character gear lookup import item level" },
  { title: "Talent calculator", sub: "Plan a Retail build, import and export codes", href: "#calc", icon: "tree", words: "talent calculator planner tree loadout import export code hero talents" },
  { title: "Gear and upgrades", sub: "Item levels, upgrade tracks, crest costs", href: "#gear", icon: "gem", words: "gear item level ilvl upgrade track crest mistcrest champion hero myth veteran adventurer vault loot delve raid crafted spark" },
  { title: "Macros", sub: "Macro builder", href: "#macros", icon: "macros", words: "macro mouseover focus cursor interrupt keybind" },
  { title: "Tier lists", sub: "Strongest specs by role, refreshed weekly", href: "#tiers", icon: "tiers", words: "tier list tierlist ranking best spec class meta dps healer tank pve pvp mythic raid arena" },
  { title: "Lingo and commands", sub: "Glossary and slash commands", href: "#lingo", icon: "book", words: "glossary lingo slang abbreviations terms meaning bis aoe cc commands slash reload readycheck" },
  { title: "Resources", sub: "Best community sites", href: "#links", icon: "links", words: "links sites raider.io raiderio warcraft logs raidbots sim wowhead addons" },
  { title: "WoW Forever classes", sub: "Talent trees and races", href: "#forever", icon: "forever", words: "classic forever talents" },
  { title: "WoW Forever leveling talents", sub: "What to take at each level, for every class and tree", href: "#forever", icon: "tree", words: "classic forever leveling talents order level by level which talents first best leveling spec build" },
  { title: "WoW Forever talent planner", sub: "Spend 51 points, share the link", href: "#planner", icon: "tree", words: "classic forever talent calculator planner tree points build" },
  { title: "WoW Forever dungeons and raids", sub: "Dungeons by level, raid schedule", href: "#atlas", icon: "atlas", words: "classic forever dungeon raid level atlas" },
  { title: "WoW Forever to-do list", sub: "A session checklist you can edit", href: "#todo", icon: "weekly", words: "classic forever todo to-do checklist tasks chores" },
  { title: "WoW Forever level guide", sub: "Talent points and unlocks by level", href: "#levels", icon: "levels", words: "classic forever leveling talent points dual spec" }
];

// Common shorthand players type.
const ALIASES = {
  resto: "restoration", ele: "elemental", enh: "enhancement", ret: "retribution", prot: "protection",
  bm: "beast mastery", mm: "marksmanship", sv: "survival", disc: "discipline", sp: "shadow",
  dk: "death knight", dh: "demon hunter", uh: "unholy", ww: "windwalker", mw: "mistweaver", brm: "brewmaster",
  boomkin: "balance", boomie: "balance", bear: "guardian", cat: "feral", lock: "warlock", sham: "shaman",
  pally: "paladin", pala: "paladin", aff: "affliction", demo: "demonology", destro: "destruction",
  sin: "assassination", sub: "subtlety", dev: "devastation", pres: "preservation", aug: "augmentation", vdh: "vengeance"
};

let els = {};
let index = [];
let results = [];
let cursor = 0;

function buildIndex() {
  const items = PAGES.map((p) => ({ ...p, kind: "page", key: normalizeKey(`${p.title} ${p.sub} ${p.words}`) }));
  CLASSES.forEach((c) => {
    c.specs.forEach((s) => items.push({
      kind: "spec", title: `${s.name} ${c.name}`, sub: `${ROLE_LABELS[s.role]} build`, href: `#builds/${c.slug}/${s.slug}/aoe`,
      art: c.icon, color: c.color, key: normalizeKey(`${s.name} ${c.name} ${ROLE_LABELS[s.role]} ${s.role} retail build`)
    }));
  });
  FOREVER_CLASSES.forEach((c) => {
    c.trees.forEach((tr) => items.push({
      kind: "tree", title: `${tr.name} ${c.name}`, sub: `WoW Forever, ${roleLabel(tr.roles)}`, href: `#forever/${c.slug}/${tr.slug}`,
      art: c.icon, color: c.color, key: normalizeKey(`${tr.name} ${c.name} forever classic ${roleLabel(tr.roles)}`)
    }));
  });
  return items;
}

function characterItems() {
  return listCharacters().map((c) => ({
    kind: "char", title: c.name, sub: `Look up on ${c.realm} (${c.region.toUpperCase()})`, href: "#armory", icon: "user",
    char: c.id, key: normalizeKey(`${c.name} ${c.realm} ${c.className} ${c.specName} character`)
  }));
}

function search(query) {
  const words = normalizeKey(query).split(" ").filter(Boolean).map((w) => ALIASES[w] || w);
  const forever = document.documentElement.dataset.edition === "forever";
  const pool = [...characterItems(), ...index];
  if (!words.length) {
    // Nothing typed yet: show the pages for the edition you're in.
    return pool.filter((i) => i.kind === "page" && /forever/i.test(i.title) === forever || (i.kind === "page" && ["#macros", "#lingo", "#tiers"].includes(i.href))).slice(0, 8);
  }
  return pool
    .map((item) => {
      let score = 0;
      for (const w of words) {
        const at = item.key.indexOf(w);
        if (at < 0) return null;
        // Earlier and word-start matches rank higher.
        score += (at === 0 || item.key[at - 1] === " " ? 10 : 4) - Math.min(at, 30) / 30;
      }
      // Prefer results from the edition the player is in.
      if ((item.kind === "tree") === forever && item.kind !== "page" && item.kind !== "char") score += 3;
      if (item.kind === "char") score += 2;
      return { item, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((r) => r.item);
}

function render() {
  results = search(els.input.value);
  cursor = Math.min(cursor, Math.max(0, results.length - 1));
  if (!results.length) {
    els.list.innerHTML = html`<li class="palette-empty">Nothing matches "${els.input.value.trim()}". Try a class, a spec or a tool name.</li>`;
    els.input.removeAttribute("aria-activedescendant");
    return;
  }
  els.list.innerHTML = results.map((r, i) => html`
    <li id="sr-${i}" role="option" aria-selected="${String(i === cursor)}" class="palette-item${i === cursor ? " is-active" : ""}" data-index="${i}" style="${r.color ? classStyle(r.color) : ""}">
      ${r.art ? raw(html`<img src="${r.art}" alt="" width="36" height="36" />`) : raw(`<span class="palette-icon">${icon(r.icon || "arrow")}</span>`)}
      <span class="palette-text"><span class="palette-title">${r.title}</span><span class="palette-sub">${r.sub}</span></span>
    </li>`).join("");
  els.input.setAttribute("aria-activedescendant", `sr-${cursor}`);
  $(".palette-item.is-active", els.list)?.scrollIntoView({ block: "nearest" });
}

function go(item) {
  if (!item) return;
  close();
  if (item.kind === "char") {
    // Hand the character to the Armory view once it's showing.
    window.location.hash = item.href;
    requestAnimationFrame(() => $(`#savedChars [data-char="${CSS.escape(item.char)}"]`)?.click());
    return;
  }
  window.location.hash = item.href;
}

export function openSearch() {
  if (els.dialog.open) return;
  els.input.value = "";
  cursor = 0;
  render();
  els.dialog.showModal();
  els.input.focus();
}

function close() {
  if (els.dialog.open) els.dialog.close();
}

export function initSearch() {
  els = { dialog: $("#searchDialog"), input: $("#searchInput"), list: $("#searchResults") };
  index = buildIndex();

  // Show the right shortcut for the platform.
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || "");
  $$("[data-action='open-search'] kbd").forEach((k) => { k.textContent = mac ? "⌘ K" : "Ctrl K"; });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-action='open-search']")) openSearch();
  });

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (els.dialog.open) close();
      else openSearch();
    } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector("dialog[open]")) {
      e.preventDefault();
      openSearch();
    }
  });

  els.input.addEventListener("input", () => { cursor = 0; render(); });
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); cursor = (cursor + 1) % Math.max(1, results.length); render(); }
    if (e.key === "ArrowUp") { e.preventDefault(); cursor = (cursor - 1 + results.length) % Math.max(1, results.length); render(); }
    if (e.key === "Enter") { e.preventDefault(); go(results[cursor]); }
  });

  els.list.addEventListener("click", (e) => {
    const li = e.target.closest("[data-index]");
    if (li) go(results[Number(li.dataset.index)]);
  });
  els.list.addEventListener("pointermove", (e) => {
    const li = e.target.closest("[data-index]");
    if (!li || Number(li.dataset.index) === cursor) return;
    cursor = Number(li.dataset.index);
    $$(".palette-item", els.list).forEach((el, i) => {
      el.classList.toggle("is-active", i === cursor);
      el.setAttribute("aria-selected", String(i === cursor));
    });
    els.input.setAttribute("aria-activedescendant", `sr-${cursor}`);
  });

  // Any navigation (including the browser's back button) dismisses the palette.
  on("route", close);

  // Click on the backdrop closes.
  els.dialog.addEventListener("click", (e) => { if (e.target === els.dialog) close(); });
}
