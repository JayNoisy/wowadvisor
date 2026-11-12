// GET /api/wow-token?region=us
// Current WoW Token gold price from Blizzard's Game Data API. Uses the same
// BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET as /api/armory-import.

const REGIONS = ["us", "eu", "kr", "tw"];

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function fetchOAuthToken(region) {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error("Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET");
    err.status = 500;
    throw err;
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`https://${region}.battle.net/oauth/token`, {
    method: "POST",
    headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  if (!res.ok) {
    const err = new Error(`OAuth failed with status ${res.status}`);
    err.status = 502;
    throw err;
  }
  const data = await res.json();
  if (!data?.access_token) {
    const err = new Error("OAuth response missing access_token");
    err.status = 502;
    throw err;
  }
  return data.access_token;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return json(res, 405, { error: "method_not_allowed" });
  }
  const asked = String(req.query?.region || "us").toLowerCase();
  const region = REGIONS.includes(asked) ? asked : "us";

  try {
    const token = await fetchOAuthToken(region);
    const apiRes = await fetch(`https://${region}.api.blizzard.com/data/wow/token/index?namespace=dynamic-${region}&locale=en_US`, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!apiRes.ok) return json(res, 502, { error: "blizzard_api_error", status: apiRes.status });
    const data = await apiRes.json();
    const copper = Number(data?.price);
    if (!Number.isFinite(copper) || copper <= 0) return json(res, 502, { error: "no_price" });

    // The price moves slowly; let the CDN hold it for 10 minutes.
    res.setHeader("cache-control", "public, s-maxage=600, stale-while-revalidate=3600");
    return json(res, 200, {
      region,
      gold: Math.round(copper / 10000),
      updatedAt: Number.isFinite(Number(data?.last_updated_timestamp)) ? new Date(Number(data.last_updated_timestamp)).toISOString() : null
    });
  } catch (err) {
    return json(res, err?.status || 500, { error: "token_lookup_failed", message: err?.message || "Unknown error" });
  }
};
