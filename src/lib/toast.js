// Single live-region toast for confirmations and errors.

let timer = null;

export function toast(message, tone = "ok", ms = 3600) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = String(message || "");
  el.dataset.tone = tone;
  el.hidden = false;
  // Restart the enter transition.
  el.classList.remove("is-shown");
  void el.offsetWidth;
  el.classList.add("is-shown");
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.classList.remove("is-shown");
    setTimeout(() => { el.hidden = true; }, 250);
  }, ms);
}
