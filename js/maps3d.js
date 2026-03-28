import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const viewport = document.getElementById('maps3dViewport');
const hudPosition = document.getElementById('hudPosition');
const hudSpeed = document.getElementById('hudSpeed');
const hudTerrain = document.getElementById('hudTerrain');
const hudCamera = document.getElementById('hudCamera');
const hudMessage = document.getElementById('hudMessage');
const encounterModal = document.getElementById('encounterModal');
const encounterTitle = document.getElementById('encounterTitle');
const encounterText = document.getElementById('encounterText');
const btnCloseEncounter = document.getElementById('btnCloseEncounter');
const btnResetPlayer = document.getElementById('btnResetPlayer');
const btnToggleEncounters = document.getElementById('btnToggleEncounters');
const btnToggleDebug = document.getElementById('btnToggleDebug');

const WORLD_SIZE = 92;
const PLAYER_RADIUS = 1.15;
const BASE_SPEED = 7.2;
const RUN_MULTIPLIER = 1.55;
const CAMERA_HEIGHT = 9;
const CAMERA_DISTANCE = 11.5;
const ENCOUNTER_COOLDOWN_MS = 3500;
const PLAYER_MODEL_URL = './assets/3d/cute-character.glb';
const PLAYER_TARGET_HEIGHT = 4.8;

const wildPokemons = [
    'Bulbasaur', 'Pidgey', 'Oddish', 'Pikachu', 'Growlithe',
    'Poliwag', 'Bellsprout', 'Psyduck', 'Eevee', 'Rhyhorn'
];

const keyState = Object.create(null);
const colliders = [];
const grassZones = [];
let encountersEnabled = true;
let debugEnabled = false;
let encounterLocked = false;
let lastEncounterAt = 0;
let activeTerrain = 'Path';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe9ff);
scene.fog = new THREE.Fog(0xbfe9ff, 42, 110);

const camera = new THREE.PerspectiveCamera(58, viewport.clientWidth / viewport.clientHeight, 0.1, 300);
camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x5d89a8, 1.15);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.45);
sunLight.position.set(22, 34, 16);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -55;
sunLight.shadow.camera.right = 55;
sunLight.shadow.camera.top = 55;
sunLight.shadow.camera.bottom = -55;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xbde6ff, 0.45);
fillLight.position.set(-18, 16, -10);
scene.add(fillLight);

function makeMaterial(color) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        metalness: 0.03
    });
}

function createGround() {
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1),
        new THREE.MeshStandardMaterial({
            color: 0x86c36b,
            roughness: 1,
            metalness: 0
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const pathMaterial = new THREE.MeshStandardMaterial({
        color: 0xd9c39b,
        roughness: 1,
        metalness: 0
    });

    const northSouthPath = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, WORLD_SIZE - 12), pathMaterial);
    northSouthPath.position.set(0, 0.06, 0);
    northSouthPath.receiveShadow = true;
    scene.add(northSouthPath);

    const eastWestPath = new THREE.Mesh(new THREE.BoxGeometry(WORLD_SIZE - 18, 0.12, 8), pathMaterial);
    eastWestPath.position.set(0, 0.065, 6);
    eastWestPath.receiveShadow = true;
    scene.add(eastWestPath);

    addGrassPatch(-24, -14, 20, 18);
    addGrassPatch(25, -12, 22, 17);
    addGrassPatch(-27, 19, 18, 16);
    addGrassPatch(22, 22, 20, 15);
}

function addGrassPatch(x, z, width, depth) {
    const patch = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.08, depth),
        new THREE.MeshStandardMaterial({
            color: 0x4da84f,
            roughness: 1,
            metalness: 0
        })
    );
    patch.position.set(x, 0.04, z);
    patch.receiveShadow = true;
    scene.add(patch);

    grassZones.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2,
        mesh: patch
    });

    for (let i = 0; i < Math.floor((width * depth) / 14); i += 1) {
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.65 + Math.random() * 0.45, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x2d8f38, roughness: 1 })
        );
        blade.position.set(
            x + (Math.random() - 0.5) * (width - 1.6),
            0.25,
            z + (Math.random() - 0.5) * (depth - 1.6)
        );
        blade.rotation.y = Math.random() * Math.PI;
        blade.castShadow = true;
        scene.add(blade);
    }
}

