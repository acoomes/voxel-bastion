// projectile.js - Projectile movement & collision
import * as THREE from 'three';
import { TOWERS } from './config.js';

const _dir = new THREE.Vector3();

export class ProjectileManager {
  constructor(scene, particles, enemyManager) {
    this.scene = scene;
    this.particles = particles;
    this.enemyManager = enemyManager;
    this.projectiles = [];
    this.gameState = null; // Set by game.js

    // Shared geometry/material for projectiles
    this.meshPool = [];
    this.matsByType = {
      crystal: new THREE.MeshBasicMaterial({ color: TOWERS.crystal.color }),
      frost: new THREE.MeshBasicMaterial({ color: TOWERS.frost.color }),
    };
    this.geo = new THREE.SphereGeometry(0.08, 6, 4);
  }

  _getMesh(type) {
    // Reuse from pool or create new
    let mesh = this.meshPool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(this.geo, this.matsByType[type] || this.matsByType.crystal);
    } else {
      mesh.material = this.matsByType[type] || this.matsByType.crystal;
    }
    mesh.visible = true;
    this.scene.add(mesh);
    return mesh;
  }

  spawn(tower, target) {
    const mesh = this._getMesh(tower.type);
    mesh.position.copy(tower.position);
    mesh.position.y += 0.5;

    // Trail mesh (small trailing glow) - reuse geo, per-type cached material
    if (!this._trailMats) this._trailMats = {};
    if (!this._trailMats[tower.type]) {
      this._trailMats[tower.type] = new THREE.MeshBasicMaterial({
        color: TOWERS[tower.type].color,
        transparent: true,
        opacity: 0.4,
      });
    }
    const trailMesh = new THREE.Mesh(this.geo, this._trailMats[tower.type]);
    trailMesh.scale.setScalar(0.7);
    this.scene.add(trailMesh);

    this.projectiles.push({
      active: true,
      mesh,
      trailMesh,
      towerType: tower.type,
      target,
      position: mesh.position.clone(),
      speed: tower.projectileSpeed,
      damage: tower.damage,
      slowAmount: tower.slowAmount || 0,
      slowDuration: tower.slowDuration || 0,
      splash: tower.splash || 0,
      freezeChance: tower.freezeChance || 0,
      freezeDuration: tower.freezeDuration || 0,
      life: 5, // max lifetime
      prevPos: mesh.position.clone(),
    });
  }

  update(dt) {
    const toRemove = [];

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0 || !p.target || !p.target.active) {
        this._deactivate(p);
        toRemove.push(i);
        continue;
      }

      // Move towards target
      const targetPos = p.target.position.clone();
      targetPos.y += 0.3;
      _dir.copy(targetPos).sub(p.position);
      const dist = _dir.length();
      const move = p.speed * dt;

      if (dist <= move + 0.2) {
        // Hit!
        this._onHit(p);
        this._deactivate(p);
        toRemove.push(i);
        continue;
      }

      // Trail
      p.prevPos.copy(p.position);
      _dir.normalize();
      p.position.addScaledVector(_dir, move);
      p.mesh.position.copy(p.position);
      p.trailMesh.position.lerpVectors(p.prevPos, p.position, 0.5);
    }

    // Remove inactive
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.projectiles.splice(toRemove[i], 1);
    }
  }

  _onHit(proj) {
    const target = proj.target;

    // Impact particles
    this.particles.impactBurst(proj.position, TOWERS[proj.towerType].color);

    // Splash damage
    if (proj.splash > 0) {
      const enemies = this.enemyManager.getActive();
      for (const e of enemies) {
        const dist = e.position.distanceTo(proj.position);
        if (dist <= proj.splash) {
          const falloff = 1 - (dist / proj.splash) * 0.5;
          const dead = this.enemyManager.damage(e, proj.damage * falloff, proj.towerType);
          if (dead) {
            const r = this.enemyManager.killEnemy(e);
            if (r.reward > 0 && this.gameState) this.gameState.addGold(r.reward);
          }
        }
      }
      // Splash visual
      for (let s = 0; s < 5; s++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * proj.splash;
        this.particles.spawn({
          x: proj.position.x + Math.cos(angle) * r,
          y: 0.5,
          z: proj.position.z + Math.sin(angle) * r,
          vx: 0, vy: 0.5, vz: 0,
          life: 0.4,
          scale: 0.06,
          color: 0xff4422,
          gravity: false,
        });
      }
    } else {
      // Single target damage
      const dead = this.enemyManager.damage(target, proj.damage, proj.towerType);
      if (dead) {
        const r = this.enemyManager.killEnemy(target);
        if (r.reward > 0 && this.gameState) this.gameState.addGold(r.reward);
      }
    }

    // Slow
    if (proj.slowAmount > 0 && target.active) {
      this.enemyManager.applySlow(target, proj.slowAmount, proj.slowDuration);
    }

    // Freeze chance
    if (proj.freezeChance > 0 && Math.random() < proj.freezeChance && target.active) {
      this.enemyManager.applyFreeze(target, proj.freezeDuration);
    }
  }

  _deactivate(proj) {
    proj.active = false;
    this.scene.remove(proj.mesh);
    this.scene.remove(proj.trailMesh);
    proj.mesh.visible = false;
    this.meshPool.push(proj.mesh);
    // Trail uses shared geo/mat, just remove from scene
  }

  clearAll() {
    for (const p of this.projectiles) {
      if (p.active) this._deactivate(p);
    }
    this.projectiles = [];
  }
}
