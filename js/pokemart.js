const TIENDA_CACHE_KEY = "mastersmon_tienda_items_cache";
const TIENDA_USER_CACHE_KEY = "mastersmon_tienda_user_cache";
const TIENDA_INV_CACHE_KEY = "mastersmon_tienda_inv_cache";
const POKEMART_VIEW_KEY = "mastersmon_pokemart_view_v2";
const POKEMART_HISTORY_TAB_KEY = "mastersmon_pokemart_history_tab_v1";

let tiendaItemsGlobal = [];
let inventarioUsuarioGlobal = [];
let saldoUsuarioGlobal = 0;
let usuarioTiendaGlobal = null;
let tiendaRenderizada = false;
let premiumProductosGlobal = [];
let premiumBeneficiosGlobal = [];
let premiumComprasGlobal = [];
let premiumProductoSeleccionado = null;
let pokemartVistaActiva = "items";
let pokemartHistoryTabActiva = "purchases";

const cantidadesSeleccionadas = {};
const ITEMS_OCULTOS_TEMPORALES = ["Master Ball"];
const ITEMS_PREMIUM_SOLO_CODES = ["booster_battle_exp_x2_24h", "booster_battle_gold_x2_24h"];
const ITEMS_PREMIUM_SOLO_NOMBRES = ["Booster Battle EXP x2 24h", "Booster Battle GOLD x2 24h"];
const SHOP_SECTION_ORDER = ["captura", "curacion", "evolucion", "otros"];
const ITEM_SORT_ORDER = {
    "Poke Ball": 10,
    "Super Ball": 20,
    "Great Ball": 20,
    "Ultra Ball": 30,
    "Master Ball": 40,
    "Pocion": 110,
    "Super Pocion": 120,
    "Potion": 110,
    "Super Potion": 120,
    "Piedra Agua": 210,
    "Water Stone": 210,
    "Piedra Hoja": 220,
    "Leaf Stone": 220,
    "Piedra Fuego": 230,
    "Fire Stone": 230,
    "Piedra Trueno": 240,
    "Thunder Stone": 240,
    "Piedra Lunar": 250,
    "Moon Stone": 250
};

const POKEMART_AUTH_GATE_COPY = {
    es: {
        title: "Inicia sesión para entrar a PokeMart",
        text: "Ocultamos los items, el premium shop y el historial hasta que el usuario se autentique con Google.",
        button: "Ir al login",
        badge: "🔒 Acceso requerido",
        points: [
            "Catálogo normal bloqueado hasta iniciar sesión.",
            "Premium Shop e historial ocultos sin sesión activa.",
            "Tus compras y saldo solo cargan para tu cuenta."
        ]
    },
    en: {
        title: "Sign in to access PokeMart",
        text: "Items, premium products and account history stay hidden until the user signs in with Google.",
        button: "Go to login",
        badge: "🔒 Login required",
        points: [
            "The standard store stays hidden until you sign in.",
            "Premium Shop and history remain hidden without an active session.",
            "Your balance and purchases load only for your account."
        ]
    }
};

const PM_UI = {
    es: {
        view_items: "🛍️ Items",
        view_premium: "💎 Premium",
        view_history: "📜 Historial",
        items_kicker: "Tienda estándar",
        items_title: "Compra items sin salir de la página",
        items_subtitle: "Elige cantidad, revisa el total y compra al instante con Pokédólares.",
        history_kicker: "Historial de cuenta",
        history_title: "Compras y beneficios activos",
        history_subtitle: "Revisa tus compras recientes y los beneficios premium actualmente vinculados a tu cuenta.",
        history_purchases: "Compras",
        history_benefits: "Beneficios activos",
        total_label: "Total",
        purchase_total_message: "Total pagado: {total} Pokédólares",
        soft_history_error: "No se pudo cargar el historial premium en este momento.",
        no_purchases: "Todavía no tienes compras premium registradas.",
        no_benefits: "No tienes beneficios premium activos por ahora.",
        status_paid: "Pagado",
        status_pending: "Pendiente",
        status_delivered: "Entregado",
        status_active: "Activo",
        status_expired: "Expirado",
        status_unknown: "Sin estado",
        purchased_at: "Fecha",
        amount: "Monto",
        delivery: "Entrega",
        expires: "Expira",
        uses_left: "Usos restantes",
        grant_status: "Estado de entrega",
        product: "Producto",
        benefit: "Beneficio",
        account_history_badge_purchases: "Compras: {count}",
        account_history_badge_benefits: "Activos: {count}",
        quantity_placeholder: "Ej. 3",
        section_capture: "Captura primero",
        section_capture_desc: "Poké Balls y bolas de mejor ratio arriba para comprarlas más rápido.",
        section_healing: "Curación rápida",
        section_healing_desc: "Pociones y consumibles de soporte agrupados para reabastecerte en segundos.",
        section_evolution: "Evolución ordenada",
        section_evolution_desc: "Piedras agrupadas para encontrar la correcta sin recorrer toda la tienda.",
        section_other: "Otros objetos",
        section_other_desc: "Objetos fuera de las categorías principales.",
        premium_error_soft: "El catálogo premium no se pudo cargar completamente. Puedes intentar de nuevo más tarde.",
        premium_history_login: "Inicia sesión para ver tu historial premium."
    },
    en: {
        view_items: "🛍️ Items",
        view_premium: "💎 Premium",
        view_history: "📜 History",
        items_kicker: "Standard shop",
        items_title: "Buy items without leaving the page",
        items_subtitle: "Choose quantity, review the total, and buy instantly with Pokédollars.",
        history_kicker: "Account history",
        history_title: "Purchases and active benefits",
        history_subtitle: "Review your recent premium purchases and the premium benefits currently linked to your account.",
        history_purchases: "Purchases",
        history_benefits: "Active benefits",
        total_label: "Total",
        purchase_total_message: "Total paid: {total} Pokédollars",
        soft_history_error: "The premium history could not be loaded right now.",
        no_purchases: "You do not have premium purchases yet.",
        no_benefits: "You do not have active premium benefits right now.",
        status_paid: "Paid",
        status_pending: "Pending",
        status_delivered: "Delivered",
        status_active: "Active",
        status_expired: "Expired",
        status_unknown: "No status",
        purchased_at: "Date",
        amount: "Amount",
        delivery: "Delivery",
        expires: "Expires",
        uses_left: "Remaining uses",
        grant_status: "Delivery status",
        product: "Product",
        benefit: "Benefit",
        account_history_badge_purchases: "Purchases: {count}",
        account_history_badge_benefits: "Active: {count}",
        quantity_placeholder: "e.g. 3",
        section_capture: "Capture first",
        section_capture_desc: "Poké Balls and better-rate balls stay at the top for faster purchases.",
        section_healing: "Quick healing",
        section_healing_desc: "Potions and support consumables grouped together for quick restocking.",
        section_evolution: "Evolution stones",
        section_evolution_desc: "Stones grouped together so you can find the right one fast.",
        section_other: "Other items",
        section_other_desc: "Items outside the main categories.",
        premium_error_soft: "The premium catalog could not be fully loaded. Please try again later.",
        premium_history_login: "Sign in to view your premium history."
    }
};

