/* =========================================================
   IDLE PAGE JS
   - Página separada para Idle Expedition
   - Reutiliza el equipo guardado de Battle
   - Mantiene las rutas backend existentes de Idle
========================================================= */

const IDLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const IDLE_SESSION_STORAGE_KEY = "mastersmon_battle_idle_session_v1";
const IDLE_LAST_RESULT_STORAGE_KEY = "mastersmon_idle_last_result_v1";
const IDLE_COMPLETION_ALERT_TOKEN_KEY = "mastersmon_idle_completion_alert_v1";
const IDLE_PREMIUM_PRODUCT_CODE = "idle_masters_1m";

const IDLE_TIER_CONFIG = {
    ruta: {
        label: "Route",
        description: "Stable farming route with safer pacing and consistent rewards.",
        difficulty: "Starter",
        tickSegundos: 45,
        baseExp: 18,
        baseCoins: 16,
        enemyPower: 1.0,
        accent: "route",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.12 },
            { itemCode: "poke_ball", label: "Poké Ball", chance: 0.08 }
        ]
    },
    elite: {
        label: "Elite",
        description: "Balanced expedition with better scaling and stronger enemy pressure.",
        difficulty: "Mid",
        tickSegundos: 55,
        baseExp: 48,
        baseCoins: 40,
        enemyPower: 1.25,
        accent: "elite",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.18 },
            { itemCode: "super_ball", label: "Super Ball", chance: 0.10 },
            { itemCode: "ultra_ball", label: "Ultra Ball", chance: 0.035 }
        ]
    },
    legend: {
        label: "Legend",
        description: "High-end expedition with tougher scaling and better drop quality.",
        difficulty: "High",
        tickSegundos: 65,
        baseExp: 120,
        baseCoins: 102,
        enemyPower: 1.55,
        accent: "legend",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.22 },
            { itemCode: "super_ball", label: "Super Ball", chance: 0.16 },
            { itemCode: "ultra_ball", label: "Ultra Ball", chance: 0.08 }
        ]
    },
    masters: {
        label: "Masters",
        description: "Premium expedition tier with stronger rewards and rare Master Ball access.",
        difficulty: "Premium",
        tickSegundos: 65,
        baseExp: 240,
        baseCoins: 203,
        enemyPower: 1.55,
        accent: "masters",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.24 },
            { itemCode: "super_ball", label: "Super Ball", chance: 0.18 },
            { itemCode: "ultra_ball", label: "Ultra Ball", chance: 0.12 },
            { itemCode: "master_ball", label: "Master Ball", chance: 0.0045 }
        ]
    }
};

const IDLE_ALLOWED_DURATIONS = [3600, 7200, 14400, 28800];

const idleState = {
    team: [],
    idleData: null,
    benefits: [],
    mastersBenefit: null,
    mastersActive: false,
    gymProgress: null,
    gymProgressLoaded: false,
    premiumProduct: null,
    premiumCheckoutBusy: false,
    serverOffsetMs: 0,
    startedAtMs: 0,
    endsAtMs: 0,
    lastSyncMs: 0,
    remainingBaseSeconds: 0,
    totalSessionSeconds: 0,
    syncInProgress: false,
    countdownFinished: false,
    clockInterval: null,
    selectedTier: "ruta",
    selectedDuration: 3600,
    lastResult: null,
    noticeConfirmAction: null
};

const IDLE_THEME_ACCENTS = {
    ruta: { solid: "#10b981", soft: "rgba(16,185,129,.20)" },
    elite: { solid: "#2563eb", soft: "rgba(37,99,235,.20)" },
    legend: { solid: "#7c3aed", soft: "rgba(124,58,237,.20)" },
    masters: { solid: "#f59e0b", soft: "rgba(245,158,11,.22)" }
};

function getIdleVisualTier() {
    const activeSession = idleState.idleData?.sesion && idleState.idleData?.activa
        ? idleState.idleData.sesion
        : null;
    return normalizarTierIdle(activeSession?.tier_codigo || idleState.selectedTier || "ruta");
}

function applyIdleVisualTheme(nextTier = null) {
    const tier = normalizarTierIdle(nextTier || getIdleVisualTier());
    const root = document.documentElement;
    const page = document.querySelector(".idle-page");
    const accents = IDLE_THEME_ACCENTS[tier] || IDLE_THEME_ACCENTS.ruta;

    if (page) {
        page.setAttribute("data-idle-tier", tier);
    }
    if (root) {
        root.style.setProperty("--idle-current-accent", accents.solid);
        root.style.setProperty("--idle-current-accent-soft", accents.soft);
    }

    [
        "idleCommandSection",
        "idleForecastSection",
        "idleTeamSection",
        "idleLatestClaimSection",
        "idleMastersSection"
    ].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute("data-idle-tier", tier);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarIdlePage();
});

async function inicializarIdlePage() {
    if (typeof cargarSpritesManifest === "function") {
        try {
            await cargarSpritesManifest();
        } catch (error) {
            console.warn("No se pudo cargar el catálogo local de sprites en Idle:", error);
        }
    }

    if (typeof cargarItemsManifest === "function") {
        try {
            await cargarItemsManifest();
        } catch (error) {
            console.warn("No se pudo cargar el catálogo local de items en Idle:", error);
        }
    }

    configurarMenuIdle();
    configurarIdiomaIdle();
    configurarModalIdle();
    configurarModalPremiumIdle();
    configurarEventosIdle();
    cargarResultadoAnteriorIdle();
    cargarEquipoLocalIdle();
    renderTierCardsIdle();
    renderSelectedPlanIdle();
    renderEstimateIdle();
    renderTeamIdle();
    renderLastResultIdle();
    renderMastersPanelIdle();
    renderStatusIdle();
    applyIdleVisualTheme();
    applyDocumentMetaIdle();

    try {
        await cargarEquipoServidorIdle();
        await cargarBeneficiosActivosIdle();
        await cargarProgresoGymsIdle();
        await cargarProductoPremiumIdle();
        await cargarEstadoIdle(true);
    } catch (error) {
        console.warn("No se pudo inicializar Idle completamente:", error);
    }

    renderTierCardsIdle();
    renderSelectedPlanIdle();
    renderEstimateIdle();
    renderTeamIdle();
    renderLastResultIdle();
    renderMastersPanelIdle();
    renderStatusIdle();
    applyIdleVisualTheme();

    iniciarRelojIdle();

    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }
        sincronizarIdiomaVisualIdle();
        applyDocumentMetaIdle();
        renderTierCardsIdle();
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTeamIdle();
        renderLastResultIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        applyIdleVisualTheme();
    });

    document.addEventListener("usuarioSesionActualizada", async () => {
        cargarEquipoLocalIdle();
        await cargarEquipoServidorIdle();
        await cargarBeneficiosActivosIdle();
        await cargarProgresoGymsIdle();
        await cargarProductoPremiumIdle(true);
        await cargarEstadoIdle(true);
        renderTierCardsIdle();
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTeamIdle();
        renderLastResultIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        applyIdleVisualTheme();
    });
}

function configurarMenuIdle() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");

    if (menuToggle && menuMobile) {
        menuToggle.addEventListener("click", () => {
            menuMobile.classList.toggle("menu-open");
        });
    }
}

function configurarIdiomaIdle() {
    const desktopSelect = document.getElementById("languageSelect");
    const mobileSelect = document.getElementById("languageSelectMobile");

    const onChange = (event) => {
        const lang = String(event?.target?.value || "en");
        if (typeof setCurrentLang === "function") {
            setCurrentLang(lang);
        }
        sincronizarIdiomaVisualIdle(lang);
        applyDocumentMetaIdle();
    };

    if (desktopSelect) {
        desktopSelect.addEventListener("change", onChange);
    }

    if (mobileSelect) {
        mobileSelect.addEventListener("change", onChange);
    }

    sincronizarIdiomaVisualIdle();

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

function sincronizarIdiomaVisualIdle(nextLang = null) {
    const currentLang = nextLang || (typeof getCurrentLang === "function" ? getCurrentLang() : "en");
    const desktopSelect = document.getElementById("languageSelect");
    const mobileSelect = document.getElementById("languageSelectMobile");

    if (desktopSelect) desktopSelect.value = currentLang;
    if (mobileSelect) mobileSelect.value = currentLang;
}

function applyDocumentMetaIdle() {
    document.title = tIdle("idle_page_title", "Mastersmon - Idle Expedition");
}

function configurarModalIdle() {
    const modal = document.getElementById("idleNoticeModal");
    const closeBtn = document.getElementById("idleModalClose");
    const confirmBtn = document.getElementById("idleModalConfirmBtn");

    if (!modal) return;

    const closeHandler = () => hideIdleNoticeModal();
    const confirmHandler = async () => {
        const action = idleState.noticeConfirmAction;
        hideIdleNoticeModal();
        if (typeof action === "function") {
            try {
                await action();
            } catch (error) {
                console.warn("No se pudo ejecutar la acción del modal Idle:", error);
            }
        }
    };

    if (closeBtn) closeBtn.addEventListener("click", closeHandler);
    if (confirmBtn) confirmBtn.addEventListener("click", confirmHandler);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeHandler();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.classList.contains("oculto")) {
            closeHandler();
        }
    });
}

function configurarModalPremiumIdle() {
    const modal = document.getElementById("idlePremiumModal");
    const closeBtn = document.getElementById("idlePremiumModalClose");
    const cancelBtn = document.getElementById("idlePremiumModalCancel");
    const payBtn = document.getElementById("idlePremiumModalPay");

    if (!modal) return;

    const closeHandler = () => hideIdlePremiumModal();

    if (closeBtn) closeBtn.addEventListener("click", closeHandler);
    if (cancelBtn) cancelBtn.addEventListener("click", closeHandler);
    if (payBtn) payBtn.addEventListener("click", continuarCheckoutPremiumIdle);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeHandler();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.classList.contains("oculto")) {
            closeHandler();
        }
    });
}

function hideIdleNoticeModal() {
    const modal = document.getElementById("idleNoticeModal");
    if (!modal) return;
    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("idle-modal-open");
    idleState.noticeConfirmAction = null;
}

function hideIdlePremiumModal() {
    const modal = document.getElementById("idlePremiumModal");
    if (!modal) return;
    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("idle-modal-open");
    idleState.premiumCheckoutBusy = false;
}

