// config.js - All game constants

export const GRID = {
  COLS: 24,
  ROWS: 16,
  CELL_SIZE: 1,
  TERRAIN_HEIGHT: 0.5,
  PATH_DEPTH: 0.2,
};

export const COLORS = {
  // Terrain
  TERRAIN_MINT: 0xa8e6cf,
  TERRAIN_LAVENDER: 0xc4b7e6,
  TERRAIN_CREAM: 0xffefd5,
  PATH_STONE: 0x8899aa,
  PATH_EDGE: 0x66ffcc,
  // Towers
  CRYSTAL_MAGENTA: 0xff44cc,
  FROST_CYAN: 0x44ffee,
  SPARK_GOLD: 0xffdd44,
  // Enemies
  SPRINTER_MINT: 0x66eebb,
  GOLEM_PURPLE: 0xaa66dd,
  SWARMLING_CORAL: 0xff7766,
  // UI
  NEON_CYAN: 0x00ffcc,
  NEON_MAGENTA: 0xff00cc,
  NEON_GOLD: 0xffcc00,
  // Base
  BASE_HEALTHY: 0x44ffcc,
  BASE_DAMAGED: 0xff4466,
  // Background
  SKY_TOP: 0x1a0a2e,
  SKY_BOTTOM: 0x2d1b69,
  CLOUD_WHITE: 0xeeddff,
};

export const CAMERA = {
  ZOOM: 12,
  POSITION: [20, 20, 20],
  LOOK_AT: [12, 0, 8],
};

export const GAME = {
  START_HP: 20,
  START_GOLD: 200,
  SELL_RATIO: 0.7,
  WAVE_COUNTDOWN: 15,
  FIXED_TIMESTEP: 1 / 60,
  MAX_DELTA: 0.1,
  PARTICLE_POOL_SIZE: 2000,
  ADAPTIVE_FPS_THRESHOLD: 45,
};

export const TOWERS = {
  crystal: {
    name: 'Crystal Cannon',
    cost: 50,
    range: 4.5,
    damage: 10,
    fireRate: 1.2, // shots per second
    projectileSpeed: 12,
    color: COLORS.CRYSTAL_MAGENTA,
    modelKey: 'crystal',
    upgrades: {
      A: {
        name: 'Prismatic Beam',
        cost: 80,
        range: 5.5,
        damage: 6,
        fireRate: 0,
        beam: true,
        chainCount: 3,
        chainRange: 3,
        color: 0xff66dd,
      },
      B: {
        name: 'Nova Cannon',
        cost: 80,
        range: 4,
        damage: 30,
        fireRate: 0.5,
        splash: 2,
        projectileSpeed: 8,
        color: 0xff2299,
      },
    },
  },
  frost: {
    name: 'Frost Spire',
    cost: 75,
    range: 4,
    damage: 5,
    fireRate: 0.8,
    projectileSpeed: 8,
    slowAmount: 0.4,
    slowDuration: 2,
    color: COLORS.FROST_CYAN,
    modelKey: 'frost',
    upgrades: {
      A: {
        name: 'Permafrost Field',
        cost: 100,
        range: 5,
        damage: 3,
        fireRate: 0,
        aura: true,
        auraRange: 3.5,
        slowAmount: 0.6,
        color: 0x22ddcc,
      },
      B: {
        name: 'Cryo Launcher',
        cost: 100,
        range: 4.5,
        damage: 18,
        fireRate: 0.6,
        projectileSpeed: 10,
        slowAmount: 0.5,
        slowDuration: 3,
        freezeChance: 0.25,
        freezeDuration: 1.5,
        color: 0x00aaff,
      },
    },
  },
  spark: {
    name: 'Spark Pylon',
    cost: 100,
    range: 3.5,
    damage: 8,
    fireRate: 2,
    instant: true,
    color: COLORS.SPARK_GOLD,
    modelKey: 'spark',
    upgrades: {
      A: {
        name: 'Storm Nexus',
        cost: 120,
        range: 4.5,
        damage: 12,
        fireRate: 1.5,
        chainCount: 4,
        chainRange: 3,
        color: 0xffee22,
      },
      B: {
        name: 'Tesla Coil',
        cost: 120,
        range: 3,
        damage: 4,
        fireRate: 6,
        stackDebuff: true,
        maxStacks: 5,
        stackDamageBonus: 2,
        color: 0xeeaa00,
      },
    },
  },
};

export const ENEMIES = {
  sprinter: {
    name: 'Sprinter',
    hp: 30,
    speed: 3.5,
    reward: 5,
    damage: 1,
    size: [3, 2, 3],
    color: COLORS.SPRINTER_MINT,
    voxelScale: 0.12,
  },
  golem: {
    name: 'Golem',
    hp: 200,
    speed: 1.2,
    reward: 15,
    damage: 3,
    size: [5, 5, 5],
    color: COLORS.GOLEM_PURPLE,
    voxelScale: 0.15,
    shieldPulse: true,
    shieldCooldown: 5,
    shieldDuration: 1.5,
    shieldReduction: 0.7,
  },
  swarmling: {
    name: 'Swarmling',
    hp: 12,
    speed: 2.5,
    reward: 2,
    damage: 1,
    size: [2, 2, 2],
    color: COLORS.SWARMLING_CORAL,
    voxelScale: 0.1,
    splitChance: 0.15,
    splitCount: 2,
  },
  boss: {
    name: 'Super Golem',
    hp: 800,
    speed: 0.8,
    reward: 50,
    damage: 5,
    size: [7, 7, 7],
    color: 0xcc44ff,
    voxelScale: 0.18,
    shieldPulse: true,
    shieldCooldown: 4,
    shieldDuration: 2,
    shieldReduction: 0.8,
    isBoss: true,
  },
  wraith: {
    name: 'Wraith',
    hp: 40,
    speed: 3.0,
    reward: 8,
    damage: 2,
    size: [3, 3, 3],
    color: 0xddaaff,
    voxelScale: 0.13,
    slowImmune: true,
    ghostly: true,
  },
};

