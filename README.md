# WoW Advisor

A one-stop companion for World of Warcraft.

**Builds.** Consensus talent builds for every spec. Talents from top-ranked players and curated guides are weighted by how often they appear, and the strongest loadout for each class / spec / content type is published as a copyable import code, with stat priorities (re-ranked for your Mythic+ key and affixes) and rotation priority lists.

**Tools.**

- **This week** – Great Vault planner (raid bosses, logged Mythic+ keys, world activities) and an editable weekly checklist, per character, cleared at each region's weekly reset. One button imports the week's keys from Raider.IO, and the live WoW Token price sits beside the reset countdown.
- **Lockouts** – Mythic dungeon lockouts per character.
- **Mythic+** – the season guide: which affixes each key level adds, the four weekly Bargains, every dungeon's timer with the +2 and +3 cut-offs, and rating rewards. The week's affixes fill in from Raider.IO when it's reachable.
- **Group check** – pick five specs and see what the party covers: Bloodlust, battle res, interrupts, dispels by type, raid buffs.
- **Armory** – look up a character's gear and copy their active loadout code, with their Mythic+ rating, best run per dungeon and raid progress from Raider.IO.
- **Macros** – a macro builder (mouseover, focus, cursor, modifier and more) that works in both editions.
- **Resources** – community sites sorted by need, with deep links for your saved characters.
- **Search** – `Ctrl/Cmd + K` or `/` jumps to any spec, tool or saved character.

A light/dark theme toggle follows the system setting until you pick one.

A switch in the sidebar flips the whole site to the **WoW Forever** edition (warmer palette, serif headlines): every Forever class with its three talent trees (gold talents at 11/16/21/31 points, key talents, how it plays, stat priority), which races can play each class, a launch/raid countdown, a dungeons-and-raids page with a level slider that shows which of the new and classic dungeons fit your level, a level guide (talent points, gold-talent and dual-spec unlocks by level) and an editable to-do list. Forever content lives in `src/data/forever.js` and is based on Blizzard's beta class deep dives, so update it if talents change after launch.

## Project layout

```
index.html                 App shell (Vite entry)
src/
  main.js                  Wires features together, hash routing between views
  data/                    Static game data: classes & specs, rotations, spell icons, stat text, Mythic+ dungeons
    forever.js             WoW Forever classes, talent trees, races, dungeons, raids and launch dates
    weekly.js              Great Vault thresholds and the starter weekly checklist
    party.js               What each spec brings to a group (Bloodlust, battle res, dispels, buffs...)
    macros.js              Macro templates
    links.js               Community sites and per-character deep links
  lib/                     Small helpers: DOM/html templating, router, storage, events, formatting, toast,
                           icons (inline SVG), color (ink on class colors), theme (light/dark),
                           raiderio (Raider.IO public API), token (WoW Token price)
  features/
    builds/                Builds view, builds.json loading, stat/rotation guidance, Mythic+ context, copy tracking
    home/                  Tool tiles under the class picker
    search/                Ctrl+K search palette
    weekly/                Great Vault planner + weekly checklist (store.js, view.js)
    tracker/               Saved characters, reset timing and dungeon lockouts (store) and the Lockouts view
    mplus/                 Mythic+ season guide (view.js) and the shared "Your key" controls (key-panel.js)
    party/                 Group check
    armory/                Armory lookup and paperdoll (view.js), Raider.IO card (rio.js)
    macros/                Macro builder
    links/                 Resources
    levels/                WoW Forever level guide
    auth/                  Optional Supabase sign-in
    forever/               WoW Forever classes view (view.js), dungeons & raids (atlas.js), to-do list (todo.js)
  styles/                  tokens.css (design tokens: 2 themes x 2 editions), base, shell, then one stylesheet per area
assets/                    Class crests, logo and hero art (optimised .webp)
builds.json                Generated build data (kept at repo root; see below)
api/                       Vercel serverless functions (wow-token.js is new; the rest are unchanged)
Tools/update-builds/       Data pipeline scripts run by GitHub Actions (unchanged)
supabase/                  SQL for the user_build_events table
```

URLs are shareable: `#builds/shaman/elemental/aoe`, `#weekly`, `#tracker`, `#mplus`, `#party`, `#armory`, `#links`, `#macros`, and for WoW Forever `#forever/shaman/enhancement`, `#atlas`, `#levels` and `#todo`.

### Design system

The chrome is neutral so the 13 class colors can be the palette: class tiles and the class header are solid blocks of the class color, with ink (near-black or white) picked for contrast by `lib/color.js`. Every component reads tokens from `styles/tokens.css`, which swaps values on two attributes of `<html>`: `data-theme` (`dark` / `light`) and `data-edition` (`retail` / `forever`).

Fonts are self-hosted from npm `@fontsource-variable` packages, so there are no Google Fonts requests: Archivo (wide and heavy for headlines, normal width for text) and Fraunces for WoW Forever headlines.

### Game data to keep current

