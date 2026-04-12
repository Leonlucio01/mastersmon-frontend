import { state } from "./state.js";
import { setActiveNav, refs } from "./ui.js";
import { renderLogin } from "../modules/login.js";
import { renderOnboarding } from "../modules/onboarding.js";
import { renderHome } from "../modules/home.js";
import { renderAdventure } from "../modules/adventure.js";
import { renderCollection } from "../modules/collection.js";
import { renderTeam } from "../modules/team.js";
import { renderGyms } from "../modules/gyms.js";
import { renderHouse } from "../modules/house.js";
import { renderTrade } from "../modules/trade.js";

export function renderCurrentView(view = "home") {
  if (!state.token) {
    setActiveNav("home");
    renderLogin();
    return;
  }
  if (state.onboarding?.needs_onboarding && state.onboardingOptions) {
    setActiveNav("home");
    renderOnboarding();
    return;
  }

  const map = {
    home: () => renderHome(),
    adventure: () => renderAdventure(),
    collection: () => renderCollection(true),
    team: () => renderTeam(true),
    gyms: () => renderGyms(true),
    house: () => renderHouse(true),
    trade: () => renderTrade(true),
  };

  if (map[view]) {
    setActiveNav(view);
    map[view]();
    return;
  }

  setActiveNav("home");
  renderHome();
}

export function bindNavigation(onRefresh) {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.getAttribute("data-nav");
      renderCurrentView(target || "home");
    });
  });

  refs.refreshButton?.addEventListener("click", onRefresh);
}