const PREMIUM_SUPPORTED_CODES = ["idle_masters_1m", "battle_exp_x2_pack5", "battle_gold_x2_pack5"];
const PREMIUM_COMING_SOON_CODES = ["map_exclusive_rate_1y", "exclusive_pokemon_single", "battle_pass_s1"];
const PREMIUM_PRODUCT_META = {
    idle_masters_1m: { icon: "👑", titleKey: "pokemart_premium_idle_title", descKey: "pokemart_premium_idle_desc", tagKey: "pokemart_premium_tag_subscription", deliveryKey: "pokemart_premium_delivery_benefit", activeBenefitCode: "idle_masters" },
    battle_exp_x2_pack5: { icon: "⚔️", titleKey: "pokemart_premium_exp_title", descKey: "pokemart_premium_exp_desc", tagKey: "pokemart_premium_tag_booster_pack", deliveryKey: "pokemart_premium_delivery_items" },
    battle_gold_x2_pack5: { icon: "💰", titleKey: "pokemart_premium_gold_title", descKey: "pokemart_premium_gold_desc", tagKey: "pokemart_premium_tag_booster_pack", deliveryKey: "pokemart_premium_delivery_items" },
    map_exclusive_rate_1y: { icon: "🗺️", titleKey: "pokemart_premium_maps_title", descKey: "pokemart_premium_maps_desc", tagKey: "pokemart_premium_tag_coming_soon" },
    exclusive_pokemon_single: { icon: "✨", titleKey: "pokemart_premium_exclusive_title", descKey: "pokemart_premium_exclusive_desc", tagKey: "pokemart_premium_tag_coming_soon" },
    battle_pass_s1: { icon: "🎟️", titleKey: "pokemart_premium_pass_title", descKey: "pokemart_premium_pass_desc", tagKey: "pokemart_premium_tag_coming_soon" }
};

function getPokeMartLang() {
    try {
        return typeof getCurrentLang === "function" && getCurrentLang() === "es" ? "es" : "en";
    } catch (_) {
        return "en";
    }
}

