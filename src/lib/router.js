// Hash router. Routes look like:
//   #builds                       Retail class picker
//   #builds/shaman                Retail class chosen
//   #builds/shaman/elemental/aoe  Retail build view
//   #tracker, #armory             Retail tools
//   #forever                      WoW Forever class picker
//   #forever/shaman/enhancement   WoW Forever class + talent tree
//   #atlas                        WoW Forever dungeons and raids

import { emit } from "./events.js";

export const VIEWS = ["builds", "tracker", "armory", "forever", "atlas"];
const CLASS_VIEWS = ["builds", "forever"];
const FOREVER_VIEWS = ["forever", "atlas"];

export const editionOf = (view) => (FOREVER_VIEWS.includes(view) ? "forever" : "retail");

export function parseHash(hash = window.location.hash) {
  const parts = String(hash || "")
    .replace(/^#\/?/, "")
    .split("/")
    .map((p) => decodeURIComponent(p).trim().toLowerCase())
    .filter(Boolean);
  // Legacy "#home" links land on builds.
  const view = VIEWS.includes(parts[0]) ? parts[0] : "builds";
  const hasClass = CLASS_VIEWS.includes(view);
  return {
    view,
    edition: editionOf(view),
    classSlug: hasClass ? parts[1] || null : null,
    specSlug: hasClass ? parts[2] || null : null,
    mode: view === "builds" ? parts[3] || null : null
  };
}

export function buildHash({ view = "builds", classSlug, specSlug, mode } = {}) {
  const parts = [view];
  if (CLASS_VIEWS.includes(view)) {
    if (classSlug) parts.push(classSlug);
    if (classSlug && specSlug) parts.push(specSlug);
    if (view === "builds" && classSlug && specSlug && mode) parts.push(mode);
  }
  return `#${parts.map(encodeURIComponent).join("/")}`;
}

/**
 * Update the URL and render synchronously (so view transitions can capture the new state).
 * `replace` avoids flooding history while clicking through specs/modes.
 */
export function navigate(route, { replace = false } = {}) {
  const next = buildHash(route);
  if (next !== window.location.hash) {
    if (replace) history.replaceState(null, "", next);
    else history.pushState(null, "", next);
  }
  emit("route", parseHash(next));
}

export function startRouter() {
  window.addEventListener("hashchange", () => emit("route", parseHash()));
  emit("route", parseHash());
}
