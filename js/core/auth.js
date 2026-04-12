import { ACCESS_TOKEN_STORAGE_KEY } from "./config.js";
import { state } from "./state.js";

function getStorage() {
  try { return window.sessionStorage; } catch { return window.localStorage; }
}

export function saveToken(token) {
  state.token = token || "";
  getStorage().setItem(ACCESS_TOKEN_STORAGE_KEY, state.token);
}

export function clearToken() {
  state.token = "";
  getStorage().removeItem(ACCESS_TOKEN_STORAGE_KEY);
  try { localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY); } catch {}
}

export function getToken() {
  try {
    state.token = getStorage().getItem(ACCESS_TOKEN_STORAGE_KEY) || localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
  } catch {
    state.token = "";
  }
  return state.token;
}
