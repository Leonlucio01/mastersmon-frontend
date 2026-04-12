import { state } from "../core/state.js";
import { refs, statusCard, escapeHtml } from "../core/ui.js";
import { fetchAuth } from "../core/api.js";
import { getItemImage } from "../core/assets.js";

async function ensureShopLoaded(force = false) {
  if (!force && state.shopCatalog.length) return;
  const [summaryResponse, catalogResponse] = await Promise.all([
    fetchAuth("/v2/shop/summary"),
    fetchAuth("/v2/shop/catalog"),
  ]);
  state.shopSummary = summaryResponse.data || null;
  state.shopCatalog = Array.isArray(catalogResponse.data?.items) ? catalogResponse.data.items : [];
}

function getWalletSummary() {
  const wallets = Array.isArray(state.shopSummary?.wallets) ? state.shopSummary.wallets : [];
  return wallets.find((item) => /poke|gold|coin|dollar/i.test(String(item?.currency_code || item?.code || ""))) || wallets[0] || null;
}

function renderCatalog() {
  if (!state.shopCatalog.length) {
    return `<div class="shop-empty">No hay productos premium activos todavia.</div>`;
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
          <p>${escapeHtml(product.description || product.metadata?.notes || "Producto premium disponible en el catalogo V2.")}</p>
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
    return `<div class="shop-empty">No hay movimientos recientes de wallet todavia.</div>`;
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
          <p>Monto: ${escapeHtml(String(item.amount || 0))}</p>
          <p>Balance: ${escapeHtml(String(item.balance_before || 0))} -> ${escapeHtml(String(item.balance_after || 0))}</p>
        </article>
      `).join("")}
    </div>`;
}

export async function renderShop(force = false) {
  refs.appContent.innerHTML = statusCard("Cargando Shop...");
  try {
    await ensureShopLoaded(force);
    const wallet = getWalletSummary();
    refs.appContent.innerHTML = `
      <section class="shop-shell">
        <section class="shop-hero">
          <div>
            <span class="pill tag-accent">Shop</span>
            <h2>PokeMart modular</h2>
            <p>Este modulo ya consume contratos V2 reales para catalogo premium y resumen de wallet, usando los assets del repo actual.</p>
          </div>
          <aside class="shop-hero-side">
            <small>Wallet principal</small>
            <h3>${escapeHtml(wallet?.currency_name || wallet?.currency_code || "Sin wallet")}</h3>
            <p>${escapeHtml(String(wallet?.balance ?? "Sin dato"))} disponibles en tu cuenta principal.</p>
          </aside>
        </section>

        <section class="shop-summary-grid">
          <article class="shop-summary-card">
            <small>Catalogo</small>
            <strong>${escapeHtml(state.shopCatalog.length)}</strong>
            <p class="body-copy">Productos premium activos del backend V2.</p>
          </article>
          <article class="shop-summary-card">
            <small>Wallets</small>
            <strong>${escapeHtml((state.shopSummary?.wallets || []).length)}</strong>
            <p class="body-copy">Monedas cargadas para el usuario autenticado.</p>
          </article>
          <article class="shop-summary-card">
            <small>Actividad</small>
            <strong>${escapeHtml((state.shopSummary?.recent_wallet_activity || []).length)}</strong>
            <p class="body-copy">Ultimos movimientos de wallet.</p>
          </article>
        </section>

        <section class="shop-panel">
          <div class="shop-panel-head">
            <div>
              <span class="pill">Catalogo</span>
              <h3>Productos premium V2</h3>
              <p>Base lista para conectar checkout y beneficios cuando agreguemos ese flujo al backend.</p>
            </div>
          </div>
          ${renderCatalog()}
        </section>

        <section class="shop-panel">
          <div class="shop-panel-head">
            <div>
              <span class="pill">Wallet</span>
              <h3>Actividad reciente</h3>
              <p>Resumen simple de movimientos del usuario en monedas del juego.</p>
            </div>
          </div>
          ${renderWalletActivity()}
        </section>
      </section>`;
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Shop.", "error");
  }
}
