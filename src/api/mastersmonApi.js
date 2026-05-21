// src/api/mastersmonApi.js

const DEFAULT_API_URL = "https://mastersmon-api.onrender.com";
const TOKEN_KEY = "mastersmon_token";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (networkError) {
    const error = new Error("No se pudo conectar con el servidor.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login") {
      clearToken();
      window.dispatchEvent(new CustomEvent("mastersmon:session-expired"));
    }

    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data;
}

export async function register({ email, password, trainerName }) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, trainerName }),
  });

  if (data?.token) setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) setToken(data.token);
  return data;
}

export async function logout() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export function getAuthMe() {
  return request("/api/auth/me");
}

export function getHealth() {
  return request("/api/health");
}

export function getProfile() {
  return request("/api/me");
}

export function getInventory() {
  return request("/api/me/inventory");
}

export function getShopItems() {
  return request("/api/shop/items");
}

export function buyShopItem(itemSlug, quantity = 1) {
  return request("/api/shop/buy", {
    method: "POST",
    body: JSON.stringify({ itemSlug, quantity }),
  });
}

export function useItem({ itemSlug, playerMonsterId, quantity = 1 }) {
  return request("/api/items/use", {
    method: "POST",
    body: JSON.stringify({ itemSlug, playerMonsterId, quantity }),
  });
}

export function getTeam() {
  return request("/api/me/team");
}

export function setTeamSlot(slotNumber, playerMonsterId) {
  return request("/api/me/team/slots", {
    method: "POST",
    body: JSON.stringify({ slotNumber, playerMonsterId }),
  });
}

export function clearTeamSlot(slotNumber) {
  return request(`/api/me/team/slots/${encodeURIComponent(slotNumber)}`, {
    method: "DELETE",
  });
}

export function autoBuildTeam() {
  return request("/api/me/team/auto", {
    method: "POST",
  });
}

export function getCollection({ limit = 100 } = {}) {
  return request(`/api/me/collection?limit=${encodeURIComponent(limit)}`);
}

export function getMonster(playerMonsterId) {
  return request(`/api/me/monsters/${encodeURIComponent(playerMonsterId)}`);
}

export function getMonsterEvolutions(playerMonsterId) {
  return request(`/api/me/monsters/${encodeURIComponent(playerMonsterId)}/evolutions`);
}

export function evolveMonster({ playerMonsterId, ruleId, toSpeciesId, itemSlug } = {}) {
  return request("/api/evolutions/evolve", {
    method: "POST",
    body: JSON.stringify({ playerMonsterId, ruleId, toSpeciesId, itemSlug }),
  });
}

export function getPokedexSummary() {
  return request("/api/me/pokedex-summary");
}

export function getQuests() {
  return request("/api/me/quests");
}

export function claimQuest(questId) {
  return request(`/api/me/quests/${encodeURIComponent(questId)}/claim`, {
    method: "POST",
  });
}

export function getPokedex({ generation, caught } = {}) {
  const params = new URLSearchParams();

  if (generation) params.set("generation", String(generation));
  if (caught !== undefined && caught !== null) params.set("caught", String(caught));

  const query = params.toString();
  return request(`/api/me/pokedex${query ? `?${query}` : ""}`);
}

export function getMaps() {
  return request("/api/maps");
}

export function getMapSpawns(mapSlug) {
  return request(`/api/maps/${encodeURIComponent(mapSlug)}/spawns`);
}

export function createEncounter(mapSlug = "bosque-verde") {
  return request("/api/encounters", {
    method: "POST",
    body: JSON.stringify({ mapSlug }),
  });
}

export function getActiveEncounters() {
  return request("/api/encounters/active");
}

export function captureEncounter(encounterId, ballSlug = "poke-ball") {
  return request("/api/captures", {
    method: "POST",
    body: JSON.stringify({ encounterId, ballSlug }),
  });
}

export async function captureLatestEncounter(ballSlug = "poke-ball") {
  const encounters = await getActiveEncounters();
  const encounterId = encounters?.[0]?.encounter_id;

  if (!encounterId) {
    throw new Error("No hay encuentro activo. Busca un encuentro salvaje primero.");
  }

  return captureEncounter(encounterId, ballSlug);
}

export function getRecentCaptures({ limit = 20 } = {}) {
  return request(`/api/server/recent-captures?limit=${encodeURIComponent(limit)}`);
}

export const getServerRecentCaptures = getRecentCaptures;

export function getAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Los assets /img deben estar en la raiz publica del frontend.
  // En este repo tus carpetas img/ y audio/ deben quedar en la raiz.
  return path;
}