function pmUi(key, params = {}) {
    const lang = getPokeMartLang();
    const template = (PM_UI[lang] && PM_UI[lang][key]) || PM_UI.en[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");
}

function usuarioAutenticadoTienda() {
    return !!(typeof getAccessToken === "function" && getAccessToken());
}

function leerCacheTienda() {
    try {
        const raw = sessionStorage.getItem(TIENDA_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (_) { return null; }
}

function guardarCacheTienda(items = []) {
    try { sessionStorage.setItem(TIENDA_CACHE_KEY, JSON.stringify(items)); } catch (_) {}
}

function leerCacheUsuarioTienda() {
    try {
        return {
            usuario: JSON.parse(sessionStorage.getItem(TIENDA_USER_CACHE_KEY) || "null"),
            inventario: JSON.parse(sessionStorage.getItem(TIENDA_INV_CACHE_KEY) || "null")
        };
    } catch (_) {
        return { usuario: null, inventario: null };
    }
}

function guardarCacheDatosUsuarioTienda() {
    try {
        sessionStorage.setItem(TIENDA_USER_CACHE_KEY, JSON.stringify({ usuario: usuarioTiendaGlobal, pokedolares: saldoUsuarioGlobal }));
        sessionStorage.setItem(TIENDA_INV_CACHE_KEY, JSON.stringify(inventarioUsuarioGlobal));
    } catch (_) {}
}

function limpiarCacheUsuarioTienda() {
    try {
        sessionStorage.removeItem(TIENDA_USER_CACHE_KEY);
        sessionStorage.removeItem(TIENDA_INV_CACHE_KEY);
    } catch (_) {}
}

function limpiarEstadoUsuarioTiendaEnMemoria() {
    usuarioTiendaGlobal = null;
    inventarioUsuarioGlobal = [];
    saldoUsuarioGlobal = 0;
    premiumBeneficiosGlobal = [];
    premiumComprasGlobal = [];
    limpiarCacheUsuarioTienda();
}

function obtenerCopyAuthGatePokeMart() {
    return getPokeMartLang() === "es" ? POKEMART_AUTH_GATE_COPY.es : POKEMART_AUTH_GATE_COPY.en;
}

function renderizarAuthGatePokeMart() {
    const gate = document.getElementById("pokemartAuthGate");
    if (!gate) return;
    const copy = obtenerCopyAuthGatePokeMart();
    const badge = gate.querySelector(".pokemart-auth-badge");
    if (badge) badge.textContent = copy.badge;
    const title = document.getElementById("pokemartAuthGateTitle");
    if (title) title.textContent = copy.title;
    const text = document.getElementById("pokemartAuthGateText");
    if (text) text.textContent = copy.text;
    const btn = document.getElementById("pokemartGoToLoginBtn");
    if (btn) btn.textContent = copy.button;
    const points = document.getElementById("pokemartAuthGatePoints");
    if (points) points.innerHTML = copy.points.map(item => `<div class="pokemart-auth-point">${item}</div>`).join("");
}

function scrollToPokeMartLogin() {
    const target = document.getElementById("loginMenuContainer") || document.querySelector(".menu-auth-area") || document.querySelector(".menu-topbar");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function configurarIdiomaPokeMart() {
    const desktop = document.getElementById("languageSelect");
    const mobile = document.getElementById("languageSelectMobile");
    const current = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
    if (desktop) desktop.value = current;
    if (mobile) mobile.value = current;
    if (desktop) desktop.addEventListener("change", e => { if (mobile) mobile.value = e.target.value; setCurrentLang(e.target.value); });
    if (mobile) mobile.addEventListener("change", e => { if (desktop) desktop.value = e.target.value; setCurrentLang(e.target.value); });
}

function formatMoneyNumber(value = 0) {
    try {
        return new Intl.NumberFormat(getPokeMartLang() === "es" ? "es-PE" : "en-US").format(Number(value || 0));
    } catch (_) {
        return String(Number(value || 0));
    }
}

function formatearFechaPremium(valor) {
    if (!valor) return typeof t === "function" ? t("pokemart_premium_date_unknown") : "Not available";
    try {
        return new Intl.DateTimeFormat(getPokeMartLang() === "es" ? "es-PE" : "en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        }).format(new Date(valor));
    } catch (_) {
        return valor;
    }
}

function captureFocusState() {
    const active = document.activeElement;
    if (!active || !active.id || !active.id.startsWith("cantidad-item-")) return null;
    return {
        id: active.id,
        start: typeof active.selectionStart === "number" ? active.selectionStart : null,
        end: typeof active.selectionEnd === "number" ? active.selectionEnd : null
    };
}

function restoreFocusState(state) {
    if (!state || !state.id) return;
    const input = document.getElementById(state.id);
    if (!input) return;
    input.focus({ preventScroll: true });
    if (typeof state.start === "number" && typeof state.end === "number") {
        try { input.setSelectionRange(state.start, state.end); } catch (_) {}
    }
}

function getStoredView() {
    try {
        const v = sessionStorage.getItem(POKEMART_VIEW_KEY);
        return ["items", "premium", "history"].includes(v) ? v : "items";
    } catch (_) { return "items"; }
}

function guardarVistaPokeMart(view) {
    pokemartVistaActiva = ["items", "premium", "history"].includes(view) ? view : "items";
    try { sessionStorage.setItem(POKEMART_VIEW_KEY, pokemartVistaActiva); } catch (_) {}
    document.querySelectorAll("[data-pokemart-view]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.pokemartView === pokemartVistaActiva);
    });
    document.querySelectorAll("[data-pokemart-panel]").forEach(panel => {
        panel.classList.toggle("oculto", panel.dataset.pokemartPanel !== pokemartVistaActiva);
    });
}

function actualizarTextosVistaPokeMart() {
    const texts = {
        pokemartViewBtnItems: pmUi("view_items"),
        pokemartViewBtnPremium: pmUi("view_premium"),
        pokemartViewBtnHistory: pmUi("view_history"),
        pokemartItemsKicker: pmUi("items_kicker"),
        pokemartItemsTitle: pmUi("items_title"),
        pokemartItemsSubtitle: pmUi("items_subtitle"),
        premiumHistoryKicker: pmUi("history_kicker"),
        premiumHistoryTitle: pmUi("history_title"),
        premiumHistorySubtitle: pmUi("history_subtitle"),
        premiumHistoryTabPurchases: pmUi("history_purchases"),
        premiumHistoryTabBenefits: pmUi("history_benefits")
    };
    Object.entries(texts).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function obtenerCategoriaItemBase(item = {}) {
    const tipo = String(item?.tipo || "").toLowerCase().trim();
    if (tipo === "captura") return "captura";
    if (tipo === "curacion" || tipo === "curación") return "curacion";
    if (tipo === "evolucion" || tipo === "evolución") return "evolucion";
    return "otros";
}

function obtenerPesoOrdenItem(item = {}) {
    return ITEM_SORT_ORDER[String(item?.nombre || "").trim()] ?? 999;
}

function esItemPremiumSolo(item = {}) {
    const codigo = String(item?.codigo || "").trim().toLowerCase();
    const nombre = String(item?.nombre || "").trim().toLowerCase();
    const tipo = String(item?.tipo || "").trim().toLowerCase();
    if (ITEMS_PREMIUM_SOLO_CODES.includes(codigo)) return true;
    if (ITEMS_PREMIUM_SOLO_NOMBRES.map(v => v.toLowerCase()).includes(nombre)) return true;
    if (tipo === "booster") return true;
    if (codigo.startsWith("booster_")) return true;
    return nombre.includes("booster battle");
}

function filtrarItemsTiendaPublica(items = []) {
    return Array.isArray(items) ? items.filter(item => !ITEMS_OCULTOS_TEMPORALES.includes(item.nombre) && !esItemPremiumSolo(item)) : [];
}

function traducirNombreItemTienda(nombre = "") {
    const mapa = {
        "Poke Ball": "item_poke_ball",
        "Super Ball": "item_super_ball",
        "Ultra Ball": "item_ultra_ball",
        "Master Ball": "item_master_ball",
        "Pocion": "item_potion",
        "Super Pocion": "item_super_potion",
        "Piedra Fuego": "item_fire_stone",
        "Piedra Agua": "item_water_stone",
        "Piedra Trueno": "item_thunder_stone",
        "Piedra Hoja": "item_leaf_stone",
        "Piedra Lunar": "item_moon_stone"
    };
    const key = mapa[nombre];
    return key && typeof t === "function" ? t(key) : nombre;
}

function traducirDescripcionItemTienda(nombre = "", descripcion = "") {
    const mapa = {
        "Poke Ball": "pokemart_desc_poke_ball",
        "Super Ball": "pokemart_desc_super_ball",
        "Ultra Ball": "pokemart_desc_ultra_ball",
        "Master Ball": "pokemart_desc_master_ball",
        "Pocion": "pokemart_desc_potion",
        "Super Pocion": "pokemart_desc_super_potion",
        "Piedra Fuego": "pokemart_desc_fire_stone",
        "Piedra Agua": "pokemart_desc_water_stone",
        "Piedra Trueno": "pokemart_desc_thunder_stone",
        "Piedra Hoja": "pokemart_desc_leaf_stone",
        "Piedra Lunar": "pokemart_desc_moon_stone"
    };
    const key = mapa[nombre];
    return key && typeof t === "function" ? t(key) : descripcion;
}

function traducirTipoItemTienda(tipo = "") {
    const value = String(tipo || "").toLowerCase();
    const mapa = {
        captura: "pokemart_type_capture",
        curacion: "pokemart_type_healing",
        "curación": "pokemart_type_healing",
        evolucion: "pokemart_type_evolution",
        "evolución": "pokemart_type_evolution"
    };
    const key = mapa[value];
    return key && typeof t === "function" ? t(key) : tipo;
}

function obtenerImagenItem(nombre) {
    const imagenes = {
        "Poke Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
        "Super Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
        "Ultra Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
        "Master Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
        "Pocion": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png",
        "Super Pocion": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png",
        "Piedra Fuego": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png",
        "Piedra Agua": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png",
        "Piedra Trueno": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png",
        "Piedra Hoja": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png",
        "Piedra Lunar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png"
    };
    return imagenes[nombre] || imagenes["Poke Ball"];
}

function obtenerClaseTipo(tipo = "") {
    const value = String(tipo).toLowerCase();
    if (value.includes("capt")) return "tipo-item captura";
    if (value.includes("cur")) return "tipo-item curacion";
    if (value.includes("evol")) return "tipo-item evolucion";
    return "tipo-item";
}

function tituloSeccionCategoria(categoria) {
    if (categoria === "captura") return pmUi("section_capture");
    if (categoria === "curacion") return pmUi("section_healing");
    if (categoria === "evolucion") return pmUi("section_evolution");
    return pmUi("section_other");
}

function subtituloSeccionCategoria(categoria) {
    if (categoria === "captura") return pmUi("section_capture_desc");
    if (categoria === "curacion") return pmUi("section_healing_desc");
    if (categoria === "evolucion") return pmUi("section_evolution_desc");
    return pmUi("section_other_desc");
}

function renderizarSaldo() {
    const saldoBox = document.getElementById("saldoUsuario");
    if (!saldoBox) return;
    if (!usuarioAutenticadoTienda()) {
        saldoBox.innerHTML = `
            <div class="saldo-box login">
                <span class="saldo-side-icon locked">🔒</span>
                <div>
                    <p class="saldo-label">${typeof t === "function" ? t("pokemart_login_required") : "Login required"}</p>
                    <h3>${typeof t === "function" ? t("pokemart_login_to_buy") : "Login to buy"}</h3>
                </div>
            </div>`;
        return;
    }
    saldoBox.innerHTML = `
        <div class="saldo-box classic">
            <p class="saldo-label">${typeof t === "function" ? t("pokemart_balance_label") : "Balance"}</p>
            <div class="saldo-value-row">
                <span class="saldo-icono">💰</span>
                <h3>${formatMoneyNumber(saldoUsuarioGlobal)}</h3>
            </div>
        </div>`;
}

function computeItemTotal(itemId) {
    const item = tiendaItemsGlobal.find(i => Number(i.id) === Number(itemId));
    const cantidad = Math.max(1, Number(cantidadesSeleccionadas[itemId] || 1));
    return Number(item?.precio || 0) * cantidad;
}

function renderizarCardItemHTML(item, estaLogueado) {
    const categoria = obtenerCategoriaItemBase(item);
    const itemUsuario = inventarioUsuarioGlobal.find(i => Number(i.item_id) === Number(item.id));
    const cantidadActual = Number(itemUsuario?.cantidad || 0);
    const cantidadInput = Math.max(1, Number(cantidadesSeleccionadas[item.id] || 1));
    const total = Number(item.precio || 0) * cantidadInput;
    return `
        <article class="item-card item-card-${categoria}" data-item-id="${item.id}">
            <div class="item-card-top">
                <img class="item-imagen" src="${obtenerImagenItem(item.nombre)}" alt="${traducirNombreItemTienda(item.nombre)}" loading="lazy" decoding="async">
                <div class="item-card-top-right"><span class="${obtenerClaseTipo(item.tipo)}">${traducirTipoItemTienda(item.tipo)}</span></div>
            </div>
            <h3>${traducirNombreItemTienda(item.nombre)}</h3>
            <p class="item-descripcion">${traducirDescripcionItemTienda(item.nombre, item.descripcion || "")}</p>
            <div class="item-card-inline-stats">
                <div class="item-stock">${typeof t === "function" ? t("pokemart_you_have") : "You have"}: x${formatMoneyNumber(cantidadActual)}</div>
                <div class="item-info compact"><span>${typeof t === "function" ? t("pokemart_price") : "Price"}</span><strong>${formatMoneyNumber(item.precio)}</strong></div>
            </div>
            <div class="item-buy-row">
                <div class="item-buy-side">
                    <div class="cantidad-compra-box">
                        <label for="cantidad-item-${item.id}">${typeof t === "function" ? t("pokemart_quantity") : "Quantity"}</label>
                        <input type="text" inputmode="numeric" pattern="[0-9]*" id="cantidad-item-${item.id}" value="${cantidadInput}" placeholder="${pmUi("quantity_placeholder")}" ${estaLogueado ? "" : "disabled"}>
                    </div>
                    <div class="item-total-line"><span>${pmUi("total_label")}</span><strong id="item-total-${item.id}">${formatMoneyNumber(total)}</strong></div>
                </div>
                <button class="btn-comprar-item" data-item-id="${item.id}" ${estaLogueado ? "" : "disabled"}>${estaLogueado ? (typeof t === "function" ? t("pokemart_buy") : "Buy") : (typeof t === "function" ? t("pokemart_login_button") : "Login")}</button>
            </div>
        </article>`;
}

function renderizarTienda() {
    const tienda = document.getElementById("tiendaItems");
    if (!tienda) return;
    const focusState = captureFocusState();

    if (!tiendaItemsGlobal.length) {
        tienda.innerHTML = `<div class="empty-box">${typeof t === "function" ? t("pokemart_no_items") : "No items available"}</div>`;
        return;
    }

    const visibles = filtrarItemsTiendaPublica(tiendaItemsGlobal).sort((a, b) => {
        const categoriaA = SHOP_SECTION_ORDER.indexOf(obtenerCategoriaItemBase(a));
        const categoriaB = SHOP_SECTION_ORDER.indexOf(obtenerCategoriaItemBase(b));
        if (categoriaA !== categoriaB) return categoriaA - categoriaB;
        const pesoA = obtenerPesoOrdenItem(a);
        const pesoB = obtenerPesoOrdenItem(b);
        if (pesoA !== pesoB) return pesoA - pesoB;
        return String(a?.nombre || "").localeCompare(String(b?.nombre || ""));
    });

    const grouped = {};
    visibles.forEach(item => {
        const categoria = obtenerCategoriaItemBase(item);
        grouped[categoria] = grouped[categoria] || [];
        grouped[categoria].push(item);
        if (!(item.id in cantidadesSeleccionadas)) cantidadesSeleccionadas[item.id] = 1;
    });

    tienda.innerHTML = SHOP_SECTION_ORDER.filter(cat => Array.isArray(grouped[cat]) && grouped[cat].length).map(cat => `
        <section class="pokemart-category-section" id="pokemart-cat-${cat}">
            <div class="pokemart-category-head">
                <div class="pokemart-category-copy">
                    <h4>${tituloSeccionCategoria(cat)}</h4>
                    <p>${subtituloSeccionCategoria(cat)}</p>
                </div>
                <span class="pokemart-category-chip">${grouped[cat].length} ${cat.toUpperCase()}</span>
            </div>
            <div class="pokemart-classic-grid">${grouped[cat].map(item => renderizarCardItemHTML(item, usuarioAutenticadoTienda())).join("")}</div>
        </section>
    `).join("");

    tiendaRenderizada = true;
    restoreFocusState(focusState);
}

function sanitizeQuantityValue(value) {
    const digits = String(value || "").replace(/\D+/g, "");
    const parsed = Number(digits || 1);
    return Math.max(1, parsed);
}

function actualizarTotalCard(itemId) {
    const totalEl = document.getElementById(`item-total-${itemId}`);
    if (totalEl) totalEl.textContent = formatMoneyNumber(computeItemTotal(itemId));
}

function setBotonComprando(itemId, comprando) {
    const btn = document.querySelector(`.btn-comprar-item[data-item-id="${itemId}"]`);
    if (!btn) return;
    btn.disabled = comprando;
    btn.textContent = comprando ? (typeof t === "function" ? t("pokemart_buying") : "Buying...") : (typeof t === "function" ? t("pokemart_buy") : "Buy");
}

function mostrarMensajeCompra(message = "", type = "ok") {
    const box = document.getElementById("mensajeCompra");
    if (!box) return;
    if (!message) {
        box.textContent = "";
        box.className = "mensaje-compra oculto";
        return;
    }
    box.textContent = message;
    box.className = `mensaje-compra ${type === "error" ? "error" : ""}`.trim();
}

function limpiarMensajeCompra() {
    mostrarMensajeCompra("");
}

function actualizarCardItemComprado(itemId) {
    const itemUsuario = inventarioUsuarioGlobal.find(i => Number(i.item_id) === Number(itemId));
    const cantidadActual = Number(itemUsuario?.cantidad || 0);
    const stock = document.querySelector(`.item-card[data-item-id="${itemId}"] .item-stock`);
    if (stock) stock.textContent = `${typeof t === "function" ? t("pokemart_you_have") : "You have"}: x${formatMoneyNumber(cantidadActual)}`;
    const input = document.getElementById(`cantidad-item-${itemId}`);
    if (input) input.value = String(cantidadesSeleccionadas[itemId] || 1);
    actualizarTotalCard(itemId);
    setBotonComprando(itemId, false);
}

async function cargarCatalogoTienda({ forzar = false } = {}) {
    if (!forzar && tiendaItemsGlobal.length > 0) return tiendaItemsGlobal;
    if (!forzar) {
        const cache = leerCacheTienda();
        if (cache?.length) {
            tiendaItemsGlobal = filtrarItemsTiendaPublica(cache);
            return tiendaItemsGlobal;
        }
    }
    const res = await fetch(`${API_BASE}/tienda/items`);
    if (!res.ok) throw new Error("Error al obtener items de la tienda");
    const items = await res.json();
    tiendaItemsGlobal = filtrarItemsTiendaPublica(items);
    guardarCacheTienda(tiendaItemsGlobal);
    return tiendaItemsGlobal;
}

async function cargarDatosUsuarioTienda() {
    const [usuario, inventario] = await Promise.all([
        typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : null,
        typeof obtenerItemsUsuarioActual === "function" ? obtenerItemsUsuarioActual() : []
    ]);
    if (!usuario) throw new Error("No se pudo obtener el usuario actual");
    usuarioTiendaGlobal = usuario;
    saldoUsuarioGlobal = Number(usuario?.pokedolares || 0);
    inventarioUsuarioGlobal = Array.isArray(inventario) ? inventario : [];
    guardarCacheDatosUsuarioTienda();
}

async function sincronizarDatosUsuarioTiendaSilencioso(itemId = null) {
    try {
        await cargarDatosUsuarioTienda();
        renderizarSaldo();
        if (itemId) actualizarCardItemComprado(itemId);
    } catch (error) {
        console.warn("No se pudo sincronizar tienda en segundo plano:", error);
    }
}

async function cargarTienda({ forzarCatalogo = false } = {}) {
    if (!usuarioAutenticadoTienda()) {
        limpiarEstadoUsuarioTiendaEnMemoria();
        renderizarSaldo();
        renderizarTienda();
        return;
    }

    const cacheCatalogo = leerCacheTienda();
    const cacheUsuario = leerCacheUsuarioTienda();
    if (!forzarCatalogo && cacheCatalogo?.length) {
        tiendaItemsGlobal = filtrarItemsTiendaPublica(cacheCatalogo);
        usuarioTiendaGlobal = cacheUsuario.usuario?.usuario || cacheUsuario.usuario || null;
        saldoUsuarioGlobal = Number(cacheUsuario.usuario?.pokedolares ?? cacheUsuario.usuario?.pokedolares_actual ?? 0);
        inventarioUsuarioGlobal = Array.isArray(cacheUsuario.inventario) ? cacheUsuario.inventario : [];
        renderizarSaldo();
        renderizarTienda();
    }

    try {
        await Promise.all([cargarCatalogoTienda({ forzar: forzarCatalogo }), cargarDatosUsuarioTienda()]);
        renderizarSaldo();
        renderizarTienda();
    } catch (error) {
        console.error("Error cargando tienda:", error);
        renderizarSaldo();
        renderizarTienda();
        if (!tiendaItemsGlobal.length) {
            const tienda = document.getElementById("tiendaItems");
            if (tienda) tienda.innerHTML = `<div class="empty-box">${typeof t === "function" ? t("pokemart_store_error") : "Store error"}</div>`;
        }
    }
}

async function comprarItem(itemId) {
    if (!usuarioAutenticadoTienda()) {
        mostrarMensajeCompra(typeof t === "function" ? t("pokemart_login_message") : "Login required", "error");
        return;
    }

    const usuario = usuarioTiendaGlobal || (typeof obtenerUsuarioActual === "function" ? await obtenerUsuarioActual() : null);
    const usuarioId = Number(usuario?.id || (typeof getUsuarioIdLocal === "function" ? getUsuarioIdLocal() : 0));
    if (!usuarioId) {
        mostrarMensajeCompra(typeof t === "function" ? t("pokemart_user_error") : "User error", "error");
        return;
    }

    const item = tiendaItemsGlobal.find(i => Number(i.id) === Number(itemId));
    if (!item) {
        mostrarMensajeCompra(typeof t === "function" ? t("pokemart_item_not_found") : "Item not found", "error");
        return;
    }

    const input = document.getElementById(`cantidad-item-${itemId}`);
    const cantidad = sanitizeQuantityValue(input?.value || cantidadesSeleccionadas[itemId] || 1);
    cantidadesSeleccionadas[itemId] = cantidad;
    if (input) input.value = String(cantidad);

    const total = Number(item.precio || 0) * cantidad;
    if (saldoUsuarioGlobal < total) {
        mostrarMensajeCompra(typeof t === "function" ? t("pokemart_not_enough_money") : "Not enough money", "error");
        return;
    }

    setBotonComprando(itemId, true);
    try {
        const data = await fetchAuth(`${API_BASE}/tienda/comprar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: usuarioId, item_id: Number(itemId), cantidad })
        });

        if (data?.ok === false) throw new Error(data?.mensaje || (typeof t === "function" ? t("pokemart_buy_error") : "Buy error"));

        saldoUsuarioGlobal = typeof data?.pokedolares_actual !== "undefined" ? Number(data.pokedolares_actual) : Math.max(0, saldoUsuarioGlobal - total);
        const idx = inventarioUsuarioGlobal.findIndex(i => Number(i.item_id) === Number(itemId));
        const nuevaCantidad = typeof data?.cantidad_actual !== "undefined" ? Number(data.cantidad_actual) : ((inventarioUsuarioGlobal[idx]?.cantidad || 0) + cantidad);
        if (idx >= 0) inventarioUsuarioGlobal[idx].cantidad = nuevaCantidad;
        else inventarioUsuarioGlobal.push({ item_id: Number(itemId), nombre: item.nombre, cantidad: nuevaCantidad });

        cantidadesSeleccionadas[itemId] = 1;
        guardarCacheDatosUsuarioTienda();
        renderizarSaldo();
        actualizarCardItemComprado(itemId);

        const nombreTraducido = traducirNombreItemTienda(item.nombre);
        const totalText = pmUi("purchase_total_message", { total: formatMoneyNumber(total) });
        mostrarMensajeCompra(`${data?.mensaje || `${typeof t === "function" ? t("pokemart_bought_prefix") : "You bought"} ${cantidad} x ${nombreTraducido}`}. ${totalText}`);
        sincronizarDatosUsuarioTiendaSilencioso(itemId);
    } catch (error) {
        console.error("Error comprando item:", error);
        mostrarMensajeCompra(error?.message || (typeof t === "function" ? t("pokemart_buy_error") : "Buy error"), "error");
        setBotonComprando(itemId, false);
    }
}

function setPremiumMessage(message = "", type = "ok") {
    const box = document.getElementById("premiumShopMessage");
    if (!box) return;
    if (!message) {
        box.textContent = "";
        box.className = "premium-soft-message oculto";
        return;
    }
    box.textContent = message;
    box.className = `premium-soft-message ${type === "error" ? "error" : "ok"}`;
}

function obtenerCatalogoPagosCompat() {
    return typeof obtenerCatalogoPagos === "function" ? obtenerCatalogoPagos() : fetchAuth(`${API_BASE}/payments/catalogo`);
}

function obtenerBeneficiosActivosCompat() {
    return typeof obtenerBeneficiosActivos === "function" ? obtenerBeneficiosActivos() : fetchAuth(`${API_BASE}/payments/beneficios/activos`);
}

function obtenerComprasPagosCompat() {
    return typeof obtenerComprasPagos === "function" ? obtenerComprasPagos() : fetchAuth(`${API_BASE}/payments/compras`);
}

function crearOrdenPaypalPagoCompat(productCode) {
    return typeof crearOrdenPaypalPago === "function"
        ? crearOrdenPaypalPago({ productCode, quantity: 1, confirmacionAceptada: true, versionTerminos: "v1" })
        : fetchAuth(`${API_BASE}/payments/paypal/order/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_code: productCode, quantity: 1, confirmacion_aceptada: true, version_terminos: "v1" })
        });
}

function obtenerTituloPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    return meta.titleKey && typeof t === "function" ? t(meta.titleKey) : (producto?.nombre || "Premium");
}

function obtenerDescripcionPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    if (meta.descKey && typeof t === "function") return t(meta.descKey);
    return producto?.metadata?.notes || producto?.nombre || "";
}

function obtenerTagPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    return meta.tagKey && typeof t === "function" ? t(meta.tagKey) : (typeof t === "function" ? t("pokemart_premium_tag_featured") : "Featured");
}

