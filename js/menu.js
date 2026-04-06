document.addEventListener("DOMContentLoaded", () => {
    if (window.__mastersmonMenuInitialized) return;
    window.__mastersmonMenuInitialized = true;

    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");
    const languageSelect = document.getElementById("languageSelect");
    const languageSelectMobile = document.getElementById("languageSelectMobile");
    const desktopDropdownToggles = document.querySelectorAll("[data-menu-dropdown-toggle]");
    const mobileGroupToggles = document.querySelectorAll("[data-menu-mobile-group-toggle]");

    const closeDesktopDropdowns = () => {
        document.querySelectorAll(".menu-dropdown.is-open").forEach((dropdown) => {
            dropdown.classList.remove("is-open");
            const toggle = dropdown.querySelector("[data-menu-dropdown-toggle]");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    };

    const closeMobileMenu = () => {
        if (menuMobile) menuMobile.classList.remove("menu-open");
    };

    if (menuToggle && menuMobile) {
        menuToggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }
            menuMobile.classList.toggle("menu-open");
        });

        menuMobile.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (!link.classList.contains("menu-disabled")) {
                    closeMobileMenu();
                }
            });
        });
    }

    desktopDropdownToggles.forEach((toggle) => {
        toggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const dropdown = toggle.closest(".menu-dropdown");
            if (!dropdown) return;
            const willOpen = !dropdown.classList.contains("is-open");
            closeDesktopDropdowns();
            if (willOpen) {
                dropdown.classList.add("is-open");
                toggle.setAttribute("aria-expanded", "true");
            }
        });
    });

    document.querySelectorAll(".menu-dropdown-panel a").forEach((link) => {
        link.addEventListener("click", () => {
            if (!link.classList.contains("menu-disabled")) {
                closeDesktopDropdowns();
            }
        });
    });

    mobileGroupToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const target = toggle.getAttribute("data-menu-mobile-group-toggle");
            const submenu = document.querySelector(`[data-menu-mobile-group="${target}"]`);
            if (!submenu) return;
            const willOpen = !submenu.classList.contains("is-open");
            submenu.classList.toggle("is-open", willOpen);
            toggle.classList.toggle("is-open", willOpen);
            toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
    });

    document.addEventListener("click", (event) => {
        const insideDropdown = event.target.closest(".menu-dropdown");
        if (!insideDropdown) {
            closeDesktopDropdowns();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeDesktopDropdowns();
            closeMobileMenu();
            cerrarBossToastGlobal();
            cerrarIdleToastGlobal();
        }
    });

    const currentLang = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
    if (languageSelect) languageSelect.value = currentLang;
    if (languageSelectMobile) languageSelectMobile.value = currentLang;

    const syncLanguage = (lang) => {
        if (languageSelect) languageSelect.value = lang;
        if (languageSelectMobile) languageSelectMobile.value = lang;
        if (typeof setCurrentLang === "function") {
            setCurrentLang(lang);
        }
    };

    if (languageSelect) {
        languageSelect.addEventListener("change", (event) => syncLanguage(event.target.value));
    }

    if (languageSelectMobile) {
        languageSelectMobile.addEventListener("change", (event) => syncLanguage(event.target.value));
    }

    document.querySelectorAll(".menu-disabled").forEach((link) => {
        link.addEventListener("click", (event) => event.preventDefault());
    });

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    iniciarAlertaBossGlobal();
    iniciarAlertaIdleGlobal();
});

let bossAlertPollTimer = null;
let bossAlertToastElement = null;
let bossAlertLiveState = false;
let bossAlertRequestInFlight = false;
let bossAlertLastCheckAt = 0;

let idleAlertPollTimer = null;
let idleAlertToastElement = null;
let idleAlertReadyState = false;
let idleAlertRequestInFlight = false;
let idleAlertLastCheckAt = 0;

const MENU_ALERT_POLL_INTERVAL_MS = 120000;
const MENU_ALERT_VISIBILITY_COOLDOWN_MS = 30000;
const MENU_ALERT_SHARED_CACHE_MAX_AGE_MS = 45000;
const MENU_ALERT_CACHE_PREFIX = "mastersmon_menu_alert_cache_";

