import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getAvatarImage, getPokemonSprite } from "../core/assets.js";

let afterComplete = async () => {};
export function setAfterOnboardingHandler(handler) { afterComplete = handler; }

function startersByGeneration() {
  const all = state.onboardingOptions?.starters || [];
  return all.filter((item) => String(item.generation_id || "") === String(state.selectedStarterGeneration));
}

function getAvatarOptions() {
  const fromBackend = Array.isArray(state.onboardingOptions?.avatars) ? state.onboardingOptions.avatars : [];
  if (fromBackend.length) return fromBackend;

  return ["batman", "bryan", "goku", "hades", "jean", "jhonny", "leon", "nathaly", "rafael", "steven"].map((code) => ({
    code,
    name: code.charAt(0).toUpperCase() + code.slice(1),
    asset_url: getAvatarImage(code),
  }));
}

function getSelectedStarter(starters) {
  return starters.find((starter) => Number(starter.id) === Number(state.selectedStarterId)) || starters[0] || null;
}

export function renderOnboarding(errorMessage = "") {
  const starters = startersByGeneration();
  const avatars = getAvatarOptions();
  if (!avatars.some((avatar) => avatar.code === state.selectedAvatarCode)) {
    state.selectedAvatarCode = avatars[0]?.code || "steven";
  }
  if (!starters.some((starter) => Number(starter.id) === Number(state.selectedStarterId))) {
    state.selectedStarterId = starters[0]?.id || null;
  }

  const selectedAvatar = avatars.find((avatar) => avatar.code === state.selectedAvatarCode) || avatars[0] || null;
  const selectedStarter = getSelectedStarter(starters);
  const total = state.onboardingOptions?.starters?.length || 0;
  const regions = state.onboardingOptions?.regions || [];

  refs.appContent.innerHTML = `
    <section class="hero-panel onboarding-layout">
      <div class="section-head">
        <div>
          <span class="eyebrow">Onboarding</span>
          <h2>${escapeHtml(tr("onboarding.title"))}</h2>
          <p class="body-copy onboarding-intro">Define tu perfil, elige un avatar visible y entra al mundo con una identidad clara desde el primer paso.</p>
        </div>
      </div>
      <div class="onboarding-grid">
        <form id="onboardingForm" class="onboarding-card">
          <div class="form-grid">
            <div class="field full">
              <label>Nombre</label>
              <input name="displayName" required placeholder="Jhonatan Leon" value="${escapeHtml(state.user?.display_name || "")}">
            </div>
            <div class="field">
              <label>Team</label>
              <select name="trainerTeam">
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div class="field">
              <label>Region</label>
              <select name="regionCode">
                ${regions.map((region) => `<option value="${escapeHtml(region.code)}">${escapeHtml(region.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field full">
              <label>Avatar</label>
              <div class="avatar-picker">
                <div class="avatar-picker__selected">
                  <img src="${escapeHtml(getAvatarImage(selectedAvatar?.asset_url || selectedAvatar?.code || "steven"))}" alt="${escapeHtml(selectedAvatar?.name || selectedAvatar?.code || "Avatar")}" onerror="onAvatarImageError(this)">
                  <div>
                    <strong>${escapeHtml(selectedAvatar?.name || selectedAvatar?.code || "Avatar")}</strong>
                    <span>Selecciona el avatar que va a representar a tu entrenador en el hub y las vistas principales.</span>
                  </div>
                </div>
                <div class="avatar-grid" role="list">
                  ${avatars.map((avatar) => `
                    <button
                      class="avatar-card ${avatar.code === state.selectedAvatarCode ? "is-selected" : ""}"
                      type="button"
                      data-avatar-code="${escapeHtml(avatar.code)}"
                      aria-pressed="${avatar.code === state.selectedAvatarCode ? "true" : "false"}"
                    >
                      <span class="avatar-card__art">
                        <img src="${escapeHtml(getAvatarImage(avatar.asset_url || avatar.code))}" alt="${escapeHtml(avatar.name || avatar.code)}" onerror="onAvatarImageError(this)">
                      </span>
                      <strong>${escapeHtml(avatar.name || avatar.code)}</strong>
                    </button>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
          <div style="margin-top:16px" class="hero-actions">
            <button class="primary-btn" type="submit">${escapeHtml(tr("onboarding.complete"))}</button>
            <button class="soft-btn" type="button" id="reloadOnboarding">${escapeHtml(tr("onboarding.reload"))}</button>
          </div>
          ${errorMessage ? `<div class="error-inline">${escapeHtml(errorMessage)}</div>` : ""}
        </form>
        <aside class="starter-panel">
          <div class="starter-toolbar">
            <strong>${escapeHtml(tr("onboarding.starter"))}</strong>
            <select id="starterGenerationFilter">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => `<option value="${value}" ${String(value) === String(state.selectedStarterGeneration) ? "selected" : ""}>Gen ${value}</option>`).join("")}
            </select>
          </div>
          <p class="body-copy">${escapeHtml(tr("onboarding.count", { visible: starters.length, total }))}</p>
          ${selectedStarter ? `
            <article class="starter-feature">
              <div class="starter-feature__art">
                <img src="${escapeHtml(getPokemonSprite(selectedStarter))}" alt="${escapeHtml(selectedStarter.name)}" onerror="onPokemonImageError(this)">
              </div>
              <div class="starter-feature__copy">
                <span class="eyebrow">Starter activo</span>
                <strong>${escapeHtml(selectedStarter.name)}</strong>
                <p>${escapeHtml(selectedStarter.primary_type_name || "Tipo desconocido")} - Generacion ${escapeHtml(selectedStarter.generation_id || "-")}</p>
              </div>
            </article>
          ` : ""}
          <div class="starter-grid">
            ${starters.map((starter) => `
              <article class="starter-card ${Number(starter.id) === Number(state.selectedStarterId) ? "is-selected" : ""}" data-starter-id="${starter.id}">
                <img src="${escapeHtml(getPokemonSprite(starter))}" alt="${escapeHtml(starter.name)}" onerror="onPokemonImageError(this)">
                <strong>${escapeHtml(starter.name)}</strong>
                <span>${escapeHtml(starter.primary_type_name || "-")}</span>
              </article>
            `).join("")}
          </div>
        </aside>
      </div>
    </section>`;

  document.getElementById("starterGenerationFilter")?.addEventListener("change", (event) => {
    state.selectedStarterGeneration = event.target.value;
    renderOnboarding(errorMessage);
  });

  document.querySelectorAll("[data-avatar-code]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedAvatarCode = card.getAttribute("data-avatar-code") || "steven";
      renderOnboarding(errorMessage);
    });
  });

  document.querySelectorAll("[data-starter-id]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedStarterId = Number(card.getAttribute("data-starter-id"));
      renderOnboarding(errorMessage);
    });
  });

  document.getElementById("reloadOnboarding")?.addEventListener("click", async () => {
    const response = await fetchAuth("/v2/onboarding/options");
    state.onboardingOptions = response.data || { starters: [], regions: [], avatars: [] };
    renderOnboarding();
  });

  document.getElementById("onboardingForm")?.addEventListener("submit", submitOnboarding);
}

async function submitOnboarding(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const displayName = form.displayName.value.trim();
  if (!displayName) return renderOnboarding("Escribe un nombre de entrenador.");
  if (!state.selectedStarterId) return renderOnboarding("Elige un starter para continuar.");

  try {
    await fetchAuth("/v2/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        trainer_team: form.trainerTeam.value,
        starter_species_id: state.selectedStarterId,
        region_code: form.regionCode.value,
        avatar_code: state.selectedAvatarCode,
        language_code: state.locale,
        timezone_code: "America/Lima",
      }),
    });
    await afterComplete();
  } catch (error) {
    renderOnboarding(error.message || "No se pudo completar el onboarding.");
  }
}