function addTree(x, z, scale = 1) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55 * scale, 0.72 * scale, 3.2 * scale, 10),
        makeMaterial(0x8b5a2b)
    );
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.position.y = 1.6 * scale;
    tree.add(trunk);

    const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(2.2 * scale, 14, 14),
        makeMaterial(0x2f8f4e)
    );
    foliage.castShadow = true;
    foliage.position.y = 4.35 * scale;
    tree.add(foliage);

    tree.position.set(x, 0, z);
    scene.add(tree);

    const half = 1.6 * scale;
    colliders.push({
        minX: x - half,
        maxX: x + half,
        minZ: z - half,
        maxZ: z + half,
        debugMesh: null
    });
}

function addRock(x, z, sx = 1, sy = 1, sz = 1) {
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1),
        makeMaterial(0x8d99a6)
    );
    rock.position.set(x, 0.8 * sy, z);
    rock.scale.set(sx, sy, sz);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);

    colliders.push({
        minX: x - sx * 1.1,
        maxX: x + sx * 1.1,
        minZ: z - sz * 1.1,
        maxZ: z + sz * 1.1,
        debugMesh: null
    });
}

function addBuilding(x, z, width, depth, color = 0xf6ead3) {
    const building = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 5.5, depth),
        makeMaterial(color)
    );
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 2.75;
    building.add(body);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(width, depth) * 0.46, 2.8, 4),
        makeMaterial(0xcc554d)
    );
    roof.position.y = 6.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    building.add(roof);

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.2, 0.18),
        makeMaterial(0x654321)
    );
    door.position.set(0, 1.2, depth / 2 + 0.12);
    building.add(door);

    building.position.set(x, 0, z);
    scene.add(building);

    colliders.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2,
        debugMesh: null
    });
}

function populateWorld() {
    createGround();

    addBuilding(0, -29, 11, 8.5, 0xf4f0dc);
    addBuilding(-31, 2, 8.5, 7, 0xe6f5ea);
    addBuilding(31, 4, 8.5, 7, 0xe7eef9);

    [
        [-36, -28, 1.0], [-29, -22, 1.2], [-22, -32, 0.95],
        [35, -24, 1.1], [27, -32, 0.9], [18, -26, 1.2],
        [-37, 30, 1.05], [-29, 36, 0.95], [-18, 25, 1.15],
        [20, 33, 1.0], [29, 28, 1.15], [36, 36, 0.9]
    ].forEach(([x, z, scale]) => addTree(x, z, scale));

    addRock(-12, -18, 1.4, 0.9, 1.2);
    addRock(13, -16, 1.1, 0.85, 1.2);
    addRock(-11, 18, 1.2, 0.95, 0.9);
    addRock(11, 20, 1.3, 0.95, 1.25);
}

function createFallbackPlayerVisual() {
    const fallback = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 1.6, 6, 12), makeMaterial(0x1d4ed8));
    body.position.y = 2.05;
    body.castShadow = true;
    fallback.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 20), makeMaterial(0xf6c6a9));
    head.position.y = 3.5;
    head.castShadow = true;
    fallback.add(head);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.32, 24), makeMaterial(0xd62839));
    cap.position.y = 4.02;
    cap.castShadow = true;
    fallback.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.5), makeMaterial(0x8c1120));
    visor.position.set(0, 3.86, 0.5);
    visor.castShadow = true;
    fallback.add(visor);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.52), makeMaterial(0x334155));
    backpack.position.set(0, 2.05, -0.68);
    backpack.castShadow = true;
    fallback.add(backpack);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.25, 0.42), makeMaterial(0x1f2937));
    const rightLeg = leftLeg.clone();
    leftLeg.position.set(-0.27, 0.68, 0);
    rightLeg.position.set(0.27, 0.68, 0);
    leftLeg.castShadow = true;
    rightLeg.castShadow = true;
    fallback.add(leftLeg);
    fallback.add(rightLeg);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.2, 0.34), makeMaterial(0xf6c6a9));
    const rightArm = leftArm.clone();
    leftArm.position.set(-1.02, 2.15, 0);
    rightArm.position.set(1.02, 2.15, 0);
    leftArm.castShadow = true;
    rightArm.castShadow = true;
    fallback.add(leftArm);
    fallback.add(rightArm);

    fallback.userData.body = body;
    fallback.userData.leftLeg = leftLeg;
    fallback.userData.rightLeg = rightLeg;
    fallback.userData.leftArm = leftArm;
    fallback.userData.rightArm = rightArm;

    return fallback;
}