function obtenerIconoPremiumProducto(producto) { return PREMIUM_PRODUCT_META[producto?.codigo]?.icon || "⭐"; }

function obtenerDeliveryPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    return meta.deliveryKey && typeof t === "function" ? t(meta.deliveryKey) : (typeof t === "function" ? t("pokemart_premium_delivery_generic") : "Delivered after payment");
}

function obtenerHighlightsPremiumProducto(producto) {
    const codigo = producto?.codigo;
    const lang = getPokeMartLang();
    const map = {
        idle_masters_1m: [lang === "es" ? "+100% EXP vs Legend" : "+100% EXP vs Legend", lang === "es" ? "+100% GOLD vs Legend" : "+100% GOLD vs Legend", lang === "es" ? "Ultra Ball 12% por tick" : "Ultra Ball 12% per tick", lang === "es" ? "Master Ball 0.45% por tick" : "Master Ball 0.45% per tick"],
        battle_exp_x2_pack5: [lang === "es" ? "5 usos en inventario" : "5 charges in inventory", lang === "es" ? "x2 EXP en Battle" : "x2 EXP in Battle", lang === "es" ? "24h por uso" : "24h per use", lang === "es" ? "Activación manual" : "Manual activation"],
        battle_gold_x2_pack5: [lang === "es" ? "5 usos en inventario" : "5 charges in inventory", lang === "es" ? "x2 GOLD en Battle" : "x2 GOLD in Battle", lang === "es" ? "24h por uso" : "24h per use", lang === "es" ? "Activación manual" : "Manual activation"]
    };
    return map[codigo] || [lang === "es" ? "Próximamente" : "Coming soon"];
}

