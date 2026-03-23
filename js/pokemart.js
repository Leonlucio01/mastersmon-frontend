const TIENDA_CACHE_KEY = "mastersmon_tienda_items_cache";
const TIENDA_USER_CACHE_KEY = "mastersmon_tienda_user_cache";
const TIENDA_INV_CACHE_KEY = "mastersmon_tienda_inv_cache";

let tiendaItemsGlobal = [];
let inventarioUsuarioGlobal = [];
let saldoUsuarioGlobal = 0;
let tiendaRenderizada = false;
let usuarioTiendaGlobal = null;

const cantidadesSeleccionadas = {};
const ITEMS_OCULTOS_TEMPORALES = ["Master Ball"];
const ITEMS_PREMIUM_SOLO_CODES = ["booster_battle_exp_x2_24h", "booster_battle_gold_x2_24h"];
const ITEMS_PREMIUM_SOLO_NOMBRES = ["Booster Battle EXP x2 24h", "Booster Battle GOLD x2 24h"];
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
const SHOP_SECTION_ORDER = ["captura", "curacion", "evolucion", "otros"];
const SHOP_SECTION_ICON = {
    captura: "🎯",
    curacion: "🧪",
    evolucion: "✨",
    otros: "🎒"
};
const SHOP_MICRO_COPY = {
    capture_jump: { es: "Ir a captura", en: "Jump to capture" },
    healing_jump: { es: "Ir a curación", en: "Jump to healing" },
    evolution_jump: { es: "Ir a evolución", en: "Jump to evolution" },
    other_jump: { es: "Ir a otros", en: "Jump to misc" },
    capture_title: { es: "Captura primero", en: "Capture first" },
    capture_desc: { es: "Tus Poké Balls y bolas de alto ratio siempre arriba para no perderlas visualmente.", en: "Your Poké Balls and high-rate balls stay at the top so they never get lost visually." },
    healing_title: { es: "Curación rápida", en: "Quick healing" },
    healing_desc: { es: "Pociones y consumibles de soporte en una zona separada para reabastecerte rápido.", en: "Potions and support consumables grouped together for quick restocking." },
    evolution_title: { es: "Evolución ordenada", en: "Evolution stones" },
    evolution_desc: { es: "Piedras agrupadas para encontrar la correcta sin recorrer toda la tienda.", en: "Stones grouped together so you can find the right one without scanning the whole shop." },
    other_title: { es: "Otros objetos", en: "Other items" },
    other_desc: { es: "Objetos fuera de las categorías principales.", en: "Items outside the main categories." },
    hero_title: { es: "Compra más rápido, visualiza mejor", en: "Buy faster, spot items instantly" },
    hero_desc: { es: "Reordenamos PokeMart para que las Poké Balls y consumibles clave estén primero, mientras los beneficios premium quedan compactos y explicados.", en: "PokeMart is reorganized so Poké Balls and key consumables stay first, while premium benefits remain compact and clearly explained." },
    hero_card_capture: { es: "Captura al frente", en: "Capture comes first" },
    hero_card_capture_desc: { es: "Poké Balls arriba con precio y stock claros.", en: "Poké Balls stay on top with clearer price and stock." },
    hero_card_premium: { es: "Premium claro", en: "Premium clarified" },
    hero_card_premium_desc: { es: "Cada pack explica EXP, GOLD y duración antes de pagar.", en: "Each pack explains EXP, GOLD and duration before checkout." },
    hero_card_use: { es: "Uso rápido", en: "Quick usage" },
    hero_card_use_desc: { es: "Los boosters premium se entregan al inventario, no a la tienda normal.", en: "Premium boosters go to inventory, not the normal shop." },
    capture_power_basic: { es: "Ratio base", en: "Base rate" },
    capture_power_mid: { es: "Mejor ratio", en: "Better ratio" },
    capture_power_high: { es: "Alta captura", en: "High capture" },
    healing_power: { es: "Soporte", en: "Support" },
    evolution_power: { es: "Especial", en: "Special" },
    premium_idle_feature_1: { es: "+100% EXP vs Legend", en: "+100% EXP vs Legend" },
    premium_idle_feature_2: { es: "+28% GOLD vs Legend", en: "+28% GOLD vs Legend" },
    premium_idle_feature_3: { es: "Ultra Ball 12% por tick", en: "Ultra Ball 12% per tick" },
    premium_idle_feature_4: { es: "Master Ball 0.45% por tick", en: "Master Ball 0.45% per tick" },
    premium_exp_feature_1: { es: "5 usos en inventario", en: "5 charges in inventory" },
    premium_exp_feature_2: { es: "x2 EXP en Battle", en: "x2 EXP in Battle" },
    premium_exp_feature_3: { es: "24h por uso", en: "24h per use" },
    premium_exp_feature_4: { es: "Activación manual", en: "Manual activation" },
    premium_gold_feature_1: { es: "5 usos en inventario", en: "5 charges in inventory" },
    premium_gold_feature_2: { es: "x2 GOLD en Battle", en: "x2 GOLD in Battle" },
    premium_gold_feature_3: { es: "24h por uso", en: "24h per use" },
    premium_gold_feature_4: { es: "Activación manual", en: "Manual activation" },
    premium_maps_feature_1: { es: "Rate exclusivo x1.75", en: "Exclusive rate x1.75" },
    premium_maps_feature_2: { es: "Duración 365 días", en: "365-day duration" },
    premium_maps_feature_3: { es: "Solo encuentros de mapa", en: "Map encounters only" },
    premium_maps_feature_4: { es: "Próximamente", en: "Coming soon" },
    premium_exclusive_feature_1: { es: "Compra única", en: "One-time purchase" },
    premium_exclusive_feature_2: { es: "Selección especial", en: "Special selection" },
    premium_exclusive_feature_3: { es: "Entrega directa", en: "Direct delivery" },
    premium_exclusive_feature_4: { es: "Próximamente", en: "Coming soon" },
    premium_pass_feature_1: { es: "Progresión de temporada", en: "Season progression" },
    premium_pass_feature_2: { es: "Recompensas premium", en: "Premium rewards" },
    premium_pass_feature_3: { es: "Entrega por hitos", en: "Milestone rewards" },
    premium_pass_feature_4: { es: "Próximamente", en: "Coming soon" },
    premium_benefit_active: { es: "Beneficio activo", en: "Benefit active" },
    premium_inventory_delivery: { es: "Se agrega al inventario", en: "Added to inventory" },
    premium_meter_offers: { es: "Ofertas activas", en: "Ready offers" },
    premium_meter_benefits: { es: "Beneficios activos", en: "Active benefits" },
    premium_meter_checkout: { es: "Checkout seguro", en: "Secure checkout" }
};

