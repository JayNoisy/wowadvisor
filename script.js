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

const exportString = document.getElementById("exportString");
const copyBtn = document.getElementById("copyBtn");
const talentBuilderWrap = document.getElementById("talentBuilderWrap");
const talentBuilderTitle = document.getElementById("talentBuilderTitle");
const talentBuilderHint = document.getElementById("talentBuilderHint");
const builderToolbar = document.getElementById("builderToolbar");
const builderPoints = document.getElementById("builderPoints");
const builderResetBtn = document.getElementById("builderResetBtn");
const talentTreeGrid = document.getElementById("talentTreeGrid");

// =========================
// App State
// =========================
let selectedClass = null;
let selectedSpec = null;
let selectedMode = null; // "aoe" | "raid" | "pvp"

let buildsRoot = null; // always the object like buildsRoot[class][spec][mode]
let buildsMeta = { generatedAt: null, sources: null };
let talentTreesRoot = null; // keyed by "Class|||Spec"
let talentAllocations = {}; // keyed by node id
let talentTreesLoadedCount = 0;

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
  resetTalentBuilder();

  resetBuildCard("Pick a spec, then a build type.");
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

function modeLabel(mode) {
  if (mode === "aoe") return "AoE (Mythic+)";
  if (mode === "raid") return "Raid";
  if (mode === "pvp") return "PvP";
  return mode;
}

function talentTreeKey(className, specName) {
  return `${className}|||${specName}`;
}

function normalizeTreeNode(rawNode, idx) {
  if (!rawNode || typeof rawNode !== "object") return null;
  const nodeId = Number(rawNode.id ?? rawNode.nodeId ?? idx + 1);
  const maxRank = Math.max(1, Number(rawNode.maxRanks ?? rawNode.maxRank ?? 1) || 1);
  const row = Math.max(0, Number(rawNode.row ?? rawNode.posY ?? rawNode.y ?? 0) || 0);
  const col = Math.max(0, Number(rawNode.col ?? rawNode.column ?? rawNode.posX ?? rawNode.x ?? 0) || 0);
  const name = String(rawNode.name ?? rawNode.spellName ?? `Talent ${nodeId}`);
  const treeType = String(rawNode.treeType ?? rawNode.type ?? "spec");

  return { id: nodeId, name, row, col, maxRank, treeType };
}

function normalizeTalentTrees(payload) {
  const out = {};
  if (!payload || typeof payload !== "object") return out;

  const rawSpecs = Array.isArray(payload.specs) ? payload.specs : [];
  for (const spec of rawSpecs) {
    if (!spec || typeof spec !== "object") continue;
    const className = String(spec.className || "").trim();
    const specName = String(spec.specName || "").trim();
    if (!className || !specName) continue;

    const rawNodes = Array.isArray(spec.nodes) ? spec.nodes : [];
    const nodes = rawNodes
      .map((n, i) => normalizeTreeNode(n, i))
      .filter(Boolean);

    out[talentTreeKey(className, specName)] = {
      className,
      specName,
      nodes
    };
  }

  return out;
}

function getActiveTree() {
  if (!selectedClass || !selectedSpec) return null;
  return talentTreesRoot?.[talentTreeKey(selectedClass, selectedSpec)] ?? null;
}

function pointsSpent(tree) {
  if (!tree || !Array.isArray(tree.nodes)) return 0;
  return tree.nodes.reduce((sum, n) => sum + (talentAllocations[n.id] || 0), 0);
}

function updateBuilderPoints(tree) {
  const total = pointsSpent(tree);
  builderPoints.textContent = `Points spent: ${total}`;
}

function renderTalentTreeNodes(tree) {
  const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
  talentTreeGrid.innerHTML = "";

  if (nodes.length === 0) {
    talentBuilderHint.textContent = "Talent tree data exists but has no nodes.";
    talentBuilderHint.hidden = false;
    builderToolbar.hidden = true;
    return;
  }

  const maxRow = Math.max(...nodes.map((n) => n.row), 0) + 1;
  const maxCol = Math.max(...nodes.map((n) => n.col), 0) + 1;
  talentTreeGrid.style.setProperty("--tree-rows", String(maxRow));
  talentTreeGrid.style.setProperty("--tree-cols", String(Math.max(6, maxCol)));

  for (const node of nodes) {
    const spent = talentAllocations[node.id] || 0;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "talent-node";
    item.style.gridRow = String(node.row + 1);
    item.style.gridColumn = String(node.col + 1);
    item.dataset.nodeId = String(node.id);
    item.innerHTML = `
      <span class="talent-node-name">${node.name}</span>
      <span class="talent-node-rank">${spent}/${node.maxRank}</span>
    `;
    item.setAttribute("aria-label", `${node.name} ${spent} of ${node.maxRank}`);

    item.addEventListener("click", () => {
      const current = talentAllocations[node.id] || 0;
      talentAllocations[node.id] = current >= node.maxRank ? 0 : current + 1;
      renderTalentTreeNodes(tree);
      updateBuilderPoints(tree);
    });

    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const current = talentAllocations[node.id] || 0;
      talentAllocations[node.id] = Math.max(0, current - 1);
      renderTalentTreeNodes(tree);
      updateBuilderPoints(tree);
    });

    talentTreeGrid.appendChild(item);
  }
}

function resetTalentBuilder() {
  talentBuilderWrap.hidden = true;
  talentBuilderTitle.textContent = "Talent Builder";
  talentBuilderHint.hidden = false;
  talentBuilderHint.textContent = "Talent tree not loaded for this spec yet.";
  builderToolbar.hidden = true;
  talentTreeGrid.innerHTML = "";
  talentAllocations = {};
}

function showTalentBuilder(className, specName) {
  const tree = talentTreesRoot?.[talentTreeKey(className, specName)] ?? null;
  talentBuilderWrap.hidden = false;
  talentBuilderTitle.textContent = `${specName} Talent Builder`;

  if (!tree) {
    talentBuilderHint.hidden = false;
    if (talentTreesLoadedCount === 0) {
      talentBuilderHint.textContent =
        "No talent tree data loaded yet. Run the Update Builds workflow to generate talent-trees.json.";
    } else {
      talentBuilderHint.textContent = "No local talent tree data for this spec yet.";
    }
    builderToolbar.hidden = true;
    talentTreeGrid.innerHTML = "";
    talentAllocations = {};
    return;
  }

  talentBuilderHint.hidden = true;
  builderToolbar.hidden = false;
  talentAllocations = {};
  renderTalentTreeNodes(tree);
  updateBuilderPoints(tree);
}

async function loadTalentTrees() {
  try {
    const res = await fetch("./talent-trees.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading talent-trees.json`);
    const payload = await res.json();
    talentTreesRoot = normalizeTalentTrees(payload);
    talentTreesLoadedCount = Object.keys(talentTreesRoot).length;
    console.log("talent-trees.json loaded", { specs: Object.keys(talentTreesRoot).length });
  } catch (err) {
    console.error("Failed to load talent-trees.json", err);
    talentTreesRoot = {};
    talentTreesLoadedCount = 0;
  }
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

  showTalentBuilder(selectedClass, selectedSpec);
  showBuildFromData(selectedClass, selectedSpec, selectedMode);
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

builderResetBtn.addEventListener("click", () => {
  const tree = getActiveTree();
  if (!tree) return;
  talentAllocations = {};
  renderTalentTreeNodes(tree);
  updateBuilderPoints(tree);
});

// Start
loadBuilds();
loadTalentTrees();
