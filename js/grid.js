// grid.js - Grid state, terrain building, placement validation
import * as THREE from 'three';
import { GRID, COLORS, DECORATIONS } from './config.js';
import { buildPathCells } from './path.js';

// Cell type codes stored in this.cells[col][row]:
//   0 = empty (placeable)
//   1 = path (unbuildable)
//   2 = tower (occupied)
//   4 = decoration (unbuildable — pillar, crystal shard, or boulder)
const CELL_EMPTY = 0;
const CELL_PATH = 1;
const CELL_TOWER = 2;
const CELL_DECOR = 4;

export class Grid {
  constructor() {
    this.cols = GRID.COLS;
    this.rows = GRID.ROWS;
    this.cells = Array.from({ length: this.cols }, () =>
      Array.from({ length: this.rows }, () => CELL_EMPTY)
    );
    // Stores which decoration type ('pillar'|'crystal'|'boulder') is at each cell.
    this.cellDecorType = Array.from({ length: this.cols }, () =>
      Array.from({ length: this.rows }, () => null)
    );
    this.pathCells = [];
    this._terrainGroup = null;
  }

  // Replace the path. Clears all flags (including decorations) and re-marks
  // new path cells. Call placeDecorations(rng) after this before buildTerrainMesh.
  rebuildPath(waypoints) {
    this.pathCells = buildPathCells(waypoints);
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        this.cells[x][z] = CELL_EMPTY;
        this.cellDecorType[x][z] = null;
      }
    }
    for (const c of this.pathCells) {
      if (c.x >= 0 && c.x < this.cols && c.z >= 0 && c.z < this.rows) {
        this.cells[c.x][c.z] = CELL_PATH;
      }
    }
  }

  // Place decorations using the seeded RNG. Marks CELL_DECOR cells but does
  // not build meshes yet — call buildTerrainMesh() after this.
  placeDecorations(rng) {
    const pathSet = new Set(this.pathCells.map(c => `${c.x},${c.z}`));
    const margin = GRID.DECOR_PATH_MARGIN;

    // Collect candidates: empty cells at least margin away from any path cell.
    const candidates = [];
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        if (this.cells[x][z] !== CELL_EMPTY) continue;
        let tooClose = false;
        outer: for (let dx = -margin; dx <= margin; dx++) {
          for (let dz = -margin; dz <= margin; dz++) {
            if (pathSet.has(`${x + dx},${z + dz}`)) { tooClose = true; break outer; }
          }
        }
        if (!tooClose) candidates.push({ x, z });
      }
    }

    const types = Object.keys(DECORATIONS);
    const count = GRID.DECOR_MIN + Math.floor(rng() * (GRID.DECOR_MAX - GRID.DECOR_MIN + 1));

    for (let i = 0; i < count && candidates.length > 0; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const { x, z } = candidates.splice(idx, 1)[0];
      const type = types[Math.floor(rng() * types.length)];
      this.cells[x][z] = CELL_DECOR;
      this.cellDecorType[x][z] = type;
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

  buildTerrainMesh() {
    const group = new THREE.Group();
    this._terrainGroup = group;
    const pathSet = new Set(this.pathCells.map(c => `${c.x},${c.z}`));

    const terrainColors = [COLORS.TERRAIN_MINT, COLORS.TERRAIN_LAVENDER, COLORS.TERRAIN_CREAM];
    const terrainGeo = new THREE.BoxGeometry(GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT, GRID.CELL_SIZE);

    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        if (pathSet.has(`${x},${z}`)) continue;
        // Decoration cells get their own mesh below; skip normal terrain tile.
        if (this.cells[x][z] === CELL_DECOR) continue;

        const ci = (Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) | 0) % 3;
        const mat = new THREE.MeshLambertMaterial({
          color: terrainColors[ci],
          emissive: terrainColors[ci],
          emissiveIntensity: 0.03,
        });
        const mesh = new THREE.Mesh(terrainGeo, mat);
        mesh.position.set(
          x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
          GRID.TERRAIN_HEIGHT * 0.5,
          z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
        );
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }

    // Build decoration meshes for CELL_DECOR cells.
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        if (this.cells[x][z] !== CELL_DECOR) continue;
        const type = this.cellDecorType[x][z] || 'boulder';
        const dcfg = DECORATIONS[type];

        const geo = new THREE.BoxGeometry(dcfg.width, dcfg.height, dcfg.width);
        const mat = new THREE.MeshLambertMaterial({
          color: dcfg.color,
          emissive: dcfg.emissive,
          emissiveIntensity: dcfg.emissiveIntensity,
        });
        const mesh = new THREE.Mesh(geo, mat);
        // Sit flush on top of the terrain surface.
        mesh.position.set(
          x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
          GRID.TERRAIN_HEIGHT + dcfg.height * 0.5,
          z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
        );
        mesh.castShadow = true;
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
