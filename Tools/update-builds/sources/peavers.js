// tools/update-builds/sources/peavers.js
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import AdmZip from "adm-zip";
import luaparse from "luaparse";

const REPO = "Peavers-Warcraft/PeaversTalentsData";
const GITHUB_API = "https://api.github.com";

const DEBUG = false;

// Spec -> name
const SPEC_ID_TO_NAME = {
  71: "Arms", 72: "Fury", 73: "Protection",
  65: "Holy", 66: "Protection", 70: "Retribution",
  253: "Beast Mastery", 254: "Marksmanship", 255: "Survival",
  259: "Assassination", 260: "Outlaw", 261: "Subtlety",
  256: "Discipline", 257: "Holy", 258: "Shadow",
  250: "Blood", 251: "Frost", 252: "Unholy",
  262: "Elemental", 263: "Enhancement", 264: "Restoration",
  62: "Arcane", 63: "Fire", 64: "Frost",
  265: "Affliction", 266: "Demonology", 267: "Destruction",
  268: "Brewmaster", 270: "Mistweaver", 269: "Windwalker",
  102: "Balance", 103: "Feral", 104: "Guardian", 105: "Restoration",
  577: "Havoc", 581: "Vengeance",
  1467: "Devastation", 1468: "Preservation", 1473: "Augmentation"
};

// Spec -> class
const SPEC_TO_CLASS = {
  71: "Warrior", 72: "Warrior", 73: "Warrior",
  65: "Paladin", 66: "Paladin", 70: "Paladin",
  253: "Hunter", 254: "Hunter", 255: "Hunter",
  259: "Rogue", 260: "Rogue", 261: "Rogue",
  256: "Priest", 257: "Priest", 258: "Priest",
  250: "Death Knight", 251: "Death Knight", 252: "Death Knight",
  262: "Shaman", 263: "Shaman", 264: "Shaman",
  62: "Mage", 63: "Mage", 64: "Mage",
  265: "Warlock", 266: "Warlock", 267: "Warlock",
  268: "Monk", 270: "Monk", 269: "Monk",
  102: "Druid", 103: "Druid", 104: "Druid", 105: "Druid",
  577: "Demon Hunter", 581: "Demon Hunter",
  1467: "Evoker", 1468: "Evoker", 1473: "Evoker"
};

function modeFromFilename(filePath) {
  const name = path.basename(filePath).toLowerCase();
  if (name.includes("mythicdb")) return "aoe";
  if (name.includes("raid")) return "raid";
  if (name.includes("misc")) return "pvp";
  return null;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "wow-builds-updater"
    }
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  return res.json();
}

async function downloadFile(url, outPath) {
  const res = await fetch(url, { headers: { "user-agent": "wow-builds-updater" } });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
}

async function listFilesRec(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await listFilesRec(full)));
    else out.push(full);
  }
  return out;
}

// Collect local X = <expr> AND X = <expr>
function buildConstEnv(ast) {
  const env = new Map();
  for (const stmt of ast.body) {
    if (stmt.type === "LocalStatement") {
      const vars = stmt.variables || [];
      const inits = stmt.init || [];
      for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        const init = inits[i];
        if (v?.type === "Identifier" && init) env.set(v.name, init);
      }
    }
    if (stmt.type === "AssignmentStatement") {
      const vars = stmt.variables || [];
      const inits = stmt.init || [];
      for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        const init = inits[i];
        if (v?.type === "Identifier" && init) env.set(v.name, init);
      }
    }
  }
  return env;
}

function unquoteLuaStringRaw(raw) {
  if (typeof raw !== "string") return null;
  // Handles "..." or '...' (we don’t fully interpret escapes, but Peavers strings are usually plain)
  const first = raw[0];
  const last = raw[raw.length - 1];
  if ((first === `"` && last === `"`) || (first === `'` && last === `'`)) {
    return raw.slice(1, -1);
  }
  return raw;
}

let printedTalentType = false;

