// Resources: a directory of community sites, with deep links for a saved character.

import { LINK_GROUPS } from "../../data/links.js";
import { findClass } from "../../data/classes.js";
import { $, html, raw } from "../../lib/dom.js";
import { on } from "../../lib/events.js";
import { classStyle } from "../../lib/color.js";
import { icon } from "../../lib/icons.js";
import { listCharacters } from "../tracker/store.js";

let els = {};
let activeId = null;

export function initLinksView() {
  els = { view: $("#view-links"), body: $("#linksBody") };

  els.body.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-char]");
    if (!tab) return;
    activeId = tab.dataset.char === activeId ? null : tab.dataset.char;
    render();
  });

  on("characters:changed", () => { if (!els.view.hidden) render(); });
}

export function showLinks() {
  render();
}

function render() {
  const chars = listCharacters();
  const who = chars.find((c) => c.id === activeId) || null;

  els.body.innerHTML = html`
    <div class="char-picker">
      ${chars.length
        ? raw(html`
          <span class="char-picker-label muted">Open links for</span>
          ${chars.map((c) => {
            const cls = findClass(c.className);
            return raw(html`
              <button type="button" class="char-tab${c.id === who?.id ? " is-active" : ""}" data-char="${c.id}" aria-pressed="${String(c.id === who?.id)}" style="${classStyle(cls?.color || "#8f96a3")}">
                ${cls ? raw(html`<img src="${cls.icon}" alt="" width="28" height="28" />`) : ""}
                <span>${c.name}</span>
              </button>`);
          })}`)
        : raw(html`<p class="char-picker-empty muted"><a href="#armory">Look up a character in Armory</a> and these links will open straight on their profile.</p>`)}
    </div>

    ${LINK_GROUPS.map((group) => raw(html`
      <section class="link-group" aria-label="${group.title}">
        <h2 class="section-title">${group.title}</h2>
        <ul class="link-grid">
          ${group.links.map((link) => {
            const personal = who && link.character;
            const href = personal ? link.character(who) : link.url;
            return raw(html`
              <li>
                <a class="link-card${personal ? " is-personal" : ""}" href="${href}" target="_blank" rel="noopener noreferrer">
                  <span class="link-name">${link.name}${raw(icon("external"))}</span>
                  <span class="link-what">${link.what}</span>
                  ${personal ? raw(html`<span class="link-for">Opens ${who.name}'s page</span>`) : ""}
                </a>
              </li>`);
          })}
        </ul>
      </section>`))}
  `;
}
