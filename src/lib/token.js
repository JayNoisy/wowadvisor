// WoW Token gold price, from our /api/wow-token route. Returns null when the route isn't available
// (for example in `npm run dev`, which doesn't run API routes).

const cache = new Map(); // region -> { at, data }
const TTL = 10 * 60_000;

export async function fetchTokenPrice(region = "us") {
  const hit = cache.get(region);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  let data = null;
  try {
    const res = await fetch(`/api/wow-token?region=${encodeURIComponent(region)}`);
    if (res.ok) {
      const payload = await res.json();
      const gold = Number(payload?.gold);
      if (Number.isFinite(gold) && gold > 0) data = { region, gold, updatedAt: payload.updatedAt || null };
    }
  } catch {
    data = null;
  }
  cache.set(region, { at: Date.now(), data });
  return data;
}

export const formatGold = (gold) => `${Math.round(gold).toLocaleString()}g`;
