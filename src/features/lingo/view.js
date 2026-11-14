// Lingo and commands: a filterable glossary of player shorthand and a slash-command cheat sheet.

import { LINGO, LINGO_GROUPS, COMMANDS, COMMAND_GROUPS } from "../../data/lingo.js";
import { $, html, raw, copyText } from "../../lib/dom.js";
import { normalizeKey } from "../../lib/format.js";
import { toast } from "../../lib/toast.js";

let els = {};
const state = { tab: "lingo", query: "" };
const editionNow = () => document.documentElement.dataset.edition || "retail";

export function initLingoView() {
  els = { body: $("#lingoBody") };
  els.body.addEventListener("input", (e) => {
    if (!e.target.matches("#lingoSearch")) return;
    state.query = e.target.value;
    renderList();
  });
  els.body.addEventListener("click", async (e) => {
    const tab = e.target.closest("[data-lingo-tab]");
    if (tab) {
      state.tab = tab.dataset.lingoTab;
      render();
      $(`[data-lingo-tab="${state.tab}"]`, els.body)?.focus();
      return;
    }
    const copy = e.target.closest("[data-copy-cmd]");
    if (copy) {
      const ok = await copyText(copy.dataset.copyCmd);
      toast(ok ? `Copied ${copy.dataset.copyCmd}` : "Couldn't reach the clipboard. Select the command and copy it manually.", ok ? undefined : "error");
    }
  });
}

export function showLingo() {
  render();
}

function matches(item, q) {
  if (!q) return true;
  return normalizeKey(`${item.term || item.cmd} ${item.also || ""} ${item.text}`).includes(q);
}

function visible(list) {
  const ed = editionNow();
  const q = normalizeKey(state.query);
  // A search looks through both editions; browsing shows only what applies to the one you're in.
  return list.filter((i) => matches(i, q) && (q || !i.ed || i.ed === ed));
}

function render() {
  els.body.innerHTML = html`
    <div class="lingo-bar">
      <div class="segmented" role="radiogroup" aria-label="What to show">
        <button type="button" role="radio" data-lingo-tab="lingo" class="${state.tab === "lingo" ? "is-active" : ""}" aria-checked="${String(state.tab === "lingo")}">What people say</button>
        <button type="button" role="radio" data-lingo-tab="commands" class="${state.tab === "commands" ? "is-active" : ""}" aria-checked="${String(state.tab === "commands")}">Slash commands</button>
      </div>
      <label class="field lingo-search">
        <span class="visually-hidden">Filter</span>
        <input id="lingoSearch" type="search" placeholder="${state.tab === "lingo" ? "Try BiS, kick or lockout" : "Try reload, marker or whisper"}" value="${state.query}" autocomplete="off" />
      </label>
    </div>
    <div id="lingoList" aria-live="polite"></div>
  `;
  renderList();
}

function renderList() {
  const el = $("#lingoList", els.body);
  if (!el) return;
  const isLingo = state.tab === "lingo";
  const items = visible(isLingo ? LINGO : COMMANDS);
  const groups = isLingo ? LINGO_GROUPS : COMMAND_GROUPS;
  if (!items.length) {
    el.innerHTML = html`<p class="muted lingo-empty">Nothing matches "${state.query}". Try a shorter word.</p>`;
    return;
  }
  el.innerHTML = groups.map((g) => {
    const rows = items.filter((i) => i.group === g);
    if (!rows.length) return "";
    return html`
      <section class="lingo-group">
        <h2 class="section-title">${g}</h2>
        <dl class="lingo-list">
          ${rows.map((i) => raw(isLingo
            ? html`<div class="lingo-row"><dt>${i.term}</dt><dd>${i.text}${i.ed ? raw(html` <span class="lingo-ed">${i.ed === "forever" ? "WoW Forever" : "Retail"}</span>`) : ""}</dd></div>`
            : html`<div class="lingo-row is-cmd"><dt>${/[{,]| to /.test(i.cmd)
                ? raw(html`<code class="cmd">${i.cmd}</code>`)
                : raw(html`<button type="button" class="cmd" data-copy-cmd="${i.cmd}" aria-label="Copy ${i.cmd}">${i.cmd}</button>`)}</dt><dd>${i.text}</dd></div>`))}
        </dl>
      </section>`;
  }).join("");
}