document.addEventListener("DOMContentLoaded", () => {
    configurarIdiomaPokeMart();
    registrarEventosPremium();
    cargarTienda();
    cargarPremiumShop();
});

document.addEventListener("languageChanged", () => {
    refrescarUIPokeMart();
    renderizarPremiumCatalogo();
});

function configurarIdiomaPokeMart() {
    const selectDesktop = document.getElementById("languageSelect");
    const selectMobile = document.getElementById("languageSelectMobile");
    const langActual = typeof getCurrentLang === "function" ? getCurrentLang() : "en";

    if (selectDesktop) selectDesktop.value = langActual;
    if (selectMobile) selectMobile.value = langActual;

    if (selectDesktop) {
        selectDesktop.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectMobile) selectMobile.value = nuevo;
            setCurrentLang(nuevo);
        });
    }

    if (selectMobile) {
        selectMobile.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectDesktop) selectDesktop.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
}

function refrescarUIPokeMart() {
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    renderizarSaldo();
    renderizarTienda();
    renderizarPremiumCatalogo();

    const mensaje = document.getElementById("mensajeCompra");
    if (mensaje && !mensaje.classList.contains("oculto")) {
        limpiarMensajeCompra();
    }
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
    return key ? t(key) : nombre;
}

function traducirTipoItemTienda(tipo = "") {
    const mapa = {
        "captura": "pokemart_type_capture",
        "curacion": "pokemart_type_healing",
        "curación": "pokemart_type_healing",
        "evolucion": "pokemart_type_evolution",
        "evolución": "pokemart_type_evolution"
    };

    const key = mapa[String(tipo || "").toLowerCase()];
    return key ? t(key) : tipo;
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

    return imagenes[nombre] || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
}

function obtenerClaseTipo(tipo) {
    switch ((tipo || "").toLowerCase()) {
        case "captura":
            return "tipo-item captura";
        case "curacion":
        case "curación":
            return "tipo-item curacion";
        case "evolucion":
        case "evolución":
            return "tipo-item evolucion";
        default:
            return "tipo-item";
    }
}

function getPokeMartLang() {
    try {
        return typeof getCurrentLang === "function" && getCurrentLang() === "es" ? "es" : "en";
    } catch (error) {
        return "en";
    }
}

function pmText(key, fallbackEs = "", fallbackEn = "") {
    const lang = getPokeMartLang();
    const entry = SHOP_MICRO_COPY[key];
    if (entry) return entry[lang] || entry.en || entry.es || key;
    return lang === "es" ? (fallbackEs || fallbackEn || key) : (fallbackEn || fallbackEs || key);
}

function obtenerCategoriaItemBase(item = {}) {
    const tipo = String(item?.tipo || "").toLowerCase().trim();
    if (tipo === "captura") return "captura";
    if (tipo === "curacion" || tipo === "curación") return "curacion";
    if (tipo === "evolucion" || tipo === "evolución") return "evolucion";
    return "otros";
}

function obtenerPesoOrdenItem(item = {}) {
    const nombre = String(item?.nombre || "").trim();
    return ITEM_SORT_ORDER[nombre] ?? 999;
}

function obtenerMicroDetalleItem(item = {}) {
    const categoria = obtenerCategoriaItemBase(item);
    if (categoria === "captura") {
        if (/ultra|master/i.test(item?.nombre || "")) return pmText("capture_power_high");
        if (/super|great/i.test(item?.nombre || "")) return pmText("capture_power_mid");
        return pmText("capture_power_basic");
    }
    if (categoria === "curacion") return pmText("healing_power");
    if (categoria === "evolucion") return pmText("evolution_power");
    return pmText("other_title");
}

function obtenerTituloSeccionTienda(categoria) {
    if (categoria === "captura") return pmText("capture_title");
    if (categoria === "curacion") return pmText("healing_title");
    if (categoria === "evolucion") return pmText("evolution_title");
    return pmText("other_title");
}

function obtenerSubtituloSeccionTienda(categoria) {
    if (categoria === "captura") return pmText("capture_desc");
    if (categoria === "curacion") return pmText("healing_desc");
    if (categoria === "evolucion") return pmText("evolution_desc");
    return pmText("other_desc");
}

