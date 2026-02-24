// =========================
// UI Spec Definitions
// =========================
const CLASS_DATA = {
  "Warrior": { classIcon: "assets/class-icons/warrior.png", specs: [{ name: "Arms", icon: "🩸" }, { name: "Fury", icon: "🔥" }, { name: "Protection", icon: "🛡️" }] },
  "Paladin": { classIcon: "assets/class-icons/paladin.png", specs: [{ name: "Holy", icon: "✨" }, { name: "Protection", icon: "🛡️" }, { name: "Retribution", icon: "⚔️" }] },
  "Hunter": { classIcon: "assets/class-icons/hunter.png", specs: [{ name: "Beast Mastery", icon: "🐺" }, { name: "Marksmanship", icon: "🎯" }, { name: "Survival", icon: "🪤" }] },
  "Rogue": { classIcon: "assets/class-icons/rogue.png", specs: [{ name: "Assassination", icon: "☠️" }, { name: "Outlaw", icon: "🏴‍☠️" }, { name: "Subtlety", icon: "🌑" }] },
  "Priest": { classIcon: "assets/class-icons/priest.png", specs: [{ name: "Discipline", icon: "📜" }, { name: "Holy", icon: "✨" }, { name: "Shadow", icon: "🕳️" }] },
  "Death Knight": { classIcon: "assets/class-icons/death-knight.png", specs: [{ name: "Blood", icon: "🩸" }, { name: "Frost", icon: "❄️" }, { name: "Unholy", icon: "🦠" }] },
  "Shaman": { classIcon: "assets/class-icons/shaman.png", specs: [{ name: "Elemental", icon: "🌩️" }, { name: "Enhancement", icon: "⚡" }, { name: "Restoration", icon: "💧" }] },
  "Mage": { classIcon: "assets/class-icons/mage.png", specs: [{ name: "Arcane", icon: "🌀" }, { name: "Fire", icon: "🔥" }, { name: "Frost", icon: "❄️" }] },
  "Warlock": { classIcon: "assets/class-icons/warlock.png", specs: [{ name: "Affliction", icon: "🕸️" }, { name: "Demonology", icon: "😈" }, { name: "Destruction", icon: "🔥" }] },
  "Monk": { classIcon: "assets/class-icons/monk.png", specs: [{ name: "Brewmaster", icon: "🍺" }, { name: "Mistweaver", icon: "🌫️" }, { name: "Windwalker", icon: "💨" }] },
  "Druid": { classIcon: "assets/class-icons/druid.png", specs: [{ name: "Balance", icon: "🌙" }, { name: "Feral", icon: "🐾" }, { name: "Guardian", icon: "🐻" }, { name: "Restoration", icon: "🌿" }] },
  "Demon Hunter": { classIcon: "assets/class-icons/demon-hunter.png", specs: [{ name: "Havoc", icon: "🟣" }, { name: "Vengeance", icon: "🛡️" }] },
  "Evoker": { classIcon: "assets/class-icons/evoker.png", specs: [{ name: "Devastation", icon: "🔥" }, { name: "Preservation", icon: "💚" }, { name: "Augmentation", icon: "🪄" }] }
};

const STAT_PRIORITIES = {
  "Warrior": {
    "Arms": ["Critical Strike", "Mastery", "Haste", "Versatility"],
    "Fury": ["Haste", "Mastery", "Critical Strike", "Versatility"],
    "Protection": ["Haste", "Versatility", "Critical Strike", "Mastery"]
  },
  "Paladin": {
    "Holy": ["Haste", "Critical Strike", "Mastery", "Versatility"],
    "Protection": ["Haste", "Mastery", "Versatility", "Critical Strike"],
    "Retribution": ["Mastery", "Haste", "Critical Strike", "Versatility"]
  },
  "Hunter": {
    "Beast Mastery": ["Critical Strike", "Mastery", "Haste", "Versatility"],
    "Marksmanship": ["Mastery", "Critical Strike", "Haste", "Versatility"],
    "Survival": ["Haste", "Critical Strike", "Mastery", "Versatility"]
  },
  "Rogue": {
    "Assassination": ["Mastery", "Haste", "Critical Strike", "Versatility"],
    "Outlaw": ["Haste", "Versatility", "Critical Strike", "Mastery"],
    "Subtlety": ["Mastery", "Critical Strike", "Versatility", "Haste"]
  },
  "Priest": {
    "Discipline": ["Haste", "Critical Strike", "Mastery", "Versatility"],
    "Holy": ["Mastery", "Critical Strike", "Haste", "Versatility"],
    "Shadow": ["Haste", "Mastery", "Critical Strike", "Versatility"]
  },
  "Death Knight": {
    "Blood": ["Haste", "Versatility", "Mastery", "Critical Strike"],
    "Frost": ["Mastery", "Haste", "Critical Strike", "Versatility"],
    "Unholy": ["Haste", "Mastery", "Critical Strike", "Versatility"]
  },
  "Shaman": {
    "Elemental": ["Mastery", "Haste", "Critical Strike", "Versatility"],
    "Enhancement": ["Haste", "Mastery", "Critical Strike", "Versatility"],
    "Restoration": ["Mastery", "Haste", "Critical Strike", "Versatility"]
  },
  "Mage": {
    "Arcane": ["Mastery", "Haste", "Versatility", "Critical Strike"],
    "Fire": ["Critical Strike", "Haste", "Mastery", "Versatility"],
    "Frost": ["Mastery", "Haste", "Critical Strike", "Versatility"]
  },
  "Warlock": {
    "Affliction": ["Haste", "Mastery", "Critical Strike", "Versatility"],
    "Demonology": ["Haste", "Mastery", "Critical Strike", "Versatility"],
    "Destruction": ["Haste", "Critical Strike", "Mastery", "Versatility"]
  },
  "Monk": {
    "Brewmaster": ["Versatility", "Haste", "Critical Strike", "Mastery"],
    "Mistweaver": ["Critical Strike", "Mastery", "Haste", "Versatility"],
    "Windwalker": ["Mastery", "Haste", "Critical Strike", "Versatility"]
  },
  "Druid": {
    "Balance": ["Mastery", "Haste", "Critical Strike", "Versatility"],
    "Feral": ["Mastery", "Critical Strike", "Haste", "Versatility"],
    "Guardian": ["Versatility", "Haste", "Mastery", "Critical Strike"],
    "Restoration": ["Mastery", "Haste", "Critical Strike", "Versatility"]
  },
  "Demon Hunter": {
    "Havoc": ["Critical Strike", "Mastery", "Versatility", "Haste"],
    "Vengeance": ["Haste", "Versatility", "Critical Strike", "Mastery"]
  },
  "Evoker": {
    "Devastation": ["Mastery", "Haste", "Critical Strike", "Versatility"],
    "Preservation": ["Mastery", "Critical Strike", "Haste", "Versatility"],
    "Augmentation": ["Mastery", "Haste", "Critical Strike", "Versatility"]
  }
};

const M_PLUS_AFFIXES = [
  "Fortified",
  "Tyrannical",
  "Bolstering",
  "Bursting",
  "Raging",
  "Sanguine",
  "Spiteful",
  "Volcanic",
  "Storming",
  "Entangling",
  "Afflicted",
  "Incorporeal"
];

// =========================
// DOM References
// =========================
const classButtons = document.getElementById("classButtons");
const panel = document.getElementById("panel");

const selectedClassTitle = document.getElementById("selectedClassTitle");
const classBadge = document.getElementById("classBadge");
const panelSubtitle = document.getElementById("panelSubtitle");
const backToClassesBtn = document.getElementById("backToClassesBtn");

const specButtons = document.getElementById("specButtons");

const buildTypeWrap = document.getElementById("buildTypeWrap");
const buildTabs = document.getElementById("buildTabs");
const mythicContextCard = document.getElementById("mythicContextCard");
const mythicContextHint = document.getElementById("mythicContextHint");
const mythicContextNotes = document.getElementById("mythicContextNotes");
const mythicKeyLevelInput = document.getElementById("mythicKeyLevel");
const mythicAffixList = document.getElementById("mythicAffixList");
const mythicQuickFortifiedBtn = document.getElementById("mythicQuickFortifiedBtn");
const mythicQuickTyrannicalBtn = document.getElementById("mythicQuickTyrannicalBtn");
const mythicClearAffixesBtn = document.getElementById("mythicClearAffixesBtn");
const rotationToggleBtn = document.getElementById("rotationToggleBtn");
const rotationHelperPanel = document.getElementById("rotationHelperPanel");
const rotationTitle = document.getElementById("rotationTitle");
const rotationHint = document.getElementById("rotationHint");
const rotationSteps = document.getElementById("rotationSteps");

const buildTitle = document.getElementById("buildTitle");
const buildMeta = document.getElementById("buildMeta");
const buildHint = document.getElementById("buildHint");
const buildNotes = document.getElementById("buildNotes");
const statHint = document.getElementById("statHint");
const statPills = document.getElementById("statPills");
const statExplain = document.getElementById("statExplain");
const talentTreeHint = document.getElementById("talentTreeHint");
const talentTreeWrap = document.getElementById("talentTreeWrap");
const talentSystem = document.getElementById("talent-system");
const talentTree = document.getElementById("talentTree");
const pointsSpent = document.getElementById("pointsSpent");
const maxPoints = document.getElementById("maxPoints");
const talentTooltip = document.getElementById("talentTooltip");
const talentNodeInspector = document.getElementById("talentNodeInspector");
const talentNodeHint = document.getElementById("talentNodeHint");
const talentNodeBody = document.getElementById("talentNodeBody");

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
let talentNodeIndex = new Map();
let activeBuild = null;
let rotationPanelOpen = false;
const mythicContext = {
  keyLevel: 10,
  affixes: new Set(["Fortified"])
};

function injectTalentTreeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #talent-system {
      position: relative;
      background-color: #151515;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 20px;
      overflow: auto;
      box-shadow: inset 0 0 20px #000;
    }
    .talent-tree-lines {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 0;
    }
    .talent-tree-lines line {
      stroke: #444;
      stroke-width: 2;
      transition: stroke 0.3s ease;
    }
    .talent-tree-lines line.active {
      stroke: #ffd100;
    }
    #talentTree {
      display: grid;
      position: relative;
      z-index: 1;
      gap: 30px 15px;
      justify-content: center;
    }
    .talent-node {
      width: 42px;
      height: 42px;
      background-size: cover;
      background-position: center;
      border: 2px solid #444;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      box-shadow: 0 0 5px #000;
      transition: transform 0.1s, border-color 0.2s;
    }
    .talent-node:hover { transform: scale(1.1); z-index: 10; border-color: #fff; }
    .talent-node.available { border-color: #00ff00; box-shadow: 0 0 8px #00ff00; }
    .talent-node.maxed { border-color: #ffd100; box-shadow: 0 0 8px #ffd100; }
    .talent-node.unavailable { filter: grayscale(100%) brightness(0.4); border-color: #333; }
    .points-badge {
      position: absolute; bottom: -8px; right: -8px;
      background: #000; color: #fff; font-size: 10px; padding: 1px 3px;
      border-radius: 3px; border: 1px solid #555;
    }
  `;
  document.head.appendChild(style);
}
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

function ensureElementTopVisible(el, topPadding = 18) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - topPadding;
  window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
}

function ensureSpecExpansionVisible() {
  // Keep the class panel anchored near the top once spec content expands.
  ensureElementTopVisible(panel, 14);
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

function clearSelectedClassButtons() {
  const all = classButtons.querySelectorAll(".class-btn");
  all.forEach(btn => {
    btn.classList.remove("selected");
    btn.setAttribute("aria-pressed", "false");
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMythicContext() {
  return {
    keyLevel: clamp(Number(mythicContext.keyLevel) || 10, 2, 35),
    affixes: Array.from(mythicContext.affixes)
  };
}

function setMythicAffixes(nextAffixes) {
  mythicContext.affixes = new Set(
    (Array.isArray(nextAffixes) ? nextAffixes : [])
      .map((a) => String(a || "").trim())
      .filter((a) => M_PLUS_AFFIXES.includes(a))
  );
}

function rankAdjustedStats(basePriorities, bonusByStat) {
  const deduped = [];
  for (const stat of basePriorities) {
    const clean = String(stat || "").trim();
    if (!clean || deduped.includes(clean)) continue;
    deduped.push(clean);
  }
  const weights = new Map();
  const len = deduped.length;
  deduped.forEach((stat, idx) => {
    const baseWeight = (len - idx) * 100;
    const bonus = Number(bonusByStat?.[stat] || 0);
    weights.set(stat, baseWeight + bonus);
  });
  return deduped.sort((a, b) => {
    const w = (weights.get(b) || 0) - (weights.get(a) || 0);
    if (w !== 0) return w;
    return deduped.indexOf(a) - deduped.indexOf(b);
  });
}

function getMythicAdaptation(className, specName, mode, priorities) {
  const basePriorities = Array.isArray(priorities) ? [...priorities] : [];
  const noChange = {
    priorities: basePriorities,
    summary: "",
    notes: []
  };
  if (mode !== "aoe" || basePriorities.length === 0) return noChange;

  const context = getMythicContext();
  const affixSet = new Set(context.affixes);
  const archetype = getSpecArchetype(className, specName);
  const statBonus = {};
  const notes = [];
  const addBonus = (stat, amount) => {
    statBonus[stat] = (statBonus[stat] || 0) + amount;
  };

  if (context.keyLevel >= 12) {
    addBonus("Versatility", 22);
    notes.push(`+${context.keyLevel} key: survivability and consistency are weighted higher.`);
    if (archetype === "tank" || archetype === "healer") {
      addBonus("Versatility", 12);
      addBonus("Haste", 8);
      notes.push("Tank/healer profile: extra value to defensive throughput and response speed.");
    }
  }

  if (affixSet.has("Fortified")) {
    addBonus("Haste", 18);
    addBonus("Mastery", 10);
    notes.push("Fortified: favors repeatable trash throughput and pull-to-pull cooldown cadence.");
  }

  if (affixSet.has("Tyrannical")) {
    addBonus("Mastery", 16);
    addBonus("Critical Strike", 10);
    notes.push("Tyrannical: shifts value toward priority-target and boss damage.");
  }

  if (affixSet.has("Raging") || affixSet.has("Bolstering")) {
    addBonus("Versatility", 10);
    addBonus("Critical Strike", 6);
    notes.push("Raging/Bolstering: rewards controlled kill windows and safer damage profiles.");
  }

  if (affixSet.has("Bursting") || affixSet.has("Spiteful") || affixSet.has("Sanguine")) {
    addBonus("Versatility", 12);
    addBonus("Haste", 6);
    notes.push("Bursting/Spiteful/Sanguine: favors stability and quick defensive reactions.");
  }

  if (affixSet.has("Afflicted") || affixSet.has("Incorporeal") || affixSet.has("Entangling")) {
    addBonus("Haste", 10);
    notes.push("Utility-heavy affixes: higher haste for faster globals and cleaner utility coverage.");
  }

  if (affixSet.has("Volcanic") || affixSet.has("Storming")) {
    addBonus("Versatility", 8);
    notes.push("Movement pressure affixes: versatility gains value from safer uptime.");
  }

  const affixLabel = context.affixes.length > 0 ? context.affixes.join(", ") : "No affixes selected";
  return {
    priorities: rankAdjustedStats(basePriorities, statBonus),
    summary: `M+ context: +${context.keyLevel} | ${affixLabel}`,
    notes
  };
}

function getMythicBuildNotes(mode) {
  if (mode !== "aoe") return [];
  const context = getMythicContext();
  const affixSet = new Set(context.affixes);
  const notes = [];
  if (context.keyLevel >= 12) {
    notes.push("High key reminder: route defensives and externals before damage cooldown optimization.");
  }
  if (affixSet.has("Tyrannical")) {
    notes.push("Tyrannical reminder: hold major cooldowns for bosses and dangerous mini-boss pulls.");
  }
  if (affixSet.has("Fortified")) {
    notes.push("Fortified reminder: frontload AoE cooldowns on large trash pulls.");
  }
  if (affixSet.has("Bursting")) {
    notes.push("Bursting reminder: stagger kill timing to avoid lethal stack spikes.");
  }
  return notes;
}

function getMythicRotationNotes(mode) {
  if (mode !== "aoe") return [];
  const context = getMythicContext();
  const affixSet = new Set(context.affixes);
  const notes = [`Mythic+ context: key +${context.keyLevel}.`];
  if (affixSet.has("Tyrannical")) {
    notes.push("Tyrannical: avoid sending every major cooldown on low-risk trash.");
  }
  if (affixSet.has("Fortified")) {
    notes.push("Fortified: chain offensive cooldowns early in large pulls to shorten danger windows.");
  }
  if (affixSet.has("Spiteful") || affixSet.has("Storming") || affixSet.has("Volcanic")) {
    notes.push("Movement-heavy affixes: pre-position before burst windows to protect uptime.");
  }
  return notes;
}

function renderMythicContextNotes(items) {
  if (!mythicContextNotes) return;
  const notes = Array.isArray(items) ? items.filter(Boolean) : [];
  mythicContextNotes.innerHTML = notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
  mythicContextNotes.hidden = notes.length === 0;
}

function renderMythicAffixButtons() {
  if (!mythicAffixList) return;
  mythicAffixList.innerHTML = M_PLUS_AFFIXES.map((affix) => {
    const active = mythicContext.affixes.has(affix) ? " selected" : "";
    return `<button type="button" class="mythic-affix-btn${active}" data-affix="${escapeHtml(affix)}">${escapeHtml(affix)}</button>`;
  }).join("");
}

function refreshRecommendationsForContext() {
  if (!selectedClass || !selectedSpec || !selectedMode) return;
  showBuildFromData(selectedClass, selectedSpec, selectedMode);
  renderStatPriorities(selectedClass, selectedSpec, selectedMode);
  renderRotationHelper(selectedClass, selectedSpec, selectedMode);
}

function renderMythicContextCard() {
  if (!mythicContextCard) return;
  const shouldShow = Boolean(selectedClass && selectedSpec && selectedMode === "aoe");
  mythicContextCard.hidden = !shouldShow;
  if (!shouldShow) return;

  mythicContext.keyLevel = clamp(Number(mythicKeyLevelInput?.value) || mythicContext.keyLevel || 10, 2, 35);
  if (mythicKeyLevelInput) mythicKeyLevelInput.value = String(mythicContext.keyLevel);

  const context = getMythicContext();
  if (mythicContextHint) {
    const affixText = context.affixes.length > 0 ? context.affixes.join(", ") : "No affixes selected";
    mythicContextHint.textContent = `Adjusting AoE recommendations for +${context.keyLevel} | ${affixText}.`;
  }
  renderMythicAffixButtons();
}

function resetBuildCard(message) {
  buildTitle.textContent = "Best Talent Build";
  buildMeta.textContent = "";
  buildHint.textContent = message;

  exportString.value = "";
  copyBtn.disabled = true;

  buildNotes.innerHTML = "";
  buildNotes.hidden = true;
  activeBuild = null;
}

function resetStatPrioritiesCard(message) {
  statHint.textContent = message;
  statPills.innerHTML = "";
  statPills.hidden = true;
  statExplain.innerHTML = "";
  statExplain.hidden = true;
}

function resetRotationHelper(message) {
  rotationPanelOpen = false;
  if (rotationToggleBtn) {
    rotationToggleBtn.hidden = true;
    rotationToggleBtn.textContent = "Show Rotation Helper";
    rotationToggleBtn.setAttribute("aria-expanded", "false");
  }
  if (rotationHelperPanel) rotationHelperPanel.hidden = true;
  if (rotationTitle) rotationTitle.textContent = "Rotation Helper";
  if (rotationHint) rotationHint.textContent = message;
  if (rotationSteps) rotationSteps.innerHTML = "";
}

function normalizeBuild(build) {
  if (!build || typeof build !== "object") return null;
  const core = build.selected && typeof build.selected === "object" ? build.selected : build;

  return {
    title: core.title ?? build.title ?? null,
    source: core.source ?? build.source ?? null,
    updated: core.updated ?? build.updated ?? null,
    exportString: core.exportString ?? build.exportString ?? "",
    notes: Array.isArray(core.notes) ? core.notes : (Array.isArray(build.notes) ? build.notes : []),
    confidence: core.confidence ?? build.confidence ?? null,
    confidenceScore: core.confidenceScore ?? build.confidenceScore ?? null,
    confidenceRationale: core.confidenceRationale ?? build.confidenceRationale ?? null,
    sampleSize: core.sampleSize ?? build.sampleSize ?? null,
    agreementCount: core.agreementCount ?? build.agreementCount ?? null,
    selectedTalents: core.selectedTalents ?? build.selectedTalents ?? null
  };
}

function slugifyTalentName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSelectedTalentSelection(selectedTalents) {
  const slugRanks = new Map();
  const idRanks = new Map();
  const mappedGroups = { class: [], spec: [], hero: [] };
  const rawGroups = selectedTalents && typeof selectedTalents === "object" ? selectedTalents : {};
  const allGroups = {
    class: Array.isArray(rawGroups.class) ? rawGroups.class : [],
    spec: Array.isArray(rawGroups.spec) ? rawGroups.spec : [],
    hero: Array.isArray(rawGroups.hero) ? rawGroups.hero : []
  };

  for (const key of Object.keys(allGroups)) {
    for (const t of allGroups[key]) {
      const slug = slugifyTalentName(t?.slug);
      const rank = Math.max(1, Number(t?.rank) || 1);
      const id = Number(t?.id);
      mappedGroups[key].push({ slug: slug || "", rank, id: Number.isFinite(id) ? id : null });
      if (slug) slugRanks.set(slug, rank);
      if (Number.isFinite(id)) idRanks.set(id, rank);
    }
  }

  return {
    slugRanks,
    idRanks,
    groups: mappedGroups,
    totalCount: mappedGroups.class.length + mappedGroups.spec.length + mappedGroups.hero.length
  };
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

let talentData = [];
let totalPointsSpent = 0;
let maxTotalPoints = 10;
const nodeState = {};

function buildInteractiveTalentData(specPayload) {
  const { classPane, specPane, nodes } = resolveTalentPanes(specPayload);
  const classNodes = Array.isArray(classPane?.nodes) ? classPane.nodes : [];
  const specNodes = Array.isArray(specPane?.nodes) ? specPane.nodes : [];
  const classMaxCol = Math.max(0, ...classNodes.map((n) => Number(n?.col ?? 0)));
  const specColOffset = classNodes.length > 0 && specNodes.length > 0 ? classMaxCol + 3 : 0;

  const combinedNodes = [];
  classNodes.forEach((n) => combinedNodes.push({ pane: "class", colOffset: 0, node: n }));
  specNodes.forEach((n) => combinedNodes.push({ pane: "spec", colOffset: specColOffset, node: n }));
  if (combinedNodes.length === 0) {
    const flatNodes = Array.isArray(nodes) ? nodes : [];
    flatNodes.forEach((n) => combinedNodes.push({ pane: "spec", colOffset: 0, node: n }));
  }

  const idMap = new Map();
  combinedNodes.forEach(({ pane, node }) => {
    const nodeId = Number(node?.id);
    if (!Number.isFinite(nodeId)) return;
    idMap.set(nodeId, `${pane}-${nodeId}`);
  });

  const talents = combinedNodes
    .map(({ pane, colOffset, node }) => {
      const nodeId = Number(node?.id);
      if (!Number.isFinite(nodeId)) return null;
      const entries = Array.isArray(node?.entries) ? node.entries : [];
      const primary = entries[0] || null;
      const maxPoints = Math.max(1, Number(primary?.maxRank ?? node?.maxRank ?? 1) || 1);
      const requiredNodeIds = Array.isArray(node?.requiredNodeIds)
        ? node.requiredNodeIds.map(Number).filter(Number.isFinite)
        : [];
      const reqNodes = requiredNodeIds
        .map((id) => idMap.get(id))
        .filter(Boolean);
      const primaryIconFromName = iconUrlFromIconName(primary?.iconName);
      const nodeIconFromName = iconUrlFromIconName(node?.iconName);
      const iconUrl = (
        (typeof primary?.iconUrl === "string" && primary.iconUrl) ||
        (typeof node?.iconUrl === "string" && node.iconUrl) ||
        primaryIconFromName ||
        nodeIconFromName ||
        iconUrlForSpellName(node?.name) ||
        "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"
      );
      const descBase = pane === "class" ? "Class talent node." : "Spec talent node.";
      const desc = `${descBase} ${String(node?.nodeKind || "active")} | Max rank ${maxPoints}.`;
      return {
        id: `${pane}-${nodeId}`,
        row: Math.max(1, Number(node?.row ?? 0) + 1),
        col: Math.max(1, Number(node?.col ?? 0) + 1 + colOffset),
        name: String(node?.name || `Talent ${nodeId}`),
        desc,
        maxPoints,
        reqNode: reqNodes[0] || null,
        reqNodes,
        reqPointsTotal: 0,
        icon: iconUrl
      };
    })
    .filter(Boolean);

  const totalNodeRanks = talents.reduce((sum, t) => sum + Math.max(1, Number(t?.maxPoints || 1)), 0);
  const derivedMax = Math.max(10, Math.min(80, totalNodeRanks));
  return { talents, maxTotalPoints: derivedMax };
}

function initTalentTree() {
  if (!talentTree || !talentSystem) return;
  talentTree.innerHTML = "";
  
  const oldSvg = talentSystem.querySelector(".talent-tree-lines");
  if (oldSvg) oldSvg.remove();

  totalPointsSpent = 0;
  Object.keys(nodeState).forEach((key) => delete nodeState[key]);
  if (!Array.isArray(talentData) || talentData.length === 0) {
    updateTreeVisuals();
    return;
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "talent-tree-lines");
  talentSystem.insertBefore(svg, talentTree);

  const maxCol = Math.max(1, ...talentData.map((t) => Number(t?.col ?? 1)));
  const maxRow = Math.max(1, ...talentData.map((t) => Number(t?.row ?? 1)));
  talentTree.style.gridTemplateColumns = `repeat(${maxCol}, 50px)`;
  talentTree.style.gridTemplateRows = `repeat(${maxRow}, 50px)`;

  talentData.forEach((talent) => {
    nodeState[talent.id] = 0;

    const nodeEl = document.createElement("div");
    nodeEl.className = "talent-node";
    nodeEl.id = `node-${talent.id}`;
    nodeEl.style.gridRow = talent.row;
    nodeEl.style.gridColumn = talent.col;
    nodeEl.style.backgroundImage = `url(${talent.icon})`;

    const badge = document.createElement("div");
    badge.className = "points-badge";
    badge.id = `badge-${talent.id}`;
    badge.innerText = `0/${talent.maxPoints}`;

    nodeEl.appendChild(badge);
    talentTree.appendChild(nodeEl);

    nodeEl.addEventListener("click", (e) => {
      e.preventDefault();
      addPoint(talent.id);
    });
    nodeEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      removePoint(talent.id);
    });

    nodeEl.addEventListener("mousemove", (e) => showTooltip(e, talent));
    nodeEl.addEventListener("mouseleave", hideTooltip);
  });

  const drawLines = () => {
    svg.style.width = `${talentTree.scrollWidth}px`;
    svg.style.height = `${talentTree.scrollHeight}px`;
    svg.innerHTML = "";

    talentData.forEach((talent) => {
      const toNode = document.getElementById(`node-${talent.id}`);
      if (!toNode) return;

      const toX = toNode.offsetLeft + toNode.offsetWidth / 2;
      const toY = toNode.offsetTop + toNode.offsetHeight / 2;

      (talent.reqNodes || []).forEach((reqId) => {
        const fromNode = document.getElementById(`node-${reqId}`);
        if (!fromNode) return;

        const fromX = fromNode.offsetLeft + fromNode.offsetWidth / 2;
        const fromY = fromNode.offsetTop + fromNode.offsetHeight / 2;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const lineId = `line-${reqId.replace(/[^a-zA-Z0-9-_]/g, '')}-to-${talent.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;
        line.setAttribute("id", lineId);
        line.setAttribute("x1", fromX);
        line.setAttribute("y1", fromY);
        line.setAttribute("x2", toX);
        line.setAttribute("y2", toY);
        svg.appendChild(line);
      });
    });
    updateTreeVisuals();
  };

  // Draw lines after layout
  requestAnimationFrame(drawLines);
  window.addEventListener('resize', drawLines);

  updateTreeVisuals();
}

