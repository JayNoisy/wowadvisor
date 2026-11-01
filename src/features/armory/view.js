// Armory view: look up a character via /api/armory-import, show a paperdoll and the active loadout code.

import { findClass } from "../../data/classes.js";
import { $, html, raw, copyText, flashLabel, escapeHtml } from "../../lib/dom.js";
import { slugify, clamp } from "../../lib/format.js";
import { on } from "../../lib/events.js";
import { toast } from "../../lib/toast.js";
import { listCharacters, getCharacter, upsertCharacter, normalizeRegion } from "../tracker/store.js";

const SLOTS = {
  left: [["head", "Head"], ["neck", "Neck"], ["shoulder", "Shoulder"], ["back", "Back"], ["chest", "Chest"], ["shirt", "Shirt"], ["tabard", "Tabard"], ["wrist", "Wrist"]],
  right: [["hands", "Hands"], ["waist", "Waist"], ["legs", "Legs"], ["feet", "Feet"], ["finger_1", "Ring"], ["finger_2", "Ring"], ["trinket_1", "Trinket"], ["trinket_2", "Trinket"]],
  weapons: [["main_hand", "Main hand"], ["off_hand", "Off hand"]]
};
const SLOT_ALIASES = { mainhand: "main_hand", offhand: "off_hand", finger1: "finger_1", finger2: "finger_2", trinket1: "trinket_1", trinket2: "trinket_2" };

let els = {};
let gearBySlot = new Map();
let busy = false;
const model = { rx: 0, ry: 0, zoom: 1.15 };

export function initArmoryView() {
  els = {
    form: $("#armoryForm"),
    region: $("#armoryRegion"),
    realm: $("#armoryRealm"),
    name: $("#armoryName"),
    submit: $("#armorySubmit"),
    status: $("#armoryStatus"),
    saved: $("#savedChars"),
    result: $("#armoryResult"),
    tooltip: $("#itemTooltip")
  };

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    lookup();
  });
  [els.realm, els.name, els.region].forEach((input) => input.addEventListener("input", syncSubmit));

  $("#armorySaveOnly").addEventListener("click", () => {
    const realm = els.realm.value.trim();
    const name = els.name.value.trim();
    if (!slugify(realm) || !slugify(name)) {
      setStatus("Enter a realm and character name first.", "error");
      return;
    }
    const c = upsertCharacter({ region: normalizeRegion(els.region.value), realm, name });
    if (c) setStatus(`${c.name} is saved to your characters and the lockout tracker.`, "ok");
  });

  els.saved.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-char]");
    if (!chip) return;
    const c = getCharacter(chip.dataset.char);
    if (!c) return;
    els.region.value = c.region;
    els.realm.value = c.realm;
    els.name.value = c.name;
    syncSubmit();
    lookup();
  });

  els.result.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action='copy-loadout']");
    if (!btn) return;
    const code = $("#armoryLoadout", els.result)?.value || "";
    const ok = await copyText(code);
    flashLabel(btn, ok ? "Copied" : "Copy failed");
    if (ok) toast("Loadout code copied. Paste it into Import in your talent window.");
  });

  // Gear tooltips follow the pointer; keyboard focus shows them next to the slot.
  els.result.addEventListener("pointerover", (e) => {
    const slot = e.target.closest("[data-slot]");
    if (slot) showTooltip(slot, e.clientX, e.clientY);
  });
  els.result.addEventListener("pointermove", (e) => {
    if (!els.tooltip.hidden && e.target.closest("[data-slot]")) placeTooltip(e.clientX, e.clientY);
  });
  els.result.addEventListener("pointerout", (e) => {
    if (e.target.closest("[data-slot]") && !e.relatedTarget?.closest?.("[data-slot]")) hideTooltip();
  });
  els.result.addEventListener("focusin", (e) => {
    const slot = e.target.closest("[data-slot]");
    if (!slot) return;
    const r = slot.getBoundingClientRect();
    showTooltip(slot, r.right, r.top);
  });
  els.result.addEventListener("focusout", hideTooltip);

  on("characters:changed", renderSaved);
  renderSaved();
  syncSubmit();
}

function syncSubmit() {
  els.submit.disabled = busy || !(slugify(els.realm.value) && slugify(els.name.value));
}

function setStatus(text, tone = "") {
  els.status.textContent = text;
  els.status.dataset.tone = tone;
  els.status.hidden = !text;
}

function renderSaved() {
  const chars = listCharacters();
  els.saved.hidden = chars.length === 0;
  if (!chars.length) return;
  els.saved.innerHTML = html`
    <span class="saved-label">Your characters</span>
    ${chars.map((c) => {
      const cls = findClass(c.className);
      return raw(html`<button type="button" class="char-chip" data-char="${c.id}" style="--cc:${cls?.color || "var(--accent)"}">
        <span class="char-chip-name">${c.name}</span><span class="char-chip-realm">${c.realm}</span></button>`);
    })}`;
}