function showIdleNoticeModal({
    type = "info",
    title = "",
    message = "",
    html = "",
    kicker = "",
    confirmText = "",
    onConfirm = null
} = {}) {
    const modal = document.getElementById("idleNoticeModal");
    const icon = document.getElementById("idleModalIcon");
    const kickerEl = document.getElementById("idleModalKicker");
    const titleEl = document.getElementById("idleModalTitle");
    const bodyEl = document.getElementById("idleModalBody");
    const confirmBtn = document.getElementById("idleModalConfirmBtn");

    if (!modal || !icon || !kickerEl || !titleEl || !bodyEl || !confirmBtn) return;

    const normalizedType = String(type || "info").toLowerCase();
    const typeMap = {
        success: { icon: "✓", kicker: tIdle("idle_modal_success_kicker", "Expedition updated") },
        warning: { icon: "!", kicker: tIdle("idle_modal_warning_kicker", "Action required") },
        error: { icon: "×", kicker: tIdle("idle_modal_error_kicker", "Something went wrong") },
        info: { icon: "i", kicker: tIdle("idle_modal_info_kicker", "Idle notice") }
    };

    const currentType = typeMap[normalizedType] || typeMap.info;

    modal.className = `idle-modal-backdrop idle-modal-${normalizedType}`;
    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("idle-modal-open");

    icon.textContent = currentType.icon;
    kickerEl.textContent = kicker || currentType.kicker;
    titleEl.textContent = title || tIdle("idle_modal_default_title", "Idle Expedition");
    bodyEl.innerHTML = html || `<p>${escapeHtmlIdle(message || tIdle("idle_modal_default_body", "Your Idle Expedition state was updated."))}</p>`;
    confirmBtn.textContent = confirmText || tIdle("idle_modal_confirm", "OK");
    idleState.noticeConfirmAction = typeof onConfirm === "function" ? onConfirm : null;

    try {
        confirmBtn.focus({ preventScroll: true });
    } catch (error) {
        confirmBtn.focus();
    }
}

function getIdlePremiumFallbackProduct() {
    return {
        codigo: IDLE_PREMIUM_PRODUCT_CODE,
        nombre: tIdle("idle_premium_product_name", "Idle Masters 1 month"),
        tipo: "suscripcion",
        precio_usd: 20,
        beneficio_codigo: "idle_masters",
        duracion_meses: 1,
        duracion_dias: null,
        duracion_horas: null,
        limite_por_cuenta: 1,
        metadata: {
            scope: "idle",
            notes: tIdle("idle_premium_product_note", "Unlocks the Masters tier in Idle for 30 days.")
        }
    };
}

async function cargarProductoPremiumIdle(force = false) {
    if (!force && idleState.premiumProduct?.codigo === IDLE_PREMIUM_PRODUCT_CODE) {
        return idleState.premiumProduct;
    }

    if (!getAccessToken()) {
        idleState.premiumProduct = getIdlePremiumFallbackProduct();
        return idleState.premiumProduct;
    }

    try {
        let data = null;

        if (typeof obtenerCatalogoPagos === "function") {
            data = await obtenerCatalogoPagos();
        } else if (typeof fetchAuth === "function" && typeof API_BASE !== "undefined") {
            data = await fetchAuth(`${API_BASE}/payments/catalogo`);
        }

        const productos = Array.isArray(data?.productos) ? data.productos : [];
        const found = productos.find(producto => String(producto?.codigo || "") === IDLE_PREMIUM_PRODUCT_CODE);

        idleState.premiumProduct = found || getIdlePremiumFallbackProduct();
        return idleState.premiumProduct;
    } catch (error) {
        console.warn("No se pudo cargar el producto premium Idle Masters:", error);
        idleState.premiumProduct = getIdlePremiumFallbackProduct();
        return idleState.premiumProduct;
    }
}

function formatUsdIdle(value = 0) {
    try {
        return new Intl.NumberFormat(getLocaleIdle(), {
            style: "currency",
            currency: "USD"
        }).format(Number(value || 0));
    } catch (error) {
        return `$${Number(value || 0).toFixed(2)}`;
    }
}

function getIdlePremiumDurationLabel(product = {}) {
    const months = Number(product?.duracion_meses || 0);
    const days = Number(product?.duracion_dias || 0);
    const hours = Number(product?.duracion_horas || 0);

    if (months > 0) return `${months} ${months === 1 ? tIdle("idle_premium_month", "month") : tIdle("idle_premium_months", "months")}`;
    if (days > 0) return `${days} ${days === 1 ? tIdle("idle_premium_day", "day") : tIdle("idle_premium_days", "days")}`;
    if (hours > 0) return `${hours} ${hours === 1 ? tIdle("idle_premium_hour", "hour") : tIdle("idle_premium_hours", "hours")}`;
    return tIdle("idle_premium_instant", "Instant");
}

function getIdlePremiumTypeLabel(product = {}) {
    const tipo = String(product?.tipo || "").toLowerCase();
    if (tipo === "suscripcion") return tIdle("idle_premium_type_subscription", "Subscription");
    if (tipo === "pack_item") return tIdle("idle_premium_type_pack", "Pack");
    if (tipo === "battle_pass") return tIdle("idle_premium_type_battle_pass", "Battle Pass");
    return tIdle("idle_premium_type_premium", "Premium");
}

function getIdlePremiumFeatureItems() {
    return [
        tIdle("premium_idle_feature_1", "+100% EXP vs Legend"),
        tIdle("premium_idle_feature_2", "+100% GOLD vs Legend"),
        tIdle("premium_idle_feature_3", "Ultra Ball 12% per tick"),
        tIdle("premium_idle_feature_4", "Master Ball 0.45% per tick")
    ];
}

function buildIdlePremiumModalHtml(product = {}, options = {}) {
    const { source = "panel" } = options;
    const featureItems = getIdlePremiumFeatureItems()
        .map(item => `<li>${escapeHtmlIdle(item)}</li>`)
        .join("");

    const note = String(product?.metadata?.notes || tIdle("idle_premium_default_note", "Premium access for the Masters Idle tier."));
    const activeUntil = idleState.mastersBenefit?.expira_en
        ? formatDateTimeIdle(idleState.mastersBenefit.expira_en)
        : "";

    const sourceLabelMap = {
        panel: tIdle("idle_premium_source_panel", "Opened from Masters panel"),
        tier_card: tIdle("idle_premium_source_card", "Opened from tier card"),
        selected_plan: tIdle("idle_premium_source_plan", "Opened from selected plan"),
        start_button: tIdle("idle_premium_source_start", "Opened from launch button")
    };

    return `
        <div class="idle-premium-shell">
            <div class="idle-premium-head">
                <div>
                    <span class="idle-premium-source">${escapeHtmlIdle(sourceLabelMap[source] || sourceLabelMap.panel)}</span>
                    <h4>${escapeHtmlIdle(product?.nombre || tIdle("idle_premium_product_name", "Idle Masters 1 month"))}</h4>
                    <p>${escapeHtmlIdle(note)}</p>
                </div>
                <div class="idle-premium-price-box">
                    <span>${escapeHtmlIdle(tIdle("idle_premium_price_label", "Price"))}</span>
                    <strong>${escapeHtmlIdle(formatUsdIdle(product?.precio_usd || 0))}</strong>
                </div>
            </div>

            <div class="idle-premium-grid">
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_premium_modal_type", "Type"))}</span>
                    <strong>${escapeHtmlIdle(getIdlePremiumTypeLabel(product))}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_premium_modal_duration", "Duration"))}</span>
                    <strong>${escapeHtmlIdle(getIdlePremiumDurationLabel(product))}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_premium_modal_scope", "Scope"))}</span>
                    <strong>${escapeHtmlIdle(String(product?.metadata?.scope || "idle").toUpperCase())}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_premium_modal_status", "Status"))}</span>
                    <strong>${escapeHtmlIdle(idleState.mastersActive ? tIdle("idle_masters_active_chip", "Benefit active") : tIdle("idle_masters_locked_chip", "Premium"))}</strong>
                </article>
            </div>

            ${activeUntil ? `
                <div class="idle-premium-active-box">
                    ${escapeHtmlIdle(tIdle("idle_masters_active_until", "Active until {date}", { date: activeUntil }))}
                </div>
            ` : ""}

            <div class="idle-premium-benefits">
                <span>${escapeHtmlIdle(tIdle("idle_premium_benefits_title", "Included benefits"))}</span>
                <ul>${featureItems}</ul>
            </div>

            ${idleState.mastersActive ? `
                <div class="idle-premium-info-box">
                    ${escapeHtmlIdle(tIdle("idle_premium_already_active", "This benefit is already active on your account."))}
                </div>
            ` : `
                <label class="idle-premium-check">
                    <input type="checkbox" id="idlePremiumAcceptTerms">
                    <span>${escapeHtmlIdle(tIdle("idle_premium_accept_terms", "I reviewed the details and want to continue to secure PayPal checkout."))}</span>
                </label>
                <div class="idle-premium-error oculto" id="idlePremiumModalError"></div>
            `}
        </div>
    `;
}

async function abrirModalPremiumIdle(options = {}) {
    if (!getAccessToken()) {
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_login_title", "Login required"),
            message: tIdle("battle_mode_requires_login", "You must sign in first.")
        });
        return;
    }

    const modal = document.getElementById("idlePremiumModal");
    const body = document.getElementById("idlePremiumModalBody");
    const kicker = document.getElementById("idlePremiumModalKicker");
    const title = document.getElementById("idlePremiumModalTitle");
    const payBtn = document.getElementById("idlePremiumModalPay");

    if (!modal || !body || !kicker || !title || !payBtn) return;

    const product = await cargarProductoPremiumIdle();
    kicker.textContent = tIdle("idle_premium_modal_kicker", "Premium Idle");
    title.textContent = tIdle("idle_premium_modal_title", "Unlock Idle Masters");
    body.innerHTML = buildIdlePremiumModalHtml(product, options);

    payBtn.dataset.productCode = String(product?.codigo || IDLE_PREMIUM_PRODUCT_CODE);
    payBtn.disabled = Boolean(idleState.mastersActive);
    payBtn.textContent = idleState.mastersActive
        ? tIdle("idle_premium_active_cta", "Benefit active")
        : tIdle("idle_premium_continue_paypal", "Continue to PayPal");

    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("idle-modal-open");
}

