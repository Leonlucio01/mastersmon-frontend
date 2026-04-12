import { state } from "./core/state.js";
import { loadLocale, saveLocale } from "./core/i18n.js";
import { refs, renderTopbarProfile, statusCard } from "./core/ui.js";
import { getToken, clearToken } from "./core/auth.js";
import { fetchAuth } from "./core/api.js";
import { bindNavigation, renderCurrentView } from "./core/router.js";
import { setAfterLoginHandler } from "./modules/login.js";
import { setAfterOnboardingHandler } from "./modules/onboarding.js";

async function bootstrap(view = "home", force = false) {
  state.token = getToken();
  if (!state.token) {
    state.user = null;
    state.onboarding = null;
    state.onboardingOptions = null;
    state.home = null;
    state.regions = [];
    state.houseSummary = null;
    state.houseStorage = null;
    state.houseUpgrades = null;
    state.tradeSummary = null;
    state.tradeOffers = [];
    state.tradeTransactions = [];
    state.tradeAvailablePokemon = [];
    state.shopCatalog = [];
    state.shopBenefits = [];
    state.shopPurchases = [];
    state.shopSync = { status: "idle", message: "", orderId: "" };
    state.shopCatalog = [];
    state.shopBenefits = [];
    state.shopPurchases = [];
    state.shopSync = { status: "idle", message: "", orderId: "" };
    renderTopbarProfile();
    renderCurrentView("home");
    return;
  }

  if (force) {
    state.onboarding = null;
    state.onboardingOptions = null;
    state.home = null;
    state.regions = [];
    state.houseSummary = null;
    state.houseStorage = null;
    state.houseUpgrades = null;
    state.tradeSummary = null;
    state.tradeOffers = [];
    state.tradeTransactions = [];
    state.tradeAvailablePokemon = [];
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
      refs.logoutButton?.classList.remove("hidden");
      renderCurrentView("home");
      return;
    }

    const [homeResponse, regionsResponse] = await Promise.all([
      fetchAuth("/v2/home/summary"),
      fetchAuth("/v2/adventure/regions"),
    ]);

    state.home = homeResponse.data || null;
    state.regions = regionsResponse.data || [];
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
    await bootstrap(document.querySelector('[data-nav].is-active')?.getAttribute('data-nav') || "home", true);
  });
  refs.refreshButton?.addEventListener("click", async () => bootstrap(document.querySelector('[data-nav].is-active')?.getAttribute('data-nav') || "home", true));
  refs.logoutButton?.addEventListener("click", () => {
    clearToken();
    refs.logoutButton.classList.add("hidden");
    bootstrap("home", true);
  });
  bindNavigation(async () => bootstrap(document.querySelector('[data-nav].is-active')?.getAttribute('data-nav') || "home", true));
}

setAfterLoginHandler(async () => bootstrap("home", true));
setAfterOnboardingHandler(async () => bootstrap("home", true));
setupUi();
bootstrap("home", false);
