import { useCallback, useEffect, useState } from "react";
import {
  buyShopItem,
  captureEncounter,
  autoBuildTeam,
  clearTeamSlot,
  createEncounter,
  evolveMonster,
  getActiveEncounters,
  getCollection,
  getInventory,
  getMaps,
  getMonsterEvolutions,
  getPokedexSummary,
  getProfile,
  getRecentCaptures,
  getShopItems,
  getTeam,
  setTeamSlot,
  useItem,
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
  const [shopItems, setShopItems] = useState([]);
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [activeEncounters, setActiveEncounters] = useState([]);
  const [availableEvolutions, setAvailableEvolutions] = useState([]);
  const [selectedEvolutionMonster, setSelectedEvolutionMonster] = useState(null);
  const [evolutionModalOpen, setEvolutionModalOpen] = useState(false);

  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [lastCaptureResult, setLastCaptureResult] = useState(null);
  const [selectedMap, setSelectedMap] = useState("bosque-verde");

  const resetGameState = useCallback(() => {
    setLoading(false);
    setError("");
    setProfile(null);
    setInventory([]);
    setTeam([]);
    setCollection([]);
    setPokedexSummary(null);
    setMaps([]);
    setShopItems([]);
    setRecentCaptures([]);
    setActiveEncounters([]);
    setAvailableEvolutions([]);
    setSelectedEvolutionMonster(null);
    setEvolutionModalOpen(false);
    setCurrentEncounter(null);
    setLastCaptureResult(null);
    setSelectedMap("bosque-verde");
  }, []);

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
        shopItemsData,
        recentCapturesData,
        activeEncountersData,
      ] = await Promise.all([
        getProfile(),
        getInventory(),
        getTeam(),
        getCollection({ limit: 120 }),
        getPokedexSummary(),
        getMaps(),
        getShopItems(),
        getRecentCaptures({ limit: 20 }),
        getActiveEncounters(),
      ]);

      setProfile(profileData);
      setInventory(inventoryData);
      setTeam(teamData);
      setCollection(collectionData);
      setPokedexSummary(pokedexSummaryData);
      setMaps(mapsData);
      setShopItems(shopItemsData);
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

  const assignTeamSlot = useCallback(async (slotNumber, playerMonsterId) => {
    setLoading(true);
    setError("");

    try {
      const updatedTeam = await setTeamSlot(slotNumber, playerMonsterId);
      setTeam(updatedTeam);
      setCollection(await getCollection({ limit: 120 }));
      return updatedTeam;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTeamSlot = useCallback(async (slotNumber) => {
    setLoading(true);
    setError("");

    try {
      const updatedTeam = await clearTeamSlot(slotNumber);
      setTeam(updatedTeam);
      setCollection(await getCollection({ limit: 120 }));
      return updatedTeam;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const autoFormTeam = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const updatedTeam = await autoBuildTeam();
      setTeam(updatedTeam);
      setCollection(await getCollection({ limit: 120 }));
      return updatedTeam;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadShopItems = useCallback(async () => {
    const items = await getShopItems();
    setShopItems(items);
    return items;
  }, []);

  const buyItem = useCallback(async (itemSlug, quantity = 1) => {
    setLoading(true);
    setError("");

    try {
      const result = await buyShopItem(itemSlug, quantity);
      const [profileData, inventoryData, shopItemsData] = await Promise.all([
        getProfile(),
        getInventory(),
        getShopItems(),
      ]);
      setProfile(profileData);
      setInventory(inventoryData);
      setShopItems(shopItemsData);
      return result;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const useInventoryItem = useCallback(async (itemSlug, playerMonsterId, quantity = 1) => {
    setLoading(true);
    setError("");

    try {
      const result = await useItem({ itemSlug, playerMonsterId, quantity });
      const [inventoryData, collectionData, teamData, pokedexSummaryData] = await Promise.all([
        getInventory(),
        getCollection({ limit: 120 }),
        getTeam(),
        getPokedexSummary(),
      ]);
      setInventory(inventoryData);
      setCollection(collectionData);
      setTeam(teamData);
      setPokedexSummary(pokedexSummaryData);
      return result;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMonsterEvolutions = useCallback(async (playerMonsterId) => {
    const payload = await getMonsterEvolutions(playerMonsterId);
    setSelectedEvolutionMonster(payload?.monster || null);
    setAvailableEvolutions(payload?.evolutions || []);
    setEvolutionModalOpen(true);
    return payload;
  }, []);

  const evolveSelectedMonster = useCallback(async ({ playerMonsterId, ruleId, toSpeciesId, itemSlug }) => {
    setLoading(true);
    setError("");

    try {
      const result = await evolveMonster({ playerMonsterId, ruleId, toSpeciesId, itemSlug });
      const [inventoryData, collectionData, teamData, pokedexSummaryData] = await Promise.all([
        getInventory(),
        getCollection({ limit: 120 }),
        getTeam(),
        getPokedexSummary(),
      ]);
      setInventory(inventoryData);
      setCollection(collectionData);
      setTeam(teamData);
      setPokedexSummary(pokedexSummaryData);
      setAvailableEvolutions([]);
      setSelectedEvolutionMonster(null);
      setEvolutionModalOpen(false);
      return result;
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
    shopItems,
    recentCaptures,
    activeEncounters,
    availableEvolutions,
    selectedEvolutionMonster,
    evolutionModalOpen,
    currentEncounter,
    lastCaptureResult,
    selectedMap,
    setSelectedMap,
    refreshAll,
    findEncounter,
    captureCurrent,
    loadShopItems,
    buyItem,
    useInventoryItem,
    loadMonsterEvolutions,
    evolveSelectedMonster,
    assignTeamSlot,
    removeTeamSlot,
    autoFormTeam,
    resetGameState,
  };
}