async function lookup() {
  const region = normalizeRegion(els.region.value);
  const realm = slugify(els.realm.value);
  const character = slugify(els.name.value);
  if (!realm || !character) {
    setStatus("Enter a realm and character name.", "error");
    return;
  }
  busy = true;
  syncSubmit();
  hideTooltip();
  setStatus(`Looking up ${els.name.value.trim()} on ${els.realm.value.trim()}…`, "busy");
  els.result.setAttribute("aria-busy", "true");
  try {
    const params = new URLSearchParams({ region, realm, character });
    const res = await fetch(`/api/armory-import?${params}`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = payload?.message || payload?.error;
      if (res.status === 404) throw new Error(msg || "Character not found. Check the realm and name spelling, and the region.");
      throw new Error(msg || `The Armory lookup failed (HTTP ${res.status}). Try again in a moment.`);
    }
    renderResult(payload, region);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(/Failed to fetch|NetworkError/i.test(message)
      ? "Couldn't reach the Armory service. Check your connection, or run the site with `vercel dev` locally so /api routes work."
      : message, "error");
  } finally {
    busy = false;
    els.result.removeAttribute("aria-busy");
    syncSubmit();
  }
}

function overallIlvl(p) {
  const eq = Number(p?.gear?.equippedItemLevel);
  if (eq > 0) return eq;
  const avg = Number(p?.gear?.averageItemLevel);
  if (avg > 0) return avg;
  const lv = (p?.gear?.items || []).map((i) => Number(i?.itemLevel)).filter((n) => n > 0);
  return lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : null;
}

const pct = (v) => {
  const n = Number(v);
  if (!(n > 0)) return null;
  const r = Math.round(n * 10) / 10;
  return `${Number.isInteger(r) ? r : r.toFixed(1)}%`;
};

const qualityClass = (q) => {
  const s = String(q || "").toLowerCase();
  if (s.includes("legendary")) return "q-legendary";
  if (s.includes("epic")) return "q-epic";
  if (s.includes("rare")) return "q-rare";
  if (s.includes("uncommon")) return "q-uncommon";
  return "q-common";
};

