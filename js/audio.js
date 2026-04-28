// audio.js - Procedural sound synthesis (Web Audio API, no files)
export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  _ensureCtx() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx && this.enabled;
  }

  // Tower placement: rising sine "ding"
  playPlace() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Crystal Cannon fire: descending "pew"
  playCrystalShot() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Frost Spire fire: filtered white noise "whoosh"
  playFrostShot() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.linearRampToValueAtTime(500, t + 0.2);
    filter.Q.value = 2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noise.connect(filter).connect(gain).connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  // Spark Pylon fire: modulated sawtooth "zap"
  playSparkShot() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.08);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(60, t);
    const modGain = this.ctx.createGain();
    modGain.gain.value = 300;
    osc2.connect(modGain).connect(osc.frequency);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.1);
    osc2.stop(t + 0.1);
  }

  // Enemy death: descending "pop" with noise burst
  playDeath(isBoss = false) {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const dur = isBoss ? 0.4 : 0.2;

    // Pop tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isBoss ? 300 : 500, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + dur);
    gain.gain.setValueAtTime(isBoss ? 0.2 : 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(isBoss ? 0.1 : 0.06, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(nGain).connect(this.masterGain);
    noise.start(t);
    noise.stop(t + dur);
  }

  // Wave start: ascending 3-note chime
  playWaveStart() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.3);
    });
  }

  // Sell tower
  playSell() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.15);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Upgrade tower
  playUpgrade() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const notes = [440, 554, 660, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  // Game over
  playGameOver() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const notes = [440, 370, 311, 261];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.5);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t + i * 0.2);
      osc.stop(t + i * 0.2 + 0.5);
    });
  }

  // Victory
  playVictory() {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.5);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.5);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 0.3 : 0;
    }
    return this.enabled;
  }
}
