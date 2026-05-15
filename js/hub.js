const HUB_STATE = {
  usuario: null,
  pokemon: [],
  onboarding: null,
};

function hubSafeText(value, fallback = "") {
  return String(value ?? fallback);
}

function hubGetFirstName(usuario) {
  const nombre = hubSafeText(usuario?.nombre || localStorage.getItem("google_user_name") || "Entrenador").trim();
  return nombre ? nombre.split(" ")[0] : "Entrenador";
}

function hubGetAvatar(usuario) {
  const avatarId = hubSafeText(usuario?.avatar_id || localStorage.getItem("usuario_avatar_id") || "steven").trim().toLowerCase() || "steven";
  return `img/avatars/${avatarId}.png`;
}

function hubGetTeamLabel(usuario) {
  const color = hubSafeText(usuario?.trainer_team_color || "").toLowerCase();
  const starter = hubSafeText(usuario?.trainer_starter_code || "").toLowerCase();
  if (color === "green") return "Equipo Verde · Bulbasaur";
  if (color === "red") return "Equipo Rojo · Charmander";
  if (color === "blue") return "Equipo Azul · Squirtle";
  if (starter) return `Starter · ${starter}`;
  return "Equipo sin definir";
}

function hubSpritePokemon(pokemon) {
  if (typeof obtenerImagenPokemon === "function") {
    try { return obtenerImagenPokemon(pokemon, Boolean(pokemon?.es_shiny)); } catch (_) {}
  }
  const rawId = Number(pokemon?.pokemon_id || pokemon?.species_id || pokemon?.id || 0);
  const id = String(rawId).padStart(4, "0");
  const folder = pokemon?.es_shiny ? "sprites_shiny" : "sprites_normal";
  return `img/pokemon-png/${folder}/${id}.png`;
}

