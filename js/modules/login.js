import { tr } from "../core/i18n.js";
import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { GOOGLE_CLIENT_ID } from "../core/config.js";
import { fetchJson } from "../core/api.js";
import { saveToken } from "../core/auth.js";
import { state } from "../core/state.js";

let renderAttempts = 0;
let afterLogin = async () => {};

export function setAfterLoginHandler(handler) { afterLogin = handler; }

export function renderLogin() {
  renderTopbarProfile();
  refs.logoutButton?.classList.add("hidden");
  refs.appContent.innerHTML = `
    <section class="hero-panel">
      <div class="login-grid">
        <article class="login-card">
          <span class="eyebrow">${escapeHtml(tr("login.eyebrow"))}</span>
          <h2>${escapeHtml(tr("login.title"))}</h2>
          <p class="body-copy">${escapeHtml(tr("login.body"))}</p>
          <div id="googleMount" style="margin-top:18px"></div>
          <div id="loginStatusArea" class="login-status">${statusCard(tr("login.status"))}</div>
        </article>
        <aside class="login-side">
          <div class="login-points">
            <div class="login-point"><strong>Core</strong><p class="body-copy">js/core para auth, state, api, i18n y router.</p></div>
            <div class="login-point"><strong>Modules</strong><p class="body-copy">js/modules para onboarding, home y adventure.</p></div>
            <div class="login-point"><strong>CSS</strong><p class="body-copy">css por secciones en vez de mezclar todo en un solo archivo.</p></div>
          </div>
        </aside>
      </div>
    </section>`;
  scheduleGoogleRender();
}

function scheduleGoogleRender() {
  renderAttempts = 0;
  const tryRender = () => {
    renderAttempts += 1;
    const mount = document.getElementById("googleMount");
    const statusArea = document.getElementById("loginStatusArea");
    if (!mount) return;
    if (window.google?.accounts?.id) {
      statusArea.innerHTML = "";
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
      window.google.accounts.id.renderButton(mount, { theme: "filled_blue", size: "large", shape: "pill", text: "continue_with", width: 300, locale: state.locale === "es" ? "es" : "en" });
      return;
    }
    if (renderAttempts < 12) {
      setTimeout(tryRender, 500);
      return;
    }
    statusArea.innerHTML = statusCard("No pudimos cargar Google automáticamente. Prueba recargando.", "error");
  };
  tryRender();
}

async function handleCredentialResponse(response) {
  const statusArea = document.getElementById("loginStatusArea");
  statusArea.innerHTML = statusCard("Conectando con Mastersmon V2...");
  try {
    const payload = await fetchJson("/v2/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: response.credential }),
    });
    saveToken(payload.data?.token || "");
    state.user = payload.data?.user || null;
    await afterLogin();
  } catch (error) {
    statusArea.innerHTML = statusCard(error.message || "No se pudo iniciar sesión.", "error");
  }
}
