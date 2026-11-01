// Small DOM helpers shared by every feature.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Tagged template that escapes every interpolated value unless it was wrapped with raw(). */
export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    if (i >= values.length) return out + str;
    return out + str + toHtml(values[i]);
  }, "");
}

function toHtml(value) {
  if (value == null || value === false) return "";
  if (Array.isArray(value)) return value.map(toHtml).join("");
  if (value instanceof RawHtml) return value.value;
  return escapeHtml(value);
}

class RawHtml {
  constructor(value) { this.value = String(value ?? ""); }
}

/** Mark a string as already-safe HTML so html`` won't escape it. */
export const raw = (value) => new RawHtml(value);

/** Briefly swap a button's label (e.g. "Copied") and restore it. */
export function flashLabel(button, text, ms = 1200) {
  if (!button) return;
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;
  button.textContent = text;
  clearTimeout(button._flashTimer);
  button._flashTimer = setTimeout(() => {
    button.textContent = original;
  }, ms);
}

export async function copyText(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fallback for browsers without async clipboard permission.
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function scrollToEl(el, offset) {
  if (!el) return;
  if (offset == null) {
    const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h"));
    offset = (Number.isFinite(bar) ? bar : 68) + 12;
  }
  const top = window.scrollY + el.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
