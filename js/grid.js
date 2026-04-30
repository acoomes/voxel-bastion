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
  // destroyed cells are skipped. Returns the number of cells newly destroyed.
  applyDamageAt(worldX, worldZ, radius, damage, particles) {
    const cellSize = GRID.CELL_SIZE;
    const minCol = Math.max(0, Math.floor((worldX - radius) / cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((worldX + radius) / cellSize));
    const minRow = Math.max(0, Math.floor((worldZ - radius) / cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((worldZ + radius) / cellSize));
    const r2 = radius * radius;
    let destroyed = 0;

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
        const falloff = 1 - (dist / radius) * 0.6;
        if (this._damageCell(col, row, damage * falloff, particles)) {
          destroyed++;
        }
      }
    }
    return destroyed;
  }

  // Internal: apply `dmg` to one cell and update its visual state. Returns
  // true if the hit destroyed the cell.
  _damageCell(col, row, dmg, particles) {
    this.cellHP[col][row] -= dmg;
    const mesh = this.cellMeshes[col][row];
    const hp = this.cellHP[col][row];

    if (hp <= 0) {
      this.cells[col][row] = CELL_DESTROYED;
      this.cellHP[col][row] = 0;
      this.cellMeshes[col][row] = null;
      if (mesh) {
        if (this.terrainGroup) this.terrainGroup.remove(mesh);
        if (particles && particles.terrainShatter) {
          const cx = col * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
          const cz = row * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
          const color = mesh.material && mesh.material.color
            ? mesh.material.color.getHex()
            : 0x9988aa;
          particles.terrainShatter({ x: cx, y: GRID.TERRAIN_HEIGHT * 0.5, z: cz }, color);
        }
      }
      return true;
    }

    // Cracked: sink the cell visibly. Once-only state change.
    if (mesh && !mesh.userData.cracked && hp <= TERRAIN.HP_MAX * TERRAIN.CRACK_THRESHOLD) {
      mesh.userData.cracked = true;
      mesh.scale.y = 0.55;
      mesh.position.y = GRID.TERRAIN_HEIGHT * 0.275; // bottom stays at substrate
      if (mesh.material) {
        mesh.material.color.multiplyScalar(0.65);
        mesh.material.emissive.multiplyScalar(0.65);
        mesh.material.emissiveIntensity = 0.06;
      }
    }
    return false;
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
