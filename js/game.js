// game.js - Game lifecycle: composes MetaState (persistent) and RunState
// (ephemeral). Owns wave control, economy, and run lifecycle.
import { GAME, WAVES, BOONS, BLESSINGS, BLESSING_INTERVAL, COMBAT, isBossWave, bossWaveIndex } from './config.js';
import { MetaState, RunState } from './state.js';
import { pick } from './rng.js';

const RUN_FIELDS = [
  'hp', 'gold', 'wave', 'state', 'paused', 'speed',
  'spawnQueue', 'spawnTimer', 'waveCountdown', 'waveEnemiesAlive',
  'upcomingQueue', 'seed',
];

function activeMods(run) {
  return run.boon ? (run.boon.mods || {}) : {};
}

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
    this.onBlessingOffer = null; // (waveNum, choices[]) → modal
    this.onBoonOffer = null;     // (choices[]) → modal
    this.onCombo = null;         // (combo, killWorldPos) → HUD
  }

  get mods() { return activeMods(this.run); }

  get bestWave() { return this.meta.bestWave; }
  get rng() { return this.run.rng; }

  startNewRun(seed) {
    this.run = new RunState(seed);
  }

  // Roll N distinct items from a pool deterministically.
  _rollDistinct(pool, n) {
    const rng = this.run.rng;
    const copy = pool.slice();
    const out = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = Math.floor(rng() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  offerBoonChoices() {
    return this._rollDistinct(BOONS, 3);
  }

  applyBoon(boon) {
    this.run.boon = boon;
    if (boon.apply) boon.apply(this.run);
    if (this.onHPChange) this.onHPChange(this.run.hp);
    if (this.onGoldChange) this.onGoldChange(this.run.gold);
  }

  offerBlessingChoices() {
    return this._rollDistinct(BLESSINGS, 3);
  }

  applyBlessing(blessing) {
    this.run.blessings.push(blessing);
    if (blessing.apply) blessing.apply(this.run, this);
    this.run.pendingBlessingWave = null;
  }

  // Compute final damage for a tower hit. Applies tower-type damage multiplier,
  // global damage multiplier, and a deterministic crit roll. Returns
  // { amount, isCrit }.
  rollDamage(towerType, baseAmount) {
    const run = this.run;
    let amount = baseAmount;
    const typeMul = (run.towerDmgMul && run.towerDmgMul[towerType]) || 1;
    const globalMul = this.mods.damageMul || 1;
    amount *= typeMul * globalMul;

    const critChance = COMBAT.baseCritChance + run.critChanceBonus;
    const isCrit = run.rng() < critChance;
    if (isCrit) amount *= COMBAT.critMultiplier;
    return { amount, isCrit };
  }

  // Tower-effective range/fireRate, folded with run-wide blessings.
  effectiveRange(baseRange) {
    return baseRange + this.run.rangeBonus;
  }
  effectiveFireRate(baseRate) {
    return baseRate * this.run.fireRateMul;
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
    const types = waveNum >= WAVES.procedural.wraithFirstWave
      ? ['sprinter', 'golem', 'swarmling', 'wraith']
      : ['sprinter', 'golem', 'swarmling'];
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
      const cap = type === 'swarmling' ? 12
        : type === 'sprinter' ? 8
        : type === 'wraith' ? 4
        : 3;
      const count = Math.min(maxCount, cap);
      const delay = type === 'swarmling' ? 0.25
        : type === 'sprinter' ? 0.6
        : type === 'wraith' ? 0.7
        : 1.5;
      queue.push({
        type,
        count,
        delay,
        spawned: 0,
        timer: 0,
      });
      budget -= cost * count;
    }

    return queue;
  }

  getWaveBonus() {
    let base;
    if (this.run.wave <= WAVES.handDesigned.length) {
      base = WAVES.handDesigned[this.run.wave - 1].bonus;
    } else {
      base = 20 + this.run.wave * 5;
    }
    base += this.run.waveBonusFlat;
    base = Math.round(base * (this.mods.waveBonusMul || 1));
    return base;
  }

  // Gold for kill rewards — boon-modified.
  rewardGold(amount) {
    const mul = this.mods.goldMul || 1;
    return Math.round(amount * mul);
  }

  // Tick the combo timer once per fixed step. Drops combo when window lapses.
  tickCombo(dt) {
    if (this.run.combo > 0) {
      this.run.comboTimer -= dt;
      if (this.run.comboTimer <= 0) {
        this.run.combo = 0;
        if (this.onCombo) this.onCombo(0, null);
      }
    }
  }

  // Called when an enemy is killed by a tower. Returns combo-bonus gold to add.
  registerKill(worldPos) {
    this.run.combo++;
    this.run.comboTimer = COMBAT.comboWindow;
    let bonus = 0;
    const tiers = COMBAT.comboBonusG;
    const c = this.run.combo;
    let best = 0;
    for (const k of Object.keys(tiers)) {
      const n = parseInt(k, 10);
      if (c >= n && n > best) { best = n; bonus = tiers[k]; }
    }
    if (this.onCombo) this.onCombo(c, worldPos);
    return bonus;
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

      // Blessing pick every BLESSING_INTERVAL waves.
      if (this.run.wave > 0 && this.run.wave % BLESSING_INTERVAL === 0) {
        this.run.pendingBlessingWave = this.run.wave;
        if (this.onBlessingOffer) {
          this.onBlessingOffer(this.run.wave, this.offerBlessingChoices());
        }
      }
      return 'complete';
    }
    return null;
  }

  takeDamage(amount) {
    const mul = this.mods.leakMul || 1;
    this.run.hp = Math.max(0, this.run.hp - Math.round(amount * mul));
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
