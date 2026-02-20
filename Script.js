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

// =========================
// App State
// =========================
let selectedClass = null;
let selectedSpec = null;
let selectedMode = null; // "aoe" | "raid" | "pvp"

let buildsRoot = null; // always the object like buildsRoot[class][spec][mode]
let buildsMeta = { generatedAt: null, sources: null };

// =========================
// Helpers
// =========================
function getClassColor(buttonEl) {
  const styles = getComputedStyle(buttonEl);
  return (styles.getPropertyValue("--class-color") || "").trim() || "#00bfff";
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

  resetBuildCard("Pick a spec, then a build type.");
}

function showPanelForClass(className, classBtnEl) {
  const color = getClassColor(classBtnEl);

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
  metaParts.push(`Source: ${build.source || "Unknown"}`);
  metaParts.push(`Updated: ${build.updated || "Unknown"}`);
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
loadBuilds();
