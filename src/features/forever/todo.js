// WoW Forever to-do list: a session checklist you can edit. Ticks stay until you start fresh.

import { $, html, raw } from "../../lib/dom.js";
import { KEYS, readJson, writeJson } from "../../lib/storage.js";
import { icon } from "../../lib/icons.js";
import { toast } from "../../lib/toast.js";

// Generic habits that hold at any level. Players can remove these and add their own.
const STARTER = [
  { id: "train", label: "Visit your class trainer for new spells" },
  { id: "bags", label: "Sell junk, repair and empty your bags" },
  { id: "dungeon", label: "Run a dungeon that fits your level" },
  { id: "professions", label: "Level your professions and first aid" },
  { id: "auction", label: "Check the auction house for upgrades" },
  { id: "rested", label: "Log out in an inn or city for rested XP" }
];

let els = {};
let state = load();

function load() {
  const saved = readJson(KEYS.foreverTodo, null);
  const tasks = Array.isArray(saved?.tasks)
    ? saved.tasks.filter((t) => t && t.id && t.label).map((t) => ({ id: String(t.id), label: String(t.label) }))
    : STARTER.map((t) => ({ ...t }));
  return { tasks, done: saved?.done && typeof saved.done === "object" ? saved.done : {} };
}

function save() {
  writeJson(KEYS.foreverTodo, state);
  render();
}

export function initTodoView() {
  els = { body: $("#todoBody") };

  els.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const a = btn.dataset.action;
    const id = btn.dataset.task;
    if (a === "toggle") {
      if (state.done[id]) delete state.done[id];
      else state.done[id] = true;
      save();
    }
    if (a === "remove") {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      delete state.done[id];
      save();
    }
    if (a === "fresh") {
      state.done = {};
      save();
      toast("All ticks cleared.");
    }
    if (a === "restore") {
      state = { tasks: STARTER.map((t) => ({ ...t })), done: {} };
      save();
      toast("To-do list reset to the starter list.");
    }
  });

  els.body.addEventListener("submit", (e) => {
    if (!e.target.matches("#todoForm")) return;
    e.preventDefault();
    const text = String($("#todoInput", els.body).value || "").trim().slice(0, 80);
    if (!text) return;
    state.tasks.push({ id: `custom-${Date.now().toString(36)}`, label: text });
    save();
    requestAnimationFrame(() => $("#todoInput", els.body)?.focus());
  });
}

export function showTodo() {
  render();
}

function render() {
  const done = state.tasks.filter((t) => state.done[t.id]).length;
  els.body.innerHTML = html`
    <section class="card checklist todo-card" aria-labelledby="todoHeading">
      <header class="card-head">
        <div>
          <h2 id="todoHeading" class="card-title">This session</h2>
          <p class="card-sub">Ticks stay until you start fresh, so the list works for a night or a whole week.</p>
        </div>
        <p class="big-count" aria-label="${done} of ${state.tasks.length} done"><strong>${done}</strong><span>/${state.tasks.length} done</span></p>
      </header>
      <ul class="tasks">
        ${state.tasks.map((t) => raw(html`
          <li class="task${state.done[t.id] ? " is-done" : ""}">
            <button type="button" class="task-toggle" data-action="toggle" data-task="${t.id}" aria-pressed="${String(Boolean(state.done[t.id]))}">
              <span class="task-box">${raw(icon("check"))}</span>
              <span class="task-label">${t.label}</span>
            </button>
            <button type="button" class="icon-btn task-remove" data-action="remove" data-task="${t.id}" aria-label="Remove ${t.label} from the list">${raw(icon("x"))}</button>
          </li>`))}
      </ul>
      ${state.tasks.length ? "" : raw(`<p class="muted">Your list is empty. Add a task below.</p>`)}
      <form id="todoForm" class="task-form">
        <label class="visually-hidden" for="todoInput">New task</label>
        <input id="todoInput" type="text" maxlength="80" placeholder="Add your own, like &quot;Farm Deadmines for the staff&quot;" autocomplete="off" />
        <button type="submit" class="btn btn-quiet btn-sm">Add task</button>
      </form>
      <div class="todo-actions">
        <button type="button" class="btn btn-quiet btn-sm" data-action="fresh" ${done ? "" : "disabled"}>Start fresh</button>
        <button type="button" class="link-btn" data-action="restore">Restore the starter list</button>
      </div>
    </section>
  `;
}