- `data/mythic.js` – **update the `SEASON` block each season**: the Mythic+ dungeon pool with timers, the affix ladder by key level, the weekly Bargains and rating milestones (currently Midnight Season 2, patch 12.1). Also weekly reset times (US Tuesday 15:00 UTC, EU Wednesday 04:00 UTC; KR/TW unverified) and the Mythic lockout dungeon list.
- `data/weekly.js` – Great Vault thresholds (2/4/6 raid bosses, 1/4/8 Mythic+ runs, 2/4/8 world activities as of Midnight Season 2).
- `data/party.js` – class utility and raid buffs (follows the Midnight raid-buff changes).

### Outside services the browser calls

- **Raider.IO** (`https://raider.io/api/v1`, no key) for character rating/runs/raid progress and the week's affixes. Every call fails soft: if Raider.IO is down or blocked, those cards hide and manual entry still works.
- **wow.zamimg.com** for spell icons on rotation lists.

## Development

```bash
npm install
npm run dev        # front end only, http://localhost:5173 (no /api routes)
vercel dev         # front end + /api functions together (needs the Vercel CLI and env vars)
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
```

`builds.json` and `assets/` stay at the repo root because the GitHub workflow and the API functions read them there. The Vite config copies both into `dist/` at build time (it skips files over 600 KB, so the original high-res PNGs in `assets/` are never deployed).

## Deploying (Vercel)

`vercel.json` sets the framework to Vite, the build command to `npm run build` and the output directory to `dist`. The `api/` functions deploy as before.

Environment variables:

| Variable | Used by |
| --- | --- |
| `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET` | `/api/armory-import`, `/api/talent-trees`, `/api/wow-token` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `/api/auth-config` (front end reads it to enable sign-in) |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/build-events`, `/api/build-alerts` |

Sign-in is optional. Without Supabase config the account button is hidden and copied builds are tracked on the device only. You can also provide the public config via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, the `wowadvisor-supabase-*` meta tags in `index.html`, or `window.WOW_ADVISOR_AUTH`.

## API routes

- `GET /api/armory-import?region=us&realm=illidan&character=thrall` – character profile, gear, stats and loadout codes from the Blizzard API.
- `GET /api/wow-token?region=us` – current WoW Token price in gold from the Blizzard Game Data API. The token tile and price chip only appear when this route answers.
- `GET /api/auth-config` – public Supabase config for the front end.
- `POST /api/build-events` (authenticated) – stores a copy event for the signed-in user.
- `GET /api/build-alerts` (authenticated) – compares the user's copied builds against the current `builds.json`.
- `GET /api/talent-trees` – Blizzard talent tree data (not used by the current UI).

## Build data pipeline

`.github/workflows/update-builds.yml` runs every 12 hours: it seeds Archon and curated guide sources, runs `Tools/update-builds/update-builds.js`, regenerates `talent-trees.json`, and commits the results.

`update-builds.js` merges Murlok (PvE/PvP top players), Peavers, Archon snapshots, curated guides (Wowhead / Method / Icy Veins) and optional external JSON feeds. Optional remote feeds are configured with comma-separated `url|label` values in `ARCHON_BUILD_SOURCE_URLS`, `CURATED_GUIDE_SOURCE_URLS` and `EXTRA_BUILD_SOURCE_URLS` (repo Variables first, Secrets as fallback). Local feeds can be placed in `Tools/update-builds/sources/archon-builds.json` and `curated-guides.json` (see the `.example.json` files), or generated with:

```bash
node Tools/update-builds/seed-curated-sources.js
```

Feed entries need `className`, `specName`, `mode` (`aoe`, `raid`, `pvp`) and `exportString`; `title`, `source`, `updated`, `notes` and `selectedTalents` are optional.

## Local storage keys

The app keeps these in the browser (v1 keys are unchanged, so existing data carries over):

- `wowadvisor_copied_builds_v1` – builds you've copied, for update notices
- `wowadvisor_mythic_lockouts_v1` – saved characters and dungeon lockouts
- `wowadvisor_auth_remember_v1` – "keep me signed in" preference
- `wowadvisor_mythic_context_v3` – your key level, this week's Fortified/Tyrannical and Bargain
- `wowadvisor_last_build_v2` – the last spec you viewed, reopened on your next visit
- `wowadvisor_edition_v1` – Retail or Forever, whichever you used last
- `wowadvisor_forever_last_v1`, `wowadvisor_forever_faction_v1` – last Forever class/tree and faction filter
- `wowadvisor_forever_level_v1`, `wowadvisor_forever_cleared_v1`, `wowadvisor_forever_dungeon_filter_v1` – dungeons page level (shared with the level guide), done dungeons and filter
- `wowadvisor_theme_v1` – light or dark, once you've picked one
- `wowadvisor_weekly_v1` – Great Vault counts, logged keys, checklist ticks and your custom tasks
- `wowadvisor_party_v1`, `wowadvisor_macro_v1` – your Group check party and last macro
- `wowadvisor_forever_todo_v1` – your WoW Forever to-do list and ticks