function renderResult(p, region) {
  const ch = p?.character || {};
  const name = String(ch.name || p?.characterSlug || "Unknown");
  const realm = String(ch.realm || p?.realmSlug || "");
  const className = String(ch.className || "");
  const spec = String(ch.activeSpec || "").trim();
  const level = Number(ch.level);
  const cls = findClass(className);
  const ilvl = overallIlvl(p);
  const code = String(p?.loadoutCodes?.[0]?.code || "").trim();
  const render = String(p?.media?.renderUrl || p?.media?.avatarUrl || "").trim();

  const saved = upsertCharacter({ region, realm, realmSlug: p?.realmSlug || realm, name, characterSlug: p?.characterSlug || name, className, specName: spec });

  gearBySlot = new Map();
  (p?.gear?.items || []).forEach((item) => {
    const raw = String(item?.slotType || item?.slot || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const key = SLOT_ALIASES[raw] || raw;
    if (key && !gearBySlot.has(key)) gearBySlot.set(key, item);
  });

  const stats = [
    ["Crit", pct(p?.stats?.critPct)],
    ["Haste", pct(p?.stats?.hastePct)],
    ["Mastery", pct(p?.stats?.masteryPct)],
    ["Versatility", pct(p?.stats?.versatilityPct)]
  ].filter(([, v]) => v);

  els.result.style.setProperty("--cc", cls?.color || "var(--accent)");
  els.result.hidden = false;
  els.result.innerHTML = html`
    <header class="hero-char">
      ${cls ? raw(html`<img class="hero-char-crest" src="${cls.icon}" alt="" width="64" height="64" />`) : ""}
      <div class="hero-char-id">
        <h2>${name}</h2>
        <p>${[Number.isFinite(level) ? `Level ${level}` : "", spec, className].filter(Boolean).join(" ")}${realm ? `, ${realm}` : ""}</p>
      </div>
      ${ilvl ? raw(html`<div class="ilvl"><strong>${Math.round(ilvl)}</strong><span>item level</span></div>`) : ""}
    </header>

    ${stats.length ? raw(html`<dl class="char-stats">${stats.map(([k, v]) => raw(html`<div><dt>${k}</dt><dd>${v}</dd></div>`))}</dl>`) : ""}

    <div class="paperdoll">
      <ul class="gear-col gear-left">${SLOTS.left.map(([k, label]) => raw(slotHtml(k, label, "left")))}</ul>
      <figure class="model${render ? " has-model" : ""}" id="armoryModel">
        ${render
          ? raw(html`<img id="armoryModelImg" src="${render}" alt="${name}'s character model" decoding="async" />`)
          : raw(`<figcaption class="muted">No character render available.</figcaption>`)}
      </figure>
      <ul class="gear-col gear-right">${SLOTS.right.map(([k, label]) => raw(slotHtml(k, label, "right")))}</ul>
      <ul class="gear-weapons">${SLOTS.weapons.map(([k, label]) => raw(slotHtml(k, label, "left")))}</ul>
    </div>

    <section class="loadout-plate armory-loadout">
      <label class="loadout-label" for="armoryLoadout">Active loadout code</label>
      ${code
        ? raw(html`
          <div class="loadout-row">
            <input id="armoryLoadout" class="loadout-code" type="text" readonly spellcheck="false" value="${code}" />
            <button type="button" class="btn btn-primary" data-action="copy-loadout">Copy code</button>
          </div>
          <p class="plate-help">In game: open Talents, choose the loadout dropdown, Import, then paste.</p>`)
        : raw(`<p class="muted">Blizzard didn't return a loadout code for this character. Log in once on the character so the Armory refreshes, then try again.</p>`)}
      ${p?.armoryUrl ? raw(html`<a class="link-btn" href="${p.armoryUrl}" target="_blank" rel="noopener noreferrer">Open on worldofwarcraft.com</a>`) : ""}
    </section>
  `;

  setStatus(saved ? `${name} is saved to your characters and the lockout tracker.` : "", "ok");
  bindModel();
}

function slotHtml(key, label, side) {
  const item = gearBySlot.get(key);
  const q = qualityClass(item?.quality);
  const lvl = Number(item?.itemLevel);
  return html`
    <li>
      <button type="button" class="gear-slot gear-${side} ${item ? q : "is-empty"}" data-slot="${key}" data-label="${label}"
        aria-label="${item ? `${label}: ${item.name}${lvl > 0 ? `, item level ${lvl}` : ""}` : `${label}: empty`}">
        <span class="gear-icon">${item?.iconUrl ? raw(html`<img src="${item.iconUrl}" alt="" width="44" height="44" loading="lazy" decoding="async" />`) : ""}</span>
        <span class="gear-text">
          <span class="gear-name">${item?.name || label}</span>
          <span class="gear-ilvl">${item ? (lvl > 0 ? lvl : "") : "Empty"}</span>
        </span>
      </button>
    </li>`;
}

function tooltipHtml(item, label) {
  if (!item) return html`<p class="tt-title">${label}</p><p class="tt-muted">Nothing equipped.</p>`;
  const d = item.details && typeof item.details === "object" ? item.details : {};
  const lines = (arr, cls = "") => (Array.isArray(arr) ? arr : [arr]).filter((l) => String(l || "").trim())
    .map((l) => `<p class="tt-line ${cls}">${escapeHtml(l)}</p>`).join("");
  const lvl = Number(item.itemLevel);
  return [
    `<p class="tt-title ${qualityClass(item.quality)}">${escapeHtml(item.name || "Unknown item")}</p>`,
    lines(d.difficultyLine, "tt-good"),
    lines(lvl > 0 ? `Item Level ${lvl}` : "", "tt-gold"),
    lines(d.upgradeLine ? `Upgrade level: ${d.upgradeLine}` : ""),
    lines([label, d.gearKindLine].filter(Boolean).join("  ·  ")),
    lines(d.armorLine),
    lines(d.weaponLines),
    lines(d.statLines),
    lines(d.enchantmentLines, "tt-good"),
    lines(d.socketLines),
    lines(d.spellLines, "tt-good"),
    lines(d.requirementLines, "tt-muted"),
    lines(d.durabilityLine, "tt-muted")
  ].join("");
}

function showTooltip(slotEl, x, y) {
  const item = gearBySlot.get(slotEl.dataset.slot);
  els.tooltip.innerHTML = tooltipHtml(item, slotEl.dataset.label);
  els.tooltip.hidden = false;
  placeTooltip(x, y);
}

function placeTooltip(x, y) {
  const m = 16;
  const r = els.tooltip.getBoundingClientRect();
  let left = x + m;
  let top = y + m;
  if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width - m);
  if (top + r.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - r.height - 8);
  els.tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

function hideTooltip() {
  els.tooltip.hidden = true;
}

function bindModel() {
  const fig = $("#armoryModel");
  const img = $("#armoryModelImg");
  if (!fig || !img) return;
  img.addEventListener("error", () => {
    fig.classList.remove("has-model");
    fig.innerHTML = `<figcaption class="muted">The character render couldn't load.</figcaption>`;
  }, { once: true });
  const apply = () => {
    img.style.transform = `perspective(900px) rotateX(${model.rx}deg) rotateY(${model.ry}deg) scale(${model.zoom})`;
  };
  model.rx = 0; model.ry = 0; model.zoom = 1.15;
  apply();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  fig.addEventListener("pointermove", (e) => {
    const r = fig.getBoundingClientRect();
    model.ry = clamp(((e.clientX - r.left) / r.width - 0.5) * 14, -8, 8);
    model.rx = clamp(-((e.clientY - r.top) / r.height - 0.5) * 10, -6, 6);
    apply();
  });
  fig.addEventListener("pointerleave", () => { model.rx = 0; model.ry = 0; apply(); });
  fig.addEventListener("wheel", (e) => {
    e.preventDefault();
    model.zoom = clamp(model.zoom + (e.deltaY < 0 ? 0.08 : -0.08), 0.8, 2.4);
    apply();
  }, { passive: false });
}