async function continuarCheckoutPremiumIdle() {
    if (idleState.premiumCheckoutBusy) return;

    const payBtn = document.getElementById("idlePremiumModalPay");
    const errorBox = document.getElementById("idlePremiumModalError");
    const acceptTerms = document.getElementById("idlePremiumAcceptTerms");
    const productCode = String(payBtn?.dataset?.productCode || IDLE_PREMIUM_PRODUCT_CODE);

    if (!getAccessToken()) {
        hideIdlePremiumModal();
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_login_title", "Login required"),
            message: tIdle("battle_mode_requires_login", "You must sign in first.")
        });
        return;
    }

    if (idleState.mastersActive) {
        hideIdlePremiumModal();
        return;
    }

    if (!acceptTerms?.checked) {
        if (errorBox) {
            errorBox.textContent = tIdle("idle_premium_accept_required", "You must confirm the purchase details before continuing.");
            errorBox.classList.remove("oculto");
        }
        return;
    }

    try {
        idleState.premiumCheckoutBusy = true;

        if (errorBox) {
            errorBox.textContent = "";
            errorBox.classList.add("oculto");
        }

        if (payBtn) {
            payBtn.disabled = true;
            payBtn.textContent = tIdle("idle_premium_redirecting", "Opening PayPal...");
        }

        const order = await crearOrdenPaypalPago({
            productCode,
            quantity: 1,
            confirmacionAceptada: true,
            versionTerminos: "idle_masters_modal_v1"
        });

        if (!order?.approval_url) {
            throw new Error(tIdle("idle_premium_checkout_error", "The secure PayPal order could not be created."));
        }

        window.location.href = order.approval_url;
    } catch (error) {
        console.error("No se pudo iniciar el checkout premium de Idle:", error);

        if (errorBox) {
            errorBox.textContent = error?.message || tIdle("idle_premium_checkout_error", "The secure PayPal order could not be created.");
            errorBox.classList.remove("oculto");
        }

        if (payBtn) {
            payBtn.disabled = false;
            payBtn.textContent = tIdle("idle_premium_continue_paypal", "Continue to PayPal");
        }

        idleState.premiumCheckoutBusy = false;
    }
}

function buildIdleClaimModalHtml(result = {}) {
    const items = Array.isArray(result?.items_ganados) ? result.items_ganados : [];
    const tierCode = normalizarTierIdle(result?.tier_codigo || "ruta");
    const dropsHtml = items.length
        ? items.map(item => {
            const itemCode = String(item.item_code || item.itemCode || "item");
            return `<span class="idle-drop-pill idle-drop-pill-${escapeHtmlIdle(itemCode)}">${escapeHtmlIdle(getIdleDropLabel(itemCode, itemCode))} × ${formatNumberIdle(item.cantidad || 0)}</span>`;
        }).join("")
        : `<span class="idle-drop-pill idle-drop-pill-empty">${escapeHtmlIdle(tIdle("idle_no_item_drops", "No item drops"))}</span>`;

    return `
        <div class="idle-modal-claim-shell" data-tier="${escapeHtmlIdle(tierCode)}">
            <p class="idle-modal-claim-copy">${escapeHtmlIdle(tIdle("idle_claim_modal_intro", "Your expedition was claimed successfully. Here is the summary of this run."))}</p>
            <div class="idle-modal-claim-grid">
                <article><span>EXP</span><strong>${formatNumberIdle(result?.exp_ganada || 0)}</strong></article>
                <article><span>${escapeHtmlIdle(tIdle("idle_currency_label", "Pokédollars"))}</span><strong>${formatNumberIdle(result?.pokedolares_ganados || 0)}</strong></article>
                <article><span>${escapeHtmlIdle(tIdle("idle_estimated_wins_label", "Estimated wins"))}</span><strong>${formatNumberIdle(result?.victorias_estimadas || 0)}</strong></article>
                <article><span>${escapeHtmlIdle(tIdle("idle_ticks_label", "Ticks"))}</span><strong>${formatNumberIdle(result?.ticks || 0)}</strong></article>
            </div>
            <div class="idle-modal-claim-drops">
                <span>${escapeHtmlIdle(traducirTierIdle(tierCode))} ${escapeHtmlIdle(tIdle("idle_result_title_suffix", "Expedition"))}</span>
                <div class="idle-drop-pill-list">${dropsHtml}</div>
            </div>
        </div>
    `;
}

function buildIdleLaunchModalHtml({ tierCodigo = "ruta", duracionSegundos = 3600, teamCount = 0 } = {}) {
    const tierMeta = getIdleTierMeta(tierCodigo);
    const durationLabel = formatDurationLabelIdle(duracionSegundos);
    const estimate = computeIdleEstimate(idleState.team, tierCodigo, duracionSegundos);

    return `
        <div class="idle-modal-launch-shell" data-tier="${escapeHtmlIdle(normalizarTierIdle(tierCodigo))}">
            <div class="idle-modal-launch-banner">
                <span class="idle-modal-inline-pill">${escapeHtmlIdle(tIdle("idle_modal_launch_badge", "Mission ready"))}</span>
                <strong>${escapeHtmlIdle(traducirTierIdle(tierCodigo))} ${escapeHtmlIdle(tIdle("idle_result_title_suffix", "Expedition"))}</strong>
                <p>${escapeHtmlIdle(tIdle("idle_modal_launch_copy", "Your team is now deployed. The timer is already running and rewards will accumulate in the background."))}</p>
            </div>
            <div class="idle-modal-launch-grid">
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_tier_label", "Tier"))}</span>
                    <strong>${escapeHtmlIdle(tierMeta.label)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_duration_label", "Duration"))}</span>
                    <strong>${escapeHtmlIdle(durationLabel)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_saved_members_label", "Saved members"))}</span>
                    <strong>${formatNumberIdle(teamCount)} / 6</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_estimated_wins_label", "Estimated wins"))}</span>
                    <strong>${formatNumberIdle(estimate.wins)}</strong>
                </article>
            </div>
        </div>
    `;
}

function buildIdleActiveModalHtml(session = {}) {
    const tierCode = normalizarTierIdle(session?.tier_codigo || idleState.selectedTier || "ruta");
    const remaining = Number(session?.segundos_restantes || 0);
    const progress = Math.max(0, Math.min(100, Number(session?.progreso_pct || 0)));
    return `
        <div class="idle-modal-launch-shell" data-tier="${escapeHtmlIdle(tierCode)}">
            <div class="idle-modal-launch-banner">
                <span class="idle-modal-inline-pill">${escapeHtmlIdle(tIdle("idle_modal_active_badge", "Session in progress"))}</span>
                <strong>${escapeHtmlIdle(traducirTierIdle(tierCode))} ${escapeHtmlIdle(tIdle("idle_result_title_suffix", "Expedition"))}</strong>
                <p>${escapeHtmlIdle(tIdle("idle_modal_active_copy", "You already have one Idle Expedition running. Claim it when the timer ends or cancel it before launching a new one."))}</p>
            </div>
            <div class="idle-modal-launch-grid">
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_tier_label", "Tier"))}</span>
                    <strong>${escapeHtmlIdle(getIdleTierMeta(tierCode).label)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("battle_idle_remaining", "Remaining"))}</span>
                    <strong>${escapeHtmlIdle(formatSecondsIdle(remaining))}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("battle_idle_progress", "Progress"))}</span>
                    <strong>${formatNumberIdle(progress)}%</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_duration_label", "Duration"))}</span>
                    <strong>${escapeHtmlIdle(formatDurationLabelIdle(Number(session?.duracion_segundos || idleState.selectedDuration || 3600)))}</strong>
                </article>
            </div>
        </div>
    `;
}

function configurarEventosIdle() {
    const tierSelect = document.getElementById("idleTierSelect");
    const durationSelect = document.getElementById("idleDurationSelect");
    const btnStart = document.getElementById("btnStartIdlePage");
    const btnClaim = document.getElementById("btnClaimIdlePage");
    const btnCancel = document.getElementById("btnCancelIdlePage");
    const btnRefresh = document.getElementById("btnRefreshIdlePage");

    if (tierSelect) {
        tierSelect.addEventListener("change", () => {
            idleState.selectedTier = normalizarTierIdle(tierSelect.value);
            renderTierCardsIdle();
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderMastersPanelIdle();
            renderStatusIdle();
        });
    }

    if (durationSelect) {
        durationSelect.addEventListener("change", () => {
            idleState.selectedDuration = normalizarDuracionIdle(durationSelect.value);
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderStatusIdle();
        });
    }

    if (btnStart) btnStart.addEventListener("click", iniciarIdlePage);
    if (btnClaim) btnClaim.addEventListener("click", reclamarIdlePage);
    if (btnCancel) btnCancel.addEventListener("click", cancelarIdlePage);
    if (btnRefresh) btnRefresh.addEventListener("click", async () => {
        await cargarBeneficiosActivosIdle();
        await cargarProgresoGymsIdle();
        await cargarProductoPremiumIdle(true);
        await cargarEstadoIdle(false);
        renderMastersPanelIdle();
        renderStatusIdle();
    });
}

function tIdle(key, fallback, params = {}) {
    try {
        if (typeof t === "function") {
            const translated = t(key, params);
            if (translated && translated !== key) return translated;
        }
    } catch (error) {
        // no-op
    }
    return fallback;
}

function getLocaleIdle() {
    try {
        return typeof getCurrentLang === "function" && getCurrentLang() === "es" ? "es-PE" : "en-US";
    } catch (error) {
        return "en-US";
    }
}

function getIdleTierMeta(tierCode = "ruta") {
    const tier = normalizarTierIdle(tierCode);
    const cfg = IDLE_TIER_CONFIG[tier] || IDLE_TIER_CONFIG.ruta;

    const translated = {
        ruta: {
            label: tIdle("idle_tier_route_label", cfg.label),
            description: tIdle("idle_tier_route_desc", cfg.description),
            difficulty: tIdle("idle_tier_route_difficulty", cfg.difficulty)
        },
        elite: {
            label: tIdle("idle_tier_elite_label", cfg.label),
            description: tIdle("idle_tier_elite_desc", cfg.description),
            difficulty: tIdle("idle_tier_elite_difficulty", cfg.difficulty)
        },
        legend: {
            label: tIdle("idle_tier_legend_label", cfg.label),
            description: tIdle("idle_tier_legend_desc", cfg.description),
            difficulty: tIdle("idle_tier_legend_difficulty", cfg.difficulty)
        },
        masters: {
            label: tIdle("idle_tier_masters_label", cfg.label),
            description: tIdle("idle_tier_masters_desc", cfg.description),
            difficulty: tIdle("idle_tier_masters_difficulty", cfg.difficulty)
        }
    };

    return { ...cfg, ...(translated[tier] || {}) };
}

function getIdleDropLabel(itemCode = "", fallback = "Item") {
    const map = {
        potion: tIdle("item_potion", "Potion"),
        poke_ball: tIdle("item_poke_ball", "Poké Ball"),
        super_ball: tIdle("item_super_ball", "Super Ball"),
        ultra_ball: tIdle("item_ultra_ball", "Ultra Ball"),
        master_ball: tIdle("item_master_ball", "Master Ball")
    };
    return map[itemCode] || fallback || itemCode || tIdle("idle_item_generic", "Item");
}

