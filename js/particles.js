// particles.js - Pooled particle system + voxel shatter death
import * as THREE from 'three';
import { GAME } from './config.js';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = GAME.PARTICLE_POOL_SIZE;
    this.qualityScale = 1;

    // Particle pool
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        rx: 0, ry: 0, rz: 0,
        rvx: 0, rvy: 0, rvz: 0,
        life: 0, maxLife: 1,
        scale: 0.1,
        color: 0xffffff,
        gravity: true,
        shrink: true,
      });
    }

    // InstancedMesh for all particles
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.maxParticles * 3), 3
    );
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    // Hide all initially
    _dummy.scale.setScalar(0);
    _dummy.updateMatrix();
    for (let i = 0; i < this.maxParticles; i++) {
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    scene.add(this.mesh);
  }

  _findFreeSlot() {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.particles[i].active) return i;
    }
    return -1;
  }

  /**
   * Spawn a single particle
   */
  spawn(opts) {
    const idx = this._findFreeSlot();
    if (idx < 0) return;
    const p = this.particles[idx];
    p.active = true;
    p.x = opts.x || 0;
    p.y = opts.y || 0;
    p.z = opts.z || 0;
    p.vx = opts.vx || 0;
    p.vy = opts.vy || 0;
    p.vz = opts.vz || 0;
    p.rx = 0; p.ry = 0; p.rz = 0;
    p.rvx = (Math.random() - 0.5) * 10;
    p.rvy = (Math.random() - 0.5) * 10;
    p.rvz = (Math.random() - 0.5) * 10;
    p.life = opts.life || 1;
    p.maxLife = p.life;
    p.scale = opts.scale || 0.1;
    p.color = opts.color || 0xffffff;
    p.gravity = opts.gravity !== false;
    p.shrink = opts.shrink !== false;
  }

  /**
   * Voxel shatter effect - the signature wow factor
   * Spawns particles for each voxel of the enemy model
   */
  voxelShatter(position, voxelOffsets, isBoss = false) {
    const count = Math.min(
      Math.floor(voxelOffsets.length * this.qualityScale),
      isBoss ? 120 : 60
    );
    const force = isBoss ? 8 : 5;
    const lifeBase = isBoss ? 2.0 : 1.5;

    for (let i = 0; i < count; i++) {
      const vo = voxelOffsets[i % voxelOffsets.length];
      const angle = Math.random() * Math.PI * 2;
      const upForce = 2 + Math.random() * force * 0.5;
      const outForce = force * (0.5 + Math.random() * 0.5);

      this.spawn({
        x: position.x + vo.x,
        y: position.y + vo.y,
        z: position.z + vo.z,
        vx: Math.cos(angle) * outForce,
        vy: upForce,
        vz: Math.sin(angle) * outForce,
        life: lifeBase * (0.7 + Math.random() * 0.6),
        scale: vo.scale * (isBoss ? 1.3 : 1),
        color: vo.color,
        gravity: true,
        shrink: true,
      });
    }
  }

  /**
   * Terrain shatter - chunky burst when a destructible cell is destroyed.
   */
  terrainShatter(position, color) {
    // Big chunks (fewer, larger, slower) — read as solid debris
    const chunkCount = Math.floor(8 * this.qualityScale);
    for (let i = 0; i < chunkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3;
      this.spawn({
        x: position.x + (Math.random() - 0.5) * 0.6,
        y: position.y + Math.random() * 0.3,
        z: position.z + (Math.random() - 0.5) * 0.6,
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 3.5,
        vz: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.6,
        scale: 0.18 + Math.random() * 0.10,
        color,
        gravity: true,
        shrink: false,
      });
    }
    // Dust cloud (lots of small, fast, fading particles for the "poof")
    const dustCount = Math.floor(20 * this.qualityScale);
    const dustColor = (color & 0xfefefe) >>> 1; // half-bright variant for dust
    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      this.spawn({
        x: position.x + (Math.random() - 0.5) * 0.9,
        y: position.y + Math.random() * 0.4,
        z: position.z + (Math.random() - 0.5) * 0.9,
        vx: Math.cos(angle) * speed,
        vy: 0.5 + Math.random() * 1.5,
        vz: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        scale: 0.08 + Math.random() * 0.06,
        color: dustColor,
        gravity: true,
        shrink: true,
      });
    }
  }

  /**
   * Impact burst - small effect at projectile hit
   */
  impactBurst(position, color, count = 8) {
    count = Math.floor(count * this.qualityScale);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.spawn({
        x: position.x,
        y: position.y + 0.3,
        z: position.z,
        vx: Math.cos(angle) * speed,
        vy: 1 + Math.random() * 2,
        vz: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        scale: 0.06 + Math.random() * 0.04,
        color,
        gravity: true,
        shrink: true,
      });
    }
  }

  /**
   * Muzzle flash
   */
  muzzleFlash(position, color) {
    for (let i = 0; i < Math.floor(4 * this.qualityScale); i++) {
      this.spawn({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + 0.5 + Math.random() * 0.3,
        z: position.z + (Math.random() - 0.5) * 0.2,
        vx: (Math.random() - 0.5) * 1,
        vy: 1 + Math.random(),
        vz: (Math.random() - 0.5) * 1,
        life: 0.2 + Math.random() * 0.15,
        scale: 0.08,
        color,
        gravity: false,
        shrink: true,
      });
    }
  }

  /**
   * Lightning bolt visual between two points
   */
  lightningBolt(from, to, color) {
    const count = Math.floor(6 * this.qualityScale);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      this.spawn({
        x: from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 0.3,
        y: from.y + (to.y - from.y) * t + 0.5 + (Math.random() - 0.5) * 0.3,
        z: from.z + (to.z - from.z) * t + (Math.random() - 0.5) * 0.3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        life: 0.15 + Math.random() * 0.1,
        scale: 0.05 + Math.random() * 0.03,
        color,
        gravity: false,
        shrink: true,
      });
    }
  }

  setQuality(scale) {
    this.qualityScale = Math.max(0.3, Math.min(1, scale));
  }

  update(dt) {
    let anyActive = false;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        // Keep hidden
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
        anyActive = true;
        continue;
      }

      // Physics
      if (p.gravity) {
        p.vy -= 9.8 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rx += p.rvx * dt;
      p.ry += p.rvy * dt;
      p.rz += p.rvz * dt;

      // Floor bounce
      if (p.y < 0 && p.gravity) {
        p.y = 0;
        p.vy *= -0.3;
        p.vx *= 0.7;
        p.vz *= 0.7;
      }

      // Shrink
      const lifeRatio = p.life / p.maxLife;
      const s = p.shrink ? p.scale * lifeRatio : p.scale;

      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.rx, p.ry, p.rz);
      _dummy.scale.setScalar(s);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      _color.setHex(p.color);
      this.mesh.setColorAt(i, _color);
      anyActive = true;
    }

    if (anyActive) {
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
  }
}
