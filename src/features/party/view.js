// Group check: pick five specs and see what the party covers (and what it's missing).

import { CLASSES, findClass, findSpec } from "../../data/classes.js";
import { kitFor, ALL_BUFFS, DISPEL_TYPES, PARTY_SLOTS } from "../../data/party.js";
import { $, html, raw } from "../../lib/dom.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { classStyle } from "../../lib/color.js";
import { icon } from "../../lib/icons.js";

let els = {};
// Each slot holds "class-slug/spec-slug" or "".
let slots = load();

function load() {
  const saved = readJson(KEYS.party, null);
  return PARTY_SLOTS.map((_, i) => (Array.isArray(saved) && typeof saved[i] === "string" ? saved[i] : ""));
}

export function initPartyView() {
  els = { body: $("#partyBody") };

  els.body.addEventListener("change", (e) => {
    const select = e.target.closest("select[data-slot]");
    if (!select) return;
    slots[Number(select.dataset.slot)] = select.value;
    writeJson(KEYS.party, slots);
    render();
    // Re-rendering replaces the select; put focus back where the player was.
    $(`select[data-slot="${select.dataset.slot}"]`, els.body)?.focus();
  });

  els.body.addEventListener("click", (e) => {
    if (!e.target.closest("[data-action='clear-party']")) return;
    slots = PARTY_SLOTS.map(() => "");
    writeJson(KEYS.party, slots);
    render();
  });
}

export function showParty() {
  render();
}

function member(value) {
  const [classSlug, specSlug] = String(value || "").split("/");
  const cls = findClass(classSlug);
  const spec = findSpec(cls, specSlug);
  return cls && spec ? { cls, spec, kit: kitFor(cls.name, spec.name), label: `${spec.name} ${cls.name}` } : null;
}

function slotHtml(slot, i) {
  const m = member(slots[i]);
  return html`
    <div class="party-slot${m ? " is-filled" : ""}" style="${m ? classStyle(m.cls.color) : ""}">
      ${m ? raw(html`<img src="${m.cls.icon}" alt="" width="44" height="44" />`) : raw(`<span class="party-slot-blank" aria-hidden="true"></span>`)}
      <label class="party-slot-field">
        <span>${slot.label}</span>
        <select data-slot="${i}">
          <option value="">Empty</option>
          ${CLASSES.filter((c) => c.specs.some((s) => s.role === slot.role)).map((c) => raw(html`
            <optgroup label="${c.name}">
              ${c.specs.filter((s) => s.role === slot.role).map((s) => {
                const value = `${c.slug}/${s.slug}`;
                return raw(html`<option value="${value}" ${value === slots[i] ? raw("selected") : ""}>${s.name} ${c.name}</option>`);
              })}
            </optgroup>`))}
        </select>
      </label>
    </div>`;
}

/** One coverage row: who provides it, or a clear "missing". */
function coverRow(label, providers, { optional = false, detail = "" } = {}) {
  const has = providers.length > 0;
  const state = has ? "has" : optional ? "none" : "missing";
  return html`
    <li class="cover cover-${state}">
      <span class="cover-mark">${raw(has ? icon("check") : icon("x"))}</span>
      <div class="cover-body">
        <p class="cover-label">${label}${detail ? raw(html` <span class="muted">${detail}</span>`) : ""}</p>
        <p class="cover-who">${has ? providers.join(", ") : optional ? "Nobody brings this." : "Missing."}</p>
      </div>
    </li>`;
}