// Lua -> JS conversion
function luaNodeToJs(node, env) {
  if (!node) return null;

  switch (node.type) {
    case "StringLiteral": {
      // luaparse typically gives .value, but if not, fall back to .raw
      if (typeof node.value === "string") return node.value;
      const fromRaw = unquoteLuaStringRaw(node.raw);
      return typeof fromRaw === "string" ? fromRaw : null;
    }

    // Some luaparse builds use LongStringLiteral for [[...]]
    case "LongStringLiteral": {
      if (typeof node.value === "string") return node.value;
      const fromRaw = unquoteLuaStringRaw(node.raw);
      return typeof fromRaw === "string" ? fromRaw : null;
    }

    case "NumericLiteral":
      return node.value;

    case "BooleanLiteral":
      return node.value;

    case "NilLiteral":
      return null;

    case "Identifier": {
      if (!env) return null;
      const initNode = env.get(node.name);
      if (!initNode) return null;

      env.delete(node.name); // recursion guard
      const resolved = luaNodeToJs(initNode, env);
      env.set(node.name, initNode);

      return resolved;
    }

    case "IndexExpression": {
      const base = luaNodeToJs(node.base, env);
      const index = luaNodeToJs(node.index, env);
      if (base && typeof base === "object" && index != null) {
        const key = String(index);
        if (Object.prototype.hasOwnProperty.call(base, key)) return base[key];
      }
      return null;
    }

    case "MemberExpression": {
      const base = luaNodeToJs(node.base, env);
      const key = node.identifier?.name;
      if (base && typeof base === "object" && key) {
        if (Object.prototype.hasOwnProperty.call(base, key)) return base[key];
      }
      return null;
    }

    case "CallExpression": {
      const args = node.arguments || [];
      for (const a of args) {
        const v = luaNodeToJs(a, env);
        if (typeof v === "string" && v.length > 10) return v;
      }
      return null;
    }

    case "StringCallExpression": {
      const v = luaNodeToJs(node.argument, env);
      return typeof v === "string" ? v : null;
    }

    case "TableCallExpression": {
      const v = luaNodeToJs(node.arguments, env);
      if (typeof v === "string") return v;
      if (v && typeof v === "object") {
        for (const t of Object.values(v)) {
          if (typeof t === "string" && t.length > 10) return t;
        }
      }
      return null;
    }

    case "BinaryExpression": {
      const left = luaNodeToJs(node.left, env);
      const right = luaNodeToJs(node.right, env);
      if (node.operator === "..") {
        if (left == null || right == null) return null;
        return String(left) + String(right);
      }
      return null;
    }

    case "ParenthesisExpression":
      return luaNodeToJs(node.expression, env);

    case "TableConstructorExpression": {
      const obj = {};
      let arrayIndex = 1;

      for (const field of node.fields) {
        if (field.type === "TableKeyString") {
          const key = field.key.name;

          if (DEBUG && key === "talentString" && !printedTalentType) {
            printedTalentType = true;
            console.log("Peavers: talentString AST value type:", field.value?.type, "raw:", field.value?.raw);
          }

          obj[key] = luaNodeToJs(field.value, env);

        } else if (field.type === "TableKey") {
          const k = luaNodeToJs(field.key, env);
          obj[String(k)] = luaNodeToJs(field.value, env);

        } else if (field.type === "TableValue") {
          obj[String(arrayIndex)] = luaNodeToJs(field.value, env);
          arrayIndex += 1;
        }
      }
      return obj;
    }

    default:
      return null;
  }
}

// return {..} OR local DB={..}; return DB
function extractMainTableFromAst(ast) {
  const namedTables = new Map();

  for (const stmt of ast.body) {
    if (stmt.type === "LocalStatement") {
      const vars = stmt.variables || [];
      const inits = stmt.init || [];
      for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        const init = inits[i];
        if (v?.type === "Identifier" && init?.type === "TableConstructorExpression") {
          namedTables.set(v.name, init);
        }
      }
    }
    if (stmt.type === "AssignmentStatement") {
      const vars = stmt.variables || [];
      const inits = stmt.init || [];
      for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        const init = inits[i];
        if (v?.type === "Identifier" && init?.type === "TableConstructorExpression") {
          namedTables.set(v.name, init);
        }
      }
    }
  }

  for (const stmt of ast.body) {
    if (stmt.type !== "ReturnStatement") continue;
    for (const arg of stmt.arguments || []) {
      if (arg?.type === "TableConstructorExpression") return arg;
      if (arg?.type === "Identifier") {
        const t = namedTables.get(arg.name);
        if (t) return t;
      }
    }
  }

  for (const t of namedTables.values()) return t;
  return null;
}

