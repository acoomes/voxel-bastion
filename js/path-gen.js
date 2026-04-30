// path-gen.js - Seeded procedural path generation.
//
// Produces waypoints from the left edge (x=0) to the right edge (x=cols-1)
// using alternating horizontal and vertical manhattan-style segments.
// Path is widened by +1 cell during cell expansion (see path.js), so we
// reserve a one-row margin from the bottom edge in addition to a one-row
// margin from the top.

const MIN_H_SEG = 3;
const MAX_H_SEG = 7;
const MIN_V_STEP = 2;
const MARGIN = 1;

export function generatePathWaypoints(rng, cols, rows) {
  const minZ = MARGIN;
  const maxZ = rows - 2 - MARGIN; // -1 for path widening, -1 for top margin

  let x = 0;
  let z = minZ + Math.floor(rng() * (maxZ - minZ + 1));
  const wp = [{ x, z }];

  while (x < cols - 1) {
    const remaining = cols - 1 - x;
    const desiredLen = MIN_H_SEG + Math.floor(rng() * (MAX_H_SEG - MIN_H_SEG + 1));
    const segLen = Math.min(remaining, desiredLen);
    x += segLen;
    wp.push({ x, z });

    if (x >= cols - 1) break;

    let newZ;
    let attempts = 0;
    do {
      newZ = minZ + Math.floor(rng() * (maxZ - minZ + 1));
      attempts++;
    } while (Math.abs(newZ - z) < MIN_V_STEP && attempts < 8);
    z = newZ;
    wp.push({ x, z });
  }

  return wp;
}