function obtenerMenuPageName() {
    try {
        const path = String(window.location.pathname || "").toLowerCase();
        const file = path.split("/").pop() || "index.html";
        return file || "index.html";
    } catch (error) {
        return "index.html";
    }
}

function paginaGestionaBossMenu() {
    const page = obtenerMenuPageName();
    return page === "battle.html" || page === "battle-arena.html";
}

function paginaGestionaIdleMenu() {
    const page = obtenerMenuPageName();
    return page === "battle.html" || page === "battle-arena.html" || page === "idle.html";
}

function obtenerMenuAlertCacheKey(tipo = "") {
    return `${MENU_ALERT_CACHE_PREFIX}${String(tipo || "").trim().toLowerCase()}`;
}

function leerCacheMenuAlert(tipo = "", maxAgeMs = MENU_ALERT_SHARED_CACHE_MAX_AGE_MS) {
    try {
        const raw = localStorage.getItem(obtenerMenuAlertCacheKey(tipo));
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        if (!savedAt || (Date.now() - savedAt) > Number(maxAgeMs || 0)) {
            return null;
        }

        return parsed.data ?? null;
    } catch (error) {
        return null;
    }
}

function guardarCacheMenuAlert(tipo = "", data = null) {
    try {
        localStorage.setItem(
            obtenerMenuAlertCacheKey(tipo),
            JSON.stringify({
                savedAt: Date.now(),
                data: data ?? null
            })
        );
    } catch (error) {
        // no-op
    }
}

function limpiarCacheMenuAlert(tipo = "") {
    try {
        localStorage.removeItem(obtenerMenuAlertCacheKey(tipo));
    } catch (error) {
        // no-op
    }
}


function getBossAlertTexts() {
    const lang = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
    if (lang === "es") {
        return {
            badge: "ALPHA BOSS",
            title: "El Alpha Boss ya está activo",
            description: "Entra ahora a Battle y participa en el evento del mundo antes de que termine.",
            action: "Ir a Battle",
            dismiss: "Cerrar",
            liveChip: "Alpha en vivo",
            bossFallback: "Alpha Boss"
        };
    }

    return {
        badge: "ALPHA BOSS",
        title: "The Alpha Boss is now live",
        description: "Jump into Battle now and join the world event before it ends.",
        action: "Go to Battle",
        dismiss: "Dismiss",
        liveChip: "Alpha live",
        bossFallback: "Alpha Boss"
    };
}

function aplicarEstadoVisualBossMenu(activo = false, bossName = "") {
    bossAlertLiveState = Boolean(activo);

    const targets = [
        ...document.querySelectorAll('[data-menu-dropdown-toggle="play"]'),
        ...document.querySelectorAll('[data-menu-mobile-group-toggle="play"]'),
        ...document.querySelectorAll('a[href="battle.html"]')
    ];

    targets.forEach((element) => {
        element.classList.toggle("menu-boss-live", bossAlertLiveState);
    });

    document.querySelectorAll(".menu-boss-live-pill").forEach((pill) => pill.remove());

    if (!bossAlertLiveState) return;

    const texts = getBossAlertTexts();

    [
        document.querySelector('[data-menu-dropdown-toggle="play"]'),
        document.querySelector('[data-menu-mobile-group-toggle="play"]')
    ].forEach((element) => {
        if (!element) return;
        const pill = document.createElement("span");
        pill.className = "menu-boss-live-pill";
        pill.textContent = texts.liveChip;
        if (bossName) {
            pill.setAttribute("title", bossName);
        }
        element.appendChild(pill);
    });
}

function cerrarBossToastGlobal() {
    if (!bossAlertToastElement) return;

    bossAlertToastElement.classList.remove("is-visible");
    bossAlertToastElement.classList.add("is-leaving");

    const node = bossAlertToastElement;
    bossAlertToastElement = null;

    window.setTimeout(() => {
        node.remove();
    }, 220);
}

