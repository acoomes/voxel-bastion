// state.js - Persistent and per-run state.
//
// MetaState: survives across runs (localStorage). Owns unlocks, currency, bests.
// RunState: ephemeral. Reset/recreated each run. Owns hp/gold/wave + seeded rng.
//
// GameState (game.js) composes these and exposes lifecycle methods.

import { GAME } from './config.js';
import { mulberry32, randomSeed } from './rng.js';

const META_KEY = 'voxel-bastion-meta-v1';
const LEGACY_BEST_WAVE_KEY = 'voxel-bastion-best-wave';

export class MetaState {
  constructor() {
    this.bestWave = 0;
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Number.isFinite(data.bestWave) && data.bestWave > 0) {
          this.bestWave = data.bestWave;
        }
        return;
      }
      // Migrate from the pre-meta best-wave key if present.
      const legacy = parseInt(localStorage.getItem(LEGACY_BEST_WAVE_KEY), 10);
      if (Number.isFinite(legacy) && legacy > 0) {
        this.bestWave = legacy;
        this._save();
      }
    } catch (_) {}
  }

  _save() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ bestWave: this.bestWave }));
    } catch (_) {}
  }

  recordWave(wave) {
    if (wave > this.bestWave) {
      this.bestWave = wave;
      this._save();
      return true;
    }
    return false;
  }
}

export class RunState {
  constructor(seed) {
    this.seed = (seed >>> 0) || randomSeed();
    this.rng = mulberry32(this.seed);

    this.hp = GAME.START_HP;
    this.gold = GAME.START_GOLD;
    this.wave = 0;
    this.state = 'building'; // building | spawning | fighting | gameover | gameover_shown
    this.paused = false;
    this.speed = 1;

    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveCountdown = GAME.WAVE_COUNTDOWN;
    this.waveEnemiesAlive = 0;
    this.upcomingQueue = null;

    this.endedAt = null; // wave number at run end, set by endRun()
    this.endReason = null;
  }
}
