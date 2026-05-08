// main.js - Bootstrap, Three.js scene, game loop
import * as THREE from 'three';
import { GAME, GRID, TOWERS, ENEMIES, COLORS } from './config.js';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { buildPathMesh, buildPathWorldPoints } from './path.js';
import { generatePathWaypoints } from './path-gen.js';
import { buildVoxelGroup } from './voxel-models.js';
import { GameState } from './game.js';
import { EnemyManager } from './enemy.js';
import { TowerManager } from './tower.js';
import { ProjectileManager } from './projectile.js';
import { ParticleSystem } from './particles.js';
import { Audio } from './audio.js';
import { InputManager } from './input.js';
import { UI } from './ui.js';

// Initialize
const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const scene = renderer.scene;

const grid = new Grid();
const audio = new Audio();
const particles = new ParticleSystem(scene);
const enemyManager = new EnemyManager(scene, particles, audio);
const towerManager = new TowerManager(scene, particles, audio);
const projectileManager = new ProjectileManager(scene, particles, enemyManager);
const input = new InputManager(canvas, renderer.camera);
const ui = new UI();
const gameState = new GameState();
projectileManager.gameState = gameState;
enemyManager.gameState = gameState;
enemyManager.onBossKill = () => renderer.shake(0.5, 0.4);
enemyManager.onDamage = (enemy, amount, isCrit) => {
  ui.spawnDamageNumber(enemy.position, amount, isCrit);
};
enemyManager.onKill = (enemy) => {
  particles.goldKill(enemy.position, enemy.isBoss);
};

ui.camera = renderer.camera;

// Build static scene: grid overlay, base crystal, hover mesh.
// Path + terrain are seed-dependent and (re)built by setupPath().
const gridOverlay = grid.buildGridOverlay();
scene.add(gridOverlay);

scene.add(input.hoverMesh);

// Range preview ring for tower placement.
const placementRangeGeo = new THREE.RingGeometry(0.95, 1, 48);
const placementRangeMat = new THREE.MeshBasicMaterial({
  color: 0x44ffcc,
  transparent: true,
  opacity: 0,
  side: THREE.DoubleSide,
});
const placementRangeMesh = new THREE.Mesh(placementRangeGeo, placementRangeMat);
placementRangeMesh.rotation.x = -Math.PI / 2;
placementRangeMesh.position.y = GRID.TERRAIN_HEIGHT + 0.025;
placementRangeMesh.visible = false;
scene.add(placementRangeMesh);

function setPlacementRange(type, col, row) {
  if (!type || col < 0 || col >= GRID.COLS || row < 0 || row >= GRID.ROWS) {
    placementRangeMesh.visible = false;
    return;
  }
  const baseRange = TOWERS[type].range;
  const range = baseRange + gameState.run.rangeBonus;
  placementRangeMesh.visible = true;
  placementRangeMesh.position.x = col * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
  placementRangeMesh.position.z = row * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
  placementRangeMesh.scale.setScalar(range);
  placementRangeMat.color.setHex(TOWERS[type].color);
  // Pulse opacity gently
  const t = performance.now() / 1000;
  placementRangeMat.opacity = 0.18 + Math.sin(t * 2.5) * 0.06;
}

const baseCrystal = buildVoxelGroup('base_crystal');
baseCrystal.position.y = GRID.TERRAIN_HEIGHT;
scene.add(baseCrystal);

let terrainMesh = null;
let pathMesh = null;

// Generate the path from the current run's seeded RNG and rebuild every
// scene asset that depends on it: grid path-cell flags, terrain mesh
// (excludes path tiles), path mesh, enemy waypoints, base crystal position.
function setupPath() {
  const waypoints = generatePathWaypoints(gameState.rng, GRID.COLS, GRID.ROWS);
  grid.rebuildPath(waypoints);

  if (terrainMesh) scene.remove(terrainMesh);
  terrainMesh = grid.buildTerrainMesh();
  scene.add(terrainMesh);

  if (pathMesh) scene.remove(pathMesh);
  pathMesh = buildPathMesh(waypoints);
  scene.add(pathMesh);

  const worldPoints = buildPathWorldPoints(waypoints);
  enemyManager.pathPoints = worldPoints;

  const basePos = worldPoints[worldPoints.length - 1];
  baseCrystal.position.set(basePos.x, GRID.TERRAIN_HEIGHT, basePos.z);
}

