// tower.js - Tower logic: targeting, firing, upgrades
import * as THREE from 'three';
import { TOWERS, GRID } from './config.js';
import { buildVoxelGroup } from './voxel-models.js';

export class TowerManager {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;
    this.towers = [];
  }

  createTower(type, col, row) {
    const cfg = TOWERS[type];
    if (!cfg) return null;

    const worldX = col * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
    const worldZ = row * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
    const worldY = GRID.TERRAIN_HEIGHT;

    // Build voxel model
    const group = buildVoxelGroup(cfg.modelKey);
    group.position.set(worldX, worldY, worldZ);
    this.scene.add(group);

    // Range indicator (hidden by default)
    const rangeGeo = new THREE.RingGeometry(cfg.range - 0.05, cfg.range, 32);
    const rangeMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const rangeMesh = new THREE.Mesh(rangeGeo, rangeMat);
    rangeMesh.rotation.x = -Math.PI / 2;
    rangeMesh.position.set(worldX, worldY + 0.02, worldZ);
    this.scene.add(rangeMesh);

    const tower = {
      type,
      col, row,
      group,
      rangeMesh,
      position: new THREE.Vector3(worldX, worldY, worldZ),
      // Stats (from config, will be modified by upgrades)
      range: cfg.range,
      damage: cfg.damage,
      fireRate: cfg.fireRate,
      projectileSpeed: cfg.projectileSpeed || 0,
      // Firing
      fireCooldown: 0,
      target: null,
      // Upgrade
      upgradePath: null, // null, 'A', or 'B'
      totalInvested: cfg.cost,
      // Type-specific
      instant: cfg.instant || false,
      slowAmount: cfg.slowAmount || 0,
      slowDuration: cfg.slowDuration || 0,
      beam: false,
      chainCount: 0,
      chainRange: 0,
      splash: 0,
      aura: false,
      auraRange: 0,
      freezeChance: 0,
      freezeDuration: 0,
      stackDebuff: false,
      // Animation
      fireFlashTimer: 0,
    };

    this.towers.push(tower);
    return tower;
  }

  upgradeTower(tower, path) {
    const cfg = TOWERS[tower.type];
    const upCfg = cfg.upgrades[path];
    if (!upCfg || tower.upgradePath) return false;

    tower.upgradePath = path;
    tower.totalInvested += upCfg.cost;
    tower.range = upCfg.range;
    tower.damage = upCfg.damage;
    tower.fireRate = upCfg.fireRate;
    if (upCfg.projectileSpeed) tower.projectileSpeed = upCfg.projectileSpeed;
    if (upCfg.beam) tower.beam = true;
    if (upCfg.chainCount) tower.chainCount = upCfg.chainCount;
    if (upCfg.chainRange) tower.chainRange = upCfg.chainRange;
    if (upCfg.splash) tower.splash = upCfg.splash;
    if (upCfg.aura) tower.aura = true;
    if (upCfg.auraRange) tower.auraRange = upCfg.auraRange;
    if (upCfg.slowAmount) tower.slowAmount = upCfg.slowAmount;
    if (upCfg.slowDuration) tower.slowDuration = upCfg.slowDuration;
    if (upCfg.freezeChance) tower.freezeChance = upCfg.freezeChance;
    if (upCfg.freezeDuration) tower.freezeDuration = upCfg.freezeDuration;
    if (upCfg.stackDebuff) tower.stackDebuff = upCfg.stackDebuff;

    // Update range indicator
    tower.rangeMesh.geometry.dispose();
    tower.rangeMesh.geometry = new THREE.RingGeometry(tower.range - 0.05, tower.range, 32);

    // Visual upgrade - change color
    tower.group.traverse(child => {
      if (child.material) {
        child.material.color.setHex(upCfg.color);
        child.material.emissive.setHex(upCfg.color);
        child.material.emissiveIntensity = 0.25;
      }
    });

    // Scale up slightly
    tower.group.scale.setScalar(1.15);

    // Upgrade particle burst
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      this.particles.spawn({
        x: tower.position.x + Math.cos(angle) * 0.3,
        y: tower.position.y + 0.5,
        z: tower.position.z + Math.sin(angle) * 0.3,
        vx: Math.cos(angle) * 2,
        vy: 2 + Math.random() * 2,
        vz: Math.sin(angle) * 2,
        life: 0.8 + Math.random() * 0.4,
        scale: 0.06,
        color: upCfg.color,
        gravity: true,
        shrink: true,
      });
    }

    this.audio.playUpgrade();
    return true;
  }

  sellTower(tower, grid) {
    const idx = this.towers.indexOf(tower);
    if (idx < 0) return 0;

    const refund = Math.floor(tower.totalInvested * 0.7);

    // Remove from scene
    this.scene.remove(tower.group);
    this.scene.remove(tower.rangeMesh);
    tower.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    tower.rangeMesh.geometry.dispose();
    tower.rangeMesh.material.dispose();

    // Free grid cell
    grid.removeTower(tower.col, tower.row);

    this.towers.splice(idx, 1);
    this.audio.playSell();
    return refund;
  }

  showRange(tower, show) {
    tower.rangeMesh.material.opacity = show ? 0.2 : 0;
  }

  update(dt, enemies, projectileManager, enemyManager) {
    for (const tower of this.towers) {
      tower.fireCooldown -= dt;
      tower.fireFlashTimer -= dt;

      // Idle animation - gentle bob
      tower.group.position.y = tower.position.y + Math.sin(performance.now() / 1000 * 1.5 + tower.col * 2) * 0.015;

      // Aura towers apply slow continuously
      if (tower.aura && tower.auraRange > 0) {
        let hitAny = false;
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const dist = tower.position.distanceTo(enemy.position);
          if (dist <= tower.auraRange) {
            enemyManager.applySlow(enemy, tower.slowAmount, 0.5);
            hitAny = true;
            // Aura DPS: damage per tick (every 0.5s)
            if (tower.fireCooldown <= 0) {
              const dead = enemyManager.damage(enemy, tower.damage, tower.type);
              if (dead) {
                const r = enemyManager.killEnemy(enemy);
                if (r.reward > 0) projectileManager.gameState.addGold(r.reward);
              }
            }
          }
        }
        if (tower.fireCooldown <= 0) {
          tower.fireCooldown = 0.5;
          // Aura visual ring pulse
          if (hitAny) {
            this.particles.spawn({
              x: tower.position.x, y: tower.position.y + 0.3, z: tower.position.z,
              vx: 0, vy: 0.5, vz: 0,
              life: 0.3, scale: 0.05,
              color: TOWERS[tower.type].upgrades.A.color,
              gravity: false, shrink: true,
            });
          }
        }
        continue;
      }

      // Beam towers
      if (tower.beam) {
        // Find targets in range
        const inRange = enemies
          .filter(e => e.active && tower.position.distanceTo(e.position) <= tower.range)
          .sort((a, b) => {
            // Prioritize furthest along path
            return b.waypointIdx - a.waypointIdx || b.pathProgress - a.pathProgress;
          });

        if (inRange.length > 0) {
          const chainTargets = inRange.slice(0, tower.chainCount + 1);
          // Apply DPS to chained targets (damage is DPS, multiply by dt)
          for (let i = 0; i < chainTargets.length; i++) {
            const dmg = tower.damage * (1 - i * 0.15) * dt;
            const dead = enemyManager.damage(chainTargets[i], dmg, tower.type);
            if (dead) {
              const result = enemyManager.killEnemy(chainTargets[i]);
              if (result.reward > 0) {
                projectileManager.gameState.addGold(result.reward);
              }
            }
          }
          // Visual beam
          if (tower.fireCooldown <= 0) {
            tower.fireCooldown = 0.1;
            for (let i = 0; i < Math.min(chainTargets.length, 2); i++) {
              this.particles.lightningBolt(tower.position, chainTargets[i].position, TOWERS[tower.type].color);
            }
          }
        }
        continue;
      }

      // Standard targeting
      if (tower.fireCooldown > 0) continue;

      // Find best target (furthest along path in range)
      let bestTarget = null;
      let bestProgress = -1;
      for (const enemy of enemies) {
        if (!enemy.active || enemy.frozen) continue;
        const dist = tower.position.distanceTo(enemy.position);
        if (dist <= tower.range) {
          const progress = enemy.waypointIdx * 1000 + (enemy.pathProgress || 0);
          if (progress > bestProgress) {
            bestProgress = progress;
            bestTarget = enemy;
          }
        }
      }

      if (!bestTarget) continue;

      // Rotate tower toward target
      const dx = bestTarget.position.x - tower.position.x;
      const dz = bestTarget.position.z - tower.position.z;
      tower.group.rotation.y = Math.atan2(dx, dz);

      // Fire!
      tower.fireCooldown = 1 / tower.fireRate;
      tower.fireFlashTimer = 0.1;

      if (tower.instant) {
        // Instant hit (spark/lightning)
        let dead = enemyManager.damage(bestTarget, tower.damage, 'spark');
        if (tower.stackDebuff) {
          enemyManager.applySparkStack(bestTarget);
        }

        // Chain lightning
        if (tower.chainCount > 0) {
          let current = bestTarget;
          const hit = new Set([current]);
          for (let c = 0; c < tower.chainCount; c++) {
            let nearest = null;
            let nearDist = tower.chainRange;
            for (const e of enemies) {
              if (!e.active || hit.has(e)) continue;
              const d = current.position.distanceTo(e.position);
              if (d < nearDist) {
                nearDist = d;
                nearest = e;
              }
            }
            if (!nearest) break;
            hit.add(nearest);
            this.particles.lightningBolt(current.position, nearest.position, TOWERS[tower.type].color);
            const chainDead = enemyManager.damage(nearest, tower.damage * 0.7, 'spark');
            if (chainDead) {
              const r = enemyManager.killEnemy(nearest);
              if (r.reward > 0) projectileManager.gameState.addGold(r.reward);
            }
            current = nearest;
          }
        }

        // Lightning visual to main target
        this.particles.lightningBolt(tower.position, bestTarget.position, TOWERS[tower.type].color);
        this.particles.muzzleFlash(tower.position, TOWERS[tower.type].color);
        this.audio.playSparkShot();

        if (dead) {
          const r = enemyManager.killEnemy(bestTarget);
          if (r.reward > 0) projectileManager.gameState.addGold(r.reward);
        }
      } else {
        // Projectile-based
        projectileManager.spawn(tower, bestTarget);
        this.particles.muzzleFlash(tower.position, TOWERS[tower.type].color);

        // Sound
        if (tower.type === 'crystal') this.audio.playCrystalShot();
        else if (tower.type === 'frost') this.audio.playFrostShot();
      }
    }
  }

  clearAll() {
    for (const t of this.towers) {
      this.scene.remove(t.group);
      this.scene.remove(t.rangeMesh);
    }
    this.towers = [];
  }
}