function hubAuthRequired() {
  const token = typeof getAccessToken === "function" ? getAccessToken() : "";
  if (!token) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function hubSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function hubSetImage(id, src) {
  const el = document.getElementById(id);
  if (el) {
    el.src = src;
    el.onerror = () => { el.src = "img/avatars/steven.png"; };
  }
}

function hubRenderUsuario() {
  const usuario = HUB_STATE.usuario || (typeof getUsuarioLocal === "function" ? getUsuarioLocal() : null) || {};
  const firstName = hubGetFirstName(usuario);
  const avatar = hubGetAvatar(usuario);

  hubSetText("hubUserName", firstName);
  hubSetText("hubGreeting", `Bienvenido, ${firstName}`);
  hubSetText("hubTrainerName", usuario?.nombre || firstName);
  hubSetText("hubTrainerTeam", hubGetTeamLabel(usuario));
  hubSetText("hubTrainerMoney", `Pokédolares: ${Number(usuario?.pokedolares || 0).toLocaleString("es-PE")}`);
  hubSetImage("hubAvatar", avatar);
  hubSetImage("hubTrainerAvatarBig", avatar);
}

function hubMissionMeta(codigo) {
  const key = hubSafeText(codigo).toLowerCase();
  const meta = {
    capturas: { icon: "🗺️", title: "Captura 6 Pokémon", text: "Explora Maps y captura tu primera base de equipo.", href: "maps.html" },
    equipo: { icon: "👥", title: "Guarda tu equipo", text: "Arma una escuadra completa de 6 Pokémon.", href: "battle.html" },
    batalla: { icon: "⚔️", title: "Gana Battle IA", text: "Derrota tu primer rival IA para cerrar la ruta inicial.", href: "battle.html" },
  };
  return meta[key] || { icon: "⭐", title: codigo || "Misión", text: "Completa el objetivo para reclamar progreso.", href: "maps.html" };
}

function hubRenderMissions() {
  const list = document.getElementById("hubMissionList");
  const progress = document.getElementById("hubMissionProgress");
  if (!list) return;

  const data = HUB_STATE.onboarding || {};
  const misiones = Array.isArray(data.misiones) ? data.misiones : [];
  const completadas = Number(data?.progreso?.completadas || misiones.filter(m => m.completada).length || 0);
  const total = Number(data?.progreso?.total || misiones.length || 3);
  if (progress) progress.textContent = `${completadas} / ${total}`;

  if (!misiones.length) {
    list.innerHTML = `
      <div class="hub-mission-card">
        <span class="hub-mission-icon">🗺️</span>
        <div><h3>Empieza en Maps</h3><p>Captura Pokémon, arma equipo y gana tu primera Battle IA.</p></div>
        <a class="hub-mission-status" href="maps.html">Ir</a>
      </div>`;
    return;
  }

  list.innerHTML = misiones.map((mission) => {
    const meta = hubMissionMeta(mission.codigo);
    const actual = Number(mission.actual || 0);
    const objetivo = Number(mission.objetivo || 0);
    const done = Boolean(mission.completada);
    return `
      <a class="hub-mission-card ${done ? "is-done" : ""}" href="${meta.href}">
        <span class="hub-mission-icon">${meta.icon}</span>
        <div>
          <h3>${meta.title}</h3>
          <p>${meta.text} · Progreso ${actual} / ${objetivo}</p>
        </div>
        <span class="hub-mission-status">${done ? "Completada" : "Pendiente"}</span>
      </a>`;
  }).join("");
}

function hubRenderTeam() {
  const box = document.getElementById("hubTeamPreview");
  if (!box) return;
  const pokemon = Array.isArray(HUB_STATE.pokemon) ? HUB_STATE.pokemon : [];
  const equipo = pokemon.filter(p => Number(p?.posicion || p?.equipo_posicion || 0) > 0)
    .sort((a, b) => Number(a.posicion || a.equipo_posicion || 0) - Number(b.posicion || b.equipo_posicion || 0));
  const visibles = (equipo.length ? equipo : pokemon.slice(0, 6)).slice(0, 6);

  if (!visibles.length) {
    box.innerHTML = `<a href="maps.html" class="hub-team-slot hub-team-empty">Captura tus primeros Pokémon</a>`;
  } else {
    box.innerHTML = visibles.map((p) => `
      <a class="hub-team-slot" href="mypokemon.html">
        <img src="${hubSpritePokemon(p)}" alt="${hubSafeText(p.nombre || p.pokemon_nombre || "Pokemon")}" onerror="this.style.display='none'" />
        <strong>${hubSafeText(p.nombre || p.pokemon_nombre || "Pokémon")}</strong>
        <span>Nv. ${Number(p.nivel || 1)}${p.es_shiny ? " · Shiny" : ""}</span>
      </a>`).join("");
  }

  const total = pokemon.length;
  const shiny = pokemon.filter(p => Boolean(p.es_shiny)).length;
  hubSetText("hubTotalPokemon", total.toLocaleString("es-PE"));
  hubSetText("hubTotalShiny", shiny.toLocaleString("es-PE"));
  hubSetText("hubTeamCount", `${visibles.length}/6`);
}

function hubChooseNextStep() {
  const data = HUB_STATE.onboarding || {};
  const missions = Array.isArray(data.misiones) ? data.misiones : [];
  const pending = missions.find(m => !m.completada);
  const meta = pending ? hubMissionMeta(pending.codigo) : null;
  const nextTitle = document.getElementById("hubNextTitle");
  const nextText = document.getElementById("hubNextText");
  const nextLink = document.getElementById("hubNextLink");
  const continueBtn = document.getElementById("hubContinueBtn");

  if (meta) {
    if (nextTitle) nextTitle.textContent = meta.title;
    if (nextText) nextText.textContent = meta.text;
    if (nextLink) { nextLink.href = meta.href; nextLink.textContent = "Continuar misión"; }
    if (continueBtn) continueBtn.href = meta.href;
    return;
  }

  if (nextTitle) nextTitle.textContent = "Explora una nueva zona";
  if (nextText) nextText.textContent = "Tu ruta inicial está lista. Sigue capturando, subiendo nivel y avanzando en Gyms.";
  if (nextLink) { nextLink.href = "maps.html"; nextLink.textContent = "Ir a Maps"; }
  if (continueBtn) continueBtn.href = "maps.html";
}

async function hubLoadData() {
  if (!hubAuthRequired()) return;
  hubRenderUsuario();
  try {
    if (typeof obtenerUsuarioActual === "function") {
      HUB_STATE.usuario = await obtenerUsuarioActual();
    }
  } catch (error) {
    console.warn("No se pudo cargar usuario actual:", error);
  }

  try {
    if (typeof obtenerPokemonUsuarioActual === "function") {
      HUB_STATE.pokemon = await obtenerPokemonUsuarioActual();
    }
  } catch (error) {
    console.warn("No se pudo cargar Pokémon del usuario:", error);
  }

  try {
    if (typeof obtenerOnboardingActual === "function") {
      HUB_STATE.onboarding = await obtenerOnboardingActual();
    }
  } catch (error) {
    console.warn("No se pudo cargar onboarding:", error);
  }

  hubRenderUsuario();
  hubRenderMissions();
  hubRenderTeam();
  hubChooseNextStep();
}

function hubBindEvents() {
  const logout = document.getElementById("hubLogoutBtn");
  if (logout) {
    logout.addEventListener("click", () => {
      if (typeof limpiarSesion === "function") limpiarSesion();
      window.location.href = "index.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  hubBindEvents();
  hubLoadData();
});
