// src/hooks/useMastersmonDemo.js

import { useCallback, useEffect, useState } from "react";
import {
  captureLatestDemoEncounter,
  createDemoEncounter,
  getDemoCollection,
  getDemoInventory,
  getDemoPokedexSummary,
  getDemoProfile,
  getDemoTeam,
  getMaps,
  getServerRecentCaptures,
} from "../api/mastersmonApi";

export function useMastersmonDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [team, setTeam] = useState([]);
  const [collection, setCollection] = useState([]);
  const [pokedexSummary, setPokedexSummary] = useState(null);
  const [maps, setMaps] = useState([]);
  const [recentCaptures, setRecentCaptures] = useState([]);

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
      ] = await Promise.all([
        getDemoProfile(),
        getDemoInventory(),
        getDemoTeam(),
        getDemoCollection({ limit: 120 }),
        getDemoPokedexSummary(),
        getMaps(),
        getServerRecentCaptures({ limit: 20 }),
      ]);

      setProfile(profileData);
      setInventory(inventoryData);
      setTeam(teamData);
      setCollection(collectionData);
      setPokedexSummary(pokedexSummaryData);
      setMaps(mapsData);
      setRecentCaptures(recentCapturesData);
    } catch (err) {
      setError(err.message || "Error loading MastersMon data");
    } finally {
      setLoading(false);
    }
  }, []);

  const findEncounter = useCallback(async (mapSlug = selectedMap) => {
    setLoading(true);
    setError("");
    setLastCaptureResult(null);

    try {
      const encounter = await createDemoEncounter(mapSlug);
      setCurrentEncounter(encounter);
      return encounter;
    } catch (err) {
      setError(err.message || "Error creating encounter");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedMap]);

  const captureLatest = useCallback(async (ballSlug = "poke-ball") => {
    setLoading(true);
    setError("");

    try {
      const result = await captureLatestDemoEncounter(ballSlug);
      setLastCaptureResult(result);

      await refreshAll();

      if (result?.success || result?.encounter_status === "fled") {
        setCurrentEncounter(null);
      }

      return result;
    } catch (err) {
      setError(err.message || "Error capturing encounter");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshAll]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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
    currentEncounter,
    lastCaptureResult,
    selectedMap,
    setSelectedMap,
    refreshAll,
    findEncounter,
    captureLatest,
  };
}
