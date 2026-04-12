import { state } from "./state.js";
import { tr } from "./i18n.js";
import { getAvatarImage } from "./assets.js";

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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNumber(value = 0) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat(state.locale === "en" ? "en-US" : "es-ES").format(num);
}

export function progressPct(current = 0, total = 0) {
  const safeTotal = Number(total || 0);
  const safeCurrent = Number(current || 0);
  if (!safeTotal || safeTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((safeCurrent / safeTotal) * 100)));
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
  const profile = state.profile || state.user;
  if (!profile) {
    mount.classList.add("hidden");
    mount.innerHTML = "";
    return;
  }
  mount.classList.remove("hidden");
  const photo = profile.photo_url || profile.avatar_url || getAvatarImage(profile.avatar_code || state.selectedAvatarCode || "steven");
  const name = profile.display_name || profile.username || profile.email || tr("common.trainer");
  mount.innerHTML = `<img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}" onerror="onAvatarImageError(this)"><div><strong>${escapeHtml(name)}</strong></div>`;
}

export function onPokemonImageError(img) {
  img.onerror = null;
  img.src = "/img/pokemon-png/sprites_normal/0001.png";
}
window.onPokemonImageError = onPokemonImageError;

export function onAvatarImageError(img) {
  img.onerror = null;
  img.src = getAvatarImage("steven");
}
window.onAvatarImageError = onAvatarImageError;
