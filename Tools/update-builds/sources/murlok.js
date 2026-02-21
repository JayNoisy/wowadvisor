// tools/update-builds/sources/murlok.js
const BASE = "https://murlok.io";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Murlok fetch failed ${res.status}: ${url}`);
  return res.json();
}

export async function getMeta(roleSlug, activity) {
  const activityEncoded = encodeURIComponent(activity); // "m+" -> "m%2B"
  return fetchJson(`${BASE}/api/meta/${roleSlug}/${activityEncoded}`);
}

export async function getGuide(classSlug, specSlug, heroSlug, activity) {
  const activityEncoded = encodeURIComponent(activity);

  const parts = [BASE, "api", "guides", classSlug, specSlug];
  if (heroSlug && heroSlug.length > 0) parts.push(heroSlug);
  parts.push(activityEncoded);

  return fetchJson(parts.join("/"));
}

// ---------- Helpers ----------

function titleCaseWord(w) {
  if (!w) return "";
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function slugToName(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .map((w) => titleCaseWord(w))
    .join(" ");
}

// We try to find a talent export string anywhere inside the guide payload.
// WoW talent strings commonly start with "C" and are long base64-ish strings.
// We avoid URLs and short strings.
function findExportStringDeep(value) {
  const seen = new Set();

  function walk(v) {
    if (v === null || v === undefined) return null;

    if (typeof v === "string") {
      const s = v.trim();
      if (s.length < 35) return null;
      if (s.includes("http://") || s.includes("https://")) return null;

      // Common export strings start with "C" (often "CcE...") and contain only base64-ish chars.
      // Some include "=" padding.
      const looksLikeExport =
        s[0] === "C" &&
        /^[A-Za-z0-9+/=]+$/.test(s) &&
        s.length > 40;

      if (looksLikeExport) return s;
      return null;
    }

    if (typeof v !== "object") return null;
    if (seen.has(v)) return null;
    seen.add(v);

    if (Array.isArray(v)) {
      for (const item of v) {
        const found = walk(item);
        if (found) return found;
      }
      return null;
    }

    // object
    // Prefer obvious keys if they exist
    const preferredKeys = [
      "talentString",
      "TalentString",
      "exportString",
      "ExportString",
      "talentsString",
      "TalentsString",
      "code",
      "Code"
    ];
    for (const k of preferredKeys) {
      if (k in v) {
        const found = walk(v[k]);
        if (found) return found;
      }
    }

    // Otherwise scan all keys
    for (const k of Object.keys(v)) {
      const found = walk(v[k]);
      if (found) return found;
    }

    return null;
  }

  return walk(value);
}

function buildsFromGuideCharacters(guide, mode, sourceLabelBase, title) {
  const out = [];
  const chars = Array.isArray(guide?.Characters) ? guide.Characters : [];
  let rank = 0;
  for (const ch of chars) {
    const exportString = findExportStringDeep(ch?.TalentsCode || ch);
    if (!exportString) continue;
    rank += 1;
    const className = slugToName(ch?.ClassSlug || guide?.ClassSlug);
    const specName = slugToName(ch?.SpecializationSlug || guide?.SpecializationSlug);
    if (!className || !specName) continue;
    const selectedTalents = {
      class: Array.isArray(ch?.ClassTalents)
        ? ch.ClassTalents
            .filter((t) => t && typeof t.Slug === "string" && t.Slug.length > 0)
            .map((t) => ({ slug: String(t.Slug), rank: Number(t.CurrentRank) || 1 }))
        : [],
      spec: Array.isArray(ch?.SpecializationTalents)
        ? ch.SpecializationTalents
            .filter((t) => t && typeof t.Slug === "string" && t.Slug.length > 0)
            .map((t) => ({ slug: String(t.Slug), rank: Number(t.CurrentRank) || 1 }))
        : [],
      hero: Array.isArray(ch?.HeroTalents)
        ? ch.HeroTalents
            .filter((t) => t && typeof t.Slug === "string" && t.Slug.length > 0)
            .map((t) => ({ slug: String(t.Slug), rank: Number(t.CurrentRank) || 1 }))
        : []
    };

    out.push({
      className,
      specName,
      mode,
      title: title || `${specName} — ${mode.toUpperCase()}`,
      source: `${sourceLabelBase} top-player`,
      updated: ch?.UpdatedAt || guide?.UpdatedAt || null,
      exportString,
      selectedTalents,
      notes: [ch?.Slug ? `Player: ${ch.Slug}` : null, Number.isFinite(rank) ? `RankIndex: ${rank}` : null].filter(Boolean)
    });
  }
  return out;
}

/**
 * Return normalized PvP builds in the same shape as Peavers:
 * { className, specName, mode:"pvp", title, source, updated, exportString, notes }
 *
 * We’ll treat “PvP” as Solo Shuffle (activity "solo") to match Murlok’s meta pages.
 */
export async function getMurlokPvpBuilds() {
  const activity = "solo"; // Solo Shuffle
  const roles = ["dps", "healer", "tank"];

  const builds = [];

  // Pull meta for all roles so we cover every spec.
  for (const role of roles) {
    const meta = await getMeta(role, activity);

    const updatedAt = meta?.UpdatedAt ?? null;
    const ranks = Array.isArray(meta?.Ranks) ? meta.Ranks : [];

    for (const r of ranks) {
      const classSlug = r?.ClassSlug;
      const specSlug = r?.SpecializationSlug;
      if (!classSlug || !specSlug) continue;

      // Try guide without heroSlug first
      let guide = null;
      try {
        guide = await getGuide(classSlug, specSlug, "", activity);
      } catch (e) {
        // If the base endpoint fails, skip it for now.
        // (We can add heroSlug iteration later if needed.)
        continue;
      }

      const perPlayer = buildsFromGuideCharacters(
        guide,
        "pvp",
        "Murlok.io",
        `${slugToName(specSlug)} — PvP (Solo Shuffle)`
      );
      if (perPlayer.length > 0) {
        builds.push(...perPlayer);
        continue;
      }

      const exportString = findExportStringDeep(guide);
      if (!exportString) continue;
      const className = slugToName(classSlug);
      const specName = slugToName(specSlug);
      builds.push({
        className,
        specName,
        mode: "pvp",
        title: `${specName} — PvP (Solo Shuffle)`,
        source: "Murlok.io",
        updated: guide?.UpdatedAt ?? updatedAt,
        exportString,
        notes: []
      });
    }
  }

  return builds;
}

export async function getMurlokPveBuilds() {
  const modes = [
    { mode: "aoe", activity: "m+", titleSuffix: "AoE (Mythic+)" },
    { mode: "raid", activity: "raid", titleSuffix: "Raid" }
  ];
  const roles = ["dps", "healer", "tank"];

  const builds = [];

  for (const { mode, activity, titleSuffix } of modes) {
    for (const role of roles) {
      let meta = null;
      try {
        meta = await getMeta(role, activity);
      } catch {
        continue;
      }

      const updatedAt = meta?.UpdatedAt ?? null;
      const ranks = Array.isArray(meta?.Ranks) ? meta.Ranks : [];

      for (const r of ranks) {
        const classSlug = r?.ClassSlug;
        const specSlug = r?.SpecializationSlug;
        if (!classSlug || !specSlug) continue;

        let guide = null;
        try {
          guide = await getGuide(classSlug, specSlug, "", activity);
        } catch {
          continue;
        }

        const perPlayer = buildsFromGuideCharacters(
          guide,
          mode,
          `Murlok.io (${activity})`,
          `${slugToName(specSlug)} — ${titleSuffix}`
        );
        if (perPlayer.length > 0) {
          builds.push(...perPlayer);
          continue;
        }

        const exportString = findExportStringDeep(guide);
        if (!exportString) continue;
        const className = slugToName(classSlug);
        const specName = slugToName(specSlug);
        builds.push({
          className,
          specName,
          mode,
          title: `${specName} — ${titleSuffix}`,
          source: `Murlok.io (${activity})`,
          updated: guide?.UpdatedAt ?? updatedAt,
          exportString,
          notes: []
        });
      }
    }
  }

  return builds;
}