function fitModelToGround(root, targetHeight = PLAYER_TARGET_HEIGHT) {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    if (size.y > 0.0001) {
        const scale = targetHeight / size.y;
        root.scale.setScalar(scale);
        box.setFromObject(root);
        box.getSize(size);
        box.getCenter(center);
    }

    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box.min.y;
}

function createPlayer() {
    const player = new THREE.Group();
    const modelPivot = new THREE.Group();
    const fallbackVisual = createFallbackPlayerVisual();

    modelPivot.add(fallbackVisual);
    player.add(modelPivot);

    player.userData.modelPivot = modelPivot;
    player.userData.fallbackVisual = fallbackVisual;
    player.userData.activeVisual = fallbackVisual;
    player.userData.modelLoaded = false;

    player.position.set(0, 0, 16);
    player.rotation.y = Math.PI;
    scene.add(player);

    return player;
}

function loadPlayerModel(player) {
    const loader = new GLTFLoader();

    loader.load(
        PLAYER_MODEL_URL,
        (gltf) => {
            const modelRoot = gltf.scene || gltf.scenes?.[0];
            if (!modelRoot) {
                hudMessage.textContent = 'El .glb cargó, pero no trajo escena visible.';
                return;
            }

            modelRoot.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (Array.isArray(node.material)) {
                        node.material.forEach((material) => {
                            material.transparent = false;
                        });
                    } else if (node.material) {
                        node.material.transparent = false;
                    }
                }
            });

            fitModelToGround(modelRoot, PLAYER_TARGET_HEIGHT);
            player.userData.modelPivot.clear();
            player.userData.modelPivot.add(modelRoot);
            player.userData.activeVisual = modelRoot;
            player.userData.modelLoaded = true;
            hudMessage.textContent = 'Modelo GLB cargado correctamente.';
        },
        undefined,
        (error) => {
            console.error('No se pudo cargar el modelo GLB:', error);
            hudMessage.textContent = 'No se pudo cargar el GLB. Se mantiene el personaje de prueba.';
        }
    );
}

const player = createPlayer();
populateWorld();
loadPlayerModel(player);

const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const moveDirection = new THREE.Vector3();
const worldDirection = new THREE.Vector3();

const debugGroup = new THREE.Group();
scene.add(debugGroup);

function updateDebugMeshes() {
    debugGroup.clear();
    if (!debugEnabled) return;

    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff4d4f, wireframe: true });
    colliders.forEach((collider) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(collider.maxX - collider.minX, 3.5, collider.maxZ - collider.minZ),
            boxMaterial
        );
        box.position.set(
            (collider.minX + collider.maxX) / 2,
            1.75,
            (collider.minZ + collider.maxZ) / 2
        );
        debugGroup.add(box);
    });

    const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    grassZones.forEach((zone) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(zone.maxX - zone.minX, 0.6, zone.maxZ - zone.minZ),
            grassMaterial
        );
        box.position.set(
            (zone.minX + zone.maxX) / 2,
            0.4,
            (zone.minZ + zone.maxZ) / 2
        );
        debugGroup.add(box);
    });
}