function getPrimaryTypeKeyIdle(rawType = "") {
    const first = String(rawType || "")
        .split(/[\/,|]/)[0]
        .trim()
        .toLowerCase();

    const map = {
        normal: "normal",
        fuego: "fire", fire: "fire",
        agua: "water", water: "water",
        planta: "grass", grass: "grass",
        electrico: "electric", eléctrico: "electric", electric: "electric",
        hielo: "ice", ice: "ice",
        lucha: "fighting", fighting: "fighting",
        veneno: "poison", poison: "poison",
        tierra: "ground", ground: "ground",
        volador: "flying", flying: "flying",
        psiquico: "psychic", psíquico: "psychic", psychic: "psychic",
        bicho: "bug", bug: "bug",
        roca: "rock", rock: "rock",
        fantasma: "ghost", ghost: "ghost",
        dragon: "dragon", dragón: "dragon", dragon: "dragon",
        acero: "steel", steel: "steel",
        hada: "fairy", fairy: "fairy"
    };

    return map[first] || "default";
}

function getPokemonSpriteFallbackIdle() {
    if (typeof obtenerRutaItemLocalSeguro === "function") {
        return obtenerRutaItemLocalSeguro({
            itemName: "Poke Ball",
            itemCode: "poke_ball",
            fallback: "img/items/official/0004_poke-ball.png"
        });
    }

    return "img/items/official/0004_poke-ball.png";
}

function getPokemonSpriteIdle(pokemon = {}) {
    const direct = pokemon?.imagen || pokemon?.imagen_url || pokemon?.image || pokemon?.sprite || pokemon?.official_artwork || "";
    const lowered = String(direct || "").toLowerCase();
    const looksLikeItemBall = lowered.includes("/items/poke-ball") || lowered.endsWith("poke-ball.png");
    const looksLikeRemotePokeApiSprite =
        lowered.includes("/sprites/pokemon/");

    const pokemonId = Number(
        pokemon?.pokemon_id ||
        pokemon?.id_pokemon ||
        pokemon?.pokedex_id ||
        pokemon?.species_id ||
        pokemon?.pokemon_species_id ||
        pokemon?.id ||
        0
    );

    const shiny = Boolean(pokemon?.es_shiny);
    const variantSuffix = pokemon?.variant_suffix || pokemon?.forma_suffix || "";
    const pokemonNameApi =
        pokemon?.pokemon_name_api ||
        pokemon?.api_name ||
        pokemon?.pokeapi_name ||
        pokemon?.nombre_api ||
        "";

    if (typeof obtenerRutaSpriteDesdePokemon === "function") {
        const localSprite = obtenerRutaSpriteDesdePokemon({
            ...pokemon,
            es_shiny: shiny,
            pokemon_id: pokemon?.pokemon_id || pokemon?.id_pokemon || pokemonId || null,
            species_id: pokemon?.species_id || pokemon?.pokemon_species_id || pokemon?.id_base || pokemonId || null,
            variant_suffix: variantSuffix,
            pokemon_name_api: pokemonNameApi
        });

        if (localSprite) {
            return localSprite;
        }
    }

    if (pokemonId > 0 && typeof obtenerRutaSpriteLocal === "function") {
        return obtenerRutaSpriteLocal(pokemonId, shiny, variantSuffix);
    }

    if (direct && !looksLikeItemBall && !looksLikeRemotePokeApiSprite) {
        return String(direct);
    }

    if (direct && !looksLikeItemBall) return String(direct);

    return getPokemonSpriteFallbackIdle();
}

function formatIdleType(rawType) {
    if (!rawType) return tIdle("idle_type_unknown", "Unknown type");
    try {
        if (typeof traducirTipoPokemon === "function") {
            return traducirTipoPokemon(String(rawType));
        }
    } catch (error) {
        // no-op
    }
    return String(rawType);
}