function renderizarCardItemHTML(item, estaLogueado) {
    const itemUsuario = inventarioUsuarioGlobal.find(i => Number(i.item_id) === Number(item.id));
    const cantidadActual = itemUsuario ? itemUsuario.cantidad : 0;
    const cantidadInput = cantidadesSeleccionadas[item.id] || 1;
    const nombreTraducido = traducirNombreItemTienda(item.nombre);
    const tipoTraducido = traducirTipoItemTienda(item.tipo);
    const descripcionTraducida = traducirDescripcionItemTienda(item.nombre, item.descripcion || "");
    const detalleMicro = obtenerMicroDetalleItem(item);
    return `
        <div class="item-card" data-item-id="${item.id}">
            <div class="item-card-top">
                <img
                    class="item-imagen"
                    src="${obtenerImagenItem(item.nombre)}"
                    alt="${nombreTraducido}"
                    loading="lazy"
                    decoding="async"
                >
                <div class="item-card-top-right">
                    <span class="${obtenerClaseTipo(item.tipo)}">${tipoTraducido}</span>
                    <span class="item-micro-pill">${detalleMicro}</span>
                </div>
            </div>
            <h3>${nombreTraducido}</h3>
            <p class="item-descripcion">${descripcionTraducida}</p>
            <div class="item-card-inline-stats">
                <div class="item-stock">${t("pokemart_you_have")}: x${cantidadActual}</div>
                <div class="item-info compact">
                    <span>${t("pokemart_price")}</span>
                    <strong>${item.precio}</strong>
                </div>
            </div>
            <div class="cantidad-compra-box">
                <label for="cantidad-item-${item.id}">${t("pokemart_quantity")}</label>
                <input
                    type="number"
                    id="cantidad-item-${item.id}"
                    min="1"
                    value="${cantidadInput}"
                    ${estaLogueado ? "" : "disabled"}
                >
            </div>
            <button class="btn-comprar-item" data-item-id="${item.id}" ${estaLogueado ? "" : "disabled"}>
                ${estaLogueado ? t("pokemart_buy") : t("pokemart_login_button")}
            </button>
        </div>
    `;
}

function renderizarQuickNavTienda(secciones = []) {
    const nav = document.getElementById("pokemartQuickNav");
    if (!nav) return;
    nav.innerHTML = secciones.map(categoria => {
        const label = obtenerTituloSeccionTienda(categoria);
        return `<a class="pokemart-quicknav-chip" href="#shop-section-${categoria}">${SHOP_SECTION_ICON[categoria] || "🛒"} <span>${label}</span></a>`;
    }).join("");
}

function renderizarHeroResumenPokeMart() {
    const hero = document.getElementById("pokemartHeroNotes");
    if (!hero) return;
    hero.innerHTML = `
        <article class="mart-note-card accent-capture">
            <span class="mart-note-icon">🎯</span>
            <div>
                <h4>${pmText("hero_card_capture")}</h4>
                <p>${pmText("hero_card_capture_desc")}</p>
            </div>
        </article>
        <article class="mart-note-card accent-premium">
            <span class="mart-note-icon">⚡</span>
            <div>
                <h4>${pmText("hero_card_premium")}</h4>
                <p>${pmText("hero_card_premium_desc")}</p>
            </div>
        </article>
        <article class="mart-note-card accent-use">
            <span class="mart-note-icon">🎒</span>
            <div>
                <h4>${pmText("hero_card_use")}</h4>
                <p>${pmText("hero_card_use_desc")}</p>
            </div>
        </article>
    `;
}

function esItemPremiumSolo(item = {}) {
    const codigo = String(item?.codigo || "").trim().toLowerCase();
    const nombre = String(item?.nombre || "").trim().toLowerCase();
    const tipo = String(item?.tipo || "").toLowerCase().trim();

    if (ITEMS_PREMIUM_SOLO_CODES.includes(codigo)) return true;
    if (ITEMS_PREMIUM_SOLO_NOMBRES.map(v => v.toLowerCase()).includes(nombre)) return true;
    if (tipo === "booster") return true;
    if (codigo.startsWith("booster_")) return true;
    if (nombre.includes("booster battle")) return true;
    return false;
}

function filtrarItemsTiendaPublica(items = []) {
    if (!Array.isArray(items)) return [];
    return items.filter(item => !esItemPremiumSolo(item));
}

function usuarioAutenticadoTienda() {
    return !!getAccessToken();
}

function limpiarEstadoUsuarioTiendaEnMemoria() {
    usuarioTiendaGlobal = null;
    inventarioUsuarioGlobal = [];
    saldoUsuarioGlobal = 0;
    premiumProductosGlobal = [];
    premiumBeneficiosGlobal = [];
    limpiarCacheUsuarioTienda();
}

function mostrarMensajeCompra(mensaje, tipo = "ok") {
    const box = document.getElementById("mensajeCompra");
    if (!box) return;

    box.classList.remove("oculto", "mensaje-ok", "mensaje-error");
    box.classList.add(tipo === "ok" ? "mensaje-ok" : "mensaje-error");
    box.textContent = mensaje;
}

function limpiarMensajeCompra() {
    const box = document.getElementById("mensajeCompra");
    if (!box) return;

    box.textContent = "";
    box.classList.add("oculto");
    box.classList.remove("mensaje-ok", "mensaje-error");
}

function mostrarCargaTienda() {
    const tienda = document.getElementById("tiendaItems");
    const saldoBox = document.getElementById("saldoUsuario");

    if (saldoBox) {
        saldoBox.innerHTML = `
            <div class="saldo-box skeleton-saldo">
                <div class="skeleton-saldo-icon"></div>
                <div class="skeleton-saldo-text">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
    }

    if (!tienda) return;

    let html = "";
    for (let i = 0; i < 8; i++) {
        html += `
            <div class="item-card skeleton-card">
                <div class="item-card-top">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-pill"></div>
                </div>
                <div class="skeleton-title"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
    }

    tienda.innerHTML = html;
}

function guardarCacheTienda(items) {
    try {
        sessionStorage.setItem(TIENDA_CACHE_KEY, JSON.stringify(items));
    } catch (error) {
        console.warn("No se pudo guardar cache de tienda:", error);
    }
}

