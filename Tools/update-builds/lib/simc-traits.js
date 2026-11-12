// Parses SimulationCraft's generated trait table (engine/dbc/generated/trait_data.inc).
// It is the same table simc uses to read talent loadout codes, so node ids and order match the game.

export const SIMC_TRAIT_URL = "https://raw.githubusercontent.com/simulationcraft/simc/midnight/engine/dbc/generated/trait_data.inc";

export const CLASS_BY_ID = {
  1: "Warrior", 2: "Paladin", 3: "Hunter", 4: "Rogue", 5: "Priest", 6: "Death Knight", 7: "Shaman",
  8: "Mage", 9: "Warlock", 10: "Monk", 11: "Druid", 12: "Demon Hunter", 13: "Evoker"
};

export const TREE = { 1: "class", 2: "spec", 3: "hero", 4: "selection" };

const ROW = new RegExp(
  String.raw`^\s*\{\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*"((?:[^"\\]|\\.)*)",\s*\{([^}]*)\},\s*\{([^}]*)\},\s*(\d+),\s*(\d+)\s*\},?\s*$`
);
const ints = (s) => s.split(",").map((x) => Number(x.trim())).filter((n) => n > 0);

/** Returns { build, traits: [...], subTrees: Map<id, name> }. */
export function parseTraitData(text) {
  const lines = text.split(/\r?\n/);
  const build = (lines[0].match(/wow build ([\d.]+)/) || [])[1] || null;
  const traits = [];
  const subTrees = new Map();
  let section = "";
  for (const line of lines) {
    if (line.startsWith("static")) {
      section = line.includes("__trait_data_data") ? "traits" : line.includes("__trait_sub_tree_data") ? "subtrees" : "";
      continue;
    }
    if (section === "traits") {
      const m = line.match(ROW);
      if (!m) continue;
      traits.push({
        tree: TREE[Number(m[1])] || "other",
        classId: Number(m[2]),
        entryId: Number(m[3]),
        nodeId: Number(m[4]),
        maxRanks: Number(m[5]),
        reqPoints: Number(m[6]),
        definitionId: Number(m[7]),
        spellId: Number(m[8]),
        row: Number(m[11]),
        col: Number(m[12]),
        selectionIndex: Number(m[13]),
        name: m[14].replace(/\\"/g, '"'),
        specIds: ints(m[15]),
        starterSpecIds: ints(m[16]),
        subTreeId: Number(m[17]),
        nodeType: Number(m[18])
      });
    } else if (section === "subtrees") {
      const m = line.match(/\{\s*(\d+),\s*"((?:[^"\\]|\\.)*)",\s*(\d+)\s*\}/);
      if (m) subTrees.set(Number(m[1]), { name: m[2], classOrSpec: Number(m[3]) });
    }
  }
  return { build, traits, subTrees };
}
