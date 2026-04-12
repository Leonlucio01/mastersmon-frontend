const API_BASE = "https://mastersmon-api.onrender.com";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";

const state = {
  screen: "home"
};

const content = document.getElementById("content");

function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    || localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    || "";
}

function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function saveSession(data) {
  if (!data) return;

  if (data.access_token) {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.access_token);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  if (data.usuario) {
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    localStorage.setItem("usuario_id", String(data.usuario.id || ""));
    localStorage.setItem("usuario_avatar_id", data.usuario.avatar_id || "steven");
  }

  renderAuthUI(data.usuario || getLocalUser() || null);
}

function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuario_id");
  localStorage.removeItem("usuario_avatar_id");
  renderAuthUI(null);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      msg = data.detail || data.mensaje || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  return await response.json();
}

async function fetchAuth(url, options = {}) {
  const token = getAccessToken();
  if (!token) {
    const error = new Error("NO_TOKEN");
    error.code = "NO_TOKEN";
    throw error;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    clearSession();
    const error = new Error("UNAUTHORIZED");
    error.code = "UNAUTHORIZED";
    throw error;
  }

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      msg = data.detail || data.mensaje || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  return await response.json();
}

async function loginWithGoogleCredential(credential) {
  const data = await fetchJson(`${API_BASE}/auth/google-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ credential })
  });

  saveSession(data);
  return data;
}

async function fetchAuthMe() {
  return await fetchAuth(`${API_BASE}/auth/me`);
}

function renderAuthUI(user) {
  const userBox = document.getElementById("userBox");
  const userName = document.getElementById("userName");
  const googleBtn = document.querySelector(".g_id_signin");

  if (user && user.nombre) {
    if (userName) userName.textContent = `👤 ${user.nombre}`;
    if (userBox) userBox.classList.remove("hidden");
    if (googleBtn) googleBtn.style.display = "none";
  } else {
    if (userName) userName.textContent = "";
    if (userBox) userBox.classList.add("hidden");
    if (googleBtn) googleBtn.style.display = "";
  }
}

window.handleCredentialResponse = async function(response) {
  try {
    if (!response || !response.credential) return;
    await loginWithGoogleCredential(response.credential);
  } catch (error) {
    console.error("Login Google error:", error);
    clearSession();
    alert("No se pudo iniciar sesión con Google.");
  }
};

async function bootstrapSession() {
  const localUser = getLocalUser();
  const token = getAccessToken();

  if (token && localUser) {
    renderAuthUI(localUser);
  } else {
    renderAuthUI(null);
  }

  if (!token) return;

  try {
    const data = await fetchAuthMe();
    if (data && data.usuario) {
      saveSession({ usuario: data.usuario });
    }
  } catch (error) {
    console.error("Error validating session:", error);
    if (error.code === "UNAUTHORIZED" || error.code === "NO_TOKEN") {
      clearSession();
    }
  }
}

document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.screen = btn.dataset.nav;
    document.querySelectorAll("nav button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

function renderHome() {
  const user = getLocalUser();

  content.innerHTML = `
    <section class="screen">
      <span class="eyebrow">Trainer Hub</span>
      <h1>${user?.nombre ? `Hola, ${user.nombre}` : "Bienvenido a Mastersmon"}</h1>
      <p>${user ? "Tu sesión ya está activa. Ahora toca conectar Home y Adventure al backend real." : "Inicia sesión con Google para empezar tu aventura."}</p>

      <div class="card">
        <h3>Next Action</h3>
        <p>${user ? "Conectar /auth/me y luego /v2/home." : "Haz login y valida sesión."}</p>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Sesión</h3>
          <p>${getAccessToken() ? "Access token cargado" : "Sin token"}</p>
        </div>
        <div class="card">
          <h3>Usuario</h3>
          <p>${user?.correo || "No autenticado"}</p>
        </div>
      </div>
    </section>
  `;
}

function renderAdventure() {
  const user = getLocalUser();

  content.innerHTML = `
    <section class="screen">
      <span class="eyebrow">Adventure</span>
      <h1>Adventure</h1>
      <p>${user ? "Pantalla base lista para conectar /v2/adventure." : "Necesitas iniciar sesión para cargar progreso real."}</p>

      <div class="grid">
        <div class="card">
          <h3>Kanto</h3>
          <p>Ruta inicial del juego.</p>
        </div>
        <div class="card">
          <h3>Johto</h3>
          <p>Disponible en la siguiente fase.</p>
        </div>
        <div class="card">
          <h3>Hoenn</h3>
          <p>Preparado para expansión.</p>
        </div>
      </div>
    </section>
  `;
}

function render() {
  if (state.screen === "home") renderHome();
  if (state.screen === "adventure") renderAdventure();
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    clearSession();
    render();
  });

  await bootstrapSession();
  render();
});
