// Turns a week's research into picks. Used by the weekly AI review.
//   node decide-picks.js research.json > picks.json     (then: node add-picks.js picks.json && node apply-ai-picks.js)
//
// research.json:
// { "Warrior/Arms": {
//     "guide":  { "name": "Method", "url": "...", "updated": "Patch 12.1.5, 25 Oct 2026", "builds": [{ "label": "Slayer AoE / Mythic+", "code": "..." }] },
//               (a build may carry its own "source": { name, url, updated } when it comes from a second guide)
//     "players": { "name": "Murlok.io", "url": "...", "of": 50, "hero": { "Slayer": 50, "Colossus": 0 }, "counts": { "Storm Bolt": 43 } },
//     "override": { "aoe": { "label": "...", "note": "why the reviewer overrode the scoring" } }   // optional
// } }
//
// Mythic+: every valid candidate (the site's top-player consensus plus the guide's Mythic+ builds) is scored by how
// closely it matches what the sampled top players take; the closest one wins.
// Raid: there is no per-talent player sample, so the guide's raid build on the hero tree that top raiders use wins,
// or the consensus when it already agrees with the guide.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectCode, diffBuilds } from "./lib/build-check.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const research = JSON.parse(await fs.readFile(process.argv[2], "utf8"));
const site = JSON.parse(await fs.readFile(path.join(ROOT, "builds.json"), "utf8")).builds;
const log = (...a) => console.error(...a);
let guideDefault = null;
const poss = (name) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);
const gOf = (c) => c?.g || c?.also?.g || guideDefault;

const isMplus = (l) => /mythic|m\+|dungeon|keys?\b/i.test(l);
const isAoe = (l) => /aoe|cleave/i.test(l);
const isRaid = (l) => /raid|single|\bst\b|boss/i.test(l) && !isMplus(l);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

function candidates(cls, spec, mode, guide) {
  const out = [];
  const consensus = String(site?.[cls]?.[spec]?.[mode]?.exportString || "");
  if (consensus) out.push({ label: "top-player consensus", from: "consensus", code: consensus });
  const builds = guide?.builds || [];
  let wanted = mode === "aoe" ? builds.filter((b) => isMplus(b.label)) : builds.filter((b) => isRaid(b.label));
  if (!wanted.length && mode === "aoe") wanted = builds.filter((b) => isAoe(b.label));
  if (!wanted.length) wanted = builds;
  for (const b of wanted) out.push({ label: b.label, from: "guide", code: String(b.code).trim(), g: { ...guide, ...(b.source || {}) } });
  const seen = new Map();
  for (const c of out) {
    c.check = inspectCode(cls, spec, c.code);
    if (!c.check.ok) { log(`  invalid: ${c.label}: ${c.check.problems.join("; ")}`); continue; }
    const same = seen.get(c.code);
    if (same) { same.also = c; continue; }
    seen.set(c.code, c);
  }
  return [...seen.values()];
}

function takes(check, talentName) {
  const want = norm(talentName);
  for (const t of check.talents.values()) if (norm(t.name) === want) return true;
  return false;
}

function knownTalent(cands, name) {
  // A name we can't find in any candidate may be a misread or a talent nobody here takes; it can't separate them anyway.
  return cands.some((c) => takes(c.check, name));
}

