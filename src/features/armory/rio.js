// Mythic+ rating, best runs and raid progress for a character, from Raider.IO.

import { html, raw } from "../../lib/dom.js";
import { fetchProfile, formatClock } from "../../lib/raiderio.js";
import { icon } from "../../lib/icons.js";

function runRow(r) {
  const timed = r.upgrades > 0;
  const time = formatClock(r.clearMs);
  const status = timed ? `Timed${r.upgrades > 1 ? ` (+${r.upgrades})` : ""}` : "Over time";
  return html`
    <li class="run${timed ? " is-timed" : ""}">
      <span class="run-level">+${r.level}</span>
      <span class="run-name">${r.dungeon}</span>
      <span class="run-time">${time ? `${time}, ` : ""}${status.toLowerCase()}</span>
    </li>`;
}

function raidRow(r) {
  // Show the hardest difficulty with any kills.
  const [label, killed] = r.mythic ? ["Mythic", r.mythic] : r.heroic ? ["Heroic", r.heroic] : ["Normal", r.normal];
  const pct = Math.round((killed / r.total) * 100);
  return html`
    <li class="raid-prog-row">
      <div class="raid-prog-top"><span>${r.name}</span><span>${killed}/${r.total} ${label}</span></div>
      <div class="raid-bar" role="img" aria-label="${killed} of ${r.total} bosses on ${label}"><i style="width:${pct}%"></i></div>
    </li>`;
}

function cardHtml(profile, name) {
  const { rating, bestRuns, raids, profileUrl } = profile;
  const hasAnything = rating != null || bestRuns.length || raids.length;
  if (!hasAnything) {
    return html`<p class="muted">Raider.IO has no Mythic+ or raid data for ${name} this season.</p>`;
  }
  return html`
    <header class="rio-head">
      <div>
        <h3 class="card-title">Mythic+ and raids</h3>
        <p class="card-sub">This season, from Raider.IO.</p>
      </div>
      ${rating != null ? raw(html`<p class="rio-rating"><strong>${Math.round(rating).toLocaleString()}</strong><span>Mythic+ rating</span></p>`) : ""}
    </header>
    <div class="rio-cols">
      <div>
        <p class="rio-sub">Best run in each dungeon</p>
        ${bestRuns.length
          ? raw(html`<ul class="runs">${bestRuns.map((r) => raw(runRow(r)))}</ul>`)
          : raw(`<p class="muted">No keys completed yet this season.</p>`)}
      </div>
      <div>
        <p class="rio-sub">Raid progress</p>
        ${raids.length
          ? raw(html`<ul class="raid-prog">${raids.slice(0, 4).map((r) => raw(raidRow(r)))}</ul>`)
          : raw(`<p class="muted">No raid kills recorded.</p>`)}
      </div>
    </div>
    ${profileUrl ? raw(html`<a class="link-btn" href="${profileUrl}" target="_blank" rel="noopener noreferrer">Open the full profile on Raider.IO</a>`) : ""}
  `;
}

let requestId = 0;

/** Loads and renders the card into `el`. Hides the card if Raider.IO can't be reached or doesn't know the character. */
export async function showRio(el, { region, realm, name }) {
  const mine = ++requestId;
  el.hidden = false;
  el.setAttribute("aria-busy", "true");
  el.innerHTML = html`<p class="muted">${raw(icon("clock"))} Checking Raider.IO for ${name}'s Mythic+ runs…</p>`;
  const profile = await fetchProfile({ region, realm, name });
  if (mine !== requestId) return; // a newer lookup replaced this one
  el.removeAttribute("aria-busy");
  if (!profile) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.innerHTML = cardHtml(profile, name);
}

export function hideRio(el) {
  requestId++;
  el.hidden = true;
  el.innerHTML = "";
}