function obtenerTipoPremiumProducto(producto) {
    const tipo = String(producto?.tipo || "").toLowerCase();
    if (tipo === "suscripcion") return typeof t === "function" ? t("pokemart_premium_type_subscription") : "Subscription";
    if (tipo === "pack_item") return typeof t === "function" ? t("pokemart_premium_type_pack") : "Item pack";
    if (tipo === "battle_pass") return typeof t === "function" ? t("pokemart_premium_type_battle_pass") : "Battle pass";
    return producto?.tipo || (typeof t === "function" ? t("pokemart_premium_type_premium") : "Premium");
}

function obtenerDuracionPremiumProducto(producto) {
    if (producto?.duracion_meses) return typeof t === "function" ? t("pokemart_premium_duration_months", { count: producto.duracion_meses }) : `${producto.duracion_meses} month(s)`;
    if (producto?.duracion_dias) return typeof t === "function" ? t("pokemart_premium_duration_days", { count: producto.duracion_dias }) : `${producto.duracion_dias} day(s)`;
    if (producto?.duracion_horas) return typeof t === "function" ? t("pokemart_premium_duration_hours", { count: producto.duracion_horas }) : `${producto.duracion_horas} hour(s)`;
    return typeof t === "function" ? t("pokemart_premium_duration_instant") : "Delivered instantly";
}

