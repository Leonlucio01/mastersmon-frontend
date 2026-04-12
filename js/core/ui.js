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

function ensureModalMount() {
  let mount = document.getElementById("appModal");
  if (mount) return mount;
  mount = document.createElement("div");
  mount.id = "appModal";
  mount.className = "app-modal hidden";
  mount.innerHTML = `
    <div class="app-modal-backdrop" data-modal-close="true"></div>
    <div class="app-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="appModalTitle">
      <button class="app-modal-close" type="button" aria-label="Cerrar" data-modal-close="true">&times;</button>
      <div class="app-modal-head">
        <span class="eyebrow" id="appModalEyebrow">Info</span>
        <h3 id="appModalTitle"></h3>
      </div>
      <div class="app-modal-body" id="appModalBody"></div>
      <div class="app-modal-actions" id="appModalActions"></div>
    </div>`;
  document.body.appendChild(mount);
  mount.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.modalClose === "true") {
      closeAppModal();
    }
  });
  return mount;
}

export function closeAppModal() {
  const mount = document.getElementById("appModal");
  if (!mount) return;
  mount.classList.add("hidden");
  document.body.classList.remove("modal-open");
  const title = document.getElementById("appModalTitle");
  const body = document.getElementById("appModalBody");
  const actions = document.getElementById("appModalActions");
  if (title) title.textContent = "";
  if (body) body.innerHTML = "";
  if (actions) actions.innerHTML = "";
}

export function openAppModal({
  eyebrow = "Info",
  title = "",
  body = "",
  actions = [],
} = {}) {
  const mount = ensureModalMount();
  const eyebrowNode = document.getElementById("appModalEyebrow");
  const titleNode = document.getElementById("appModalTitle");
  const bodyNode = document.getElementById("appModalBody");
  const actionsNode = document.getElementById("appModalActions");
  if (!eyebrowNode || !titleNode || !bodyNode || !actionsNode) return;

  eyebrowNode.textContent = eyebrow;
  titleNode.textContent = title;
  bodyNode.innerHTML = body;
  actionsNode.innerHTML = actions.map((action, index) => `
    <button
      type="button"
      class="${action.kind === "primary" ? "primary-btn" : "soft-btn"}"
      data-modal-action-index="${index}">
      ${escapeHtml(action.label || "Cerrar")}
    </button>`).join("");

  actionsNode.querySelectorAll("[data-modal-action-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = actions[Number(button.getAttribute("data-modal-action-index"))];
      if (action?.closeOnClick !== false) closeAppModal();
      if (typeof action?.onClick === "function") action.onClick();
    });
  });

  mount.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAppModal();
});
