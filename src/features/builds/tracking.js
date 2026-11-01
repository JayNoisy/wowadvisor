// Remembers copied builds (locally, and in Supabase when signed in) and flags ones that changed since.

import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { normalizeKey, normalizeMode, isoOrEmpty } from "../../lib/format.js";
import { emit } from "../../lib/events.js";
import { getCurrentSnapshot, hasBuildData } from "./data.js";
import { getUser, getClient, getAccessToken } from "../auth/session.js";

let tracked = [];
let syncSource = "local";

const trackingKey = (className, specName, mode) =>
  `${normalizeKey(className)}::${normalizeKey(specName)}::${normalizeMode(mode)}`;

export function getTracked() {
  return { items: tracked, source: syncSource };
}

/** A copied build is outdated when the current recommendation has a different loadout code. */
function compare(entry) {
  const current = getCurrentSnapshot(entry.className, entry.specName, entry.mode);
  const copied = String(entry.copiedExportString || "").trim();
  return {
    className: entry.className,
    specName: entry.specName,
    mode: normalizeMode(entry.mode),
    copiedAt: entry.copiedAt || null,
    copiedTitle: entry.copiedTitle || null,
    currentTitle: current?.title || null,
    currentUpdatedAt: current?.updatedAt || null,
    hasCurrent: Boolean(current),
    outdated: Boolean(current && copied && copied !== current.exportString)
  };
}

function localEntries() {
  const map = readJson(KEYS.copiedBuilds, {});
  return Object.values(map && typeof map === "object" ? map : {}).filter((r) => r && typeof r === "object" && r.className);
}

function rememberLocal(cls, spec, mode, build) {
  const map = readJson(KEYS.copiedBuilds, {});
  map[trackingKey(cls.name, spec.name, mode)] = {
    className: cls.name,
    specName: spec.name,
    mode: normalizeMode(mode),
    copiedAt: new Date().toISOString(),
    copiedTitle: build.title || null,
    copiedUpdatedAt: isoOrEmpty(build.updated) || null,
    copiedExportString: build.exportString
  };
  writeJson(KEYS.copiedBuilds, map);
}

function merge(...lists) {
  const out = new Map();
  lists.flat().forEach((item) => {
    if (!item?.className) return;
    const key = trackingKey(item.className, item.specName, item.mode);
    const prev = out.get(key);
    const ts = (x) => new Date(x?.copiedAt || 0).getTime() || 0;
    if (!prev || ts(item) >= ts(prev)) out.set(key, item);
  });
  return [...out.values()].sort((a, b) => (new Date(b.copiedAt || 0) - new Date(a.copiedAt || 0)));
}

async function sha256(value) {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return value;
  }
}

async function saveRemote(payload) {
  const token = await getAccessToken();
  if (token) {
    try {
      const res = await fetch("/api/build-events", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) return true;
    } catch {
      // fall through to direct insert
    }
  }
  // Direct insert (RLS-protected) when the serverless route isn't available, e.g. local dev.
  const client = getClient();
  const user = getUser();
  if (!client || !user) return false;
  const buildUpdatedAt = isoOrEmpty(payload.buildUpdated) || null;
  const fingerprint = await sha256([
    normalizeKey(payload.className), normalizeKey(payload.specName), normalizeMode(payload.mode),
    payload.exportString, buildUpdatedAt || ""
  ].join("|"));
  const score = Number(payload.confidenceScore);
  const { error } = await client.from("user_build_events").insert({
    user_id: user.id,
    action: "copy",
    class_name: payload.className,
    spec_name: payload.specName,
    mode: normalizeMode(payload.mode),
    export_string: payload.exportString,
    build_fingerprint: fingerprint,
    build_title: payload.buildTitle || null,
    build_updated_at: buildUpdatedAt,
    confidence_score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null
  });
  return !error;
}

async function loadRemote() {
  const token = await getAccessToken();
  if (token) {
    try {
      const res = await fetch("/api/build-alerts", { headers: { authorization: `Bearer ${token}` } });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload?.tracked)) return { items: payload.tracked, source: "account" };
      }
    } catch {
      // fall through
    }
  }
  const client = getClient();
  if (!client || !getUser()) return null;
  const { data, error } = await client
    .from("user_build_events")
    .select("class_name,spec_name,mode,export_string,build_updated_at,build_title,created_at")
    .eq("action", "copy")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !Array.isArray(data)) return null;
  const latest = new Map();
  data.forEach((row) => {
    const key = trackingKey(row.class_name, row.spec_name, row.mode);
    if (!latest.has(key)) latest.set(key, row);
  });
  const items = [...latest.values()].map((row) => compare({
    className: row.class_name,
    specName: row.spec_name,
    mode: row.mode,
    copiedAt: row.created_at,
    copiedTitle: row.build_title,
    copiedExportString: row.export_string
  }));
  return { items, source: "account" };
}

/** Re-evaluates tracked builds. Local copies always count; account history is merged in when signed in. */
export async function refreshTracked() {
  if (!hasBuildData()) return;
  const local = localEntries().map(compare);
  let items = local;
  syncSource = "local";
  if (getUser()) {
    const remote = await loadRemote().catch(() => null);
    if (remote) {
      items = merge(remote.items, local);
      syncSource = remote.source;
    }
  } else {
    items = merge(local);
  }
  tracked = items;
  emit("tracked:changed", getTracked());
}

export async function recordCopy(cls, spec, mode, build) {
  rememberLocal(cls, spec, mode, build);
  await refreshTracked();
  if (!getUser()) return;
  const ok = await saveRemote({
    action: "copy",
    className: cls.name,
    specName: spec.name,
    mode,
    exportString: build.exportString,
    buildUpdated: build.updated || null,
    buildTitle: build.title || null,
    confidenceScore: build.confidenceScore ?? null
  }).catch(() => false);
  if (ok) await refreshTracked();
}
