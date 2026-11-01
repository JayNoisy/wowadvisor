// App shell: wires features together, switches views from the URL hash, and flips between
// the Retail and WoW Forever editions.

// Self-hosted fonts (no third-party requests).
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/instrument-sans/index.css";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/cinzel/latin-700.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/builds.css";
import "./styles/tracker.css";
import "./styles/armory.css";
import "./styles/forever.css";

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

const VIEW_TITLES = {
  builds: "Builds",
  tracker: "Lockout tracker",
  armory: "Armory",
  forever: "WoW Forever classes",
  atlas: "WoW Forever dungeons and raids"
};

const THEME_COLOR = { retail: "#0f1124", forever: "#16120c" };

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
  $('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
  $$("[data-for]").forEach((el) => { el.hidden = el.dataset.for !== next; });
  $$("#editionSwitch [data-edition]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.edition === next)));
  $("[data-brand]")?.setAttribute("href", next === "forever" ? "#forever" : "#builds");
  writeString(KEYS.edition, next);
  renderFooterStamp();
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
  lastRoute[route.edition] = route;
  setEdition(route.edition);
  showView(route.view);
  // Class color only applies on class pages; elsewhere the edition accent takes over.
  if (!["builds", "forever"].includes(route.view)) document.documentElement.style.removeProperty("--cc");
  document.title = `${VIEW_TITLES[route.view]} | WoW Advisor`;
  if (route.view === "builds") showBuildsRoute(route);
  if (route.view === "tracker") showTracker();
  if (route.view === "forever") showForeverRoute(route);
  if (route.view === "atlas") showAtlas();
  if (viewChanged && !["builds", "forever"].includes(route.view)) window.scrollTo({ top: 0 });
});

on("builds:loaded", renderFooterStamp);

$("#editionSwitch").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-edition]");
  if (btn) switchEdition(btn.dataset.edition, btn);
});

initBuildsView();
initMyBuilds();
initTrackerView();
initArmoryView();
initAuthView();
initForeverView();
initAtlasView();
startRouter();

loadBuilds();
initSession();
