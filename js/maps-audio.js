(() => {
    const MAPS_AUDIO_PREFS_KEY = "mastersmon_maps_audio_prefs_v2";
    const MAPS_AUDIO_DEFAULTS = {
        enabled: true,
        muted: false,
        volume: 0.14,
        sfxVolume: 0.65
    };

    const MAPS_AUDIO_TRACKS = {
        base: {
            key: "base",
            labelEn: "World Map Theme",
            labelEs: "Tema del mapa mundial",
            candidates: ["audio/maps/forest-theme.mp3", "audio/maps/special-frontier-theme.mp3"]
        },
        forest_main: {
            key: "forest_main",
            labelEn: "Forest Theme",
            labelEs: "Tema de bosque",
            candidates: ["audio/maps/forest-theme.mp3", "audio/maps/enchanted-forest-alt-theme.mp3"]
        },
        forest_enchanted: {
            key: "forest_enchanted",
            labelEn: "Enchanted Forest Theme",
            labelEs: "Tema de bosque encantado",
            candidates: ["audio/maps/enchanted-forest-alt-theme.mp3", "audio/maps/forest-theme.mp3"]
        },
        cave: {
            key: "cave",
            labelEn: "Cave Theme",
            labelEs: "Tema de cueva",
            candidates: ["audio/maps/cave-theme.mp3", "audio/maps/special-frontier-theme.mp3"]
        },
        water_sky: {
            key: "water_sky",
            labelEn: "Water & Sky Theme",
            labelEs: "Tema de agua y cielo",
            candidates: ["audio/maps/water-sky-theme.mp3", "audio/maps/sky-alt-theme.mp3"]
        },
        tower_mystic: {
            key: "tower_mystic",
            labelEn: "Mystic Tower Theme",
            labelEs: "Tema de torre mística",
            candidates: ["audio/maps/mystic-tower-theme.mp3", "audio/maps/ghost-alt-theme.mp3"]
        },
        volcano_special: {
            key: "volcano_special",
            labelEn: "Volcanic Frontier Theme",
            labelEs: "Tema volcánico de frontera",
            candidates: ["audio/maps/special-frontier-theme.mp3", "audio/maps/cave-theme.mp3"]
        },
        snow: {
            key: "snow",
            labelEn: "Snow Summit Theme",
            labelEs: "Tema de cumbre nevada",
            candidates: ["audio/maps/snow-summit-theme.mp3", "audio/maps/special-frontier-theme.mp3"]
        },
        swamp_ghost: {
            key: "swamp_ghost",
            labelEn: "Swamp Shadow Theme",
            labelEs: "Tema de pantano sombrío",
            candidates: ["audio/maps/ghost-alt-theme.mp3", "audio/maps/special-frontier-theme.mp3"]
        },
        thunder: {
            key: "thunder",
            labelEn: "Thunder Peak Theme",
            labelEs: "Tema de pico trueno",
            candidates: ["audio/maps/thunder-peak-theme.mp3", "audio/maps/special-frontier-theme.mp3"]
        },
        desert: {
            key: "desert",
            labelEn: "Golden Desert Theme",
            labelEs: "Tema de desierto dorado",
            candidates: ["audio/maps/golden-desert-theme.mp3", "audio/maps/special-frontier-theme.mp3"]
        },
        sky: {
            key: "sky",
            labelEn: "Sky Pillar Theme",
            labelEs: "Tema del Pilar del Cielo",
            candidates: ["audio/maps/sky-alt-theme.mp3", "audio/maps/water-sky-theme.mp3"]
        },
        ghost: {
            key: "ghost",
            labelEn: "Ghost Tower Theme",
            labelEs: "Tema de torre fantasma",
            candidates: ["audio/maps/ghost-alt-theme.mp3", "audio/maps/mystic-tower-theme.mp3"]
        }
    };

    const MAPS_AUDIO_ZONE_MAP = {
        kanto_green_forest: "forest_main",
        kanto_rock_cave: "cave",
        kanto_blue_lake: "water_sky",
        kanto_battle_tower: "tower_mystic",

        johto_whisper_forest: "forest_enchanted",
        johto_ember_cavern: "cave",
        johto_silver_lake: "water_sky",
        johto_guardian_tower: "tower_mystic",

        hoenn_rain_forest: "forest_main",
        hoenn_magma_cavern: "volcano_special",
        hoenn_tide_lake: "water_sky",
        hoenn_sky_tower: "sky",

        frontier_snow_summit: "snow",
        frontier_golden_desert: "desert",
        frontier_moon_garden: "forest_enchanted",
        frontier_toxic_swamp: "swamp_ghost",
        frontier_thunder_peak: "thunder",
        frontier_dragon_sanctuary: "volcano_special",
        frontier_ghost_tower: "ghost"
    };

    const SHINY_SFX_CANDIDATES = ["audio/maps/shiny-sfx.mp3"];

    const state = {
        prefs: leerPreferencias(),
        audio: null,
        shinyAudio: null,
        shell: null,
        playBtn: null,
        muteBtn: null,
        volumeInput: null,
        title: null,
        subtitle: null,
        currentTrackKey: "",
        currentTrackMeta: null,
        currentTrackUrl: "",
        currentZoneName: "",
        unlocked: false,
        unlockListenersAttached: false,
        switching: false,
        lastError: "",
        ducking: false
    };

    function getLang() {
        try {
            return typeof getCurrentLang === "function" ? getCurrentLang() : "en";
        } catch (error) {
            return "en";
        }
    }

    function text(en, es) {
        return getLang() === "es" ? es : en;
    }

    function normalizarRuta(ruta = "") {
        const valor = String(ruta || "").trim();
        if (!valor) return "";
        if (/^(https?:)?\/\//i.test(valor) || /^data:/i.test(valor) || /^blob:/i.test(valor)) {
            return valor;
        }
        const limpio = valor.replace(/^\.\//, "");
        return limpio.startsWith("/") ? limpio : `/${limpio}`;
    }

    function normalizarVolumen(valor, fallback = 0.24) {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return fallback;
        return Math.max(0, Math.min(1, numero));
    }

    function leerPreferencias() {
        try {
            const raw = localStorage.getItem(MAPS_AUDIO_PREFS_KEY);
            if (!raw) return { ...MAPS_AUDIO_DEFAULTS };
            const parsed = JSON.parse(raw);
            return {
                enabled: parsed?.enabled !== false,
                muted: Boolean(parsed?.muted),
                volume: normalizarVolumen(parsed?.volume, MAPS_AUDIO_DEFAULTS.volume),
                sfxVolume: normalizarVolumen(parsed?.sfxVolume, MAPS_AUDIO_DEFAULTS.sfxVolume)
            };
        } catch (error) {
            return { ...MAPS_AUDIO_DEFAULTS };
        }
    }

    function guardarPreferencias() {
        try {
            localStorage.setItem(MAPS_AUDIO_PREFS_KEY, JSON.stringify(state.prefs));
        } catch (error) {
            console.warn("No se pudieron guardar las preferencias de audio de Maps:", error);
        }
    }

    function targetVolume() {
        if (!state.prefs.enabled || state.prefs.muted) return 0;
        return normalizarVolumen(state.prefs.volume, MAPS_AUDIO_DEFAULTS.volume);
    }

    function targetSfxVolume() {
        if (!state.prefs.enabled || state.prefs.muted) return 0;
        return normalizarVolumen(state.prefs.sfxVolume, MAPS_AUDIO_DEFAULTS.sfxVolume);
    }

    function ensureAudio() {
        if (state.audio) return state.audio;

        const audio = new Audio();
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = targetVolume();
        audio.playsInline = true;
        audio.addEventListener("play", refreshUI);
        audio.addEventListener("pause", refreshUI);
        state.audio = audio;
        return audio;
    }

    function ensureShinyAudio() {
        if (state.shinyAudio) return state.shinyAudio;
        const audio = new Audio();
        audio.preload = "auto";
        audio.loop = false;
        audio.playsInline = true;
        state.shinyAudio = audio;
        return audio;
    }

    function injectStyles() {
        if (document.getElementById("mapsAudioStyles")) return;

        const style = document.createElement("style");
        style.id = "mapsAudioStyles";
        style.textContent = `
            .maps-audio-shell {
                position: fixed;
                right: 16px;
                bottom: 16px;
                z-index: 1400;
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: min(340px, calc(100vw - 24px));
                padding: 14px;
                border-radius: 20px;
                background: rgba(9, 23, 43, 0.92);
                border: 1px solid rgba(255,255,255,0.10);
                box-shadow: 0 18px 36px rgba(2, 8, 23, 0.35);
                backdrop-filter: blur(12px);
                color: #f8fafc;
                font-family: Arial, sans-serif;
            }
            .maps-audio-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 10px;
            }
            .maps-audio-copy {
                min-width: 0;
                flex: 1 1 auto;
            }
            .maps-audio-kicker {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(59,130,246,0.18);
                color: #bfdbfe;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: .05em;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .maps-audio-title {
                margin: 0;
                font-size: 16px;
                font-weight: 900;
                color: #ffffff;
                line-height: 1.2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .maps-audio-subtitle {
                margin: 4px 0 0;
                font-size: 12px;
                line-height: 1.45;
                color: #cbd5e1;
            }
            .maps-audio-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            .maps-audio-btn {
                border: none;
                cursor: pointer;
                border-radius: 14px;
                min-width: 44px;
                height: 44px;
                padding: 0 12px;
                font-size: 18px;
                font-weight: 800;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
                box-shadow: 0 10px 18px rgba(15, 23, 42, 0.30);
            }
            .maps-audio-btn:hover { transform: translateY(-1px); }
            .maps-audio-btn-main {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: #ffffff;
            }
            .maps-audio-btn-alt {
                background: rgba(255,255,255,0.08);
                color: #ffffff;
            }
            .maps-audio-bottom {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 10px;
            }
            .maps-audio-volume-label,
            .maps-audio-volume-value {
                font-size: 12px;
                font-weight: 800;
                color: #cbd5e1;
            }
            .maps-audio-volume {
                width: 100%;
                accent-color: #60a5fa;
                cursor: pointer;
            }
            @media (max-width: 640px) {
                .maps-audio-shell {
                    left: 12px;
                    right: 12px;
                    bottom: 12px;
                    width: auto;
                }
                .maps-audio-top { flex-direction: column; }
                .maps-audio-actions {
                    width: 100%;
                    justify-content: flex-end;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function buildUI() {
        if (state.shell) return;

        injectStyles();

        const shell = document.createElement("section");
        shell.className = "maps-audio-shell";
        shell.setAttribute("aria-label", "Maps audio controls");
        shell.innerHTML = `
            <div class="maps-audio-top">
                <div class="maps-audio-copy">
                    <span class="maps-audio-kicker">Maps audio</span>
                    <h3 class="maps-audio-title"></h3>
                    <p class="maps-audio-subtitle"></p>
                </div>
                <div class="maps-audio-actions">
                    <button type="button" class="maps-audio-btn maps-audio-btn-main" id="mapsAudioToggle" aria-label="Toggle maps music"></button>
                    <button type="button" class="maps-audio-btn maps-audio-btn-alt" id="mapsAudioMute" aria-label="Mute maps music"></button>
                </div>
            </div>
            <div class="maps-audio-bottom">
                <span class="maps-audio-volume-label"></span>
                <input type="range" class="maps-audio-volume" id="mapsAudioVolume" min="0" max="100" step="1">
                <span class="maps-audio-volume-value"></span>
            </div>
        `;

        document.body.appendChild(shell);
        state.shell = shell;
        state.playBtn = shell.querySelector("#mapsAudioToggle");
        state.muteBtn = shell.querySelector("#mapsAudioMute");
        state.volumeInput = shell.querySelector("#mapsAudioVolume");
        state.title = shell.querySelector(".maps-audio-title");
        state.subtitle = shell.querySelector(".maps-audio-subtitle");

        state.playBtn?.addEventListener("click", async () => {
            state.prefs.enabled = !state.prefs.enabled;
            guardarPreferencias();

            if (!state.prefs.enabled) {
                await fadeOutAndPause();
                refreshUI();
                return;
            }

            await unlockAndMaybePlay();
            refreshUI();
        });

        state.muteBtn?.addEventListener("click", async () => {
            state.prefs.muted = !state.prefs.muted;
            guardarPreferencias();

            if (state.audio) {
                if (state.prefs.muted) {
                    await fadeTo(0, 180);
                } else if (state.prefs.enabled) {
                    if (state.audio.paused && state.currentTrackMeta) {
                        await unlockAndMaybePlay();
                    } else {
                        await fadeTo(targetVolume(), 180);
                    }
                }
            }
            refreshUI();
        });

        state.volumeInput?.addEventListener("input", (event) => {
            const value = Number(event.target?.value || 0) / 100;
            state.prefs.volume = normalizarVolumen(value, MAPS_AUDIO_DEFAULTS.volume);
            guardarPreferencias();

            if (state.audio && state.prefs.enabled && !state.prefs.muted) {
                state.audio.volume = targetVolume();
            }
            refreshUI();
        });

        document.addEventListener("languageChanged", refreshUI);
        attachUnlockListeners();
        refreshUI();
    }

    function attachUnlockListeners() {
        if (state.unlockListenersAttached) return;
        ["pointerdown", "touchstart", "keydown", "click"].forEach((eventName) => {
            window.addEventListener(eventName, handleUnlockGesture, { passive: true, capture: true });
        });
        state.unlockListenersAttached = true;
    }

    function getZoneName(zona = null) {
        if (!zona) return text("Maps ambience ready", "Ambiente de Maps listo");
        try {
            if (typeof obtenerNombreZonaTraducido === "function") {
                return obtenerNombreZonaTraducido(zona) || text("Maps ambience ready", "Ambiente de Maps listo");
            }
        } catch (error) {}
        return String(zona?.nombre || text("Maps ambience ready", "Ambiente de Maps listo"));
    }

    function resolveZoneCode(zona = null) {
        return String(zona?.codigo || "").trim().toLowerCase();
    }

    function resolveBiomeKey(zona = null) {
        try {
            if (typeof obtenerVisualZonaMaps === "function") {
                return String(obtenerVisualZonaMaps(zona)?.clave || "base").toLowerCase();
            }
        } catch (error) {}

        const valor = String(zona?.tema_visual || zona?.tipo_ambiente || zona?.nombre || "").toLowerCase();
        if (/bosque|forest/.test(valor)) return "bosque";
        if (/cueva|cave|cavern|ruins/.test(valor)) return "cueva";
        if (/lago|lake|reef|coral|water|whirlpool/.test(valor)) return "lago";
        if (/torre|tower/.test(valor)) return "torre";
        if (/volcan|volcano|magma|lava|fire/.test(valor)) return "volcan";
        if (/snow|nieve|ice/.test(valor)) return "nieve";
        if (/swamp|pantano/.test(valor)) return "pantano";
        if (/ghost|fantasma/.test(valor)) return "fantasma";
        if (/electric|electrico|eléctrico|thunder/.test(valor)) return "electrico";
        if (/desert|desierto/.test(valor)) return "desierto";
        if (/sky|cielo/.test(valor)) return "cielo";
        return "base";
    }

    function resolveTrackPresetKey(zona = null) {
        const zoneCode = resolveZoneCode(zona);
        if (zoneCode && MAPS_AUDIO_ZONE_MAP[zoneCode]) {
            return MAPS_AUDIO_ZONE_MAP[zoneCode];
        }

        const biomeKey = resolveBiomeKey(zona);
        const byBiome = {
            bosque: "forest_main",
            cueva: "cave",
            lago: "water_sky",
            torre: "tower_mystic",
            volcan: "volcano_special",
            nieve: "snow",
            pantano: "swamp_ghost",
            fantasma: "ghost",
            electrico: "thunder",
            desierto: "desert",
            cielo: "sky",
            base: "base",
            default: "base"
        };

        return byBiome[biomeKey] || "base";
    }

    function buildTrackMeta(zona = null) {
        const presetKey = resolveTrackPresetKey(zona);
        const preset = MAPS_AUDIO_TRACKS[presetKey] || MAPS_AUDIO_TRACKS.base;

        const customCandidates = [
            zona?.audio_url,
            zona?.audio_src,
            zona?.tema_audio,
            zona?.musica,
            zona?.music_url,
            zona?.music_src
        ].map(normalizarRuta).filter(Boolean);

        const candidates = [...new Set([...customCandidates, ...preset.candidates.map(normalizarRuta)])];

        return {
            key: preset.key,
            labelEn: preset.labelEn,
            labelEs: preset.labelEs,
            candidates
        };
    }

    function waitForAudioReady(audio) {
        return new Promise((resolve, reject) => {
            let done = false;
            let timeoutId = 0;

            const cleanup = () => {
                audio.removeEventListener("canplaythrough", onReady);
                audio.removeEventListener("loadedmetadata", onReady);
                audio.removeEventListener("error", onError);
                window.clearTimeout(timeoutId);
            };

            const finish = (callback) => {
                if (done) return;
                done = true;
                cleanup();
                callback();
            };

            const onReady = () => finish(resolve);
            const onError = () => finish(() => reject(new Error("AUDIO_LOAD_ERROR")));

            audio.addEventListener("canplaythrough", onReady);
            audio.addEventListener("loadedmetadata", onReady);
            audio.addEventListener("error", onError);
            timeoutId = window.setTimeout(() => finish(() => reject(new Error("AUDIO_LOAD_TIMEOUT"))), 3200);
        });
    }

    async function fadeTo(target, duration = 220) {
        const audio = ensureAudio();
        const start = Number(audio.volume || 0);
        const end = Math.max(0, Math.min(1, Number(target || 0)));
        const diff = end - start;

        if (Math.abs(diff) < 0.01 || duration <= 0) {
            audio.volume = end;
            return;
        }

        const steps = Math.max(1, Math.round(duration / 16));
        for (let i = 1; i <= steps; i++) {
            audio.volume = start + ((diff * i) / steps);
            await new Promise(resolve => window.setTimeout(resolve, duration / steps));
        }
        audio.volume = end;
    }

    async function fadeOutAndPause() {
        if (!state.audio) return;
        try { await fadeTo(0, 180); } catch (error) {}
        state.audio.pause();
    }

    async function tryPlayCandidates(meta) {
        const audio = ensureAudio();
        state.lastError = "";

        for (const candidate of meta.candidates) {
            try {
                if (!candidate) continue;
                audio.pause();
                audio.src = candidate;
                audio.load();
                await waitForAudioReady(audio);
                audio.volume = 0;
                await audio.play();
                await fadeTo(targetVolume(), 260);
                state.currentTrackUrl = candidate;
                return true;
            } catch (error) {
                state.lastError = String(error?.message || error || "AUDIO_LOAD_ERROR");
            }
        }

        state.currentTrackUrl = "";
        return false;
    }

    async function switchTrack(meta) {
        if (!meta || state.switching) return;
        state.switching = true;
        try {
            if (state.audio && !state.audio.paused) {
                await fadeOutAndPause();
            }
            await tryPlayCandidates(meta);
        } finally {
            state.switching = false;
            refreshUI();
        }
    }

    async function unlockAndMaybePlay() {
        state.unlocked = true;

        if (!state.prefs.enabled || !state.currentTrackMeta) {
            refreshUI();
            return;
        }

        if (state.audio && state.currentTrackUrl && state.audio.src && state.audio.src.includes(state.currentTrackUrl)) {
            try {
                await state.audio.play();
                await fadeTo(targetVolume(), 180);
            } catch (error) {
                await switchTrack(state.currentTrackMeta);
            }
            refreshUI();
            return;
        }

        await switchTrack(state.currentTrackMeta);
    }

    function removeUnlockListeners() {
        if (!state.unlockListenersAttached) return;
        ["pointerdown", "touchstart", "keydown", "click"].forEach((eventName) => {
            window.removeEventListener(eventName, handleUnlockGesture, true);
        });
        state.unlockListenersAttached = false;
    }

    async function handleUnlockGesture() {
        if (!state.prefs.enabled) {
            state.unlocked = true;
            refreshUI();
            return;
        }

        if (!state.currentTrackMeta) {
            return;
        }

        try {
            await unlockAndMaybePlay();
            removeUnlockListeners();
        } catch (error) {
            state.lastError = String(error?.message || error || "AUDIO_UNLOCK_ERROR");
            refreshUI();
        }
    }

    async function duckMusicForSfx() {
        if (!state.audio || state.audio.paused || state.prefs.muted || !state.prefs.enabled) return;
        if (state.ducking) return;
        state.ducking = true;
        try {
            await fadeTo(Math.max(0.04, targetVolume() * 0.35), 120);
        } catch (error) {}
    }

    async function restoreMusicAfterSfx() {
        if (!state.audio || state.audio.paused || state.prefs.muted || !state.prefs.enabled) {
            state.ducking = false;
            return;
        }
        try {
            await fadeTo(targetVolume(), 220);
        } catch (error) {}
        state.ducking = false;
    }

    async function playShinySfx() {
        if (!state.prefs.enabled || state.prefs.muted) return false;
        state.unlocked = true;

        const audio = ensureShinyAudio();
        const previousTime = Number(audio.currentTime || 0);
        void previousTime;

        for (const candidate of SHINY_SFX_CANDIDATES.map(normalizarRuta)) {
            try {
                if (!candidate) continue;
                await duckMusicForSfx();
                audio.pause();
                audio.src = candidate;
                audio.currentTime = 0;
                audio.volume = targetSfxVolume();
                audio.load();
                await waitForAudioReady(audio);
                await audio.play();
                window.setTimeout(() => { restoreMusicAfterSfx(); }, 1100);
                return true;
            } catch (error) {
                state.lastError = String(error?.message || error || "SFX_LOAD_ERROR");
            }
        }

        restoreMusicAfterSfx();
        refreshUI();
        return false;
    }

    function refreshUI() {
        buildUI();

        const currentMeta = state.currentTrackMeta || MAPS_AUDIO_TRACKS.base;
        const currentTrackLabel = getLang() === "es" ? currentMeta.labelEs : currentMeta.labelEn;
        const zoneLabel = state.currentZoneName || text("Maps ambience ready", "Ambiente de Maps listo");

        let statusText = "";
        if (!state.prefs.enabled) {
            statusText = text("Music is off. Press ▶ to enable it.", "La música está apagada. Pulsa ▶ para activarla.");
        } else if (!state.currentTrackUrl && state.lastError) {
            statusText = text(
                "No track file was found yet. Check your MP3 names in /audio/maps/.",
                "Aún no se encontró la pista. Revisa los nombres MP3 en /audio/maps/."
            );
        } else if (!state.unlocked) {
            statusText = text("Tap anywhere to unlock music", "Toca cualquier parte para activar la música");
        } else if (state.prefs.muted) {
            statusText = text("Muted while you explore.", "Silenciada mientras exploras.");
        } else if (state.audio && !state.audio.paused && state.currentTrackUrl) {
            statusText = text(`Now playing for ${zoneLabel}.`, `Reproduciendo para ${zoneLabel}.`);
        } else {
            statusText = text(`Ready to play for ${zoneLabel}.`, `Lista para sonar en ${zoneLabel}.`);
        }

        if (state.title) state.title.textContent = currentTrackLabel;
        if (state.subtitle) state.subtitle.textContent = statusText;

        if (state.playBtn) {
            state.playBtn.textContent = state.prefs.enabled ? "❚❚" : "▶";
            state.playBtn.title = state.prefs.enabled
                ? text("Pause ambient music", "Pausar música ambiental")
                : text("Enable ambient music", "Activar música ambiental");
            state.playBtn.setAttribute("aria-label", state.playBtn.title);
        }

        if (state.muteBtn) {
            state.muteBtn.textContent = state.prefs.muted ? "🔇" : "🔊";
            state.muteBtn.title = state.prefs.muted
                ? text("Unmute ambient music", "Activar sonido ambiental")
                : text("Mute ambient music", "Silenciar música ambiental");
            state.muteBtn.setAttribute("aria-label", state.muteBtn.title);
        }

        if (state.volumeInput) {
            state.volumeInput.value = String(Math.round(normalizarVolumen(state.prefs.volume, MAPS_AUDIO_DEFAULTS.volume) * 100));
            state.volumeInput.disabled = !state.prefs.enabled;
        }

        const volumeLabel = state.shell?.querySelector(".maps-audio-volume-label");
        const volumeValue = state.shell?.querySelector(".maps-audio-volume-value");
        if (volumeLabel) volumeLabel.textContent = text("Volume", "Volumen");
        if (volumeValue) volumeValue.textContent = `${Math.round(normalizarVolumen(state.prefs.volume, MAPS_AUDIO_DEFAULTS.volume) * 100)}%`;
    }

    function handleZoneChange(zona = null) {
        buildUI();

        state.currentZoneName = getZoneName(zona);
        const nextMeta = buildTrackMeta(zona);
        const trackChanged = state.currentTrackKey !== nextMeta.key;

        state.currentTrackKey = nextMeta.key;
        state.currentTrackMeta = nextMeta;
        refreshUI();

        if (!state.prefs.enabled) return;
        if (!state.unlocked) return;

        if (!trackChanged && state.audio && state.currentTrackUrl) {
            if (state.audio.paused && !state.prefs.muted) {
                unlockAndMaybePlay();
            }
            return;
        }

        switchTrack(nextMeta);
    }

    document.addEventListener("DOMContentLoaded", () => {
        buildUI();
        refreshUI();
    });

    window.MapsAudio = {
        handleZoneChange,
        refreshUI,
        unlockAndMaybePlay,
        playShinySfx,
        getTrackKeyForZone: resolveTrackPresetKey
    };
})();
