// src/api/mastersmonApi.js

const DEFAULT_API_URL = "https://mastersmon-api.onrender.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export function getHealth() {
  return request("/api/health");
}

export function getDemoProfile() {
  return request("/api/demo/me");
}

export function getDemoInventory() {
  return request("/api/demo/inventory");
}

export function getDemoTeam() {
  return request("/api/demo/team");
}

export function getDemoCollection({ limit = 100 } = {}) {
  return request(`/api/demo/collection?limit=${encodeURIComponent(limit)}`);
}

export function getDemoPokedexSummary() {
  return request("/api/demo/pokedex-summary");
}

export function getDemoPokedex({ generation, caught } = {}) {
  const params = new URLSearchParams();

  if (generation) params.set("generation", String(generation));
  if (caught !== undefined && caught !== null) params.set("caught", String(caught));

  const query = params.toString();
  return request(`/api/demo/pokedex${query ? `?${query}` : ""}`);
}

export function getMaps() {
  return request("/api/maps");
}

export function getMapSpawns(mapSlug) {
  return request(`/api/maps/${encodeURIComponent(mapSlug)}/spawns`);
}

export function createDemoEncounter(mapSlug = "bosque-verde") {
  return request("/api/demo/encounters", {
    method: "POST",
    body: JSON.stringify({ mapSlug }),
  });
}

export function getActiveDemoEncounters() {
  return request("/api/demo/encounters/active");
}

export function captureDemoEncounter(encounterId, ballSlug = "poke-ball") {
  return request("/api/demo/captures", {
    method: "POST",
    body: JSON.stringify({ encounterId, ballSlug }),
  });
}

export function captureLatestDemoEncounter(ballSlug = "poke-ball") {
  return request("/api/demo/captures/latest", {
    method: "POST",
    body: JSON.stringify({ ballSlug }),
  });
}

export function getServerRecentCaptures({ limit = 20 } = {}) {
  return request(`/api/server/recent-captures?limit=${encodeURIComponent(limit)}`);
}

export function getAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Los assets /img deben estar en la raiz publica del frontend.
  // En este repo tus carpetas img/ y audio/ deben quedar en la raiz.
  return path;
}
