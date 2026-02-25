import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

const WOWHEAD = "https://www.wowhead.com";
const METHOD = "https://www.method.gg";
const ICY = "https://www.icy-veins.com";
const ARCHON = "https://www.archon.gg";

const base64Table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const TANK_SPECS = new Set([
  "Blood",
  "Vengeance",
  "Guardian",
  "Brewmaster",
  "Protection"
]);

const HEALER_SPECS = new Set([
  "Holy",
  "Discipline",
  "Restoration",
  "Mistweaver",
  "Preservation"
]);

function classSlug(className) {
  const map = {
    "Death Knight": "death-knight",
    "Demon Hunter": "demon-hunter"
  };
  if (map[className]) return map[className];
  return String(className || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function specSlug(specName) {
  return String(specName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function wowheadRole(specName) {
  if (TANK_SPECS.has(specName)) return "tank";
  if (HEALER_SPECS.has(specName)) return "healer";
  return "dps";
}

function headerFromTalentString(str) {
  const bits = [];
  for (const ch of str) {
    const v = base64Table.indexOf(ch);
    if (v < 0) return null;
    for (let i = 0; i < 6; i += 1) bits.push((v >> i) & 1);
    if (bits.length >= 24) break;
  }
  if (bits.length < 24) return null;
  const read = (start, len) => {
    let n = 0;
    for (let i = 0; i < len; i += 1) n |= (bits[start + i] || 0) << i;
    return n;
  };
  return { version: read(0, 8), specId: read(8, 16) };
}

function looksLikeTalentString(str) {
  const s = String(str || "").trim();
  if (s.length < 40 || s.length > 260) return false;
  if (!s.startsWith("C")) return false;
  if (!/^[A-Za-z0-9+/=]+$/.test(s)) return false;
  const h = headerFromTalentString(s);
  if (!h) return false;
  if (h.version < 1 || h.version > 30) return false;
  if (h.specId < 1 || h.specId > 2500) return false;
  return true;
}

function extractTalentStrings(html) {
  const raw = html.match(/C[A-Za-z0-9+/=]{40,260}/g) || [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const s = String(item || "").trim();
    if (!looksLikeTalentString(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function extractUpdated(html) {
  const patterns = [
    /article:modified_time["']\s*content=["']([^"']+)["']/i,
    /dateModified["']\s*:\s*["']([^"']+)["']/i,
    /datePublished["']\s*:\s*["']([^"']+)["']/i,
    /"updatedAt"\s*:\s*"([^"]+)"/i
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      accept: "text/html,application/json",
      "user-agent": "wow-builds-updater"
    }
  });
  if (!res.ok) return { ok: false, status: res.status, text: "" };
  return { ok: true, status: res.status, text: await res.text() };
}

async function loadSpecCatalog() {
  const buildsPath = path.join(projectRoot, "builds.json");
  const raw = await fs.readFile(buildsPath, "utf8");
  const payload = JSON.parse(raw);
  const root = payload?.builds && typeof payload.builds === "object" ? payload.builds : {};
  const list = [];
  for (const className of Object.keys(root)) {
    const bySpec = root[className];
    if (!bySpec || typeof bySpec !== "object") continue;
    for (const specName of Object.keys(bySpec)) {
      list.push({ className, specName });
    }
  }
  return list;
}

function addIfUnique(target, entry) {
  const key = `${entry.className}|||${entry.specName}|||${entry.mode}|||${entry.exportString}`;
  if (!target._index) target._index = new Set();
  if (target._index.has(key)) return;
  target._index.add(key);
  target.items.push(entry);
}

async function collectArchon(specs) {
  const bucket = { items: [], _index: new Set() };
  const report = [];

  for (const { className, specName } of specs) {
    const c = classSlug(className);
    const s = specSlug(specName);
    const modeConfigs = [
      {
        mode: "aoe",
        title: `${specName} - AoE (Mythic+)`,
        url: `${ARCHON}/wow/builds/${s}/${c}/mythic-plus/overview/10/all-dungeons/this-week`
      },
      {
        mode: "raid",
        title: `${specName} - Raid`,
        url: `${ARCHON}/wow/builds/${s}/${c}/raid/overview/mythic/all-bosses`
      }
    ];

    for (const cfg of modeConfigs) {
      try {
        const page = await fetchText(cfg.url);
        if (!page.ok) {
          report.push({ source: "archon", className, specName, mode: cfg.mode, url: cfg.url, ok: false, status: page.status });
          continue;
        }
        const codes = extractTalentStrings(page.text);
        if (codes.length === 0) {
          report.push({ source: "archon", className, specName, mode: cfg.mode, url: cfg.url, ok: false, reason: "no-codes" });
          continue;
        }
        addIfUnique(bucket, {
          className,
          specName,
          mode: cfg.mode,
          title: cfg.title,
          source: "Archon.gg",
          updated: extractUpdated(page.text),
          exportString: codes[0],
          notes: [`Source URL: ${cfg.url}`]
        });
        report.push({ source: "archon", className, specName, mode: cfg.mode, url: cfg.url, ok: true, codes: codes.length });
      } catch (err) {
        report.push({ source: "archon", className, specName, mode: cfg.mode, url: cfg.url, ok: false, error: String(err) });
      }
    }
  }

  return { builds: bucket.items, report };
}

async function collectWowhead(specs) {
  const bucket = { items: [], _index: new Set() };
  const report = [];

  for (const { className, specName } of specs) {
    const c = classSlug(className);
    const s = specSlug(specName);
    const role = wowheadRole(specName);
    const baseUrl = `${WOWHEAD}/guide/classes/${c}/${s}`;
    const pveUrl = `${baseUrl}/talent-builds-pve-${role}`;
    const pvpUrls = [`${baseUrl}/talent-builds-pvp-${role}`, `${baseUrl}/talent-builds-pvp`];

    try {
      const page = await fetchText(pveUrl);
      if (page.ok) {
        const codes = extractTalentStrings(page.text);
        if (codes.length > 0) {
          addIfUnique(bucket, {
            className,
            specName,
            mode: "raid",
            title: `${specName} - Raid`,
            source: "Wowhead",
            updated: extractUpdated(page.text),
            exportString: codes[0],
            notes: [`Guide URL: ${pveUrl}`]
          });
          addIfUnique(bucket, {
            className,
            specName,
            mode: "aoe",
            title: `${specName} - AoE (Mythic+)`,
            source: "Wowhead",
            updated: extractUpdated(page.text),
            exportString: codes[Math.min(1, codes.length - 1)],
            notes: [`Guide URL: ${pveUrl}`]
          });
          report.push({ source: "wowhead", className, specName, mode: "pve", url: pveUrl, ok: true, codes: codes.length });
        } else {
          report.push({ source: "wowhead", className, specName, mode: "pve", url: pveUrl, ok: false, reason: "no-codes" });
        }
      } else {
        report.push({ source: "wowhead", className, specName, mode: "pve", url: pveUrl, ok: false, status: page.status });
      }
    } catch (err) {
      report.push({ source: "wowhead", className, specName, mode: "pve", url: pveUrl, ok: false, error: String(err) });
    }

    let pvpAdded = false;
    for (const pvpUrl of pvpUrls) {
      try {
        const page = await fetchText(pvpUrl);
        if (!page.ok) continue;
        const codes = extractTalentStrings(page.text);
        if (codes.length === 0) continue;
        addIfUnique(bucket, {
          className,
          specName,
          mode: "pvp",
          title: `${specName} - PvP`,
          source: "Wowhead",
          updated: extractUpdated(page.text),
          exportString: codes[0],
          notes: [`Guide URL: ${pvpUrl}`]
        });
        report.push({ source: "wowhead", className, specName, mode: "pvp", url: pvpUrl, ok: true, codes: codes.length });
        pvpAdded = true;
        break;
      } catch {
        // keep trying fallback URLs
      }
    }
    if (!pvpAdded) {
      report.push({ source: "wowhead", className, specName, mode: "pvp", url: pvpUrls[0], ok: false, reason: "no-page-or-no-codes" });
    }
  }

  return { builds: bucket.items, report };
}

async function collectMethod(specs) {
  const bucket = { items: [], _index: new Set() };
  const report = [];

  for (const { className, specName } of specs) {
    const c = classSlug(className);
    const s = specSlug(specName);
    const url = `${METHOD}/guides/${s}-${c}/talents`;
    try {
      const page = await fetchText(url);
      if (!page.ok) {
        report.push({ source: "method", className, specName, url, ok: false, status: page.status });
        continue;
      }
      const codes = extractTalentStrings(page.text);
      if (codes.length === 0) {
        report.push({ source: "method", className, specName, url, ok: false, reason: "no-codes" });
        continue;
      }
      addIfUnique(bucket, {
        className,
        specName,
        mode: "raid",
        title: `${specName} - Raid`,
        source: "Method",
        updated: extractUpdated(page.text),
        exportString: codes[0],
        notes: [`Guide URL: ${url}`]
      });
      addIfUnique(bucket, {
        className,
        specName,
        mode: "aoe",
        title: `${specName} - AoE (Mythic+)`,
        source: "Method",
        updated: extractUpdated(page.text),
        exportString: codes[Math.min(1, codes.length - 1)],
        notes: [`Guide URL: ${url}`]
      });
      report.push({ source: "method", className, specName, url, ok: true, codes: codes.length });
    } catch (err) {
      report.push({ source: "method", className, specName, url, ok: false, error: String(err) });
    }
  }

  return { builds: bucket.items, report };
}

async function collectIcy(specs) {
  const bucket = { items: [], _index: new Set() };
  const report = [];

  for (const { className, specName } of specs) {
    const c = classSlug(className);
    const s = specSlug(specName);
    const role = wowheadRole(specName);
    const url = `${ICY}/wow/${s}-${c}-pve-${role}-spec-builds-talents`;
    try {
      const page = await fetchText(url);
      if (!page.ok) {
        report.push({ source: "icy-veins", className, specName, url, ok: false, status: page.status });
        continue;
      }
      const codes = extractTalentStrings(page.text);
      if (codes.length === 0) {
        report.push({ source: "icy-veins", className, specName, url, ok: false, reason: "no-direct-blizzard-codes" });
        continue;
      }
      addIfUnique(bucket, {
        className,
        specName,
        mode: "raid",
        title: `${specName} - Raid`,
        source: "Icy-Veins",
        updated: extractUpdated(page.text),
        exportString: codes[0],
        notes: [`Guide URL: ${url}`]
      });
      addIfUnique(bucket, {
        className,
        specName,
        mode: "aoe",
        title: `${specName} - AoE (Mythic+)`,
        source: "Icy-Veins",
        updated: extractUpdated(page.text),
        exportString: codes[Math.min(1, codes.length - 1)],
        notes: [`Guide URL: ${url}`]
      });
      report.push({ source: "icy-veins", className, specName, url, ok: true, codes: codes.length });
    } catch (err) {
      report.push({ source: "icy-veins", className, specName, url, ok: false, error: String(err) });
    }
  }

  return { builds: bucket.items, report };
}

function sourcePayload(label, builds) {
  return {
    label,
    builds: builds.sort((a, b) => {
      const aKey = `${a.className}|${a.specName}|${a.mode}`;
      const bKey = `${b.className}|${b.specName}|${b.mode}`;
      return aKey.localeCompare(bKey);
    })
  };
}

async function writeJson(relPath, payload) {
  const full = path.join(projectRoot, relPath);
  await fs.writeFile(full, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return full;
}

async function main() {
  const specs = await loadSpecCatalog();
  console.log(`Seeding sources for ${specs.length} specs...`);

  const [archon, wowhead, method, icy] = await Promise.all([
    collectArchon(specs),
    collectWowhead(specs),
    collectMethod(specs),
    collectIcy(specs)
  ]);

  const archonPayload = {
    sources: [sourcePayload("Archon.gg", archon.builds)],
    generatedAt: new Date().toISOString(),
    notes: ["Auto-generated by Tools/update-builds/seed-curated-sources.js"]
  };

  const curatedPayload = {
    sources: [
      sourcePayload("Wowhead", wowhead.builds),
      sourcePayload("Method", method.builds),
      sourcePayload("Icy-Veins", icy.builds)
    ],
    generatedAt: new Date().toISOString(),
    notes: ["Auto-generated by Tools/update-builds/seed-curated-sources.js"]
  };

  const archonPath = await writeJson("Tools/update-builds/sources/archon-builds.json", archonPayload);
  const curatedPath = await writeJson("Tools/update-builds/sources/curated-guides.json", curatedPayload);

  const summary = {
    archon: archon.builds.length,
    wowhead: wowhead.builds.length,
    method: method.builds.length,
    icy: icy.builds.length
  };
  console.log("Seed summary:", summary);
  console.log(`Wrote: ${archonPath}`);
  console.log(`Wrote: ${curatedPath}`);

  const reportPath = path.join(projectRoot, "Tools/update-builds/sources/seed-report.json");
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary,
        archonReport: archon.report,
        wowheadReport: wowhead.report,
        methodReport: method.report,
        icyReport: icy.report
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  console.log(`Wrote: ${reportPath}`);
}

main().catch((err) => {
  console.error("seed-curated-sources failed:", err);
  process.exit(1);
});
