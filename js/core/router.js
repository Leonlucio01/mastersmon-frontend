import { state } from "./state.js";
import { setActiveNav, refs } from "./ui.js";
import { renderLogin } from "../modules/login.js";
import { renderOnboarding } from "../modules/onboarding.js";
import { renderHome } from "../modules/home.js";
import { renderAdventure } from "../modules/adventure.js";
import { renderCollection } from "../modules/collection.js";
import { renderTeam } from "../modules/team.js";

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
  if (view === "adventure") {
    setActiveNav("adventure");
    renderAdventure();
    return;
  }
  if (view === "collection") {
    setActiveNav("collection");
    renderCollection(true);
    return;
  }
  if (view === "team") {
    setActiveNav("team");
    renderTeam(true);
    return;
  }
  setActiveNav("home");
  renderHome();
}

export function bindNavigation(onRefresh) {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.getAttribute("data-nav");
      if (target === "adventure") {
        renderCurrentView("adventure");
        return;
      }
      if (target === "home") {
        renderCurrentView("home");
        return;
      }
      if (target === "collection") {
        renderCurrentView("collection");
        return;
      }
      if (target === "team") {
        renderCurrentView("team");
        return;
      }
      refs.appContent.innerHTML = `<section class="section-card"><div class="placeholder-card"><strong>${target}</strong><p class="body-copy">Este módulo entra después. La estructura ya está lista en js/modules.</p></div></section>`;
      setActiveNav(target);
    });
  });

  refs.refreshButton?.addEventListener("click", onRefresh);
}