setupPath();

// Ambient sparkles around the map
const sparkleMeshes = [];
for (let i = 0; i < 20; i++) {
  const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  const mat = new THREE.MeshBasicMaterial({
    color: [COLORS.NEON_CYAN, COLORS.NEON_MAGENTA, COLORS.NEON_GOLD][i % 3],
    transparent: true,
    opacity: 0.6,
  });
  const sparkle = new THREE.Mesh(geo, mat);
  sparkle.position.set(
    Math.random() * GRID.COLS,
    GRID.TERRAIN_HEIGHT + 0.5 + Math.random() * 2,
    Math.random() * GRID.ROWS
  );
  sparkle.userData.phase = Math.random() * Math.PI * 2;
  sparkle.userData.speed = 0.5 + Math.random() * 1.5;
  sparkle.userData.baseY = sparkle.position.y;
  scene.add(sparkle);
  sparkleMeshes.push(sparkle);
}

// --- UI Callbacks ---
let selectedPlacementType = null;
let lastSelectedTower = null;

ui.callbacks.onTowerSelect = (type) => {
  selectedPlacementType = type;
  if (lastSelectedTower) {
    towerManager.showRange(lastSelectedTower, false, gameState.run.rangeBonus);
    lastSelectedTower = null;
  }
  ui.hideUpgradePanel();
};

ui.callbacks.onUpgrade = (tower, path) => {
  const cfg = TOWERS[tower.type];
  const upCfg = cfg.upgrades[path];
  if (gameState.canAfford(upCfg.cost)) {
    const success = towerManager.upgradeTower(tower, path);
    if (success) {
      gameState.spendGold(upCfg.cost);
      towerManager.showRange(tower, true, gameState.run.rangeBonus);
      ui.showUpgradePanel(tower, gameState.run.sellRatio, gameState.run);
    }
  }
};

ui.callbacks.onSell = () => {
  if (ui.selectedTower) {
    const refund = towerManager.sellTower(ui.selectedTower, grid, gameState.run.sellRatio);
    gameState.addGold(refund);
    ui.hideUpgradePanel();
    lastSelectedTower = null;
  }
};

ui.callbacks.onPick = (kind, choice) => {
  audio.init();
  audio.playUpgrade();
  if (kind === 'boon') {
    gameState.applyBoon(choice);
    ui.setActiveBoon(choice);
  } else if (kind === 'blessing') {
    gameState.applyBlessing(choice);
  }
  // Always resume after a pick.
  if (gameState.paused) {
    gameState.togglePause();
    ui.updatePauseButton(false);
  }
  ui.updateHUD(gameState.hp, gameState.gold, gameState.wave, gameState.bestWave);
  // Refresh selected tower's range ring + upgrade panel to reflect blessings.
  if (lastSelectedTower) {
    towerManager.showRange(lastSelectedTower, true, gameState.run.rangeBonus);
    ui.showUpgradePanel(lastSelectedTower, gameState.run.sellRatio, gameState.run);
  }
};

gameState.onBlessingOffer = (waveNum, choices) => {
  if (!gameState.paused) {
    gameState.togglePause();
    ui.updatePauseButton(true);
  }
  ui.showPicker('blessing', 'CHOOSE A BLESSING', choices, `Wave ${waveNum} cleared`);
};

gameState.onCombo = (combo) => {
  ui.showCombo(combo);
};

function offerStartingBoon() {
  if (!gameState.paused) {
    gameState.togglePause();
    ui.updatePauseButton(true);
  }
  ui.showPicker('boon', 'CHOOSE A BOON', gameState.offerBoonChoices(), 'Each run begins with one boon.');
}

ui.callbacks.onTargetMode = (tower, mode) => {
  towerManager.setTargetMode(tower, mode);
  ui.showUpgradePanel(tower, gameState.run.sellRatio, gameState.run);
};

