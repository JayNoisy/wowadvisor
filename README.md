# WoW Advisor

Consensus talent builds for every World of Warcraft spec. Talents from top-ranked players and curated guides are weighted by how often they appear, and the strongest loadout for each class / spec / content type is published as a copyable import code.

Also includes stat priorities (re-ranked for your Mythic+ key and affixes), rotation priority lists, a Mythic dungeon lockout tracker, and an Armory lookup that shows gear and the character's active loadout code.

A switch in the top bar flips the whole site to the **WoW Forever** edition (its own warm palette and type): every Forever class with its three talent trees (gold talents at 11/16/21/31 points, key talents, how it plays, stat priority), which races can play each class, a launch/raid countdown, and a dungeons-and-raids page with a level slider that shows which of the new and classic dungeons fit your level. Forever content lives in `src/data/forever.js` and is based on Blizzard's beta class deep dives, so update it if talents change after launch.

## Project layout

```
index.html                 App shell (Vite entry)
src/
  main.js                  Wires features together, hash routing between views
  data/                    Static game data: classes & specs, rotations, spell icons, stat text, Mythic+ dungeons
    forever.js             WoW Forever classes, talent trees, races, dungeons, raids and launch dates
  lib/                     Small helpers: DOM/html templating, router, storage, events, formatting, toast
  features/
    builds/                Builds view, builds.json loading, stat/rotation guidance, Mythic+ context, copy tracking
    tracker/               Saved characters + dungeon lockouts (store) and the Tracker view
    armory/                Armory lookup and paperdoll
    auth/                  Optional Supabase sign-in
    forever/               WoW Forever classes view (view.js) and dungeons & raids view (atlas.js)
  styles/                  tokens.css (design tokens for both editions) + one stylesheet per area
assets/                    Class crests, logo and hero art (optimised .webp)
builds.json                Generated build data (kept at repo root; see below)
api/                       Vercel serverless functions (unchanged)
Tools/update-builds/       Data pipeline scripts run by GitHub Actions (unchanged)
supabase/                  SQL for the user_build_events table
```

URLs are shareable: `#builds/shaman/elemental/aoe`, `#tracker`, `#armory`, and for WoW Forever `#forever/shaman/enhancement` and `#atlas`.

Fonts (Bricolage Grotesque, Instrument Sans, Cinzel) are self-hosted from npm `@fontsource` packages, so there are no Google Fonts requests.

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
| `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET` | `/api/armory-import`, `/api/talent-trees` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `/api/auth-config` (front end reads it to enable sign-in) |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/build-events`, `/api/build-alerts` |

Sign-in is optional. Without Supabase config the account button is hidden and copied builds are tracked on the device only. You can also provide the public config via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, the `wowadvisor-supabase-*` meta tags in `index.html`, or `window.WOW_ADVISOR_AUTH`.

## API routes

- `GET /api/armory-import?region=us&realm=illidan&character=thrall` – character profile, gear, stats and loadout codes from the Blizzard API.
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
- `wowadvisor_mythic_context_v2` – your key level and affixes
- `wowadvisor_last_build_v2` – the last spec you viewed, reopened on your next visit
- `wowadvisor_edition_v1` – Retail or Forever, whichever you used last
- `wowadvisor_forever_last_v1`, `wowadvisor_forever_faction_v1` – last Forever class/tree and faction filter
- `wowadvisor_forever_level_v1`, `wowadvisor_forever_cleared_v1`, `wowadvisor_forever_dungeon_filter_v1` – dungeons page level, done dungeons and filter