function escapeHtmlIdle(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatNumberIdle(value = 0) {
    return new Intl.NumberFormat(getLocaleIdle()).format(Number(value || 0));
}

function formatSecondsIdle(totalSeconds = 0) {
    const safe = Math.max(0, Number(totalSeconds || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = Math.floor(safe % 60);

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationLabelIdle(seconds = 3600) {
    const hours = Math.round(Number(seconds || 0) / 3600);
    if (hours <= 1) return tIdle("battle_idle_duration_1h", "1 hour");
    if (hours === 2) return tIdle("battle_idle_duration_2h", "2 hours");
    if (hours === 4) return tIdle("battle_idle_duration_4h", "4 hours");
    if (hours === 8) return tIdle("battle_idle_duration_8h", "8 hours");
    return `${hours}h`;
}

function formatDateTimeIdle(isoValue = "") {
    if (!isoValue) return "—";
    try {
        return new Intl.DateTimeFormat(getLocaleIdle(), {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(isoValue));
    } catch (error) {
        return String(isoValue);
    }
}

function normalizarTierIdle(value = "ruta") {
    const normalized = String(value || "ruta").toLowerCase();
    return Object.prototype.hasOwnProperty.call(IDLE_TIER_CONFIG, normalized) ? normalized : "ruta";
}

function normalizarDuracionIdle(value = 3600) {
    const numeric = Number(value || 3600);
    return IDLE_ALLOWED_DURATIONS.includes(numeric) ? numeric : 3600;
}

function readJsonStorageIdle(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJsonStorageIdle(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("No se pudo guardar en localStorage:", error);
    }
}

function cargarResultadoAnteriorIdle() {
    idleState.lastResult = readJsonStorageIdle(IDLE_LAST_RESULT_STORAGE_KEY, null);
}

function persistirResultadoAnteriorIdle(result = null) {
    idleState.lastResult = result || null;
    if (result) {
        writeJsonStorageIdle(IDLE_LAST_RESULT_STORAGE_KEY, result);
        return;
    }
    try {
        localStorage.removeItem(IDLE_LAST_RESULT_STORAGE_KEY);
    } catch (error) {
        // no-op
    }
}

function cargarEquipoLocalIdle() {
    const team = readJsonStorageIdle(IDLE_TEAM_STORAGE_KEY, []);
    idleState.team = Array.isArray(team) ? team.slice(0, 6) : [];
}

async function cargarEquipoServidorIdle() {
    if (!getAccessToken() || typeof fetchAuth !== "function" || typeof API_BASE === "undefined") {
        return false;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/usuario/me/equipo`);
        const equipoServidor = Array.isArray(data?.equipo) ? data.equipo.slice(0, 6) : [];
        if (!equipoServidor.length) return false;
        idleState.team = equipoServidor;
        writeJsonStorageIdle(IDLE_TEAM_STORAGE_KEY, equipoServidor);
        return true;
    } catch (error) {
        console.warn("No se pudo cargar el equipo servidor para Idle:", error);
        return false;
    }
}

async function cargarBeneficiosActivosIdle() {
    if (!getAccessToken()) {
        idleState.benefits = [];
        idleState.mastersBenefit = null;
        idleState.mastersActive = false;
        return [];
    }

    try {
        let data = null;

        if (typeof obtenerBeneficiosActivos === "function") {
            data = await obtenerBeneficiosActivos();
        } else if (typeof fetchAuth === "function" && typeof API_BASE !== "undefined") {
            data = await fetchAuth(`${API_BASE}/payments/beneficios/activos`);
        }

        const benefits = Array.isArray(data?.beneficios) ? data.beneficios : [];
        idleState.benefits = benefits;
        idleState.mastersBenefit = benefits.find(benefit => String(benefit?.beneficio_codigo || "") === "idle_masters") || null;
        idleState.mastersActive = Boolean(idleState.mastersBenefit);
        return benefits;
    } catch (error) {
        console.warn("No se pudieron cargar los beneficios premium activos:", error);
        idleState.benefits = [];
        idleState.mastersBenefit = null;
        idleState.mastersActive = false;
        return [];
    }
}

function obtenerIdsEquipoIdle() {
    return idleState.team
        .map(pokemon => Number(pokemon?.usuario_pokemon_id || pokemon?.id || 0))
        .filter(id => Number.isInteger(id) && id > 0)
        .slice(0, 6);
}

function getAverageTeamLevelIdle() {
    if (!idleState.team.length) return 0;
    const total = idleState.team.reduce((sum, pokemon) => sum + Number(pokemon?.nivel || 0), 0);
    return Math.round(total / idleState.team.length);
}

function hasMastersBenefitIdle() {
    return Boolean(idleState.mastersActive);
}

function getIdleRegionProgressMap() {
    const regiones = Array.isArray(idleState.gymProgress?.regiones) ? idleState.gymProgress.regiones : [];
    return regiones.reduce((acc, region) => {
        const codigo = String(region?.codigo || "").toLowerCase();
        if (!codigo) return acc;
        acc[codigo] = {
            total: Number(region?.total_gyms || 0),
            completados: Number(region?.completados || 0),
            porcentaje: Number(region?.porcentaje || 0)
        };
        return acc;
    }, {});
}

function isIdleRegionComplete(regionCode = "") {
    const region = getIdleRegionProgressMap()[String(regionCode || "").toLowerCase()];
    return Boolean(region && region.total > 0 && region.completados >= region.total);
}

function getIdleTierUnlockState(tierCode = "ruta") {
    const tier = normalizarTierIdle(tierCode);
    const requiresGymProgress = tier === "elite" || tier === "legend";
    const loggedIn = Boolean(getAccessToken());
    const progressPending = loggedIn && requiresGymProgress && !idleState.gymProgressLoaded;

    if (tier === "ruta") {
        return {
            tier,
            locked: false,
            pending: false,
            requirementBadge: tIdle("idle_requirement_free_badge", "Free"),
            requirementText: tIdle("idle_requirement_route_text", "Route is open for every player. No Gym or subscription requirement."),
            feedbackText: ""
        };
    }

    if (tier === "masters") {
        const locked = !hasMastersBenefitIdle();
        return {
            tier,
            locked,
            pending: false,
            requirementBadge: tIdle("idle_requirement_subscription_badge", "Subscription"),
            requirementText: locked
                ? tIdle("idle_masters_requires_benefit", "The Masters tier requires the Idle Masters premium benefit before launch.")
                : tIdle("idle_requirement_masters_ready", "Idle Masters subscription detected. This premium tier is ready to launch."),
            feedbackText: locked
                ? tIdle("idle_masters_locked_feedback", "Masters is a premium tier. Activate the Idle Masters benefit in Shop to launch it.")
                : ""
        };
    }

    if (progressPending) {
        const badgeKey = tier === "elite" ? "idle_requirement_kanto_badge" : "idle_requirement_regions_badge";
        return {
            tier,
            locked: true,
            pending: true,
            requirementBadge: tIdle(badgeKey, tier === "elite" ? "Kanto clear" : "3 regions"),
            requirementText: tIdle("idle_requirement_progress_pending", "Checking your Gym progression to unlock this tier..."),
            feedbackText: tIdle("idle_requirement_progress_pending", "Checking your Gym progression to unlock this tier...")
        };
    }

    const kantoComplete = isIdleRegionComplete("kanto");
    const johtoComplete = isIdleRegionComplete("johto");
    const hoennComplete = isIdleRegionComplete("hoenn");
    const allRegionsComplete = kantoComplete && johtoComplete && hoennComplete;

    if (tier === "elite") {
        const locked = !kantoComplete;
        return {
            tier,
            locked,
            pending: false,
            requirementBadge: tIdle("idle_requirement_kanto_badge", "Kanto clear"),
            requirementText: locked
                ? tIdle("idle_requirement_elite_locked", "Elite unlocks after clearing the full Kanto Gym route.")
                : tIdle("idle_requirement_elite_ready", "Kanto route cleared. Elite is unlocked for your account."),
            feedbackText: locked
                ? tIdle("idle_requirement_elite_locked", "Elite unlocks after clearing the full Kanto Gym route.")
                : ""
        };
    }

    const locked = !allRegionsComplete;
    return {
        tier,
        locked,
        pending: false,
        requirementBadge: tIdle("idle_requirement_regions_badge", "3 regions"),
        requirementText: locked
            ? tIdle("idle_requirement_legend_locked", "Legend unlocks after clearing Kanto, Johto and Hoenn Gym routes.")
            : tIdle("idle_requirement_legend_ready", "All 3 Gym routes cleared. Legend is unlocked for your account."),
        feedbackText: locked
            ? tIdle("idle_requirement_legend_locked", "Legend unlocks after clearing Kanto, Johto and Hoenn Gym routes.")
            : ""
    };
}

async function cargarProgresoGymsIdle() {
    if (!getAccessToken()) {
        idleState.gymProgress = null;
        idleState.gymProgressLoaded = false;
        return null;
    }

    try {
        let data = null;
        if (typeof obtenerProgresoGyms === "function") {
            data = await obtenerProgresoGyms();
        } else if (typeof fetchAuth === "function" && typeof API_BASE !== "undefined") {
            data = await fetchAuth(`${API_BASE}/battle/gyms/progreso`);
        }

        idleState.gymProgress = data || null;
        idleState.gymProgressLoaded = Boolean(data?.ok);
        return data;
    } catch (error) {
        console.warn("No se pudo cargar el progreso de Gyms para Idle:", error);
        idleState.gymProgress = null;
        idleState.gymProgressLoaded = false;
        return null;
    }
}

function isMastersSelectedLockedIdle() {
    return normalizarTierIdle(idleState.selectedTier) === "masters" && !hasMastersBenefitIdle();
}

function computeIdleEstimate(team = [], tierCode = "ruta", durationSeconds = 3600) {
    const tier = IDLE_TIER_CONFIG[normalizarTierIdle(tierCode)];
    const duration = normalizarDuracionIdle(durationSeconds);
    const safeTeam = Array.isArray(team) ? team : [];

    if (!safeTeam.length) {
        return {
            ticks: Math.max(1, Math.floor(duration / tier.tickSegundos)),
            successRate: 0,
            wins: 0,
            defeats: 0,
            exp: 0,
            coins: 0,
            drops: tier.drops.map(drop => ({ ...drop, expected: 0 }))
        };
    }

    const ticks = Math.max(1, Math.floor(duration / tier.tickSegundos));
    const avgNivel = safeTeam.reduce((sum, p) => sum + Number(p?.nivel || 1), 0) / safeTeam.length;
    const avgHp = safeTeam.reduce((sum, p) => sum + Number(p?.hp_max || p?.hp_actual || 1), 0) / safeTeam.length;
    const avgAtk = safeTeam.reduce((sum, p) => sum + Number(p?.ataque || 1), 0) / safeTeam.length;
    const avgDef = safeTeam.reduce((sum, p) => sum + Number(p?.defensa || 1), 0) / safeTeam.length;
    const avgSpAtk = safeTeam.reduce((sum, p) => sum + Number(p?.ataque_especial || p?.ataque || 1), 0) / safeTeam.length;
    const avgSpDef = safeTeam.reduce((sum, p) => sum + Number(p?.defensa_especial || p?.defensa || 1), 0) / safeTeam.length;

    const powerTeam = (avgNivel * 1.8) + (avgHp * 0.10) + (avgAtk * 0.15) + (avgDef * 0.12) + (avgSpAtk * 0.14) + (avgSpDef * 0.11);
    const powerEnemy = Math.max(1.0, powerTeam * Number(tier.enemyPower || 1));
    const ratio = powerEnemy > 0 ? (powerTeam / powerEnemy) : 1;
    const successRate = Math.max(0.55, Math.min(0.95, 0.70 + ((ratio - 1.0) * 0.25)));
    const wins = Math.round(ticks * successRate);
    const defeats = Math.max(0, ticks - wins);
    const exp = wins * Number(tier.baseExp || 0);
    const coins = wins * Number(tier.baseCoins || 0);
    const drops = tier.drops.map(drop => ({
        ...drop,
        expected: Number((ticks * Number(drop.chance || 0)).toFixed(2))
    }));

    return { ticks, successRate, wins, defeats, exp, coins, drops };
}

function renderTierCardsIdle() {
    const container = document.getElementById("idleTierCards");
    if (!container) return;

    const activeSession = idleState.idleData?.sesion && idleState.idleData?.activa
        ? idleState.idleData.sesion
        : null;
    const runningTier = activeSession ? normalizarTierIdle(activeSession.tier_codigo || "ruta") : null;
    const runningState = String(activeSession?.estado || "").toLowerCase();

    container.innerHTML = Object.keys(IDLE_TIER_CONFIG).map((tierCode) => {
        const cfg = getIdleTierMeta(tierCode);
        const isSelected = tierCode === idleState.selectedTier;
        const isRunning = Boolean(runningTier) && tierCode === runningTier;
        const active = (isSelected || isRunning) ? " active" : "";
        const runningClass = isRunning ? " is-running" : "";
        const gate = getIdleTierUnlockState(tierCode);
        const locked = gate.locked;
        const lockedClass = locked ? " is-locked" : "";
        const estimate = computeIdleEstimate(idleState.team, tierCode, idleState.selectedDuration);

        const badges = [];
        badges.push(`<span class="idle-mini-chip ${locked ? "idle-mini-chip-locked" : "idle-mini-chip-gate"}">${escapeHtmlIdle(gate.requirementBadge)}</span>`);

        if (tierCode === "masters") {
            badges.push(
                hasMastersBenefitIdle()
                    ? `<span class="idle-mini-chip idle-mini-chip-active">${escapeHtmlIdle(tIdle("idle_masters_active_chip", "Benefit active"))}</span>`
                    : `<span class="idle-mini-chip idle-mini-chip-locked">${escapeHtmlIdle(tIdle("idle_masters_locked_chip", "Premium"))}</span>`
            );
        }

        if (isRunning) {
            badges.push(`<span class="idle-mini-chip idle-mini-chip-running">${escapeHtmlIdle(runningState === "reclamable" ? tIdle("battle_idle_status_ready", "Ready") : tIdle("battle_idle_status_active", "Active"))}</span>`);
        } else if (isSelected) {
            badges.push(`<span class="idle-mini-chip idle-mini-chip-selected">${escapeHtmlIdle(tIdle("battle_mode_selected", "Selected"))}</span>`);
        }

        return `
            <button type="button" class="idle-tier-card idle-tier-${escapeHtmlIdle(tierCode)}${active}${runningClass}${lockedClass}" data-tier="${escapeHtmlIdle(tierCode)}" data-locked="${locked ? "1" : "0"}">
                <div class="idle-tier-card-top">
                    <div>
                        <h4>${escapeHtmlIdle(cfg.label)}</h4>
                        <p>${escapeHtmlIdle(cfg.description)}</p>
                    </div>
                    <div class="idle-tier-card-badges">${badges.join("")}</div>
                </div>
                <div class="idle-tier-card-metrics">
                    <strong>${formatNumberIdle(estimate.exp)} EXP</strong>
                    <small>${formatNumberIdle(estimate.coins)} ${escapeHtmlIdle(tIdle("idle_currency_label", "Pokédollars"))}</small>
                </div>
                <div class="idle-tier-card-requirement${locked ? " is-warning" : ""}">${escapeHtmlIdle(gate.requirementText)}</div>
                <div class="idle-tier-card-footer">
                    <span>${Math.round(estimate.successRate * 100)}% ${escapeHtmlIdle(tIdle("idle_success_short", "success"))}</span>
                    <span>${escapeHtmlIdle(cfg.difficulty)}</span>
                </div>
            </button>
        `;
    }).join("");

    container.querySelectorAll(".idle-tier-card").forEach(card => {
        card.addEventListener("click", async () => {
            const session = idleState.idleData?.sesion && idleState.idleData?.activa
                ? idleState.idleData.sesion
                : null;

            if (session) {
                const sessionTier = normalizarTierIdle(session.tier_codigo || "ruta");
                idleState.selectedTier = sessionTier;
                const tierSelectLocked = document.getElementById("idleTierSelect");
                if (tierSelectLocked) tierSelectLocked.value = sessionTier;

                setFeedbackIdle(
                    tIdle(
                        "idle_active_tier_locked_feedback",
                        "An expedition is already in progress. The active tier stays highlighted until you claim or cancel the run."
                    ),
                    "info"
                );

                renderTierCardsIdle();
                renderSelectedPlanIdle();
                renderEstimateIdle();
                renderMastersPanelIdle();
                renderStatusIdle();
                return;
            }

            idleState.selectedTier = normalizarTierIdle(card.dataset.tier || "ruta");
            const tierSelect = document.getElementById("idleTierSelect");
            if (tierSelect) tierSelect.value = idleState.selectedTier;

            if (card.dataset.locked === "1") {
                const lockedGate = getIdleTierUnlockState(idleState.selectedTier);

                if (idleState.selectedTier === "masters" && !lockedGate.pending) {
                    setFeedbackIdle("");
                    await abrirModalPremiumIdle({ source: "tier_card" });
                } else {
                    setFeedbackIdle(lockedGate.feedbackText || lockedGate.requirementText, lockedGate.pending ? "info" : "warning");
                }
            } else if (document.getElementById("idleFeedback")?.classList.contains("idle-feedback-info")) {
                setFeedbackIdle("");
            }

            renderTierCardsIdle();
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderMastersPanelIdle();
            renderStatusIdle();
        });
    });
}

function renderSelectedPlanIdle() {
    const panel = document.getElementById("idleSelectedPlan");
    const tierSelect = document.getElementById("idleTierSelect");
    const durationSelect = document.getElementById("idleDurationSelect");
    if (!panel) return;

    const tierCode = normalizarTierIdle(tierSelect?.value || idleState.selectedTier);
    const duration = normalizarDuracionIdle(durationSelect?.value || idleState.selectedDuration);
    idleState.selectedTier = tierCode;
    idleState.selectedDuration = duration;

    const cfg = getIdleTierMeta(tierCode);
    const estimate = computeIdleEstimate(idleState.team, tierCode, duration);
    const gate = getIdleTierUnlockState(tierCode);

    panel.setAttribute("data-idle-tier", tierCode);

    panel.innerHTML = `
        <div class="idle-plan-header">
            <div>
                <h4>${escapeHtmlIdle(cfg.label)} ${escapeHtmlIdle(tIdle("idle_plan_suffix", "plan"))}</h4>
                <p>${escapeHtmlIdle(cfg.description)}</p>
            </div>
            <span class="idle-mini-chip ${gate.locked ? "idle-mini-chip-locked" : "idle-mini-chip-gate"}">${escapeHtmlIdle(gate.requirementBadge)}</span>
        </div>

        <div class="idle-selected-plan-grid">
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_duration_label", "Duration"))}</span>
                <strong>${escapeHtmlIdle(formatDurationLabelIdle(duration))}</strong>
            </article>
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_tick_label", "Tick"))}</span>
                <strong>${escapeHtmlIdle(formatSecondsIdle(cfg.tickSegundos))}</strong>
            </article>
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_difficulty_label", "Difficulty"))}</span>
                <strong>${escapeHtmlIdle(cfg.difficulty)}</strong>
            </article>
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_estimated_wins_label", "Estimated wins"))}</span>
                <strong>${formatNumberIdle(estimate.wins)}</strong>
            </article>
        </div>

        <div class="idle-plan-note ${gate.locked ? "is-warning" : ""}">
            ${gate.locked
                ? `
                    ${escapeHtmlIdle(gate.requirementText)}
                    ${tierCode === "masters" ? `
                        <button type="button" class="idle-plan-premium-trigger" data-open-idle-premium-modal="1">
                            ${escapeHtmlIdle(tIdle("idle_masters_subscribe_now", "Unlock Masters now"))}
                        </button>
                    ` : ""}
                `
                : escapeHtmlIdle(tIdle("idle_plan_note_standard", "This page uses the same team already saved in Battle IA."))
            }
        </div>
    `;

    panel.querySelectorAll('[data-open-idle-premium-modal="1"]').forEach(btn => {
        btn.addEventListener("click", async () => {
            await abrirModalPremiumIdle({ source: "selected_plan" });
        });
    });
}

function renderEstimateIdle() {
    const estimate = computeIdleEstimate(idleState.team, idleState.selectedTier, idleState.selectedDuration);

    const map = {
        idleEstimateTicks: estimate.ticks,
        idleEstimateWins: estimate.wins,
        idleEstimateExp: estimate.exp,
        idleEstimateCoins: estimate.coins,
        idleHeroEstimateExp: estimate.exp
    };

    Object.entries(map).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = formatNumberIdle(value);
    });

    const successRate = document.getElementById("idleEstimateSuccessRate");
    if (successRate) {
        successRate.textContent = `${tIdle("idle_success_rate_label", "Success rate")} ${Math.round(estimate.successRate * 100)}%`;
    }

    const drops = document.getElementById("idleEstimateDrops");
    if (drops) {
        drops.innerHTML = estimate.drops.map(drop => `
            <article class="idle-drop-item">
                <div>
                    <strong>${escapeHtmlIdle(getIdleDropLabel(drop.itemCode, drop.label))}</strong>
                    <span>${escapeHtmlIdle(drop.itemCode)}</span>
                </div>
                <span>${escapeHtmlIdle(tIdle("idle_avg_drop_prefix", "Avg."))} ${escapeHtmlIdle(drop.expected)} ${escapeHtmlIdle(tIdle("idle_per_run_suffix", "per run"))}</span>
            </article>
        `).join("");
    }

    const heroCount = document.getElementById("idleHeroTeamCount");
    const heroLevel = document.getElementById("idleHeroTeamLevel");
    if (heroCount) heroCount.textContent = `${idleState.team.length} / 6`;
    if (heroLevel) heroLevel.textContent = String(getAverageTeamLevelIdle());
}

function renderTeamIdle() {
    const summary = document.getElementById("idleTeamSummary");
    const grid = document.getElementById("idleTeamGrid");
    if (!summary || !grid) return;

    const completeTeam = idleState.team.length === 6;
    const avgLevel = getAverageTeamLevelIdle();
    const highestLevel = idleState.team.length
        ? Math.max(...idleState.team.map(p => Number(p?.nivel || 0)))
        : 0;

    summary.innerHTML = `
        <article class="idle-team-summary-card">
            <span>${escapeHtmlIdle(tIdle("idle_saved_members_label", "Saved members"))}</span>
            <strong>${idleState.team.length} / 6</strong>
        </article>
        <article class="idle-team-summary-card">
            <span>${escapeHtmlIdle(tIdle("idle_average_level_label", "Average level"))}</span>
            <strong>${avgLevel}</strong>
        </article>
        <article class="idle-team-summary-card">
            <span>${escapeHtmlIdle(tIdle("idle_status_label", "Status"))}</span>
            <strong>${completeTeam ? escapeHtmlIdle(tIdle("idle_status_ready", "Ready")) : escapeHtmlIdle(tIdle("idle_status_incomplete", "Incomplete"))}</strong>
        </article>
    `;

    if (!idleState.team.length) {
        grid.innerHTML = `
            <div class="idle-empty-card">
                ${tIdle("idle_no_team_message", "No Battle team found yet. Go to Battle IA, save a 6-Pokémon team, and then come back to launch Idle Expedition.")}
            </div>
        `;
        return;
    }

    grid.innerHTML = idleState.team.map(pokemon => {
        const sprite = getPokemonSpriteIdle(pokemon);
        const primaryType = getPrimaryTypeKeyIdle(pokemon?.tipo || "");
        const shinyTag = pokemon?.es_shiny ? `<span class="idle-team-tag idle-team-tag-shiny">${escapeHtmlIdle(tIdle("pokemon_shiny", "Shiny"))}</span>` : "";
        return `
            <article class="idle-team-card idle-team-type-${escapeHtmlIdle(primaryType)}">
                <div class="idle-team-avatar idle-team-avatar-${escapeHtmlIdle(primaryType)}">
                    <img src="${escapeHtmlIdle(sprite)}" alt="${escapeHtmlIdle(pokemon?.nombre || tIdle("idle_pokemon_fallback", "Pokemon"))}" loading="lazy" decoding="async" onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${escapeHtmlIdle(getPokemonSpriteFallbackIdle())}';">
                </div>
                <div class="idle-team-meta">
                    <h4>${escapeHtmlIdle(pokemon?.nombre || tIdle("idle_unknown_name", "Unknown"))}</h4>
                    <p>${escapeHtmlIdle(tIdle("idle_level_prefix", "Lv."))} ${formatNumberIdle(pokemon?.nivel || 0)} · ${escapeHtmlIdle(formatIdleType(pokemon?.tipo || tIdle("idle_type_unknown", "Unknown type")))}</p>
                    <div class="idle-team-tags">
                        <span class="idle-team-tag">HP ${formatNumberIdle(pokemon?.hp_max || pokemon?.hp_actual || 0)}</span>
                        <span class="idle-team-tag">ATK ${formatNumberIdle(pokemon?.ataque || 0)}</span>
                        <span class="idle-team-tag">DEF ${formatNumberIdle(pokemon?.defensa || 0)}</span>
                        <span class="idle-team-tag">${escapeHtmlIdle(tIdle("idle_peak_level_label", "Peak Lv"))} ${highestLevel}</span>
                        ${shinyTag}
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderLastResultIdle() {
    const panel = document.getElementById("idleLastResult");
    if (!panel) return;

    const result = idleState.lastResult;
    if (!result) {
        panel.removeAttribute("data-tier");
        panel.innerHTML = `
            <div class="idle-empty-card">
                ${tIdle("idle_no_previous_claim", "No previous claim saved yet. Once you claim an expedition, the latest result will stay visible here.")}
            </div>
        `;
        return;
    }

    const tierCode = normalizarTierIdle(result?.tier_codigo || "ruta");
    panel.setAttribute("data-tier", tierCode);

    const items = Array.isArray(result?.items_ganados) ? result.items_ganados : [];
    const itemsHtml = items.length
        ? items.map(item => {
            const itemCode = String(item.item_code || item.itemCode || "item");
            return `<span class="idle-drop-pill idle-drop-pill-${escapeHtmlIdle(itemCode)}">${escapeHtmlIdle(getIdleDropLabel(itemCode, itemCode))} × ${formatNumberIdle(item.cantidad || 0)}</span>`;
        }).join("")
        : `<span class="idle-drop-pill idle-drop-pill-empty">${escapeHtmlIdle(tIdle("idle_no_item_drops", "No item drops"))}</span>`;

    panel.innerHTML = `
        <div class="idle-last-result-shell idle-last-result-tier-${escapeHtmlIdle(tierCode)}">
            <div class="idle-last-result-top">
                <div class="idle-last-result-copy">
                    <span class="idle-mini-chip idle-mini-chip-selected">${escapeHtmlIdle(tIdle("idle_latest_claim_label", "Latest claim"))}</span>
                    <h4>${escapeHtmlIdle(traducirTierIdle(tierCode))} ${escapeHtmlIdle(tIdle("idle_result_title_suffix", "Expedition"))}</h4>
                    <p>${tIdle("idle_latest_claim_copy", "Latest claim saved locally so you can keep track of your most recent run without touching backend again.")}</p>
                </div>
                <div class="idle-last-result-badge">
                    <span>${escapeHtmlIdle(tIdle("idle_drop_pressure_label", "Reward mix"))}</span>
                    <strong>${escapeHtmlIdle(traducirTierIdle(tierCode))}</strong>
                </div>
            </div>

            <div class="idle-result-grid">
                <article>
                    <span>EXP</span>
                    <strong>${formatNumberIdle(result?.exp_ganada || 0)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_currency_label", "Pokédollars"))}</span>
                    <strong>${formatNumberIdle(result?.pokedolares_ganados || 0)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_estimated_wins_label", "Estimated wins"))}</span>
                    <strong>${formatNumberIdle(result?.victorias_estimadas || 0)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_ticks_label", "Ticks"))}</span>
                    <strong>${formatNumberIdle(result?.ticks || 0)}</strong>
                </article>
            </div>

            <div class="idle-last-result-drops">
                <div class="idle-last-result-drops-head">
                    <span>${escapeHtmlIdle(tIdle("idle_rewards_drops_title", "Drops secured"))}</span>
                    <strong>${formatNumberIdle(items.reduce((sum, item) => sum + Number(item?.cantidad || 0), 0))}</strong>
                </div>
                <div class="idle-team-tags idle-team-tags-result idle-drop-pill-list">
                    ${itemsHtml}
                </div>
            </div>
        </div>
    `;
}

function renderMastersPanelIdle() {
    const panel = document.getElementById("idleMastersPanel");
    if (!panel) return;

    const featureItems = [
        tIdle("premium_idle_feature_1", "+100% EXP vs Legend"),
        tIdle("premium_idle_feature_2", "+100% GOLD vs Legend"),
        tIdle("premium_idle_feature_3", "Ultra Ball 12% per tick"),
        tIdle("premium_idle_feature_4", "Master Ball 0.45% per tick")
    ].map(feature => `<li>${escapeHtmlIdle(feature)}</li>`).join("");

    const locked = !hasMastersBenefitIdle();
    const selectedMasters = normalizarTierIdle(idleState.selectedTier) === "masters";
    const chipClass = locked ? "idle-mini-chip-locked" : "idle-mini-chip-active";
    const chipText = locked ? tIdle("idle_masters_locked_chip", "Premium") : tIdle("idle_masters_active_chip", "Benefit active");
    const expiry = idleState.mastersBenefit?.expira_en
        ? tIdle("idle_masters_active_until", "Active until {date}", { date: formatDateTimeIdle(idleState.mastersBenefit.expira_en) })
        : "";

    panel.innerHTML = `
        <div class="idle-masters-card ${locked ? "is-locked" : "is-active"}">
            <div class="idle-masters-top">
                <span class="idle-mini-chip ${chipClass}">${escapeHtmlIdle(chipText)}</span>
                ${selectedMasters ? `<span class="idle-mini-chip idle-mini-chip-selected">${escapeHtmlIdle(tIdle("battle_mode_selected", "Selected"))}</span>` : ""}
            </div>

            <h4>${escapeHtmlIdle(locked ? tIdle("idle_masters_locked_title", "Masters is locked") : tIdle("idle_masters_active_title", "Masters unlocked"))}</h4>
            <p>${escapeHtmlIdle(locked
                ? tIdle("idle_masters_locked_text", "Activate the Idle Masters subscription to unlock the premium tier and its rare drop table.")
                : tIdle("idle_masters_active_text", "Your account can already launch Masters runs with premium rewards and rare drops.")
            )}</p>

            ${expiry ? `<div class="idle-masters-expiry">${escapeHtmlIdle(expiry)}</div>` : ""}

            <ul class="idle-masters-list">
                ${featureItems}
            </ul>

            <div class="idle-masters-actions">
                <button
                    type="button"
                    class="idle-action ${locked ? "idle-action-primary" : "idle-action-ghost"}"
                    data-open-idle-premium-modal="1"
                >
                    ${escapeHtmlIdle(locked ? tIdle("idle_masters_go_shop", "Unlock with PayPal") : tIdle("idle_masters_manage_shop", "View premium details"))}
                </button>
            </div>
        </div>
    `;

    panel.querySelectorAll('[data-open-idle-premium-modal="1"]').forEach(button => {
        button.addEventListener("click", async () => {
            await abrirModalPremiumIdle({ source: "panel" });
        });
    });
}

function setFeedbackIdle(message = "", type = "info") {
    const box = document.getElementById("idleFeedback");
    if (!box) return;

    if (!message) {
        box.className = "idle-feedback oculto";
        box.textContent = "";
        return;
    }

    box.className = `idle-feedback idle-feedback-${type}`;
    box.textContent = message;
}

function renderHeroStatusIdle() {
    const title = document.getElementById("idleHeroStatusTitle");
    const text = document.getElementById("idleHeroStatusText");
    if (!title || !text) return;

    if (!getAccessToken()) {
        title.textContent = tIdle("idle_login_required_title", "Login required");
        text.textContent = tIdle("idle_login_required_text", "Sign in first to sync expedition state, launch runs, and claim backend rewards.");
        return;
    }

    const sesion = idleState.idleData?.sesion || null;
    if (!sesion || !idleState.idleData?.activa) {
        if (isMastersSelectedLockedIdle()) {
            title.textContent = tIdle("idle_masters_locked_title", "Masters is locked");
            text.textContent = tIdle("idle_masters_requires_benefit", "The Masters tier requires the Idle Masters premium benefit before launch.");
            return;
        }

        title.textContent = idleState.team.length === 6
            ? tIdle("idle_ready_to_launch", "Ready to launch")
            : tIdle("idle_team_incomplete_title", "Team incomplete");
        text.textContent = idleState.team.length === 6
            ? tIdle("idle_ready_team_text", "Your saved Battle team is ready for a new Idle Expedition.")
            : tIdle("idle_requires_six_text", "Idle requires exactly 6 Pokémon in the saved Battle team before launching.");
        return;
    }

    if (String(sesion.estado || "").toLowerCase() === "reclamable") {
        title.textContent = tIdle("idle_rewards_ready_title", "Rewards ready");
        text.textContent = tIdle("idle_rewards_ready_text", "The expedition is complete and waiting for you to claim the rewards.");
        return;
    }

    title.textContent = tIdle("idle_active_title", "Expedition active");
    text.textContent = `${tIdle("idle_active_text_prefix", "Your")} ${traducirTierIdle(idleState.idleData?.sesion?.tier_codigo)} ${tIdle("idle_active_text_suffix", "run is currently in progress.")}`;
}

function renderStatusIdle() {
    const tierSelect = document.getElementById("idleTierSelect");
    const durationSelect = document.getElementById("idleDurationSelect");
    const badge = document.getElementById("idleStatusBadge");
    const timerLabel = document.getElementById("idleTimerLabel");
    const timerValue = document.getElementById("idleTimerValue");
    const progressFill = document.getElementById("idleProgressFill");
    const progressText = document.getElementById("idleProgressText");
    const btnStart = document.getElementById("btnStartIdlePage");
    const btnClaim = document.getElementById("btnClaimIdlePage");
    const btnCancel = document.getElementById("btnCancelIdlePage");

    if (!tierSelect || !durationSelect || !badge || !timerLabel || !timerValue || !progressFill || !progressText || !btnStart || !btnClaim || !btnCancel) {
        return;
    }

    renderHeroStatusIdle();

    const tierValue = normalizarTierIdle(tierSelect.value || idleState.selectedTier);
    const durationValue = normalizarDuracionIdle(durationSelect.value || idleState.selectedDuration);
    idleState.selectedTier = tierValue;
    idleState.selectedDuration = durationValue;

    if (!getAccessToken()) {
        badge.textContent = tIdle("idle_login_badge", "Login");
        timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
        timerValue.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = tIdle("battle_idle_login_text", "Sign in to use Idle Expedition.");
        btnStart.disabled = true;
        btnClaim.disabled = true;
        btnCancel.disabled = true;
        tierSelect.disabled = false;
        durationSelect.disabled = false;
        return;
    }

    const activeSession = idleState.idleData?.sesion || null;
    if (!activeSession || !idleState.idleData?.activa) {
        const teamReady = obtenerIdsEquipoIdle().length === 6;
        const gate = getIdleTierUnlockState(tierValue);

        badge.textContent = gate.locked
            ? gate.requirementBadge
            : tIdle("battle_idle_status_idle", "Ready");
        timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
        timerValue.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = gate.locked
            ? gate.requirementText
            : (teamReady
                ? tIdle("battle_idle_status_idle_text", "Choose a tier and duration, then start the expedition.")
                : tIdle("idle_need_six_saved_text", "Idle Expedition requires exactly 6 saved Pokémon in your Battle team."));
        btnStart.disabled = !teamReady || gate.locked;
        btnClaim.disabled = true;
        btnCancel.disabled = true;
        tierSelect.disabled = false;
        durationSelect.disabled = false;
        return;
    }

    const sessionState = String(activeSession.estado || "activa").toLowerCase();
    const progress = Math.max(0, Math.min(100, Number(activeSession.progreso_pct || 0)));
    progressFill.style.width = `${progress}%`;
    timerValue.textContent = sessionState === "reclamable"
        ? "100%"
        : formatSecondsIdle(Number(activeSession.segundos_restantes || 0));

    tierSelect.value = normalizarTierIdle(activeSession.tier_codigo || idleState.selectedTier);
    durationSelect.value = String(normalizarDuracionIdle(activeSession.duracion_segundos || idleState.selectedDuration));
    idleState.selectedTier = normalizarTierIdle(activeSession.tier_codigo || idleState.selectedTier);
    idleState.selectedDuration = normalizarDuracionIdle(activeSession.duracion_segundos || idleState.selectedDuration);
    tierSelect.disabled = true;
    durationSelect.disabled = true;

    if (sessionState === "reclamable") {
        badge.textContent = tIdle("battle_idle_status_ready", "Ready");
        timerLabel.textContent = tIdle("battle_idle_progress", "Progress");
        progressText.textContent = tIdle("battle_idle_ready_message", "Your rewards are ready to claim.");
        btnStart.disabled = true;
        btnClaim.disabled = false;
        btnCancel.disabled = true;
        return;
    }

    badge.textContent = tIdle("battle_idle_status_active", "Active");
    timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
    progressText.textContent = `${tIdle("idle_running_prefix", "Expedition")} ${traducirTierIdle(activeSession.tier_codigo)} ${tIdle("idle_running_middle", "running")} · ${progress}% ${tIdle("idle_complete_suffix", "complete")}.`;
    btnStart.disabled = true;
    btnClaim.disabled = true;
    btnCancel.disabled = false;
}


function clearIdleCompletionAlert() {
    try {
        sessionStorage.removeItem(IDLE_COMPLETION_ALERT_TOKEN_KEY);
    } catch (error) {
        // no-op
    }

    try {
        localStorage.removeItem(IDLE_COMPLETION_ALERT_TOKEN_KEY);
    } catch (error) {
        // no-op
    }
}

function maybeShowIdleCompletionReadyModal() {
    return false;
}

function emitirEventoIdleEstadoGlobal(session = null) {
    try {
        document.dispatchEvent(new CustomEvent("mastersmonIdleStateChanged", {
            detail: { session: session || null }
        }));
    } catch (error) {
        // no-op
    }
}

function traducirTierIdle(tierCode = "ruta") {
    const tier = normalizarTierIdle(tierCode);
    if (tier === "masters") return tIdle("battle_idle_tier_masters", "Masters");
    if (tier === "legend") return tIdle("battle_idle_tier_legend", "Legend");
    if (tier === "elite") return tIdle("battle_idle_tier_elite", "Elite");
    return tIdle("battle_idle_tier_ruta", "Route");
}

function registrarEstadoIdle(data = null) {
    idleState.idleData = data || null;
    idleState.lastSyncMs = Date.now();
    idleState.countdownFinished = false;

    if (!data?.sesion) {
        idleState.serverOffsetMs = 0;
        idleState.startedAtMs = 0;
        idleState.endsAtMs = 0;
        idleState.remainingBaseSeconds = 0;
        idleState.totalSessionSeconds = 0;
        clearIdleCompletionAlert();
        emitirEventoIdleEstadoGlobal(null);
        return;
    }

    const serverNowMs = Date.parse(data?.hora_server || "");
    if (Number.isFinite(serverNowMs)) {
        idleState.serverOffsetMs = serverNowMs - Date.now();
    }

    idleState.startedAtMs = Date.parse(data?.sesion?.iniciado_en || "") || 0;
    idleState.endsAtMs = Date.parse(data?.sesion?.termina_en || "") || 0;
    idleState.remainingBaseSeconds = Math.max(0, Number(data?.sesion?.segundos_restantes || 0));
    idleState.totalSessionSeconds = Math.max(1, Number(data?.sesion?.duracion_segundos || 1));

    const currentTier = normalizarTierIdle(data?.sesion?.tier_codigo || idleState.selectedTier);
    const currentDuration = normalizarDuracionIdle(data?.sesion?.duracion_segundos || idleState.selectedDuration);
    idleState.selectedTier = currentTier;
    idleState.selectedDuration = currentDuration;
    emitirEventoIdleEstadoGlobal(data?.sesion || null);
}

function obtenerAhoraServidorIdleMs() {
    return Date.now() + Number(idleState.serverOffsetMs || 0);
}

function actualizarRelojVisualIdle() {
    const sesion = idleState.idleData?.sesion;
    if (!sesion || String(sesion.estado || "").toLowerCase() !== "activa") return;

    const timerValue = document.getElementById("idleTimerValue");
    const progressFill = document.getElementById("idleProgressFill");
    const progressText = document.getElementById("idleProgressText");
    if (!timerValue || !progressFill || !progressText) return;

    const elapsedSinceSyncSeconds = Math.max(0, Math.floor((Date.now() - Number(idleState.lastSyncMs || Date.now())) / 1000));
    const totalSeconds = Math.max(1, Number(idleState.totalSessionSeconds || sesion.duracion_segundos || 1));
    const remainingSeconds = Math.max(0, Number(idleState.remainingBaseSeconds || 0) - elapsedSinceSyncSeconds);
    const elapsedSeconds = Math.max(0, Math.min(totalSeconds, totalSeconds - remainingSeconds));
    const progress = Math.max(0, Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)));

    timerValue.textContent = formatSecondsIdle(remainingSeconds);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${tIdle("idle_running_prefix", "Expedition")} ${traducirTierIdle(sesion.tier_codigo)} ${tIdle("idle_running_middle", "running")} · ${progress}% ${tIdle("idle_complete_suffix", "complete")}.`;

    if (remainingSeconds <= 0 && !idleState.countdownFinished) {
        idleState.countdownFinished = true;
        if (idleState.idleData?.sesion) {
            idleState.idleData.sesion.estado = "reclamable";
            idleState.idleData.sesion.progreso_pct = 100;
            idleState.idleData.sesion.segundos_restantes = 0;
        }
        renderStatusIdle();
        emitirEventoIdleEstadoGlobal(idleState.idleData?.sesion || null);
        cargarEstadoIdle(true);
    }
}

function iniciarRelojIdle() {
    if (idleState.clockInterval) {
        clearInterval(idleState.clockInterval);
    }

    idleState.clockInterval = setInterval(() => {
        actualizarRelojVisualIdle();
        refrescarEstadoIdleSilencioso(false);
    }, 1000);
}

async function refrescarEstadoIdleSilencioso(forzar = false) {
    if (!getAccessToken()) return null;
    if (idleState.syncInProgress) return null;

    const nowMs = Date.now();
    if (!forzar && (nowMs - idleState.lastSyncMs) < 45000) {
        return null;
    }

    idleState.syncInProgress = true;
    if (!forzar) idleState.lastSyncMs = nowMs;

    try {
        return await cargarEstadoIdle(true);
    } catch (error) {
        console.warn("No se pudo refrescar Idle en segundo plano:", error);
        return null;
    } finally {
        idleState.syncInProgress = false;
    }
}

async function cargarEstadoIdle(silent = true) {
    if (!getAccessToken()) {
        registrarEstadoIdle(null);
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        return null;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/estado`);
        registrarEstadoIdle(data || null);
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTierCardsIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        return data;
    } catch (error) {
        if (!silent) {
            setFeedbackIdle(error?.message || tIdle("battle_idle_load_error", "The Idle Expedition state could not be loaded."), "error");
        }
        registrarEstadoIdle({ ok: false, activa: false, sesion: null, error: error?.message || "error" });
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTierCardsIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        return null;
    }
}

async function iniciarIdlePage() {
    setFeedbackIdle("");

    if (!getAccessToken()) {
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_login_title", "Login required"),
            message: tIdle("battle_mode_requires_login", "You must sign in first.")
        });
        renderStatusIdle();
        return;
    }

    if (obtenerIdsEquipoIdle().length !== 6) {
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_team_title", "Incomplete team"),
            message: tIdle("battle_need_six", "You need 6 Pokémon in your team.")
        });
        renderStatusIdle();
        return;
    }

    if (idleState.idleData?.sesion && ["activa", "reclamable"].includes(String(idleState.idleData.sesion.estado || "").toLowerCase())) {
        showIdleNoticeModal({
            type: "info",
            title: tIdle("idle_modal_active_title", "Idle Expedition already in progress"),
            html: buildIdleActiveModalHtml(idleState.idleData?.sesion || {})
        });
        return;
    }

    const tierCodigo = normalizarTierIdle(document.getElementById("idleTierSelect")?.value || idleState.selectedTier);
    const duracionSegundos = normalizarDuracionIdle(document.getElementById("idleDurationSelect")?.value || idleState.selectedDuration);

    const gate = getIdleTierUnlockState(tierCodigo);
    if (gate.locked) {
        if (tierCodigo === "masters") {
            await abrirModalPremiumIdle({ source: "start_button" });
        } else {
            showIdleNoticeModal({
                type: "warning",
                title: tIdle("idle_modal_requirement_title", "Tier requirement not met"),
                message: gate.requirementText
            });
        }

        renderStatusIdle();
        return;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/iniciar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tier_codigo: tierCodigo,
                duracion_segundos: duracionSegundos,
                usuario_pokemon_ids: obtenerIdsEquipoIdle(),
                guardar_equipo: true
            })
        });

        if (!data?.ok || !data?.idle_session_token) {
            throw new Error(data?.mensaje || tIdle("battle_idle_start_error", "The Idle Expedition could not be started."));
        }

        sessionStorage.setItem(IDLE_SESSION_STORAGE_KEY, String(data.idle_session_token));
        clearIdleCompletionAlert();
        await cargarEstadoIdle(true);
        showIdleNoticeModal({
            type: "success",
            title: tIdle("idle_modal_started_title", "Expedition launched"),
            html: buildIdleLaunchModalHtml({
                tierCodigo,
                duracionSegundos,
                teamCount: obtenerIdsEquipoIdle().length
            })
        });
    } catch (error) {
        console.error("No se pudo iniciar Idle Expedition:", error);
        showIdleNoticeModal({
            type: "error",
            title: tIdle("idle_modal_start_error_title", "Could not start the expedition"),
            message: error?.message || tIdle("battle_idle_start_error", "The Idle Expedition could not be started.")
        });
    }
}