function addPoint(id) {
  const talent = talentData.find((t) => t.id === id);
  if (!talent || !canAddPoint(talent)) return;

  nodeState[id] += 1;
  totalPointsSpent += 1;
  updateTreeVisuals();
}

function removePoint(id) {
  const talent = talentData.find((t) => t.id === id);
  if (!talent || !canRemovePoint(talent)) return;

  nodeState[id] -= 1;
  totalPointsSpent -= 1;
  updateTreeVisuals();
}

function canAddPoint(talent) {
  if (totalPointsSpent >= maxTotalPoints) return false;
  if (nodeState[talent.id] >= talent.maxPoints) return false;
  if (talent.reqPointsTotal > totalPointsSpent) return false;
  const reqNodes = Array.isArray(talent.reqNodes) && talent.reqNodes.length > 0
    ? talent.reqNodes
    : (talent.reqNode ? [talent.reqNode] : []);
  if (reqNodes.length > 0) {
    const unlockedByReq = reqNodes.some((reqId) => Number(nodeState[reqId] || 0) > 0);
    if (!unlockedByReq) return false;
  }
  return true;
}

function canRemovePoint(talent) {
  if (nodeState[talent.id] <= 0) return false;

  const dependents = talentData.filter((t) => {
    if (Array.isArray(t.reqNodes) && t.reqNodes.length > 0) return t.reqNodes.includes(talent.id);
    return t.reqNode === talent.id;
  });
  for (const dep of dependents) {
    if (nodeState[dep.id] <= 0) continue;
    const depReqNodes = Array.isArray(dep.reqNodes) && dep.reqNodes.length > 0
      ? dep.reqNodes
      : (dep.reqNode ? [dep.reqNode] : []);
    if (depReqNodes.length === 0) continue;
    const stillSatisfied = depReqNodes.some((reqId) => {
      if (reqId === talent.id) return nodeState[talent.id] - 1 > 0;
      return Number(nodeState[reqId] || 0) > 0;
    });
    if (!stillSatisfied) return false;
  }
  return true;
}

