// App shell: wires features together, switches views from the URL hash, and flips between
// the Retail and WoW Forever editions.

// Self-hosted fonts (no third-party requests). Archivo carries a width axis, so one family
// covers wide headlines and normal-width text. Fraunces is the WoW Forever headline face.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/fraunces/opsz.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/builds.css";
import "./styles/tracker.css";
import "./styles/armory.css";
import "./styles/forever.css";
import "./styles/tools.css";
import "./styles/mplus.css";
import "./styles/talents.css";
import "./styles/reference.css";

import { $, $$, prefersReducedMotion } from "./lib/dom.js";
import { on } from "./lib/events.js";
import { startRouter, navigate } from "./lib/router.js";
import { KEYS, readJson, readString, writeString } from "./lib/storage.js";
import { timeAgo } from "./lib/format.js";
import { loadBuilds, getBuildsMeta } from "./features/builds/data.js";
import { initBuildsView, showBuildsRoute } from "./features/builds/view.js";
import { initMyBuilds } from "./features/builds/my-builds.js";
import { initTrackerView, showTracker } from "./features/tracker/view.js";
import { initArmoryView } from "./features/armory/view.js";
import { initSession } from "./features/auth/session.js";
import { initAuthView } from "./features/auth/view.js";
import { initForeverView, showForeverRoute } from "./features/forever/view.js";
import { initAtlasView, showAtlas } from "./features/forever/atlas.js";
import { initLevelsView, showLevels } from "./features/levels/view.js";
import { initTodoView, showTodo } from "./features/forever/todo.js";
import { initWeeklyView, showWeekly } from "./features/weekly/view.js";
import { initPartyView, showParty } from "./features/party/view.js";
import { initMplusView, showMplus } from "./features/mplus/view.js";
import { initMacrosView, showMacros } from "./features/macros/view.js";
import { initLinksView, showLinks } from "./features/links/view.js";
import { initGearView, showGear } from "./features/gear/view.js";
import { initCalcView, showCalc } from "./features/calc/view.js";
import { initLingoView, showLingo } from "./features/lingo/view.js";
import { initTiersView, showTiers } from "./features/tiers/view.js";
import { initPlannerView, showPlanner } from "./features/planner/view.js";
import { initSearch } from "./features/search/palette.js";
import { initToolkit, renderToolkit } from "./features/home/toolkit.js";
import { initTheme, getTheme, toggleTheme } from "./lib/theme.js";
import { icon } from "./lib/icons.js";
import { setClassColor } from "./lib/color.js";

const VIEW_TITLES = {
  builds: "Builds",
  weekly: "This week",
  tracker: "Lockouts",
  mplus: "Mythic+ season guide",
  party: "Group check",
  armory: "Armory",
  gear: "Gear and upgrades",
  calc: "Talent calculator",
  links: "Resources",
  lingo: "Lingo and commands",
  tiers: "Tier lists",
  planner: "WoW Forever talent planner",
  macros: "Macros",
  forever: "WoW Forever classes",
  atlas: "WoW Forever dungeons and raids",
  levels: "WoW Forever level guide",
  todo: "WoW Forever to-do list"
};

// Where each edition was last left, so the switch returns you to the same page.
const lastRoute = { retail: null, forever: null };
let edition = null;
let lastView = null;

