// src/App.jsx

import { useEffect, useMemo, useState } from "react";
import {
  clearToken,
  getAssetUrl,
  getAuthMe,
  getToken,
  login,
  logout,
  register,
} from "./api/mastersmonApi";
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
          {monster.is_shiny ? <span className="shiny"> shiny</span> : null}
        </h3>
        <p className="muted">
          Nv. {monster.level} / {monster.primary_type}
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
        <span className="empty-slot">Vacio</span>
      )}
    </div>
  );
}

function getAuthErrorMessage(error) {
  if (error?.code === "EMAIL_USED") return "Este email ya tiene una cuenta.";
  if (error?.code === "PASSWORD_TOO_SHORT") return "La contraseña debe tener al menos 6 caracteres.";
  if (error?.code === "TRAINER_NAME_REQUIRED") return "Ingresa un nombre de entrenador.";
  if (error?.code === "INVALID_CREDENTIALS") return "Email o contraseña incorrectos.";
  if (error?.code === "NETWORK_ERROR") return "No se pudo conectar con el servidor.";
  if (error?.status === 409) return "Este email ya tiene una cuenta.";
  if (error?.status === 401) return "Email o contraseña incorrectos.";
  return error?.message || "No se pudo conectar con el servidor.";
}

function AuthScreen({ message, onEnterGuest, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "register") {
        if (!trainerName.trim()) {
          throw new Error("Ingresa un nombre de entrenador.");
        }

        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }

        await register({ email, password, trainerName });
      } else {
        await login({ email, password });
      }

      onAuthenticated();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGuest() {
    setGuestSubmitting(true);
    setError("");

    try {
      await onEnterGuest();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuestSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div>
          <p className="eyebrow">MastersMon Online</p>
          <h1>{mode === "login" ? "Entrar" : "Crear cuenta"}</h1>
          <p className="hero__text">
            Accede al Servidor Verdantia y continua tu aventura con datos propios.
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "primary" : ""}
            disabled={submitting || guestSubmitting}
            type="button"
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            className={mode === "register" ? "primary" : ""}
            disabled={submitting || guestSubmitting}
            type="button"
            onClick={() => setMode("register")}
          >
            Crear cuenta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label>
              Nombre de entrenador
              <input
                minLength={2}
                required
                value={trainerName}
                onChange={(event) => setTrainerName(event.target.value)}
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              autoComplete="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {mode === "register" ? (
            <label>
              Confirmar contraseña
              <input
                autoComplete="new-password"
                minLength={6}
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
          ) : null}

          {message ? <p className="error">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}

          <div className="auth-actions">
            <button className="primary" disabled={submitting} type="submit">
              {submitting ? (mode === "login" ? "Entrando..." : "Creando...") : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
            <button disabled={submitting || guestSubmitting} type="button" onClick={handleGuest}>
              {guestSubmitting ? "Cargando..." : "Entrar como invitado"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

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
    resetGameState,
  } = useMastersmon({ enabled: isPlaying });

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getToken()) {
        setCheckingSession(false);
        return;
      }

      try {
        await getAuthMe();
        if (active) setIsPlaying(true);
      } catch {
        clearToken();
        if (active) setAuthMessage("Tu sesión expiró. Inicia sesión de nuevo.");
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleExpiredSession() {
      clearToken();
      resetGameState();
      setIsPlaying(false);
      setAuthMessage("Tu sesión expiró. Inicia sesión de nuevo.");
    }

    window.addEventListener("mastersmon:session-expired", handleExpiredSession);
    return () => window.removeEventListener("mastersmon:session-expired", handleExpiredSession);
  }, []);

  const pokeBallQty = useMemo(() => {
    return inventory.find((item) => item.item_slug === "poke-ball")?.quantity ?? 0;
  }, [inventory]);

  const selectedMapInfo = maps.find((map) => map.slug === selectedMap);

  async function handleLogout() {
    await logout();
    resetGameState();
    setIsPlaying(false);
    setAuthMessage("");
  }

  if (checkingSession) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="muted">Cargando sesión...</p>
        </section>
      </main>
    );
  }

  if (!isPlaying) {
    return (
      <AuthScreen
        message={authMessage}
        onAuthenticated={() => {
          setAuthMessage("");
          setIsPlaying(true);
        }}
        onEnterGuest={() => {
          clearToken();
          resetGameState();
          setAuthMessage("");
          setIsPlaying(true);
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MastersMon Online</p>
          <h1>Servidor Verdantia</h1>
          <p className="hero__text">
            Explora mapas, encuentra monstruos salvajes y fortalece tu coleccion.
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
              Capturar con Poke Ball ({pokeBallQty})
            </button>
            <button onClick={handleLogout} disabled={loading}>
              Cerrar sesión
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
          <button onClick={handleLogout} disabled={loading}>
            Cerrar sesión
          </button>

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
            Mapa: {selectedMapInfo?.name || selectedMap} / Spawns:{" "}
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
                  {currentEncounter.is_shiny ? " shiny" : ""}
                </h3>
                <p className="muted">
                  Nv. {currentEncounter.level} / {currentEncounter.primary_type}
                  {currentEncounter.secondary_type ? ` / ${currentEncounter.secondary_type}` : ""}
                </p>
                <p className="muted">
                  Expira: {new Date(currentEncounter.expires_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state">Pulsa Buscar monstruo.</div>
          )}

          {lastCaptureResult ? (
            <div className={lastCaptureResult.success ? "result success" : "result"}>
              <strong>{lastCaptureResult.message}</strong>
              <p>
                Chance: {Number(lastCaptureResult.capture_chance * 100).toFixed(1)}%
                {" / "}
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
          <p className="eyebrow">Pokedex</p>
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
          <h2>Ultimas capturas</h2>
          <div className="recent-list">
            {recentCaptures.slice(0, 6).map((capture) => (
              <div key={capture.capture_log_id} className="recent-item">
                <img
                  src={getAssetUrl(capture.selected_sprite_path)}
                  alt={capture.pokemon_name}
                />
                <span>
                  {capture.trainer_name || "Trainer"} capturo{" "}
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
            <p className="eyebrow">Coleccion</p>
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
