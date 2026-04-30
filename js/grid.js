// grid.js - Grid state, terrain building, placement validation, destruction.
import * as THREE from 'three';
import { GRID, COLORS, TERRAIN } from './config.js';
import { buildPathCells } from './path.js';

// Cell type codes in this.cells[col][row]:
//   0 = empty (placeable)
//   1 = path
//   2 = tower
//   3 = destroyed terrain (no mesh, blocks placement)
const CELL_EMPTY = 0;
const CELL_PATH = 1;
const CELL_TOWER = 2;
const CELL_DESTROYED = 3;

export class Grid {
  constructor() {
    this.cols = GRID.COLS;
    this.rows = GRID.ROWS;
    this.cells = Array.from({ length: this.cols }, () =>
      Array.from({ length: this.rows }, () => CELL_EMPTY)
    );
    this.cellHP = Array.from({ length: this.cols }, () =>
      Array.from({ length: this.rows }, () => TERRAIN.HP_MAX)
    );
    this.cellMeshes = Array.from({ length: this.cols }, () =>
      Array.from({ length: this.rows }, () => null)
    );
    this.terrainGroup = null;
    this.pathCells = [];

    // Optional fx hooks set by main.js. Grid uses them when destruction
    // happens so call sites don't have to wire effects themselves.
    this.particles = null;
    this.audio = null;
    this.renderer = null;
  }

