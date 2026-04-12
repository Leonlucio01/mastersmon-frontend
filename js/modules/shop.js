import { state } from "../core/state.js";
import { refs, statusCard, escapeHtml, formatNumber } from "../core/ui.js";
import { fetchAuth } from "../core/api.js";
import { getItemImage } from "../core/assets.js";

async function ensureShopLoaded(force = false) {
  if (!force && state.shopCatalog.length && state.shopUtilityCatalog.length && state.shopSummary) return;
  const [summaryResponse, utilityResponse, catalogResponse] = await Promise.all([
    fetchAuth("/v2/shop/summary"),
    fetchAuth("/v2/shop/utility-catalog"),
    fetchAuth("/v2/shop/catalog"),
  ]);
  state.shopSummary = summaryResponse.data || null;
  state.shopUtilityCatalog = Array.isArray(utilityResponse.data?.items) ? utilityResponse.data.items : [];
  state.shopCatalog = Array.isArray(catalogResponse.data?.items) ? catalogResponse.data.items : [];
}

function getGoldWallet() {
  const wallets = Array.isArray(state.shopSummary?.wallets) ? state.shopSummary.wallets : [];
  return wallets.find((item) => String(item?.currency_code || "").toLowerCase() === "gold") || wallets[0] || null;
}

function utilityInventoryMap() {
  const items = Array.isArray(state.shopSummary?.utility_inventory) ? state.shopSummary.utility_inventory : [];
  return new Map(items.map((item) => [item.code, item]));
}

function renderUtilityCatalog() {
  if (!state.shopUtilityCatalog.length) {
    return `<div class="shop-empty">No hay items del juego disponibles todavía.</div>`;
  }

  const inventory = utilityInventoryMap();
  return `
    <div class="shop-products-grid shop-products-grid-utility">
      ${state.shopUtilityCatalog.map((item) => {
        const owned = inventory.get(item.code)?.quantity ?? item.owned_quantity ?? 0;
        return `
          <article class="shop-product-card shop-product-card-utility">
            <div class="shop-product-top">
              <div>
                <span class="shop-chip">Item del juego</span>
                <h4>${escapeHtml(item.name || item.code)}</h4>
              </div>
              <div class="shop-product-icon shop-product-icon-image">
                <img src="${escapeHtml(getItemImage({ item_code: item.code, item_name: item.name }))}" alt="${escapeHtml(item.name || item.code)}" onerror="onPokemonImageError(this)">
              </div>
            </div>
            <p>${escapeHtml(item.description || "Item util para el loop del juego.")}</p>
            <div class="shop-product-meta-line">
              <span class="shop-chip">${escapeHtml(item.item_kind || "item")}</span>
              <span class="shop-chip">Pack x${escapeHtml(item.pack_quantity || 1)}</span>
              <span class="shop-chip is-success">Tienes ${escapeHtml(formatNumber(owned))}</span>
            </div>
            <div class="shop-product-price">
              <strong>${escapeHtml(formatNumber(item.price_gold || 0))} Gold</strong>
              <span class="body-copy">por pack</span>
            </div>
            <div class="shop-product-actions">
              <button class="primary-btn" type="button" data-buy-item="${escapeHtml(item.code)}">Comprar 1 pack</button>
              <button class="soft-btn" type="button" data-buy-item="${escapeHtml(item.code)}" data-buy-qty="5">Comprar 5 packs</button>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function renderPremiumCatalog() {
  if (!state.shopCatalog.length) {
    return `<div class="shop-empty">No hay productos premium activos todavía.</div>`;
  }

  return `
    <div class="shop-products-grid">
      ${state.shopCatalog.map((product) => `
        <article class="shop-product-card">
          <div class="shop-product-top">
            <div>
              <span class="shop-chip">Premium</span>
              <h4>${escapeHtml(product.name || product.code)}</h4>
            </div>
            <div class="shop-product-icon shop-product-icon-image">
              <img src="${escapeHtml(getItemImage({ item_code: product.code, item_name: product.name }))}" alt="${escapeHtml(product.name || product.code)}" onerror="onPokemonImageError(this)">
            </div>
          </div>
          <p>${escapeHtml(product.description || product.metadata?.notes || "Producto premium disponible en el catálogo V2.")}</p>
          <div class="shop-product-price">
            <strong>${escapeHtml(`${Number(product.price_usd || 0).toFixed(2)} USD`)}</strong>
            <span class="body-copy">${escapeHtml(product.product_type || "premium")}</span>
          </div>
        </article>
      `).join("")}
    </div>`;
}

function renderWalletActivity() {
  const items = Array.isArray(state.shopSummary?.recent_wallet_activity) ? state.shopSummary.recent_wallet_activity : [];
  if (!items.length) {
    return `<div class="shop-empty">No hay movimientos recientes de wallet todavía.</div>`;
  }

  return `
    <div class="shop-history-grid">
      ${items.map((item) => `
        <article class="shop-history-card">
          <div class="shop-history-top">
            <div>
              <small>${escapeHtml(item.currency_name || item.currency_code || "Wallet")}</small>
              <strong>${escapeHtml(item.notes || item.source_type || "Movimiento")}</strong>
            </div>
            <span class="shop-chip ${String(item.direction || "").toLowerCase() === "credit" ? "is-success" : "is-warning"}">${escapeHtml(item.direction || "tx")}</span>
          </div>
          <p>Monto: ${escapeHtml(formatNumber(item.amount || 0))}</p>
          <p>Balance: ${escapeHtml(formatNumber(item.balance_before || 0))} -> ${escapeHtml(formatNumber(item.balance_after || 0))}</p>
        </article>
      `).join("")}
    </div>`;
}

async function purchaseUtilityItem(itemCode, quantity = 1) {
  refs.appContent.querySelectorAll("[data-buy-item]").forEach((button) => {
    button.disabled = true;
  });
  try {
    const response = await fetchAuth("/v2/shop/utility-purchase", {
      method: "POST",
      body: JSON.stringify({ item_code: itemCode, quantity }),
    });
    const data = response.data || {};
    state.shopSummary = {
      ...(state.shopSummary || {}),
      wallets: data.wallets || state.shopSummary?.wallets || [],
      recent_wallet_activity: data.recent_wallet_activity || state.shopSummary?.recent_wallet_activity || [],
      utility_inventory: (state.shopSummary?.utility_inventory || []).map((item) => (
        item.code === itemCode ? { ...item, quantity: data.inventory_quantity } : item
      )),
    };
    const existing = state.shopSummary.utility_inventory?.some((item) => item.code === itemCode);
    if (!existing) {
      state.shopSummary.utility_inventory = [
        ...(state.shopSummary.utility_inventory || []),
        { code: itemCode, quantity: data.inventory_quantity },
      ];
    }
    state.shopUtilityCatalog = state.shopUtilityCatalog.map((item) => (
      item.code === itemCode ? { ...item, owned_quantity: data.inventory_quantity } : item
    ));
    state.shopSync = {
      status: "success",
      message: `Compraste ${data.item_name} x${data.quantity_purchased} y recibiste ${data.granted_quantity} unidades.`,
      orderId: itemCode,
    };
  } catch (error) {
    state.shopSync = {
      status: "error",
      message: error.message || "No se pudo completar la compra.",
      orderId: itemCode,
    };
  }
  renderShop();
}

function bindShopEvents() {
  document.querySelectorAll("[data-shop-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.shopView = button.getAttribute("data-shop-view") || "utility";
      renderShop();
    });
  });

  document.querySelectorAll("[data-buy-item]").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemCode = button.getAttribute("data-buy-item");
      const quantity = Number(button.getAttribute("data-buy-qty") || "1");
      await purchaseUtilityItem(itemCode, quantity);
    });
  });

  document.getElementById("shopOpenAdventureBtn")?.addEventListener("click", () => {
    document.querySelector('[data-nav="adventure"]')?.click();
  });
}

