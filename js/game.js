// game.js - Game state machine, economy, wave control
import { GAME, WAVES, ENEMIES, TOWERS } from './config.js';

export class GameState {
  constructor() {
    this.hp = GAME.START_HP;
    this.gold = GAME.START_GOLD;
    this.wave = 0;
    this.maxWaves = 20;
    this.state = 'building'; // building, spawning, fighting, gameover, victory
    this.paused = false;
    this.speed = 1;

    // Wave spawning
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveCountdown = 0;
    this.waveEnemiesAlive = 0;

    // Callbacks
    this.onHPChange = null;
    this.onGoldChange = null;
    this.onWaveChange = null;
    this.onGameOver = null;
    this.onVictory = null;
    this.onWaveComplete = null;
  }

  reset() {
    this.hp = GAME.START_HP;
    this.gold = GAME.START_GOLD;
    this.wave = 0;
    this.state = 'building';
    this.paused = false;
    this.speed = 1;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveCountdown = GAME.WAVE_COUNTDOWN;
    this.waveEnemiesAlive = 0;
  }

  startNextWave() {
    this.wave++;
    this.state = 'spawning';
    this.spawnQueue = this._generateWave(this.wave);
    this.spawnTimer = 0;
    this.waveEnemiesAlive = 0;
    for (const group of this.spawnQueue) {
      this.waveEnemiesAlive += group.count;
    }
    if (this.onWaveChange) this.onWaveChange(this.wave);
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

    // Boss waves
    if (WAVES.procedural.bossWaves.includes(waveNum)) {
      const bossIdx = WAVES.procedural.bossWaves.indexOf(waveNum);
      const scale = WAVES.procedural.bossHPScale[bossIdx] || 1;
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
      const type = types[Math.floor(Math.random() * types.length)];
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
    if (this.wave <= WAVES.handDesigned.length) {
      return WAVES.handDesigned[this.wave - 1].bonus;
    }
    return 20 + this.wave * 5;
  }

  /**
   * Update spawning logic. Returns enemies to spawn this frame.
   */
  updateSpawning(dt) {
    if (this.state !== 'spawning') return [];

    const toSpawn = [];
    let allDone = true;

    for (const group of this.spawnQueue) {
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
      this.state = 'fighting';
    }

    return toSpawn;
  }

  enemyKilled() {
    this.waveEnemiesAlive--;
  }

  enemyReachedBase() {
    this.waveEnemiesAlive--;
  }

  checkWaveComplete(activeEnemyCount) {
    if (this.state === 'fighting' && activeEnemyCount === 0 && this.spawnQueue.every(g => g.spawned >= g.count)) {
      // Wave complete
      const bonus = this.getWaveBonus();
      this.addGold(bonus);

      if (this.wave >= this.maxWaves) {
        this.state = 'victory';
        if (this.onVictory) this.onVictory();
        return 'victory';
      }

      this.state = 'building';
      this.waveCountdown = GAME.WAVE_COUNTDOWN;
      if (this.onWaveComplete) this.onWaveComplete(this.wave, bonus);
      return 'complete';
    }
    return null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.enemyReachedBase();
    if (this.onHPChange) this.onHPChange(this.hp);
    if (this.hp <= 0) {
      this.state = 'gameover';
      if (this.onGameOver) this.onGameOver();
    }
  }

  addGold(amount) {
    this.gold += amount;
    if (this.onGoldChange) this.onGoldChange(this.gold);
  }

  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      if (this.onGoldChange) this.onGoldChange(this.gold);
      return true;
    }
    return false;
  }

  canAfford(amount) {
    return this.gold >= amount;
  }

  togglePause() {
    this.paused = !this.paused;
    return this.paused;
  }

  cycleSpeed() {
    if (this.speed === 1) this.speed = 2;
    else if (this.speed === 2) this.speed = 3;
    else this.speed = 1;
    return this.speed;
  }
}
