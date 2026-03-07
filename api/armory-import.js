const REGION_DEFAULT = "us";
const LOCALE_BY_REGION = {
  us: "en_US",
  eu: "en_GB",
  kr: "ko_KR",
  tw: "zh_TW"
};
const ARMORY_PATH_LOCALE_BY_REGION = {
  us: "en-us",
  eu: "en-gb",
  kr: "ko-kr",
  tw: "zh-tw"
};

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function toName(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") return String(v.en_US || v.en_GB || v.ko_KR || v.zh_TW || v.name || "").trim();
  return "";
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = toName(v);
    if (s) return s;
  }
  return "";
}

function slugifyProfilePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickRegion(value) {
  const region = String(value || REGION_DEFAULT).toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOCALE_BY_REGION, region) ? region : REGION_DEFAULT;
}

async function fetchOAuthToken(region) {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error("Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET");
    err.status = 500;
    throw err;
  }

  const tokenUrl = `https://${region}.battle.net/oauth/token`;
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body
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

async function fetchApi(url, token) {
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    let msg = `Blizzard API ${res.status}`;
    try {
      const payload = await res.json();
      if (payload?.detail) msg = String(payload.detail);
      if (payload?.title) msg = String(payload.title);
    } catch {
      // Keep fallback message.
    }
    const err = new Error(msg);
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }
  return res.json();
}

function extractActiveSpecName(payload) {
  const direct = firstNonEmpty(payload?.active_specialization?.name, payload?.active_specialization);
  if (direct) return direct;

  const list = Array.isArray(payload?.specializations) ? payload.specializations : [];
  for (const spec of list) {
    if (spec?.active || spec?.is_active || spec?.selected) {
      const name = firstNonEmpty(spec?.specialization?.name, spec?.name, spec?.spec?.name);
      if (name) return name;
    }
  }

  const first = list[0];
  return firstNonEmpty(first?.specialization?.name, first?.name, first?.spec?.name);
}

function looksLikeTalentCode(value) {
  const text = String(value || "").trim();
  if (!text || text.length < 20) return false;
  if (text.includes("http://") || text.includes("https://")) return false;
  if (/\s/.test(text)) return false;
  return /^[A-Za-z0-9+/=_-]{20,}$/.test(text);
}

function collectLoadoutCodes(root) {
  const found = [];
  const seenCodes = new Set();
  const visited = new Set();

  const walk = (value, path = "", depth = 0) => {
    if (depth > 8 || value == null) return;
    if (typeof value === "string") {
      if (looksLikeTalentCode(value)) {
        const code = value.trim();
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          found.push({ code, source: path || "unknown" });
        }
      }
      return;
    }
    if (typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        walk(value[i], `${path}[${i}]`, depth + 1);
      }
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const keyPath = path ? `${path}.${key}` : key;
      if (typeof child === "string" && /(loadout|talent|import).*(code|string)|code/i.test(key) && looksLikeTalentCode(child)) {
        const code = child.trim();
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          found.push({ code, source: keyPath });
        }
      }
      walk(child, keyPath, depth + 1);
    }
  };

  walk(root, "");
  return found.slice(0, 5);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const region = pickRegion(req.query.region);
  const locale = LOCALE_BY_REGION[region] || LOCALE_BY_REGION.us;
  const realmSlug = slugifyProfilePart(req.query.realm || "");
  const characterSlug = slugifyProfilePart(req.query.character || "");

  if (!realmSlug || !characterSlug) {
    return json(res, 400, { error: "Missing required query params: realm and character" });
  }

  const namespace = `profile-${region}`;
  const profileUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;
  const specsUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}/specializations?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;

  try {
    const token = await fetchOAuthToken(region);
    const [profile, specs] = await Promise.all([
      fetchApi(profileUrl, token),
      fetchApi(specsUrl, token)
    ]);

    const characterName = firstNonEmpty(profile?.name, characterSlug);
    const realmName = firstNonEmpty(profile?.realm?.name, profile?.realm?.slug, realmSlug);
    const className = firstNonEmpty(profile?.character_class?.name, profile?.playable_class?.name);
    const faction = firstNonEmpty(profile?.faction?.name);
    const activeSpec = extractActiveSpecName(specs);
    const level = Number(profile?.level) || null;
    const armoryLocalePath = ARMORY_PATH_LOCALE_BY_REGION[region] || "en-us";
    const armoryUrl = `https://worldofwarcraft.blizzard.com/${armoryLocalePath}/character/${region}/${realmSlug}/${characterSlug}`;
    const loadoutCodes = collectLoadoutCodes(specs);

    res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=1200");
    return json(res, 200, {
      generatedAt: new Date().toISOString(),
      region,
      realmSlug,
      characterSlug,
      armoryUrl,
      character: {
        name: characterName,
        realm: realmName,
        className,
        activeSpec,
        faction,
        level
      },
      loadoutCodes
    });
  } catch (error) {
    const status = Number(error?.status) || 500;
    return json(res, status, {
      error: "Failed to fetch armory character data",
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
