// game.js - Game lifecycle: composes MetaState (persistent) and RunState
// (ephemeral). Owns wave control, economy, and run lifecycle.
import { GAME, WAVES, isBossWave, bossWaveIndex } from './config.js';
import { MetaState, RunState } from './state.js';
import { pick } from './rng.js';

const RUN_FIELDS = [
  'hp', 'gold', 'wave', 'state', 'paused', 'speed',
  'spawnQueue', 'spawnTimer', 'waveCountdown', 'waveEnemiesAlive',
  'upcomingQueue', 'seed',
];

export class GameState {
  constructor() {
    this.meta = new MetaState();
    this.run = new RunState();

    for (const f of RUN_FIELDS) {
      Object.defineProperty(this, f, {
        get() { return this.run[f]; },
        set(v) { this.run[f] = v; },
      });
    }

    this.onHPChange = null;
    this.onGoldChange = null;
    this.onWaveChange = null;
    this.onGameOver = null;
    this.onVictory = null;
    this.onWaveComplete = null;
  }

  get bestWave() { return this.meta.bestWave; }
  get rng() { return this.run.rng; }

  startNewRun(seed) {
    this.run = new RunState(seed);
  }

  endRun(reason) {
    this.run.endReason = reason;
    this.run.endedAt = this.run.wave;
  }

  reset() {
    this.startNewRun();
  }

  startNextWave() {
    this.run.wave++;
    this.meta.recordWave(this.run.wave);
    this.run.state = 'spawning';
    if (this.run.upcomingQueue) {
      this.run.spawnQueue = this.run.upcomingQueue;
      this.run.upcomingQueue = null;
    } else {
      this.run.spawnQueue = this._generateWave(this.run.wave);
    }
    this.run.spawnTimer = 0;
    this.run.waveEnemiesAlive = 0;
    for (const group of this.run.spawnQueue) {
      this.run.waveEnemiesAlive += group.count;
    }
    if (this.onWaveChange) this.onWaveChange(this.run.wave);
  }

  // Returns a summary of the next wave without mutating spawn state.
  // Caches the generated queue so the actual wave matches the preview.
  peekUpcomingWave() {
    if (this.run.state !== 'building') return null;
    if (!this.run.upcomingQueue) {
      this.run.upcomingQueue = this._generateWave(this.run.wave + 1);
    }
    const counts = {};
    for (const g of this.run.upcomingQueue) {
      counts[g.type] = (counts[g.type] || 0) + g.count;
    }
    return { wave: this.run.wave + 1, counts };
  }

  _generateWave(waveNum) {
    // Hand-designed waves 1-5
    if (waveNum <= WAVES.handDesigned.length) {
      const w = WAVES.handDesigned[waveNum - 1];
      return w.enemies.map(e => ({ ...e, spawned: 0, timer: 0 }));
    }

    // Procedural waves 6+
    const procIdx = waveNum - WAVES.handDesigned.length - 1;
    let budget = WAVES.procedural.baseBudget * Math.pow(WAVES.procedural.budgetScale, procIdx);

    const queue = [];
    const rng = this.run.rng;

    // Boss waves (every bossInterval starting at firstBossWave, scaling each time)
    if (isBossWave(waveNum)) {
      const bossIdx = bossWaveIndex(waveNum);
      const scale = WAVES.procedural.bossHPBase + bossIdx * WAVES.procedural.bossHPGrowth;
      queue.push({
        type: 'boss',
        count: 1,
        delay: 0,
        spawned: 0,
        timer: 0,
        hpScale: scale,
      });
      budget -= WAVES.procedural.costs.boss;
    }

    // Fill remaining budget
    const types = ['sprinter', 'golem', 'swarmling'];
    while (budget > 0) {
      const type = pick(types, rng);
      const cost = WAVES.procedural.costs[type];
      if (cost > budget) {
        // Fill with cheapest
        const cheapType = 'swarmling';
        const cheapCount = Math.floor(budget / WAVES.procedural.costs[cheapType]);
        if (cheapCount > 0) {
          queue.push({
            type: cheapType,
            count: cheapCount,
            delay: 0.25,
            spawned: 0,
            timer: 0,
          });
        }
        break;
      }
      // Random batch size
      const maxCount = Math.floor(budget / cost);
      const count = Math.min(maxCount, type === 'swarmling' ? 12 : type === 'sprinter' ? 8 : 3);
      queue.push({
        type,
        count,
        delay: type === 'swarmling' ? 0.25 : type === 'sprinter' ? 0.6 : 1.5,
        spawned: 0,
        timer: 0,
      });
      budget -= cost * count;
    }

    return queue;
  }

  getWaveBonus() {
    if (this.run.wave <= WAVES.handDesigned.length) {
      return WAVES.handDesigned[this.run.wave - 1].bonus;
    }
    return 20 + this.run.wave * 5;
  }

  /**
   * Update spawning logic. Returns enemies to spawn this frame.
   */
  updateSpawning(dt) {
    if (this.run.state !== 'spawning') return [];

    const toSpawn = [];
    let allDone = true;

    for (const group of this.run.spawnQueue) {
      if (group.spawned >= group.count) continue;
      allDone = false;

      group.timer -= dt;
      if (group.timer <= 0) {
        group.timer = group.delay;
        group.spawned++;
        toSpawn.push({
          type: group.type,
          hpScale: group.hpScale || 1,
        });
      }
    }

    if (allDone) {
      this.run.state = 'fighting';
    }

    return toSpawn;
  }

  enemyKilled() {
    this.run.waveEnemiesAlive--;
  }

  enemyReachedBase() {
    this.run.waveEnemiesAlive--;
  }

  checkWaveComplete(activeEnemyCount) {
    if (this.run.state === 'fighting' && activeEnemyCount === 0 &&
        this.run.spawnQueue.every(g => g.spawned >= g.count)) {
      const bonus = this.getWaveBonus();
      this.addGold(bonus);
      this.run.state = 'building';
      this.run.waveCountdown = GAME.WAVE_COUNTDOWN;
      if (this.onWaveComplete) this.onWaveComplete(this.run.wave, bonus);
      return 'complete';
    }
    return null;
  }

  takeDamage(amount) {
    this.run.hp = Math.max(0, this.run.hp - amount);
    this.enemyReachedBase();
    if (this.onHPChange) this.onHPChange(this.run.hp);
    if (this.run.hp <= 0) {
      this.run.state = 'gameover';
      this.endRun('death');
      if (this.onGameOver) this.onGameOver();
    }
  }

  addGold(amount) {
    this.run.gold += amount;
    if (this.onGoldChange) this.onGoldChange(this.run.gold);
  }

  spendGold(amount) {
    if (this.run.gold >= amount) {
      this.run.gold -= amount;
      if (this.onGoldChange) this.onGoldChange(this.run.gold);
      return true;
    }
    return false;
  }

  canAfford(amount) {
    return this.run.gold >= amount;
  }

  togglePause() {
    this.run.paused = !this.run.paused;
    return this.run.paused;
  }

  cycleSpeed() {
    if (this.run.speed === 1) this.run.speed = 2;
    else if (this.run.speed === 2) this.run.speed = 3;
    else this.run.speed = 1;
    return this.run.speed;
  }
}