function list(items) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const picks = {};
for (const [key, r] of Object.entries(research)) {
  const [cls, spec] = key.split("/");
  const guide = r.guide;
  guideDefault = guide;
  const players = r.players;
  const of = players?.of || 50;
  log(`\n${cls} ${spec}`);

  // ---------- Mythic+ ----------
  {
    const cands = candidates(cls, spec, "aoe", guide);
    if (cands.length) {
      const heroCounts = players?.hero || {};
      const heroOf = (c) => Object.entries(heroCounts).find(([n]) => norm(n) === norm(c.check.hero))?.[1];
      const counts = Object.entries(players?.counts || {});
      for (const c of cands) {
        c.heroShare = heroOf(c);
        c.fit = 0; c.fitMax = 0;
        for (const [name, n] of counts) {
          if (!knownTalent(cands, name)) continue;
          c.fitMax += Math.max(n, of - n);
          c.fit += takes(c.check, name) ? n : of - n;
        }
        c.score = (c.heroShare ?? of / 2) * 100 + c.fit;
      }
      cands.sort((a, b) => b.score - a.score || (a.from === "guide" ? -1 : 1));
      let best = cands[0];
      const forced = r.override?.aoe;
      if (forced) best = cands.find((c) => c.label === forced.label || c.also?.label === forced.label) || best;
      for (const c of cands) log(`  M+  ${c === best ? "*" : " "} ${c.check.hero} (${c.heroShare ?? "?"}/${of}) fit ${c.fit}/${c.fitMax}  ${c.label}${c.also ? " = " + c.also.label : ""}`);

      const why = [];
      const sources = [];
      const minority = best.heroShare != null && best.heroShare * 2 < of;
      const topHero = Object.entries(heroCounts).sort((a, b) => b[1] - a[1])[0];
      if (players && best.heroShare != null) {
        why.push(minority
          ? `${topHero[1]} of the top ${of} Mythic+ ${spec} ${cls}s on ${players.name} play ${topHero[0]}, but no ${topHero[0]} loadout passed our checks this week (guide codes for it were missing or out of date).`
          : best.heroShare === of
            ? `All ${of} of the top ${of} Mythic+ ${spec} ${cls}s on ${players.name} play ${best.check.hero}.`
            : `${best.heroShare} of the top ${of} Mythic+ ${spec} ${cls}s on ${players.name} play ${best.check.hero}.`);
        sources.push({ name: players.name, url: players.url });
      }
      const guideLabel = best.from === "guide" ? best.label : best.also?.label;
      const agrees = Boolean(best.also) || (best.from === "guide" && false);
      if (best.from === "consensus" && best.also) why.push(`It is the exact loadout most top players in our data run, and it matches ${poss(gOf(best).name)} ${best.also.label} build.`);
      else if (best.from === "guide") why.push(`This is ${poss(gOf(best).name)} ${best.label} build${gOf(best).updated ? ` (${gOf(best).updated})` : ""}, ${minority ? "the best-supported loadout we could verify." : "the closest match to the top players' talent choices among the loadouts checked on that hero tree."}`);
      else why.push(`It is the exact loadout most top players in our data run, and it fits the wider top-${of} talent choices better than the guide builds checked.`);
      if (gOf(best) && (best.from === "guide" || best.also)) sources.push({ name: gOf(best).name, url: gOf(best).url });

      const contested = counts.filter(([name]) => knownTalent(cands, name));
      const popular = contested.filter(([name, n]) => n >= of * 0.6 && takes(best.check, name)).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const skipped = contested.filter(([name, n]) => n <= of * 0.3 && !takes(best.check, name)).sort((a, b) => a[1] - b[1]).slice(0, 3);
      const against = contested.filter(([name, n]) => (n >= of * 0.6 && !takes(best.check, name)) || (n <= of * 0.3 && n >= of * 0.12 && takes(best.check, name)));
      if (!minority && popular.length) why.push(`Takes the optional talents most of them take: ${list(popular.map(([n, c]) => `${n} (${c} of ${of})`))}.`);
      if (!minority && skipped.length) why.push(`Skips the ones few of them take: ${list(skipped.map(([n, c]) => `${n} (${c} of ${of})`))}.`);
      if (!minority && against.length) why.push(`Goes against the majority on ${list(against.filter(([, n]) => n >= of * 0.12).slice(0, 3).map(([n, c]) => `${n} (${c} of ${of} take it)`))}; swap if your group needs it.`);
      if (forced?.note) why.push(forced.note);

      const runnerHero = Object.entries(heroCounts).filter(([n]) => norm(n) !== norm(best.check.hero)).sort((a, b) => b[1] - a[1])[0];
      picks[cls] ||= {}; picks[cls][spec] ||= {};
      picks[cls][spec].aoe = {
        code: best.code,
        headline: best.heroShare == null
          ? `The best-supported ${best.check.hero} loadout for Mythic+ right now.`
          : best.heroShare * 2 < of
            ? `A guide-backed ${best.check.hero} loadout. Most top players run a different hero tree, but no checked loadout for it was available this week.`
            : `${best.heroShare === of ? `All ${of} of the top ${of}` : `${best.heroShare} of the top ${of}`} Mythic+ players sampled ${best.heroShare === 1 ? "runs" : "run"} ${best.check.hero}, and this loadout is the closest match to their talent choices.`,
        why,
        ...(!minority && runnerHero && runnerHero[1] > 0 ? { players: `${runnerHero[0]} is the alternative: ${runnerHero[1]} of ${of} top players use it.` } : {}),
        sources
      };
    }
  }

  // ---------- Raid ----------
  {
    const cands = candidates(cls, spec, "raid", guide);
    if (cands.length) {
      const consensus = cands.find((c) => c.from === "consensus");
      const guides = cands.filter((c) => c.from === "guide");
      const entry = site?.[cls]?.[spec]?.raid || {};
      let best; const why = []; const sources = [];
      const forced = r.override?.raid;
      if (forced) best = cands.find((c) => c.label === forced.label || c.also?.label === forced.label);
      if (best) {
        why.push(best.from === "guide" ? `This is ${poss(gOf(best).name)} ${best.label} build${gOf(best).updated ? ` (${gOf(best).updated})` : ""}.` : `It is the exact loadout most top raiders in our data run.`);
      } else if (consensus?.also) {
        best = consensus;
        why.push(`Top raiders and ${gOf(best).name} agree: this is the exact loadout most top raiders in our data run, and it matches ${poss(gOf(best).name)} ${consensus.also.label} build.`);
      } else if (consensus && guides.length) {
        const sameHero = guides.filter((g) => g.check.hero === consensus.check.hero);
        if (sameHero.length) {
          // Closest guide build to what top raiders run.
          const dist = (g) => { const d = diffBuilds(g.check, consensus.check); return d.onlyA.length + d.onlyB.length + d.rankDiff.length; };
          sameHero.sort((a, b) => dist(a) - dist(b));
          best = sameHero[0];
          const d = diffBuilds(best.check, consensus.check);
          why.push(`Top raiders in our data play ${consensus.check.hero}, and this is ${poss(gOf(best).name)} ${best.label} build for it${gOf(best).updated ? ` (${gOf(best).updated})` : ""}.`);
          why.push(d.onlyA.length + d.onlyB.length <= 6
            ? `It is within ${d.onlyA.length + d.onlyB.length} talent${d.onlyA.length + d.onlyB.length === 1 ? "" : "s"} of the most-copied raid loadout${entry.sampleSize ? `, which comes from only ${entry.sampleSize} sampled builds` : ""}; the guide build is the safer default.`
            : `It differs from the most-copied raid loadout in several places${entry.sampleSize ? ` (that one comes from only ${entry.sampleSize} sampled builds)` : ""}; use the switch above to compare.`);
        } else {
          best = consensus;
          why.push(`Top raiders in our data play ${consensus.check.hero}, and this is the exact loadout most of them run.`);
          why.push(`${poss(guide.name)} raid builds use ${list([...new Set(guides.map((g) => g.check.hero))])} instead, so treat that as the alternative.`);
        }
      } else {
        best = consensus || guides[0];
        why.push(best.from === "guide" ? `This is ${poss(gOf(best).name)} ${best.label} build${gOf(best).updated ? ` (${gOf(best).updated})` : ""}.` : `It is the exact loadout most top raiders in our data run.`);
      }
      if (forced?.note) why.push(forced.note);
      for (const c of cands) log(`  raid ${c === best ? "*" : " "} ${c.check.hero}  ${c.label}${c.also ? " = " + c.also.label : ""}`);
      if (gOf(best) && (best.from === "guide" || best.also || guides.length)) sources.push({ name: gOf(best).name, url: gOf(best).url });
      why.push("Raid picks lean on guides because there is no large per-talent sample of raiders to check against; swap talents for specific bosses as your raid needs.");
      picks[cls] ||= {}; picks[cls][spec] ||= {};
      picks[cls][spec].raid = {
        code: best.code,
        headline: `${best.check.hero} for raid, ${best.from === "guide" ? `following ${poss(gOf(best).name)} current build` : "matching what top raiders in our data run"}.`,
        why,
        sources
      };
    }
  }
}
console.log(JSON.stringify(picks, null, 2));
