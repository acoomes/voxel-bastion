// grid.js - Grid state, terrain building, placement validation
import * as THREE from 'three';
import { GRID, COLORS } from './config.js';
import { buildPathCells } from './path.js';

export class Grid {
  constructor() {
    this.cols = GRID.COLS;
    this.rows = GRID.ROWS;
    // 0 = empty, 1 = path, 2 = tower
    this.cells = Array.from({ length: this.cols }, () =>
      Array.from({ length: this.rows }, () => 0)
    );
    this.pathCells = [];
  }

  // Replace the path. Clears all path/tower flags and re-marks new path cells.
  // Callers responsible for clearing the actual tower entities (towerManager).
  rebuildPath(waypoints) {
    this.pathCells = buildPathCells(waypoints);
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        this.cells[x][z] = 0;
      }
    }
    for (const c of this.pathCells) {
      if (c.x >= 0 && c.x < this.cols && c.z >= 0 && c.z < this.rows) {
        this.cells[c.x][c.z] = 1;
      }
    }
  }

  canPlace(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.cells[col][row] === 0;
  }

  placeTower(col, row) {
    this.cells[col][row] = 2;
  }

  removeTower(col, row) {
    this.cells[col][row] = 0;
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
    const pathSet = new Set(this.pathCells.map(c => `${c.x},${c.z}`));

    // Terrain colors palette
    const terrainColors = [COLORS.TERRAIN_MINT, COLORS.TERRAIN_LAVENDER, COLORS.TERRAIN_CREAM];
    const geo = new THREE.BoxGeometry(GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT, GRID.CELL_SIZE);

    // Noise-based color selection for varied terrain
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        if (pathSet.has(`${x},${z}`)) continue;
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

    // Vertical lines
    for (let x = 0; x <= this.cols; x++) {
      const points = [
        new THREE.Vector3(x * GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT + 0.01, 0),
        new THREE.Vector3(x * GRID.CELL_SIZE, GRID.TERRAIN_HEIGHT + 0.01, this.rows * GRID.CELL_SIZE),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geo, lineMat));
    }
    // Horizontal lines
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