function abrirBossBattlePage() {
    window.location.href = "battle.html";
}

function mostrarBossToastGlobal(payload = {}) {
    const texts = getBossAlertTexts();
    const bossName = String(payload?.boss?.nombre || texts.bossFallback || "Alpha Boss").trim();

    cerrarBossToastGlobal();

    const toast = document.createElement("div");
    toast.className = "menu-boss-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    toast.innerHTML = `
        <div class="menu-boss-toast-glow" aria-hidden="true"></div>
        <button type="button" class="menu-boss-toast-close" aria-label="${texts.dismiss}">×</button>
        <div class="menu-boss-toast-badge">${texts.badge}</div>
        <div class="menu-boss-toast-title">${texts.title}</div>
        <div class="menu-boss-toast-name">${bossName}</div>
        <div class="menu-boss-toast-text">${texts.description}</div>
        <div class="menu-boss-toast-actions">
            <button type="button" class="menu-boss-toast-action">${texts.action}</button>
        </div>
    `;

    const closeBtn = toast.querySelector(".menu-boss-toast-close");
    const actionBtn = toast.querySelector(".menu-boss-toast-action");

    if (closeBtn) {
        closeBtn.addEventListener("click", cerrarBossToastGlobal);
    }

    if (actionBtn) {
        actionBtn.addEventListener("click", abrirBossBattlePage);
    }

    document.body.appendChild(toast);
    bossAlertToastElement = toast;

    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });
}

function procesarEstadoBossGlobal(estado = null, forceToast = false) {
    const activo = Boolean(estado && estado.activo);
    const bossName = String(estado?.boss?.nombre || "").trim();

    aplicarEstadoVisualBossMenu(activo, bossName);

    if (!activo) {
        cerrarBossToastGlobal();
        return;
    }

    const shownKey = getBossAlertShownKey(estado?.fecha_evento);
    const alreadyShown = localStorage.getItem(shownKey) === "1";

    if (forceToast || !alreadyShown) {
        localStorage.setItem(shownKey, "1");
        mostrarBossToastGlobal(estado);
    }
}

function getBossAlertShownKey(fechaEvento) {
    const safeDate = String(fechaEvento || "today").trim() || "today";
    return `mastersmon_alpha_boss_alert_shown_${safeDate}`;
}

async function verificarBossGlobal(forceToast = false) {
    if (typeof obtenerEstadoBossMundo !== "function") return;
    if (bossAlertRequestInFlight) return;
    if (typeof getAccessToken === "function" && !getAccessToken()) {
        limpiarCacheMenuAlert("boss");
        aplicarEstadoVisualBossMenu(false);
        cerrarBossToastGlobal();
        return;
    }

    if (!forceToast) {
        const cache = leerCacheMenuAlert("boss");
        if (cache) {
            bossAlertLastCheckAt = Date.now();
            procesarEstadoBossGlobal(cache, false);
            return;
        }
    }

    bossAlertRequestInFlight = true;
    bossAlertLastCheckAt = Date.now();

    try {
        const estado = await obtenerEstadoBossMundo();
        guardarCacheMenuAlert("boss", estado || null);
        procesarEstadoBossGlobal(estado || null, forceToast);
    } catch (error) {
        if (error && (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED")) {
            limpiarCacheMenuAlert("boss");
            aplicarEstadoVisualBossMenu(false);
            cerrarBossToastGlobal();
            return;
        }
        console.warn("No se pudo consultar el estado del Alpha Boss:", error);
    } finally {
        bossAlertRequestInFlight = false;
    }
}

function iniciarAlertaBossGlobal() {
    if (window.__mastersmonBossAlertInitialized) return;
    window.__mastersmonBossAlertInitialized = true;

    document.addEventListener("mastersmonBossStateChanged", (event) => {
        const estado = event?.detail?.estado || null;
        guardarCacheMenuAlert("boss", estado);
        procesarEstadoBossGlobal(estado, false);
    });

    window.addEventListener("storage", (event) => {
        if (!event || !event.key) return;

        if (event.key === "access_token" && !event.newValue) {
            limpiarCacheMenuAlert("boss");
            aplicarEstadoVisualBossMenu(false);
            cerrarBossToastGlobal();
            return;
        }

        if (event.key === obtenerMenuAlertCacheKey("boss")) {
            const cache = leerCacheMenuAlert("boss", MENU_ALERT_POLL_INTERVAL_MS * 2);
            if (cache) {
                procesarEstadoBossGlobal(cache, false);
            }
        }
    });

    const cacheInicial = leerCacheMenuAlert("boss");
    if (cacheInicial) {
        procesarEstadoBossGlobal(cacheInicial, false);
    }

    if (paginaGestionaBossMenu()) {
        return;
    }

    verificarBossGlobal(false);

    bossAlertPollTimer = window.setInterval(() => {
        verificarBossGlobal(false);
    }, MENU_ALERT_POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && (Date.now() - bossAlertLastCheckAt) >= MENU_ALERT_VISIBILITY_COOLDOWN_MS) {
            verificarBossGlobal(false);
        }
    });
}



function ensureIdleAlertStyles() {
    if (document.getElementById("mastersmon-idle-alert-styles")) return;

    const style = document.createElement("style");
    style.id = "mastersmon-idle-alert-styles";
    style.textContent = `
        .menu-idle-ready-pill{
            display:inline-flex;
            align-items:center;
            gap:6px;
            margin-left:8px;
            padding:5px 10px;
            border-radius:999px;
            border:1px solid rgba(94,234,212,.35);
            background:rgba(16,185,129,.16);
            color:#d1fae5;
            font-size:11px;
            font-weight:800;
            letter-spacing:.04em;
            text-transform:uppercase;
            box-shadow:0 0 18px rgba(16,185,129,.18);
        }

        .menu-idle-ready-pill::before{
            content:"";
            width:7px;
            height:7px;
            border-radius:999px;
            background:#6ee7b7;
            box-shadow:0 0 12px rgba(110,231,183,.9);
            flex:0 0 7px;
        }

        .menu-idle-ready{
            position:relative;
        }

        .menu-idle-ready-link{
            box-shadow:inset 0 0 0 1px rgba(16,185,129,.18);
        }

        .menu-boss-toast.menu-idle-toast .menu-boss-toast-glow{
            background:
                radial-gradient(circle at top left, rgba(16,185,129,.28), transparent 55%),
                radial-gradient(circle at bottom right, rgba(59,130,246,.18), transparent 60%);
        }

        .menu-boss-toast.menu-idle-toast .menu-boss-toast-badge{
            background:rgba(16,185,129,.14);
            color:#047857;
            border-color:rgba(16,185,129,.22);
        }

        @media (max-width: 720px){
            .menu-idle-ready-pill{
                margin-left:6px;
                padding:4px 8px;
                font-size:10px;
            }
        }
    `;
    document.head.appendChild(style);
}

function getIdleAlertTexts() {
    const fallbackEs = {
        badge: "IDLE LISTO",
        title: "Recompensas listas para reclamar",
        description: "Tu temporizador de Idle terminó. Entra a Idle y reclama las recompensas ahora.",
        action: "Ir a Idle",
        dismiss: "Cerrar",
        liveChip: "Idle listo",
        expeditionSuffix: "Expedición"
    };

    const fallbackEn = {
        badge: "IDLE READY",
        title: "Rewards ready to claim",
        description: "Your Idle timer finished. Open Idle and claim the rewards now.",
        action: "Go to Idle",
        dismiss: "Dismiss",
        liveChip: "Idle ready",
        expeditionSuffix: "Expedition"
    };

    const es = typeof getCurrentLang === "function" && getCurrentLang() === "es";
    const base = es ? fallbackEs : fallbackEn;

    if (typeof t === "function") {
        return {
            badge: t("idle_global_badge") || base.badge,
            title: t("idle_global_title") || base.title,
            description: t("idle_global_text") || base.description,
            action: t("idle_global_action") || base.action,
            dismiss: t("idle_global_dismiss") || base.dismiss,
            liveChip: t("idle_global_live_chip") || base.liveChip,
            expeditionSuffix: t("idle_global_name_suffix") || base.expeditionSuffix
        };
    }

    return base;
}

function traducirTierIdleGlobal(tierCode = "ruta") {
    const tier = String(tierCode || "ruta").trim().toLowerCase();
    const fallback = tier === "masters"
        ? "Masters"
        : tier === "legend"
            ? "Legend"
            : tier === "elite"
                ? "Elite"
                : "Route";

    if (typeof t !== "function") return fallback;

    if (tier === "masters") return t("battle_idle_tier_masters") || "Masters";
    if (tier === "legend") return t("battle_idle_tier_legend") || "Legend";
    if (tier === "elite") return t("battle_idle_tier_elite") || "Elite";
    return t("battle_idle_tier_ruta") || "Route";
}

function aplicarEstadoVisualIdleMenu(activo = false, tierCode = "") {
    idleAlertReadyState = Boolean(activo);
    ensureIdleAlertStyles();

    const playTargets = [
        ...document.querySelectorAll('[data-menu-dropdown-toggle="play"]'),
        ...document.querySelectorAll('[data-menu-mobile-group-toggle="play"]')
    ];

    const idleLinks = [
        ...document.querySelectorAll('a[href="idle.html"]')
    ];

    playTargets.forEach((element) => {
        element.classList.toggle("menu-idle-ready", idleAlertReadyState);
    });

    idleLinks.forEach((element) => {
        element.classList.toggle("menu-idle-ready-link", idleAlertReadyState);
    });

    document.querySelectorAll(".menu-idle-ready-pill").forEach((pill) => pill.remove());

    if (!idleAlertReadyState) return;

    const texts = getIdleAlertTexts();
    const tierLabel = traducirTierIdleGlobal(tierCode);

    playTargets.forEach((element) => {
        if (!element) return;
        const pill = document.createElement("span");
        pill.className = "menu-idle-ready-pill";
        pill.textContent = texts.liveChip;
        pill.setAttribute("title", `${tierLabel} ${texts.expeditionSuffix}`);
        element.appendChild(pill);
    });
}

function cerrarIdleToastGlobal() {
    if (!idleAlertToastElement) return;

    idleAlertToastElement.classList.remove("is-visible");
    idleAlertToastElement.classList.add("is-leaving");

    const node = idleAlertToastElement;
    idleAlertToastElement = null;

    window.setTimeout(() => {
        node.remove();
    }, 220);
}

function abrirIdlePageGlobal() {
    window.location.href = "idle.html";
}

function mostrarIdleToastGlobal(payload = {}) {
    const texts = getIdleAlertTexts();
    const tierLabel = traducirTierIdleGlobal(payload?.sesion?.tier_codigo || "ruta");
    const expeditionName = `${tierLabel} ${texts.expeditionSuffix}`.trim();

    cerrarIdleToastGlobal();

    const toast = document.createElement("div");
    toast.className = "menu-boss-toast menu-idle-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    toast.innerHTML = `
        <div class="menu-boss-toast-glow" aria-hidden="true"></div>
        <button type="button" class="menu-boss-toast-close" aria-label="${texts.dismiss}">×</button>
        <div class="menu-boss-toast-badge">${texts.badge}</div>
        <div class="menu-boss-toast-title">${texts.title}</div>
        <div class="menu-boss-toast-name">${expeditionName}</div>
        <div class="menu-boss-toast-text">${texts.description}</div>
        <div class="menu-boss-toast-actions">
            <button type="button" class="menu-boss-toast-action">${texts.action}</button>
        </div>
    `;

    const closeBtn = toast.querySelector(".menu-boss-toast-close");
    const actionBtn = toast.querySelector(".menu-boss-toast-action");

    if (closeBtn) {
        closeBtn.addEventListener("click", cerrarIdleToastGlobal);
    }

    if (actionBtn) {
        actionBtn.addEventListener("click", abrirIdlePageGlobal);
    }

    document.body.appendChild(toast);
    idleAlertToastElement = toast;

    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });
}

function getIdleAlertShownKey(token = "") {
    const safeToken = String(token || "").trim();
    return safeToken ? `mastersmon_idle_ready_alert_shown_${safeToken}` : "";
}

function procesarEstadoIdleGlobal(data = null, forceToast = false) {
    const session = data?.sesion || null;
    const sessionState = String(session?.estado || "").toLowerCase();
    const ready = Boolean(session) && sessionState === "reclamable";

    aplicarEstadoVisualIdleMenu(ready, session?.tier_codigo || "");

    if (!ready) {
        cerrarIdleToastGlobal();
        return;
    }

    const shownKey = getIdleAlertShownKey(session?.token || session?.id || "");
    const alreadyShown = shownKey ? localStorage.getItem(shownKey) === "1" : false;

    if (forceToast || !alreadyShown) {
        if (shownKey) {
            localStorage.setItem(shownKey, "1");
        }
        mostrarIdleToastGlobal({ sesion: session });
    }
}

async function verificarIdleGlobal(forceToast = false) {
    if (typeof obtenerEstadoIdle !== "function") return;
    if (idleAlertRequestInFlight) return;
    if (typeof getAccessToken === "function" && !getAccessToken()) {
        limpiarCacheMenuAlert("idle");
        aplicarEstadoVisualIdleMenu(false);
        cerrarIdleToastGlobal();
        return;
    }

    if (!forceToast) {
        const cache = leerCacheMenuAlert("idle");
        if (cache) {
            idleAlertLastCheckAt = Date.now();
            procesarEstadoIdleGlobal(cache, false);
            return;
        }
    }

    idleAlertRequestInFlight = true;
    idleAlertLastCheckAt = Date.now();

    try {
        const estado = await obtenerEstadoIdle();
        guardarCacheMenuAlert("idle", estado || null);
        procesarEstadoIdleGlobal(estado || null, forceToast);
    } catch (error) {
        if (error && (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED")) {
            limpiarCacheMenuAlert("idle");
            aplicarEstadoVisualIdleMenu(false);
            cerrarIdleToastGlobal();
            return;
        }
        console.warn("No se pudo consultar el estado de Idle:", error);
    } finally {
        idleAlertRequestInFlight = false;
    }
}

function iniciarAlertaIdleGlobal() {
    if (window.__mastersmonIdleAlertInitialized) return;
    window.__mastersmonIdleAlertInitialized = true;

    ensureIdleAlertStyles();

    document.addEventListener("mastersmonIdleStateChanged", (event) => {
        const session = event?.detail?.session || null;
        const payload = { sesion: session };
        guardarCacheMenuAlert("idle", payload);
        procesarEstadoIdleGlobal(payload, false);
    });

    window.addEventListener("storage", (event) => {
        if (!event || !event.key) return;

        if (event.key === "access_token" && !event.newValue) {
            limpiarCacheMenuAlert("idle");
            aplicarEstadoVisualIdleMenu(false);
            cerrarIdleToastGlobal();
            return;
        }

        if (event.key === obtenerMenuAlertCacheKey("idle")) {
            const cache = leerCacheMenuAlert("idle", MENU_ALERT_POLL_INTERVAL_MS * 2);
            if (cache) {
                procesarEstadoIdleGlobal(cache, false);
            }
        }
    });

    const cacheInicial = leerCacheMenuAlert("idle");
    if (cacheInicial) {
        procesarEstadoIdleGlobal(cacheInicial, false);
    }

    if (paginaGestionaIdleMenu()) {
        return;
    }

    verificarIdleGlobal(false);

    idleAlertPollTimer = window.setInterval(() => {
        verificarIdleGlobal(false);
    }, MENU_ALERT_POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && (Date.now() - idleAlertLastCheckAt) >= MENU_ALERT_VISIBILITY_COOLDOWN_MS) {
            verificarIdleGlobal(false);
        }
    });
}
