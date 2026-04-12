import { state } from "../core/state.js";
import { refs, statusCard, escapeHtml } from "../core/ui.js";
import { getItemImage } from "../core/assets.js";

const LOCAL_PREMIUM_CATALOG = [
  {
    code: "idle_masters_1m",
    title: "Idle Masters",
    note: "Desbloquea la capa premium del modo Idle durante 1 mes.",
    priceLabel: "20.00 USD",
  },
  {
    code: "battle_exp_x2_pack5",
    title: "Battle EXP x2 Pack",
    note: "Pack de boosters para acelerar progreso en batallas.",
    priceLabel: "Proximo",
  },
  {
    code: "battle_gold_x2_pack5",
    title: "Battle GOLD x2 Pack",
    note: "Pack de boosters para duplicar ganancias de oro en battle.",
    priceLabel: "Proximo",
  },
];

function getWalletSummary() {
  const wallets = Array.isArray(state.profile?.wallets) ? state.profile.wallets : [];
  return wallets.find((item) => /poke|gold|coin|dollar/i.test(String(item?.currency_code || item?.code || ""))) || wallets[0] || null;
}

function renderCatalog() {
  return `
    <div class="shop-products-grid">
      ${LOCAL_PREMIUM_CATALOG.map((product) => `
        <article class="shop-product-card">
          <div class="shop-product-top">
            <div>
              <span class="shop-chip">Premium</span>
              <h4>${escapeHtml(product.title)}</h4>
            </div>
            <div class="shop-product-icon shop-product-icon-image">
              <img src="${escapeHtml(getItemImage({ item_code: product.code, item_name: product.title }))}" alt="${escapeHtml(product.title)}" onerror="onPokemonImageError(this)">
            </div>
          </div>
          <p>${escapeHtml(product.note)}</p>
          <div class="shop-product-price">
            <strong>${escapeHtml(product.priceLabel)}</strong>
            <span class="body-copy">Catalogo base del shell</span>
          </div>
        </article>
      `).join("")}
    </div>`;
}

export async function renderShop(force = false) {
  if (force) refs.appContent.innerHTML = statusCard("Cargando Shop...");

  const wallet = getWalletSummary();
  refs.appContent.innerHTML = `
    <section class="shop-shell">
      <section class="shop-hero">
        <div>
          <span class="pill tag-accent">Shop</span>
          <h2>PokeMart modular</h2>
          <p>La vista ya vive dentro del shell V2 y usa los assets reales del repo. El checkout y la sincronizacion de compras quedan pendientes hasta exponer un contrato V2 de pagos dentro de este backend.</p>
        </div>
        <aside class="shop-hero-side">
          <small>Wallet principal</small>
          <h3>${escapeHtml(wallet?.name || wallet?.currency_name || wallet?.currency_code || "Sin wallet")}</h3>
          <p>${escapeHtml(String(wallet?.balance ?? "Sin dato"))} disponibles. Este resumen sale del perfil V2 actual.</p>
        </aside>
      </section>

      <section class="shop-summary-grid">
        <article class="shop-summary-card">
          <small>Catalogo base</small>
          <strong>${escapeHtml(LOCAL_PREMIUM_CATALOG.length)}</strong>
          <p class="body-copy">Items con imagen resuelta desde el repo local.</p>
        </article>
        <article class="shop-summary-card">
          <small>Manifests items</small>
          <strong>${escapeHtml(state.assetAudit?.items ?? 0)}</strong>
          <p class="body-copy">Custom: ${escapeHtml(state.assetAudit?.customItems ?? 0)}</p>
        </article>
        <article class="shop-summary-card">
          <small>Estado</small>
          <strong>Shell ready</strong>
          <p class="body-copy">Pendiente backend V2 para pagos y beneficios.</p>
        </article>
      </section>

      <section class="shop-panel">
        <div class="shop-panel-head">
          <div>
            <span class="pill">Estado actual</span>
            <h3>Catalogo seguro del shell</h3>
            <p>Esta vista evita llamadas legacy que no existen en esta carpeta y deja claro el siguiente contrato que falta implementar.</p>
          </div>
        </div>
        ${renderCatalog()}
      </section>
    </section>`;
}
