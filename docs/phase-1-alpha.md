# Phase 1 — Alpha: Nail the Core Loop

**Duration:** 2–3 months (full-time solo)

**Status:** not started · blocked on Phase 0 hook decision

**Assumes hook:** roguelite voxel TD with destructible terrain (per Phase 0 recommendation). If a different hook is chosen, this plan needs revision.

---

## Goal

A 30-minute run that's genuinely fun to repeat. **No polish, no second biome, no music, no story.** Just the loop:

> Start run → randomized map → 3 acts × ~8 waves → die or finish → spend meta-currency → start next run.

By end of Phase 1, you (and a friend) should be able to play 5 runs back-to-back without it feeling repetitive — and have at least one moment per run where you say *"oh that's cool"* about something that happened to the terrain.

## Why this scope

Phase 1 is the **proof of concept for the hook**. If the loop isn't fun before art polish, music, multiple biomes, or a meta-progression tree exist, no amount of those things will save it. Add them in Phase 2 onward, after the loop is validated.

Skip ALL of these in Phase 1:
- Tutorial / onboarding
- Settings menus beyond the bare minimum
- Music (procedural sfx is fine for now)
- More than one biome's visual treatment
- Localization
- Save/resume mid-run (death is fine)
- Achievements
- Anything cosmetic

## Workstreams overview

| # | Workstream | Effort | Depends on |
|---|------------|--------|------------|
| 1 | Run state machine refactor | 1 wk | – |
| 2 | Procedural map generation | 2 wks | 1 |
| 3 | Voxel destruction | 2 wks | 2 |
| 4 | Tower roster expansion | 1.5 wks | 1 |
| 5 | Enemy roster + counters | 1.5 wks | 1 |
| 6 | Run economy + meta-currency | 1 wk | 1 |
| 7 | Meta hub (between-run screen) | 1 wk | 6 |
| 8 | Acts + boss flow | 1 wk | 2, 5 |
| 9 | Balance + playtest pass | 2 wks | all |

Total: ~13 weeks. Buffer to 14–15 weeks for unexpected work.

---

## Workstream 1 — Run state machine refactor

**Why first:** every other workstream needs a clean separation between "current run" state and "permanent meta" state. Doing this first makes the rest cheaper.

**Current state (`js/game.js`):** `GameState` mixes per-run (hp, gold, wave) and persistent (`bestWave`) data. Works for the current single-session prototype but won't survive Phase 1.

**Target structure:**

```
MetaState (persistent, localStorage)
├── unlockedTowers: Set<string>
├── unlockedModifiers: Set<string>
├── metaCurrency: number
├── ascensionLevel: number
├── bestWave / bestRun: number
└── stats: { totalRuns, totalKills, ... }

RunState (per run, ephemeral)
├── seed: number          ← controls procedural generation
├── map: GeneratedMap
├── act: 1 | 2 | 3
├── wave: number
├── hp / gold / towers
├── modifiers: ChosenModifier[]
└── runStartTime: number
```

### Tasks

- [ ] Split `GameState` into `MetaState` (persistent) and `RunState` (ephemeral)
- [ ] Add seeded RNG utility (`js/rng.js`) — `mulberry32` is fine; needs to be deterministic per seed
- [ ] Refactor wave generation to use seeded RNG so previews/replays are deterministic
- [ ] Add `startNewRun(seed?)` and `endRun(reason)` lifecycle methods
- [ ] Persist `MetaState` on every meta change (wrap in try/catch as `bestWave` already is)

### Acceptance

- Running the same seed twice produces the same map, wave compositions, and (given the same player inputs) the same outcomes
- Restart cleanly clears `RunState` without touching `MetaState`
- `bestWave` and the new meta fields all persist correctly

---

## Workstream 2 — Procedural map generation

**Why this matters:** randomized maps are the central differentiator. If maps feel same-y or unfair, the roguelite loop dies.

