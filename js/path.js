// path.js - Path waypoints & rendering
import * as THREE from 'three';
import { PATH_WAYPOINTS, GRID, COLORS } from './config.js';

// Expand waypoints into a list of grid cells along the path
function bresenhamLine(x0, z0, x1, z1) {
  const cells = [];
  const dx = Math.abs(x1 - x0);
  const dz = Math.abs(z1 - z0);
  const sx = x0 < x1 ? 1 : -1;
  const sz = z0 < z1 ? 1 : -1;
  let err = dx - dz;
  let x = x0, z = z0;
  while (true) {
    cells.push({ x, z });
    if (x === x1 && z === z1) break;
    const e2 = 2 * err;
    if (e2 > -dz) { err -= dz; x += sx; }
    if (e2 < dx) { err += dx; z += sz; }
  }
  return cells;
}

export function buildPathCells() {
  const cells = [];
  const cellSet = new Set();
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const a = PATH_WAYPOINTS[i];
    const b = PATH_WAYPOINTS[i + 1];
    const line = bresenhamLine(a.x, a.z, b.x, b.z);
    for (const c of line) {
      const key = `${c.x},${c.z}`;
      if (!cellSet.has(key)) {
        cellSet.add(key);
        cells.push(c);
      }
    }
  }
  // Widen path to 2 cells
  const widened = new Set();
  const result = [];
  for (const c of cells) {
    for (let dx = 0; dx <= 1; dx++) {
      for (let dz = 0; dz <= 1; dz++) {
        const nx = c.x + dx;
        const nz = c.z + dz;
        if (nx < GRID.COLS && nz < GRID.ROWS) {
          const key = `${nx},${nz}`;
          if (!widened.has(key)) {
            widened.add(key);
            result.push({ x: nx, z: nz });
          }
        }
      }
    }
  }
  return result;
}

// Build world-space waypoints for enemy path following
export function buildPathWorldPoints() {
  return PATH_WAYPOINTS.map(p => new THREE.Vector3(
    p.x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
    GRID.TERRAIN_HEIGHT - GRID.PATH_DEPTH + 0.15,
    p.z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
  ));
}

// Build path mesh
export function buildPathMesh() {
  const pathCells = buildPathCells();
  const group = new THREE.Group();

  // Path channel (slightly recessed)
  const geo = new THREE.BoxGeometry(GRID.CELL_SIZE, GRID.PATH_DEPTH, GRID.CELL_SIZE);
  const mat = new THREE.MeshLambertMaterial({
    color: COLORS.PATH_STONE,
    emissive: COLORS.PATH_STONE,
    emissiveIntensity: 0.05,
  });

  for (const cell of pathCells) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      cell.x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
      GRID.TERRAIN_HEIGHT - GRID.PATH_DEPTH * 0.5,
      cell.z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
    );
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Path edge glow lines
  const edgeMat = new THREE.MeshBasicMaterial({
    color: COLORS.PATH_EDGE,
    transparent: true,
    opacity: 0.3,
  });
  const edgeGeo = new THREE.BoxGeometry(GRID.CELL_SIZE * 0.08, GRID.PATH_DEPTH + 0.02, GRID.CELL_SIZE);
  const edgeGeoZ = new THREE.BoxGeometry(GRID.CELL_SIZE, GRID.PATH_DEPTH + 0.02, GRID.CELL_SIZE * 0.08);

  const cellSet = new Set(pathCells.map(c => `${c.x},${c.z}`));
  for (const cell of pathCells) {
    // Left edge
    if (!cellSet.has(`${cell.x - 1},${cell.z}`)) {
      const e = new THREE.Mesh(edgeGeo, edgeMat);
      e.position.set(
        cell.x * GRID.CELL_SIZE + 0.04,
        GRID.TERRAIN_HEIGHT - GRID.PATH_DEPTH * 0.5,
        cell.z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
      );
      group.add(e);
    }
    // Right edge
    if (!cellSet.has(`${cell.x + 1},${cell.z}`)) {
      const e = new THREE.Mesh(edgeGeo, edgeMat);
      e.position.set(
        (cell.x + 1) * GRID.CELL_SIZE - 0.04,
        GRID.TERRAIN_HEIGHT - GRID.PATH_DEPTH * 0.5,
        cell.z * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5
      );
      group.add(e);
    }
    // Top edge
    if (!cellSet.has(`${cell.x},${cell.z - 1}`)) {
      const e = new THREE.Mesh(edgeGeoZ, edgeMat);
      e.position.set(
        cell.x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
        GRID.TERRAIN_HEIGHT - GRID.PATH_DEPTH * 0.5,
        cell.z * GRID.CELL_SIZE + 0.04
      );
      group.add(e);
    }
    // Bottom edge
    if (!cellSet.has(`${cell.x},${cell.z + 1}`)) {
      const e = new THREE.Mesh(edgeGeoZ, edgeMat);
      e.position.set(
        cell.x * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5,
        GRID.TERRAIN_HEIGHT - GRID.PATH_DEPTH * 0.5,
        (cell.z + 1) * GRID.CELL_SIZE - 0.04
      );
      group.add(e);
    }
  }

  return group;
}

export function getPathLength() {
  const pts = buildPathWorldPoints();
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += pts[i].distanceTo(pts[i - 1]);
  }
  return len;
}
