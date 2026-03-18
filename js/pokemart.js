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

document.addEventListener("DOMContentLoaded", () => {
    configurarIdiomaPokeMart();
    cargarTienda();
});

document.addEventListener("languageChanged", () => {
    refrescarUIPokeMart();
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

function usuarioAutenticadoTienda() {
    return !!getAccessToken();
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
            <div class="saldo-box">
                <span class="saldo-icono">🔒</span>
                <div>
                    <p class="saldo-label">${t("pokemart_login_required")}</p>
                    <h3>${t("pokemart_login_to_buy")}</h3>
                </div>
            </div>
        `;
        return;
    }

    saldoBox.innerHTML = `
        <div class="saldo-box">
            <span class="saldo-icono">💰</span>
            <div>
                <p class="saldo-label">${t("pokemart_balance_label")}</p>
                <h3>${saldoUsuarioGlobal ?? 0}</h3>
            </div>
        </div>
    `;
}

function renderizarTienda() {
    const tienda = document.getElementById("tiendaItems");
    if (!tienda) return;

    tienda.innerHTML = "";

    if (!tiendaItemsGlobal.length) {
        tienda.innerHTML = `<p>${t("pokemart_no_items")}</p>`;
        return;
    }

    const estaLogueado = usuarioAutenticadoTienda();
    let html = "";

    for (const item of tiendaItemsGlobal) {
        if (ITEMS_OCULTOS_TEMPORALES.includes(item.nombre)) {
            continue;
        }

        const itemUsuario = inventarioUsuarioGlobal.find(i => Number(i.item_id) === Number(item.id));
        const cantidadActual = itemUsuario ? itemUsuario.cantidad : 0;
        const cantidadInput = cantidadesSeleccionadas[item.id] || 1;
        const nombreTraducido = traducirNombreItemTienda(item.nombre);
        const tipoTraducido = traducirTipoItemTienda(item.tipo);

        html += `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-card-top">
                    <img
                        class="item-imagen"
                        src="${obtenerImagenItem(item.nombre)}"
                        alt="${nombreTraducido}"
                        loading="lazy"
                        decoding="async"
                    >
                    <span class="${obtenerClaseTipo(item.tipo)}">${tipoTraducido}</span>
                </div>

                <h3>${nombreTraducido}</h3>
                <p class="item-descripcion">${item.descripcion || ""}</p>

                <div class="item-stock">${t("pokemart_you_have")}: x${cantidadActual}</div>

                <div class="item-info">
                    <span>${t("pokemart_price")}</span>
                    <strong>${item.precio}</strong>
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

    tienda.innerHTML = html;
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
            tiendaItemsGlobal = cache;
            return tiendaItemsGlobal;
        }
    }

    const res = await fetch(`${API_BASE}/tienda/items`);
    if (!res.ok) throw new Error("Error al obtener items de la tienda");

    const items = await res.json();
    tiendaItemsGlobal = items;
    guardarCacheTienda(items);

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
    }
}

async function cargarTienda({ forzarCatalogo = false } = {}) {
    const tienda = document.getElementById("tiendaItems");
    const saldoBox = document.getElementById("saldoUsuario");

    const cacheCatalogo = leerCacheTienda();
    const cacheUsuario = leerCacheUsuarioTienda();
    const estaLogueado = usuarioAutenticadoTienda();

    if (!forzarCatalogo && cacheCatalogo && cacheCatalogo.length > 0) {
        tiendaItemsGlobal = cacheCatalogo;

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
            usuarioTiendaGlobal = null;
            saldoUsuarioGlobal = 0;
            inventarioUsuarioGlobal = [];
            limpiarCacheUsuarioTienda();
            await promesaCatalogo;
        }

        renderizarSaldo();
        renderizarTienda();
    } catch (error) {
        console.error("Error cargando tienda:", error);

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

    if (!usuario || !usuario.id) {
        usuario = await obtenerUsuarioActual();
        usuarioTiendaGlobal = usuario;
    }

    if (!usuario || !usuario.id) {
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

    const total = Number(item.precio) * cantidad;

    if (saldoUsuarioGlobal < total) {
        mostrarMensajeCompra(t("pokemart_not_enough_money"), "error");
        return;
    }

    setBotonComprando(itemId, true);

    try {
        const res = await fetch(`${API_BASE}/tienda/comprar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: Number(usuario.id),
                item_id: Number(itemId),
                cantidad: cantidad
            })
        });

        const data = await res.json();

        if (!res.ok || data.ok === false) {
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
        mostrarMensajeCompra(t("pokemart_buy_error"), "error");
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
