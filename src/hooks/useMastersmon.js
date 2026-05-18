import { useCallback, useEffect, useState } from "react";
import {
  captureEncounter,
  createEncounter,
  getActiveEncounters,
  getCollection,
  getInventory,
  getMaps,
  getPokedexSummary,
  getProfile,
  getRecentCaptures,
  getTeam,
} from "../api/mastersmonApi";

function friendlyError(error) {
  const message = error?.message || "Error de conexión";

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "No pudimos conectar con el servidor. Si Render está despertando, vuelve a intentar en unos segundos.";
  }

  if (message.toLowerCase().includes("ball")) {
    return "No tienes Balls disponibles para esta captura.";
  }

  if (message.toLowerCase().includes("expired")) {
    return "El encuentro expiró. Busca otro encuentro salvaje.";
  }

  return message;
}

export function useMastersmon({ enabled = true } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [team, setTeam] = useState([]);
  const [collection, setCollection] = useState([]);
  const [pokedexSummary, setPokedexSummary] = useState(null);
  const [maps, setMaps] = useState([]);
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [activeEncounters, setActiveEncounters] = useState([]);

  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [lastCaptureResult, setLastCaptureResult] = useState(null);
  const [selectedMap, setSelectedMap] = useState("bosque-verde");

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        profileData,
        inventoryData,
        teamData,
        collectionData,
        pokedexSummaryData,
        mapsData,
        recentCapturesData,
        activeEncountersData,
      ] = await Promise.all([
        getProfile(),
        getInventory(),
        getTeam(),
        getCollection({ limit: 120 }),
        getPokedexSummary(),
        getMaps(),
        getRecentCaptures({ limit: 20 }),
        getActiveEncounters(),
      ]);

      setProfile(profileData);
      setInventory(inventoryData);
      setTeam(teamData);
      setCollection(collectionData);
      setPokedexSummary(pokedexSummaryData);
      setMaps(mapsData);
      setRecentCaptures(recentCapturesData);
      setActiveEncounters(activeEncountersData);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const findEncounter = useCallback(async (mapSlug = selectedMap) => {
    setLoading(true);
    setError("");
    setLastCaptureResult(null);

    try {
      const encounter = await createEncounter(mapSlug);
      setCurrentEncounter(encounter);
      setActiveEncounters((items) => [encounter, ...items]);
      return encounter;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedMap]);

  const captureCurrent = useCallback(async (ballSlug = "poke-ball") => {
    setLoading(true);
    setError("");

    try {
      const encounterId = currentEncounter?.encounter_id || activeEncounters[0]?.encounter_id;

      if (!encounterId) {
        throw new Error("No hay encuentro activo. Busca un encuentro salvaje primero.");
      }

      const result = await captureEncounter(encounterId, ballSlug);
      setLastCaptureResult(result);

      await refreshAll();

      if (result?.success || result?.encounter_status === "fled") {
        setCurrentEncounter(null);
      }

      return result;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeEncounters, currentEncounter, refreshAll]);

  useEffect(() => {
    if (enabled) refreshAll();
  }, [enabled, refreshAll]);

  return {
    loading,
    error,
    profile,
    inventory,
    team,
    collection,
    pokedexSummary,
    maps,
    recentCaptures,
    activeEncounters,
    currentEncounter,
    lastCaptureResult,
    selectedMap,
    setSelectedMap,
    refreshAll,
    findEncounter,
    captureCurrent,
  };
}
