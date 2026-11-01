// Loads builds.json and exposes normalised build lookups.

import { normalizeMode, isoOrEmpty } from "../../lib/format.js";
import { emit } from "../../lib/events.js";

const state = {
  root: null,
  generatedAt: null,
  sources: null,
  error: null,
  loaded: false
};

export async function loadBuilds() {
  try {
    const res = await fetch("/builds.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`builds.json returned HTTP ${res.status}`);
    const payload = await res.json();
    const wrapped = payload && typeof payload === "object" && payload.builds && typeof payload.builds === "object";
    state.root = wrapped ? payload.builds : payload;
    state.generatedAt = wrapped ? payload.generatedAt ?? null : null;
    state.sources = wrapped ? payload.sources ?? null : null;
    state.error = null;
  } catch (err) {
    console.error("Failed to load builds.json", err);
    state.root = null;
    state.error = err instanceof Error ? err.message : String(err);
  }
  state.loaded = true;
  emit("builds:loaded", getBuildsMeta());
  return state.root;
}

export function getBuildsMeta() {
  return {
    loaded: state.loaded,
    ok: Boolean(state.root),
    error: state.error,
    generatedAt: state.generatedAt,
    sources: state.sources
  };
}

/** Raw entry, as stored in builds.json. */
export function getRawBuild(className, specName, mode) {
  return state.root?.[className]?.[specName]?.[normalizeMode(mode)] ?? null;
}

export function getRawSpec(className, specName) {
  return state.root?.[className]?.[specName] ?? null;
}

/** Normalised build: tolerates both the flat format and the older { selected: {...} } wrapper. */
export function getBuild(className, specName, mode) {
  return normalizeBuild(getRawBuild(className, specName, mode));
}

export function normalizeBuild(build) {
  if (!build || typeof build !== "object") return null;
  const core = build.selected && typeof build.selected === "object" ? build.selected : build;
  const pick = (key) => core[key] ?? build[key] ?? null;
  const notes = Array.isArray(core.notes) ? core.notes : Array.isArray(build.notes) ? build.notes : [];
  const breakdown = pick("consensusBreakdown");
  return {
    title: pick("title"),
    source: pick("source"),
    updated: pick("updated"),
    exportString: String(pick("exportString") || ""),
    notes: notes.map(String).filter((n) => n.trim() && !/^(player|rankindex):/i.test(n.trim())),
    confidence: pick("confidence"),
    confidenceScore: pick("confidenceScore"),
    confidenceRationale: pick("confidenceRationale"),
    sampleSize: pick("sampleSize"),
    agreementCount: pick("agreementCount"),
    agreementRatio: pick("agreementRatio"),
    sourceFamilies: breakdown && typeof breakdown === "object" ? Object.keys(breakdown) : [],
    statPriority: pick("statPriority") || pick("statPriorities")
  };
}

/** What the tracker compares a copied build against. */
export function getCurrentSnapshot(className, specName, mode) {
  const current = getBuild(className, specName, mode);
  if (!current || !current.exportString) return null;
  return {
    title: current.title || null,
    updatedAt: isoOrEmpty(current.updated) || null,
    exportString: current.exportString
  };
}

export function hasBuildData() {
  return Boolean(state.root);
}
