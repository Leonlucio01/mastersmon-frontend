import { API_BASE } from "./config.js";
import { state } from "./state.js";
import { getToken, clearToken } from "./auth.js";

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail;
    const message = typeof detail === "string" ? detail : detail?.message || payload?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function fetchJson(path, init = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  return parseJson(response);
}

export async function fetchAuth(path, init = {}) {
  const token = state.token || getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  try {
    return await parseJson(response);
  } catch (error) {
    if (error.status === 401) clearToken();
    throw error;
  }
}
