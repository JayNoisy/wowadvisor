// Macro builder: choose a template, type your spell names, copy the result.

import { MACROS, MACRO_LIMIT } from "../../data/macros.js";
import { $, html, raw, copyText, flashLabel } from "../../lib/dom.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { toast } from "../../lib/toast.js";

let els = {};
const saved = readJson(KEYS.macro, null);
const state = {
  id: MACROS.some((m) => m.id === saved?.id) ? saved.id : MACROS[0].id,
  spell: typeof saved?.spell === "string" ? saved.spell : "",
  spell2: typeof saved?.spell2 === "string" ? saved.spell2 : ""
};

const current = () => MACROS.find((m) => m.id === state.id) || MACROS[0];
const persist = () => writeJson(KEYS.macro, state);

function build(macro) {
  const fill = (key) => state[key].trim() || macro.example?.[key] || "";
  return macro.body.replaceAll("{spell2}", fill("spell2")).replaceAll("{spell}", fill("spell"));
}

export function initMacrosView() {
  els = { body: $("#macrosBody") };

  els.body.addEventListener("click", async (e) => {
    const pick = e.target.closest("[data-macro]");
    if (pick) {
      state.id = pick.dataset.macro;
      persist();
      render();
      $(`[data-macro="${state.id}"]`, els.body)?.focus();
      return;
    }
    const btn = e.target.closest("[data-action='copy-macro']");
    if (!btn) return;
    const ok = await copyText(build(current()));
    flashLabel(btn, ok ? "Copied" : "Copy failed");
    if (ok) toast("Macro copied. In game, type /macro, create a new macro and paste.");
    else toast("Couldn't reach the clipboard. Select the macro text and copy it manually.", "error");
  });

  // Typing updates only the output, so the inputs keep focus and cursor position.
  els.body.addEventListener("input", (e) => {
    const input = e.target.closest("[data-field]");
    if (!input) return;
    state[input.dataset.field] = input.value;
    persist();
    renderOutput();
  });
}

export function showMacros() {
  render();
}

function renderOutput() {
  const macro = current();
  const text = build(macro);
  const out = $("#macroOut", els.body);
  const count = $("#macroCount", els.body);
  if (!out || !count) return;
  out.textContent = text;
  const over = text.length > MACRO_LIMIT;
  count.textContent = over
    ? `${text.length} of ${MACRO_LIMIT} characters. Too long for one macro: shorten a spell name.`
    : `${text.length} of ${MACRO_LIMIT} characters`;
  count.classList.toggle("is-over", over);
}

function render() {
  const macro = current();
  const labels = macro.fields.length === 2
    ? { spell: "First spell", spell2: "Second spell" }
    : { spell: "Spell or ability name" };

  els.body.innerHTML = html`
    <div class="macro-list" role="radiogroup" aria-label="What should the button do?">
      ${MACROS.map((m) => raw(html`
        <button type="button" role="radio" class="macro-pick${m.id === macro.id ? " is-active" : ""}" data-macro="${m.id}" aria-checked="${String(m.id === macro.id)}">
          <span class="macro-pick-name">${m.name}</span>
          <span class="macro-pick-blurb">${m.blurb}</span>
        </button>`))}
    </div>

    <section class="card macro-build" aria-labelledby="macroHeading">
      <h2 id="macroHeading" class="card-title">${macro.name}</h2>
      <p class="card-sub">${macro.blurb}</p>

      ${macro.fields.length ? raw(html`
        <div class="macro-fields">
          ${macro.fields.map((f) => raw(html`
            <label class="field">
              <span>${labels[f]}</span>
              <input type="text" data-field="${f}" value="${state[f]}" placeholder="${macro.example?.[f] || ""}" autocomplete="off" spellcheck="false" />
            </label>`))}
        </div>
        <p class="macro-tip muted">Type the name exactly as it appears in your spellbook.</p>`) : ""}

      <pre id="macroOut" class="macro-out" tabindex="0" aria-label="Macro text"></pre>
      <div class="macro-foot">
        <p id="macroCount" class="macro-count muted" aria-live="polite"></p>
        <button type="button" class="btn btn-primary btn-lg" data-action="copy-macro">Copy macro</button>
      </div>
    </section>
  `;
  renderOutput();
}