function showView(view) {
  $$(".view").forEach((el) => { el.hidden = el.id !== `view-${view}`; });
  $$("[data-nav]").forEach((a) => {
    const active = a.dataset.nav === view;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.body.dataset.view = view;
}

function setEdition(next) {
  if (edition === next) return;
  edition = next;
  const root = document.documentElement;
  root.dataset.edition = next;
  syncThemeColor();
  $$("[data-for]").forEach((el) => { el.hidden = el.dataset.for !== next; });
  $$("#editionSwitch [data-edition]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.edition === next)));
  $("[data-brand]")?.setAttribute("href", next === "forever" ? "#forever" : "#builds");
  writeString(KEYS.edition, next);
  renderFooterStamp();
}

/** Keeps the browser chrome (mobile address bar) matched to the page background. */
function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (bg) $('meta[name="theme-color"]')?.setAttribute("content", bg);
}

function renderThemeToggle() {
  const btn = $("#themeToggle");
  const dark = getTheme() === "dark";
  btn.innerHTML = `${icon(dark ? "sun" : "moon")}<span>${dark ? "Light mode" : "Dark mode"}</span>`;
  btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

function renderFooterStamp() {
  const el = $("#dataStamp");
  if (!el) return;
  if (edition === "forever") {
    el.textContent = "WoW Forever details reflect Blizzard's beta notes and launch roadmap.";
    return;
  }
  const meta = getBuildsMeta();
  el.textContent = meta.ok && meta.generatedAt
    ? `Build data refreshed ${timeAgo(meta.generatedAt)}.`
    : meta.loaded && !meta.ok ? "Build data is unavailable right now." : "";
}

/** Switching editions keeps your place in each one. The palette change is the one big animation on the site. */
function switchEdition(target, originEl) {
  if (target === edition) return;
  const fallback = target === "forever"
    ? readJson(KEYS.foreverLast, null) || { view: "forever" }
    : (() => { const last = readJson(KEYS.lastBuild, null); return last?.classSlug ? { view: "builds", ...last } : { view: "builds" }; })();
  const route = lastRoute[target] || fallback;
  const go = () => navigate(route);

  if (!document.startViewTransition || prefersReducedMotion()) {
    go();
    return;
  }
  const r = originEl?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : 0;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const t = document.startViewTransition(go);
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  }).catch(() => {});
}

on("route", (route) => {
  const first = lastView === null;

  // A bare visit (no hash) reopens whichever edition you used last.
  if (first && !window.location.hash && readString(KEYS.edition, "") === "forever") {
    navigate(readJson(KEYS.foreverLast, null) || { view: "forever" }, { replace: true });
    return;
  }
  // Bare #builds (or no hash) reopens the last spec you looked at.
  if (route.view === "builds" && !route.classSlug && first) {
    const last = readJson(KEYS.lastBuild, null);
    if (last?.classSlug && !window.location.hash.startsWith("#builds")) {
      navigate({ view: "builds", ...last }, { replace: true });
      return;
    }
  }

  const viewChanged = lastView !== route.view;
  lastView = route.view;
  // Shared pages (Macros) have no edition of their own: stay in the one you're in.
  const routeEdition = route.edition || edition || (readString(KEYS.edition, "") === "forever" ? "forever" : "retail");
  if (route.edition) lastRoute[route.edition] = route;
  setEdition(routeEdition);
  showView(route.view);
  // Class color only applies on class pages; elsewhere the neutral chrome takes over.
  if (!["builds", "forever", "calc", "planner"].includes(route.view)) setClassColor(document.documentElement, null);
  document.title = `${VIEW_TITLES[route.view]} | WoW Advisor`;
  if (route.view === "builds") { showBuildsRoute(route); renderToolkit(); }
  if (route.view === "weekly") showWeekly();
  if (route.view === "tracker") showTracker();
  if (route.view === "mplus") showMplus();
  if (route.view === "party") showParty();
  if (route.view === "links") showLinks();
  if (route.view === "gear") showGear();
  if (route.view === "calc") showCalc(route);
  if (route.view === "lingo") showLingo();
  if (route.view === "tiers") showTiers();
  if (route.view === "planner") showPlanner(route);
  if (route.view === "macros") showMacros();
  if (route.view === "forever") { showForeverRoute(route); renderToolkit(); }
  if (route.view === "atlas") showAtlas();
  if (route.view === "levels") showLevels();
  if (route.view === "todo") showTodo();
  if (viewChanged && !["builds", "forever"].includes(route.view)) window.scrollTo({ top: 0 });
  // The mobile nav scrolls sideways; keep the current page's link in view.
  $(".nav a.is-active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
});

on("builds:loaded", renderFooterStamp);

$("#editionSwitch").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-edition]");
  if (btn) switchEdition(btn.dataset.edition, btn);
});

// Static markup marks where icons go with data-icon; fill them in once.
$$("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)));

initTheme();
renderThemeToggle();
syncThemeColor();
$("#themeToggle").addEventListener("click", () => {
  const apply = () => { toggleTheme(); renderThemeToggle(); syncThemeColor(); };
  if (document.startViewTransition && !prefersReducedMotion()) document.startViewTransition(apply);
  else apply();
});

initBuildsView();
initMyBuilds();
initTrackerView();
initArmoryView();
initAuthView();
initForeverView();
initAtlasView();
initLevelsView();
initTodoView();
initWeeklyView();
initPartyView();
initMplusView();
initMacrosView();
initLinksView();
initGearView();
initCalcView();
initLingoView();
initTiersView();
initPlannerView();
initSearch();
initToolkit();
startRouter();

loadBuilds();
initSession();
