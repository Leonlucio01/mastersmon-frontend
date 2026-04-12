import { state } from "./state.js";
import { tr } from "./i18n.js";

export const refs = {
  appContent: document.getElementById("appContent"),
  logoutButton: document.getElementById("logoutButton"),
  refreshButton: document.getElementById("refreshButton"),
  topbarProfile: document.getElementById("topbarProfile"),
  languageSwitch: document.getElementById("languageSwitch"),
};

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function statusCard(message, kind = "info") {
  return `<section class="status-card ${kind === "error" ? "is-error" : ""}"><strong>${escapeHtml(message)}</strong></section>`;
}

export function setActiveNav(target) {
  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.classList.toggle("is-active", item.getAttribute("data-nav") === target);
  });
}

export function renderTopbarProfile() {
  const mount = refs.topbarProfile;
  if (!mount) return;
  if (!state.user) {
    mount.classList.add("hidden");
    mount.innerHTML = "";
    return;
  }
  mount.classList.remove("hidden");
  const photo = state.user.photo_url || "https://placehold.co/64x64/png";
  const name = state.user.display_name || state.user.email || tr("common.trainer");
  mount.innerHTML = `<img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}"><div><strong>${escapeHtml(name)}</strong></div>`;
}

export function onPokemonImageError(img) {
  img.onerror = null;
  img.src = "https://placehold.co/400x220/png?text=Mastersmon";
}
window.onPokemonImageError = onPokemonImageError;
