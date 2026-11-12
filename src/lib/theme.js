// Light/dark theme. Follows the system until the player picks one, then remembers the choice.

import { KEYS, readString, writeString } from "./storage.js";
import { emit } from "./events.js";

const media = window.matchMedia?.("(prefers-color-scheme: light)");

export function getTheme() {
  const saved = readString(KEYS.theme, "");
  if (saved === "light" || saved === "dark") return saved;
  return media?.matches ? "light" : "dark";
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  emit("theme:changed", theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  writeString(KEYS.theme, next);
  apply(next);
  return next;
}

export function initTheme() {
  apply(getTheme());
  media?.addEventListener?.("change", () => {
    if (!readString(KEYS.theme, "")) apply(getTheme());
  });
}