async function reclamarIdlePage() {
    setFeedbackIdle("");

    if (!getAccessToken()) {
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_login_title", "Login required"),
            message: tIdle("battle_mode_requires_login", "You must sign in first.")
        });
        return;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/reclamar`, { method: "POST" });
        if (!data?.ok) {
            throw new Error(data?.mensaje || tIdle("battle_idle_claim_error", "Idle rewards could not be claimed."));
        }

        if (typeof data?.pokedolares_actuales !== "undefined") {
            localStorage.setItem("usuario_pokedolares", String(data.pokedolares_actuales));
        }

        sessionStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
        clearIdleCompletionAlert();
        persistirResultadoAnteriorIdle(data?.resultado || null);
        renderLastResultIdle();
        await cargarEstadoIdle(true);

        const resultado = data?.resultado || {};
        showIdleNoticeModal({
            type: "success",
            title: tIdle("idle_modal_claim_title", "Rewards claimed successfully"),
            html: buildIdleClaimModalHtml(resultado),
            confirmText: tIdle("idle_modal_confirm", "OK")
        });
    } catch (error) {
        console.error("No se pudo reclamar Idle:", error);
        showIdleNoticeModal({
            type: "error",
            title: tIdle("idle_modal_claim_error_title", "Could not claim rewards"),
            message: error?.message || tIdle("battle_idle_claim_error", "Idle rewards could not be claimed.")
        });
    }
}

async function cancelarIdlePage() {
    setFeedbackIdle("");

    if (!getAccessToken()) {
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_login_title", "Login required"),
            message: tIdle("battle_mode_requires_login", "You must sign in first.")
        });
        return;
    }

    const currentToken = idleState.idleData?.sesion?.token || sessionStorage.getItem(IDLE_SESSION_STORAGE_KEY) || "";
    if (!currentToken) {
        showIdleNoticeModal({
            type: "info",
            title: tIdle("idle_modal_no_session_title", "No active expedition"),
            message: tIdle("idle_no_active_session", "There is no active Idle Expedition.")
        });
        return;
    }

    const confirmed = window.confirm(tIdle("battle_idle_cancel_confirm", "Your current Idle Expedition will be cancelled and no rewards will be granted."));
    if (!confirmed) return;

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/cancelar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idle_session_token: currentToken })
        });

        if (!data?.ok) {
            throw new Error(data?.mensaje || tIdle("battle_idle_cancel_error", "The Idle Expedition could not be cancelled."));
        }

        sessionStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
        clearIdleCompletionAlert();
        await cargarEstadoIdle(true);
        showIdleNoticeModal({
            type: "warning",
            title: tIdle("idle_modal_cancel_title", "Expedition cancelled"),
            html: `
                <div class="idle-modal-launch-shell">
                    <div class="idle-modal-launch-banner idle-modal-launch-banner-warning">
                        <span class="idle-modal-inline-pill">${escapeHtmlIdle(tIdle("idle_modal_cancel_badge", "Run cancelled"))}</span>
                        <strong>${escapeHtmlIdle(tIdle("idle_modal_cancel_title", "Expedition cancelled"))}</strong>
                        <p>${escapeHtmlIdle(tIdle("battle_idle_cancelled", "Idle Expedition cancelled."))}</p>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error("No se pudo cancelar Idle:", error);
        showIdleNoticeModal({
            type: "error",
            title: tIdle("idle_modal_cancel_error_title", "Could not cancel the expedition"),
            message: error?.message || tIdle("battle_idle_cancel_error", "The Idle Expedition could not be cancelled.")
        });
    }
}