const API_BASE = "https://mastersmon-api.onrender.com";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";
const GOOGLE_CLIENT_ID = "535230935122-vqqd262fjhetd408li95420bb8cas5vb.apps.googleusercontent.com";

const state = {
    token: "",
    user: null,
    onboarding: null,
    onboardingOptions: null,
    home: null,
    regions: [],
    loading: false,
    error: "",
    selectedStarterId: null,
    selectedRegionCode: "",
    selectedStarterGeneration: "all",
    selectedAvatarCode: "steven",
};

const appContent = document.getElementById("appContent");
const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");
const topbarProfile = document.getElementById("topbarProfile");
let googleRenderAttempts = 0;

function getTokenStorage() {
    try {
        return window.sessionStorage;
    } catch (_) {
        return window.localStorage;
    }
}

function saveToken(token) {
    state.token = token || "";
    getTokenStorage().setItem(ACCESS_TOKEN_STORAGE_KEY, state.token);
}

function clearToken() {
    state.token = "";
    getTokenStorage().removeItem(ACCESS_TOKEN_STORAGE_KEY);
    try {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch (_) {}
}

function getToken() {
    return getTokenStorage().getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
}

async function fetchJson(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    let payload = null;
    try {
        payload = await response.json();
    } catch (_) {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.error?.message || payload?.detail?.message || `HTTP ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return payload;
}

async function fetchAuth(path, options = {}) {
    const token = state.token || getToken();
    if (!token) {
        const error = new Error("No hay sesion activa.");
        error.status = 401;
        throw error;
    }

    return fetchJson(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
}

function setError(message) {
    state.error = message || "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function teamLabel(teamCode) {
    const labels = {
        red: "Team Red",
        blue: "Team Blue",
        green: "Team Green",
        neutral: "Neutral",
    };
    return labels[teamCode] || teamCode || "Neutral";
}

function getTrainerInitials(name) {
    const words = String(name || "Trainer")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
    return words.map((word) => word[0]?.toUpperCase() || "").join("") || "T";
}

function getTrainerSummary() {
    return state.home?.trainer || state.onboarding?.profile || state.user || {};
}

function resolveTrainerAvatarUrl(trainer) {
    const avatarCode = String(trainer?.avatar_code || state.selectedAvatarCode || "steven").trim().toLowerCase();
    if (avatarCode) {
        return `/img/avatars/${avatarCode}.png`;
    }
    return String(trainer?.avatar_url || trainer?.photo_url || "").trim();
}

function renderTopbarProfile() {
    if (!topbarProfile) return;

    const trainer = getTrainerSummary();
    const displayName = trainer.display_name || trainer.email?.split("@")[0] || "";
    const avatarUrl = resolveTrainerAvatarUrl(trainer);
    const teamName = teamLabel(trainer.team || trainer.trainer_team || "neutral");

    if (!state.token || !displayName) {
        topbarProfile.innerHTML = "";
        topbarProfile.classList.add("hidden");
        return;
    }

    topbarProfile.innerHTML = `
        <div class="trainer-chip">
            ${avatarUrl ? `
                <img class="trainer-chip-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}">
            ` : `
                <span class="trainer-chip-fallback">${escapeHtml(getTrainerInitials(displayName))}</span>
            `}
            <div class="trainer-chip-copy">
                <strong>${escapeHtml(displayName)}</strong>
                <small>${escapeHtml(teamName)}</small>
            </div>
        </div>
    `;
    topbarProfile.classList.remove("hidden");
}

function resolvePokemonAssetUrl(assetUrl) {
    const value = String(assetUrl || "").trim();
    if (!value) return "";

    if (value.startsWith("/img/pokemon-png/") && !value.includes("/sprites_normal/") && !value.includes("/sprites_shiny/")) {
        const fileName = value.split("/").pop();
        return `/img/pokemon-png/sprites_normal/${fileName}`;
    }

    return value;
}

function onPokemonImageError(imageElement) {
    if (!imageElement) return;
    imageElement.dataset.failed = "1";
    imageElement.style.visibility = "hidden";
}

function renderStatus(message, type = "status") {
    const klass = type === "error" ? "error-banner" : type === "success" ? "success-banner" : "status-banner";
    return `<div class="${klass}">${escapeHtml(message)}</div>`;
}

function renderModuleCard(title, description, disabled) {
    return `
        <article class="module-card ${disabled ? "is-disabled" : ""}">
            <span class="eyebrow">${disabled ? "Siguiente" : "Activo"}</span>
            <h3>${escapeHtml(title)}</h3>
            <p class="body-copy">${escapeHtml(description)}</p>
        </article>
    `;
}

function renderSkeletonHome() {
    appContent.innerHTML = `
        <section class="hero-panel skeleton" style="height: 280px;"></section>
        <section class="section-card skeleton" style="height: 320px;"></section>
        <section class="section-card skeleton" style="height: 260px;"></section>
    `;
}

function renderGoogleButton() {
    const mount = document.getElementById("googleLoginMount");
    if (!mount) return;

    if (!window.google?.accounts?.id) {
        googleRenderAttempts += 1;
        if (googleRenderAttempts <= 20) {
            mount.innerHTML = `<div class="status-banner">Cargando acceso con Google...</div>`;
            window.setTimeout(renderGoogleButton, 350);
        } else {
            mount.innerHTML = `<div class="error-banner">No pudimos cargar Google automáticamente. Prueba recargando una vez.</div>`;
        }
        return;
    }

    googleRenderAttempts = 0;
    mount.innerHTML = "";
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(mount, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 320,
    });
}

function scrollToLogin() {
    document.getElementById("googleLoginMount")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderHeroLogin() {
    renderTopbarProfile();
    appContent.innerHTML = `
        <section class="hero-panel">
            <div class="hero-grid">
                <div class="hero-copy">
                    <span class="eyebrow">Mastersmon V2</span>
                    <h1>Tu viaje de entrenador empieza en un hub real de juego.</h1>
                    <p>
                        Dejamos atrás la web partida en páginas sueltas. Esta nueva entrada ya está pensada como shell del juego:
                        login, onboarding, home y adventure sobre la API V2.
                    </p>
                    <div class="hero-actions">
                        <button class="primary-btn" type="button" id="heroLoginBtn">Continuar con Google</button>
                        <button class="soft-btn" type="button" id="heroPreviewBtn">Ver visión del juego</button>
                    </div>
                </div>

                <div class="hero-aside">
                    <article class="metric-card">
                        <span>Base V2</span>
                        <strong>Lista</strong>
                        <p class="body-copy">Catálogo, zonas, gyms, house y trade ya viven sobre <code>game</code>.</p>
                    </article>
                    <article class="metric-card">
                        <span>Flujo nuevo</span>
                        <strong>Login → Onboarding → Home</strong>
                        <p class="body-copy">Mobile-first y listo para crecer luego hacia app instalable.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>Acceso rápido</h2>
                    <p>Entramos con Google y en el primer ingreso completamos nombre, team, starter y región inicial.</p>
                </div>
            </div>
            <div class="login-grid">
                <article class="auth-card">
                    <span class="eyebrow">Autenticación</span>
                    <h2>Un solo acceso, sin fricción.</h2>
                    <p class="body-copy">El backend crea usuario, perfil, wallet y house al primer login. Después te mandamos a onboarding o directo al juego.</p>
                    <div id="googleLoginMount"></div>
                    <div id="loginStatusArea"></div>
                </article>

                <article class="section-card">
                    <div class="section-head">
                        <div>
                            <h2>Lo que viene en esta V2</h2>
                            <p>El shell ya te deja ver la dirección del juego antes de reconstruir cada módulo visual.</p>
                        </div>
                    </div>
                    <div class="module-grid">
                        ${renderModuleCard("Home", "Hub del entrenador con progreso, equipo y alertas.", false)}
                        ${renderModuleCard("Adventure", "Maps, regiones y zonas como centro del juego.", false)}
                        ${renderModuleCard("Collection", "Consulta de colección y variantes.", true)}
                        ${renderModuleCard("Team", "Equipo activo y presets.", true)}
                        ${renderModuleCard("Gyms", "Ruta de progreso regional.", true)}
                        ${renderModuleCard("House", "Storage, featured y upgrades.", true)}
                    </div>
                </article>
            </div>
        </section>
    `;

    document.getElementById("heroLoginBtn")?.addEventListener("click", scrollToLogin);
    document.getElementById("heroPreviewBtn")?.addEventListener("click", () => {
        document.querySelector(".section-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    renderGoogleButton();
}

function renderOnboarding(optionsData) {
    const profile = state.onboarding?.profile || {};
    const avatars = optionsData.avatars || [];
    const starters = optionsData.starters || [];
    const regions = optionsData.regions || [];
    const starterGenerations = Array.from(new Set(starters.map((starter) => starter.generation_id))).sort((a, b) => a - b);
    if (state.selectedStarterGeneration !== "all" && !starterGenerations.includes(Number(state.selectedStarterGeneration))) {
        state.selectedStarterGeneration = "all";
    }

    const visibleStarters = state.selectedStarterGeneration === "all"
        ? starters
        : starters.filter((starter) => String(starter.generation_id) === String(state.selectedStarterGeneration));

    if (!state.selectedStarterId && starters[0]) {
        state.selectedStarterId = starters[0].id;
    }
    if (!state.selectedRegionCode && regions[0]) {
        state.selectedRegionCode = regions[0].code;
    }
    if (!state.selectedAvatarCode) {
        state.selectedAvatarCode = profile.avatar_code || state.user?.avatar_code || avatars[0]?.code || "steven";
    }
    if (!visibleStarters.some((starter) => starter.id === state.selectedStarterId) && visibleStarters[0]) {
        state.selectedStarterId = visibleStarters[0].id;
    }

    renderTopbarProfile();

    appContent.innerHTML = `
        <section class="hero-panel">
            <div class="hero-grid">
                <div class="hero-copy">
                    <span class="eyebrow">Primer ingreso</span>
                    <h1>Vamos a preparar a tu entrenador.</h1>
                    <p>
                        Este onboarding ya no es un modal suelto: es la puerta real a Mastersmon V2.
                        Aquí definimos tu identidad, tu starter y la región donde empieza tu aventura.
                    </p>
                </div>
                <div class="hero-aside">
                    <article class="trainer-spotlight">
                        <div class="trainer-spotlight-head">
                            ${resolveTrainerAvatarUrl({ avatar_code: state.selectedAvatarCode, photo_url: profile.photo_url || state.user?.photo_url }) ? `
                                <img class="trainer-spotlight-avatar" src="${escapeHtml(resolveTrainerAvatarUrl({ avatar_code: state.selectedAvatarCode, photo_url: profile.photo_url || state.user?.photo_url }))}" alt="${escapeHtml(profile.display_name || state.user?.display_name || "Trainer")}">
                            ` : `
                                <span class="trainer-spotlight-fallback">${escapeHtml(getTrainerInitials(profile.display_name || state.user?.display_name || "Trainer"))}</span>
                            `}
                            <div>
                                <span>Entrenador</span>
                                <strong>${escapeHtml(profile.display_name || state.user?.display_name || "Trainer")}</strong>
                                <p class="body-copy">Vamos a dejar tu perfil listo con identidad, starter y región inicial.</p>
                            </div>
                        </div>
                        <div class="pill-row">
                            <span class="pill tag-accent">${escapeHtml(teamLabel(profile.trainer_team || "neutral"))}</span>
                            <span class="pill">${visibleStarters.length} starters visibles</span>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>Configura tu comienzo</h2>
                    <p>Elegimos identidad, starter y región inicial. Luego te mandamos al Home ya con el primer equipo listo.</p>
                </div>
            </div>

            ${state.error ? renderStatus(state.error, "error") : ""}

            <div class="onboarding-grid">
                <form id="onboardingForm" class="onboarding-card">
                    <div class="field-grid">
                        <div class="field">
                            <label for="displayNameInput">Nombre del entrenador</label>
                            <input id="displayNameInput" name="displayName" type="text" value="${escapeHtml(profile.display_name || state.user?.display_name || "")}" placeholder="Jhonatan León">
                        </div>

                        <div class="field">
                            <label>Avatar</label>
                            <div class="avatar-grid">
                                ${avatars.map((avatar) => `
                                    <button class="avatar-card ${state.selectedAvatarCode === avatar.code ? "is-selected" : ""}" type="button" data-avatar-code="${escapeHtml(avatar.code)}">
                                        <img src="${escapeHtml(avatar.asset_url)}" alt="${escapeHtml(avatar.name)}" onerror="onPokemonImageError(this)">
                                        <span>${escapeHtml(avatar.name)}</span>
                                    </button>
                                `).join("")}
                            </div>
                        </div>

                        <div class="field">
                            <label for="trainerTeamSelect">Team</label>
                            <select id="trainerTeamSelect" name="trainerTeam">
                                ${["red", "blue", "green", "neutral"].map((code) => `
                                    <option value="${code}" ${profile.trainer_team === code ? "selected" : ""}>${teamLabel(code)}</option>
                                `).join("")}
                            </select>
                        </div>

                        <div class="field">
                            <label for="regionSelect">Región inicial</label>
                            <select id="regionSelect" name="regionCode">
                                ${regions.map((region) => `
                                    <option value="${escapeHtml(region.code)}" ${state.selectedRegionCode === region.code ? "selected" : ""}>
                                        ${escapeHtml(region.name)}
                                    </option>
                                `).join("")}
                            </select>
                        </div>
                    </div>

                    <div class="stack-actions">
                        <button class="primary-btn" type="submit">Completar onboarding</button>
                        <button class="ghost-btn" type="button" id="reloadOptionsBtn">Recargar opciones</button>
                    </div>
                </form>

                <article class="onboarding-card">
                    <div class="section-head">
                        <div>
                            <h2>Elige tu starter</h2>
                            <p>Ahora ya no mostramos una lista eterna. Puedes filtrar por generación y comparar mejor cada opción.</p>
                        </div>
                    </div>
                    <div class="starter-toolbar">
                        <div class="generation-filter" role="tablist" aria-label="Filtrar starters por generación">
                            <button class="filter-chip ${state.selectedStarterGeneration === "all" ? "is-active" : ""}" type="button" data-starter-generation="all">Todas</button>
                            ${starterGenerations.map((generationId) => `
                                <button class="filter-chip ${String(state.selectedStarterGeneration) === String(generationId) ? "is-active" : ""}" type="button" data-starter-generation="${generationId}">Gen ${generationId}</button>
                            `).join("")}
                        </div>
                        <p class="body-copy">Mostrando ${visibleStarters.length} de ${starters.length} starters activos.</p>
                    </div>
                    <div class="starter-grid">
                        ${visibleStarters.map((starter) => `
                            <button class="starter-card ${starter.id === state.selectedStarterId ? "is-selected" : ""}" type="button" data-starter-id="${starter.id}">
                                <div class="starter-card-art">
                                    <img class="pokemon-figure" src="${escapeHtml(resolvePokemonAssetUrl(starter.asset_url || ""))}" alt="${escapeHtml(starter.name)}" onerror="onPokemonImageError(this)">
                                </div>
                                <div class="starter-card-copy">
                                    <strong>${escapeHtml(starter.name)}</strong>
                                    <div class="pill-row">
                                        <span class="pill">Gen ${starter.generation_id}</span>
                                        <span class="pill tag-accent">${escapeHtml(starter.primary_type_name || "Starter")}</span>
                                    </div>
                                    <p class="body-copy">Starter base para comenzar esta región con una elección más ordenada y visual.</p>
                                </div>
                            </button>
                        `).join("")}
                    </div>
                </article>
            </div>
        </section>
    `;

    document.querySelectorAll("[data-starter-id]").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedStarterId = Number(button.getAttribute("data-starter-id"));
            renderOnboarding(optionsData);
        });
    });

    document.querySelectorAll("[data-starter-generation]").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedStarterGeneration = button.getAttribute("data-starter-generation");
            renderOnboarding(optionsData);
        });
    });

    document.querySelectorAll("[data-avatar-code]").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedAvatarCode = button.getAttribute("data-avatar-code");
            renderOnboarding(optionsData);
        });
    });

    document.getElementById("regionSelect")?.addEventListener("change", (event) => {
        state.selectedRegionCode = event.target.value;
    });

    document.getElementById("reloadOptionsBtn")?.addEventListener("click", async () => {
        await bootstrapAuthenticatedApp(true);
    });

    document.getElementById("onboardingForm")?.addEventListener("submit", submitOnboarding);
}

function renderHome() {
    const trainer = state.home?.trainer || {};
    const progress = state.home?.progress || {};
    const teamSummary = state.home?.team_summary || { members: [] };
    const milestones = state.home?.milestones || {};
    const currentZone = state.home?.adventure?.current_zone || null;
    renderTopbarProfile();

    appContent.innerHTML = `
        <section class="hero-panel">
            <div class="hero-grid">
                <div class="hero-copy">
                    <span class="eyebrow">Trainer Hub</span>
                    <h1>${escapeHtml(trainer.display_name || "Trainer")}</h1>
                    <p>
                        ${escapeHtml(teamLabel(trainer.team))} · Región activa: ${escapeHtml(trainer.active_region?.name || "Sin región")}
                        · Nivel ${escapeHtml(trainer.trainer_level || 1)}
                    </p>
                    <div class="hero-actions">
                        <button class="primary-btn" type="button" id="goAdventureBtn">Continuar aventura</button>
                        <button class="soft-btn" type="button" id="refreshHomeBtn">Actualizar hub</button>
                    </div>
                </div>

                <div class="hero-aside">
                    <article class="trainer-spotlight">
                        <div class="trainer-spotlight-head">
                            ${resolveTrainerAvatarUrl(trainer) ? `
                                <img class="trainer-spotlight-avatar" src="${escapeHtml(resolveTrainerAvatarUrl(trainer))}" alt="${escapeHtml(trainer.display_name || "Trainer")}">
                            ` : `
                                <span class="trainer-spotlight-fallback">${escapeHtml(getTrainerInitials(trainer.display_name || "Trainer"))}</span>
                            `}
                            <div>
                                <span>Perfil activo</span>
                                <strong>${escapeHtml(trainer.display_name || "Trainer")}</strong>
                                <p class="body-copy">${escapeHtml(teamLabel(trainer.team))} · avatar ${escapeHtml(trainer.avatar_code || "base")}</p>
                            </div>
                        </div>
                    </article>
                    <article class="metric-card">
                        <span>Progreso regional</span>
                        <strong>${escapeHtml(progress.current_region_completion_pct || 0)}%</strong>
                        <p class="body-copy">${escapeHtml(progress.completed_gyms || 0)} gyms completados de la región actual.</p>
                    </article>
                    <article class="metric-card">
                        <span>Colección</span>
                        <strong>${escapeHtml(milestones.collection_owned || 0)}</strong>
                        <p class="body-copy">Especies únicas ya registradas en tu colección.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>Vista rápida del entrenador</h2>
                    <p>Este home ya consume la API V2 y está pensado como panel de decisión, no como landing page.</p>
                </div>
            </div>
            <div class="metrics-grid">
                <article class="metric-card">
                    <span>Región activa</span>
                    <strong>${escapeHtml(trainer.active_region?.name || "—")}</strong>
                    <p class="body-copy">Código: ${escapeHtml(trainer.active_region?.code || "—")}</p>
                </article>
                <article class="metric-card">
                    <span>Zonas desbloqueadas</span>
                    <strong>${escapeHtml(progress.unlocked_zones || 0)}</strong>
                    <p class="body-copy">Lista base ya conectada a Adventure.</p>
                </article>
                <article class="metric-card">
                    <span>Próximo upgrade house</span>
                    <strong>${escapeHtml(milestones.next_house_upgrade?.storage_capacity || "—")}</strong>
                    <p class="body-copy">${escapeHtml(milestones.next_house_upgrade?.code || "Sin upgrade pendiente")}</p>
                </article>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>Adventure y Team</h2>
                    <p>El shell V2 junta lo que el jugador necesita para seguir jugando sin saltar entre páginas rotas.</p>
                </div>
            </div>
            <div class="home-grid">
                <article class="section-card">
                    <h2>Continue Adventure</h2>
                    <p class="section-subtitle">
                        ${currentZone ? `${escapeHtml(currentZone.name)} · niveles ${escapeHtml(currentZone.level_min)}-${escapeHtml(currentZone.level_max)}` : "Todavía no hay zona actual cargada."}
                    </p>
                    <div class="pill-row" style="margin-top: 14px;">
                        <span class="pill tag-accent">${escapeHtml(progress.next_gym?.name || "Sin gym pendiente")}</span>
                        <span class="pill">${escapeHtml(progress.next_gym?.recommended_level || "—")} nivel recomendado</span>
                    </div>
                    <div class="stack-actions">
                        <button class="primary-btn" type="button" id="openAdventureRegionsBtn">Ver regiones</button>
                    </div>
                </article>

                <article class="section-card">
                    <h2>Team Snapshot</h2>
                    <p class="section-subtitle">Poder estimado: ${escapeHtml(teamSummary.power_score || 0)}</p>
                    <div class="team-grid">
                        ${(teamSummary.members || []).map((member) => `
                            <article class="member-card">
                                <div class="pokemon-inline">
                                    <img src="${escapeHtml(resolvePokemonAssetUrl(member.asset_url || ""))}" alt="${escapeHtml(member.name)}" onerror="onPokemonImageError(this)">
                                    <div>
                                        <strong>${escapeHtml(member.name)}</strong>
                                        <div class="pill-row">
                                            <span class="pill">Lv ${escapeHtml(member.level)}</span>
                                            <span class="pill tag-success">${escapeHtml(member.variant)}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        `).join("") || `<div class="panel-note">Todavía no hay miembros en el equipo activo.</div>`}
                    </div>
                </article>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>Módulos que ya viven en el backend</h2>
                    <p>Los dejamos visibles desde el home para marcar la dirección del juego mientras completamos la UI completa.</p>
                </div>
            </div>
            <div class="module-grid">
                ${renderModuleCard("Collection", "Listado, detalle y resumen ya listos en V2.", false)}
                ${renderModuleCard("Team", "Equipo activo y presets ya operativos.", false)}
                ${renderModuleCard("Gyms", "Resumen, listado y detalle del roster.", false)}
                ${renderModuleCard("House", "Storage, summary y upgrades conectados.", false)}
                ${renderModuleCard("Trade", "Ofertas, aceptación e historial ya disponibles.", false)}
                ${renderModuleCard("Shop", "Lo siguiente después del shell principal.", true)}
            </div>
        </section>
    `;

    document.getElementById("goAdventureBtn")?.addEventListener("click", renderAdventure);
    document.getElementById("openAdventureRegionsBtn")?.addEventListener("click", renderAdventure);
    document.getElementById("refreshHomeBtn")?.addEventListener("click", () => bootstrapAuthenticatedApp(true));
}

function renderAdventure() {
    const regions = state.regions || [];
    renderTopbarProfile();
    appContent.innerHTML = `
        <section class="hero-panel">
            <div class="hero-grid">
                <div class="hero-copy">
                    <span class="eyebrow">Adventure</span>
                    <h1>Explora el mundo como eje real del juego.</h1>
                    <p>
                        Esta pantalla ya usa las regiones V2 y marca la dirección del nuevo loop:
                        explorar, capturar, fortalecer equipo y avanzar en gyms.
                    </p>
                    <div class="hero-actions">
                        <button class="primary-btn" type="button" id="backHomeBtn">Volver al hub</button>
                        <button class="soft-btn" type="button" id="refreshAdventureBtn">Actualizar regiones</button>
                    </div>
                </div>
                <div class="hero-aside">
                    <article class="metric-card">
                        <span>Regiones activas</span>
                        <strong>${escapeHtml(regions.length)}</strong>
                        <p class="body-copy">Disponibles en la estructura V2.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>Regiones disponibles</h2>
                    <p>Estas tarjetas ya pueden alimentar el futuro selector principal de Adventure.</p>
                </div>
            </div>
            <div class="regions-grid">
                ${regions.map((region) => `
                    <article class="region-card">
                        <img class="region-banner" src="${escapeHtml(region.card_asset_path || "")}" alt="${escapeHtml(region.name)}" onerror="onPokemonImageError(this)">
                        <div>
                            <strong>${escapeHtml(region.name)}</strong>
                            <div class="pill-row">
                                <span class="pill">Gen ${escapeHtml(region.generation_id)}</span>
                                <span class="pill ${region.is_active_region ? "tag-accent" : ""}">${region.is_active_region ? "Activa" : "Disponible"}</span>
                            </div>
                        </div>
                        <p class="body-copy">${escapeHtml(region.zone_count || 0)} zonas · ${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)} gyms</p>
                        <div class="stack-actions">
                            <button class="soft-btn" type="button" data-region-code="${escapeHtml(region.code)}">Ver detalle</button>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>

        <section id="regionDetailMount"></section>
    `;

    document.getElementById("backHomeBtn")?.addEventListener("click", renderHome);
    document.getElementById("refreshAdventureBtn")?.addEventListener("click", () => bootstrapAuthenticatedApp(true, "adventure"));
    document.querySelectorAll("[data-region-code]").forEach((button) => {
        button.addEventListener("click", async () => {
            const regionCode = button.getAttribute("data-region-code");
            await loadRegionDetail(regionCode);
        });
    });
}

async function loadRegionDetail(regionCode) {
    const mount = document.getElementById("regionDetailMount");
    if (!mount) return;
    mount.innerHTML = `<section class="section-card skeleton" style="height: 280px;"></section>`;

    try {
        const response = await fetchAuth(`/v2/adventure/regions/${regionCode}`);
        const data = response.data || {};
        const region = data.region || {};
        const zones = data.zones || [];

        mount.innerHTML = `
            <section class="section-card">
                <div class="section-head">
                    <div>
                        <h2>${escapeHtml(region.name || regionCode)}</h2>
                        <p>${escapeHtml(region.description || "Detalle regional cargado desde la API V2.")}</p>
                    </div>
                </div>
                <div class="zones-grid">
                    ${zones.map((zone) => `
                        <article class="zone-card">
                            <div>
                                <strong>${escapeHtml(zone.name)}</strong>
                                <div class="pill-row">
                                    <span class="pill">${escapeHtml(zone.biome)}</span>
                                    <span class="pill">Lv ${escapeHtml(zone.level_min)}-${escapeHtml(zone.level_max)}</span>
                                </div>
                            </div>
                            <p class="body-copy">${escapeHtml(zone.encounter_species_count || 0)} especies destacadas.</p>
                            <div class="pill-row">
                                ${(zone.featured_species || []).map((pokemon) => `<span class="pill tag-accent">${escapeHtml(pokemon.name)}</span>`).join("")}
                            </div>
                        </article>
                    `).join("")}
                </div>
            </section>
        `;
    } catch (error) {
        mount.innerHTML = renderStatus(error.message || "No se pudo cargar la región.", "error");
    }
}

async function submitOnboarding(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const displayName = form.displayName.value.trim();
    const trainerTeam = form.trainerTeam.value;
    const regionCode = form.regionCode.value;

    if (!displayName) {
        setError("Escribe un nombre de entrenador.");
        renderOnboarding(state.onboardingOptions);
        return;
    }

    if (!state.selectedStarterId) {
        setError("Elige un starter para continuar.");
        renderOnboarding(state.onboardingOptions);
        return;
    }

    try {
        setError("");
        const response = await fetchAuth("/v2/onboarding/complete", {
            method: "POST",
            body: JSON.stringify({
                display_name: displayName,
                trainer_team: trainerTeam,
                starter_species_id: state.selectedStarterId,
                region_code: regionCode,
                avatar_code: state.selectedAvatarCode,
                language_code: "es",
                timezone_code: "America/Lima",
            }),
        });
        state.onboarding = { needs_onboarding: false, profile: response.data?.profile || null };
        await bootstrapAuthenticatedApp(true);
    } catch (error) {
        setError(error.message || "No se pudo completar el onboarding.");
        renderOnboarding(state.onboardingOptions);
    }
}

async function handleCredentialResponse(response) {
    const loginStatusArea = document.getElementById("loginStatusArea");
    if (loginStatusArea) {
        loginStatusArea.innerHTML = renderStatus("Conectando con Mastersmon V2...");
    }

    try {
        const payload = await fetchJson("/v2/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
        });

        saveToken(payload.data?.token || "");
        state.user = payload.data?.user || null;
        renderTopbarProfile();
        await bootstrapAuthenticatedApp(true);
    } catch (error) {
        if (loginStatusArea) {
            loginStatusArea.innerHTML = renderStatus(error.message || "No se pudo iniciar sesión.", "error");
        }
    }
}

async function bootstrapAuthenticatedApp(forceRefresh = false, targetView = "home") {
    if (!state.token) {
        state.token = getToken();
    }

    if (!state.token) {
        renderTopbarProfile();
        renderHeroLogin();
        logoutButton.classList.add("hidden");
        return;
    }

    if (forceRefresh) {
        state.home = null;
        state.regions = [];
        state.onboarding = null;
    }

    try {
        renderSkeletonHome();
        logoutButton.classList.remove("hidden");

        const [meResponse, onboardingResponse] = await Promise.all([
            fetchAuth("/v2/auth/me"),
            fetchAuth("/v2/onboarding/state"),
        ]);
        state.user = meResponse.data?.user || state.user;
        state.onboarding = onboardingResponse.data || null;
        renderTopbarProfile();

        if (state.onboarding?.needs_onboarding) {
            setActiveNav("home");
            const optionsResponse = await fetchAuth("/v2/onboarding/options");
            state.onboardingOptions = optionsResponse.data || { starters: [], regions: [] };
            renderOnboarding(state.onboardingOptions);
            return;
        }

        const [homeResponse, regionsResponse] = await Promise.all([
            fetchAuth("/v2/home/summary"),
            fetchAuth("/v2/adventure/regions"),
        ]);
        state.home = homeResponse.data || null;
        state.regions = regionsResponse.data || [];

        if (targetView === "adventure") {
            setActiveNav("adventure");
            renderAdventure();
        } else {
            setActiveNav("home");
            renderHome();
        }
    } catch (error) {
        if (error.status === 401) {
            clearToken();
            state.user = null;
            renderTopbarProfile();
            renderHeroLogin();
            return;
        }
        appContent.innerHTML = renderStatus(error.message || "No se pudo cargar el shell V2.", "error");
    }
}

function logout() {
    clearToken();
    state.user = null;
    state.onboarding = null;
    state.home = null;
    state.regions = [];
    logoutButton.classList.add("hidden");
    renderTopbarProfile();
    renderHeroLogin();
}

function setActiveNav(target) {
    document.querySelectorAll("[data-nav]").forEach((item) => {
        item.classList.toggle("is-active", item.getAttribute("data-nav") === target);
    });
}

document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", async () => {
        const target = button.getAttribute("data-nav");
        setActiveNav(target);

        if (!state.token) {
            renderHeroLogin();
            if (target !== "home") {
                scrollToLogin();
            }
            return;
        }

        if (target === "adventure") {
            if (!state.regions.length) {
                await bootstrapAuthenticatedApp(true, "adventure");
                return;
            }
            renderAdventure();
            return;
        }

        if (target === "home") {
            if (!state.home) {
                await bootstrapAuthenticatedApp(true, "home");
                return;
            }
            renderHome();
            return;
        }

        appContent.innerHTML = renderStatus(`El módulo ${target} será la siguiente pantalla en esta V2.`, "status");
    });
});

logoutButton.addEventListener("click", logout);
refreshButton.addEventListener("click", () => bootstrapAuthenticatedApp(true));
window.handleCredentialResponse = handleCredentialResponse;
window.onPokemonImageError = onPokemonImageError;

bootstrapAuthenticatedApp(false);