ui.callbacks.onNextWave = () => {
  if (gameState.state === 'building') {
    startWave();
  }
};

ui.callbacks.onPause = () => {
  const paused = gameState.togglePause();
  ui.updatePauseButton(paused);
};

ui.callbacks.onSpeed = () => {
  const speed = gameState.cycleSpeed();
  ui.updateSpeedButton(speed);
};

ui.callbacks.onSound = () => {
  const enabled = audio.toggle();
  ui.updateSoundButton(enabled);
};

ui.callbacks.onRestart = () => {
  restartGame();
};

// --- Game Functions ---
function startWave() {
  audio.init(); // Ensure audio context on user interaction
  gameState.startNextWave();
  audio.playWaveStart();
  ui.hideWaveTimer();
  ui.announceWave(gameState.wave);
}

function restartGame() {
  gameState.reset();
  enemyManager.clearAll();
  towerManager.clearAll();
  projectileManager.clearAll();

  // New seed → new path. setupPath() re-rebuilds grid flags, terrain, path
  // mesh, enemy waypoints, and base crystal position from the new run's RNG.
  setupPath();

  ui.hideGameOver();
  ui.hideUpgradePanel();
  ui.setActiveBoon(null);
  ui.showCombo(0);
  ui.updateHUD(gameState.hp, gameState.gold, gameState.wave, gameState.bestWave);
  gameState.waveCountdown = GAME.WAVE_COUNTDOWN;
  ui.showWaveTimer(GAME.WAVE_COUNTDOWN, gameState.peekUpcomingWave());
  selectedPlacementType = null;
  lastSelectedTower = null;
  offerStartingBoon();
}

// --- Game Loop ---
let lastTime = 0;
let accumulator = 0;
let fpsFrames = 0;
let fpsTime = 0;

function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  const rawDt = Math.min((time - lastTime) / 1000, GAME.MAX_DELTA);
  lastTime = time;

  // FPS tracking for adaptive quality
  fpsFrames++;
  fpsTime += rawDt;
  if (fpsTime >= 1) {
    const fps = fpsFrames / fpsTime;
    if (fps < GAME.ADAPTIVE_FPS_THRESHOLD) {
      particles.setQuality(Math.max(0.3, particles.qualityScale - 0.1));
    } else if (fps > 55) {
      particles.setQuality(Math.min(1, particles.qualityScale + 0.05));
    }
    fpsFrames = 0;
    fpsTime = 0;
  }

  if (gameState.paused) {
    renderer.render();
    return;
  }

  const dt = rawDt * gameState.speed;

  // Fixed timestep for game logic
  accumulator += dt;
  while (accumulator >= GAME.FIXED_TIMESTEP) {
    fixedUpdate(GAME.FIXED_TIMESTEP);
    accumulator -= GAME.FIXED_TIMESTEP;
  }

  // Variable rate visual updates
  visualUpdate(dt);
  renderer.render();
}

function fixedUpdate(dt) {
  // Combo decay
  gameState.tickCombo(dt);

  // Wave countdown during building phase
  if (gameState.state === 'building') {
    gameState.waveCountdown -= dt;
    ui.showWaveTimer(gameState.waveCountdown, gameState.peekUpcomingWave());
    if (gameState.waveCountdown <= 0) {
      startWave();
    }
  }

  // Spawn enemies
  if (gameState.state === 'spawning') {
    const toSpawn = gameState.updateSpawning(dt);
    for (const info of toSpawn) {
      const enemy = enemyManager.spawn(info.type);
      if (enemy && info.hpScale !== 1) {
        enemy.hp *= info.hpScale;
        enemy.maxHp = enemy.hp;
      }
    }
  }

  // Update enemies
  enemyManager.update(dt, gameState);
  enemyManager.removeInactive();

  // Update towers
  const activeEnemies = enemyManager.getActive();
  towerManager.update(dt, activeEnemies, projectileManager, enemyManager);

  // Update projectiles
  projectileManager.update(dt);

  // Remove dead enemies after combat
  enemyManager.removeInactive();

  // Check wave completion
  const currentActive = enemyManager.getActive();
  if (gameState.state === 'fighting' || gameState.state === 'spawning') {
    const result = gameState.checkWaveComplete(currentActive.length);
    if (result === 'complete') {
      gameState.waveCountdown = GAME.WAVE_COUNTDOWN;
    }
  }

  // Check game over (endless mode — only ends on death)
  if (gameState.state === 'gameover') {
    audio.playGameOver();
    ui.showGameOver(gameState.wave, gameState.bestWave);
    gameState.state = 'gameover_shown';
  }

  // Update HUD
  ui.updateHUD(gameState.hp, gameState.gold, gameState.wave, gameState.bestWave);
}

