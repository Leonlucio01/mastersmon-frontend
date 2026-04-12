import { refs } from "../core/ui.js";
import { state } from "../core/state.js";

export async function renderRanking() {
  refs.appContent.innerHTML = `
    <section class="ranking-page">
      <section class="ranking-hero">
        <span class="ranking-hero-badge">Ranking</span>
        <h1 class="ranking-title">Hall of Fame</h1>
        <p class="ranking-subtitle">La vista de ranking ya esta reservada dentro del shell V2, pero su contrato backend aun no existe en esta carpeta. El siguiente paso natural es exponer un endpoint V2 con resumen de trainers, Pokemon top EXP y progreso de coleccion.</p>
      </section>

      <section class="ranking-highlight-grid">
        <article class="ranking-highlight-card">
          <div class="ranking-highlight-label">Estado</div>
          <div class="ranking-highlight-top ranking-highlight-top-split">
            <div class="ranking-highlight-copy">
              <h3 class="ranking-highlight-title">Modulo preparado</h3>
              <p class="ranking-highlight-name">Shell modular listo</p>
            </div>
          </div>
          <div class="ranking-highlight-meta">
            <div class="ranking-mini-stat"><span>Backend</span><strong>Pendiente</strong></div>
            <div class="ranking-mini-stat"><span>Assets audit</span><strong>${Number(state.assetAudit?.sprites || 0)}</strong></div>
          </div>
        </article>

        <article class="ranking-highlight-card">
          <div class="ranking-highlight-label">Siguiente contrato</div>
          <div class="ranking-highlight-top ranking-highlight-top-split">
            <div class="ranking-highlight-copy">
              <h3 class="ranking-highlight-title">Ranking V2</h3>
              <p class="ranking-highlight-name">Trainers, EXP y coleccion</p>
            </div>
          </div>
          <div class="ranking-highlight-meta">
            <div class="ranking-mini-stat"><span>Endpoint</span><strong>/v2/ranking/summary</strong></div>
            <div class="ranking-mini-stat"><span>Prioridad</span><strong>Tier 3</strong></div>
          </div>
        </article>
      </section>
    </section>`;
}