function clampToWorld(value) {
    return Math.max(-(WORLD_SIZE / 2) + 2, Math.min((WORLD_SIZE / 2) - 2, value));
}

function intersectsCollider(x, z) {
    return colliders.some((collider) => {
        return (
            x + PLAYER_RADIUS > collider.minX &&
            x - PLAYER_RADIUS < collider.maxX &&
            z + PLAYER_RADIUS > collider.minZ &&
            z - PLAYER_RADIUS < collider.maxZ
        );
    });
}

function movePlayer(delta) {
    const forward = Number(keyState['KeyW'] || keyState['ArrowUp']) - Number(keyState['KeyS'] || keyState['ArrowDown']);
    const strafe = Number(keyState['KeyD'] || keyState['ArrowRight']) - Number(keyState['KeyA'] || keyState['ArrowLeft']);

    moveDirection.set(strafe, 0, -forward);

    if (moveDirection.lengthSq() === 0 || encounterLocked) {
        animatePlayer(0);
        hudSpeed.textContent = '0.0';
        return;
    }

    moveDirection.normalize();
    const speed = BASE_SPEED * (keyState['ShiftLeft'] || keyState['ShiftRight'] ? RUN_MULTIPLIER : 1);
    hudSpeed.textContent = speed.toFixed(1);

    worldDirection.copy(moveDirection);
    worldDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    worldDirection.y = 0;
    worldDirection.normalize();

    const targetRotation = Math.atan2(worldDirection.x, worldDirection.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRotation, Math.min(1, delta * 10));

    const nextX = clampToWorld(player.position.x + worldDirection.x * speed * delta);
    const nextZ = clampToWorld(player.position.z + worldDirection.z * speed * delta);

    const canMoveX = !intersectsCollider(nextX, player.position.z);
    const canMoveZ = !intersectsCollider(player.position.x, nextZ);

    if (canMoveX) player.position.x = nextX;
    if (canMoveZ) player.position.z = nextZ;

    animatePlayer(speed);
}

function animatePlayer(speed) {
    const moving = speed > 0.01 && !encounterLocked;
    const time = performance.now() * 0.008;
    const swing = moving ? Math.sin(time * 1.8) * 0.7 : 0;
    const bob = moving ? Math.abs(Math.sin(time * 2.4)) * 0.12 : 0;

    if (player.userData.modelLoaded) {
        player.userData.modelPivot.position.y = bob * 0.35;
        player.userData.modelPivot.rotation.x = moving ? Math.sin(time * 0.9) * 0.04 : 0;
        player.userData.modelPivot.rotation.z = moving ? Math.sin(time * 1.8) * 0.03 : 0;
        return;
    }

    const fallbackVisual = player.userData.fallbackVisual;
    fallbackVisual.userData.leftLeg.rotation.x = swing;
    fallbackVisual.userData.rightLeg.rotation.x = -swing;
    fallbackVisual.userData.leftArm.rotation.x = -swing * 0.8;
    fallbackVisual.userData.rightArm.rotation.x = swing * 0.8;
    fallbackVisual.userData.body.position.y = 2.05 + bob;
}

function updateCamera(delta) {
    const behindOffset = new THREE.Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    behindOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);

    desiredCameraPosition.copy(player.position).add(behindOffset);
    camera.position.lerp(desiredCameraPosition, Math.min(1, delta * 3.4));

    cameraTarget.copy(player.position);
    cameraTarget.y += 2.3;
    camera.lookAt(cameraTarget);

    hudCamera.textContent = 'Follow';
}

function getCurrentGrassZone() {
    return grassZones.find((zone) => {
        return (
            player.position.x >= zone.minX &&
            player.position.x <= zone.maxX &&
            player.position.z >= zone.minZ &&
            player.position.z <= zone.maxZ
        );
    }) || null;
}

