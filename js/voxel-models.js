// voxel-models.js - 3D array model definitions -> InstancedMesh builder
import * as THREE from 'three';
import { COLORS } from './config.js';

// 3D voxel model definitions - [y layer from bottom][z row][x col]
// 0 = empty, hex color = filled
const M = COLORS.CRYSTAL_MAGENTA;
const C = COLORS.FROST_CYAN;
const G = COLORS.SPARK_GOLD;
const P = COLORS.GOLEM_PURPLE;
const S = COLORS.SPRINTER_MINT;
const W = COLORS.SWARMLING_CORAL;
const B = 0xcc44ff; // boss
const R = 0xddaaff; // wraith
const R = 0xddaaff; // wraith

const MODEL_DEFS = {
  crystal: {
    voxels: [
      // Layer 0 (base platform)
      [[0, M, 0], [M, 0x992266, M], [0, M, 0]],
      // Layer 1
      [[0, M, 0], [M, M, M], [0, M, 0]],
      // Layer 2
      [[0, M, 0], [M, 0xff88dd, M], [0, M, 0]],
      // Layer 3
      [[0, 0, 0], [0, M, 0], [0, 0, 0]],
      // Layer 4 (crystal tip)
      [[0, 0, 0], [0, 0xff88ee, 0], [0, 0, 0]],
      // Layer 5 (glow tip)
      [[0, 0, 0], [0, 0xffaaff, 0], [0, 0, 0]],
    ],
    scale: 0.2,
  },
  frost: {
    voxels: [
      // Layer 0 (ice base)
      [[C, C, C], [C, 0x226666, C], [C, C, C]],
      // Layer 1
      [[0, C, 0], [C, 0x88ffee, C], [0, C, 0]],
      // Layer 2
      [[0, C, 0], [C, C, C], [0, C, 0]],
      // Layer 3
      [[0, 0, 0], [0, 0xaaffff, 0], [0, 0, 0]],
      // Layer 4
      [[0, 0, 0], [0, 0xccffff, 0], [0, 0, 0]],
      // Layer 5 (frost tip)
      [[0, 0, 0], [0, 0xeeffff, 0], [0, 0, 0]],
    ],
    scale: 0.18,
  },
  spark: {
    voxels: [
      // Layer 0 (pylon base)
      [[G, 0, G], [0, 0x665500, 0], [G, 0, G]],
      // Layer 1
      [[0, G, 0], [G, 0xffee66, G], [0, G, 0]],
      // Layer 2
      [[G, 0, G], [0, G, 0], [G, 0, G]],
      // Layer 3
      [[0, G, 0], [G, 0xffee66, G], [0, G, 0]],
      // Layer 4 (spark tip)
      [[0, 0, 0], [0, 0xffffaa, 0], [0, 0, 0]],
      // Layer 5 (glow)
      [[0, 0, 0], [0, 0xffff88, 0], [0, 0, 0]],
    ],
    scale: 0.18,
  },
  sprinter: {
    voxels: [
      // Layer 0 (legs)
      [[S, 0, S], [0, 0, 0], [S, 0, S]],
      // Layer 1 (body)
      [[S, S, S], [S, S, S], [S, S, S]],
      // Layer 2 (head)
      [[0, S, 0], [S, 0x88ffcc, S], [0, S, 0]],
    ],
    scale: 0.12,
  },
  golem: {
    voxels: [
      [[P, P, P, P, P], [P, P, P, P, P], [P, P, P, P, P], [P, P, P, P, P], [P, P, P, P, P]],
      [[P, P, P, P, P], [P, 0xbb77ee, P, 0xbb77ee, P], [P, P, P, P, P], [P, 0xbb77ee, P, 0xbb77ee, P], [P, P, P, P, P]],
      [[0, P, P, P, 0], [P, P, P, P, P], [P, P, 0xdd88ff, P, P], [P, P, P, P, P], [0, P, P, P, 0]],
      [[0, 0, P, 0, 0], [0, P, P, P, 0], [P, P, P, P, P], [0, P, P, P, 0], [0, 0, P, 0, 0]],
      [[0, 0, 0, 0, 0], [0, 0, P, 0, 0], [0, P, 0xeeccff, P, 0], [0, 0, P, 0, 0], [0, 0, 0, 0, 0]],
    ],
    scale: 0.15,
  },
  swarmling: {
    voxels: [
      [[W, W], [W, W]],
      [[0xff9988, W], [W, 0xff9988]],
      [[0, 0xff8877], [0xff8877, 0]],
    ],
    scale: 0.1,
  },
  wraith: {
    voxels: [
      // Trailing wisp
      [[0, R, 0], [R, R, R], [0, R, 0]],
      // Shoulders
      [[R, R, R], [R, 0xeeccff, R], [R, R, R]],
      // Head
      [[0, R, 0], [R, 0xffeeff, R], [0, R, 0]],
      // Crown
      [[0, 0, 0], [0, 0xffeeff, 0], [0, 0, 0]],
    ],
    scale: 0.13,
  },
  boss: {
    voxels: [
      [[B, B, B, B, B, B, B], [B, B, B, B, B, B, B], [B, B, B, B, B, B, B], [B, B, B, B, B, B, B], [B, B, B, B, B, B, B], [B, B, B, B, B, B, B], [B, B, B, B, B, B, B]],
      [[B, B, B, B, B, B, B], [B, 0xdd66ff, B, B, B, 0xdd66ff, B], [B, B, B, B, B, B, B], [B, B, B, 0xee88ff, B, B, B], [B, B, B, B, B, B, B], [B, 0xdd66ff, B, B, B, 0xdd66ff, B], [B, B, B, B, B, B, B]],
      [[0, B, B, B, B, B, 0], [B, B, B, B, B, B, B], [B, B, 0xee88ff, B, 0xee88ff, B, B], [B, B, B, B, B, B, B], [B, B, 0xee88ff, B, 0xee88ff, B, B], [B, B, B, B, B, B, B], [0, B, B, B, B, B, 0]],
      [[0, 0, B, B, B, 0, 0], [0, B, B, B, B, B, 0], [B, B, B, B, B, B, B], [B, B, B, 0xff99ff, B, B, B], [B, B, B, B, B, B, B], [0, B, B, B, B, B, 0], [0, 0, B, B, B, 0, 0]],
      [[0, 0, 0, B, 0, 0, 0], [0, 0, B, B, B, 0, 0], [0, B, B, B, B, B, 0], [B, B, B, 0xff99ff, B, B, B], [0, B, B, B, B, B, 0], [0, 0, B, B, B, 0, 0], [0, 0, 0, B, 0, 0, 0]],
      [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, B, 0, 0, 0], [0, 0, B, B, B, 0, 0], [0, B, B, B, B, B, 0], [0, 0, B, B, B, 0, 0], [0, 0, 0, B, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]],
      [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, B, 0, 0, 0], [0, 0, B, 0xffaaff, B, 0, 0], [0, 0, 0, B, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]],
    ],
    scale: 0.14,
  },
  projectile: {
    voxels: [
      [[0xff44cc]],
    ],
    scale: 0.15,
  },
  base_crystal: {
    voxels: [
      [[0, 0x44ffcc, 0], [0x44ffcc, 0x44ffcc, 0x44ffcc], [0, 0x44ffcc, 0]],
      [[0, 0x44ffcc, 0], [0x44ffcc, 0x88ffdd, 0x44ffcc], [0, 0x44ffcc, 0]],
      [[0, 0, 0], [0, 0x44ffcc, 0], [0, 0, 0]],
      [[0, 0, 0], [0, 0xaaffee, 0], [0, 0, 0]],
      [[0, 0, 0], [0, 0xccffff, 0], [0, 0, 0]],
    ],
    scale: 0.3,
  },
};

