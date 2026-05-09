# Iteration: Procedural Terrain Decoration

This iteration adds procedural decorative structures to the game map —
pillars, crystal shards, and boulders placed by the seeded RNG each run.
Each run gets a different layout, making seeds feel visually distinct and
giving playtesters something to comment on beyond the path shape.

## Why now

Every run still looks nearly identical — same flat grid, same three tile
colors. Decoration placement is hook-independent, uses the existing seeded
RNG, and requires only `js/grid.js` changes. It also sets up the data
structures needed to integrate decorations with the upcoming voxel
destruction system (feat/voxel-destruction) when that branch merges.

## Designs

### Decoration types

Three types, each with distinct visual identity:

| Type | Visual | HP mul | Gameplay role |
|------|--------|--------|---------------|
| **Pillar** | Narrow stone column, 0.4×2.4 | 1.5× | Tall silhouette; clusters look like ruins |
| **Crystal shard** | Glowing cyan/magenta, 0.65×1.6 | 0.8× | Lights up the map; visually pop |
| **Boulder** | Squat earthy rock, 0.95×0.55 | 2.0× | Low profile; breaks up flat areas |

HP multiplier is relative to a base of 100. These values don't affect
gameplay in this slice (no destruction system here) but are defined for
clean integration when feat/voxel-destruction merges.

### Placement rules

- Per-run count: 6–14 (seeded RNG).
- Exclusion zone: cells within 2 grid cells of any path cell are ineligible.
- Decorations block tower placement (`CELL_DECOR = 4`, same as `CELL_PATH`).
- Placement deterministic per seed — same seed always gives same map.
- Decorations are reset on every new run via `rebuildPath`.

### Visual design

Pillars: dark slate-grey (`0x5c6e7a`), no emissive, tall and austere.
Crystal shards: bright cyan-green (`0x44ffee`) with strong emissive glow
matching the Frost tower palette. Alternates between two colors per cluster.
Boulders: warm earthy brown-grey (`0x8a7a6a`), faint emissive, squat and
irregular-looking due to 0.95:0.55 aspect ratio.

Multiple decorations of the same type can cluster naturally from RNG,
producing pillar fields, crystal clusters, or boulder runs.

## Implementation outline

| File | Change |
|------|--------|
| `js/config.js` | Add `DECORATIONS` export + three decoration type configs. Add `GRID.DECOR_MIN`, `GRID.DECOR_MAX`, `GRID.DECOR_PATH_MARGIN`. |
| `js/grid.js` | Add `CELL_DECOR = 4` constant; `cellDecorType[col][row]` array; `placeDecorations(rng)` method; update `buildTerrainMesh` to skip CELL_DECOR tiles and create decoration meshes for them; update `canPlace` to exclude CELL_DECOR; update `rebuildPath` to reset `cellDecorType`. |
| `js/main.js` | Call `grid.placeDecorations(gameState.rng)` in `setupPath()` after `rebuildPath`, before `buildTerrainMesh`. |
| `docs/queue.md` | Mark "Procedural terrain features" checklist item done. |

## Out of scope

- Destruction integration (handled when feat/voxel-destruction merges).
- Branching/backward path segments (next Workstream 2 code slice).
- Map size variation.
- Decoration rise-from-ground animation (polish pass).

## Acceptance

- Every new run places 6–14 decorations in visually distinct positions.
- Same seed produces identical decoration layout on restart.
- Hover over a decoration cell shows it as non-placeable (same as path).
- Decorations don't overlap path cells or each other.
- `node --check` passes on all modified JS files.