  // Replace the path. Clears all path/tower/destroyed flags, resets HP, and
  // re-marks new path cells. Caller must clear tower entities separately.
  rebuildPath(waypoints) {
    this.pathCells = buildPathCells(waypoints);
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        this.cells[x][z] = CELL_EMPTY;
        this.cellHP[x][z] = TERRAIN.HP_MAX;
      }
    }
    for (const c of this.pathCells) {
      if (c.x >= 0 && c.x < this.cols && c.z >= 0 && c.z < this.rows) {
        this.cells[c.x][c.z] = CELL_PATH;
      }
    }
  }

  canPlace(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.cells[col][row] === CELL_EMPTY;
  }

  placeTower(col, row) {
    this.cells[col][row] = CELL_TOWER;
  }

  removeTower(col, row) {
    if (this.cells[col][row] === CELL_TOWER) this.cells[col][row] = CELL_EMPTY;
  }

  worldToGrid(worldX, worldZ) {
    return {
      col: Math.floor(worldX / GRID.CELL_SIZE),
      row: Math.floor(worldZ / GRID.CELL_SIZE),
    };
  }

  gridToWorld(col, row) {
    return {
      x: col * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
      z: row * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
    };
  }

  // Apply radial terrain damage. Damages every empty cell within `radius` of
  // the world-space hit point with quadratic-ish falloff. Path/tower/already-
  // destroyed cells are skipped. Aggregates fx (one shatter sound + one shake
  // per call, scaled by destroyed count) so big hits feel proportionally big.
  // Returns { destroyed, cracked } counts.
  applyDamageAt(worldX, worldZ, radius, damage) {
    const cellSize = GRID.CELL_SIZE;
    const minCol = Math.max(0, Math.floor((worldX - radius) / cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((worldX + radius) / cellSize));
    const minRow = Math.max(0, Math.floor((worldZ - radius) / cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((worldZ + radius) / cellSize));
    const r2 = radius * radius;
    let destroyed = 0;
    let newlyCracked = 0;

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        if (this.cells[col][row] !== CELL_EMPTY) continue;
        const cx = col * cellSize + cellSize * 0.5;
        const cz = row * cellSize + cellSize * 0.5;
        const dx = cx - worldX;
        const dz = cz - worldZ;
        const distSq = dx * dx + dz * dz;
        if (distSq > r2) continue;
        const dist = Math.sqrt(distSq);
        const falloff = 1 - (dist / radius) * 0.5;
        const result = this._damageCell(col, row, damage * falloff);
        if (result.destroyed) destroyed++;
        if (result.cracked) newlyCracked++;
      }
    }

    if (destroyed > 0) {
      if (this.audio && this.audio.playTerrainShatter) this.audio.playTerrainShatter(destroyed);
      if (this.renderer && this.renderer.shake) {
        const intensity = Math.min(TERRAIN.SHAKE_MAX, destroyed * TERRAIN.SHAKE_PER_DESTROY);
        this.renderer.shake(intensity, 0.25 + Math.min(0.4, destroyed * 0.04));
      }
      if (this.particles && this.particles.spawn) {
        this._spawnImpactFlash(worldX, worldZ, radius);
      }
    } else if (newlyCracked > 0 && this.audio && this.audio.playTerrainCrack) {
      this.audio.playTerrainCrack();
    }

    return { destroyed, cracked: newlyCracked };
  }

  _spawnImpactFlash(worldX, worldZ, radius) {
    const p = this.particles;
    const flashCount = Math.min(8, Math.ceil(radius * 2));
    for (let i = 0; i < flashCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.6;
      p.spawn({
        x: worldX + Math.cos(angle) * r,
        y: GRID.TERRAIN_HEIGHT + 0.1,
        z: worldZ + Math.sin(angle) * r,
        vx: 0, vy: 0.3, vz: 0,
        life: 0.18 + Math.random() * 0.1,
        scale: 0.18 + Math.random() * 0.1,
        color: 0xffaa44,
        gravity: false,
        shrink: true,
      });
    }
  }

  // Internal: apply `dmg` to one cell, updating its visual state.
  // Returns { destroyed, cracked } booleans (cracked is only true on the
  // *first* time the cell crosses a damage threshold this hit).
  _damageCell(col, row, dmg) {
    const prevHp = this.cellHP[col][row];
    this.cellHP[col][row] -= dmg;
    const mesh = this.cellMeshes[col][row];
    const hp = this.cellHP[col][row];

    if (hp <= 0) {
      this.cells[col][row] = CELL_DESTROYED;
      this.cellHP[col][row] = 0;
      this.cellMeshes[col][row] = null;
      if (mesh) {
        if (this.terrainGroup) this.terrainGroup.remove(mesh);
        if (this.particles && this.particles.terrainShatter) {
          const cx = col * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
          const cz = row * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
          const color = mesh.material && mesh.material.color
            ? mesh.material.color.getHex()
            : 0x9988aa;
          this.particles.terrainShatter({ x: cx, y: GRID.TERRAIN_HEIGHT * 0.5, z: cz }, color);
        }
      }
      return { destroyed: true, cracked: false };
    }

    let newlyCracked = false;
    const lightHp = TERRAIN.HP_MAX * TERRAIN.CRACK_LIGHT;
    const heavyHp = TERRAIN.HP_MAX * TERRAIN.CRACK_HEAVY;

    if (mesh) {
      // Heavy damage: sunken + scorched
      if (!mesh.userData.heavy && hp <= heavyHp) {
        mesh.userData.heavy = true;
        mesh.userData.cracked = true;
        mesh.scale.y = 0.4;
        mesh.position.y = GRID.TERRAIN_HEIGHT * 0.2;
        if (mesh.material) {
          mesh.material.color.multiplyScalar(0.5);
          mesh.material.emissive.setHex(0xff5522);
          mesh.material.emissiveIntensity = 0.18;
        }
        newlyCracked = prevHp > heavyHp;
      } else if (!mesh.userData.cracked && hp <= lightHp) {
        // Light crack: slight darken + small sink
        mesh.userData.cracked = true;
        mesh.scale.y = 0.7;
        mesh.position.y = GRID.TERRAIN_HEIGHT * 0.35;
        if (mesh.material) {
          mesh.material.color.multiplyScalar(0.75);
          mesh.material.emissiveIntensity = 0.08;
        }
        newlyCracked = prevHp > lightHp;
      }
    }
    return { destroyed: false, cracked: newlyCracked };
  }

  buildTerrainMesh() {
    const group = new THREE.Group();
    this.terrainGroup = group;
    const pathSet = new Set(this.pathCells.map(c => `${c.x},${c.z}`));

    // Reset mesh refs (rebuilt on every call)
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        this.cellMeshes[x][z] = null;
      }
    }

    const terrainColors = [COLORS.TERRAIN_MINT, COLORS.TERRAIN_LAVENDER, COLORS.TERRAIN_CREAM];
    const geo = new THREE.BoxGeometry(GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT, GRID.CELL_SIZE);

    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        if (pathSet.has(`${x},${z}`)) continue;
        if (this.cells[x][z] === CELL_DESTROYED) continue;
        const ci = (Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) | 0) % 3;
        const mat = new THREE.MeshLambertMaterial({
          color: terrainColors[ci],
          emissive: terrainColors[ci],
          emissiveIntensity: 0.03,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
          GRID.TERRAIN_HEIGHT * 0.5,
          z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
        );
        mesh.receiveShadow = true;
        mesh.userData.col = x;
        mesh.userData.row = z;
        this.cellMeshes[x][z] = mesh;
        group.add(mesh);
      }
    }

    // Island base (darker layer underneath)
    const baseGeo = new THREE.BoxGeometry(
      this.cols * GRID.CELL_SIZE + 2,
      0.6,
      this.rows * GRID.CELL_SIZE + 2
    );
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x443366 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(
      this.cols * GRID.CELL_SIZE * 0.5,
      -0.3,
      this.rows * GRID.CELL_SIZE * 0.5
    );
    group.add(base);

    // Bottom layer for floating island effect
    const bottomGeo = new THREE.ConeGeometry(
      Math.max(this.cols, this.rows) * GRID.CELL_SIZE * 0.4,
      4, 6
    );
    const bottomMat = new THREE.MeshLambertMaterial({ color: 0x332255 });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.set(
      this.cols * GRID.CELL_SIZE * 0.5,
      -2.5,
      this.rows * GRID.CELL_SIZE * 0.5
    );
    bottom.rotation.y = Math.PI / 6;
    group.add(bottom);

    return group;
  }

  buildGridOverlay() {
    const group = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
    });

    for (let x = 0; x <= this.cols; x++) {
      const points = [
        new THREE.Vector3(x * GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT + 0.01, 0),
        new THREE.Vector3(x * GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT + 0.01, this.rows * GRID.CELL_SIZE),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geo, lineMat));
    }
    for (let z = 0; z <= this.rows; z++) {
      const points = [
        new THREE.Vector3(0, GRID.TERRAIN_HEIGHT + 0.01, z * GRID.CELL_SIZE),
        new THREE.Vector3(this.cols * GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT + 0.01, z * GRID.CELL_SIZE),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geo, lineMat));
    }

    return group;
  }
}
