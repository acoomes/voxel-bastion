# Iteration: Roguelite layer + game-feel pass

This iteration lands a focused slice of the recommended Phase-0 hook
(*roguelite voxel TD*) plus a game-feel pass that benefits every later
phase. Scope is one session: ship something playable end-to-end, not a
finished commercial system.

## Why now

The prototype already runs an endless wave loop with procedural paths and
a seeded RNG, but every run plays the same. There is no per-run
identity, no escalating commitment, and no juice on hits. That makes it
hard to evaluate the hook in playtests. This iteration adds:

1. **Per-run identity** — a starting Boon pick at run start.
2. **Mid-run agency** — a Blessing pick every 3 waves.
3. **Variety pressure** — one new enemy archetype.
4. **Hit feedback** — floating damage numbers, crits, gold-fly, combo.
5. **QoL** — range preview while placing.

None of these touches lock-in scope (towers, paths, model pipeline are
all unchanged). The Blessings/Boons systems are intentionally shallow —
deep unlocks belong in Phase 1's MetaState refactor.

## Designs

### Boons (run-start)

When a new run starts, before the first wave countdown, surface a modal
with **three random Boons** drawn from a pool. The player picks one. The
choice persists for the whole run on `RunState.boons` and is restored
through `reset()`.

Pool (initial):

- **Bountiful** — +50% gold from kills, but start with -25% HP.
- **Cryomancer** — All towers apply 15% slow on hit, regardless of type.
- **Volatile** — Enemies deal 25 splash damage to neighbors on death.
- **Hardened** — +50% starting HP, but -25% starting gold.
- **Glass Cannon** — All towers gain +25% damage; enemies that reach the
  base deal +50% damage.
- **Quick Study** — Wave bonuses are doubled.

Display: one persistent chip in the top bar with the active Boon name.

### Blessings (mid-run)

After completing waves 3, 6, 9, 12, ... a modal pauses the game and
offers **three random Blessings**. Picks stack on `RunState.blessings`.
The pool is broader than Boons and skews toward incremental upgrades:

- **+15% damage** to a single tower type.
- **+0.5 range** to all towers.
- **+10% fire rate** to all towers.
- **+100 gold now**.
- **+5% crit chance** (stacks with base crit).
- **Sell discount** — sell ratio rises from 70% → 85%.
- **Wave bonus +25g**.

The picker pauses the run via the existing `paused` flag so towers and
enemies freeze cleanly.

### New enemy: Wraith

Fast (3.0), low HP (40 base), 8 reward, immune to slow, only appears in
procedural waves at wave 8+. Visually a coral-violet voxel sprite with
slight transparency/glow. Cost in the procedural budget: 8.

Adds variety pressure: Frost towers can't slow them, so the player has
to lean on Crystal/Spark; Spark with chain handles them well.

### Crits + damage numbers

- Base crit chance: 8% on every damage application.
- Crit multiplier: 1.6x.
- Crits roll on the seeded RNG (so replays stay deterministic).
- Each damage application spawns a floating number sprite at the
  enemy's head: white normal, gold crit. Numbers float up + fade.
- Implemented as a small pooled DOM-sprite system projecting world →
  screen. Avoids creating Three.js text geometry per hit.

### Gold-fly + combo

- On enemy kill, spawn a gold-coloured particle that homes toward the
  gold HUD element and dies on arrival, granting a small visual punch.
- A kill-combo timer: each kill resets a 1.5s timer; chained kills
  display "x2", "x3", "x5", … Combos at x3+ grant +1g per kill, x5+
  grant +2g, x10+ grant +5g. Displayed in the HUD.

### Range preview during placement

When a tower type is selected for placement, show that type's range as
a translucent ring at the current hover cell, in addition to the
already-built hover highlight. Disappears on cancel.

## Implementation outline

| File | Change |
| --- | --- |
| `js/config.js` | Add Wraith enemy; add `BOONS` and `BLESSINGS` pools. |
| `js/state.js` | `RunState.boons`, `RunState.blessings`, `crit*` fields. |
| `js/game.js` | Boon/Blessing application; gold-with-multiplier helper; combo tracker. |
| `js/enemy.js` | Wraith handling (slow immunity, transparency). |
| `js/tower.js` | Effective damage / range / fireRate getters that fold blessings + boons. |
| `js/projectile.js` | Crits + Cryomancer slow + Volatile splash. |
| `js/particles.js` | Gold-fly particle helper. |
| `js/ui.js` | Boon-pick modal, Blessing-pick modal, damage-number layer, combo HUD, active-boons chip. |
| `js/main.js` | Hook startup boon pick; hook wave-complete blessing pick; range preview during placement; gold-fly to HUD. |

## Out of scope

- Persistent meta unlocks across runs (Phase 1).
- Full tower roster expansion (Phase 1 workstream).
- Tutorial flow (Phase 2).
- Audio set redesign (Phase 1 polish).

## Acceptance

- New run prompts for one of three Boons before wave 1.
- Choosing a Boon updates HP/gold/multipliers as advertised.
- Completing wave 3 (and 6, 9, …) prompts for one of three Blessings;
  game pauses cleanly and resumes after pick.
- Wraith enemies appear in procedural waves at wave 8+.
- Damage numbers show on every hit; crits are visually distinct.
- Combo HUD appears on x2+ kills and disappears after the combo lapses.
- Range preview shows during placement at the current hover cell.
- `node --check` passes on every modified JS file.