function obtenerEstadoBeneficioActivo(codigoBeneficio) {
    if (!codigoBeneficio) return null;
    return premiumBeneficiosGlobal.find(b => String(b?.beneficio_codigo || "") === String(codigoBeneficio) && String(b?.estado || "") === "activo") || null;
}

function actualizarResumenPremium() {
    const countProductos = document.getElementById("premiumProductosCount");
    const countBeneficios = document.getElementById("premiumBeneficiosCount");
    const beneficiosHint = document.getElementById("premiumBeneficiosHint");
    if (countProductos) countProductos.textContent = String(premiumProductosGlobal.filter(p => PREMIUM_SUPPORTED_CODES.includes(p.codigo)).length);
    if (countBeneficios) countBeneficios.textContent = String(premiumBeneficiosGlobal.length);
    if (beneficiosHint) {
        if (!premiumBeneficiosGlobal.length) beneficiosHint.textContent = typeof t === "function" ? t("pokemart_premium_summary_no_active") : "No premium benefit is active right now.";
        else beneficiosHint.textContent = (typeof t === "function" ? t("pokemart_premium_summary_active_until", { code: premiumBeneficiosGlobal[0].beneficio_codigo, date: formatearFechaPremium(premiumBeneficiosGlobal[0].expira_en) }) : `${premiumBeneficiosGlobal[0].beneficio_codigo} · ${formatearFechaPremium(premiumBeneficiosGlobal[0].expira_en)}`);
    }
}

function renderizarPremiumCatalogo() {
    const grid = document.getElementById("premiumCatalogo");
    const loginBox = document.getElementById("premiumLoginBox");
    if (!grid) return;

    if (!usuarioAutenticadoTienda()) {
        grid.innerHTML = "";
        if (loginBox) loginBox.classList.remove("oculto");
        actualizarResumenPremium();
        return;
    }
    if (loginBox) loginBox.classList.add("oculto");

    const support = premiumProductosGlobal.filter(p => PREMIUM_SUPPORTED_CODES.includes(p.codigo));
    const coming = premiumProductosGlobal.filter(p => PREMIUM_COMING_SOON_CODES.includes(p.codigo));
    const ordered = [
        ...PREMIUM_SUPPORTED_CODES.map(code => support.find(p => p.codigo === code)).filter(Boolean),
        ...PREMIUM_COMING_SOON_CODES.map(code => coming.find(p => p.codigo === code)).filter(Boolean)
    ];

    if (!ordered.length) {
        grid.innerHTML = `<div class="empty-box">${typeof t === "function" ? t("pokemart_premium_empty_text") : "No premium products ready to display right now."}</div>`;
        actualizarResumenPremium();
        return;
    }

    grid.innerHTML = ordered.map(producto => {
        const isSupported = PREMIUM_SUPPORTED_CODES.includes(producto.codigo);
        const meta = PREMIUM_PRODUCT_META[producto.codigo] || {};
        const beneficioActivo = obtenerEstadoBeneficioActivo(meta.activeBenefitCode);
        const note = beneficioActivo
            ? (typeof t === "function" ? t("pokemart_premium_active_until", { date: formatearFechaPremium(beneficioActivo.expira_en) }) : formatearFechaPremium(beneficioActivo.expira_en))
            : isSupported
                ? (typeof t === "function" ? t("pokemart_premium_note_checkout") : "You will review the purchase before opening PayPal.")
                : (typeof t === "function" ? t("pokemart_premium_note_coming_soon") : "Coming soon");
        return `
            <article class="premium-card ${isSupported ? "" : "locked"}" data-premium-code="${producto.codigo}">
                <div class="premium-card-top">
                    <span class="premium-card-badge">${obtenerIconoPremiumProducto(producto)}</span>
                    <span class="premium-card-tag ${beneficioActivo ? "premium-chip-active" : (!isSupported ? "premium-chip-coming" : "")}">${beneficioActivo ? pmUi("status_active") : obtenerTagPremiumProducto(producto)}</span>
                </div>
                <div class="premium-card-copy">
                    <h4>${obtenerTituloPremiumProducto(producto)}</h4>
                    <p>${obtenerDescripcionPremiumProducto(producto)}</p>
                </div>
                <div class="premium-card-price-row">
                    <div class="premium-card-price"><strong>$${Number(producto.precio_usd || 0).toFixed(0)}</strong> <span>USD</span></div>
                    <span class="premium-price-type">${obtenerTipoPremiumProducto(producto)}</span>
                </div>
                <div class="premium-card-meta">
                    <span class="premium-meta-pill">⏳ ${obtenerDuracionPremiumProducto(producto)}</span>
                    <span class="premium-meta-pill">📦 ${obtenerDeliveryPremiumProducto(producto)}</span>
                </div>
                <ul class="premium-feature-list">${obtenerHighlightsPremiumProducto(producto).map(item => `<li>${item}</li>`).join("")}</ul>
                <div class="premium-card-footer">
                    <button class="premium-card-btn ${isSupported ? "" : "secondary"}" data-premium-buy="${producto.codigo}" ${isSupported ? "" : "disabled"}>${isSupported ? (typeof t === "function" ? t("pokemart_premium_buy_now") : "Buy with PayPal") : (typeof t === "function" ? t("pokemart_premium_coming_soon") : "Coming soon")}</button>
                    <p class="premium-card-note">${note}</p>
                </div>
            </article>`;
    }).join("");

    actualizarResumenPremium();
}

