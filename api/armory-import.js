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

async function tryFetchApi(url, token) {
  try {
    return await fetchApi(url, token);
  } catch {
    return null;
  }
}

function parseHrefId(href) {
  const text = String(href || "");
  const match = text.match(/\/(\d+)(?:\/)?(?:\?|$)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function extractCharacterRender(mediaPayload) {
  const assets = Array.isArray(mediaPayload?.assets) ? mediaPayload.assets : [];
  const pick = (key) => {
    const row = assets.find((asset) => String(asset?.key || "").toLowerCase() === key);
    return String(row?.value || "").trim();
  };
  const renderUrl = pick("main-raw") || pick("main") || pick("inset");
  const avatarUrl = pick("avatar") || pick("head");
  return { renderUrl: renderUrl || null, avatarUrl: avatarUrl || null };
}

function extractItemIconUrl(mediaPayload) {
  const assets = Array.isArray(mediaPayload?.assets) ? mediaPayload.assets : [];
  const icon = assets.find((asset) => String(asset?.key || "").toLowerCase() === "icon");
  if (icon?.value) return String(icon.value).trim();
  const fallback = assets.find((asset) => String(asset?.value || "").trim().length > 0);
  return fallback?.value ? String(fallback.value).trim() : null;
}

async function fetchItemIconMap(region, locale, token, itemIds) {
  const ids = Array.from(new Set(
    (Array.isArray(itemIds) ? itemIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
  ));
  if (ids.length === 0) return new Map();

  const namespace = `static-${region}`;
  const rows = await Promise.all(ids.map(async (id) => {
    const url = `https://${region}.api.blizzard.com/data/wow/media/item/${id}?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;
    const payload = await tryFetchApi(url, token);
    const iconUrl = extractItemIconUrl(payload);
    return [id, iconUrl || null];
  }));

  return new Map(rows);
}

function textFromAny(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "object") return "";
  return firstNonEmpty(
    value.display_string,
    value.display?.display_string,
    value.description,
    value.name,
    value.type,
    value.value
  );
}

function compactTextList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => textFromAny(value))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractItemDetailLines(row) {
  const bindText = firstNonEmpty(row?.binding?.name, row?.binding?.type, row?.binding);
  const itemClass = firstNonEmpty(
    row?.item_class?.name,
    row?.item_class?.type,
    row?.itemClass?.name,
    row?.itemClass?.type
  );
  const inventoryType = firstNonEmpty(
    row?.inventory_type?.name,
    row?.inventory_type?.type,
    row?.inventoryType?.name,
    row?.inventoryType?.type
  );
  const subclass = firstNonEmpty(row?.item_subclass?.name, row?.item_subclass?.type);
  const gearTypeBase = [itemClass, subclass].filter(Boolean).join(" - ");
  const gearKindLine = gearTypeBase
    ? (inventoryType ? `${gearTypeBase} (${inventoryType})` : gearTypeBase)
    : (inventoryType || null);

  const armorLine = firstNonEmpty(
    row?.armor?.display?.display_string,
    row?.armor?.display_string,
    Number.isFinite(Number(row?.armor?.value)) ? `${Number(row.armor.value)} Armor` : ""
  );

  const weaponLines = compactTextList([
    row?.weapon?.display?.display_string,
    row?.weapon?.damage?.display_string,
    row?.weapon?.attack_speed?.display_string,
    row?.weapon?.dps?.display_string
  ]);

  const stats = Array.isArray(row?.stats) ? row.stats : [];
  const statLines = stats
    .map((stat) => {
      const displayText = firstNonEmpty(stat?.display?.display_string, stat?.display_string);
      if (displayText) return displayText;
      const value = Number(stat?.value);
      const statName = firstNonEmpty(stat?.type?.name, stat?.stat?.name, stat?.name);
      if (Number.isFinite(value) && statName) return `${value > 0 ? "+" : ""}${value} ${statName}`;
      return "";
    })
    .filter(Boolean);

  const enchantmentLines = compactTextList(
    (Array.isArray(row?.enchantments) ? row.enchantments : []).map((enchant) => (
      firstNonEmpty(enchant?.display_string, enchant?.enchantment?.display_string, enchant?.name)
    ))
  );

  const spellLines = compactTextList(
    (Array.isArray(row?.spells) ? row.spells : []).map((spell) => (
      firstNonEmpty(spell?.description, spell?.spell_tooltip?.description, spell?.spell?.name)
    ))
  );

  const socketLines = compactTextList(
    (Array.isArray(row?.sockets) ? row.sockets : []).map((socket) => {
      const socketType = firstNonEmpty(socket?.socket_type?.name, socket?.type?.name, "Socket");
      const insertedGem = firstNonEmpty(socket?.item?.name, socket?.gem?.name);
      return insertedGem ? `${socketType}: ${insertedGem}` : socketType;
    })
  );

  const durabilityValue = Number(row?.durability?.value);
  const durabilityMax = Number(row?.durability?.max);
  const durabilityLine = Number.isFinite(durabilityValue) && Number.isFinite(durabilityMax) && durabilityMax > 0
    ? `Durability ${durabilityValue} / ${durabilityMax}`
    : firstNonEmpty(row?.durability?.display_string, row?.durability?.display?.display_string);

  const requirementLines = [];
  const requiredLevel = Number(row?.requirements?.level?.value ?? row?.requirements?.level);
  if (Number.isFinite(requiredLevel) && requiredLevel > 0) {
    requirementLines.push(`Requires Level ${requiredLevel}`);
  }
  requirementLines.push(...compactTextList([
    row?.requirements?.playable_classes?.display_string,
    row?.requirements?.faction?.display_string,
    row?.requirements?.achievement?.display_string
  ]));

  const upgradeSource = row?.upgrade || row?.item_upgrade || row?.upgrade_info || row?.item_upgrade_info || null;
  const upgradeTrack = firstNonEmpty(
    upgradeSource?.upgrade_track?.name,
    upgradeSource?.track?.name,
    upgradeSource?.track,
    upgradeSource?.name
  );
  const upgradeCurrent = Number(
    upgradeSource?.current_level?.value
    ?? upgradeSource?.current_level
    ?? upgradeSource?.level?.value
    ?? upgradeSource?.level
    ?? upgradeSource?.current
  );
  const upgradeMax = Number(
    upgradeSource?.max_level?.value
    ?? upgradeSource?.max_level
    ?? upgradeSource?.max
    ?? upgradeSource?.total_levels
  );
  const upgradeDirect = firstNonEmpty(
    upgradeSource?.display_string,
    upgradeSource?.display?.display_string,
    row?.upgrade?.display_string
  );
  let upgradeLine = null;
  if (upgradeDirect) {
    upgradeLine = upgradeDirect;
  } else if (Number.isFinite(upgradeCurrent) && upgradeCurrent > 0) {
    const rankText = Number.isFinite(upgradeMax) && upgradeMax > 0
      ? `${Math.trunc(upgradeCurrent)}/${Math.trunc(upgradeMax)}`
      : `${Math.trunc(upgradeCurrent)}`;
    upgradeLine = upgradeTrack ? `${upgradeTrack} ${rankText}` : rankText;
  } else if (upgradeTrack) {
    upgradeLine = upgradeTrack;
  }

  return {
    bindText: bindText || null,
    gearKindLine: gearKindLine || null,
    upgradeLine: upgradeLine || null,
    inventoryType: inventoryType || null,
    subclass: subclass || null,
    armorLine: armorLine || null,
    weaponLines,
    statLines,
    enchantmentLines,
    spellLines,
    socketLines,
    durabilityLine: durabilityLine || null,
    requirementLines
  };
}

function normalizeGearItems(equipmentPayload, iconByItemId = null) {
  const equippedItems = Array.isArray(equipmentPayload?.equipped_items) ? equipmentPayload.equipped_items : [];
  const slotOrder = [
    "head",
    "neck",
    "shoulder",
    "back",
    "chest",
    "wrist",
    "hands",
    "waist",
    "legs",
    "feet",
    "finger_1",
    "finger_2",
    "trinket_1",
    "trinket_2",
    "main_hand",
    "off_hand"
  ];
  const slotSortIndex = new Map(slotOrder.map((key, idx) => [key, idx]));
  const items = equippedItems.map((row, idx) => {
    const slotType = String(row?.slot?.type || "").toLowerCase();
    const slot = firstNonEmpty(row?.slot?.name, row?.slot?.type, `Slot ${idx + 1}`);
    const name = firstNonEmpty(row?.name, row?.item?.name, `Item ${idx + 1}`);
    const itemLevel = Number(row?.level?.value ?? row?.level ?? row?.item_level ?? 0) || null;
    const quality = firstNonEmpty(row?.quality?.name, row?.quality?.type);
    const itemId = Number(row?.item?.id ?? parseHrefId(row?.item?.key?.href ?? row?.item?.href));
    const normalizedId = Number.isFinite(itemId) ? itemId : null;
    const detailLines = extractItemDetailLines(row);
    return {
      slot,
      slotType,
      name,
      itemLevel,
      quality: quality || null,
      itemId: normalizedId,
      iconUrl: normalizedId && iconByItemId instanceof Map ? (iconByItemId.get(normalizedId) || null) : null,
      details: detailLines
    };
  });
  items.sort((a, b) => {
    const ai = slotSortIndex.has(a.slotType) ? slotSortIndex.get(a.slotType) : 999;
    const bi = slotSortIndex.has(b.slotType) ? slotSortIndex.get(b.slotType) : 999;
    if (ai !== bi) return ai - bi;
    return String(a.slot).localeCompare(String(b.slot));
  });
  return items;
}

function extractGearSummary(equipmentPayload, items) {
  const equippedItemLevel = Number(equipmentPayload?.equipped_item_level) || null;
  const averageItemLevel = Number(equipmentPayload?.average_item_level) || null;
  return {
    equippedItemLevel,
    averageItemLevel,
    totalItems: Array.isArray(items) ? items.length : 0,
    items: Array.isArray(items) ? items : []
  };
}

function readNumericStat(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const num = Number(match[0]);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function pickStatValue(statsPayload, keyOptions, valueKeys) {
  if (!statsPayload || typeof statsPayload !== "object") return null;
  for (const key of keyOptions) {
    const row = statsPayload[key];
    if (row == null) continue;

    const direct = readNumericStat(row);
    if (Number.isFinite(direct)) return direct;
    if (typeof row !== "object") continue;

    for (const valueKey of valueKeys) {
      const numeric = readNumericStat(row[valueKey]);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return null;
}

function extractCharacterStats(statsPayload) {
  return {
    critPct: pickStatValue(statsPayload, ["spell_crit", "melee_crit", "ranged_crit"], ["value", "rating_bonus"]),
    hastePct: pickStatValue(statsPayload, ["spell_haste", "melee_haste", "ranged_haste"], ["value", "rating_bonus"]),
    masteryPct: pickStatValue(statsPayload, ["mastery"], ["value", "rating_bonus"]),
    versatilityPct: pickStatValue(statsPayload, ["versatility"], ["damage_done_bonus", "healing_done_bonus", "rating_bonus", "value"])
  };
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
  const mediaUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}/character-media?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;
  const equipmentUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}/equipment?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;
  const statsUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterSlug}/statistics?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;

  try {
    const token = await fetchOAuthToken(region);
    const [profile, specs, media, equipment, stats] = await Promise.all([
      fetchApi(profileUrl, token),
      fetchApi(specsUrl, token),
      tryFetchApi(mediaUrl, token),
      tryFetchApi(equipmentUrl, token),
      tryFetchApi(statsUrl, token)
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
    const mediaPayload = extractCharacterRender(media);
    const rawGearItems = normalizeGearItems(equipment);
    const iconByItemId = await fetchItemIconMap(region, locale, token, rawGearItems.map((item) => item.itemId));
    const gearItems = normalizeGearItems(equipment, iconByItemId);
    const gearPayload = extractGearSummary(equipment, gearItems);
    const statsPayload = extractCharacterStats(stats);

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
      media: mediaPayload,
      gear: gearPayload,
      stats: statsPayload,
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
