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
  // An AI-reviewed pick sits in `selected`; the top-player consensus it was checked against stays underneath.
  if (core !== build && core.ai && typeof core.ai === "object") {
    const consensus = build.exportString ? normalizeCore(build, build) : null;
    const ai = normalizeAi(core.ai);
    return {
      ...normalizeCore(core, {}),
      // Stat priorities and data-quality figures still come from the player data.
      statPriority: build.statPriority || build.statPriorities || null,
      ai,
      consensus: consensus && consensus.exportString !== String(core.exportString || "") ? consensus : null,
      matchesConsensus: Boolean(consensus && consensus.exportString === String(core.exportString || "")),
      consensusSample: consensus?.sampleSize ?? null
    };
  }
  return normalizeCore(core, build);
}

const HTTP_URL = /^https?:\/\//i;

function normalizeAi(ai) {
  const list = (v) => (Array.isArray(v) ? v : []);
  return {
    hero: ai.hero ? String(ai.hero) : null,
    headline: String(ai.headline || ""),
    why: list(ai.why).map(String).filter(Boolean),
    players: ai.players ? String(ai.players) : null,
    sources: list(ai.sources)
      .filter((s) => s && s.name && HTTP_URL.test(String(s.url || "")))
      .map((s) => ({ name: String(s.name), url: String(s.url) })),
    reviewedAt: ai.reviewedAt || null,
    differs: ai.differs && typeof ai.differs === "object"
      ? { takes: list(ai.differs.takes).map(String), skips: list(ai.differs.skips).map(String), sameHero: ai.differs.sameHero !== false, consensusHero: ai.differs.consensusHero || null }
      : null
  };
}

function normalizeCore(core, build) {
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
    statPriority: pick("statPriority") || pick("statPriorities"),
    ai: null,
    consensus: null
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