function pickBoss0OrFirst(specTable) {
  if (!specTable || typeof specTable !== "object") return null;
  if (specTable["0"] && typeof specTable["0"] === "object") return specTable["0"];
  for (const v of Object.values(specTable)) {
    if (v && typeof v === "object") return v;
  }
  return null;
}

export async function getPeaversBuilds() {
  const latest = await fetchJson(`${GITHUB_API}/repos/${REPO}/releases/latest`);
  const releasePublishedAt = latest?.published_at ?? null;
  const assets = Array.isArray(latest.assets) ? latest.assets : [];
  const zipAsset = assets.find(a => typeof a.name === "string" && a.name.toLowerCase().endsWith(".zip"));
  if (!zipAsset?.browser_download_url) throw new Error(`No .zip asset found for ${REPO}`);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "peavers-"));
  const zipPath = path.join(tmpDir, zipAsset.name);
  await downloadFile(zipAsset.browser_download_url, zipPath);

  const extractDir = path.join(tmpDir, "unzipped");
  await fs.mkdir(extractDir, { recursive: true });

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractDir, true);

  const allFiles = await listFilesRec(extractDir);
  const dbFiles = allFiles.filter(f =>
    f.toLowerCase().includes(`${path.sep}src${path.sep}data${path.sep}`) &&
    f.toLowerCase().endsWith("db.lua")
  );

  if (DEBUG) console.log("Peavers: DB files detected:", dbFiles.length);

  const normalized = [];

  for (const file of dbFiles) {
    const mode = modeFromFilename(file);
    if (!mode) continue;

    const text = await fs.readFile(file, "utf8");

    let ast;
    try {
      ast = luaparse.parse(text, { luaVersion: "5.1" });
    } catch {
      if (DEBUG) console.log("Peavers: failed to parse:", path.basename(file));
      continue;
    }

    const tableNode = extractMainTableFromAst(ast);
    if (!tableNode) continue;

    const env = buildConstEnv(ast);
    const db = luaNodeToJs(tableNode, env);
    if (!db || typeof db !== "object") continue;

    for (const [classKey, classEntry] of Object.entries(db)) {
      if (classKey === "updated") continue;
      if (!classEntry || typeof classEntry !== "object") continue;

      const specs = classEntry.specs;
      if (!specs || typeof specs !== "object") continue;

      for (const [specKey, specTable] of Object.entries(specs)) {
        const specID = Number(specKey);
        if (!Number.isFinite(specID) || !SPEC_ID_TO_NAME[specID]) continue;

        const picked = pickBoss0OrFirst(specTable);
        if (!picked || typeof picked !== "object") continue;

        const talent = picked.talentString;

        if (typeof talent !== "string" || talent.length < 10) {
          if (DEBUG) {
            console.log(
              "Peavers: talentString unresolved",
              path.basename(file),
              "class",
              classKey,
              "spec",
              specID,
              "talent=",
              talent,
              "talentType=",
              typeof talent
            );
          }
          continue;
        }

        const className = SPEC_TO_CLASS[specID];
        const specName = SPEC_ID_TO_NAME[specID];
        if (!className || !specName) continue;

        normalized.push({
          className,
          specName,
          mode,
          title: picked.label || `${specName} — ${mode.toUpperCase()}`,
          source: picked.source
            ? `PeaversTalentsData/${picked.source}`
            : `PeaversTalentsData/${path.basename(file, ".lua")}`,
          updated: picked.updated || classEntry.updated || db.updated || releasePublishedAt || null,
          exportString: talent,
          notes: []
        });
      }
    }
  }

  console.log("Peavers: FINAL normalized builds:", normalized.length);
  return normalized;
}