function render() {
  const members = slots.map(member).filter(Boolean);
  const by = (fn) => members.filter((m) => fn(m.kit)).map((m) => `${m.label} (${fn(m.kit)})`);

  const lust = by((k) => k.lust);
  const brez = by((k) => k.brez);
  const kicks = members.filter((m) => m.kit.interrupt);
  const noKick = members.filter((m) => !m.kit.interrupt);
  const soothe = by((k) => k.soothe);
  const purge = by((k) => k.purge);
  const buffsHave = members.filter((m) => m.kit.buff);
  const haveClasses = new Set(buffsHave.map((m) => m.cls.name));
  const buffsMissing = ALL_BUFFS.filter((b) => !haveClasses.has(b.className));

  const gaps = [];
  if (members.length) {
    if (!lust.length) gaps.push("Bloodlust");
    if (!brez.length) gaps.push("battle res");
    DISPEL_TYPES.filter((d) => d.key !== "bleed").forEach((d) => {
      if (!members.some((m) => m.kit.dispels[d.key])) gaps.push(`${d.label.toLowerCase()} dispel`);
    });
  }
  const listed = gaps.length > 1 ? `${gaps.slice(0, -1).join(", ")} and ${gaps[gaps.length - 1]}` : gaps[0];

  els.body.innerHTML = html`
    <section class="card party-build" aria-labelledby="partyBuildHeading">
      <header class="card-head">
        <div>
          <h2 id="partyBuildHeading" class="card-title">Your party</h2>
          <p class="card-sub">Pick a spec for each slot. Your picks are saved on this device.</p>
        </div>
        ${members.length ? raw(`<button type="button" class="btn btn-quiet btn-sm" data-action="clear-party">Clear party</button>`) : ""}
      </header>
      <div class="party-slots">${PARTY_SLOTS.map((s, i) => raw(slotHtml(s, i)))}</div>
    </section>

    ${members.length === 0 ? raw(html`
      <div class="empty-state">
        <h3>Add your first player</h3>
        <p>Pick a spec in any slot above and the coverage report fills in as you go.</p>
      </div>`) : raw(html`
      <p class="party-verdict ${gaps.length ? "has-gaps" : "is-clean"}" role="status">
        ${gaps.length
          ? `Missing: ${listed}.`
          : members.length < PARTY_SLOTS.length ? "No gaps so far. Fill the remaining slots to finish the check." : "This group covers every essential."}
      </p>

      <div class="party-report">
        <section class="card" aria-labelledby="essentialsHeading">
          <h2 id="essentialsHeading" class="card-title">Essentials</h2>
          <ul class="cover-list">
            ${raw(coverRow("Bloodlust", lust))}
            ${raw(coverRow("Battle res", brez))}
            ${raw(coverRow("Interrupts", kicks.map((m) => `${m.label} (${m.kit.interrupt})`), {
              detail: `${kicks.length} of ${members.length} players`
            }))}
            ${noKick.length ? raw(html`<li class="cover-note muted">No interrupt: ${noKick.map((m) => m.label).join(", ")}.</li>`) : ""}
          </ul>
        </section>

        <section class="card" aria-labelledby="dispelHeading">
          <h2 id="dispelHeading" class="card-title">Dispels</h2>
          <ul class="cover-list">
            ${DISPEL_TYPES.map((d) => raw(coverRow(d.label, members.filter((m) => m.kit.dispels[d.key]).map((m) => `${m.label} (${m.kit.dispels[d.key]})`), { optional: d.key === "bleed" })))}
            ${raw(coverRow("Enrage", soothe, { optional: true, detail: "soothe" }))}
            ${raw(coverRow("Enemy buffs", purge, { optional: true, detail: "purge" }))}
          </ul>
        </section>

        <section class="card" aria-labelledby="buffHeading">
          <h2 id="buffHeading" class="card-title">Raid buffs</h2>
          <ul class="buff-list">
            ${buffsHave.map((m) => raw(html`
              <li class="buff is-have" style="${classStyle(m.cls.color)}">
                <span class="buff-dot" aria-hidden="true"></span>
                <span><strong>${m.kit.buff.name}</strong> <span class="muted">${m.kit.buff.text}</span></span>
              </li>`))}
          </ul>
          ${buffsHave.length ? "" : raw(`<p class="muted">Nobody in this group brings a raid buff.</p>`)}
          ${buffsMissing.length ? raw(html`
            <details class="buff-missing">
              <summary>${buffsMissing.length} buffs you don't have</summary>
              <ul class="buff-list">
                ${buffsMissing.map((b) => {
                  const cls = findClass(b.className);
                  return raw(html`<li class="buff" style="${classStyle(cls.color)}"><span class="buff-dot" aria-hidden="true"></span><span><strong>${b.name}</strong> <span class="muted">${b.className}, ${b.text}</span></span></li>`);
                })}
              </ul>
            </details>`) : ""}
        </section>
      </div>

      <p class="party-foot muted">Based on each spec's standard kit, with the spell named so you can check it. Hunter's Bloodlust needs a pet out, and Warlock dispels and interrupts depend on which demon is summoned.</p>`)}
  `;
}