**Current state (`js/path.js`):** fixed `PATH_WAYPOINTS` array, single path. Needs to become a runtime generator.

### Design constraints

- Path must traverse from a spawn edge to the player base (configurable per map)
- Must produce **multiple paths** sometimes (1, 2, or 3 — affects difficulty)
- Must guarantee enough buildable cells along the path (≥30 placements within tower range of path)
- Must look readable from the isometric view — no twisty rat-mazes
- Map gen must complete in <50ms (called every run)

### Algorithm sketch

1. Pick spawn edges (1–3) and base position (always center of opposite edge or near corner)
2. For each spawn, run a **biased random walk** with momentum bias toward base
3. Smooth path: collapse 90° doglegs to be more direct; ensure minimum segment length
4. Validate: count buildable cells in tower range of path; if <30, regenerate (cap 5 attempts)
5. Optionally add "elevation" — terrain cells at different heights for visual variety (Phase 1: skip; Phase 3 feature)

### Tasks

- [ ] `js/map-gen.js` — pure function `generateMap(seed, params): GeneratedMap`
- [ ] Replace `PATH_WAYPOINTS` consumers with `runState.map.paths`
- [ ] Update `Grid` to take a generated map rather than reading config
- [ ] Update enemy path-following to handle multiple paths (each enemy assigned a path on spawn)
- [ ] Build a quick **map preview** at run start — show map shape briefly before wave 1 (3-second sweep)
- [ ] Map seed visible in UI (small text) — useful for debugging and player sharing

### Acceptance

- 50 random seeds all produce playable, visually distinct maps
- No seed produces a degenerate map (no path, blocked path, unbuildable area)
- Generation time consistently <50ms

### Risks

- **Hardest item in Phase 1.** Budget extra time. If after 3 weeks generation is unreliable, fall back to a hand-curated pool of 8–12 maps and ship procedural in Phase 3.

---

## Workstream 3 — Voxel destruction (signature feature)

**Why this matters:** this is the visual hook. Without it, you have a generic roguelite TD.

**Current state:** voxel shatter exists for *enemy deaths* (`particles.voxelShatter`). Terrain and towers don't take damage.

### Mechanics

- Each terrain cell has HP (default 100, or `Infinity` for indestructible cells)
- Some attacks deal "splash + structural" damage:
  - Boss death explosions damage cells in radius
  - Crystal Cannon "Nova" upgrade damages cells in splash radius
  - New enemy type: "Sapper" digs through walls (carves new path)
- When a cell hits 0 HP:
  - Cell visually shatters using existing voxel-shatter system
  - If a tower was on it: tower falls, takes 50% damage, can collapse
  - Cell becomes "rubble" — no longer buildable, may or may not be passable
- **Recovery:** between acts, all cells fully heal (run "rebuild" beat)

### Tasks

- [ ] Add `cellHp[]` and `cellMaxHp[]` arrays to `Grid`
- [ ] Add `Grid.damageCell(col, row, amount)` and `Grid.destroyCell(col, row)` methods
- [ ] Hook bombs/explosions to call `damageCell`
- [ ] Visual: damaged cells show cracks (replace mesh with cracked variant at <50% HP)
- [ ] Destroyed cells: voxel shatter using terrain colors, then leave visible "crater" decal
- [ ] Tower-on-destroyed-cell collapse: tower group falls (gravity tween), shatters, removed from tower list
- [ ] Add "Sapper" enemy type that carves through walls (destroys cells in front of it)
- [ ] Between-act recovery: visual healing animation, all cells restored

### Acceptance

- Boss explosions visibly destroy ~5–8 cells per kill
- Towers placed in dangerous spots can be destroyed and lost (tactical layer)
- The destruction is the **most-screenshotted visual** in playtests — if it isn't, the implementation isn't dramatic enough

### Risks

