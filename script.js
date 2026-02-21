// =========================
// UI Spec Definitions
// =========================
const CLASS_DATA = {
  "Warrior": { classEmoji: "⚔️", specs: [{ name: "Arms", icon: "🩸" }, { name: "Fury", icon: "🔥" }, { name: "Protection", icon: "🛡️" }] },
  "Paladin": { classEmoji: "🛡️", specs: [{ name: "Holy", icon: "✨" }, { name: "Protection", icon: "🛡️" }, { name: "Retribution", icon: "⚔️" }] },
  "Hunter": { classEmoji: "🏹", specs: [{ name: "Beast Mastery", icon: "🐺" }, { name: "Marksmanship", icon: "🎯" }, { name: "Survival", icon: "🪤" }] },
  "Rogue": { classEmoji: "🗡️", specs: [{ name: "Assassination", icon: "☠️" }, { name: "Outlaw", icon: "🏴‍☠️" }, { name: "Subtlety", icon: "🌑" }] },
  "Priest": { classEmoji: "✨", specs: [{ name: "Discipline", icon: "📜" }, { name: "Holy", icon: "✨" }, { name: "Shadow", icon: "🕳️" }] },
  "Death Knight": { classEmoji: "💀", specs: [{ name: "Blood", icon: "🩸" }, { name: "Frost", icon: "❄️" }, { name: "Unholy", icon: "🦠" }] },
  "Shaman": { classEmoji: "🌩️", specs: [{ name: "Elemental", icon: "🌩️" }, { name: "Enhancement", icon: "⚡" }, { name: "Restoration", icon: "💧" }] },
  "Mage": { classEmoji: "🔥", specs: [{ name: "Arcane", icon: "🌀" }, { name: "Fire", icon: "🔥" }, { name: "Frost", icon: "❄️" }] },
  "Warlock": { classEmoji: "🕯️", specs: [{ name: "Affliction", icon: "🕸️" }, { name: "Demonology", icon: "😈" }, { name: "Destruction", icon: "🔥" }] },
  "Monk": { classEmoji: "🥋", specs: [{ name: "Brewmaster", icon: "🍺" }, { name: "Mistweaver", icon: "🌫️" }, { name: "Windwalker", icon: "💨" }] },
  "Druid": { classEmoji: "🌿", specs: [{ name: "Balance", icon: "🌙" }, { name: "Feral", icon: "🐾" }, { name: "Guardian", icon: "🐻" }, { name: "Restoration", icon: "🌿" }] },
  "Demon Hunter": { classEmoji: "👁️", specs: [{ name: "Havoc", icon: "🟣" }, { name: "Vengeance", icon: "🛡️" }] },
  "Evoker": { classEmoji: "🐉", specs: [{ name: "Devastation", icon: "🔥" }, { name: "Preservation", icon: "💚" }, { name: "Augmentation", icon: "🪄" }] }
};

// =========================
// DOM References
// =========================
const classButtons = document.getElementById("classButtons");
const panel = document.getElementById("panel");

const selectedClassTitle = document.getElementById("selectedClassTitle");
const classBadge = document.getElementById("classBadge");
const panelSubtitle = document.getElementById("panelSubtitle");

const specButtons = document.getElementById("specButtons");

const buildTypeWrap = document.getElementById("buildTypeWrap");
const buildTabs = document.getElementById("buildTabs");

const buildTitle = document.getElementById("buildTitle");
const buildMeta = document.getElementById("buildMeta");
const buildHint = document.getElementById("buildHint");
const buildNotes = document.getElementById("buildNotes");
const talentTreeHint = document.getElementById("talentTreeHint");
const talentTreeWrap = document.getElementById("talentTreeWrap");

const exportString = document.getElementById("exportString");
const copyBtn = document.getElementById("copyBtn");

// =========================
// App State
// =========================
let selectedClass = null;
let selectedSpec = null;
let selectedMode = null; // "aoe" | "raid" | "pvp"

let buildsRoot = null; // always the object like buildsRoot[class][spec][mode]
let buildsMeta = { generatedAt: null, sources: null };
let talentTreesMeta = { generatedAt: null, source: null, specCount: 0 };
let talentTreesSpecs = [];
let talentTreesLoadError = null;

// =========================
// Helpers
// =========================
function getClassColor(buttonEl) {
  const styles = getComputedStyle(buttonEl);
  return (styles.getPropertyValue("--class-color") || "").trim() || "#00bfff";
}

