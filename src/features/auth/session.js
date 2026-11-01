// Supabase session handling. Login is optional; without Supabase config the app runs signed-out.

import { KEYS, readString, writeString } from "../../lib/storage.js";
import { emit } from "../../lib/events.js";

const state = {
  config: null,
  client: null,
  user: null,
  remember: readRemember(),
  subscription: null,
  ready: false
};

function readRemember() {
  const v = readString(KEYS.authRemember, "").trim().toLowerCase();
  return !(v === "0" || v === "false");
}

function readInlineConfig() {
  const w = window.WOW_ADVISOR_AUTH && typeof window.WOW_ADVISOR_AUTH === "object" ? window.WOW_ADVISOR_AUTH : {};
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || "";
  return {
    url: String(w.supabaseUrl || meta("wowadvisor-supabase-url") || import.meta.env.VITE_SUPABASE_URL || "").trim(),
    anonKey: String(w.supabaseAnonKey || meta("wowadvisor-supabase-anon-key") || import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim()
  };
}

async function readApiConfig() {
  try {
    const res = await fetch("/api/auth-config", { cache: "no-store" });
    if (!res.ok) return null;
    const payload = await res.json();
    const url = String(payload?.supabaseUrl || "").trim();
    const anonKey = String(payload?.supabaseAnonKey || "").trim();
    return url && anonKey ? { url, anonKey } : null;
  } catch {
    return null;
  }
}

let createClientFn = null;

async function makeClient(remember) {
  // Loaded on demand: most of the bundle weight, and only needed when sign-in is configured.
  if (!createClientFn) ({ createClient: createClientFn } = await import("@supabase/supabase-js"));
  return createClientFn(state.config.url, state.config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: remember ? window.localStorage : window.sessionStorage
    }
  });
}

function setUser(user) {
  const prev = state.user?.id || null;
  state.user = user || null;
  if (prev !== (state.user?.id || null) || !state.ready) emit("auth:changed", getAuthState());
}

async function connect(remember) {
  state.subscription?.unsubscribe?.();
  state.client = await makeClient(remember);
  const { data } = state.client.auth.onAuthStateChange((_event, session) => setUser(session?.user));
  state.subscription = data?.subscription || null;
  try {
    const { data: sessionData } = await state.client.auth.getSession();
    setUser(sessionData?.session?.user);
  } catch {
    setUser(null);
  }
}

export async function initSession() {
  const inline = readInlineConfig();
  const api = inline.url && inline.anonKey ? null : await readApiConfig();
  const url = inline.url || api?.url || "";
  const anonKey = inline.anonKey || api?.anonKey || "";
  if (url && anonKey) {
    state.config = { url, anonKey };
    await connect(state.remember);
    if (/access_token=|refresh_token=/.test(window.location.hash)) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}#builds`);
    }
  }
  state.ready = true;
  emit("auth:changed", getAuthState());
}

export function getAuthState() {
  return {
    available: Boolean(state.client),
    ready: state.ready,
    user: state.user,
    remember: state.remember
  };
}

export function getUser() {
  return state.user;
}

export function getClient() {
  return state.client;
}

export async function setRemember(remember) {
  const next = Boolean(remember);
  writeString(KEYS.authRemember, next ? "1" : "0");
  if (next === state.remember) return;
  state.remember = next;
  if (state.config) await connect(next);
}

export async function getAccessToken() {
  if (!state.client) return null;
  try {
    const { data, error } = await state.client.auth.getSession();
    return error ? null : data?.session?.access_token || null;
  } catch {
    return null;
  }
}

const redirectTo = () => `${window.location.origin}${window.location.pathname}`;

export async function signIn(email, password) {
  const { error } = await state.client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || "Sign in failed.");
}

/** Returns true when the account is active immediately, false when email confirmation is pending. */
export async function signUp(email, password) {
  const { data, error } = await state.client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
  if (error) throw new Error(error.message || "Couldn't create the account.");
  return Boolean(data?.session);
}

export async function signInWithGoogle() {
  const { error } = await state.client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  if (error) throw new Error(error.message || "Google sign in failed.");
}

export async function signOut() {
  if (!state.client) return;
  await state.client.auth.signOut();
  setUser(null);
}

// Kept for any external scripts that relied on the old global.
window.wowAdvisorAuth = {
  getCurrentUser: () => state.user,
  getAccessToken: () => getAccessToken()
};
