// Text, date and key normalisation helpers.

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  return mode === "aoe" || mode === "raid" || mode === "pvp" ? mode : "aoe";
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function parseDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  // builds.json uses "YYYY-MM-DD HH:mm:ss" (UTC) as well as ISO strings.
  const normalized = raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isoOrEmpty(value) {
  const d = parseDate(value);
  return d ? d.toISOString() : "";
}

export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return "";
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "just now";
  if (diff < hour) return `${Math.floor(diff / min)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} h ago`;
  const days = Math.floor(diff / day);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function formatDateTime(value) {
  const d = value instanceof Date ? value : parseDate(value);
  if (!d) return "";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatCountdown(target) {
  const ms = (target instanceof Date ? target.getTime() : 0) - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
