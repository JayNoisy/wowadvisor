const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const text = String(header);
  if (!text.toLowerCase().startsWith("bearer ")) return null;
  const token = text.slice(7).trim();
  return token || null;
}

function getSupabaseConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").trim(),
    anonKey: String(process.env.SUPABASE_ANON_KEY || "").trim(),
    serviceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  };
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeIsoDate(value) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function buildFingerprint({ className, specName, mode, exportString, buildUpdatedAt }) {
  const input = [
    normalizeKey(className),
    normalizeKey(specName),
    normalizeKey(mode),
    String(exportString || "").trim(),
    String(buildUpdatedAt || "").trim()
  ].join("|");
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeBuild(rawBuild) {
  if (!rawBuild || typeof rawBuild !== "object") return null;
  const core = rawBuild.selected && typeof rawBuild.selected === "object" ? rawBuild.selected : rawBuild;
  if (!core || typeof core !== "object") return null;
  return {
    title: core.title ?? rawBuild.title ?? null,
    updated: core.updated ?? rawBuild.updated ?? null,
    exportString: core.exportString ?? rawBuild.exportString ?? ""
  };
}

function mapCurrentBuildFingerprints(buildsRoot) {
  const byKey = new Map();
  if (!buildsRoot || typeof buildsRoot !== "object") return byKey;

  for (const [className, classBucket] of Object.entries(buildsRoot)) {
    if (!classBucket || typeof classBucket !== "object") continue;
    for (const [specName, specBucket] of Object.entries(classBucket)) {
      if (!specBucket || typeof specBucket !== "object") continue;
      for (const [mode, rawBuild] of Object.entries(specBucket)) {
        const normalized = normalizeBuild(rawBuild);
        if (!normalized?.exportString) continue;
        const buildUpdatedAt = normalizeIsoDate(normalized.updated);
        const fingerprint = buildFingerprint({
          className,
          specName,
          mode,
          exportString: normalized.exportString,
          buildUpdatedAt
        });
        const key = `${normalizeKey(className)}::${normalizeKey(specName)}::${normalizeKey(mode)}`;
        byKey.set(key, {
          className,
          specName,
          mode,
          title: normalized.title || null,
          updated: buildUpdatedAt,
          fingerprint
        });
      }
    }
  }
  return byKey;
}

async function readBuildsRoot() {
  const filePath = path.join(process.cwd(), "builds.json");
  const raw = await fs.readFile(filePath, "utf8");
  const payload = JSON.parse(raw);
  if (payload && typeof payload === "object" && payload.builds && typeof payload.builds === "object") {
    return payload.builds;
  }
  return payload;
}

async function resolveSupabaseUser(config, accessToken) {
  const res = await fetch(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${accessToken}`
    }
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchUserCopyEvents(config, userId) {
  const params = new URLSearchParams();
  params.set("select", "class_name,spec_name,mode,build_fingerprint,build_title,build_updated_at,created_at");
  params.set("user_id", `eq.${userId}`);
  params.set("action", "eq.copy");
  params.set("order", "created_at.desc");
  params.set("limit", "500");

  const res = await fetch(`${config.url}/rest/v1/user_build_events?${params.toString()}`, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`
    }
  });
  if (!res.ok) {
    const details = await res.text();
    throw new Error(details.slice(0, 600));
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const config = getSupabaseConfig();
  if (!config.url || !config.serviceRoleKey) {
    return json(res, 500, {
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    });
  }

  const accessToken = readBearerToken(req);
  if (!accessToken) {
    return json(res, 401, { error: "Missing bearer token" });
  }

  const user = await resolveSupabaseUser(config, accessToken);
  if (!user?.id) {
    return json(res, 401, { error: "Invalid auth token" });
  }

  let buildsRoot;
  try {
    buildsRoot = await readBuildsRoot();
  } catch (error) {
    return json(res, 500, {
      error: "Unable to load builds.json",
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const currentBuilds = mapCurrentBuildFingerprints(buildsRoot);
  let rows = [];
  try {
    rows = await fetchUserCopyEvents(config, user.id);
  } catch (error) {
    return json(res, 500, {
      error: "Unable to load user build events",
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const latestByKey = new Map();
  for (const row of rows) {
    const key = `${normalizeKey(row?.class_name)}::${normalizeKey(row?.spec_name)}::${normalizeKey(row?.mode)}`;
    if (!key || latestByKey.has(key)) continue;
    latestByKey.set(key, row);
  }

  const outdated = [];
  const tracked = [];
  for (const [key, latestCopy] of latestByKey.entries()) {
    const current = currentBuilds.get(key);
    const copiedClassName = String(latestCopy?.class_name || "").trim();
    const copiedSpecName = String(latestCopy?.spec_name || "").trim();
    const copiedMode = String(latestCopy?.mode || "").trim();
    const isOutdated = Boolean(
      current &&
      latestCopy?.build_fingerprint &&
      latestCopy.build_fingerprint !== current.fingerprint
    );

    tracked.push({
      className: current?.className || copiedClassName,
      specName: current?.specName || copiedSpecName,
      mode: current?.mode || copiedMode,
      copiedAt: latestCopy.created_at || null,
      copiedTitle: latestCopy.build_title || null,
      copiedUpdatedAt: latestCopy.build_updated_at || null,
      currentTitle: current?.title || null,
      currentUpdatedAt: current?.updated || null,
      hasCurrent: Boolean(current),
      outdated: isOutdated
    });

    if (!isOutdated) continue;
    outdated.push({
      className: current.className,
      specName: current.specName,
      mode: current.mode,
      copiedAt: latestCopy.created_at || null,
      copiedTitle: latestCopy.build_title || null,
      copiedUpdatedAt: latestCopy.build_updated_at || null,
      currentTitle: current.title || null,
      currentUpdatedAt: current.updated || null
    });
  }

  res.setHeader("cache-control", "no-store");
  return json(res, 200, {
    checkedAt: new Date().toISOString(),
    trackedModes: latestByKey.size,
    outdatedCount: outdated.length,
    outdated,
    tracked
  });
};