// Hand-designed waves 1-5, then procedural
export const WAVES = {
  handDesigned: [
    { enemies: [{ type: 'sprinter', count: 6, delay: 0.8 }], bonus: 20 },
    { enemies: [{ type: 'sprinter', count: 10, delay: 0.6 }], bonus: 25 },
    { enemies: [{ type: 'golem', count: 2, delay: 2 }, { type: 'sprinter', count: 5, delay: 0.7 }], bonus: 30 },
    { enemies: [{ type: 'swarmling', count: 15, delay: 0.3 }], bonus: 30 },
    {
      enemies: [
        { type: 'sprinter', count: 8, delay: 0.5 },
        { type: 'golem', count: 3, delay: 2 },
        { type: 'swarmling', count: 10, delay: 0.3 },
      ],
      bonus: 40,
    },
  ],
  procedural: {
    baseBudget: 150,
    budgetScale: 1.22,
    costs: { sprinter: 5, golem: 25, swarmling: 2, boss: 100, wraith: 8 },
    wraithFirstWave: 8,
    // Endless: boss every 5 waves starting at 10. HP scale grows with boss index.
    bossInterval: 5,
    firstBossWave: 10,
    bossHPBase: 1,
    bossHPGrowth: 0.5,
  },
};

export function isBossWave(n) {
  const { firstBossWave, bossInterval } = WAVES.procedural;
  return n >= firstBossWave && (n - firstBossWave) % bossInterval === 0;
}

export function bossWaveIndex(n) {
  if (!isBossWave(n)) return -1;
  return Math.floor((n - WAVES.procedural.firstBossWave) / WAVES.procedural.bossInterval);
}

// Combat tuning shared by towers + projectiles.
export const COMBAT = {
  baseCritChance: 0.08,
  critMultiplier: 1.6,
  comboWindow: 1.5, // seconds between kills to keep combo alive
  comboBonusG: { 3: 1, 5: 2, 10: 5 }, // extra gold per kill at combo>=key
};

// Run-start Boons. Player picks one of three at the start of every run.
// `apply(run)` mutates the RunState before wave 1.
// `mods` are read by gameplay systems each frame.
export const BOONS = [
  {
    id: 'bountiful',
    name: 'Bountiful',
    desc: '+50% gold from kills, but start with 25% less HP.',
    apply(run) { run.hp = Math.max(1, Math.round(run.hp * 0.75)); },
    mods: { goldMul: 1.5 },
  },
  {
    id: 'cryomancer',
    name: 'Cryomancer',
    desc: 'All hits apply a 15% slow for 1.5s, regardless of tower.',
    mods: { universalSlow: { amount: 0.15, duration: 1.5 } },
  },
  {
    id: 'volatile',
    name: 'Volatile',
    desc: 'Slain enemies explode for 25 damage to neighbors.',
    mods: { volatileSplash: { damage: 25, radius: 1.4 } },
  },
  {
    id: 'hardened',
    name: 'Hardened',
    desc: '+50% starting HP, but 25% less starting gold.',
    apply(run) {
      run.hp = Math.round(run.hp * 1.5);
      run.gold = Math.round(run.gold * 0.75);
    },
    mods: {},
  },
  {
    id: 'glass-cannon',
    name: 'Glass Cannon',
    desc: '+25% tower damage; leaks deal +50% HP damage.',
    mods: { damageMul: 1.25, leakMul: 1.5 },
  },
  {
    id: 'quick-study',
    name: 'Quick Study',
    desc: 'Wave-clear gold bonus is doubled.',
    mods: { waveBonusMul: 2 },
  },
];

// Mid-run Blessings. Offered every BLESSING_INTERVAL waves; player picks one.
// `apply(run, gameState)` runs when the choice is confirmed.
export const BLESSING_INTERVAL = 3;
export const BLESSINGS = [
  {
    id: 'crystal-power',
    name: 'Sharper Crystals',
    desc: '+15% damage to Crystal towers.',
    apply(run) { run.towerDmgMul.crystal *= 1.15; },
  },
  {
    id: 'frost-power',
    name: 'Deeper Cold',
    desc: '+15% damage to Frost towers.',
    apply(run) { run.towerDmgMul.frost *= 1.15; },
  },
  {
    id: 'spark-power',
    name: 'Brighter Spark',
    desc: '+15% damage to Spark towers.',
    apply(run) { run.towerDmgMul.spark *= 1.15; },
  },
  {
    id: 'reach',
    name: 'Long Reach',
    desc: '+0.5 range to all towers.',
    apply(run) { run.rangeBonus += 0.5; },
  },
  {
    id: 'haste',
    name: 'Battle Tempo',
    desc: '+10% fire rate to all towers.',
    apply(run) { run.fireRateMul *= 1.1; },
  },
  {
    id: 'tribute',
    name: 'Tribute',
    desc: '+100 gold, immediately.',
    apply(run, gs) { gs.addGold(100); },
  },
  {
    id: 'precision',
    name: 'Precision',
    desc: '+5% crit chance.',
    apply(run) { run.critChanceBonus += 0.05; },
  },
  {
    id: 'fence',
    name: 'Fair Trade',
    desc: 'Sell ratio rises from 70% to 85%.',
    apply(run) { run.sellRatio = Math.max(run.sellRatio, 0.85); },
  },
  {
    id: 'rally',
    name: 'Rallying Cry',
    desc: 'Wave-clear bonus +25g, permanently.',
    apply(run) { run.waveBonusFlat += 25; },
  },
];

