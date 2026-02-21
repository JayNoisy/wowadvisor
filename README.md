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