// Shared box geometry for instanced meshes
const _boxGeo = new THREE.BoxGeometry(1, 1, 1);

/**
 * Parse a voxel model definition into a list of {x,y,z,color} voxels
 */
export function parseModelDef(key) {
  const def = MODEL_DEFS[key];
  if (!def) return null;
  const voxels = [];
  const layers = def.voxels;
  for (let y = 0; y < layers.length; y++) {
    const layer = layers[y];
    for (let z = 0; z < layer.length; z++) {
      const row = layer[z];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          voxels.push({ x, y, z, color: row[x] });
        }
      }
    }
  }
  return { voxels, scale: def.scale };
}

/**
 * Build a THREE.Group from a voxel model definition (for single/static objects)
 */
export function buildVoxelGroup(key, overrideColor) {
  const parsed = parseModelDef(key);
  if (!parsed) return new THREE.Group();
  const { voxels, scale } = parsed;

  const group = new THREE.Group();
  // Center offset
  const maxX = Math.max(...voxels.map(v => v.x)) + 1;
  const maxZ = Math.max(...voxels.map(v => v.z)) + 1;
  const cx = maxX / 2;
  const cz = maxZ / 2;

  for (const v of voxels) {
    const geo = _boxGeo;
    const mat = new THREE.MeshLambertMaterial({
      color: overrideColor || v.color,
      emissive: overrideColor || v.color,
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((v.x - cx + 0.5) * scale, v.y * scale, (v.z - cz + 0.5) * scale);
    mesh.scale.setScalar(scale * 0.92);
    group.add(mesh);
  }
  return group;
}

/**
 * Build an InstancedMesh for pooling many copies of a model
 * Returns { mesh, voxelOffsets, count }
 * voxelOffsets is array of local offsets for each voxel in model (for shatter)
 */
export function buildInstancedModel(key, maxInstances, overrideColor) {
  const parsed = parseModelDef(key);
  if (!parsed) return null;
  const { voxels, scale } = parsed;

  const maxX = Math.max(...voxels.map(v => v.x)) + 1;
  const maxZ = Math.max(...voxels.map(v => v.z)) + 1;
  const cx = maxX / 2;
  const cz = maxZ / 2;

  const totalVoxels = voxels.length;
  const totalInstances = maxInstances * totalVoxels;

  const mat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.1,
  });

  const mesh = new THREE.InstancedMesh(_boxGeo, mat, totalInstances);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Per-instance color
  mesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(totalInstances * 3), 3
  );
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

  const voxelOffsets = voxels.map(v => ({
    x: (v.x - cx + 0.5) * scale,
    y: v.y * scale,
    z: (v.z - cz + 0.5) * scale,
    color: overrideColor || v.color,
    scale: scale * 0.92,
  }));

  // Initially hide all instances
  const dummy = new THREE.Object3D();
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  for (let i = 0; i < totalInstances; i++) {
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = totalInstances;
  mesh.frustumCulled = false;

  return { mesh, voxelOffsets, voxelsPerModel: totalVoxels, maxInstances, scale };
}

/**
 * Update an instance within an InstancedMesh model
 * instanceIdx: which entity (0..maxInstances-1)
 * position: THREE.Vector3 world position
 * rotation: y-axis rotation
 * visible: boolean
 */
export function updateInstance(instancedModel, instanceIdx, position, rotation, visible) {
  const { mesh, voxelOffsets, voxelsPerModel } = instancedModel;
  const dummy = new THREE.Object3D();
  const baseIdx = instanceIdx * voxelsPerModel;
  const color = new THREE.Color();

  for (let i = 0; i < voxelsPerModel; i++) {
    const off = voxelOffsets[i];
    if (visible) {
      dummy.position.set(
        position.x + off.x * Math.cos(rotation) - off.z * Math.sin(rotation),
        position.y + off.y,
        position.z + off.x * Math.sin(rotation) + off.z * Math.cos(rotation)
      );
      dummy.scale.setScalar(off.scale);
      dummy.rotation.y = rotation;
    } else {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0);
    }
    dummy.updateMatrix();
    mesh.setMatrixAt(baseIdx + i, dummy.matrix);
    color.setHex(off.color);
    mesh.setColorAt(baseIdx + i, color);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export { MODEL_DEFS };
