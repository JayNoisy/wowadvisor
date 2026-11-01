// "Your copied builds" panel and the outdated-build banner under the top bar.

import { findClass } from "../../data/classes.js";
import { $, html, raw } from "../../lib/dom.js";
import { timeAgo, plural } from "../../lib/format.js";
import { on } from "../../lib/events.js";
import { modeLabel } from "../../data/classes.js";
import { getAuthState } from "../auth/session.js";
import { getTracked, refreshTracked } from "./tracking.js";
import { openBuild } from "./view.js";

let els = {};
let bannerDismissedFor = "";

export function initMyBuilds() {
  els = {
    panel: $("#myBuilds"),
    list: $("#myBuildsList"),
    sub: $("#myBuildsSub"),
    refresh: $("#myBuildsRefresh"),
    banner: $("#freshness")
  };

  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (!btn) return;
    openBuild(btn.dataset.class, btn.dataset.spec, btn.dataset.mode);
  });

  els.refresh.addEventListener("click", async () => {
    els.refresh.disabled = true;
    await refreshTracked();
    els.refresh.disabled = false;
  });

  els.banner.addEventListener("click", (e) => {
    if (e.target.closest("[data-action='dismiss-banner']")) {
      bannerDismissedFor = els.banner.dataset.signature || "";
      els.banner.hidden = true;
    }
    const open = e.target.closest("[data-open]");
    if (open) openBuild(open.dataset.class, open.dataset.spec, open.dataset.mode);
  });

  on("tracked:changed", render);
  on("auth:changed", () => refreshTracked());
  on("builds:loaded", () => refreshTracked());
}

function render({ items, source }) {
  const outdated = items.filter((i) => i.outdated);
  renderBanner(outdated);

  els.panel.hidden = items.length === 0;
  if (!items.length) return;

  const signedIn = Boolean(getAuthState().user);
  const where = signedIn && source === "account" ? "Synced to your account." : "Saved on this device.";
  els.sub.textContent = `${plural(items.length, "build")} tracked, ${outdated.length} changed since you copied. ${where}`;

  els.list.innerHTML = items.map((item) => {
    const cls = findClass(item.className);
    const status = !item.hasCurrent ? "missing" : item.outdated ? "outdated" : "fresh";
    const statusText = { missing: "No longer listed", outdated: "Update available", fresh: "Up to date" }[status];
    const copied = timeAgo(item.copiedAt);
    return html`
      <li class="tracked-row status-${status}" style="--cc:${cls?.color || "var(--accent)"}">
        ${cls ? raw(html`<img class="tracked-crest" src="${cls.icon}" alt="" width="40" height="40" loading="lazy" />`) : ""}
        <div class="tracked-copy">
          <p class="tracked-title">${item.specName} ${item.className}</p>
          <p class="tracked-meta">${modeLabel(item.mode)}${copied ? `, copied ${copied}` : ""}</p>
        </div>
        <span class="tracked-status">${statusText}</span>
        <button type="button" class="btn btn-quiet btn-sm" data-open data-class="${item.className}" data-spec="${item.specName}" data-mode="${item.mode}" ${item.hasCurrent ? "" : "disabled"}>
          ${item.outdated ? "Get new code" : "Open"}
        </button>
      </li>`;
  }).join("");
}

function renderBanner(outdated) {
  const signature = outdated.map((i) => `${i.className}/${i.specName}/${i.mode}`).join("|");
  if (!outdated.length || signature === bannerDismissedFor) {
    els.banner.hidden = true;
    return;
  }
  els.banner.dataset.signature = signature;
  const first = outdated[0];
  const rest = outdated.length - 1;
  els.banner.innerHTML = html`
    <p>
      <strong>${outdated.length === 1 ? "A build you copied has changed." : `${outdated.length} builds you copied have changed.`}</strong>
      <button type="button" class="link-btn" data-open data-class="${first.className}" data-spec="${first.specName}" data-mode="${first.mode}">
        See the new ${first.specName} ${first.className} ${modeLabel(first.mode)} code</button>${rest > 0 ? ` and ${plural(rest, "other")} in Your builds.` : "."}
    </p>
    <button type="button" class="banner-close" data-action="dismiss-banner" aria-label="Dismiss">×</button>`;
  els.banner.hidden = false;
}
