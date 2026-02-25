import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODES = new Set(["aoe", "raid", "pvp"]);

function normalizeMode(mode) {
  const m = String(mode || "").toLowerCase().trim();
  if (m === "mythic+" || m === "m+" || m === "dungeon" || m === "mythicplus") return "aoe";
  if (m === "arena" || m === "shuffle") return "pvp";
  return m;
}

function sourceFamily(source) {
  const s = String(source || "").toLowerCase();
  if (s.includes("wowhead")) return "wowhead";
  if (s.includes("method")) return "method";
  if (s.includes("icy-veins") || s.includes("icyveins")) return "icyveins";
  return "other";
}

function canonicalSourceLabel(source) {
  const fam = sourceFamily(source);
  if (fam === "wowhead") return "Wowhead";
  if (fam === "method") return "Method";
  if (fam === "icyveins") return "Icy-Veins";
  return null;
}

function normalizeBuild(raw, sourceLabel) {
  if (!raw || typeof raw !== "object") return null;
  const className = String(raw.className || "").trim();
  const specName = String(raw.specName || "").trim();
  const mode = normalizeMode(raw.mode);
  const exportString = String(raw.exportString || "").trim();
  if (!className || !specName || !MODES.has(mode) || !exportString) return null;

  const sourceInput = String(raw.source || sourceLabel || "").trim();
  const family = sourceFamily(sourceInput);
  if (family === "other") return null;
  const canonical = canonicalSourceLabel(sourceInput) || sourceInput;

  return {
    className,
    specName,
    mode,
    title: raw.title || `${specName} - ${mode.toUpperCase()}`,
    source: canonical,
    updated: raw.updated || null,
    exportString,
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    selectedTalents: raw.selectedTalents && typeof raw.selectedTalents === "object" ? raw.selectedTalents : null
  };
}

function normalizePayload(payload, fallbackLabel) {
  const out = [];
  const sourceList = Array.isArray(payload?.sources) ? payload.sources : null;
  if (sourceList) {
    for (const sourceEntry of sourceList) {
      const sourceLabel = sourceEntry?.label || fallbackLabel;
      const builds = Array.isArray(sourceEntry?.builds) ? sourceEntry.builds : [];
      for (const b of builds) {
        const normalized = normalizeBuild(b, sourceLabel);
        if (normalized) out.push(normalized);
      }
    }
    return out;
  }

  const topBuilds = Array.isArray(payload?.builds)
    ? payload.builds
    : (Array.isArray(payload) ? payload : []);
  for (const b of topBuilds) {
    const normalized = normalizeBuild(b, fallbackLabel);
    if (normalized) out.push(normalized);
  }
  return out;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "wow-builds-updater"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function parseRemoteConfigs() {
  const raw = process.env.CURATED_GUIDE_SOURCE_URLS || "";
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, idx) => {
      const [url, label] = entry.split("|").map((x) => x.trim());
      return {
        url,
        label: label || `Curated Guides #${idx + 1}`
      };
    })
    .filter((cfg) => /^https?:\/\//i.test(cfg.url));
}

async function loadLocalBuilds() {
  const localPath = path.join(__dirname, "curated-guides.json");
  try {
    const raw = await fs.readFile(localPath, "utf8");
    const payload = JSON.parse(raw);
    return normalizePayload(payload, "Curated Guides (local)");
  } catch {
    return [];
  }
}

async function loadRemoteBuilds() {
  const configs = parseRemoteConfigs();
  const out = [];
  const results = [];
  for (const cfg of configs) {
    try {
      const payload = await fetchJson(cfg.url);
      const builds = normalizePayload(payload, cfg.label);
      out.push(...builds);
      results.push({ url: cfg.url, label: cfg.label, ok: true, count: builds.length });
    } catch (err) {
      results.push({ url: cfg.url, label: cfg.label, ok: false, error: String(err) });
    }
  }
  return { builds: out, results };
}

export async function getCuratedGuideBuilds() {
  const localBuilds = await loadLocalBuilds();
  const remote = await loadRemoteBuilds();
  return {
    builds: [...localBuilds, ...remote.builds],
    stats: {
      localCount: localBuilds.length,
      remote: remote.results
    }
  };
}
