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

const buildTitle = document.getElementById("buildTitle");
const buildMeta = document.getElementById("buildMeta");
const buildHint = document.getElementById("buildHint");
const buildNotes = document.getElementById("buildNotes");
const statHint = document.getElementById("statHint");
const statPills = document.getElementById("statPills");
const statExplain = document.getElementById("statExplain");
const talentTreeHint = document.getElementById("talentTreeHint");
const talentTreeWrap = document.getElementById("talentTreeWrap");
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

function resetTalentTreeCard(message) {
  talentTreeHint.textContent = message;
  talentTreeWrap.innerHTML = "";
  talentTreeWrap.hidden = true;
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
    const errorMsg = talentTreesLoadError ? `Talent tree data unavailable: ${talentTreesLoadError}` : "Talent tree data is still loading, or unavailable.";
    resetTalentTreeCard(errorMsg);
    return;
  }

  const specPayload = findTalentSpec(className, specName);
  if (!specPayload) {
    resetTalentTreeCard(`No talent tree found for ${className} | ${specName}.`);
    return;
  }

  const { classPane, specPane, nodes } = resolveTalentPanes(specPayload);
  if (nodes.length === 0) {
    resetTalentTreeCard(`No nodes found for ${className} | ${specName}.`);
    return;
  }

  talentNodeIndex = new Map();
  const selectedSet = buildSelectedTalentSelection(activeBuild?.selectedTalents);
  let matchedCount = 0;

  function renderTreePane(pane) {
    const title = pane?.label || "Tree";
    const typeNodes = Array.isArray(pane?.nodes) ? pane.nodes : [];
    if (typeNodes.length === 0) {
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

    const byId = new Map(typeNodes.map((n) => [Number(n?.id), n]));
    const linkHtml = [];
    const paneEdges = Array.isArray(pane?.edges) ? pane.edges : [];
    for (const edge of paneEdges) {
      const fromNode = byId.get(Number(edge?.fromNodeId));
      const toNode = byId.get(Number(edge?.toNodeId));
      if (!fromNode || !toNode) continue;
      const x1 = Math.max(0, Number(fromNode?.col ?? 0));
      const y1 = Math.max(0, Number(fromNode?.row ?? 0));
      const x2 = Math.max(0, Number(toNode?.col ?? 0));
      const y2 = Math.max(0, Number(toNode?.row ?? 0));
      linkHtml.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`);
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
        const entries = Array.isArray(n?.entries) ? n.entries : [];
        const primaryEntry = entries[0] || null;
        const rank = Math.max(1, Number(primaryEntry?.maxRank ?? n?.maxRank ?? 1));
        const name = escapeHtml(n?.name || "Unknown Talent");
        const nodeSlug = slugifyTalentName(n?.name);
        const entrySlugs = entries.map((entry) => slugifyTalentName(entry?.name)).filter(Boolean);
        const nodeId = Number(n?.id);
        const idCandidates = [
          nodeId,
          Number(n?.spellId),
          ...entries.map((entry) => Number(entry?.id)),
          ...entries.map((entry) => Number(entry?.spellId))
        ].filter((value) => Number.isFinite(value));
        let selectedRank = 0;
        for (const candidateId of idCandidates) {
          const rankById = selectedSet.idRanks.get(candidateId);
          if (rankById) {
            selectedRank = rankById;
            break;
          }
        }
        if (!selectedRank && nodeSlug) {
          selectedRank = selectedSet.slugRanks.get(nodeSlug) || 0;
        }
        if (!selectedRank && entrySlugs.length > 0) {
          for (const entrySlug of entrySlugs) {
            const rankBySlug = selectedSet.slugRanks.get(entrySlug);
            if (rankBySlug) {
              selectedRank = rankBySlug;
              break;
            }
          }
        }
        const isSelectedByBuild = selectedRank > 0;
        if (isSelectedByBuild) matchedCount += 1;
        const initials = escapeHtml(nodeInitials(n?.name));
        const iconUrl = typeof primaryEntry?.iconUrl === "string" && primaryEntry.iconUrl
          ? primaryEntry.iconUrl
          : (typeof n?.iconUrl === "string" && n.iconUrl ? n.iconUrl : "");
        const spellId = Number.isFinite(Number(n?.spellId)) ? Number(n.spellId) : null;
        const iconStyle = iconUrl ? ` style="background-image:url('${escapeHtml(iconUrl)}')"` : "";
        const nodeKind = String(n?.nodeKind || (entries.length > 1 ? "choice" : "active")).toLowerCase();
        const choicesText = entries.length > 1 ? `, Choices: ${entries.map((e) => e?.name).filter(Boolean).slice(0, 2).join(" / ")}` : "";
        const chosenText = isSelectedByBuild ? `, Selected rank: ${selectedRank}` : "";
        const nodeTitle = `${name} (Max rank: ${rank}${chosenText}${spellId ? `, Spell ID: ${spellId}` : ""}${choicesText})`;
        const nodeKey = `${pane.key || "tree"}:${Number(n?.id) || `${row}-${col}`}`;
        talentNodeIndex.set(nodeKey, {
          paneKey: pane.key || "tree",
          paneLabel: pane.label || "Tree",
          node: n
        });
        return `
          <button class="wow-node wow-node-${escapeHtml(nodeKind)}${isSelectedByBuild ? " selected-by-build" : ""}" data-node-key="${escapeHtml(nodeKey)}" type="button" style="grid-row:${row};grid-column:${col}" title="${nodeTitle}">
            <span class="wow-node-core${iconUrl ? " has-icon" : ""}"${iconStyle}>
              <span class="wow-node-initials">${initials}</span>
            </span>
            <span class="wow-node-rank">${isSelectedByBuild ? selectedRank : rank}</span>
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
    renderTreePane(classPane),
    renderTreePane(specPane)
  ];

  const selectedTotal = selectedSet.totalCount;
  const likelyIncompleteTree = selectedTotal > 0 && (nodes.length <= 12 || matchedCount < Math.ceil(selectedTotal * 0.45));
  if (likelyIncompleteTree) {
    const groupOrder = ["class", "spec", "hero"];
    const groupLabels = { class: "Class", spec: "Spec", hero: "Hero" };
    const groupHtml = groupOrder.map((g) => {
      const items = selectedSet.groups[g] || [];
      if (items.length === 0) return "";
      const rows = items.map((t) => `<span class="build-map-chip">${escapeHtml(t.slug || "unknown")} <em>${t.rank}</em></span>`).join("");
      return `
        <div class="build-map-group">
          <h5>${groupLabels[g]} talents</h5>
          <div class="build-map-chips">${rows}</div>
        </div>
      `;
    }).join("");

    if (groupHtml) {
      blocks.push(`
        <section class="build-map-fallback">
          <h4>Selected Build Map</h4>
          <p class="muted">Full tree data is incomplete for this spec. Showing selected talents from top-player build data.</p>
          ${groupHtml}
        </section>
      `);
    }
  }

  const totalNodes = Number(specPayload?.summary?.totalNodes) || nodes.length;
  const isLikelyPvpOnly = totalNodes <= 12;
  const treeQualityHint = isLikelyPvpOnly ? " (PvP-sized tree; full spec data may be unavailable in this API response)" : "";
  talentTreeHint.textContent = `${specPayload.className} ${specPayload.specName} | ${totalNodes} nodes | ${talentTreesMeta.source || "unknown source"}${treeQualityHint}`;
  talentTreeWrap.className = "talent-tree-wrap wow-tree-layout";
  talentTreeWrap.innerHTML = blocks.join("");
  talentTreeWrap.hidden = false;
  talentNodeInspector.hidden = false;
  talentNodeHint.textContent = "Click a node to inspect rank, type, choices, and prerequisites.";
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
  if (build.updated) metaParts.push(`Updated: ${build.updated}`);
  if (buildsMeta.generatedAt) metaParts.push(`Generated: ${buildsMeta.generatedAt}`);
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

talentTreeWrap.addEventListener("click", (e) => {
  const nodeBtn = e.target.closest(".wow-node");
  if (!nodeBtn) return;
  const nodeKey = nodeBtn.dataset.nodeKey;
  if (!nodeKey) return;
  const nodeInfo = talentNodeIndex.get(nodeKey);
  if (!nodeInfo) return;

  const allNodes = talentTreeWrap.querySelectorAll(".wow-node");
  allNodes.forEach((n) => n.classList.remove("selected"));
  nodeBtn.classList.add("selected");
  renderTalentNodeInspector(nodeInfo);
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

// Start
Promise.all([loadBuilds(), loadTalentTreesMeta()]);