function leerCacheTienda() {
    try {
        const raw = sessionStorage.getItem(TIENDA_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;

        return parsed;
    } catch (error) {
        console.warn("No se pudo leer cache de tienda:", error);
        return null;
    }
}

function guardarCacheDatosUsuarioTienda() {
    try {
        sessionStorage.setItem(
            TIENDA_USER_CACHE_KEY,
            JSON.stringify({
                usuario: usuarioTiendaGlobal,
                pokedolares: saldoUsuarioGlobal
            })
        );

        sessionStorage.setItem(
            TIENDA_INV_CACHE_KEY,
            JSON.stringify(inventarioUsuarioGlobal)
        );
    } catch (error) {
        console.warn("No se pudo guardar cache de usuario tienda:", error);
    }
}

function leerCacheUsuarioTienda() {
    try {
        const rawUser = sessionStorage.getItem(TIENDA_USER_CACHE_KEY);
        const rawInv = sessionStorage.getItem(TIENDA_INV_CACHE_KEY);

        return {
            usuario: rawUser ? JSON.parse(rawUser) : null,
            inventario: rawInv ? JSON.parse(rawInv) : null
        };
    } catch (error) {
        console.warn("No se pudo leer cache de usuario tienda:", error);
        return { usuario: null, inventario: null };
    }
}

function limpiarCacheUsuarioTienda() {
    try {
        sessionStorage.removeItem(TIENDA_USER_CACHE_KEY);
        sessionStorage.removeItem(TIENDA_INV_CACHE_KEY);
    } catch (error) {
        console.warn("No se pudo limpiar cache de usuario tienda:", error);
    }
}

function renderizarSaldo() {
    const saldoBox = document.getElementById("saldoUsuario");
    if (!saldoBox) return;

    if (!usuarioAutenticadoTienda()) {
        saldoBox.innerHTML = `
            <div class="saldo-box wide">
                <span class="saldo-icono">🔒</span>
                <div>
                    <p class="saldo-label">${t("pokemart_login_required")}</p>
                    <h3>${t("pokemart_login_to_buy")}</h3>
                </div>
            </div>
        `;
        renderizarHeroResumenPokeMart();
        return;
    }

    saldoBox.innerHTML = `
        <div class="saldo-box wide highlight">
            <div class="saldo-main-copy">
                <p class="saldo-label">${t("pokemart_balance_label")}</p>
                <h3>${saldoUsuarioGlobal ?? 0}</h3>
                <small>${pmText("hero_desc")}</small>
            </div>
            <div class="saldo-side-icon">💰</div>
        </div>
    `;

    renderizarHeroResumenPokeMart();
}

function renderizarTienda() {
    const tienda = document.getElementById("tiendaItems");
    if (!tienda) return;

    tienda.innerHTML = "";

    if (!tiendaItemsGlobal.length) {
        tienda.innerHTML = `<p>${t("pokemart_no_items")}</p>`;
        renderizarQuickNavTienda([]);
        return;
    }

    const estaLogueado = usuarioAutenticadoTienda();
    const visibles = tiendaItemsGlobal
        .filter(item => !ITEMS_OCULTOS_TEMPORALES.includes(item.nombre) && !esItemPremiumSolo(item))
        .sort((a, b) => {
            const categoriaA = SHOP_SECTION_ORDER.indexOf(obtenerCategoriaItemBase(a));
            const categoriaB = SHOP_SECTION_ORDER.indexOf(obtenerCategoriaItemBase(b));
            if (categoriaA !== categoriaB) return categoriaA - categoriaB;
            const pesoA = obtenerPesoOrdenItem(a);
            const pesoB = obtenerPesoOrdenItem(b);
            if (pesoA !== pesoB) return pesoA - pesoB;
            return String(a?.nombre || "").localeCompare(String(b?.nombre || ""));
        });

    const grupos = {
        captura: [],
        curacion: [],
        evolucion: [],
        otros: []
    };

    visibles.forEach(item => {
        const categoria = obtenerCategoriaItemBase(item);
        grupos[categoria] = grupos[categoria] || [];
        grupos[categoria].push(item);
    });

    const secciones = SHOP_SECTION_ORDER.filter(categoria => Array.isArray(grupos[categoria]) && grupos[categoria].length > 0);
    renderizarQuickNavTienda(secciones);

    tienda.innerHTML = secciones.map(categoria => `
        <section class="shop-category-section" id="shop-section-${categoria}">
            <div class="shop-category-header">
                <div>
                    <span class="shop-category-kicker">${SHOP_SECTION_ICON[categoria] || "🛒"} ${obtenerTituloSeccionTienda(categoria)}</span>
                    <h3>${obtenerTituloSeccionTienda(categoria)}</h3>
                    <p>${obtenerSubtituloSeccionTienda(categoria)}</p>
                </div>
                <span class="shop-category-count">${grupos[categoria].length}</span>
            </div>
            <div class="shop-category-grid ${categoria === "captura" ? "capture-priority-grid" : ""}">
                ${grupos[categoria].map(item => renderizarCardItemHTML(item, estaLogueado)).join("")}
            </div>
        </section>
    `).join("");

    tiendaRenderizada = true;
}

function setBotonComprando(itemId, comprando) {
    const btn = document.querySelector(`.btn-comprar-item[data-item-id="${itemId}"]`);
    if (!btn) return;

    btn.disabled = comprando;
    btn.textContent = comprando ? t("pokemart_buying") : t("pokemart_buy");
}

async function cargarCatalogoTienda({ forzar = false } = {}) {
    if (!forzar && tiendaItemsGlobal.length > 0) {
        return tiendaItemsGlobal;
    }

    if (!forzar) {
        const cache = leerCacheTienda();
        if (cache && cache.length > 0) {
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
        obtenerUsuarioActual(),
        obtenerItemsUsuarioActual()
    ]);

    if (!usuario) {
        throw new Error("No se pudo obtener el usuario actual");
    }

    usuarioTiendaGlobal = usuario;
    saldoUsuarioGlobal = usuario.pokedolares ?? 0;
    inventarioUsuarioGlobal = Array.isArray(inventario) ? inventario : [];

    guardarCacheDatosUsuarioTienda();
}

async function sincronizarDatosUsuarioTiendaSilencioso(itemId = null) {
    try {
        await cargarDatosUsuarioTienda();
        renderizarSaldo();

        if (itemId) {
            actualizarCardItemComprado(itemId);
        }
    } catch (error) {
        console.warn("No se pudo sincronizar tienda en segundo plano:", error);

        if (error?.code === "NO_TOKEN" || error?.code === "UNAUTHORIZED") {
            limpiarEstadoUsuarioTiendaEnMemoria();
            renderizarSaldo();
            renderizarTienda();
        }
    }
}

async function cargarTienda({ forzarCatalogo = false } = {}) {
    const tienda = document.getElementById("tiendaItems");
    const saldoBox = document.getElementById("saldoUsuario");

    const cacheCatalogo = leerCacheTienda();
    const cacheUsuario = leerCacheUsuarioTienda();
    const estaLogueado = usuarioAutenticadoTienda();

    if (!forzarCatalogo && cacheCatalogo && cacheCatalogo.length > 0) {
        tiendaItemsGlobal = filtrarItemsTiendaPublica(cacheCatalogo);

        if (cacheUsuario.usuario) {
            usuarioTiendaGlobal = cacheUsuario.usuario.usuario || cacheUsuario.usuario;
            saldoUsuarioGlobal = cacheUsuario.usuario.pokedolares ?? cacheUsuario.usuario.pokedolares_actual ?? 0;
        } else {
            usuarioTiendaGlobal = null;
            saldoUsuarioGlobal = 0;
        }

        if (Array.isArray(cacheUsuario.inventario)) {
            inventarioUsuarioGlobal = cacheUsuario.inventario;
        } else {
            inventarioUsuarioGlobal = [];
        }

        renderizarSaldo();
        renderizarTienda();
    } else if (!tiendaRenderizada || forzarCatalogo) {
        mostrarCargaTienda();
    }

    try {
        const promesaCatalogo = cargarCatalogoTienda({ forzar: forzarCatalogo });

        if (estaLogueado) {
            await Promise.all([promesaCatalogo, cargarDatosUsuarioTienda()]);
        } else {
            limpiarEstadoUsuarioTiendaEnMemoria();
            await promesaCatalogo;
        }

        renderizarSaldo();
        renderizarTienda();
    } catch (error) {
        console.error("Error cargando tienda:", error);

        if (error?.code === "NO_TOKEN" || error?.code === "UNAUTHORIZED") {
            limpiarEstadoUsuarioTiendaEnMemoria();
            renderizarSaldo();
            renderizarTienda();
            return;
        }

        if (!cacheCatalogo || cacheCatalogo.length === 0) {
            if (saldoBox) saldoBox.innerHTML = `<p>${t("pokemart_balance_error")}</p>`;
            if (tienda) tienda.innerHTML = `<p>${t("pokemart_store_error")}</p>`;
        }
    }
}

async function comprarItem(itemId) {
    if (!usuarioAutenticadoTienda()) {
        mostrarMensajeCompra(t("pokemart_login_message"), "error");
        return;
    }

    let usuario = usuarioTiendaGlobal;
    let usuarioId = usuario?.id ? Number(usuario.id) : Number(getUsuarioIdLocal());

    if (!usuario || !usuario.id) {
        usuario = await obtenerUsuarioActual();
        usuarioTiendaGlobal = usuario;
        usuarioId = usuario?.id ? Number(usuario.id) : usuarioId;
    }

    if (!usuario || !usuario.id || !usuarioId) {
        mostrarMensajeCompra(t("pokemart_user_error"), "error");
        return;
    }

    const item = tiendaItemsGlobal.find(i => Number(i.id) === Number(itemId));
    const inputCantidad = document.getElementById(`cantidad-item-${itemId}`);
    const cantidad = parseInt(inputCantidad?.value || "1", 10);

    if (!cantidad || cantidad < 1) {
        mostrarMensajeCompra(t("pokemart_invalid_quantity"), "error");
        return;
    }

    cantidadesSeleccionadas[itemId] = cantidad;

    if (!item) {
        mostrarMensajeCompra(t("pokemart_item_not_found"), "error");
        return;
    }

    if (esItemPremiumSolo(item)) {
        mostrarMensajeCompra(t("pokemart_premium_only_item_error"), "error");
        return;
    }

    const total = Number(item.precio) * cantidad;

    if (saldoUsuarioGlobal < total) {
        mostrarMensajeCompra(t("pokemart_not_enough_money"), "error");
        return;
    }

    setBotonComprando(itemId, true);

    try {
        const data = await fetchAuth(`${API_BASE}/tienda/comprar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: usuarioId,
                item_id: Number(itemId),
                cantidad: cantidad
            })
        });

        if (data.ok === false) {
            mostrarMensajeCompra(data.mensaje || t("pokemart_buy_error"), "error");
            setBotonComprando(itemId, false);
            return;
        }

        if (data.mensaje && data.mensaje.toLowerCase().includes("no tienes")) {
            mostrarMensajeCompra(data.mensaje, "error");
            setBotonComprando(itemId, false);
            return;
        }

        if (typeof data.pokedolares_actual !== "undefined") {
            saldoUsuarioGlobal = Number(data.pokedolares_actual);
            localStorage.setItem("usuario_pokedolares", String(saldoUsuarioGlobal));
            if (usuarioTiendaGlobal) {
                usuarioTiendaGlobal.pokedolares = saldoUsuarioGlobal;
            }
        } else {
            saldoUsuarioGlobal = Math.max(0, saldoUsuarioGlobal - total);
        }

        const idx = inventarioUsuarioGlobal.findIndex(i => Number(i.item_id) === Number(itemId));

        if (typeof data.cantidad_actual !== "undefined") {
            if (idx >= 0) {
                inventarioUsuarioGlobal[idx].cantidad = Number(data.cantidad_actual);
            } else {
                inventarioUsuarioGlobal.push({
                    item_id: Number(itemId),
                    nombre: item.nombre,
                    cantidad: Number(data.cantidad_actual)
                });
            }
        } else {
            if (idx >= 0) {
                inventarioUsuarioGlobal[idx].cantidad += cantidad;
            } else {
                inventarioUsuarioGlobal.push({
                    item_id: Number(itemId),
                    nombre: item.nombre,
                    cantidad: cantidad
                });
            }
        }

        cantidadesSeleccionadas[itemId] = 1;

        guardarCacheDatosUsuarioTienda();

        renderizarSaldo();
        actualizarCardItemComprado(itemId);

        const nombreTraducido = traducirNombreItemTienda(item.nombre);
        mostrarMensajeCompra(
            data.mensaje || `${t("pokemart_bought_prefix")} ${cantidad} x ${nombreTraducido}`,
            "ok"
        );

        sincronizarDatosUsuarioTiendaSilencioso(itemId);

    } catch (error) {
        console.error("Error comprando item:", error);

        if (error?.code === "NO_TOKEN" || error?.code === "UNAUTHORIZED") {
            limpiarEstadoUsuarioTiendaEnMemoria();
            renderizarSaldo();
            renderizarTienda();
            mostrarMensajeCompra(t("pokemart_login_message"), "error");
        } else {
            mostrarMensajeCompra(error.message || t("pokemart_buy_error"), "error");
        }

        setBotonComprando(itemId, false);
    }
}

document.addEventListener("click", function(event) {
    const btn = event.target.closest(".btn-comprar-item");
    if (!btn) return;

    const itemId = Number(btn.dataset.itemId);
    if (!itemId) return;

    comprarItem(itemId);
});

document.addEventListener("input", function(event) {
    const input = event.target.closest('input[id^="cantidad-item-"]');
    if (!input) return;

    const itemId = Number(input.id.replace("cantidad-item-", ""));
    const valor = parseInt(input.value || "1", 10);

    cantidadesSeleccionadas[itemId] = !valor || valor < 1 ? 1 : valor;
});

window.limpiarCacheUsuarioTienda = limpiarCacheUsuarioTienda;
window.cargarTienda = cargarTienda;

function actualizarCardItemComprado(itemId) {
    const item = tiendaItemsGlobal.find(i => Number(i.id) === Number(itemId));
    if (!item) return;

    const card = document.querySelector(`.item-card[data-item-id="${itemId}"]`);
    if (!card) return;

    const itemUsuario = inventarioUsuarioGlobal.find(i => Number(i.item_id) === Number(itemId));
    const cantidadActual = itemUsuario ? itemUsuario.cantidad : 0;

    const stock = card.querySelector(".item-stock");
    if (stock) {
        stock.textContent = `${t("pokemart_you_have")}: x${cantidadActual}`;
    }

    const input = document.getElementById(`cantidad-item-${itemId}`);
    if (input) {
        input.value = cantidadesSeleccionadas[itemId] || 1;
    }

    setBotonComprando(itemId, false);
}

function traducirDescripcionItemTienda(nombre = "", descripcionOriginal = "") {
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
    return key ? t(key) : (descripcionOriginal || "");
}


/* =========================================================
   PREMIUM SHOP / PAYPAL
========================================================= */

const PREMIUM_SUPPORTED_CODES = [
    "idle_masters_1m",
    "battle_exp_x2_pack5",
    "battle_gold_x2_pack5"
];

const PREMIUM_COMING_SOON_CODES = [
    "map_exclusive_rate_1y",
    "exclusive_pokemon_single",
    "battle_pass_s1"
];

const PREMIUM_PRODUCT_META = {
    idle_masters_1m: {
        icon: "👑",
        titleKey: "pokemart_premium_idle_title",
        descKey: "pokemart_premium_idle_desc",
        tagKey: "pokemart_premium_tag_subscription",
        deliveryKey: "pokemart_premium_delivery_benefit",
        activeBenefitCode: "idle_masters"
    },
    battle_exp_x2_pack5: {
        icon: "⚔️",
        titleKey: "pokemart_premium_exp_title",
        descKey: "pokemart_premium_exp_desc",
        tagKey: "pokemart_premium_tag_booster_pack",
        deliveryKey: "pokemart_premium_delivery_items"
    },
    battle_gold_x2_pack5: {
        icon: "💰",
        titleKey: "pokemart_premium_gold_title",
        descKey: "pokemart_premium_gold_desc",
        tagKey: "pokemart_premium_tag_booster_pack",
        deliveryKey: "pokemart_premium_delivery_items"
    },
    map_exclusive_rate_1y: {
        icon: "🗺️",
        titleKey: "pokemart_premium_maps_title",
        descKey: "pokemart_premium_maps_desc",
        tagKey: "pokemart_premium_tag_coming_soon"
    },
    exclusive_pokemon_single: {
        icon: "✨",
        titleKey: "pokemart_premium_exclusive_title",
        descKey: "pokemart_premium_exclusive_desc",
        tagKey: "pokemart_premium_tag_coming_soon"
    },
    battle_pass_s1: {
        icon: "🎟️",
        titleKey: "pokemart_premium_pass_title",
        descKey: "pokemart_premium_pass_desc",
        tagKey: "pokemart_premium_tag_coming_soon"
    }
};

let premiumProductosGlobal = [];
let premiumBeneficiosGlobal = [];
let premiumProductoSeleccionado = null;

function obtenerCatalogoPagosCompat() {
    if (typeof obtenerCatalogoPagos === "function") {
        return obtenerCatalogoPagos();
    }
    return fetchAuth(`${API_BASE}/payments/catalogo`);
}

function obtenerBeneficiosActivosCompat() {
    if (typeof obtenerBeneficiosActivos === "function") {
        return obtenerBeneficiosActivos();
    }
    return fetchAuth(`${API_BASE}/payments/beneficios/activos`);
}

function crearOrdenPaypalPagoCompat(productCode) {
    if (typeof crearOrdenPaypalPago === "function") {
        return crearOrdenPaypalPago({
            productCode,
            quantity: 1,
            confirmacionAceptada: true,
            versionTerminos: "v1"
        });
    }

    return fetchAuth(`${API_BASE}/payments/paypal/order/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            product_code: productCode,
            quantity: 1,
            confirmacion_aceptada: true,
            version_terminos: "v1"
        })
    });
}

function obtenerTituloPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    return meta.titleKey ? t(meta.titleKey) : (producto?.nombre || "Premium");
}

function obtenerDescripcionPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    if (meta.descKey) return t(meta.descKey);
    return producto?.metadata?.notes || producto?.nombre || "";
}

function obtenerTagPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    return meta.tagKey ? t(meta.tagKey) : t("pokemart_premium_tag_featured");
}

function obtenerIconoPremiumProducto(producto) {
    return PREMIUM_PRODUCT_META[producto?.codigo]?.icon || "⭐";
}

function obtenerDeliveryPremiumProducto(producto) {
    const meta = PREMIUM_PRODUCT_META[producto?.codigo] || {};
    return meta.deliveryKey ? t(meta.deliveryKey) : t("pokemart_premium_delivery_generic");
}

function obtenerHighlightsPremiumProducto(producto) {
    const codigo = producto?.codigo;
    if (codigo === "idle_masters_1m") {
        return [
            pmText("premium_idle_feature_1"),
            pmText("premium_idle_feature_2"),
            pmText("premium_idle_feature_3"),
            pmText("premium_idle_feature_4")
        ];
    }
    if (codigo === "battle_exp_x2_pack5") {
        return [
            pmText("premium_exp_feature_1"),
            pmText("premium_exp_feature_2"),
            pmText("premium_exp_feature_3"),
            pmText("premium_exp_feature_4")
        ];
    }
    if (codigo === "battle_gold_x2_pack5") {
        return [
            pmText("premium_gold_feature_1"),
            pmText("premium_gold_feature_2"),
            pmText("premium_gold_feature_3"),
            pmText("premium_gold_feature_4")
        ];
    }
    if (codigo === "map_exclusive_rate_1y") {
        return [
            pmText("premium_maps_feature_1"),
            pmText("premium_maps_feature_2"),
            pmText("premium_maps_feature_3"),
            pmText("premium_maps_feature_4")
        ];
    }
    if (codigo === "exclusive_pokemon_single") {
        return [
            pmText("premium_exclusive_feature_1"),
            pmText("premium_exclusive_feature_2"),
            pmText("premium_exclusive_feature_3"),
            pmText("premium_exclusive_feature_4")
        ];
    }
    return [
        pmText("premium_pass_feature_1"),
        pmText("premium_pass_feature_2"),
        pmText("premium_pass_feature_3"),
        pmText("premium_pass_feature_4")
    ];
}

