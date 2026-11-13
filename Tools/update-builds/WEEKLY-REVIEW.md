# Weekly AI build review

The site shows an "AI pick" for every Retail spec in Mythic+ and Raid. The picks live in `ai-picks.json`
(repo root) and are merged into `builds.json` by `apply-ai-picks.js`, which the 12-hour data refresh also runs,
so picks survive every refresh. A pick is dropped automatically if its code stops matching the current talent tree.

Run from `Tools/update-builds/`:

1. **Refresh the tree files** (needed after any patch that touches talents):
   `node build-talent-view.js` — rebuilds `assets/talents/*.json` and checks every code in `builds.json` still decodes.
2. **Research each spec** and record it in `research/<date>.json` (format at the top of `decide-picks.js`):
   - guide builds with their import codes: `https://www.method.gg/guides/<spec>-<class>/talents`
     (second source when codes are missing or invalid: Icy Veins' "spec builds and talents" page);
   - what the top 50 Mythic+ players take: `https://murlok.io/<class>/<spec>/m+`
     (players per hero tree, and how many take each optional talent).
3. **Score and write the picks**: `node decide-picks.js research/<date>.json > /tmp/picks.json`
   (read the log: invalid guide codes are listed and skipped), then
   `node add-picks.js /tmp/picks.json && node apply-ai-picks.js`.
4. **Check** a few specs with `node check-code.js "<Class>" "<Spec>" aoe <code>` and on the site, then commit
   `ai-picks.json`, `builds.json`, `research/<date>.json` and any changed `assets/talents/*.json`.

How picks are chosen:
- **Mythic+**: candidates are the site's top-player consensus and the guides' Mythic+ builds. The winner is the valid
  loadout on the hero tree most top players use that best matches their optional-talent choices.
- **Raid**: there is no per-talent sample of raiders, so the pick is the guide's raid build on the hero tree top raiders
  use (or the consensus when the guide agrees with it).
- **PvP** is not reviewed; the site shows the top-player consensus there.

## WoW Forever

Forever has no loadout codes or player data yet, so its trees and builds are kept by hand in `Tools/forever/`:
`trees.txt` (every talent, max rank, points its tier needs) and `builds.txt` (one recommended build per tree, with
the guide it is credited to). Both come from timesaver.gg's WoW Forever talent calculator pages
(`/tools/wow-forever/talent-calculator/<class>` and `/<class>/<tree>`). After editing either file run
`node Tools/forever/build-forever-talents.mjs`; it refuses to write if a build names a missing talent, overspends a
talent, skips a tier requirement or doesn't add up to its stated split.