function classThemeKey(className) {
  return String(className || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function setSelectedClassButton(newBtn) {
  const all = classButtons.querySelectorAll(".class-btn");
  all.forEach(btn => {
    btn.classList.remove("selected");
    btn.setAttribute("aria-pressed", "false");
  });
  newBtn.classList.add("selected");
  newBtn.setAttribute("aria-pressed", "true");
}

function clearSelectedSpecButtons() {
  const all = specButtons.querySelectorAll(".spec-btn");
  all.forEach(btn => btn.classList.remove("selected"));
}

function clearSelectedTabs() {
  const all = buildTabs.querySelectorAll(".tab-btn");
  all.forEach(btn => btn.classList.remove("selected"));
}

function resetBuildCard(message) {
  buildTitle.textContent = "Best Talent Build";
  buildMeta.textContent = "";
  buildHint.textContent = message;

  exportString.value = "";
  copyBtn.disabled = true;

  buildNotes.innerHTML = "";
  buildNotes.hidden = true;
}

function normalizeBuild(build) {
  if (!build || typeof build !== "object") return null;
  const core = build.selected && typeof build.selected === "object" ? build.selected : build;

  return {
    title: core.title ?? build.title ?? null,
    source: core.source ?? build.source ?? null,
    updated: core.updated ?? build.updated ?? null,
    exportString: core.exportString ?? build.exportString ?? "",
    notes: Array.isArray(core.notes) ? core.notes : (Array.isArray(build.notes) ? build.notes : [])
  };
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resetTalentTreeCard(message) {
  talentTreeHint.textContent = message;
  talentTreeWrap.innerHTML = "";
  talentTreeWrap.hidden = true;
}

function titleCase(word) {
  return String(word || "").slice(0, 1).toUpperCase() + String(word || "").slice(1).toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nodeInitials(name) {
  const words = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function findTalentSpec(className, specName) {
  if (!Array.isArray(talentTreesSpecs) || talentTreesSpecs.length === 0) return null;
  const classKey = normalizeKey(className);
  const specKey = normalizeKey(specName);

  let match = talentTreesSpecs.find((s) =>
    normalizeKey(s?.className) === classKey && normalizeKey(s?.specName) === specKey
  );
  if (match) return match;

  match = talentTreesSpecs.find((s) => normalizeKey(s?.specName) === specKey);
  return match || null;
}

function renderTalentTree(className, specName) {
  if (!className || !specName) {
    resetTalentTreeCard("Pick a spec to load talent nodes.");
    return;
  }

  if (!Array.isArray(talentTreesSpecs) || talentTreesSpecs.length === 0) {
    const errorMsg = talentTreesLoadError ? `Talent tree data unavailable: ${talentTreesLoadError}` : "Talent tree data is still loading, or unavailable.";
    resetTalentTreeCard(errorMsg);
    return;
  }

  const specPayload = findTalentSpec(className, specName);
  if (!specPayload) {
    resetTalentTreeCard(`No talent tree found for ${className} | ${specName}.`);
    return;
  }

  const nodes = Array.isArray(specPayload.nodes) ? specPayload.nodes : [];
  if (nodes.length === 0) {
    resetTalentTreeCard(`No nodes found for ${className} | ${specName}.`);
    return;
  }

  const classNodes = [];
  const specNodes = [];
  const otherNodes = [];
  for (const node of nodes) {
    const type = String(node?.treeType || "").toLowerCase();
    if (type.includes("class")) classNodes.push(node);
    else if (type.includes("spec")) specNodes.push(node);
    else otherNodes.push(node);
  }

  if (classNodes.length === 0 && specNodes.length === 0 && otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  } else if (otherNodes.length > 0) {
    specNodes.push(...otherNodes);
  }

  function renderTreePane(title, typeNodes) {
    if (!Array.isArray(typeNodes) || typeNodes.length === 0) {
      return `
        <section class="wow-tree-pane">
          <h4 class="wow-tree-title">${escapeHtml(title)}</h4>
          <p class="wow-tree-empty">No nodes in this tree.</p>
        </section>
      `;
    }

    const maxCol = Math.max(...typeNodes.map((n) => Number(n?.col ?? 0)));
    const maxRow = Math.max(...typeNodes.map((n) => Number(n?.row ?? 0)));
    const cols = Math.min(10, Math.max(4, maxCol + 1));
    const rows = Math.min(20, Math.max(6, maxRow + 1));
    const viewWidth = Math.max(1, cols - 1);
    const viewHeight = Math.max(1, rows - 1);

    const byId = new Map();
    for (const node of typeNodes) {
      byId.set(Number(node?.id), node);
    }

    const linkSet = new Set();
    const linkHtml = [];
    for (const node of typeNodes) {
      const toId = Number(node?.id);
      const req = Array.isArray(node?.requiredNodeIds) ? node.requiredNodeIds : [];
      for (const fromId of req) {
        const fromNode = byId.get(Number(fromId));
        if (!fromNode || !Number.isFinite(toId)) continue;
        const key = `${fromId}->${toId}`;
        if (linkSet.has(key)) continue;
        linkSet.add(key);

        const x1 = Math.max(0, Number(fromNode?.col ?? 0));
        const y1 = Math.max(0, Number(fromNode?.row ?? 0));
        const x2 = Math.max(0, Number(node?.col ?? 0));
        const y2 = Math.max(0, Number(node?.row ?? 0));
        linkHtml.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`);
      }
    }

    const nodeHtml = typeNodes
      .sort((a, b) => {
        const rowDelta = Number(a?.row ?? 0) - Number(b?.row ?? 0);
        if (rowDelta !== 0) return rowDelta;
        return Number(a?.col ?? 0) - Number(b?.col ?? 0);
      })
      .map((n) => {
        const row = Math.max(1, Number(n?.row ?? 0) + 1);
        const col = Math.max(1, Number(n?.col ?? 0) + 1);
        const rank = Math.max(1, Number(n?.maxRank ?? 1));
        const name = escapeHtml(n?.name || "Unknown Talent");
        const initials = escapeHtml(nodeInitials(n?.name));
        return `
          <button class="wow-node" type="button" style="grid-row:${row};grid-column:${col}" title="${name} (Max rank: ${rank})">
            <span class="wow-node-core">
              <span class="wow-node-initials">${initials}</span>
            </span>
            <span class="wow-node-rank">${rank}</span>
            <span class="wow-node-label">${name}</span>
          </button>
        `;
      })
      .join("");

    return `
      <section class="wow-tree-pane">
        <h4 class="wow-tree-title">${escapeHtml(title)}</h4>
        <div class="wow-tree-stage">
          <svg class="wow-tree-links" viewBox="0 0 ${viewWidth} ${viewHeight}" preserveAspectRatio="none" aria-hidden="true">
            ${linkHtml.join("")}
          </svg>
          <div class="wow-tree-grid wow-tree-nodes" style="--tree-cols:${cols};--tree-rows:${rows}">
            ${nodeHtml}
          </div>
        </div>
      </section>
    `;
  }

  const blocks = [
    renderTreePane("Class Tree", classNodes),
    renderTreePane("Spec Tree", specNodes)
  ];

  const isLikelyPvpOnly = nodes.length <= 12;
  const treeQualityHint = isLikelyPvpOnly ? " (PvP-sized tree; full spec data may be unavailable in this API response)" : "";
  talentTreeHint.textContent = `${specPayload.className} ${specPayload.specName} | ${nodes.length} nodes | ${talentTreesMeta.source || "unknown source"}${treeQualityHint}`;
  talentTreeWrap.className = "talent-tree-wrap wow-tree-layout";
  talentTreeWrap.innerHTML = blocks.join("");
  talentTreeWrap.hidden = false;
}

function renderSpecButtons(className) {
  const specs = CLASS_DATA[className]?.specs ?? [];
  specButtons.innerHTML = "";

  specs.forEach(spec => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "spec-btn";
    btn.dataset.spec = spec.name;
    btn.innerHTML = `
      <span class="spec-icon" aria-hidden="true">${spec.icon}</span>
      <span>${spec.name}</span>
    `;
    specButtons.appendChild(btn);
  });

  selectedSpec = null;
  selectedMode = null;

  buildTypeWrap.hidden = true;
  clearSelectedTabs();

  resetBuildCard("Pick a spec, then a build type.");
  resetTalentTreeCard("Pick a spec to load talent nodes.");
}

function showPanelForClass(className, classBtnEl) {
  const color = getClassColor(classBtnEl);
  panel.dataset.theme = classThemeKey(className);

  selectedClassTitle.textContent = className;
  panelSubtitle.textContent = "Now click your spec.";

  classBadge.textContent = CLASS_DATA[className]?.classEmoji ?? "❔";
  classBadge.style.borderColor = color;
  classBadge.style.boxShadow = `0 0 16px ${color}`;

  panel.hidden = false;
  renderSpecButtons(className);
}

// =========================
// Data loading (Option A)
// =========================
async function loadBuilds() {
  try {
    const res = await fetch("./builds.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading builds.json`);

    const payload = await res.json();

    // ✅ Option A: support wrapper format OR old format
    if (payload && typeof payload === "object" && payload.builds && typeof payload.builds === "object") {
      buildsRoot = payload.builds;
      buildsMeta.generatedAt = payload.generatedAt ?? null;
      buildsMeta.sources = payload.sources ?? null;
    } else {
      buildsRoot = payload;
      buildsMeta.generatedAt = null;
      buildsMeta.sources = null;
    }

    console.log("builds.json loaded ✅", { wrapper: !!payload.builds, generatedAt: buildsMeta.generatedAt });
  } catch (err) {
    console.error("Failed to load builds.json ❌", err);
    buildsRoot = null;
    buildsMeta.generatedAt = null;
    buildsMeta.sources = null;
  }
}

async function loadTalentTreesMeta() {
  const urls = ["/api/talent-trees", "/talent-trees.json", "./talent-trees.json"];
  const errors = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        errors.push(`${url} -> HTTP ${res.status}`);
        continue;
      }
      const payload = await res.json();
      const specs = Array.isArray(payload?.specs) ? payload.specs : [];
      if (specs.length === 0) {
        errors.push(`${url} -> 0 specs in payload`);
        continue;
      }
      talentTreesSpecs = specs;
      talentTreesLoadError = null;
      talentTreesMeta = {
        generatedAt: payload?.generatedAt ?? null,
        source: payload?.source ?? (url.startsWith("/api/") ? "blizzard-api" : "local-json"),
        specCount: specs.length
      };
      console.log("Talent trees loaded", { url, specs: talentTreesMeta.specCount });
      if (selectedClass && selectedSpec) renderTalentTree(selectedClass, selectedSpec);
      return;
    } catch {
      errors.push(`${url} -> fetch failed`);
      // try the next source
    }
  }
  talentTreesSpecs = [];
  talentTreesLoadError = errors.length > 0 ? errors.join(" | ") : "all sources failed";
  console.warn("Could not load talent tree metadata from API or local file.", { errors });
  if (selectedClass && selectedSpec) renderTalentTree(selectedClass, selectedSpec);
}

function modeLabel(mode) {
  if (mode === "aoe") return "AoE (Mythic+)";
  if (mode === "raid") return "Raid";
  if (mode === "pvp") return "PvP";
  return mode;
}

function showBuildFromData(className, specName, mode) {
  if (!buildsRoot) {
    resetBuildCard("Could not load builds.json. Make sure Live Server is running and builds.json exists.");
    return;
  }

  const rawBuild = buildsRoot?.[className]?.[specName]?.[mode];
  const build = normalizeBuild(rawBuild);

  if (!build) {
    resetBuildCard(`No ${modeLabel(mode)} build found for ${className} — ${specName}. Add it to builds.json.`);
    return;
  }

  buildTitle.textContent = build.title || `${specName} — ${modeLabel(mode)}`;

  const metaParts = [];
  if (build.updated) metaParts.push(`Updated: ${build.updated}`);
  if (buildsMeta.generatedAt) metaParts.push(`Generated: ${buildsMeta.generatedAt}`);

  buildMeta.textContent = metaParts.join(" • ");
  buildHint.textContent = "";

  const notes = build.notes ?? [];
  buildNotes.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
  buildNotes.hidden = notes.length === 0;

  exportString.value = build.exportString || "";
  copyBtn.disabled = !exportString.value.trim();
}

// =========================
// Events
// =========================
classButtons.addEventListener("click", (e) => {
  const btn = e.target.closest(".class-btn");
  if (!btn) return;

  const className = btn.dataset.class;
  if (!className) return;

  selectedClass = className;
  setSelectedClassButton(btn);
  showPanelForClass(className, btn);
});

specButtons.addEventListener("click", (e) => {
  const btn = e.target.closest(".spec-btn");
  if (!btn) return;
  if (!selectedClass) return;

  selectedSpec = btn.dataset.spec;

  clearSelectedSpecButtons();
  btn.classList.add("selected");

  buildTypeWrap.hidden = false;

  selectedMode = "aoe";
  clearSelectedTabs();
  const aoeBtn = buildTabs.querySelector('[data-mode="aoe"]');
  if (aoeBtn) aoeBtn.classList.add("selected");

  showBuildFromData(selectedClass, selectedSpec, selectedMode);
  renderTalentTree(selectedClass, selectedSpec);
});

buildTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  if (!selectedClass || !selectedSpec) return;

  selectedMode = btn.dataset.mode;

  clearSelectedTabs();
  btn.classList.add("selected");

  showBuildFromData(selectedClass, selectedSpec, selectedMode);
});

copyBtn.addEventListener("click", async () => {
  const text = exportString.value.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 900);
  } catch {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => (copyBtn.textContent = "Copy"), 900);
  }
});

// Start
Promise.all([loadBuilds(), loadTalentTreesMeta()]);