function visualUpdate(dt) {
  // Particles
  particles.update(dt);

  // Camera shake
  renderer.updateShake(dt);

  // Clouds
  renderer.updateClouds(dt);

  // Sparkles animation
  const time = performance.now() / 1000;
  for (const s of sparkleMeshes) {
    s.position.y = s.userData.baseY + Math.sin(time * s.userData.speed + s.userData.phase) * 0.3;
    s.material.opacity = 0.3 + Math.sin(time * s.userData.speed * 2 + s.userData.phase) * 0.3;
    s.rotation.y += dt;
  }

  // Base crystal color (shifts with HP)
  const hpRatio = gameState.hp / GAME.START_HP;
  const baseColor = new THREE.Color(COLORS.BASE_HEALTHY).lerp(
    new THREE.Color(COLORS.BASE_DAMAGED),
    1 - hpRatio
  );
  baseCrystal.traverse(child => {
    if (child.material) {
      child.material.color.copy(baseColor);
      child.material.emissive.copy(baseColor);
      child.material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;
    }
  });
  baseCrystal.rotation.y = time * 0.3;

  // Input hover
  input.updateHover(grid, selectedPlacementType);
  setPlacementRange(selectedPlacementType, input.mouseGrid.col, input.mouseGrid.row);

  // Handle clicks
  if (input.consumeClick()) {
    handleClick();
  }
  if (input.consumeRightClick()) {
    selectedPlacementType = null;
    ui.selectTowerType(null);
    ui.hideUpgradePanel();
    if (lastSelectedTower) {
      towerManager.showRange(lastSelectedTower, false, gameState.run.rangeBonus);
      lastSelectedTower = null;
    }
  }
}

function handleClick() {
  audio.init(); // Ensure audio context on first click

  const { col, row } = input.mouseGrid;

  // Tower placement
  if (selectedPlacementType) {
    if (grid.canPlace(col, row)) {
      const cost = TOWERS[selectedPlacementType].cost;
      if (gameState.spendGold(cost)) {
        grid.placeTower(col, row);
        towerManager.createTower(selectedPlacementType, col, row);
        audio.playPlace();

        // Keep type selected for multi-placement (unless shift isn't held)
        if (!input.isKeyDown('shift')) {
          selectedPlacementType = null;
          ui.selectTowerType(null);
        }
      }
    }
    return;
  }

  // Click on existing tower to select it
  for (const tower of towerManager.towers) {
    if (tower.col === col && tower.row === row) {
      if (lastSelectedTower && lastSelectedTower !== tower) {
        towerManager.showRange(lastSelectedTower, false, gameState.run.rangeBonus);
      }
      lastSelectedTower = tower;
      towerManager.showRange(tower, true, gameState.run.rangeBonus);
      ui.showUpgradePanel(tower, gameState.run.sellRatio, gameState.run);
      return;
    }
  }

  // Clicked empty space - deselect
  if (lastSelectedTower) {
    towerManager.showRange(lastSelectedTower, false, gameState.run.rangeBonus);
    lastSelectedTower = null;
  }
  ui.hideUpgradePanel();
}

// Start!
ui.updateHUD(gameState.hp, gameState.gold, gameState.wave, gameState.bestWave);
gameState.waveCountdown = GAME.WAVE_COUNTDOWN;
ui.showWaveTimer(GAME.WAVE_COUNTDOWN, gameState.peekUpcomingWave());
offerStartingBoon();

requestAnimationFrame(gameLoop);