- **Visual juice matters more than mechanics here.** Spend the time on shake, particles, slow-mo on dramatic destructions. A dull destruction system isn't a hook.
- Destroyed cells affecting pathing introduces edge cases (enemies stuck, dynamic re-pathing). Consider keeping destroyed cells *passable but unbuildable* in Phase 1 to avoid the pathing complexity.

---

## Workstream 4 — Tower roster expansion

**Current state:** 3 towers (Crystal, Frost, Spark), each with 2 upgrade paths. Working baseline from prototype.

**Phase 1 target:** 6–8 towers, each with at least 2 upgrade paths. Each tower needs a clear identity.

### Proposed roster

| Tower | Role | Identity |
|-------|------|----------|
| Crystal Cannon (existing) | Generalist DPS | Reliable single-target, scales with upgrades |
| Frost Spire (existing) | CC / slow | Trade damage for control |
| Spark Pylon (existing) | Burst / chain | Great for swarms, weak vs single big targets |
| **Mortar** (new) | AoE / structural | Long range, slow, splashes — destroys terrain |
| **Burrower** (new) | Anti-armor | Ignores shields, bonus to high-HP enemies |
| **Beacon** (new, support) | Buffs nearby towers | No damage itself |
| **Wall** (new, structural) | Forces re-path | Destructible, blocks enemy movement |
| **Tesla Tower** (optional) | Stationary AoE pulse | Continuous radial damage |

Walls are particularly interesting because they interact with the destruction system — players build walls to force paths, enemies destroy walls, terrain gets reshaped mid-run.

### Tasks

- [ ] Define new tower configs in `js/config.js` matching existing schema
- [ ] Add voxel models for each new tower in `js/voxel-models.js`
- [ ] Implement Mortar: parabolic projectile, AoE splash, damages terrain
- [ ] Implement Burrower: armor-ignore flag, high single-shot damage
- [ ] Implement Beacon: buff aura affecting other towers in range (damage/range/fire-rate)
- [ ] Implement Wall: pathfinding-blocking placement, has HP, can be destroyed
- [ ] Update UI tower panel to support 6+ towers (current 3-button row needs scrolling/grid)
- [ ] Hotkey rebinding (currently 1/2/3 hardcoded — needs to be 1-9 dynamic)

### Acceptance

