import { state } from "./core/state.js";
import { loadLocale, saveLocale } from "./core/i18n.js";
import { refs, renderTopbarProfile, statusCard } from "./core/ui.js";
import { getToken, clearToken } from "./core/auth.js";
import { fetchAuth } from "./core/api.js";
import { bindNavigation, renderCurrentView } from "./core/router.js";
import { ensureAssetManifests, getAssetAuditSummary } from "./core/assets.js";
import { setAfterLoginHandler } from "./modules/login.js";
import { setAfterOnboardingHandler } from "./modules/onboarding.js";

function resetAuthenticatedState() {
  state.profile = null;
  state.onboarding = null;
  state.onboardingOptions = null;
  state.home = null;
  state.homeAlerts = null;
  state.regions = [];
  state.collectionSummary = null;
  state.teamActive = null;
  state.gymsSummary = null;
  state.houseSummary = null;
  state.houseStorage = null;
  state.houseUpgrades = null;
  state.tradeSummary = null;
  state.tradeOffers = [];
  state.tradeTransactions = [];
  state.tradeAvailablePokemon = [];
  state.shopCatalog = [];
  state.shopSummary = null;
  state.shopUtilityCatalog = [];
  state.shopBenefits = [];
  state.shopPurchases = [];
  state.shopSync = { status: "idle", message: "", orderId: "" };
  state.rankingSummary = null;
}

async function bootstrap(view = "home", force = false) {
  state.token = getToken();
  await ensureAssetManifests();
  state.assetAudit = getAssetAuditSummary();

  if (!state.token) {
    state.user = null;
    resetAuthenticatedState();
    renderTopbarProfile();
    refs.logoutButton?.classList.add("hidden");
    renderCurrentView("home");
    return;
  }

  if (force) {
    resetAuthenticatedState();
  }

  refs.logoutButton?.classList.remove("hidden");
  refs.appContent.innerHTML = statusCard("Cargando shell modular...");

  try {
    const [meResponse, onboardingResponse] = await Promise.all([
      fetchAuth("/v2/auth/me"),
      fetchAuth("/v2/onboarding/state"),
    ]);

    state.user = meResponse.data?.user || null;
    state.onboarding = onboardingResponse.data || null;
    renderTopbarProfile();

    if (state.onboarding?.needs_onboarding) {
      const optionsResponse = await fetchAuth("/v2/onboarding/options");
      state.onboardingOptions = optionsResponse.data || { starters: [], regions: [] };
      renderCurrentView("home");
      return;
    }

    const [
      profileResponse,
      homeResponse,
      homeAlertsResponse,
      regionsResponse,
      collectionSummaryResponse,
      teamActiveResponse,
      gymsSummaryResponse,
    ] = await Promise.all([
      fetchAuth("/v2/profile/me").catch(() => ({ data: null })),
      fetchAuth("/v2/home/summary").catch(() => ({ data: null })),
      fetchAuth("/v2/home/alerts").catch(() => ({ data: null })),
      fetchAuth("/v2/adventure/regions").catch(() => ({ data: [] })),
      fetchAuth("/v2/collection/summary").catch(() => ({ data: null })),
      fetchAuth("/v2/team/active").catch(() => ({ data: null })),
      fetchAuth("/v2/gyms/summary").catch(() => ({ data: null })),
    ]);

    state.profile = profileResponse.data || null;
    state.home = homeResponse.data || null;
    state.homeAlerts = homeAlertsResponse.data || null;
    state.regions = regionsResponse.data || [];
    state.collectionSummary = collectionSummaryResponse.data || null;
    state.teamActive = teamActiveResponse.data || null;
    state.gymsSummary = gymsSummaryResponse.data || null;
    renderTopbarProfile();
    renderCurrentView(view);
  } catch (error) {
    if (error.status === 401) {
      clearToken();
      refs.logoutButton?.classList.add("hidden");
      renderCurrentView("home");
      return;
    }
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar la app.", "error");
  }
}

function setupUi() {
  loadLocale();
  refs.languageSwitch.value = state.locale;
  refs.languageSwitch.addEventListener("change", async (event) => {
    saveLocale(event.target.value);
    await bootstrap(document.querySelector("[data-nav].is-active")?.getAttribute("data-nav") || "home", true);
  });
  refs.teamBadgeButton?.addEventListener("click", () => {
    document.querySelector('[data-nav="team"]')?.click();
  });
  refs.logoutButton?.addEventListener("click", () => {
    clearToken();
    refs.logoutButton.classList.add("hidden");
    bootstrap("home", true);
  });
  bindNavigation(async () => bootstrap(document.querySelector("[data-nav].is-active")?.getAttribute("data-nav") || "home", true));
}

setAfterLoginHandler(async () => bootstrap("home", true));
setAfterOnboardingHandler(async () => bootstrap("home", true));
setupUi();
bootstrap("home", false);
