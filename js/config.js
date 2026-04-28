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
    costs: { sprinter: 5, golem: 25, swarmling: 2, boss: 100 },
    bossWaves: [10, 15, 20],
    bossHPScale: [1, 1.5, 2.5],
  },
};

// Path waypoints (grid coordinates)
export const PATH_WAYPOINTS = [
  { x: 0, z: 2 },
  { x: 6, z: 2 },
  { x: 6, z: 7 },
  { x: 18, z: 7 },
  { x: 18, z: 12 },
  { x: 10, z: 12 },
  { x: 10, z: 14 },
  { x: 23, z: 14 },
];