- Each tower has at least one wave/situation where it's clearly the right pick
- No tower is strictly dominated (kill or buff every tower until it's worth picking)
- All towers visually distinct — at a glance you can tell what's on the field

---

## Workstream 5 — Enemy roster + counters

**Current state:** 4 enemy types (sprinter, golem, swarmling, boss). Decent variety but no real counter system.

**Phase 1 target:** 8–10 enemy types with rock-paper-scissors counter relationships. Wave compositions get interesting.

### Proposed additions

| Enemy | Role | Counter |
|-------|------|---------|
| Sprinter (existing) | Fast / fragile | Splash, slows |
| Golem (existing) | Tanky / shielded | Burst, armor-pierce |
| Swarmling (existing) | Numbers | Splash, chains |
| Boss (existing) | Tank + abilities | Sustained DPS |
| **Sapper** (new) | Destroys terrain | Frost (slow + freeze interrupts dig) |
| **Healer** (new) | Heals other enemies | Burst kills, focus-fire targeting |
| **Phaser** (new) | Periodically intangible | Burst windows, time-based |
| **Splitter** (new) | Splits on death (existing swarmling has this; promote to dedicated type) | Don't kill until isolated |
| **Dasher** (new) | Charges in bursts | CC, slows, walls |
| **Armored** (new) | Reduces non-pierce damage | Burrower, armor-pierce upgrades |

### Tasks

- [ ] Add enemy configs to `js/config.js`
- [ ] Voxel models for each new enemy
- [ ] Healer behavior: targeting nearest ally, applying heal-over-time
- [ ] Phaser behavior: cycling intangibility (immune to projectiles during phase)
- [ ] Sapper behavior: pathfinding through cells by destroying them
- [ ] Update wave generator to mix enemy types coherently — themed "waves of healers + tanks" feel different from "wave of phasers"

### Acceptance

- Wave compositions force build adjustments — no single tower build clears every wave
- Each new enemy has at least one playtest moment where the player goes "oh, I need *that* counter"
- Healer + tank waves are noticeably harder than tank-alone waves

---

## Workstream 6 — Run economy + meta-currency

### Per-run economy (existing, refine)

- Gold spent on towers and upgrades within a run
- Wave completion bonus (existing) — keep
- Add: **per-act vendor** between acts. Choose 1 of 3 boons (extra gold, free tower, +HP, modifier).

### Meta-currency (new)

- "Crystal Shards" (or similar) earned per run, scaling with waves cleared and bosses killed
- Shards spent in meta hub on permanent unlocks (towers, modifiers, starter perks)

### Tasks

- [ ] Add `metaCurrency` to `MetaState`
- [ ] Reward formula: `floor(wave * 5 + bossKills * 50)`. Tune via playtest.
- [ ] Per-act vendor screen between acts: 3 randomized choices, click one, continue
- [ ] Currency shown in HUD during run (separate from in-run gold)

### Acceptance

- A losing run still feels rewarding (some shards earned)
- Shards-per-hour rate makes meta unlocks feel achievable but not trivial (~3–8 runs to unlock the next tower)

---

## Workstream 7 — Meta hub (between-run screen)

A simple screen between runs for spending shards and starting the next run.

### Sections

- **Run summary**: wave reached, shards earned, kills, time
- **Tower unlocks tree**: visible locked towers, costs in shards
- **Modifier unlocks**: starter perks (e.g. "+10% starting gold", "free first tower")
- **Start next run** button (with seed override option for sharing/replaying)

### Tasks

- [ ] HTML/CSS overlay similar to existing game-over screen
- [ ] Wire up tower unlock purchases (modify `MetaState.unlockedTowers`)
- [ ] Modifier system: define a `Modifier` interface, list of available modifiers, apply at run start
- [ ] Persistent stats panel (lifetime kills, runs, etc.) — small but motivating

### Acceptance

- Player can see clear progression between runs (something new to try each run for first 8–10 runs)
- The hub takes <30 seconds to navigate — not a chore between runs

---

## Workstream 8 — Acts + boss flow

**Current state:** linear waves 1–N with bosses sprinkled at fixed waves.

**Phase 1 target:** 3 distinct acts per run, each ending in a boss, each ramping difficulty.

### Structure

- **Act 1 (waves 1–8):** introductory enemies, basic compositions, mini-boss at wave 8
- **Act 2 (waves 9–16):** mixed compositions including healers/sappers, mini-boss at wave 16
- **Act 3 (waves 17–24):** combined compositions, terrain-destruction-focused, **final boss** at wave 24
- After final boss: optional **endless mode** continuation (existing endless code applies)

### Tasks

- [ ] Wave generator parameterized by act
- [ ] Act-end "boss arena" beat: brief pause, boss announcement, dramatic camera move
- [ ] Per-act vendor screen (workstream 6) between acts
- [ ] Final boss: distinct from mid-act bosses (more abilities, longer fight, terrain-destroying)

### Acceptance

- Each act feels mechanically different — Act 3 should not be "Act 1 with bigger numbers"
- Run pacing: 25–35 minutes for a successful full clear

---

## Workstream 9 — Balance + playtest pass

The last 2 weeks of Phase 1 are reserved for balance and tightening, *not* new features.

### Tasks

- [ ] Run telemetry: log every run end with seed, wave reached, towers used, deaths
- [ ] Self-playtest: 20+ runs across the full ladder
- [ ] External playtest: 3–5 friends/Discord testers, 5+ runs each
- [ ] Balance pass: identify dominant strategies, weak towers, frustrating waves
- [ ] One-shot fixes only — resist scope creep ("we should add X" goes to Phase 2 backlog)

### Acceptance

- Win rate (full Act 3 clear) sits around 30–50% for a competent player on default difficulty
- No tower has <10% pick rate or >70% pick rate in playtest data
- Fewest 5 testers say "I want one more run" after their session ends

---

## Exit criteria for Phase 1

All must be true:

- [ ] 5 runs back-to-back is fun, not tedious
- [ ] At least one moment per run earns an "oh that's cool" reaction (typically destruction-based)
- [ ] 6+ towers shipped, 8+ enemies shipped, all functional
- [ ] Procedural maps produce visually distinct, playable runs across 50+ seeds
- [ ] Voxel destruction is dramatic enough that it shows up in screenshots
- [ ] Meta-progression loop works end-to-end (run → shards → unlock → next run feels different)
- [ ] At least 3 friends/testers say "let me know when I can play more of this"

## What Phase 1 does NOT include

Hard scope cuts — push these to Phase 2 or later:

- Multiple biomes (one is enough for Phase 1)
- Music or original sfx (procedural Web Audio is fine)
- Polished UI animations beyond what's already there
- Tutorial / onboarding
- Save/resume mid-run
- Daily challenges
- Achievements
- Localization
- Settings menu beyond audio toggle and pause
- Steam features (cloud saves, achievements, workshop)
- Controller support
- Graphics options

If you find yourself wanting to add any of these in Phase 1, write them in `docs/phase-2-backlog.md` and keep going.

## Risks

| Risk | Mitigation |
|------|------------|
| Procedural map gen takes 4 weeks instead of 2 | Time-box to 3 weeks. Fall back to 12 hand-curated maps + procedural seeded variations on each. Push pure procedural to Phase 3. |
| Voxel destruction feels gimmicky, not core | Build the most dramatic destruction first (boss death wave). If playtests don't react, the hook is wrong — back to Phase 0. |
| Tower roster doesn't differentiate enough | Lean harder into utility (Beacon, Wall) over more DPS. DPS variants feel same-y; utility creates strategy. |
| Balance is broken at Phase 1 end | That's expected. Don't ship Phase 1 to public; balance pass continues into Phase 2. |
| Scope creep | Re-read this doc weekly. If a feature isn't in workstreams 1–9, it doesn't ship in Phase 1. |
| Meta-progression feels grindy | Front-load unlocks: first 5–8 runs should each unlock something. After that, taper. Better to under-tune the grind than over-tune. |
| Solo dev burnout | Take one full day off per week. Phase 1 is a marathon. Burning out at week 8 of 13 sinks the whole roadmap. |

## Tools & tech to add

- **Seeded RNG** — `mulberry32` or similar, deterministic
- **Telemetry**: simple `localStorage` event log + manual CSV export for now. Replace with proper analytics in Phase 4.
- **Hot-reload dev workflow**: run `vite` or `python -m http.server` to iterate without manual reload. (Not strictly required — current static-file workflow works — but speeds Phase 1 up materially.)

## Suggested order

Roughly sequential, with parallelizable items noted:

1. **Week 1**: Workstream 1 (state refactor, RNG)
2. **Weeks 2–3**: Workstream 2 (procedural maps) — hardest item, do early
3. **Weeks 4–5**: Workstream 3 (voxel destruction) — can parallelize Workstream 4 if rotation feels stale
4. **Weeks 5–6**: Workstream 4 (towers) and Workstream 5 (enemies) in parallel
5. **Week 7**: Workstream 6 (economy) and Workstream 8 (acts) in parallel
6. **Week 8**: Workstream 7 (meta hub)
7. **Weeks 9–10**: Buffer / catch-up / first integrated playtest
8. **Weeks 11–13**: Workstream 9 (balance) + external playtest
9. **Week 14–15** (buffer): whatever slipped, then exit-criteria validation

When Phase 1 exits, you have an alpha that's ready to start the Phase 2 polish pass.