function obtenerTipoPremiumProducto(producto) {
    const tipo = String(producto?.tipo || "").toLowerCase();
    if (tipo === "suscripcion") return t("pokemart_premium_type_subscription");
    if (tipo === "pack_item") return t("pokemart_premium_type_pack");
    if (tipo === "battle_pass") return t("pokemart_premium_type_battle_pass");
    return producto?.tipo || t("pokemart_premium_type_premium");
}

function obtenerDuracionPremiumProducto(producto) {
    if (producto?.duracion_meses) {
        return t("pokemart_premium_duration_months", { count: producto.duracion_meses });
    }
    if (producto?.duracion_dias) {
        return t("pokemart_premium_duration_days", { count: producto.duracion_dias });
    }
    if (producto?.duracion_horas) {
        return t("pokemart_premium_duration_hours", { count: producto.duracion_horas });
    }
    return t("pokemart_premium_duration_instant");
}

function obtenerEstadoBeneficioActivo(codigoBeneficio) {
    if (!codigoBeneficio) return null;
    return premiumBeneficiosGlobal.find(b => String(b?.beneficio_codigo || "") === String(codigoBeneficio) && String(b?.estado || "") === "activo") || null;
}

function formatearFechaPremium(valor) {
    if (!valor) return t("pokemart_premium_date_unknown");
    try {
        return new Date(valor).toLocaleString(getCurrentLang() === "es" ? "es-PE" : "en-US");
    } catch (error) {
        return valor;
    }
}