async function cargarPremiumShop() {
    if (!usuarioAutenticadoTienda()) {
        premiumProductosGlobal = [];
        premiumBeneficiosGlobal = [];
        renderizarPremiumCatalogo();
        return;
    }
    try {
        const [catalogoData, beneficiosData] = await Promise.all([obtenerCatalogoPagosCompat(), obtenerBeneficiosActivosCompat()]);
        premiumProductosGlobal = Array.isArray(catalogoData?.productos) ? catalogoData.productos : [];
        premiumBeneficiosGlobal = Array.isArray(beneficiosData?.beneficios) ? beneficiosData.beneficios : [];
        renderizarPremiumCatalogo();
        setPremiumMessage("");
    } catch (error) {
        console.error("Error cargando premium shop:", error);
        premiumProductosGlobal = [];
        premiumBeneficiosGlobal = [];
        renderizarPremiumCatalogo();
        setPremiumMessage(pmUi("premium_error_soft"), "error");
    }
}

function getStoredHistoryTab() {
    try {
        const value = sessionStorage.getItem(POKEMART_HISTORY_TAB_KEY);
        return ["purchases", "benefits"].includes(value) ? value : "purchases";
    } catch (_) { return "purchases"; }
}

function guardarHistoryTab(tab) {
    pokemartHistoryTabActiva = ["purchases", "benefits"].includes(tab) ? tab : "purchases";
    try { sessionStorage.setItem(POKEMART_HISTORY_TAB_KEY, pokemartHistoryTabActiva); } catch (_) {}
    document.querySelectorAll("[data-history-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.historyTab === pokemartHistoryTabActiva));
    renderizarHistorialPremium();
}

function softHistoryMessage(message = "", type = "error") {
    const box = document.getElementById("premiumHistoryMessage");
    if (!box) return;
    if (!message) {
        box.textContent = "";
        box.className = "premium-soft-message oculto";
        return;
    }
    box.textContent = message;
    box.className = `premium-soft-message ${type === "error" ? "error" : "ok"}`;
}

function mapStatusLabel(status = "") {
    const value = String(status || "").toLowerCase();
    if (value === "pagado" || value === "paid") return { text: pmUi("status_paid"), cls: "paid" };
    if (value === "pendiente" || value === "pending") return { text: pmUi("status_pending"), cls: "pending" };
    if (value === "entregado" || value === "delivered") return { text: pmUi("status_delivered"), cls: "delivered" };
    if (value === "activo" || value === "active") return { text: pmUi("status_active"), cls: "active" };
    if (value === "expirado" || value === "expired") return { text: pmUi("status_expired"), cls: "expired" };
    return { text: pmUi("status_unknown"), cls: "inactive" };
}

function renderHistoryBadges() {
    const wrap = document.getElementById("premiumHistoryBadges");
    if (!wrap) return;
    wrap.innerHTML = `
        <span class="premium-history-badge">🧾 ${pmUi("account_history_badge_purchases", { count: premiumComprasGlobal.length })}</span>
        <span class="premium-history-badge">✨ ${pmUi("account_history_badge_benefits", { count: premiumBeneficiosGlobal.length })}</span>`;
}

function renderPurchaseCard(compra = {}) {
    const status = mapStatusLabel(compra?.estado || compra?.grant_status || "");
    const grant = compra?.grant_status ? mapStatusLabel(compra.grant_status) : null;
    return `
        <article class="premium-history-card">
            <div class="premium-history-card-top">
                <div>
                    <h5>${compra?.producto_nombre || compra?.producto_codigo || pmUi("product")}</h5>
                    <p class="premium-history-card-sub">${compra?.producto_codigo || ""}</p>
                </div>
                <span class="premium-status ${status.cls}">${status.text}</span>
            </div>
            <div class="premium-history-meta">
                <div class="premium-history-meta-box"><span>${pmUi("amount")}</span><strong>${Number(compra?.monto || 0).toFixed(2)} ${compra?.moneda || "USD"}</strong></div>
                <div class="premium-history-meta-box"><span>${pmUi("purchased_at")}</span><strong>${formatearFechaPremium(compra?.pagado_en || compra?.creado_en)}</strong></div>
                <div class="premium-history-meta-box"><span>${pmUi("delivery")}</span><strong>${grant ? grant.text : (compra?.grant_status || "—")}</strong></div>
                <div class="premium-history-meta-box"><span>PayPal</span><strong>${compra?.paypal_order_id || "—"}</strong></div>
            </div>
        </article>`;
}

function renderBenefitCard(beneficio = {}) {
    const status = mapStatusLabel(beneficio?.estado || "activo");
    const usesLeft = beneficio?.usos_totales != null ? Math.max(0, Number(beneficio.usos_totales || 0) - Number(beneficio.usos_consumidos || 0)) : null;
    return `
        <article class="premium-history-card">
            <div class="premium-history-card-top">
                <div>
                    <h5>${beneficio?.beneficio_codigo || pmUi("benefit")}</h5>
                    <p class="premium-history-card-sub">${beneficio?.metadata?.producto_codigo || ""}</p>
                </div>
                <span class="premium-status ${status.cls}">${status.text}</span>
            </div>
            <div class="premium-history-meta">
                <div class="premium-history-meta-box"><span>${pmUi("expires")}</span><strong>${formatearFechaPremium(beneficio?.expira_en)}</strong></div>
                <div class="premium-history-meta-box"><span>${pmUi("uses_left")}</span><strong>${usesLeft == null ? "—" : usesLeft}</strong></div>
                <div class="premium-history-meta-box"><span>${pmUi("benefit")}</span><strong>${beneficio?.beneficio_codigo || "—"}</strong></div>
                <div class="premium-history-meta-box"><span>ID</span><strong>${beneficio?.id || "—"}</strong></div>
            </div>
        </article>`;
}

function renderizarHistorialPremium() {
    const list = document.getElementById("premiumHistoryList");
    if (!list) return;
    renderHistoryBadges();
    if (!usuarioAutenticadoTienda()) {
        list.innerHTML = `<div class="empty-box">${pmUi("premium_history_login")}</div>`;
        return;
    }
    if (pokemartHistoryTabActiva === "benefits") {
        if (!premiumBeneficiosGlobal.length) {
            list.innerHTML = `<div class="empty-box">${pmUi("no_benefits")}</div>`;
            return;
        }
        list.innerHTML = premiumBeneficiosGlobal.map(renderBenefitCard).join("");
        return;
    }
    if (!premiumComprasGlobal.length) {
        list.innerHTML = `<div class="empty-box">${pmUi("no_purchases")}</div>`;
        return;
    }
    list.innerHTML = premiumComprasGlobal.map(renderPurchaseCard).join("");
}

async function cargarHistorialPremium() {
    if (!usuarioAutenticadoTienda()) {
        premiumComprasGlobal = [];
        renderizarHistorialPremium();
        return;
    }
    try {
        const [comprasData, beneficiosData] = await Promise.all([obtenerComprasPagosCompat(), obtenerBeneficiosActivosCompat()]);
        premiumComprasGlobal = Array.isArray(comprasData?.compras) ? comprasData.compras : [];
        premiumBeneficiosGlobal = Array.isArray(beneficiosData?.beneficios) ? beneficiosData.beneficios : premiumBeneficiosGlobal;
        softHistoryMessage("");
    } catch (error) {
        console.error("Error cargando historial premium:", error);
        premiumComprasGlobal = [];
        softHistoryMessage(pmUi("soft_history_error"), "error");
    }
    renderizarHistorialPremium();
}

function abrirModalPremium(productCode) {
    if (!usuarioAutenticadoTienda()) {
        setPremiumMessage(typeof t === "function" ? t("pokemart_premium_login_text") : pmUi("premium_history_login"), "error");
        return;
    }
    const producto = premiumProductosGlobal.find(p => p.codigo === productCode);
    if (!producto) {
        setPremiumMessage(typeof t === "function" ? t("pokemart_premium_product_not_found") : "Product not found", "error");
        return;
    }
    premiumProductoSeleccionado = producto;
    const modal = document.getElementById("premiumPurchaseModal");
    const errorBox = document.getElementById("premiumModalError");
    const checkConfirm = document.getElementById("premiumModalCheckConfirm");
    const checkTerms = document.getElementById("premiumModalCheckTerms");
    document.getElementById("premiumModalProductName").textContent = obtenerTituloPremiumProducto(producto);
    document.getElementById("premiumModalPrice").textContent = `$${Number(producto.precio_usd || 0).toFixed(2)} USD`;
    document.getElementById("premiumModalType").textContent = obtenerTipoPremiumProducto(producto);
    document.getElementById("premiumModalDelivery").textContent = obtenerDeliveryPremiumProducto(producto);
    document.getElementById("premiumModalDescription").innerHTML = `<small>${typeof t === "function" ? t("pokemart_premium_modal_details") : "Details"}</small><strong>${obtenerDescripcionPremiumProducto(producto)}</strong>`;
    if (errorBox) { errorBox.classList.remove("show"); errorBox.textContent = ""; }
    if (checkConfirm) checkConfirm.checked = false;
    if (checkTerms) checkTerms.checked = false;
    if (modal) { modal.classList.add("show"); modal.setAttribute("aria-hidden", "false"); }
}

function cerrarModalPremium() {
    const modal = document.getElementById("premiumPurchaseModal");
    const errorBox = document.getElementById("premiumModalError");
    premiumProductoSeleccionado = null;
    if (errorBox) { errorBox.classList.remove("show"); errorBox.textContent = ""; }
    if (modal) { modal.classList.remove("show"); modal.setAttribute("aria-hidden", "true"); }
}

async function confirmarCompraPremium() {
    const producto = premiumProductoSeleccionado;
    const errorBox = document.getElementById("premiumModalError");
    const checkConfirm = document.getElementById("premiumModalCheckConfirm");
    const checkTerms = document.getElementById("premiumModalCheckTerms");
    const confirmBtn = document.getElementById("premiumModalConfirmBtn");
    if (!producto) return;
    if (!checkConfirm?.checked || !checkTerms?.checked) {
        if (errorBox) {
            errorBox.textContent = typeof t === "function" ? t("pokemart_premium_modal_missing_checks") : "Please confirm before continuing.";
            errorBox.classList.add("show");
        }
        return;
    }
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = typeof t === "function" ? t("pokemart_premium_redirecting") : "Redirecting...";
    }
    try {
        const data = await crearOrdenPaypalPagoCompat(producto.codigo);
        if (!data?.approval_url) throw new Error(typeof t === "function" ? t("pokemart_premium_checkout_error") : "Checkout error");
        window.location.href = data.approval_url;
    } catch (error) {
        console.error("Error creando orden premium:", error);
        if (errorBox) {
            errorBox.textContent = error?.message || (typeof t === "function" ? t("pokemart_premium_checkout_error") : "Checkout error");
            errorBox.classList.add("show");
        }
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = typeof t === "function" ? t("pokemart_premium_modal_pay") : "Continue to PayPal";
        }
    }
}