function maybeTriggerEncounter() {
    if (!encountersEnabled || encounterLocked) return;

    const zone = getCurrentGrassZone();
    activeTerrain = zone ? 'Grass' : 'Path';
    hudTerrain.textContent = activeTerrain;

    if (!zone) return;
    if (Date.now() - lastEncounterAt < ENCOUNTER_COOLDOWN_MS) return;

    const moving = moveDirection.lengthSq() > 0;
    if (!moving) return;

    const chance = keyState['ShiftLeft'] || keyState['ShiftRight'] ? 0.02 : 0.012;
    if (Math.random() > chance) return;

    lastEncounterAt = Date.now();
    triggerEncounter();
}

function triggerEncounter() {
    encounterLocked = true;

    const pokemon = wildPokemons[Math.floor(Math.random() * wildPokemons.length)];
    const level = 3 + Math.floor(Math.random() * 14);
    const shiny = Math.random() < 0.08;

    encounterTitle.textContent = shiny
        ? `✨ ¡${pokemon} shiny apareció!`
        : `¡${pokemon} salvaje apareció!`;

    encounterText.textContent = shiny
        ? `Nivel ${level}. Esta versión rara podría conectarse luego a tu flujo real de captura.`
        : `Nivel ${level}. Este modal es solo de prueba para validar el flujo de encuentros 3D.`;

    encounterModal.classList.remove('hidden');
    encounterModal.setAttribute('aria-hidden', 'false');
    hudMessage.textContent = shiny
        ? `Encuentro shiny detectado: ${pokemon}`
        : `Encuentro salvaje detectado: ${pokemon}`;
}

function closeEncounter() {
    encounterLocked = false;
    encounterModal.classList.add('hidden');
    encounterModal.setAttribute('aria-hidden', 'true');
    hudMessage.textContent = 'Explora la zona y entra en la hierba alta.';
}

function resetPlayer() {
    player.position.set(0, 0, 16);
    player.rotation.y = Math.PI;
    encounterLocked = false;
    closeEncounter();
    hudMessage.textContent = 'Posición reiniciada correctamente.';
}

function updateHud() {
    hudPosition.textContent = `${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}`;
    hudTerrain.textContent = activeTerrain;
}

function recenterCameraInstant() {
    const behindOffset = new THREE.Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    behindOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    camera.position.copy(player.position).add(behindOffset);
    cameraTarget.copy(player.position);
    cameraTarget.y += 2.3;
    camera.lookAt(cameraTarget);
}

function tick() {
    const delta = Math.min(clock.getDelta(), 0.05);
    movePlayer(delta);
    updateCamera(delta);
    maybeTriggerEncounter();
    updateHud();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

window.addEventListener('keydown', (event) => {
    if ([
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'
    ].includes(event.code)) {
        event.preventDefault();
    }

    keyState[event.code] = true;

    if (event.code === 'KeyC') {
        recenterCameraInstant();
        hudMessage.textContent = 'Cámara centrada sobre el personaje.';
    }

    if (event.code === 'KeyR') {
        resetPlayer();
    }
});

window.addEventListener('keyup', (event) => {
    keyState[event.code] = false;
});

btnCloseEncounter?.addEventListener('click', closeEncounter);
btnResetPlayer?.addEventListener('click', resetPlayer);

btnToggleEncounters?.addEventListener('click', () => {
    encountersEnabled = !encountersEnabled;
    btnToggleEncounters.textContent = `Encuentros: ${encountersEnabled ? 'ON' : 'OFF'}`;
    hudMessage.textContent = encountersEnabled
        ? 'Encuentros activados. Entra en la hierba alta.'
        : 'Encuentros desactivados para prueba libre.';
});

btnToggleDebug?.addEventListener('click', () => {
    debugEnabled = !debugEnabled;
    btnToggleDebug.textContent = `Debug: ${debugEnabled ? 'ON' : 'OFF'}`;
    updateDebugMeshes();
    hudMessage.textContent = debugEnabled
        ? 'Debug activado. Ahora ves colisiones y zonas de hierba.'
        : 'Debug desactivado.';
});

hudMessage.textContent = 'Cargando personaje GLB...';
updateDebugMeshes();
recenterCameraInstant();
tick();
