// ui.js - HUD, tower panel, upgrade panel (HTML/CSS overlay)
import { TOWERS, GAME, isBossWave } from './config.js';
import { TARGET_MODES, TARGET_MODE_LABELS } from './tower.js';

export class UI {
  constructor() {
    this.selectedTowerType = null;
    this.selectedTower = null; // placed tower for upgrade/sell
    this.callbacks = {
      onTowerSelect: null,
      onUpgrade: null,
      onSell: null,
      onNextWave: null,
      onPause: null,
      onSpeed: null,
      onRestart: null,
      onTargetMode: null,
    };

    this._build();
  }

  _build() {
    // Remove existing UI if any
    const old = document.getElementById('game-ui');
    if (old) old.remove();

    const ui = document.createElement('div');
    ui.id = 'game-ui';
    ui.innerHTML = `
      <div id="top-bar">
        <div class="stat" id="hp-stat">
          <span class="stat-icon">&#9829;</span>
          <span id="hp-val">${GAME.START_HP}</span>
        </div>
        <div class="stat" id="gold-stat">
          <span class="stat-icon">&#9733;</span>
          <span id="gold-val">${GAME.START_GOLD}</span>
        </div>
        <div class="stat" id="wave-stat">
          <span class="stat-label">WAVE</span>
          <span id="wave-val">0</span>
        </div>
        <div class="stat" id="best-stat" title="Best wave reached">
          <span class="stat-label">BEST</span>
          <span id="best-val">0</span>
        </div>
        <div id="wave-timer" style="display:none">
          Next wave: <span id="timer-val">15</span>s
          <span id="wave-preview"></span>
          <button id="btn-next-wave" class="btn-small">Send Now</button>
        </div>
        <div id="top-buttons">
          <button id="btn-pause" class="btn-small">&#9646;&#9646;</button>
          <button id="btn-speed" class="btn-small">x1</button>
          <button id="btn-sound" class="btn-small">&#9834;</button>
        </div>
      </div>

      <div id="tower-panel">
        <div class="panel-title">TOWERS</div>
        <button class="tower-btn" data-type="crystal">
          <div class="tower-icon" style="background:#ff44cc"></div>
          <div class="tower-info">
            <div class="tower-name">Crystal Cannon</div>
            <div class="tower-cost">&#9733; 50</div>
          </div>
        </button>
        <button class="tower-btn" data-type="frost">
          <div class="tower-icon" style="background:#44ffee"></div>
          <div class="tower-info">
            <div class="tower-name">Frost Spire</div>
            <div class="tower-cost">&#9733; 75</div>
          </div>
        </button>
        <button class="tower-btn" data-type="spark">
          <div class="tower-icon" style="background:#ffdd44"></div>
          <div class="tower-info">
            <div class="tower-name">Spark Pylon</div>
            <div class="tower-cost">&#9733; 100</div>
          </div>
        </button>
        <div class="panel-hint">Click to select, then click map to place<br>[1] [2] [3] hotkeys | [ESC] cancel</div>
      </div>

      <div id="upgrade-panel" style="display:none">
        <div class="panel-title" id="upgrade-title">Tower Info</div>
        <div id="upgrade-stats"></div>
        <div id="upgrade-buttons"></div>
        <button id="btn-sell" class="btn-sell">Sell</button>
      </div>

      <div id="game-overlay" style="display:none">
        <div id="overlay-content">
          <div id="overlay-title"></div>
          <div id="overlay-text"></div>
          <button id="btn-restart" class="btn-big">Play Again</button>
        </div>
      </div>

      <div id="wave-announce" style="display:none">
        <span id="wave-announce-text"></span>
      </div>
    `;
    document.body.appendChild(ui);

    // Event listeners
    ui.querySelectorAll('.tower-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        this.selectTowerType(type);
      });
    });

    ui.querySelector('#btn-next-wave').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.callbacks.onNextWave) this.callbacks.onNextWave();
    });

    ui.querySelector('#btn-pause').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.callbacks.onPause) this.callbacks.onPause();
    });

    ui.querySelector('#btn-speed').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.callbacks.onSpeed) this.callbacks.onSpeed();
    });

    ui.querySelector('#btn-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.callbacks.onSound) this.callbacks.onSound();
    });

    ui.querySelector('#btn-sell').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.callbacks.onSell) this.callbacks.onSell();
    });

    ui.querySelector('#btn-restart').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') this.selectTowerType('crystal');
      else if (e.key === '2') this.selectTowerType('frost');
      else if (e.key === '3') this.selectTowerType('spark');
      else if (e.key === 'Escape') {
        this.selectTowerType(null);
        this.hideUpgradePanel();
      }
    });
  }

  selectTowerType(type) {
    this.selectedTowerType = type;
    this.hideUpgradePanel();

    document.querySelectorAll('.tower-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === type);
    });

    if (this.callbacks.onTowerSelect) this.callbacks.onTowerSelect(type);
  }

  updateHUD(hp, gold, wave, bestWave) {
    if (this._lastGold === undefined) { this._lastGold = -1; this._lastHp = -1; }
    const hpEl = document.getElementById('hp-val');
    const goldEl = document.getElementById('gold-val');
    const waveEl = document.getElementById('wave-val');
    const bestEl = document.getElementById('best-val');

    if (hpEl) {
      hpEl.textContent = hp;
      if (this._lastHp >= 0 && hp < this._lastHp) {
        hpEl.classList.add('flash-red');
        setTimeout(() => hpEl.classList.remove('flash-red'), 300);
      }
      this._lastHp = hp;
    }

    if (goldEl) {
      if (this._lastGold >= 0 && gold !== this._lastGold) {
        const diff = gold - this._lastGold;
        if (diff > 0) {
          goldEl.classList.add('flash-gold');
          setTimeout(() => goldEl.classList.remove('flash-gold'), 300);
        }
      }
      goldEl.textContent = gold;
      this._lastGold = gold;
    }

    if (waveEl) waveEl.textContent = wave;
    if (bestEl && bestWave !== undefined) bestEl.textContent = bestWave;

    // Update tower button affordability
    document.querySelectorAll('.tower-btn').forEach(btn => {
      const type = btn.dataset.type;
      const cost = TOWERS[type].cost;
      btn.classList.toggle('disabled', gold < cost);
    });
  }

  showWaveTimer(seconds, preview) {
    const el = document.getElementById('wave-timer');
    const val = document.getElementById('timer-val');
    if (el) el.style.display = 'flex';
    if (val) val.textContent = Math.ceil(seconds);
    if (preview) this._renderWavePreview(preview);
  }

  hideWaveTimer() {
    const el = document.getElementById('wave-timer');
    if (el) el.style.display = 'none';
    this._lastPreviewWave = null;
  }

  _renderWavePreview(preview) {
    if (!preview) return;
    if (this._lastPreviewWave === preview.wave) return; // already rendered
    this._lastPreviewWave = preview.wave;

    const el = document.getElementById('wave-preview');
    if (!el) return;

    const swatch = {
      sprinter:  '#66eebb',
      golem:     '#aa66dd',
      swarmling: '#ff7766',
      boss:      '#cc44ff',
    };
    const order = ['boss', 'golem', 'sprinter', 'swarmling'];
    const parts = order
      .filter(t => preview.counts[t])
      .map(t => `<span class="wp-item"><span class="wp-dot" style="background:${swatch[t] || '#ccc'}"></span>${preview.counts[t]}</span>`);

    el.innerHTML = parts.length ? `<span class="wp-sep">|</span>${parts.join('')}` : '';
  }

  showUpgradePanel(tower) {
    this.selectedTower = tower;
    this.selectedTowerType = null;
    document.querySelectorAll('.tower-btn').forEach(btn => btn.classList.remove('selected'));

    const panel = document.getElementById('upgrade-panel');
    const title = document.getElementById('upgrade-title');
    const stats = document.getElementById('upgrade-stats');
    const buttons = document.getElementById('upgrade-buttons');

    if (!panel) return;
    panel.style.display = 'block';

    const cfg = TOWERS[tower.type];
    const upgName = tower.upgradePath ? cfg.upgrades[tower.upgradePath].name : cfg.name;
    title.textContent = upgName;

    // Calculate effective DPS
    let dps;
    if (tower.beam || tower.aura) {
      dps = tower.damage.toFixed(1);
    } else if (tower.instant) {
      dps = (tower.damage * tower.fireRate).toFixed(1);
    } else {
      dps = (tower.damage * tower.fireRate).toFixed(1);
    }

    const specialStats = [];
    if (tower.slowAmount > 0) specialStats.push(`Slow: ${Math.round(tower.slowAmount * 100)}%`);
    if (tower.splash > 0) specialStats.push(`Splash: ${tower.splash.toFixed(1)}`);
    if (tower.chainCount > 0) specialStats.push(`Chains: ${tower.chainCount}`);
    if (tower.beam) specialStats.push('Continuous beam');
    if (tower.aura) specialStats.push('Slow aura');
    if (tower.freezeChance > 0) specialStats.push(`Freeze: ${Math.round(tower.freezeChance * 100)}%`);
    if (tower.stackDebuff) specialStats.push('Stacking shock');

    const isAura = !!tower.aura;
    const modeButtons = isAura ? '' : `
      <div class="stat-divider"></div>
      <div class="target-mode-row">
        <span class="target-mode-label">Target</span>
        <div class="target-mode-buttons">
          ${TARGET_MODES.map(m => {
            const lbl = TARGET_MODE_LABELS[m];
            const sel = tower.targetMode === m ? ' selected' : '';
            return `<button class="target-mode-btn${sel}" data-mode="${m}" title="${lbl.name} — ${lbl.hint}">${lbl.short}</button>`;
          }).join('')}
        </div>
      </div>
    `;

    stats.innerHTML = `
      <div class="stat-row"><span>DPS</span><span class="stat-val">${dps}</span></div>
      <div class="stat-row"><span>Damage</span><span class="stat-val">${tower.damage}</span></div>
      <div class="stat-row"><span>Range</span><span class="stat-val">${tower.range.toFixed(1)}</span></div>
      <div class="stat-row"><span>Fire Rate</span><span class="stat-val">${tower.fireRate.toFixed(1)}/s</span></div>
      ${specialStats.map(s => `<div class="stat-special">${s}</div>`).join('')}
      ${modeButtons}
      <div class="stat-divider"></div>
      <div class="stat-row"><span>Invested</span><span class="stat-val">${tower.totalInvested}g</span></div>
      <div class="stat-row"><span>Sell for</span><span class="stat-val sell-val">${Math.floor(tower.totalInvested * 0.7)}g</span></div>
    `;

    if (!isAura) {
      stats.querySelectorAll('.target-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = btn.dataset.mode;
          if (this.callbacks.onTargetMode) this.callbacks.onTargetMode(tower, mode);
        });
      });
    }

    buttons.innerHTML = '';
    if (!tower.upgradePath) {
      for (const path of ['A', 'B']) {
        const upCfg = cfg.upgrades[path];
        // Build short description
        const traits = [];
        if (upCfg.beam) traits.push('Beam');
        if (upCfg.splash) traits.push('AoE');
        if (upCfg.aura) traits.push('Aura');
        if (upCfg.chainCount) traits.push(`Chain x${upCfg.chainCount}`);
        if (upCfg.freezeChance) traits.push('Freeze');
        if (upCfg.stackDebuff) traits.push('Shock stacks');
        const traitStr = traits.length ? traits.join(', ') : `DMG ${upCfg.damage}`;

        const btn = document.createElement('button');
        btn.className = 'btn-upgrade';
        btn.innerHTML = `
          <strong>${upCfg.name}</strong>
          <span class="upgrade-traits">${traitStr}</span>
          <span class="upgrade-cost">${upCfg.cost}g</span>
        `;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.callbacks.onUpgrade) this.callbacks.onUpgrade(tower, path);
        });
        buttons.appendChild(btn);
      }
    } else {
      buttons.innerHTML = `<div class="upgraded-label">Upgraded: ${cfg.upgrades[tower.upgradePath].name}</div>`;
    }
  }

  hideUpgradePanel() {
    this.selectedTower = null;
    const panel = document.getElementById('upgrade-panel');
    if (panel) panel.style.display = 'none';
  }

  announceWave(waveNum) {
    const el = document.getElementById('wave-announce');
    const text = document.getElementById('wave-announce-text');
    if (!el || !text) return;

    const isBoss = isBossWave(waveNum);
    text.textContent = isBoss ? `BOSS WAVE ${waveNum}` : `Wave ${waveNum}`;
    text.style.color = isBoss ? '#ff44cc' : '#44ffcc';

    el.style.display = 'flex';
    el.classList.remove('active');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('active');
    setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('active');
    }, 2000);
  }

  showGameOver(wave, bestWave) {
    const overlay = document.getElementById('game-overlay');
    const title = document.getElementById('overlay-title');
    const text = document.getElementById('overlay-text');
    if (!overlay) return;
    overlay.style.display = 'flex';
    title.textContent = 'GAME OVER';
    title.style.color = '#ff4466';

    const isNewBest = wave >= (bestWave || 0);
    const bestLine = isNewBest && wave > 0
      ? `<div style="color:#44ffcc;margin-top:6px">New best wave: ${wave}!</div>`
      : `<div style="opacity:0.7;margin-top:6px">Best: wave ${bestWave || 0}</div>`;

    text.innerHTML = `Defeated on wave ${wave}. The crystal has been destroyed.${bestLine}`;
  }

  hideGameOver() {
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  updateSpeedButton(speed) {
    const btn = document.getElementById('btn-speed');
    if (btn) btn.textContent = `x${speed}`;
  }

  updatePauseButton(paused) {
    const btn = document.getElementById('btn-pause');
    if (btn) btn.textContent = paused ? '\u25B6' : '\u25AE\u25AE';
  }

  updateSoundButton(enabled) {
    const btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = enabled ? '\u266A' : '\u2715';
  }
}
