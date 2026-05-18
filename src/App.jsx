// src/App.jsx

import { useMemo } from "react";
import { getAssetUrl } from "./api/mastersmonApi";
import { useMastersmon } from "./hooks/useMastersmon";
import "./styles.css";

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
    </div>
  );
}

function MonsterCard({ monster }) {
  if (!monster) return null;

  return (
    <article className="monster-card">
      <div className="monster-card__sprite-wrap">
        <img
          src={getAssetUrl(monster.selected_sprite_path)}
          alt={monster.pokemon_name}
          className="monster-card__sprite"
        />
      </div>

      <div>
        <p className="monster-card__dex">#{monster.dex_number}</p>
        <h3>
          {monster.pokemon_name}
          {monster.is_shiny ? <span className="shiny"> ✨</span> : null}
        </h3>
        <p className="muted">
          Nv. {monster.level} · {monster.primary_type}
          {monster.secondary_type ? ` / ${monster.secondary_type}` : ""}
        </p>
      </div>
    </article>
  );
}

function TeamSlot({ slot }) {
  return (
    <div className="team-slot">
      <span className="team-slot__number">Slot {slot.slot_number}</span>

      {slot.player_monster_id ? (
        <>
          <img
            src={getAssetUrl(slot.selected_sprite_path)}
            alt={slot.pokemon_name}
            className="team-slot__sprite"
          />
          <strong>{slot.pokemon_name}</strong>
          <small>Nv. {slot.level}</small>
        </>
      ) : (
        <span className="empty-slot">Vacío</span>
      )}
    </div>
  );
}

export default function App() {
  const {
    loading,
    error,
    profile,
    inventory,
    team,
    collection,
    pokedexSummary,
    maps,
    recentCaptures,
    currentEncounter,
    lastCaptureResult,
    selectedMap,
    setSelectedMap,
    refreshAll,
    findEncounter,
    captureCurrent,
  } = useMastersmon();

  const pokeBallQty = useMemo(() => {
    return inventory.find((item) => item.item_slug === "poke-ball")?.quantity ?? 0;
  }, [inventory]);

  const selectedMapInfo = maps.find((map) => map.slug === selectedMap);

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MastersMon Online</p>
          <h1>Servidor Verdantia</h1>
          <p className="hero__text">
            Explora mapas, encuentra monstruos salvajes y fortalece tu colección.
          </p>

          <div className="hero__actions">
            <button onClick={refreshAll} disabled={loading}>
              Refrescar
            </button>
            <button
              className="primary"
              onClick={() => findEncounter(selectedMap)}
              disabled={loading}
            >
              Buscar monstruo
            </button>
            <button
              className="capture"
              onClick={() => captureCurrent("poke-ball")}
              disabled={loading || pokeBallQty <= 0}
            >
              Capturar con Poké Ball ({pokeBallQty})
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}
          {loading ? <p className="muted">Cargando...</p> : null}
        </div>

        <aside className="profile-card">
          <img
            src={profile?.avatar_path || "/img/avatars/leon.png"}
            alt={profile?.trainer_name || "Trainer"}
            className="avatar"
          />
          <h2>{profile?.trainer_name || "Entrenador"}</h2>
          <p>{profile?.email}</p>

          <div className="wallet">
            <StatCard label="Nivel" value={profile?.level} />
            <StatCard label="Oro" value={profile?.gold} />
            <StatCard label="Diamantes" value={profile?.diamonds} />
            <StatCard label="Tickets Boss" value={profile?.boss_tickets} />
          </div>
        </aside>
      </section>

      <section className="grid grid-2">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Aventura</p>
              <h2>Encuentro salvaje</h2>
            </div>

            <select
              value={selectedMap}
              onChange={(event) => setSelectedMap(event.target.value)}
            >
              {maps.map((map) => (
                <option key={map.map_id} value={map.slug}>
                  {map.name}
                </option>
              ))}
            </select>
          </div>

          <p className="muted">
            Mapa: {selectedMapInfo?.name || selectedMap} · Spawns:{" "}
            {selectedMapInfo?.total_spawns ?? "-"}
          </p>

          {currentEncounter ? (
            <div className="encounter">
              <img
                src={getAssetUrl(currentEncounter.selected_sprite_path)}
                alt={currentEncounter.pokemon_name}
                className="encounter__sprite"
              />
              <div>
                <p className="monster-card__dex">#{currentEncounter.dex_number}</p>
                <h3>
                  {currentEncounter.pokemon_name}
                  {currentEncounter.is_shiny ? " ✨" : ""}
                </h3>
                <p className="muted">
                  Nv. {currentEncounter.level} · {currentEncounter.primary_type}
                  {currentEncounter.secondary_type ? ` / ${currentEncounter.secondary_type}` : ""}
                </p>
                <p className="muted">
                  Expira: {new Date(currentEncounter.expires_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state">Pulsa “Buscar monstruo”.</div>
          )}

          {lastCaptureResult ? (
            <div className={lastCaptureResult.success ? "result success" : "result"}>
              <strong>{lastCaptureResult.message}</strong>
              <p>
                Chance: {Number(lastCaptureResult.capture_chance * 100).toFixed(1)}%
                {" · "}
                Roll: {Number(lastCaptureResult.roll * 100).toFixed(1)}%
              </p>
            </div>
          ) : null}
        </article>

        <article className="panel">
          <p className="eyebrow">Equipo</p>
          <h2>Equipo activo</h2>
          <div className="team-grid">
            {team.map((slot) => (
              <TeamSlot key={slot.slot_number} slot={slot} />
            ))}
          </div>
        </article>
      </section>

      <section className="grid grid-3">
        <article className="panel">
          <p className="eyebrow">Pokédex</p>
          <h2>Progreso</h2>
          <div className="pokedex-progress">
            <StatCard label="Vistos" value={pokedexSummary?.seen_species} />
            <StatCard label="Capturados" value={pokedexSummary?.caught_species} />
            <StatCard label="Total" value={pokedexSummary?.total_species} />
            <StatCard label="%" value={`${pokedexSummary?.caught_percent ?? 0}%`} />
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Inventario</p>
          <h2>Mochila</h2>
          <div className="inventory-list">
            {inventory.slice(0, 10).map((item) => (
              <div key={item.item_id} className="inventory-item">
                <span>{item.display_name || item.item_name}</span>
                <strong>x{item.quantity}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Servidor</p>
          <h2>Últimas capturas</h2>
          <div className="recent-list">
            {recentCaptures.slice(0, 6).map((capture) => (
              <div key={capture.capture_log_id} className="recent-item">
                <img
                  src={getAssetUrl(capture.selected_sprite_path)}
                  alt={capture.pokemon_name}
                />
                <span>
                  {capture.trainer_name || "Trainer"} capturó{" "}
                  <strong>{capture.pokemon_name}</strong>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Colección</p>
            <h2>Mis capturas</h2>
          </div>
          <span className="badge">{collection.length} monstruos</span>
        </div>

        <div className="collection-grid">
          {collection.map((monster) => (
            <MonsterCard key={monster.player_monster_id} monster={monster} />
          ))}
        </div>
      </section>
    </main>
  );
}
