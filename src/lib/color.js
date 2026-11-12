// Picks the ink (near-black or white) that reads best on a solid class color.

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

const DARK = "#0e0f12";
const LIGHT = "#ffffff";

export function inkOn(hex) {
  const L = luminance(hex);
  // Compare contrast against both inks and take the stronger one.
  const withDark = (L + 0.05) / (luminance(DARK) + 0.05);
  const withLight = 1.05 / (L + 0.05);
  return withDark >= withLight ? DARK : LIGHT;
}

/** Inline style string that sets a class color and its matching ink. */
export function classStyle(hex) {
  return `--cc:${hex};--cc-ink:${inkOn(hex)}`;
}

/** Applies the class color to an element (or clears it when hex is falsy). */
export function setClassColor(el, hex) {
  if (!el) return;
  if (hex) {
    el.style.setProperty("--cc", hex);
    el.style.setProperty("--cc-ink", inkOn(hex));
  } else {
    el.style.removeProperty("--cc");
    el.style.removeProperty("--cc-ink");
  }
}
