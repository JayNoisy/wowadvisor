const crypto = require("node:crypto");

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

function normalizeText(value, maxLen = 160) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.slice(0, maxLen);
}

function normalizeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "aoe" || mode === "raid" || mode === "pvp") return mode;
  return mode.slice(0, 24) || "unknown";
}

function normalizeConfidenceScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeIsoDate(value) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function buildFingerprint({ className, specName, mode, exportString, buildUpdatedAt }) {
  const input = [
    String(className || "").trim().toLowerCase(),
    String(specName || "").trim().toLowerCase(),
    String(mode || "").trim().toLowerCase(),
    String(exportString || "").trim(),
    String(buildUpdatedAt || "").trim()
  ].join("|");
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    const raw = req.body.trim();
    if (!raw) return {};
    return JSON.parse(raw);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
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

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON body" });
  }

  const className = normalizeText(body.className, 80);
  const specName = normalizeText(body.specName, 80);
  const mode = normalizeMode(body.mode);
  const exportString = normalizeText(body.exportString, 2048);
  const action = String(body.action || "copy").trim().toLowerCase() === "view" ? "view" : "copy";

  if (!className || !specName || !mode || !exportString) {
    return json(res, 400, {
      error: "className, specName, mode, and exportString are required"
    });
  }

  const buildUpdatedAt = normalizeIsoDate(body.buildUpdated);
  const fingerprint = buildFingerprint({
    className,
    specName,
    mode,
    exportString,
    buildUpdatedAt
  });

  const record = {
    user_id: user.id,
    action,
    class_name: className,
    spec_name: specName,
    mode,
    export_string: exportString,
    build_fingerprint: fingerprint,
    build_title: normalizeText(body.buildTitle, 180) || null,
    build_updated_at: buildUpdatedAt,
    confidence_score: normalizeConfidenceScore(body.confidenceScore)
  };

  const insertRes = await fetch(`${config.url}/rest/v1/user_build_events`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(record)
  });

  if (!insertRes.ok) {
    const details = await insertRes.text();
    return json(res, 500, {
      error: "Failed to store build event",
      details: details.slice(0, 600)
    });
  }

  const inserted = await insertRes.json().catch(() => []);
  return json(res, 200, {
    ok: true,
    eventId: inserted?.[0]?.id || null,
    buildFingerprint: fingerprint
  });
};