function updateTreeVisuals() {
  if (pointsSpent) pointsSpent.innerText = totalPointsSpent;
  if (maxPoints) maxPoints.innerText = maxTotalPoints;

  talentData.forEach((talent) => {
    const el = document.getElementById(`node-${talent.id}`);
    const badge = document.getElementById(`badge-${talent.id}`);
    if (!el || !badge) return;
    badge.innerText = `${nodeState[talent.id]}/${talent.maxPoints}`;
    
    el.classList.remove("unavailable", "maxed", "available");

    if (nodeState[talent.id] >= talent.maxPoints) {
      el.classList.add("maxed");
    } else if (canAddPoint(talent)) {
      el.classList.add("available");
    } else if (nodeState[talent.id] === 0) {
      el.classList.add("unavailable");
    }

    // Update lines
    (talent.reqNodes || []).forEach(reqId => {
      const lineId = `line-${reqId.replace(/[^a-zA-Z0-9-_]/g, '')}-to-${talent.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;
      const line = document.getElementById(lineId);
      if (line) {
        // Line is active if the parent node has at least 1 point
        if (nodeState[reqId] > 0) {
          line.classList.add('active');
        } else {
          line.classList.remove('active');
        }
      }
    }
  });
}

function showTooltip(e, talent) {
  if (!talentTooltip) return;
  talentTooltip.style.display = "block";
  talentTooltip.style.left = `${e.pageX + 15}px`;
  talentTooltip.style.top = `${e.pageY + 15}px`;

  let requirementsHtml = "";
  if (talent.reqPointsTotal > totalPointsSpent) {
    requirementsHtml += `<p class="req-error">Requires ${talent.reqPointsTotal} points in tree</p>`;
  }
  const reqNodes = Array.isArray(talent.reqNodes) && talent.reqNodes.length > 0
    ? talent.reqNodes
    : (talent.reqNode ? [talent.reqNode] : []);
  if (reqNodes.length > 0) {
    const hasReq = reqNodes.some((reqId) => Number(nodeState[reqId] || 0) > 0);
    if (!hasReq) {
      const reqTalentNames = reqNodes
        .map((reqId) => talentData.find((t) => t.id === reqId)?.name || reqId)
        .slice(0, 3);
      requirementsHtml += `<p class="req-error">Requires points in ${escapeHtml(reqTalentNames.join(" or "))}</p>`;
    }
  }

  talentTooltip.innerHTML = `
    <h4>${escapeHtml(talent.name)}</h4>
    <p>Rank ${nodeState[talent.id]}/${talent.maxPoints}</p>
    ${requirementsHtml}
    <p style="margin-top: 8px;">${escapeHtml(talent.desc)}</p>
  `;
}

function hideTooltip() {
  if (!talentTooltip) return;
  talentTooltip.style.display = "none";
}

function resetTalentTreeCard(message) {
  talentTreeHint.textContent = message;
  talentTreeHint.hidden = false;
  talentTreeWrap.hidden = false;
  if (talentSystem) talentSystem.hidden = true;
  hideTooltip();
  talentNodeIndex = new Map();
  talentNodeInspector.hidden = true;
  talentNodeHint.textContent = "Click a talent node to inspect it.";
  talentNodeBody.innerHTML = "";
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

function splitNodesByTreeType(nodes) {
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
  return { classNodes, specNodes };
}

function buildFallbackPane(key, label, nodes) {
  const list = Array.isArray(nodes) ? nodes : [];
  const edges = [];
  for (const node of list) {
    const req = Array.isArray(node?.requiredNodeIds) ? node.requiredNodeIds : [];
    const toNodeId = Number(node?.id);
    for (const fromNodeId of req) {
      if (!Number.isFinite(toNodeId) || !Number.isFinite(Number(fromNodeId))) continue;
      edges.push({ fromNodeId: Number(fromNodeId), toNodeId });
    }
  }
  return { key, label, nodes: list, edges };
}

function resolveTalentPanes(specPayload) {
  const nodes = Array.isArray(specPayload?.nodes) ? specPayload.nodes : [];
  if (specPayload?.trees?.class && specPayload?.trees?.spec) {
    return {
      classPane: {
        key: "class",
        label: specPayload.trees.class.label || "Class Tree",
        nodes: Array.isArray(specPayload.trees.class.nodes) ? specPayload.trees.class.nodes : [],
        edges: Array.isArray(specPayload.trees.class.edges) ? specPayload.trees.class.edges : []
      },
      specPane: {
        key: "spec",
        label: specPayload.trees.spec.label || "Spec Tree",
        nodes: Array.isArray(specPayload.trees.spec.nodes) ? specPayload.trees.spec.nodes : [],
        edges: Array.isArray(specPayload.trees.spec.edges) ? specPayload.trees.spec.edges : []
      },
      nodes
    };
  }

  const { classNodes, specNodes } = splitNodesByTreeType(nodes);
  return {
    classPane: buildFallbackPane("class", "Class Tree", classNodes),
    specPane: buildFallbackPane("spec", "Spec Tree", specNodes),
    nodes
  };
}

function resolveStatPriorities(className, specName, mode) {
  const modeBuild = buildsRoot?.[className]?.[specName]?.[mode] || null;
  const rawBuild = buildsRoot?.[className]?.[specName] || null;

  if (Array.isArray(modeBuild?.statPriority) && modeBuild.statPriority.length > 0) {
    return modeBuild.statPriority;
  }
  if (Array.isArray(modeBuild?.statPriorities) && modeBuild.statPriorities.length > 0) {
    return modeBuild.statPriorities;
  }

  const sp = rawBuild?.statPriorities;
  if (sp && typeof sp === "object") {
    if (Array.isArray(sp?.[mode]) && sp[mode].length > 0) return sp[mode];
    if (Array.isArray(sp?.default) && sp.default.length > 0) return sp.default;
  }

  const fallback = STAT_PRIORITIES?.[className]?.[specName];
  return Array.isArray(fallback) ? fallback : [];
}

function getSpecArchetype(className, specName) {
  const map = {
    "Warrior": { "Arms": "melee-burst", "Fury": "melee-haste", "Protection": "tank" },
    "Paladin": { "Holy": "healer", "Protection": "tank", "Retribution": "melee-burst" },
    "Hunter": { "Beast Mastery": "ranged-pet", "Marksmanship": "ranged-burst", "Survival": "melee-haste" },
    "Rogue": { "Assassination": "dot-melee", "Outlaw": "melee-haste", "Subtlety": "melee-burst" },
    "Priest": { "Discipline": "healer", "Holy": "healer", "Shadow": "dot-caster" },
    "Death Knight": { "Blood": "tank", "Frost": "melee-burst", "Unholy": "dot-melee" },
    "Shaman": { "Elemental": "caster", "Enhancement": "melee-haste", "Restoration": "healer" },
    "Mage": { "Arcane": "caster", "Fire": "crit-caster", "Frost": "caster" },
    "Warlock": { "Affliction": "dot-caster", "Demonology": "caster", "Destruction": "crit-caster" },
    "Monk": { "Brewmaster": "tank", "Mistweaver": "healer", "Windwalker": "melee-burst" },
    "Druid": { "Balance": "caster", "Feral": "dot-melee", "Guardian": "tank", "Restoration": "healer" },
    "Demon Hunter": { "Havoc": "melee-burst", "Vengeance": "tank" },
    "Evoker": { "Devastation": "caster", "Preservation": "healer", "Augmentation": "support-caster" }
  };
  return map?.[className]?.[specName] || "generic";
}

function getStatExplanation(className, specName, stat, mode) {
  const statKey = String(stat || "").toLowerCase();
  const archetype = getSpecArchetype(className, specName);
  const byArch = {
    "tank": {
      "haste": "Improves resource generation and cooldown flow, smoothing mitigation uptime.",
      "versatility": "Gives flat damage reduction and damage gain, making it the safest all-around defensive stat.",
      "mastery": "Strengthens spec-specific mitigation value, especially in sustained damage windows.",
      "critical strike": "Adds offensive pressure and can improve proc-based durability effects."
    },
    "healer": {
      "haste": "Increases cast frequency and HoT/DoT tick rate, helping react faster to incoming damage.",
      "critical strike": "Boosts burst healing moments and improves clutch recovery windows.",
      "mastery": "Amplifies core healing profile for your spec’s specialty throughput.",
      "versatility": "Provides stable healing and survivability with no conditionals."
    },
    "caster": {
      "haste": "Speeds casts and periodic effects, increasing overall throughput and rotational fluidity.",
      "mastery": "Amplifies your spec’s primary damage pattern, making major abilities hit harder.",
      "critical strike": "Improves burst potential and scales well with high-impact spells.",
      "versatility": "Adds consistent damage and survivability when other stats are close."
    },
    "support-caster": {
      "haste": "Improves buff cadence and rotational tempo, enabling stronger team uptime windows.",
      "mastery": "Scales your core support/damage amplifiers effectively for group value.",
      "critical strike": "Adds extra burst potential during coordinated cooldown windows.",
      "versatility": "Reliable throughput and defense for predictable performance."
    },
    "crit-caster": {
      "critical strike": "High value because your kit converts crits into major burst or extra effect chains.",
      "haste": "Keeps casts flowing to capitalize on proc windows and maintain pressure.",
      "mastery": "Strongly scales core spell packages and sustained priority-target damage.",
      "versatility": "Steady fallback throughput and durability."
    },
    "dot-caster": {
      "haste": "Increases periodic tick frequency and reduces ramp friction for DoT-centric gameplay.",
      "mastery": "Boosts sustained pressure from core periodic or shadow/flame effects.",
      "critical strike": "Improves spike damage on key casts layered into DoT windows.",
      "versatility": "Consistent gain to both offense and defense."
    },
    "melee-haste": {
      "haste": "Improves attack/resource tempo so your rotation stays smooth and ability-dense.",
      "mastery": "Boosts core melee toolkit damage and scales your primary spenders.",
      "critical strike": "Adds burst and improves finisher impact during cooldowns.",
      "versatility": "Reliable all-purpose stat for damage and toughness."
    },
    "melee-burst": {
      "mastery": "Typically scales your strongest burst abilities and cooldown windows.",
      "critical strike": "Enables higher spike damage and better kill pressure.",
      "haste": "Improves rotational speed and resource flow between burst windows.",
      "versatility": "Stable throughput with bonus survivability in difficult content."
    },
    "dot-melee": {
      "mastery": "Amplifies bleed/poison or sustained profile damage where your spec gains most value.",
      "critical strike": "Increases pressure spikes and finisher impact.",
      "haste": "Improves energy/rune pacing to keep effects and uptime stable.",
      "versatility": "Consistent fallback throughput and defense."
    },
    "ranged-pet": {
      "critical strike": "Strong burst contribution for both player and pet damage events.",
      "mastery": "Scales signature pet-focused damage patterns effectively.",
      "haste": "Smooths cast and focus flow for cleaner ability chaining.",
      "versatility": "Reliable all-round gain, especially for difficult pulls."
    },
    "ranged-burst": {
      "mastery": "Scales high-impact windows and signature shots very efficiently.",
      "critical strike": "Adds burst consistency for priority-target damage.",
      "haste": "Improves cast cadence and global throughput.",
      "versatility": "Steady output and extra survivability."
    },
    "generic": {
      "haste": "Improves rotational speed and ability cadence.",
      "critical strike": "Raises burst potential and high-roll outcomes.",
      "mastery": "Scales your spec’s signature damage/healing profile.",
      "versatility": "Provides stable offense and defense with no conditions."
    }
  };

  const text = byArch?.[archetype]?.[statKey] || byArch.generic[statKey] || "Solid stat for consistent performance in most content.";
  const modeNote = mode === "pvp"
    ? " In PvP, versatility and defensive value often move up based on comp and matchup."
    : mode === "raid"
      ? " In raid, priority-target consistency and planned cooldown windows matter most."
      : " In Mythic+, value shifts with pull size and damage profile.";
  return `${text}${modeNote}`;
}

const SPELL_ICON_MAP = {
  "Rend": "ability_gouge",
  "Colossus Smash": "warrior_colossussmash",
  "Warbreaker": "ability_warrior_warbreaker",
  "Mortal Strike": "ability_warrior_savageblow",
  "Overpower": "ability_meleedamage",
  "Execute": "inv_sword_48",
  "Bladestorm": "ability_warrior_bladestorm",
  "Enrage": "spell_shadow_unholyfrenzy",
  "Rampage": "ability_warrior_rampage",
  "Bloodthirst": "spell_nature_bloodlust",
  "Raging Blow": "ability_warrior_decisivestrike",
  "Whirlwind": "ability_whirlwind",
  "Odyn's Fury": "inv_misc_2h_axe_arcana_d_01",
  "Shield Block": "ability_defend",
  "Ignore Pain": "ability_warrior_ignorepain",
  "Shield Slam": "inv_shield_05",
  "Revenge": "ability_warrior_revenge",
  "Demoralizing Shout": "ability_warrior_warcry",
  "Last Stand": "spell_holy_ashestoashes",
  "Holy Shock": "spell_holy_searinglight",
  "Word of Glory": "inv_helmet_96",
  "Light of Dawn": "spell_paladin_lightofdawn",
  "Crusader Strike": "spell_holy_crusaderstrike",
  "Aura Mastery": "spell_holy_auramastery",
  "Shield of the Righteous": "ability_paladin_shieldofvengeance",
  "Judgment": "spell_holy_righteousfury",
  "Avenger's Shield": "spell_holy_avengersshield",
  "Consecration": "spell_holy_innerfire",
  "Ardent Defender": "spell_holy_ardentdefender",
  "Guardian of Ancient Kings": "spell_paladin_guardianofancientkings",
  "Blade of Justice": "ability_paladin_bladeofjustice",
  "Templar's Verdict": "spell_paladin_templarsverdict",
  "Wake of Ashes": "inv_sword_2h_artifactashbringer_d_01",
  "Final Reckoning": "ability_revendreth_paladin",
  "Avenging Wrath": "spell_holy_avenginewrath",
  "Execution Sentence": "spell_paladin_executionsentence",
  "Divine Storm": "ability_paladin_divinestorm",
  "Divine Toll": "spell_kyrian_divinetoll",
  "Barbed Shot": "ability_hunter_barbedshot",
  "Frenzy": "ability_hunter_frenzy",
  "Kill Command": "ability_hunter_killcommand",
  "Cobra Shot": "ability_hunter_cobrashot",
  "Bestial Wrath": "ability_druid_ferociousbite",
  "Kill Shot": "ability_hunter_assassinate2",
  "Multi-Shot": "ability_upgrademoonglaive",
  "Beast Cleave": "ability_hunter_beastcleave",
  "Aimed Shot": "inv_spear_07",
  "Rapid Fire": "ability_hunter_rapidkilling",
  "Arcane Shot": "ability_impalingbolt",
  "Chimaera Shot": "ability_hunter_chimerashot2",
  "Trueshot": "ability_trueshot",
  "Trick Shots": "ability_hunter_trickshot",
  "Volley": "ability_rogue_quickrecovery",
  "Salvo": "ability_ardenweald_hunter",
  "Serpent Sting": "ability_hunter_quickshot",
  "Raptor Strike": "ability_melee_damage",
  "Mongoose Bite": "ability_hunter_mongoosebite",
  "Wildfire Bomb": "ability_hunter_wildfirebomb",
  "Coordinated Assault": "ability_hunter_harpoondemo",
  "Garrote": "ability_rogue_garrote",
  "Rupture": "ability_rogue_rupture",
  "Mutilate": "ability_rogue_shadowstrikes",
  "Fan of Knives": "ability_rogue_fanofknives",
  "Envenom": "ability_rogue_dualweild",
  "Kingsbane": "inv_knife_1h_artifactgarona_d_01",
  "Deathmark": "ability_rogue_deathmark",
  "Crimson Tempest": "ability_rogue_crimsontempest",
  "Slice and Dice": "ability_rogue_slicedice",
  "Sinister Strike": "spell_shadow_ritualofsacrifice",
  "Pistol Shot": "inv_weapon_rifle_01",
  "Between the Eyes": "ability_rogue_between_the_eyes",
  "Dispatch": "inv_weapon_shortblade_54",
  "Adrenaline Rush": "spell_shadow_shadowworddominate",
  "Roll the Bones": "ability_rogue_rollthebones",
  "Shadow Dance": "ability_rogue_shadowdance",
  "Shadowstrike": "ability_rogue_shadowstrike",
  "Eviscerate": "ability_rogue_eviscerate",
  "Symbols of Death": "ability_rogue_symbolsofdeath",
  "Secret Technique": "ability_rogue_sealedcrate",
  "Atonement": "spell_holy_hopeandgrace",
  "Power Word: Radiance": "spell_priest_power-word",
  "Penance": "spell_holy_penance",
  "Mind Blast": "spell_shadow_unholyfrenzy",
  "Smite": "spell_holy_holysmite",
  "Power Word: Shield": "spell_holy_powerwordshield",
  "Rapture": "spell_holy_rapture",
  "Evangelism": "spell_holy_divineillumination",
  "Holy Word: Serenity": "spell_holy_symbolofhope",
  "Holy Word: Sanctify": "spell_holy_divineprovidence",
  "Prayer of Mending": "spell_holy_prayerofmendingtga",
  "Renew": "spell_holy_renew",
  "Heal": "spell_holy_heal",
  "Flash Heal": "spell_holy_flashheal",
  "Apotheosis": "ability_priest_apotheosis",
  "Divine Hymn": "spell_holy_divinehymn",
  "Vampiric Touch": "spell_holy_stoicism",
  "Shadow Word: Pain": "spell_shadow_shadowwordpain",
  "Devouring Plague": "spell_shadow_blackplague",
  "Void Eruption": "spell_priest_voideruption",
  "Dark Ascension": "spell_priest_darkascension",
  "Shadow Word: Death": "spell_shadow_demonicfortitude",
  "Marrowrend": "ability_deathknight_marrowrend",
  "Bone Shield": "ability_deathknight_boneshield",
  "Death Strike": "spell_deathknight_butcher2",
  "Blood Boil": "spell_deathknight_bloodboil",
  "Heart Strike": "inv_weapon_shortblade_40",
  "Vampiric Blood": "spell_shadow_lifedrain",
  "Icebound Fortitude": "spell_deathknight_iceboundfortitude",
  "Obliterate": "spell_deathknight_obliterate",
  "Frost Strike": "spell_deathknight_froststrike",
  "Glacial Advance": "ability_deathknight_glacialadvance",
  "Howling Blast": "spell_frost_arcticwinds",
  "Pillar of Frost": "ability_deathknight_pillaroffrost",
  "Remorseless Winter": "spell_frost_wizardmark",
  "Virulent Plague": "ability_creature_disease_02",
  "Festering Strike": "spell_deathknight_festering_strike",
  "Scourge Strike": "spell_deathknight_scourgestrike",
  "Death Coil": "spell_shadow_deathcoil",
  "Epidemic": "spell_deathknight_unholyaura",
  "Dark Transformation": "spell_deathknight_darktransformation",
  "Apocalypse": "artifactability_unholydeathknight_apocalypse",
  "Summon Gargoyle": "ability_hunter_pet_bat",
  "Army of the Dead": "spell_deathknight_armyofthedead",
  "Flame Shock": "spell_fire_flameshock",
  "Lava Burst": "spell_shaman_lavaburst",
  "Earth Shock": "spell_nature_earthshock",
  "Elemental Blast": "shaman_talent_elementalblast",
  "Primordial Wave": "ability_skyreach_shaman",
  "Stormkeeper": "spell_shaman_stormkeeper",
  "Lightning Bolt": "spell_nature_lightning",
  "Chain Lightning": "spell_nature_chainlightning",
  "Earthquake": "spell_nature_earthquake",
  "Stormstrike": "spell_holy_sealofmight",
  "Lava Lash": "ability_shaman_lavalash",
  "Maelstrom Weapon": "spell_shaman_maelstromweapon",
  "Doom Winds": "inv_misc_stormheimstormwolf_wolf",
  "Ascendance": "spell_shaman_ascendance",
  "Crash Lightning": "ability_shaman_crashlightning",
  "Riptide": "spell_nature_riptide",
  "Healing Wave": "spell_nature_healingwavegreater",
  "Healing Surge": "spell_nature_healingsurge",
  "Healing Rain": "spell_nature_giftofthewaterspirit",
  "Chain Heal": "spell_nature_healingwavegreater",
  "Cloudburst Totem": "ability_shaman_cloudbursttotem",
  "Spirit Link": "spell_shaman_spiritlink",
  "Arcane Blast": "spell_arcane_blast",
  "Arcane Barrage": "ability_mage_arcanebarrage",
  "Touch of the Magi": "inv_misc_orb_05",
  "Arcane Surge": "ability_mage_arcanesurge",
  "Arcane Missiles": "spell_nature_starfall",
  "Hot Streak": "ability_mage_hotstreak",
  "Pyroblast": "spell_fire_fireball02",
  "Fire Blast": "spell_fire_fireball",
  "Phoenix Flames": "artifactability_firemage_phoenixsflames",
  "Combustion": "spell_fire_sealoffire",
  "Fireball": "spell_fire_flamebolt",
  "Scorch": "spell_fire_soulburn",
  "Flamestrike": "spell_fire_selfdestruct",
  "Frozen Orb": "spell_frost_frozenorb",
  "Fingers of Frost": "ability_mage_wintersgrasp",
  "Ice Lance": "spell_frost_frostblast",
  "Flurry": "spell_frost_freezingbreath",
  "Glacial Spike": "ability_mage_glacialspike",
  "Icy Veins": "spell_frost_coldhearted",
  "Blizzard": "spell_frost_icestorm",
  "Cone of Cold": "spell_frost_glacier",
  "Comet Storm": "spell_mage_cometstorm",
  "Agony": "spell_shadow_curseofsargeras",
  "Corruption": "spell_shadow_abominationexplosion",
  "Unstable Affliction": "spell_shadow_unstableaffliction_3",
  "Malefic Rapture": "spell_warlock_maleficrapture",
  "Soul Rot": "ability_maldraxxus_warlock",
  "Darkglare": "inv_ability_warlock_soulswap",
  "Drain Soul": "spell_shadow_haunting",
  "Shadow Bolt": "spell_shadow_shadowbolt",
  "Hand of Gul'dan": "ability_warlock_handofguldan",
  "Call Dreadstalkers": "ability_warlock_calldreadstalkers",
  "Demonbolt": "spell_shadow_demonform",
  "Summon Demonic Tyrant": "ability_warlock_summonwrathguard",
  "Immolate": "spell_fire_immolation",
  "Incinerate": "spell_fire_burnout",
  "Conflagrate": "spell_fire_fireball",
  "Chaos Bolt": "ability_warlock_chaosbolt",
  "Havoc": "ability_warlock_baneofhavoc",
  "Summon Infernal": "spell_shadow_summoninfernal",
  "Rain of Fire": "spell_shadow_rainoffire",
  "Keg Smash": "achievement_brewery_2",
  "Tiger Palm": "ability_monk_tigerpalm",
  "Purifying Brew": "ability_monk_purifyingbrew",
  "Shuffle": "ability_monk_shuffle",
  "Blackout Kick": "ability_monk_roundhousekick",
  "Breath of Fire": "ability_monk_breathoffire",
  "Celestial Brew": "ability_monk_celestialbrew",
  "Fortifying Brew": "ability_monk_fortifyingale_new",
  "Renewing Mist": "ability_monk_renewingmists",
  "Vivify": "ability_monk_vivify",
  "Enveloping Mist": "ability_monk_envelopingmist",
  "Essence Font": "ability_monk_essencefont",
  "Chi Burst": "spell_arcane_arcanetorrent",
  "Thunder Focus Tea": "ability_monk_thunderfocustea",
  "Revival": "ability_monk_revival",
  "Rising Sun Kick": "ability_monk_risingsunkick",
  "Fists of Fury": "monk_ability_fistsoffury",
  "Spinning Crane Kick": "ability_monk_cranekick_new",
  "Strike of the Windlord": "ability_monk_strikeofthewindlord",
  "Touch of Death": "ability_monk_touchofdeath",
  "Whirling Dragon Punch": "ability_monk_hurricanestrike",
  "Hit Combo": "ability_monk_hitcombo",
  "Moonfire": "spell_nature_starfall",
  "Sunfire": "ability_mage_firestarter",
  "Wrath": "spell_nature_abolishmagic",
  "Starfire": "spell_arcane_starfire",
  "Starsurge": "spell_druid_starsurge",
  "Celestial Alignment": "spell_druid_celestialalignment",
  "Incarnation": "spell_druid_incarnation",
  "Fury of Elune": "ability_druid_eclipseorange",
  "Starfall": "spell_magic_lesserinvisibilty",
  "Rake": "ability_druid_disembowel",
  "Rip": "ability_ghoulfrenzy",
  "Shred": "spell_shadow_vampiricaura",
  "Brutal Slash": "ability_druid_brutalslash",
  "Ferocious Bite": "ability_druid_ferociousbite",
  "Tiger's Fury": "ability_mount_jungletiger",
  "Berserk": "ability_druid_berserk",
  "Ironfur": "ability_druid_ironfur",
  "Mangle": "ability_druid_mangle2",
  "Thrash": "spell_druid_thrash",
  "Frenzied Regeneration": "ability_bullrush",
  "Barkskin": "spell_nature_stoneclawtotem",
  "Survival Instincts": "ability_druid_tigersroar",
  "Lifebloom": "inv_misc_herb_felblossom",
  "Swiftmend": "inv_relics_idolofrejuvenation",
  "Regrowth": "spell_nature_resistnature",
  "Wild Growth": "ability_druid_flourish",
  "Efflorescence": "inv_misc_herb_evergreenmoss",
  "Tranquility": "spell_nature_tranquility",
  "Immolation Aura": "ability_demonhunter_immolation_aura",
  "Chaos Strike": "ability_demonhunter_chaosstrike",
  "Annihilation": "ability_demonhunter_annihilation",
  "Blade Dance": "ability_demonhunter_bladedance",
  "Death Sweep": "ability_demonhunter_deathsweep",
  "Eye Beam": "ability_demonhunter_eyebeam",
  "Metamorphosis": "spell_shadow_demonform",
  "Throw Glaive": "ability_demonhunter_throwglaive",
  "Demon Spikes": "ability_demonhunter_demonspikes",
  "Fracture": "ability_demonhunter_fracture",
  "Shear": "ability_demonhunter_shear",
  "Soul Fragments": "ability_demonhunter_soulcleave2",
  "Soul Cleave": "ability_demonhunter_soulcleave",
  "Sigils": "ability_demonhunter_sigilexhaustion",
  "Fiery Brand": "ability_demonhunter_feldevastation",
  "Fire Breath": "ability_evoker_firebreath",
  "Eternity Surge": "ability_evoker_eternitysurge",
  "Disintegrate": "ability_evoker_disintegrateblue",
  "Living Flame": "ability_evoker_livingflame",
  "Dragonrage": "ability_evoker_dragonrage",
  "Pyre": "ability_evoker_pyre",
  "Echo": "ability_evoker_echo",
  "Verdant Embrace": "ability_evoker_verdantembrace",
  "Dream Breath": "ability_evoker_dreambreath",
  "Reversion": "ability_evoker_reversion",
  "Spiritbloom": "ability_evoker_spiritbloom",
  "Rewind": "ability_evoker_rewind",
  "Ebon Might": "ability_evoker_ebonmight",
  "Prescience": "ability_evoker_prescience",
  "Breath of Eons": "ability_evoker_breathofeons"
};

const SORTED_SPELL_NAMES = Object.keys(SPELL_ICON_MAP).sort((a, b) => b.length - a.length);

function findSpellNameInStep(stepText) {
  const text = String(stepText || "").toLowerCase();
  if (!text) return null;
  for (const spellName of SORTED_SPELL_NAMES) {
    if (text.includes(spellName.toLowerCase())) return spellName;
  }
  return null;
}

function iconUrlForSpellName(spellName) {
  const iconName = SPELL_ICON_MAP[spellName];
  if (!iconName) return null;
  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
}

function iconUrlFromIconName(iconNameLike) {
  const iconName = String(iconNameLike || "").trim().toLowerCase();
  if (!iconName) return null;
  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
}

function getRotationSteps(className, specName, mode) {
  const ROTATION_PRIORITY_LIBRARY = {
    "Warrior": {
      "Arms": {
        default: [
          "Keep Rend active on your main target.",
          "Use Colossus Smash or Warbreaker on cooldown.",
          "Use Mortal Strike on cooldown for core pressure.",
          "Use Overpower to empower your next Mortal Strike.",
          "Use Execute as top priority in execute range."
        ],
        aoe: [
          "Open with Warbreaker for cleave setup.",
          "Keep Rend applied to priority targets.",
          "Use Bladestorm in stacked pulls.",
          "Spend globals on Mortal Strike and Cleave windows.",
          "Use Execute to finish priority mobs quickly."
        ]
      },
      "Fury": {
        default: [
          "Maintain Enrage uptime at all times.",
          "Use Rampage to trigger or refresh Enrage.",
          "Use Bloodthirst on cooldown to feed Rage and sustain.",
          "Use Raging Blow as a primary filler.",
          "Use Execute when available and in execute windows."
        ],
        aoe: [
          "Activate Whirlwind before core single-target spenders for cleave.",
          "Use Odyn's Fury in large pull windows.",
          "Use Rampage to keep Enrage rolling.",
          "Use Bloodthirst and Raging Blow as Rage builders.",
          "Use Execute on dangerous low-health targets."
        ]
      },
      "Protection": {
        default: [
          "Keep Shield Block active for physical hits.",
          "Spend Rage on Ignore Pain to smooth incoming damage.",
          "Use Shield Slam on cooldown for Rage generation.",
          "Use Revenge as filler or when free procs appear.",
          "Use Demoralizing Shout and Last Stand proactively."
        ]
      }
    },
    "Paladin": {
      "Holy": {
        default: [
          "Keep Beacon target management correct before damage events.",
          "Use Holy Shock on cooldown for Holy Power generation.",
          "Spend Holy Power with Word of Glory or Light of Dawn as needed.",
          "Use Crusader Strike to generate Holy Power during low healing load.",
          "Rotate Aura Mastery and major cooldowns for raid damage spikes."
        ]
      },
      "Protection": {
        default: [
          "Maintain Shield of the Righteous uptime for mitigation.",
          "Use Judgment and Avenger's Shield on cooldown.",
          "Spend Holy Power to sustain mitigation first, damage second.",
          "Use Consecration uptime for defensive value.",
          "Cycle Ardent Defender and Guardian of Ancient Kings proactively."
        ]
      },
      "Retribution": {
        default: [
          "Build Holy Power with Blade of Justice and Judgment.",
          "Spend Holy Power with Templar's Verdict on single target.",
          "Use Wake of Ashes on cooldown for burst generation.",
          "Use Final Reckoning and Avenging Wrath in aligned burst windows.",
          "Use Execution Sentence in planned damage windows."
        ],
        aoe: [
          "Use Divine Storm as your Holy Power spender in cleave.",
          "Use Wake of Ashes and Divine Toll in stacked pulls.",
          "Build with Blade of Justice and Judgment between spenders.",
          "Align Avenging Wrath with large pull size.",
          "Keep priority-target pressure with Templar's Verdict when needed."
        ]
      }
    },
    "Hunter": {
      "Beast Mastery": {
        default: [
          "Keep Barbed Shot stacks and Frenzy uptime stable.",
          "Use Kill Command on cooldown.",
          "Spend Focus with Cobra Shot without starving Kill Command.",
          "Use Bestial Wrath on cooldown and align with trinkets.",
          "Use Kill Shot as high priority in execute."
        ],
        aoe: [
          "Keep Beast Cleave active via Multi-Shot in packs.",
          "Use Kill Command and Barbed Shot on cooldown.",
          "Use Bestial Wrath with pull size peaks.",
          "Spend excess Focus with Cobra Shot.",
          "Use Kill Shot to remove dangerous targets."
        ]
      },
      "Marksmanship": {
        default: [
          "Use Aimed Shot charges efficiently; do not overcap.",
          "Use Rapid Fire on cooldown.",
          "Use Arcane Shot or Chimaera Shot as Focus filler.",
          "Use Trueshot in planned burst windows.",
          "Use Kill Shot as a top execute priority."
        ],
        aoe: [
          "Use Multi-Shot and Trick Shots setup before Aimed Shot or Rapid Fire.",
          "Use Volley and Salvo during stacked pulls.",
          "Spend Aimed Shot charges into Trick Shots windows.",
          "Use Rapid Fire on cooldown.",
          "Use Kill Shot on priority low-health targets."
        ]
      },
      "Survival": {
        default: [
          "Maintain Serpent Sting if your build uses it.",
          "Use Kill Command and Raptor Strike or Mongoose Bite as core loop.",
          "Spend bombs on cooldown with Wildfire Bomb.",
          "Use Coordinated Assault in burst windows.",
          "Use Kill Shot as execute priority."
        ]
      }
    },
    "Rogue": {
      "Assassination": {
        default: [
          "Maintain Garrote and Rupture uptime on your target.",
          "Build Combo Points with Mutilate or Fan of Knives.",
          "Spend with Envenom while avoiding energy overcap.",
          "Use Kingsbane and Deathmark in stacked burst windows.",
          "Refresh bleeds cleanly before high-buff phases."
        ],
        aoe: [
          "Maintain Garrote and Rupture on priority enemies.",
          "Build with Fan of Knives in multi-target packs.",
          "Spend with Envenom while preserving bleed uptime.",
          "Use Deathmark and Kingsbane in coordinated pulls.",
          "Use Crimson Tempest if your build calls for it."
        ]
      },
      "Outlaw": {
        default: [
          "Keep Slice and Dice active.",
          "Build Combo Points with Sinister Strike and Pistol Shot procs.",
          "Spend with Between the Eyes and Dispatch at efficient points.",
          "Use Adrenaline Rush on cooldown.",
          "Use Roll the Bones and play around strong buff combinations."
        ]
      },
      "Subtlety": {
        default: [
          "Pool Combo Points and Energy before Shadow Dance windows.",
          "Use Shadowstrike inside Dance windows.",
          "Spend with Eviscerate in buffed burst windows.",
          "Maintain Rupture if your build uses it.",
          "Align Symbols of Death and Secret Technique with Dance."
        ]
      }
    },
    "Priest": {
      "Discipline": {
        default: [
          "Apply Atonement ahead of incoming damage windows.",
          "Use Power Word: Radiance to expand Atonement coverage.",
          "Deal damage with Penance, Mind Blast, and Smite for healing transfer.",
          "Use Power Word: Shield and Rapture proactively.",
          "Use Evangelism or Barrier for large planned damage events."
        ]
      },
      "Holy": {
        default: [
          "Use Holy Word: Serenity for high-priority single-target healing.",
          "Use Holy Word: Sanctify for grouped healing windows.",
          "Use Prayer of Mending and Renew efficiently between spikes.",
          "Cast Heal or Flash Heal based on urgency and mana plan.",
          "Use Apotheosis and Divine Hymn for heavy raid damage."
        ]
      },
      "Shadow": {
        default: [
          "Keep Vampiric Touch and Shadow Word: Pain active.",
          "Use Mind Blast and Devouring Plague on cooldown cadence.",
          "Spend Insanity without capping.",
          "Use Void Eruption or Dark Ascension in burst windows.",
          "Use Shadow Word: Death in execute and movement moments."
        ],
        aoe: [
          "Maintain Vampiric Touch spread on relevant targets.",
          "Use Mind Sear or your AoE spender package for packs.",
          "Use Void Eruption or Dark Ascension in pull spikes.",
          "Spend Insanity aggressively during multi-target windows.",
          "Prioritize dangerous targets with Devouring Plague."
        ]
      }
    },
    "Death Knight": {
      "Blood": {
        default: [
          "Use Marrowrend to maintain Bone Shield stacks.",
          "Use Death Strike after meaningful damage intake.",
          "Use Blood Boil on cooldown for threat and utility.",
          "Spend runes efficiently with Heart Strike.",
          "Cycle Vampiric Blood and Icebound Fortitude proactively."
        ]
      },
      "Frost": {
        default: [
          "Use Obliterate as your primary rune spender in single target.",
          "Spend Runic Power with Frost Strike or Glacial Advance by build.",
          "Use Howling Blast to maintain Fever and consume procs.",
          "Use Pillar of Frost in planned burst windows.",
          "Use Remorseless Winter on cooldown in melee uptime."
        ],
        aoe: [
          "Use Remorseless Winter and Howling Blast on pull.",
          "Spend Runic Power with Glacial Advance or Frost Strike by build.",
          "Use Obliterate with cleave synergies active.",
          "Align Pillar of Frost to large pull timings.",
          "Keep diseases active while maintaining rune flow."
        ]
      },
      "Unholy": {
        default: [
          "Keep Virulent Plague active.",
          "Use Festering Strike to apply wounds, then burst with Scourge Strike.",
          "Spend Runic Power with Death Coil or Epidemic by target count.",
          "Use Dark Transformation and Apocalypse in burst windows.",
          "Use Summon Gargoyle and Army of the Dead in planned cooldown phases."
        ],
        aoe: [
          "Use Epidemic as your primary Runic Power spender in packs.",
          "Spread disease uptime before heavy spend phases.",
          "Maintain wound generation and burst cycles.",
          "Use Dark Transformation and Apocalypse on big pulls.",
          "Align major cooldowns with priority pack timing."
        ]
      }
    },
    "Shaman": {
      "Elemental": {
        default: [
          "Keep Flame Shock active on priority targets.",
          "Use Lava Burst on cooldown and proc windows.",
          "Use Earth Shock or Elemental Blast as your Maelstrom spender.",
          "Use Primordial Wave and Stormkeeper in burst timing.",
          "Use Lightning Bolt filler while managing movement."
        ],
        aoe: [
          "Spread Flame Shock before your AoE spend windows.",
          "Use Chain Lightning as core filler in multi-target pulls.",
          "Spend Maelstrom with Earthquake in stacked packs.",
          "Use Stormkeeper and Primordial Wave for burst AoE.",
          "Prioritize dangerous targets with Lava Burst procs."
        ]
      },
      "Enhancement": {
        default: [
          "Maintain Flame Shock if your build uses it.",
          "Use Stormstrike and Lava Lash on cooldown cadence.",
          "Spend Maelstrom Weapon stacks efficiently with Lightning Bolt or Elemental Blast.",
          "Use Doom Winds or Ascendance in burst windows.",
          "Keep Crash Lightning active when cleave value is present."
        ],
        aoe: [
          "Use Crash Lightning early to enable cleave.",
          "Spend Maelstrom stacks with Chain Lightning in packs.",
          "Use Stormstrike and Lava Lash to maintain tempo.",
          "Use Primordial Wave and burst cooldowns on pull peaks.",
          "Keep Flame Shock spread where practical."
        ]
      },
      "Restoration": {
        default: [
          "Keep Riptide rolling on likely damage targets.",
          "Use Healing Wave or Healing Surge by urgency and mana plan.",
          "Use Healing Rain and Chain Heal for group damage windows.",
          "Use Cloudburst Totem and Spirit Link proactively.",
          "Weave Lava Burst or Lightning Bolt during stable periods."
        ]
      }
    },
    "Mage": {
      "Arcane": {
        default: [
          "Manage mana around burn and conserve phases.",
          "Use Arcane Blast as core builder and spender setup.",
          "Use Arcane Barrage at planned clear points.",
          "Use Touch of the Magi and Arcane Surge in burst windows.",
          "Use Arcane Missiles on high-value proc opportunities."
        ]
      },
      "Fire": {
        default: [
          "Chain Hot Streak procs into instant Pyroblast casts.",
          "Use Fire Blast to convert Heating Up into Hot Streak.",
          "Use Phoenix Flames strategically for proc and AoE value.",
          "Use Combustion in planned burst windows.",
          "Keep filler casts flowing with Fireball or Scorch."
        ],
        aoe: [
          "Use Flamestrike for Hot Streak spenders in stacked packs.",
          "Leverage Phoenix Flames for cleave and proc generation.",
          "Use Combustion on large pulls with cooldown alignment.",
          "Maintain instant-cast flow while moving.",
          "Prioritize dangerous targets with Pyroblast or execute tools."
        ]
      },
      "Frost": {
        default: [
          "Use Frozen Orb on cooldown for proc generation.",
          "Spend Fingers of Frost with Ice Lance promptly.",
          "Use Flurry to shatter high-value casts.",
          "Use Glacial Spike windows cleanly if talented.",
          "Use Icy Veins in planned burst phases."
        ],
        aoe: [
          "Open with Frozen Orb and Blizzard in packs.",
          "Spend procs rapidly with Ice Lance cleave windows.",
          "Use Cone of Cold or Comet Storm by build and pull size.",
          "Maintain cooldown cadence with Icy Veins in big pulls.",
          "Focus priority-target delete windows when possible."
        ]
      }
    },
    "Warlock": {
      "Affliction": {
        default: [
          "Maintain Agony, Corruption, and Unstable Affliction uptime.",
          "Use Malefic Rapture in empowered DoT windows.",
          "Spend shards without capping while preserving setup.",
          "Use Soul Rot and Darkglare in synchronized burst windows.",
          "Use Drain Soul or Shadow Bolt filler based on build."
        ],
        aoe: [
          "Apply and maintain DoTs across priority targets.",
          "Use Seed of Corruption for packed targets.",
          "Spend shards on Malefic Rapture when multiple DoTs are active.",
          "Use Soul Rot and cooldowns in stacked pull windows.",
          "Maintain execute pressure on dangerous mobs."
        ]
      },
      "Demonology": {
        default: [
          "Build and spend shards to maintain demon summon cadence.",
          "Use Hand of Gul'dan at efficient shard counts.",
          "Use Call Dreadstalkers and Demonbolt procs on cooldown.",
          "Use Summon Demonic Tyrant in high-value setup windows.",
          "Keep Shadow Bolt filler flowing between summon spikes."
        ]
      },
      "Destruction": {
        default: [
          "Keep Immolate active on your primary target.",
          "Generate shards with Incinerate and Conflagrate.",
          "Spend shards on Chaos Bolt in single-target windows.",
          "Use Havoc to duplicate key casts in cleave.",
          "Use Summon Infernal and cooldowns in burst windows."
        ],
        aoe: [
          "Use Rain of Fire as your primary shard spender in packs.",
          "Maintain Immolate spread where practical.",
          "Use Havoc for priority cleave duplication.",
          "Use Infernal and cooldown package on large pulls.",
          "Manage shard generation to avoid capping."
        ]
      }
    },
    "Monk": {
      "Brewmaster": {
        default: [
          "Use Keg Smash and Tiger Palm to maintain brew flow.",
          "Use Purifying Brew to clear heavy stagger damage.",
          "Maintain Shuffle via Blackout Kick interactions.",
          "Use Breath of Fire for mitigation and control uptime.",
          "Rotate Celestial Brew and Fortifying Brew proactively."
        ]
      },
      "Mistweaver": {
        default: [
          "Keep Renewing Mist on cooldown for broad coverage.",
          "Use Vivify cleave and Enveloping Mist on priority targets.",
          "Use Essence Font and Chi Burst by encounter profile.",
          "Use Thunder Focus Tea to amplify key casts.",
          "Use Revival in planned heavy damage moments."
        ]
      },
      "Windwalker": {
        default: [
          "Follow Mastery: avoid repeating the same ability twice in a row.",
          "Use Rising Sun Kick and Fists of Fury on cooldown.",
          "Spend Chi efficiently with Blackout Kick and Spinning Crane Kick by target count.",
          "Use Strike of the Windlord in burst windows.",
          "Use Touch of Death for priority delete windows."
        ],
        aoe: [
          "Use Spinning Crane Kick as your AoE spender.",
          "Keep Rising Sun Kick and Fists of Fury on cooldown.",
          "Use Whirling Dragon Punch when available.",
          "Maintain Hit Combo style sequencing.",
          "Use burst cooldowns at large pull starts."
        ]
      }
    },
    "Druid": {
      "Balance": {
        default: [
          "Keep Moonfire and Sunfire active.",
          "Generate Astral Power with Wrath and Starfire by eclipse state.",
          "Spend Astral Power with Starsurge on single target.",
          "Use Celestial Alignment or Incarnation in burst windows.",
          "Use Fury of Elune and cooldowns on planned timing."
        ],
        aoe: [
          "Maintain Sunfire spread across packs.",
          "Spend Astral Power with Starfall in multi-target pulls.",
          "Use Starfire during Lunar-focused cleave windows.",
          "Use Celestial Alignment or Incarnation for pull spikes.",
          "Prioritize dangerous targets with Starsurge when needed."
        ]
      },
      "Feral": {
        default: [
          "Keep Rake, Rip, and Moonfire (if talented) active.",
          "Build Combo Points with Shred or Brutal Slash by build.",
          "Spend Combo Points on Ferocious Bite at efficient energy windows.",
          "Use Tiger's Fury and Berserk in synchronized burst windows.",
          "Maintain bleed uptime before refreshing burst cycles."
        ]
      },
      "Guardian": {
        default: [
          "Maintain Ironfur stacks during physical pressure.",
          "Use Mangle and Thrash on cooldown for threat and Rage.",
          "Spend Rage on Ironfur or Frenzied Regeneration by damage profile.",
          "Use Moonfire for range pull and filler pressure.",
          "Cycle Barkskin and Survival Instincts proactively."
        ]
      },
      "Restoration": {
        default: [
          "Maintain Lifebloom and key HoTs before incoming damage.",
          "Use Swiftmend and Regrowth for spot healing windows.",
          "Use Wild Growth for group healing spikes.",
          "Use Efflorescence where group uptime is high.",
          "Use Tranquility and Incarnation for heavy damage phases."
        ]
      }
    },
    "Demon Hunter": {
      "Havoc": {
        default: [
          "Maintain Immolation Aura and core Fury generation.",
          "Spend Fury with Chaos Strike or Annihilation in burst windows.",
          "Use Blade Dance or Death Sweep on cooldown.",
          "Use Eye Beam to trigger core burst interactions.",
          "Use Metamorphosis in planned high-value windows."
        ],
        aoe: [
          "Use Eye Beam and Blade Dance aggressively in packs.",
          "Keep Immolation Aura on cooldown for Fury and AoE.",
          "Spend Fury with Chaos Strike while maintaining tempo.",
          "Use Throw Glaive synergies by build.",
          "Use Metamorphosis for large pull spikes."
        ]
      },
      "Vengeance": {
        default: [
          "Maintain Demon Spikes for predictable physical damage.",
          "Use Fracture and Shear to generate Soul Fragments.",
          "Spend with Soul Cleave for healing and mitigation.",
          "Use Immolation Aura and Sigils to control pull tempo.",
          "Rotate Fiery Brand and Metamorphosis proactively."
        ]
      }
    },
    "Evoker": {
      "Devastation": {
        default: [
          "Use Fire Breath and Eternity Surge at high empower value.",
          "Spend Essence on Disintegrate in single target.",
          "Use Living Flame as filler between empowered casts.",
          "Use Dragonrage in planned burst windows.",
          "Manage movement with instant casts to protect uptime."
        ],
        aoe: [
          "Empower Fire Breath and Eternity Surge for pull size.",
          "Spend Essence on Pyre in stacked packs.",
          "Use Disintegrate for priority-target pressure.",
          "Use Dragonrage on large pulls with cooldown alignment.",
          "Keep movement-safe cast flow with instant globals."
        ]
      },
      "Preservation": {
        default: [
          "Plan Echo application before heavy healing windows.",
          "Use Verdant Embrace and Dream Breath for burst recovery.",
          "Use Reversion and Spiritbloom by damage profile.",
          "Leverage empowered spells at the right charge level.",
          "Use Rewind and major cooldowns for scripted raid damage."
        ]
      },
      "Augmentation": {
        default: [
          "Maintain Ebon Might uptime as your highest support priority.",
          "Use Prescience and utility buffs before ally burst windows.",
          "Spend Essence and empower casts without capping resources.",
          "Use Breath of Eons in coordinated group cooldown windows.",
          "Keep damage globals active while maintaining buff cadence."
        ]
      }
    }
  };

  const specData = ROTATION_PRIORITY_LIBRARY?.[className]?.[specName];
  if (specData) {
    const modeSpecific = Array.isArray(specData?.[mode]) ? specData[mode] : null;
    const base = Array.isArray(specData?.default) ? specData.default : [];
    const steps = modeSpecific && modeSpecific.length > 0 ? modeSpecific : base;
    if (steps.length > 0) return steps;
  }

  const archetype = getSpecArchetype(className, specName);
  const byArchetype = {
    tank: [
      "Keep active mitigation rolling before heavy enemy casts or tank-buster windows.",
      "Spend resources on survivability first, damage second when pressure is high.",
      "Cycle defensives instead of stacking them unless a lethal hit is imminent.",
      "Use interrupts and stops aggressively to reduce incoming group damage."
    ],
    healer: [
      "Maintain key HoTs/shields before damage events so recovery starts earlier.",
      "Use efficient filler healing between spikes and save major cooldowns for scripted bursts.",
      "Keep damage contribution active during stable moments without risking coverage.",
      "Plan mobility and instant casts for high movement windows."
    ],
    caster: [
      "Open with your major cooldown package and align trinkets with burst windows.",
      "Maintain core DoTs/debuffs and avoid clipping high-value casts.",
      "Spend procs quickly when near cap; do not overcap resources.",
      "Pre-position for mechanics to protect long casts and uptime."
    ],
    "support-caster": [
      "Align support buffs with team cooldown windows rather than using on cooldown blindly.",
      "Keep your highest value debuffs/buffs active on priority targets.",
      "Use utility globals only when they preserve net team damage or survival.",
      "Track ally burst cycles and hold short cooldowns for coordinated setups."
    ],
    "crit-caster": [
      "Build for burst windows and pool resources before major cooldown usage.",
      "Prioritize high-impact casts during proc/crit amplification windows.",
      "Keep DoTs/debuffs active so burst casts gain full multipliers.",
      "Avoid overcapping procs by spending them early in movement-safe windows."
    ],
    "dot-caster": [
      "Apply and maintain full DoT coverage before committing to filler casts.",
      "Refresh DoTs in efficient windows; avoid early clipping unless buffed.",
      "Use cooldowns when multiple DoTs and debuffs are already established.",
      "Route execute or shard spenders into priority-target windows."
    ],
    "melee-haste": [
      "Keep generators and spenders flowing to avoid empty globals.",
      "Pool briefly before cooldown windows so burst openers are clean.",
      "Prioritize high-value procs and avoid capping class resources.",
      "Maintain uptime by pre-moving for mechanics and sticking to targets."
    ],
    "melee-burst": [
      "Pool resources before burst so cooldowns start with full pressure.",
      "Stack damage amps and major abilities in the same short window.",
      "Use filler priority that feeds next burst instead of random spending.",
      "Preserve uptime and frontload damage into vulnerability phases."
    ],
    "dot-melee": [
      "Maintain bleeds/poisons first; then spend on finishers efficiently.",
      "Reapply DoTs during buff windows when possible for stronger snapshots.",
      "Avoid energy/rune capping by planning spender cadence.",
      "Use mobility tools proactively to keep melee uptime high."
    ],
    "ranged-pet": [
      "Keep pet active on target and avoid desync with your core cooldowns.",
      "Spend focus/resources to avoid capping while preserving burst setup.",
      "Use high-value proc shots/skills immediately in priority windows.",
      "Pre-position to minimize movement downtime during rapid casts."
    ],
    "ranged-burst": [
      "Enter burst windows with resources pooled and major cooldowns aligned.",
      "Prioritize instant/high-impact shots during movement-heavy mechanics.",
      "Keep core debuffs up so burst casts gain full value.",
      "Use defensive utility early to avoid losing cast uptime."
    ],
    generic: [
      "Maintain core buffs/debuffs and avoid resource overcap.",
      "Use major cooldowns in planned burst windows.",
      "Prioritize uptime and movement discipline for consistent output.",
      "Adjust utility and defensives to encounter damage patterns."
    ]
  };

  const modeNote = mode === "pvp"
    ? "PvP focus: hold burst for crowd-control chains and trade defensives early."
    : mode === "raid"
      ? "Raid focus: align cooldowns to boss timers and execute phases."
      : "Mythic+ focus: frontload AoE and rotate defensives per dangerous pull.";

  const base = byArchetype[archetype] || byArchetype.generic;
  return [...base, modeNote];
}

function renderRotationHelper(className, specName, mode) {
  if (!rotationToggleBtn || !rotationHelperPanel || !rotationHint || !rotationSteps || !rotationTitle) return;
  if (!className || !specName || !mode) {
    resetRotationHelper("Pick a spec to see rotation guidance.");
    return;
  }

  rotationToggleBtn.hidden = false;
  const steps = getRotationSteps(className, specName, mode);
  rotationTitle.textContent = `${specName} Rotation Helper`;
  rotationHint.textContent = `${className} ${specName} | ${modeLabel(mode)} quick guide`;
  rotationSteps.innerHTML = steps.map((step) => {
    const spellName = findSpellNameInStep(step);
    const spellIconUrl = spellName ? iconUrlForSpellName(spellName) : null;
    const iconHtml = spellIconUrl
      ? `<span class="rotation-spell-icon" style="background-image:url('${escapeHtml(spellIconUrl)}')" aria-hidden="true"></span>`
      : `<span class="rotation-spell-icon fallback" aria-hidden="true">?</span>`;
    const spellHtml = spellName ? `<span class="rotation-spell-name">${escapeHtml(spellName)}</span>` : "";
    return `<li class="rotation-step-item">${iconHtml}<div class="rotation-step-copy">${spellHtml}<span>${escapeHtml(step)}</span></div></li>`;
  }).join("");
  rotationHelperPanel.hidden = !rotationPanelOpen;
  rotationToggleBtn.textContent = rotationPanelOpen ? "Hide Rotation Helper" : "Show Rotation Helper";
  rotationToggleBtn.setAttribute("aria-expanded", rotationPanelOpen ? "true" : "false");
}

function renderStatExplanation(className, specName, stat, rank, mode) {
  const description = getStatExplanation(className, specName, stat, mode);
  statExplain.innerHTML = `
    <p class="stat-explain-title">#${rank} ${escapeHtml(stat)} | Why It Is Good</p>
    <p class="stat-explain-text">${escapeHtml(description)}</p>
  `;
  statExplain.hidden = false;
}

function renderStatPriorities(className, specName, mode) {
  if (!className || !specName) {
    resetStatPrioritiesCard("Pick a spec to view stat priorities.");
    return;
  }

  const priorities = resolveStatPriorities(className, specName, mode);
  if (!Array.isArray(priorities) || priorities.length === 0) {
    resetStatPrioritiesCard(`No stat priority found for ${className} | ${specName}.`);
    return;
  }

  statHint.textContent = `${className} ${specName} | ${modeLabel(mode)} priority`;
  statPills.innerHTML = priorities
    .map((stat, idx) => `<button type="button" class="stat-pill${idx === 0 ? " selected" : ""}" data-stat="${escapeHtml(stat)}" data-rank="${idx + 1}"><span class="stat-rank">#${idx + 1}</span><span>${escapeHtml(stat)}</span></button>`)
    .join("");
  statPills.hidden = false;
  renderStatExplanation(className, specName, priorities[0], 1, mode);
}

function renderTalentTree(className, specName) {
  if (!className || !specName) {
    resetTalentTreeCard("Pick a spec to load talent nodes.");
    return;
  }

  if (!Array.isArray(talentTreesSpecs) || talentTreesSpecs.length === 0) {
    const errorMsg = talentTreesLoadError
      ? `Talent tree data unavailable: ${talentTreesLoadError}`
      : "Talent tree data is still loading, or unavailable.";
    resetTalentTreeCard(errorMsg);
    return;
  }

  const specPayload = findTalentSpec(className, specName);
  if (!specPayload) {
    resetTalentTreeCard(`No talent tree found for ${className} | ${specName}.`);
    return;
  }

  const mapped = buildInteractiveTalentData(specPayload);
  if (!Array.isArray(mapped.talents) || mapped.talents.length === 0) {
    resetTalentTreeCard(`No nodes found for ${className} | ${specName}.`);
    return;
  }

  talentData = mapped.talents;
  maxTotalPoints = mapped.maxTotalPoints;
  const totalNodes = talentData.length;
  talentTreeHint.textContent = `${className} ${specName} | ${totalNodes} nodes | ${talentTreesMeta.source || "unknown source"}`;

  talentTreeHint.hidden = true;
  talentTreeWrap.hidden = false;
  talentTreeWrap.className = "talent-tree-wrap";
  if (talentSystem) talentSystem.hidden = false;
  initTalentTree();
  talentTreeWrap.hidden = false;
  talentNodeInspector.hidden = true;
  talentNodeHint.textContent = "Click a talent node to inspect it.";
  talentNodeBody.innerHTML = "";
}

function renderTalentNodeInspector(nodeInfo) {
  if (!nodeInfo || !nodeInfo.node) return;
  const node = nodeInfo.node;
  const entries = Array.isArray(node?.entries) ? node.entries : [];
  const primary = entries[0] || null;
  const name = escapeHtml(node?.name || "Unknown Talent");
  const nodeKind = escapeHtml(String(node?.nodeKind || "active").toUpperCase());
  const maxRank = Math.max(1, Number(primary?.maxRank ?? node?.maxRank ?? 1));
  const spellId = Number.isFinite(Number(node?.spellId ?? primary?.spellId)) ? Number(node?.spellId ?? primary?.spellId) : null;
  const reqs = Array.isArray(node?.requiredNodeIds) ? node.requiredNodeIds : [];
  const iconUrl = typeof primary?.iconUrl === "string" && primary.iconUrl
    ? primary.iconUrl
    : (typeof node?.iconUrl === "string" ? node.iconUrl : "");
  const iconHtml = iconUrl ? `<span class="inspector-icon" style="background-image:url('${escapeHtml(iconUrl)}')"></span>` : `<span class="inspector-icon fallback">${escapeHtml(nodeInitials(node?.name))}</span>`;
  const choiceHtml = entries.length > 1
    ? `<ul class="inspector-list">${entries.map((e) => `<li>${escapeHtml(e?.name || "Unknown choice")}${e?.spellId ? ` <span class="muted">(#${Number(e.spellId)})</span>` : ""}</li>`).join("")}</ul>`
    : "<p class=\"muted\">No choice variants.</p>";

  talentNodeHint.textContent = `${nodeInfo.paneLabel} | ${name}`;
  talentNodeBody.innerHTML = `
    <div class="inspector-head">
      ${iconHtml}
      <div>
        <p class="inspector-name">${name}</p>
        <p class="muted">Type: ${nodeKind} | Max rank: ${maxRank}${spellId ? ` | Spell: ${spellId}` : ""}</p>
      </div>
    </div>
    <p class="muted">Prerequisites: ${reqs.length > 0 ? reqs.join(", ") : "None"}</p>
    <h5 class="inspector-subtitle">Choices</h5>
    ${choiceHtml}
  `;
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
  resetStatPrioritiesCard("Pick a spec to view stat priorities.");
  resetTalentTreeCard("Pick a spec to load talent nodes.");
  resetRotationHelper("Pick a spec to see rotation guidance.");
}

function showPanelForClass(className, classBtnEl) {
  const color = getClassColor(classBtnEl);
  panel.dataset.theme = classThemeKey(className);

  selectedClassTitle.textContent = className;
  panelSubtitle.textContent = "Now click your spec.";

  const classIcon = CLASS_DATA[className]?.classIcon || "";
  classBadge.textContent = "";
  classBadge.style.borderColor = color;
  classBadge.style.boxShadow = `0 0 16px ${color}`;
  classBadge.style.backgroundImage = classIcon ? `url('${classIcon}')` : "";
  classBadge.classList.toggle("has-image", Boolean(classIcon));
  panel.style.setProperty("--panel-icon-url", classIcon ? `url('${classIcon}')` : "none");

  panel.hidden = false;
  renderSpecButtons(className);

  // Bring the class panel into view so users don't need to scroll manually.
  requestAnimationFrame(() => {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function collapseClassPanel() {
  selectedClass = null;
  selectedSpec = null;
  selectedMode = null;
  activeBuild = null;

  clearSelectedClassButtons();
  clearSelectedSpecButtons();
  clearSelectedTabs();

  panel.hidden = true;
  panel.removeAttribute("data-theme");
  panelSubtitle.textContent = "Then choose a spec.";
  selectedClassTitle.textContent = "Choose a class";
  classBadge.textContent = "?";
  classBadge.style.backgroundImage = "";
  classBadge.classList.remove("has-image");
  panel.style.setProperty("--panel-icon-url", "none");

  buildTypeWrap.hidden = true;
  resetBuildCard("Pick a spec, then a build type.");
  resetStatPrioritiesCard("Pick a spec to view stat priorities.");
  resetTalentTreeCard("Pick a spec to load talent nodes.");
  resetRotationHelper("Pick a spec to see rotation guidance.");

  requestAnimationFrame(() => {
    classButtons.scrollIntoView({ behavior: "smooth", block: "start" });
  });
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
  const host = String(window.location.hostname || "").toLowerCase();
  const isLocalDev = host === "localhost" || host === "127.0.0.1";
  const isGithubPages = host.endsWith(".github.io");
  const allowFallback = isLocalDev || isGithubPages || window.location.protocol === "file:";
  const urls = allowFallback
    ? ["/api/talent-trees", "/talent-trees.json", "./talent-trees.json"]
    : ["/api/talent-trees"];
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
  if (!allowFallback) {
    talentTreesLoadError = `API required on this host. ${talentTreesLoadError}`;
  }
  console.warn("Could not load talent tree metadata from API or local file.", { errors, allowFallback, host });
  if (selectedClass && selectedSpec) renderTalentTree(selectedClass, selectedSpec);
}

function modeLabel(mode) {
  if (mode === "aoe") return "AoE (Mythic+)";
  if (mode === "raid") return "Raid";
  if (mode === "pvp") return "PvP";
  return mode;
}

function parseFlexibleDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatUpdatedAgo(value) {
  const d = parseFlexibleDate(value);
  if (!d) return null;
  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  if (diffMs < minuteMs) return "Updated just now";
  if (diffMs < hourMs) return `Updated ${Math.floor(diffMs / minuteMs)}m ago`;
  if (diffMs < dayMs) return `Updated ${Math.floor(diffMs / hourMs)}h ago`;
  return `Updated ${Math.floor(diffMs / dayMs)}d ago`;
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
  activeBuild = build;

  buildTitle.textContent = build.title || `${specName} — ${modeLabel(mode)}`;

  const metaParts = [];
  const updatedAgo = formatUpdatedAgo(build.updated);
  if (updatedAgo) metaParts.push(updatedAgo);
  if (build.confidence && build.confidenceScore != null) {
    metaParts.push(`Confidence: ${String(build.confidence).toUpperCase()} (${build.confidenceScore})`);
  }

  buildMeta.textContent = metaParts.join(" • ");
  buildHint.textContent = "";

  const notes = [...(build.notes ?? [])]
    .filter((n) => !/^player:/i.test(String(n || "").trim()));
  if (build.sampleSize != null) notes.push(`Sample size: ${build.sampleSize}`);
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
  renderStatPriorities(selectedClass, selectedSpec, selectedMode);
  renderTalentTree(selectedClass, selectedSpec);
  rotationPanelOpen = false;
  renderRotationHelper(selectedClass, selectedSpec, selectedMode);

  // Spec selection expands panel content; keep panel top visible like a focused section.
  requestAnimationFrame(() => {
    ensureSpecExpansionVisible();
    requestAnimationFrame(() => ensureSpecExpansionVisible());
  });
  setTimeout(() => ensureSpecExpansionVisible(), 140);
});

buildTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  if (!selectedClass || !selectedSpec) return;

  selectedMode = btn.dataset.mode;

  clearSelectedTabs();
  btn.classList.add("selected");

  showBuildFromData(selectedClass, selectedSpec, selectedMode);
  renderStatPriorities(selectedClass, selectedSpec, selectedMode);
  renderTalentTree(selectedClass, selectedSpec);
  renderRotationHelper(selectedClass, selectedSpec, selectedMode);
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

statPills.addEventListener("click", (e) => {
  const btn = e.target.closest(".stat-pill");
  if (!btn) return;
  if (!selectedClass || !selectedSpec || !selectedMode) return;

  const stat = btn.dataset.stat;
  const rank = Number(btn.dataset.rank) || 1;
  if (!stat) return;

  const all = statPills.querySelectorAll(".stat-pill");
  all.forEach((p) => p.classList.remove("selected"));
  btn.classList.add("selected");

  renderStatExplanation(selectedClass, selectedSpec, stat, rank, selectedMode);
});

backToClassesBtn?.addEventListener("click", () => {
  collapseClassPanel();
});

rotationToggleBtn?.addEventListener("click", () => {
  if (!selectedClass || !selectedSpec || !selectedMode) return;
  rotationPanelOpen = !rotationPanelOpen;
  renderRotationHelper(selectedClass, selectedSpec, selectedMode);
  if (rotationPanelOpen) {
    requestAnimationFrame(() => {
      ensureElementTopVisible(rotationHelperPanel, 14);
    });
  }
});

// Start
injectTalentTreeStyles();
Promise.all([loadBuilds(), loadTalentTreesMeta()]);