export async function renderShop(force = false) {
  refs.appContent.innerHTML = statusCard("Cargando Shop...");
  try {
    await ensureShopLoaded(force);
    if (!state.shopView) state.shopView = "utility";
    const wallet = getGoldWallet();
    refs.appContent.innerHTML = `
      <section class="shop-shell">
        <section class="shop-hero">
          <div>
            <span class="pill tag-accent">Shop</span>
            <h2>PokeMart V2</h2>
            <p>La tienda ahora sirve para el loop del juego: compra balls, repone consumibles y luego vuelve a Adventure para capturar nuevos Pokémon.</p>
            <div class="shop-hero-actions">
              <button class="primary-btn" type="button" id="shopOpenAdventureBtn">Volver a Adventure</button>
            </div>
          </div>
          <aside class="shop-hero-side">
            <small>Wallet principal</small>
            <h3>${escapeHtml(wallet?.currency_name || wallet?.currency_code || "Gold")}</h3>
            <p>${escapeHtml(formatNumber(wallet?.balance ?? 0))} disponibles para compras del juego.</p>
          </aside>
        </section>

        <section class="shop-summary-grid">
          <article class="shop-summary-card">
            <small>Items utilitarios</small>
            <strong>${escapeHtml(formatNumber(state.shopUtilityCatalog.length))}</strong>
            <p class="body-copy">Poke Balls y consumibles listos para comprar con gold.</p>
          </article>
          <article class="shop-summary-card">
            <small>Premium</small>
            <strong>${escapeHtml(formatNumber(state.shopCatalog.length))}</strong>
            <p class="body-copy">Productos especiales y monetización aparte del loop base.</p>
          </article>
          <article class="shop-summary-card">
            <small>Actividad</small>
            <strong>${escapeHtml(formatNumber((state.shopSummary?.recent_wallet_activity || []).length))}</strong>
            <p class="body-copy">Últimos movimientos de wallet.</p>
          </article>
        </section>

        ${state.shopSync?.message ? `
          <section class="shop-sync-card ${state.shopSync.status === "success" ? "is-success" : "is-error"}">
            <strong>${escapeHtml(state.shopSync.status === "success" ? "Compra completada" : "Compra fallida")}</strong>
            <p>${escapeHtml(state.shopSync.message)}</p>
          </section>` : ""}

        <section class="shop-panel">
          <div class="shop-panel-head">
            <div>
              <span class="pill">PokeMart</span>
              <h3>Abastece tu aventura</h3>
              <p>Compra balls y consumibles antes de volver al mapa. La captura ya depende de tener stock real.</p>
            </div>
            <div class="shop-view-switch">
              <button class="shop-view-btn ${state.shopView === "utility" ? "is-active" : ""}" type="button" data-shop-view="utility">Items del juego</button>
              <button class="shop-view-btn ${state.shopView === "premium" ? "is-active" : ""}" type="button" data-shop-view="premium">Premium</button>
            </div>
          </div>
          ${state.shopView === "utility" ? renderUtilityCatalog() : renderPremiumCatalog()}
        </section>

        <section class="shop-panel">
          <div class="shop-panel-head">
            <div>
              <span class="pill">Wallet</span>
              <h3>Actividad reciente</h3>
              <p>Resumen de compras y movimientos en monedas del juego.</p>
            </div>
          </div>
          ${renderWalletActivity()}
        </section>
      </section>`;
    bindShopEvents();
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Shop.", "error");
  }
}
