# wowadvisor
Gathers top performing builds and weighs each talent based on how common each one is. It then gives you a code to copy for each class/spec.

## Vercel Blizzard API bridge
This repo now includes a Vercel serverless function that fetches WoW talent-tree data from Blizzard without exposing your Blizzard client secret to the browser.

Endpoint:
- `GET /api/talent-trees`
- Optional query params: `region` (default `us`), `locale` (default `en_US`)

Required Vercel environment variables:
- `BLIZZARD_CLIENT_ID`
- `BLIZZARD_CLIENT_SECRET`

Example:
- `/api/talent-trees?region=us&locale=en_US`

Returned payload shape:
- `generatedAt`
- `source`
- `region`
- `locale`
- `namespace`
- `specs[]` with `className`, `specName`, and `nodes[]`

## Build source inputs (competitive consensus)
`Tools/update-builds/update-builds.js` now merges:
- Murlok (PvE/PvP top-player snapshots)
- Peavers
- Archon snapshots
- Curated guide snapshots (Wowhead / Method / Icy-Veins)
- Generic external JSON feeds

Optional local files:
- `Tools/update-builds/sources/archon-builds.json`
- `Tools/update-builds/sources/curated-guides.json`

Examples are provided:
- `Tools/update-builds/sources/archon-builds.example.json`
- `Tools/update-builds/sources/curated-guides.example.json`

Optional remote JSON feeds (comma-separated `url|label`):
- `ARCHON_BUILD_SOURCE_URLS`
- `CURATED_GUIDE_SOURCE_URLS`
- `EXTRA_BUILD_SOURCE_URLS`

GitHub Actions reads these from repo `Variables` first, then `Secrets` fallback.

You can populate local files directly:
- `Tools/update-builds/sources/archon-builds.json`
- `Tools/update-builds/sources/curated-guides.json`

All feeds should provide objects with:
- `className`
- `specName`
- `mode` (`aoe`, `raid`, `pvp`)
- `exportString`
- optional: `title`, `source`, `updated`, `notes`, `selectedTalents`

### Auto-seeding local sources
To auto-populate local source files from live pages:

```bash
node Tools/update-builds/seed-curated-sources.js
```

This fills:
- `Tools/update-builds/sources/archon-builds.json`
- `Tools/update-builds/sources/curated-guides.json`
