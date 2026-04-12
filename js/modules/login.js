import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { GOOGLE_CLIENT_ID } from "../core/config.js";
import { fetchJson } from "../core/api.js";
import { saveToken } from "../core/auth.js";
import { state } from "../core/state.js";

let renderAttempts = 0;
let afterLogin = async () => {};

export function setAfterLoginHandler(handler) { afterLogin = handler; }

function t(es, en) {
  return state.locale === "en" ? en : es;
}

function guestFeatures() {
  return [
    {
      title: t("Explora", "Explore"),
      body: t(
        "Recorre regiones, descubre zonas y encuentra criaturas nuevas en cada ruta.",
        "Travel across regions, discover zones, and find new creatures in every route."
      )
    },
    {
      title: t("Captura", "Catch"),
      body: t(
        "Encuentra Mastersmon raros, usa tus ítems y amplía tu colección.",
        "Find rare Mastersmon, use your items, and grow your collection."
      )
    },
    {
      title: t("Entrena", "Train"),
      body: t(
        "Arma tu equipo ideal, mejora tu estrategia y sigue progresando.",
        "Build your ideal team, improve your strategy, and keep progressing."
      )
    },
    {
      title: t("Compite", "Compete"),
      body: t(
        "Supera gimnasios, comercia con otros jugadores y sube en el ranking.",
        "Beat gyms, trade with other players, and climb the ranking."
      )
    }
  ];
}

function renderFeatureCards() {
  return guestFeatures().map((item) => `
    <article class="login-feature-card">
      <span class="login-feature-kicker">${escapeHtml(item.title)}</span>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join("");
}

function renderJourneySteps() {
  const steps = [
    t("Inicia sesión", "Sign in"),
    t("Elige tu starter", "Choose your starter"),
    t("Comienza tu aventura", "Start your adventure")
  ];
  return steps.map((step, index) => `
    <article class="journey-step-card">
      <span>${index + 1}</span>
      <strong>${escapeHtml(step)}</strong>
    </article>
  `).join("");
}

export function renderLogin() {
  renderTopbarProfile();
  refs.logoutButton?.classList.add("hidden");

  refs.appContent.innerHTML = `
    <section class="hero-panel login-hero-panel">
      <div class="login-grid login-grid-reworked">
        <article class="login-card login-card-hero">
          <span class="eyebrow login-eyebrow">${escapeHtml(t("Bienvenido a Mastersmon", "Welcome to Mastersmon"))}</span>
          <h1>${escapeHtml(t("Tu aventura empieza ahora.", "Your journey starts now."))}</h1>
          <p class="body-copy login-lead-copy">${escapeHtml(
            t(
              "Captura criaturas, construye tu equipo ideal, explora regiones y avanza por gimnasios, intercambios y eventos.",
              "Catch creatures, build your dream team, explore regions, and progress through gyms, trading, and events."
            )
          )}</p>

          <div id="googleMount" class="login-google-mount"></div>
          <div id="loginStatusArea" class="login-status"></div>

          <div class="login-hero-actions">
            <button type="button" class="soft-btn" id="btnGuestScroll">${escapeHtml(t("Descubrir el juego", "Discover the game"))}</button>
          </div>

          <div class="login-trust-strip">
            <span>${escapeHtml(t("Empieza gratis", "Start free"))}</span>
            <span>${escapeHtml(t("Progreso persistente", "Persistent progress"))}</span>
            <span>${escapeHtml(t("Cuenta única con Google", "Single Google sign-in"))}</span>
          </div>
        </article>

        <aside class="login-side login-side-reworked">
          <div class="login-side-panel">
            <span class="login-side-badge">${escapeHtml(t("Qué puedes hacer", "What you can do"))}</span>
            <h2>${escapeHtml(t("Empieza como entrenador y sigue creciendo.", "Start as a trainer and keep growing."))}</h2>
            <div class="login-features-grid">
              ${renderFeatureCards()}
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="section-card guest-journey-panel" id="guestJourneyPanel">
      <div class="section-head compact-head">
        <div>
          <span class="eyebrow">${escapeHtml(t("Cómo funciona", "How it works"))}</span>
          <h2>${escapeHtml(t("Entra y juega en minutos.", "Get in and play in minutes."))}</h2>
          <p class="body-copy">${escapeHtml(
            t(
              "Mastersmon está diseñado para que un jugador nuevo entienda el flujo desde el primer ingreso.",
              "Mastersmon is designed so a new player understands the flow from the very first visit."
            )
          )}</p>
        </div>
      </div>
      <div class="journey-steps-grid">
        ${renderJourneySteps()}
      </div>
    </section>`;

  document.getElementById("btnGuestScroll")?.addEventListener("click", () => {
    document.getElementById("guestJourneyPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  scheduleGoogleRender();
}

function scheduleGoogleRender() {
  renderAttempts = 0;
  const tryRender = () => {
    renderAttempts += 1;
    const mount = document.getElementById("googleMount");
    const statusArea = document.getElementById("loginStatusArea");
    if (!mount || !statusArea) return;

    if (window.google?.accounts?.id) {
      statusArea.innerHTML = "";
      mount.innerHTML = "";
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
      window.google.accounts.id.renderButton(mount, {
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
        locale: state.locale === "es" ? "es" : "en",
      });
      return;
    }

    if (renderAttempts < 12) {
      statusArea.innerHTML = statusCard(t("Cargando acceso con Google...", "Loading Google sign-in..."));
      setTimeout(tryRender, 500);
      return;
    }

    statusArea.innerHTML = statusCard(
      t("No pudimos cargar Google automáticamente. Prueba refrescando la página.", "We could not load Google automatically. Try refreshing the page."),
      "error"
    );
  };
  tryRender();
}

async function handleCredentialResponse(response) {
  const statusArea = document.getElementById("loginStatusArea");
  if (statusArea) {
    statusArea.innerHTML = statusCard(t("Conectando con Mastersmon...", "Connecting to Mastersmon..."));
  }

  try {
    const payload = await fetchJson("/v2/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: response.credential }),
    });
    saveToken(payload.data?.token || "");
    state.user = payload.data?.user || null;
    await afterLogin();
  } catch (error) {
    if (statusArea) {
      statusArea.innerHTML = statusCard(
        error.message || t("No se pudo iniciar sesión.", "Could not sign in."),
        "error"
      );
    }
  }
}
