// Account button in the top bar and the sign-in dialog.

import { $, html } from "../../lib/dom.js";
import { on } from "../../lib/events.js";
import { toast } from "../../lib/toast.js";
import { getAuthState, setRemember, signIn, signUp, signInWithGoogle, signOut } from "./session.js";

let els = {};

export function initAuthView() {
  els = {
    account: $("#account"),
    dialog: $("#authDialog"),
    form: $("#authForm"),
    email: $("#authEmail"),
    password: $("#authPassword"),
    remember: $("#authRemember"),
    message: $("#authMessage"),
    signUpBtn: $("#authSignUpBtn"),
    googleBtn: $("#authGoogleBtn"),
    closeBtn: $("#authCloseBtn")
  };

  els.account.addEventListener("click", async (e) => {
    if (e.target.closest("[data-action='open-auth']")) openDialog();
    if (e.target.closest("[data-action='sign-out']")) {
      await signOut();
      toast("Signed out. Copied builds stay saved on this device.");
    }
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(async () => {
      await signIn(...credentials());
      closeDialog();
      toast("Signed in. Builds you copy are now saved to your account.");
    });
  });

  els.signUpBtn.addEventListener("click", () => {
    run(async () => {
      const active = await signUp(...credentials());
      if (active) {
        closeDialog();
        toast("Account created and signed in.");
      } else {
        setMessage("Account created. Check your email for the confirmation link, then sign in.");
      }
    });
  });

  els.googleBtn.addEventListener("click", () => run(() => signInWithGoogle(), { needsCredentials: false }));
  els.remember.addEventListener("change", () => setRemember(els.remember.checked));
  els.closeBtn.addEventListener("click", closeDialog);
  els.dialog.addEventListener("click", (e) => {
    if (e.target === els.dialog) closeDialog(); // backdrop click
  });

  on("auth:changed", renderAccount);
  renderAccount(getAuthState());
}

function credentials() {
  return [String(els.email.value || "").trim(), String(els.password.value || "")];
}

async function run(fn, { needsCredentials = true } = {}) {
  if (needsCredentials) {
    const [email, password] = credentials();
    if (!email || !password) {
      setMessage("Enter your email and password.", true);
      (email ? els.password : els.email).focus();
      return;
    }
  }
  setBusy(true);
  setMessage("");
  try {
    await setRemember(els.remember.checked);
    await fn();
  } catch (err) {
    setMessage(err instanceof Error ? err.message : String(err), true);
  } finally {
    setBusy(false);
  }
}

function setBusy(busy) {
  els.dialog.querySelectorAll("button, input").forEach((el) => {
    if (el !== els.closeBtn) el.disabled = busy;
  });
}

function setMessage(text, isError = false) {
  els.message.textContent = text;
  els.message.hidden = !text;
  els.message.classList.toggle("is-error", Boolean(text && isError));
}

function openDialog() {
  const { remember } = getAuthState();
  els.remember.checked = remember;
  setMessage("");
  if (typeof els.dialog.showModal === "function") els.dialog.showModal();
  else els.dialog.setAttribute("open", "");
  els.email.focus();
}

function closeDialog() {
  if (els.dialog.open) els.dialog.close();
  els.password.value = "";
}

function renderAccount(state) {
  if (!state.ready) {
    els.account.innerHTML = "";
    return;
  }
  if (!state.available) {
    // No Supabase configured: hide account UI entirely instead of showing a dead button.
    els.account.innerHTML = "";
    return;
  }
  if (state.user) {
    if (els.dialog.open) closeDialog();
    els.account.innerHTML = html`
      <span class="account-email" title="${state.user.email || ""}">${state.user.email || "Signed in"}</span>
      <button type="button" class="btn btn-quiet" data-action="sign-out">Sign out</button>`;
  } else {
    els.account.innerHTML = `<button type="button" class="btn btn-quiet" data-action="open-auth">Sign in</button>`;
  }
}
