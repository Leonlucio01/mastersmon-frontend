import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";

let afterComplete = async () => {};
export function setAfterOnboardingHandler(handler) { afterComplete = handler; }

function startersByGeneration() {
  const all = state.onboardingOptions?.starters || [];
  return all.filter((item) => String(item.generation_id || "") === String(state.selectedStarterGeneration));
}

export function renderOnboarding(errorMessage = "") {
  const starters = startersByGeneration();
  const total = state.onboardingOptions?.starters?.length || 0;
  const regions = state.onboardingOptions?.regions || [];
  refs.appContent.innerHTML = `
    <section class="hero-panel onboarding-layout">
      <div class="section-head"><div><span class="eyebrow">Onboarding</span><h2>${escapeHtml(tr("onboarding.title"))}</h2></div></div>
      <div class="onboarding-grid">
        <form id="onboardingForm" class="onboarding-card">
          <div class="form-grid">
            <div class="field full"><label>Nombre</label><input name="displayName" required placeholder="Jhonatan León" value="${escapeHtml(state.user?.display_name || "")}"></div>
            <div class="field"><label>Avatar</label><select name="avatarCode">${["steven","goku","batman","rafael","leon"].map(v => `<option value="${v}" ${state.selectedAvatarCode===v?"selected":""}>${v}</option>`).join("")}</select></div>
            <div class="field"><label>Team</label><select name="trainerTeam"><option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option><option value="neutral">Neutral</option></select></div>
            <div class="field"><label>Región</label><select name="regionCode">${regions.map(r => `<option value="${escapeHtml(r.code)}">${escapeHtml(r.name)}</option>`).join("")}</select></div>
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
            <select id="starterGenerationFilter">${[1,2,3,4,5,6,7,8,9].map(v => `<option value="${v}" ${String(v)===String(state.selectedStarterGeneration)?"selected":""}>Gen ${v}</option>`).join("")}</select>
          </div>
          <p class="body-copy">${escapeHtml(tr("onboarding.count", { visible: starters.length, total }))}</p>
          <div class="starter-grid">
            ${starters.map(starter => `
              <article class="starter-card ${Number(starter.id) === Number(state.selectedStarterId) ? "is-selected" : ""}" data-starter-id="${starter.id}">
                <img src="${escapeHtml(starter.asset_url || "https://placehold.co/96x96/png")}" alt="${escapeHtml(starter.name)}" onerror="onPokemonImageError(this)">
                <strong>${escapeHtml(starter.name)}</strong>
                <span>${escapeHtml(starter.primary_type_name || "-")}</span>
              </article>`).join("")}
          </div>
        </aside>
      </div>
    </section>`;

  document.getElementById("starterGenerationFilter")?.addEventListener("change", (e) => {
    state.selectedStarterGeneration = e.target.value;
    renderOnboarding(errorMessage);
  });
  document.querySelectorAll("[data-starter-id]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedStarterId = Number(card.getAttribute("data-starter-id"));
      renderOnboarding(errorMessage);
    });
  });
  document.getElementById("reloadOnboarding")?.addEventListener("click", async () => {
    const response = await fetchAuth("/v2/onboarding/options");
    state.onboardingOptions = response.data || { starters: [], regions: [] };
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
  state.selectedAvatarCode = form.avatarCode.value;
  try {
    await fetchAuth("/v2/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        trainer_team: form.trainerTeam.value,
        starter_species_id: state.selectedStarterId,
        region_code: form.regionCode.value,
        avatar_code: form.avatarCode.value,
        language_code: state.locale,
        timezone_code: "America/Lima",
      }),
    });
    await afterComplete();
  } catch (error) {
    renderOnboarding(error.message || "No se pudo completar el onboarding.");
  }
}