function actualizarAccesoPokeMartUI() {
    const gate = document.getElementById("pokemartAuthGate");
    const hub = document.getElementById("pokemartHub");
    const logged = usuarioAutenticadoTienda();
    renderizarAuthGatePokeMart();
    if (gate) gate.classList.toggle("oculto", logged);
    if (hub) hub.classList.toggle("oculto", !logged);
}

async function inicializarAccesoPokeMart() {
    actualizarAccesoPokeMartUI();
    actualizarTextosVistaPokeMart();
    if (!usuarioAutenticadoTienda()) {
        limpiarEstadoUsuarioTiendaEnMemoria();
        renderizarSaldo();
        renderizarTienda();
        renderizarPremiumCatalogo();
        renderizarHistorialPremium();
        setPremiumMessage("");
        softHistoryMessage("");
        return;
    }
    await Promise.all([cargarTienda(), cargarPremiumShop(), cargarHistorialPremium()]);
}

function registrarEventosPokeMart() {
    document.addEventListener("click", event => {
        const buyBtn = event.target.closest(".btn-comprar-item");
        if (buyBtn) {
            comprarItem(Number(buyBtn.dataset.itemId));
            return;
        }
        const viewBtn = event.target.closest("[data-pokemart-view]");
        if (viewBtn) {
            guardarVistaPokeMart(viewBtn.dataset.pokemartView);
            return;
        }
        const historyTab = event.target.closest("[data-history-tab]");
        if (historyTab) {
            guardarHistoryTab(historyTab.dataset.historyTab);
            return;
        }
        const premiumBtn = event.target.closest("[data-premium-buy]");
        if (premiumBtn) {
            abrirModalPremium(premiumBtn.dataset.premiumBuy);
            return;
        }
        if (event.target.id === "premiumModalCloseBtn" || event.target.id === "premiumModalCancelBtn") {
            cerrarModalPremium();
            return;
        }
        if (event.target.id === "premiumModalConfirmBtn") {
            confirmarCompraPremium();
            return;
        }
        const modal = document.getElementById("premiumPurchaseModal");
        if (modal && event.target === modal) cerrarModalPremium();
    });

    document.addEventListener("input", event => {
        const input = event.target.closest('input[id^="cantidad-item-"]');
        if (!input) return;
        const itemId = Number(input.id.replace("cantidad-item-", ""));
        cantidadesSeleccionadas[itemId] = sanitizeQuantityValue(input.value);
        actualizarTotalCard(itemId);
    });

    document.addEventListener("blur", event => {
        const input = event.target.closest('input[id^="cantidad-item-"]');
        if (!input) return;
        const itemId = Number(input.id.replace("cantidad-item-", ""));
        const clean = sanitizeQuantityValue(input.value);
        cantidadesSeleccionadas[itemId] = clean;
        input.value = String(clean);
        actualizarTotalCard(itemId);
    }, true);
}

document.addEventListener("DOMContentLoaded", async () => {
    configurarIdiomaPokeMart();
    registrarEventosPokeMart();
    const gateBtn = document.getElementById("pokemartGoToLoginBtn");
    if (gateBtn) gateBtn.addEventListener("click", scrollToPokeMartLogin);
    pokemartVistaActiva = getStoredView();
    pokemartHistoryTabActiva = getStoredHistoryTab();
    guardarVistaPokeMart(pokemartVistaActiva);
    guardarHistoryTab(pokemartHistoryTabActiva);
    await inicializarAccesoPokeMart();
});

document.addEventListener("languageChanged", () => {
    renderizarAuthGatePokeMart();
    if (typeof applyTranslations === "function") applyTranslations();
    actualizarTextosVistaPokeMart();
    renderizarSaldo();
    renderizarTienda();
    renderizarPremiumCatalogo();
    renderizarHistorialPremium();
});

document.addEventListener("usuarioSesionActualizada", async () => {
    await inicializarAccesoPokeMart();
});
