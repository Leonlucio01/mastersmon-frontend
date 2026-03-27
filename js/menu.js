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
});

let bossAlertPollTimer = null;
let bossAlertToastElement = null;
let bossAlertLiveState = false;

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

function getBossAlertShownKey(fechaEvento) {
    const safeDate = String(fechaEvento || "today").trim() || "today";
    return `mastersmon_alpha_boss_alert_shown_${safeDate}`;
}

async function verificarBossGlobal(forceToast = false) {
    if (typeof obtenerEstadoBossMundo !== "function") return;
    if (typeof getAccessToken === "function" && !getAccessToken()) {
        aplicarEstadoVisualBossMenu(false);
        return;
    }

    try {
        const estado = await obtenerEstadoBossMundo();
        const activo = Boolean(estado && estado.activo);
        const bossName = String(estado?.boss?.nombre || "").trim();
        aplicarEstadoVisualBossMenu(activo, bossName);

        if (!activo) return;

        const shownKey = getBossAlertShownKey(estado?.fecha_evento);
        const alreadyShown = localStorage.getItem(shownKey) === "1";

        if (forceToast || !alreadyShown) {
            localStorage.setItem(shownKey, "1");
            mostrarBossToastGlobal(estado);
        }
    } catch (error) {
        if (error && (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED")) {
            aplicarEstadoVisualBossMenu(false);
            return;
        }
        console.warn("No se pudo consultar el estado del Alpha Boss:", error);
    }
}

function iniciarAlertaBossGlobal() {
    if (window.__mastersmonBossAlertInitialized) return;
    window.__mastersmonBossAlertInitialized = true;

    verificarBossGlobal(false);

    bossAlertPollTimer = window.setInterval(() => {
        verificarBossGlobal(false);
    }, 30000);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            verificarBossGlobal(false);
        }
    });

    window.addEventListener("storage", (event) => {
        if (!event || !event.key) return;
        if (event.key === "access_token" && !event.newValue) {
            aplicarEstadoVisualBossMenu(false);
            cerrarBossToastGlobal();
        }
    });
}
