// enemy.js - Enemy logic: path following, health, status effects
import * as THREE from 'three';
import { ENEMIES, GRID } from './config.js';
import { parseModelDef } from './voxel-models.js';

const _dir = new THREE.Vector3();
const _boxGeo = new THREE.BoxGeometry(1, 1, 1);

// Shared materials cache to avoid per-enemy allocations
const _matCache = {};
function getCachedMat(color) {
  if (!_matCache[color]) {
    _matCache[color] = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
    });
  }
  return _matCache[color];
}

// Shared HP bar geometries
const _hpBgGeo = new THREE.PlaneGeometry(0.8, 0.08);
const _hpFgGeo = new THREE.PlaneGeometry(0.78, 0.06);
const _hpBgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide, depthTest: false });

export class EnemyManager {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;
    this.pathPoints = [];
    this.enemies = [];
    this.onBossKill = null; // callback for camera shake etc.

    // Pre-parse model voxel offsets for shatter effects and rendering
    this.modelData = {};
    for (const type of Object.keys(ENEMIES)) {
      const parsed = parseModelDef(type);
      if (parsed) {
        const maxX = Math.max(...parsed.voxels.map(v => v.x)) + 1;
        const maxZ = Math.max(...parsed.voxels.map(v => v.z)) + 1;
        const cx = maxX / 2, cz = maxZ / 2;
        this.modelData[type] = {
          voxels: parsed.voxels,
          scale: parsed.scale,
          offsets: parsed.voxels.map(v => ({
            x: (v.x - cx + 0.5) * parsed.scale,
            y: v.y * parsed.scale,
            z: (v.z - cz + 0.5) * parsed.scale,
            color: v.color,
            scale: parsed.scale * 0.92,
          })),
          height: (Math.max(...parsed.voxels.map(v => v.y)) + 1) * parsed.scale,
        };
      }
    }
  }

  _buildVoxelGroup(type) {
    const data = this.modelData[type];
    if (!data) return { group: new THREE.Group(), height: 0.5 };

    const group = new THREE.Group();
    for (const off of data.offsets) {
      const mat = getCachedMat(off.color);
      const mesh = new THREE.Mesh(_boxGeo, mat);
      mesh.position.set(off.x, off.y, off.z);
      mesh.scale.setScalar(off.scale);
      group.add(mesh);
    }
    return { group, height: data.height };
  }

  _createEnemy(type, waypointIdx = 0) {
    const cfg = ENEMIES[type];
    if (!cfg) return null;

    // Build proper voxel model
    const container = new THREE.Group();
    const { group: modelGroup, height } = this._buildVoxelGroup(type);
    container.add(modelGroup);

    // Health bar - billboard facing camera direction (isometric)
    const hpBarGroup = new THREE.Group();
    const hpBarBg = new THREE.Mesh(_hpBgGeo, _hpBgMat);
    hpBarGroup.add(hpBarBg);

    const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x44ff66, side: THREE.DoubleSide, depthTest: false });
    const hpBar = new THREE.Mesh(_hpFgGeo, hpBarMat);
    hpBar.position.z = -0.001;
    hpBarGroup.add(hpBar);

    hpBarGroup.position.y = height + 0.2;
    // Face the isometric camera
    hpBarGroup.rotation.x = -Math.PI / 4;
    hpBarGroup.rotation.y = Math.PI / 4;
    container.add(hpBarGroup);

    // Shield visual (for golems/bosses)
    let shieldMesh = null;
    if (cfg.shieldPulse) {
      const shieldSize = height * 0.9;
      const shieldGeo = new THREE.SphereGeometry(shieldSize, 8, 6);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0xaa88ff,
        transparent: true,
        opacity: 0,
        wireframe: true,
      });
      shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.position.y = height * 0.4;
      container.add(shieldMesh);
    }

    this.scene.add(container);
    const startPos = this.pathPoints[Math.min(waypointIdx, this.pathPoints.length - 1)].clone();

    return {
      type,
      active: true,
      group: container,
      modelGroup,
      hpBar,
      hpBarMat,
      shieldMesh,
      modelHeight: height,
      hp: cfg.hp,
      maxHp: cfg.hp,
      speed: cfg.speed,
      baseSpeed: cfg.speed,
      reward: cfg.reward,
      damage: cfg.damage,
      isBoss: cfg.isBoss || false,
      // Path
      waypointIdx: Math.min(waypointIdx, this.pathPoints.length - 2),
      pathProgress: 0,
      position: startPos,
      rotation: 0,
      // Status effects
      slowAmount: 0,
      slowTimer: 0,
      frozen: false,
      freezeTimer: 0,
      sparkStacks: 0,
      // Shield
      shieldActive: false,
      shieldTimer: cfg.shieldPulse ? cfg.shieldCooldown : 0,
      shieldDuration: cfg.shieldDuration || 0,
      shieldReduction: cfg.shieldReduction || 0,
      shieldCooldown: cfg.shieldCooldown || 0,
      // Swarmling split
      splitChance: cfg.splitChance || 0,
      splitCount: cfg.splitCount || 0,
      // Animation
      bobPhase: Math.random() * Math.PI * 2,
      hitFlashTimer: 0,
    };
  }

  spawn(type, waypointIdx = 0) {
    const enemy = this._createEnemy(type, waypointIdx);
    if (enemy) {
      this.enemies.push(enemy);
      enemy.group.position.copy(enemy.position);
    }
    return enemy;
  }

  update(dt, gameState) {
    const toRemove = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.active) continue;

      // Hit flash decay
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
        if (e.hitFlashTimer <= 0) {
          this._setModelEmissive(e, 0.2);
        }
      }

      // Freeze check
      if (e.frozen) {
        e.freezeTimer -= dt;
        if (e.freezeTimer <= 0) {
          e.frozen = false;
          this._setModelColor(e, ENEMIES[e.type].color);
        } else {
          e.bobPhase += dt * 2;
          e.group.position.y = e.position.y + Math.sin(e.bobPhase) * 0.02;
          continue;
        }
      }

      // Slow effect
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        e.speed = e.baseSpeed * (1 - e.slowAmount);
      } else {
        e.speed = e.baseSpeed;
        e.slowAmount = 0;
      }

      // Shield cooldown
      if (e.shieldCooldown > 0 && !e.shieldActive) {
        e.shieldTimer -= dt;
        if (e.shieldTimer <= 0) {
          e.shieldActive = true;
          e.shieldTimer = e.shieldDuration;
          if (e.shieldMesh) e.shieldMesh.material.opacity = 0.35;
        }
      }
      if (e.shieldActive) {
        e.shieldTimer -= dt;
        if (e.shieldMesh) {
          // Pulsing shield
          e.shieldMesh.material.opacity = 0.2 + Math.sin(e.bobPhase * 3) * 0.15;
          e.shieldMesh.rotation.y += dt * 2;
        }
        if (e.shieldTimer <= 0) {
          e.shieldActive = false;
          e.shieldTimer = e.shieldCooldown;
          if (e.shieldMesh) e.shieldMesh.material.opacity = 0;
        }
      }

      // Path following
      if (e.waypointIdx < this.pathPoints.length - 1) {
        const target = this.pathPoints[e.waypointIdx + 1];
        _dir.copy(target).sub(e.position);
        const dist = _dir.length();
        const move = e.speed * dt;

        if (move >= dist) {
          e.position.copy(target);
          e.waypointIdx++;
          if (e.waypointIdx >= this.pathPoints.length - 1) {
            gameState.takeDamage(e.damage);
            this._removeEnemy(e);
            toRemove.push(i);
            continue;
          }
        } else {
          _dir.normalize();
          e.position.addScaledVector(_dir, move);
          e.rotation = Math.atan2(_dir.x, _dir.z);
        }
      }

      // Update visual
      e.bobPhase += dt * 3;
      e.group.position.set(
        e.position.x,
        e.position.y + Math.sin(e.bobPhase) * 0.05,
        e.position.z
      );
      e.group.rotation.y = e.rotation;

      // HP bar
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      e.hpBar.scale.x = hpRatio;
      e.hpBar.position.x = -(1 - hpRatio) * 0.39;
      if (hpRatio > 0.5) {
        e.hpBarMat.color.setHex(0x44ff66);
      } else if (hpRatio > 0.25) {
        e.hpBarMat.color.setHex(0xffaa22);
      } else {
        e.hpBarMat.color.setHex(0xff3333);
      }
    }

    // Remove enemies that reached the base (reverse order)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.enemies.splice(toRemove[i], 1);
    }
  }

  _setModelEmissive(enemy, intensity) {
    enemy.modelGroup.children.forEach(child => {
      if (child.material && child.material.emissiveIntensity !== undefined) {
        child.material.emissiveIntensity = intensity;
      }
    });
  }

  _setModelColor(enemy, color) {
    enemy.modelGroup.children.forEach(child => {
      if (child.material) {
        child.material.color.setHex(color);
        child.material.emissive.setHex(color);
      }
    });
  }

  damage(enemy, amount, source) {
    if (!enemy.active) return false;

    // Shield reduction
    if (enemy.shieldActive) {
      amount *= (1 - enemy.shieldReduction);
    }

    // Spark stack bonus
    if (source === 'spark' && enemy.sparkStacks > 0) {
      amount += enemy.sparkStacks * 2;
    }

    enemy.hp -= amount;

    // Flash white on hit
    enemy.hitFlashTimer = 0.08;
    this._setModelEmissive(enemy, 0.9);

    return enemy.hp <= 0;
  }

  applySlow(enemy, amount, duration) {
    if (!enemy.active) return;
    if (amount > enemy.slowAmount) {
      enemy.slowAmount = amount;
    }
    enemy.slowTimer = Math.max(enemy.slowTimer, duration);
  }

  applyFreeze(enemy, duration) {
    if (!enemy.active) return;
    enemy.frozen = true;
    enemy.freezeTimer = duration;
    this._setModelColor(enemy, 0x88ccff);
  }

  applySparkStack(enemy) {
    if (!enemy.active) return;
    enemy.sparkStacks = Math.min((enemy.sparkStacks || 0) + 1, 5);
  }

  killEnemy(enemy) {
    if (!enemy.active) return { reward: 0, splits: [] };

    const reward = enemy.reward;
    const splits = [];

    // Voxel shatter effect!
    const data = this.modelData[enemy.type] || this.modelData.sprinter;
    if (data) {
      this.particles.voxelShatter(enemy.position, data.offsets, enemy.isBoss);
    }
    this.audio.playDeath(enemy.isBoss);

    // Boss kill callback (camera shake)
    if (enemy.isBoss && this.onBossKill) {
      this.onBossKill();
    }

    // Swarmling split
    const rng = this.gameState ? this.gameState.rng : Math.random;
    if (enemy.splitChance > 0 && rng() < enemy.splitChance) {
      for (let s = 0; s < enemy.splitCount; s++) {
        const wpIdx = Math.max(0, Math.min(enemy.waypointIdx, this.pathPoints.length - 2));
        const split = this.spawn('swarmling', wpIdx);
        if (split) {
          split.position.copy(enemy.position);
          split.position.x += (rng() - 0.5) * 0.5;
          split.position.z += (rng() - 0.5) * 0.5;
          split.group.position.copy(split.position);
          split.hp = ENEMIES.swarmling.hp * 0.5;
          split.maxHp = split.hp;
          split.waypointIdx = wpIdx;
          split.splitChance = 0;
          splits.push(split);
        }
      }
    }

    this._removeEnemy(enemy);
    return { reward, splits };
  }

  _removeEnemy(enemy) {
    enemy.active = false;
    this.scene.remove(enemy.group);
    // Dispose per-enemy materials (hpBar mat, shield mat)
    if (enemy.hpBarMat) enemy.hpBarMat.dispose();
    if (enemy.shieldMesh) {
      enemy.shieldMesh.geometry.dispose();
      enemy.shieldMesh.material.dispose();
    }
    // Note: model voxel meshes use shared cached materials, don't dispose those
  }

  removeInactive() {
    this.enemies = this.enemies.filter(e => e.active);
  }

  getActive() {
    return this.enemies.filter(e => e.active);
  }

  clearAll() {
    for (const e of this.enemies) {
      if (e.active) this._removeEnemy(e);
    }
    this.enemies = [];
  }
}