function setPremiumMessage(message = "", type = "ok") {
    const box = document.getElementById("premiumShopMessage");
    if (!box) return;

    if (!message) {
        box.className = "premium-banner-message";
        box.textContent = "";
        return;
    }

    box.className = `premium-banner-message show ${type === "error" ? "error" : "ok"}`;
    box.textContent = message;
}

function actualizarResumenPremium() {
    const countProductos = document.getElementById("premiumProductosCount");
    const countBeneficios = document.getElementById("premiumBeneficiosCount");
    const beneficiosHint = document.getElementById("premiumBeneficiosHint");

    if (countProductos) {
        const offersReady = premiumProductosGlobal.filter(p => PREMIUM_SUPPORTED_CODES.includes(p.codigo)).length;
        countProductos.textContent = String(offersReady);
    }

    if (countBeneficios) {
        countBeneficios.textContent = String(premiumBeneficiosGlobal.length);
    }

    if (beneficiosHint) {
        if (!premiumBeneficiosGlobal.length) {
            beneficiosHint.textContent = t("pokemart_premium_summary_no_active");
        } else {
            const beneficio = premiumBeneficiosGlobal[0];
            beneficiosHint.textContent = t("pokemart_premium_summary_active_until", {
                code: beneficio.beneficio_codigo,
                date: formatearFechaPremium(beneficio.expira_en)
            });
        }
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
    const ordenados = [
        ...PREMIUM_SUPPORTED_CODES.map(code => support.find(p => p.codigo === code)).filter(Boolean),
        ...PREMIUM_COMING_SOON_CODES.map(code => coming.find(p => p.codigo === code)).filter(Boolean)
    ];

    if (!ordenados.length) {
        grid.innerHTML = `<div class="premium-login-box"><h4>${t("pokemart_premium_empty_title")}</h4><p>${t("pokemart_premium_empty_text")}</p></div>`;
        actualizarResumenPremium();
        return;
    }

    grid.innerHTML = ordenados.map((producto) => {
        const isSupported = PREMIUM_SUPPORTED_CODES.includes(producto.codigo);
        const meta = PREMIUM_PRODUCT_META[producto.codigo] || {};
        const beneficioActivo = obtenerEstadoBeneficioActivo(meta.activeBenefitCode);
        const highlights = obtenerHighlightsPremiumProducto(producto);
        const tagExtra = beneficioActivo
            ? `<span class="premium-card-tag premium-chip-active">${t("pokemart_premium_tag_active")}</span>`
            : `<span class="premium-card-tag ${isSupported ? "" : "premium-chip-coming"}">${obtenerTagPremiumProducto(producto)}</span>`;

        const note = beneficioActivo
            ? t("pokemart_premium_active_until", { date: formatearFechaPremium(beneficioActivo.expira_en) })
            : isSupported
                ? t("pokemart_premium_note_checkout")
                : t("pokemart_premium_note_coming_soon");

        return `
            <article class="premium-card ${isSupported ? "" : "locked"}" data-premium-code="${producto.codigo}">
                <div class="premium-card-top">
                    <span class="premium-card-badge">${obtenerIconoPremiumProducto(producto)}</span>
                    ${tagExtra}
                </div>
                <div class="premium-card-copy">
                    <h4>${obtenerTituloPremiumProducto(producto)}</h4>
                    <p>${obtenerDescripcionPremiumProducto(producto)}</p>
                </div>
                <div class="premium-card-price-row">
                    <div class="premium-card-price">
                        <strong>$${Number(producto.precio_usd || 0).toFixed(0)}</strong>
                        <span>USD</span>
                    </div>
                    <span class="premium-price-type">${obtenerTipoPremiumProducto(producto)}</span>
                </div>
                <div class="premium-card-meta compact">
                    <span class="premium-meta-pill">⏳ ${obtenerDuracionPremiumProducto(producto)}</span>
                    <span class="premium-meta-pill">📦 ${obtenerDeliveryPremiumProducto(producto)}</span>
                </div>
                <ul class="premium-feature-list">
                    ${highlights.map(item => `<li>${item}</li>`).join("")}
                </ul>
                <div class="premium-card-footer">
                    <button class="premium-card-btn ${isSupported ? "" : "secondary"}" data-premium-buy="${producto.codigo}" ${isSupported ? "" : "disabled"}>
                        ${isSupported ? t("pokemart_premium_buy_now") : t("pokemart_premium_coming_soon") }
                    </button>
                    <p class="premium-card-note">${note}</p>
                </div>
            </article>
        `;
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
        const [catalogoData, beneficiosData] = await Promise.all([
            obtenerCatalogoPagosCompat(),
            obtenerBeneficiosActivosCompat()
        ]);

        premiumProductosGlobal = Array.isArray(catalogoData?.productos) ? catalogoData.productos : [];
        premiumBeneficiosGlobal = Array.isArray(beneficiosData?.beneficios) ? beneficiosData.beneficios : [];
        renderizarPremiumCatalogo();
    } catch (error) {
        console.error("Error cargando premium shop:", error);
        premiumProductosGlobal = [];
        premiumBeneficiosGlobal = [];
        renderizarPremiumCatalogo();
        setPremiumMessage(error?.message || t("pokemart_premium_load_error"), "error");
    }
}

function abrirModalPremium(productCode) {
    if (!usuarioAutenticadoTienda()) {
        setPremiumMessage(t("pokemart_premium_login_text"), "error");
        return;
    }

    const producto = premiumProductosGlobal.find(p => p.codigo === productCode);
    if (!producto) {
        setPremiumMessage(t("pokemart_premium_product_not_found"), "error");
        return;
    }

    premiumProductoSeleccionado = producto;

    const modal = document.getElementById("premiumPurchaseModal");
    const productName = document.getElementById("premiumModalProductName");
    const price = document.getElementById("premiumModalPrice");
    const type = document.getElementById("premiumModalType");
    const delivery = document.getElementById("premiumModalDelivery");
    const description = document.getElementById("premiumModalDescription");
    const errorBox = document.getElementById("premiumModalError");
    const checkConfirm = document.getElementById("premiumModalCheckConfirm");
    const checkTerms = document.getElementById("premiumModalCheckTerms");

    if (productName) productName.textContent = obtenerTituloPremiumProducto(producto);
    if (price) price.textContent = `$${Number(producto.precio_usd || 0).toFixed(2)} USD`;
    if (type) type.textContent = obtenerTipoPremiumProducto(producto);
    if (delivery) delivery.textContent = obtenerDeliveryPremiumProducto(producto);
    if (description) description.innerHTML = `<small>${t("pokemart_premium_modal_details")}</small><strong>${obtenerDescripcionPremiumProducto(producto)}</strong>`;
    if (errorBox) { errorBox.classList.remove("show"); errorBox.textContent = ""; }
    if (checkConfirm) checkConfirm.checked = false;
    if (checkTerms) checkTerms.checked = false;

    if (modal) {
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    }
}

function cerrarModalPremium() {
    const modal = document.getElementById("premiumPurchaseModal");
    const errorBox = document.getElementById("premiumModalError");
    premiumProductoSeleccionado = null;
    if (errorBox) { errorBox.classList.remove("show"); errorBox.textContent = ""; }
    if (modal) {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    }
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
            errorBox.textContent = t("pokemart_premium_modal_missing_checks");
            errorBox.classList.add("show");
        }
        return;
    }

    if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.remove("show");
    }

    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = t("pokemart_premium_redirecting");
    }

    try {
        const data = await crearOrdenPaypalPagoCompat(producto.codigo);
        if (!data?.approval_url) {
            throw new Error(t("pokemart_premium_checkout_error"));
        }
        window.location.href = data.approval_url;
    } catch (error) {
        console.error("Error creando orden premium:", error);
        const message = error?.message || t("pokemart_premium_checkout_error");
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.classList.add("show");
        }
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = t("pokemart_premium_modal_pay");
        }
    }
}

function registrarEventosPremium() {
    document.addEventListener("click", (event) => {
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
        if (modal && event.target === modal) {
            cerrarModalPremium();
        }
    });
}
