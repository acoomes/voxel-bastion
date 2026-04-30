# Work queue

Single source of truth for what Claude works on next. The autonomous cycle (and manual sessions) reads this file at the start of each cycle and updates it at the end.

Format per item:

```
### <imperative title>
- **Type:** research | code | doc | test | ops
- **Branch:** suggested branch name
- **What:** one-paragraph description of the work
- **Acceptance:** how we know it's done
- **Depends on:** any prerequisite queue items
- **Notes:** anything else
```

The top item under "Next up" is what the next cycle will pick up.

---

## In flight

### Draft Steam Partner application checklist
- **Type:** doc
- **Branch:** `doc/steam-partner-prep`
- **What:** Step-by-step checklist of what user needs to gather before submitting Steam Partner application: legal entity, bank/tax info, ID verification, $100 fee, expected approval timeline. Include a list of Steam-specific decisions due at submission (game name, store tags, age rating).
- **Acceptance:** `docs/steam-partner-prep.md` lands. User can sit down and complete the application from this doc.
- **Status:** PR open ([this PR]). Hook-independent; can run in parallel with pitch validation.

---

## Next up

### Draft devlog #1
- **Type:** doc
- **Branch:** `doc/devlog-001`
- **What:** ~600-word post: "I'm building a roguelite voxel TD — here's why and what makes it different." Lead with the hook, show the prototype's voxel-shatter as the visual anchor, end with a public timeline. Tone: builder, not marketer.
- **Acceptance:** `docs/devlog/001-why-this.md` lands. User can copy-paste to their devlog channel of choice.
- **Depends on:** hook locked (user decision after pitch validation)
- **Notes:** I don't post; user posts under their identity.

### Draft Steam page short/long descriptions
- **Type:** doc
- **Branch:** `doc/steam-page-copy`
- **What:** Convert the locked pitch into a Steam-page-ready short description (≤300 chars) and long description (~600–1200 chars). Steam's tone, no devlog preamble. Include the canonical Steam tags list and the IARC age-rating answer set we'd give.
- **Acceptance:** `docs/steam-page-copy.md` lands. Copy is paste-ready for the Steam page builder once Partner approval comes through.
- **Depends on:** hook locked + pitch variant selected.

### Draft pitch-validation recruitment kit
- **Type:** doc
- **Branch:** `doc/pitch-validation-kit`
- **What:** Templates the user can copy-paste to recruit testers — Discord/Reddit/DM scripts for both non-gamers and TD players, a one-page test protocol, and a results-capture sheet (verbatim reactions, 1–5 curiosity score, comp pattern-match, single confusion point).
- **Acceptance:** `docs/pitch-validation-kit.md` lands; user can run validation tests without further drafting.
- **Notes:** Not strictly required — user can run validation conversationally — but reduces friction and improves data quality. Optional priority.

---

## Blocked / awaiting user

### Hook decision
- **Owner:** user
- **Why blocked:** requires pitch validation tests on 5+ non-gamers and 5+ TD players (user-driven recruiting and conversation)
- **Unblocks:** all of Phase 1 implementation work; devlog #1 final wording

### Steam Partner approval
- **Owner:** user
- **Why blocked:** user must submit application + ID verification + $100 fee
- **Unblocks:** Steam page creation in Phase 2

### Cadence preferences confirmation
- **Owner:** user
- **Why blocked:** see "Open questions" in `docs/automation.md` — time of day, PR cap, pause convention
- **Unblocks:** scheduling the cron-driven autonomous loop

---

## Completed

Most recent first. Trim quarterly.

- **2026-04-29** — Add Phase 0 pitches; advance queue (PR #5)
- **2026-04-29** — Add Phase 0 competitive research (PR #3)
- **2026-04-29** — Add automation cadence + initial queue (PR #4)
- **2026-04-29** — Add CLAUDE.md with project context and conventions (PR #2)
- **2026-04-29** — Add Steam release roadmap and phase-0/phase-1 plans (PR #1)
- **2026-04-29** — Add tower targeting modes, wave preview, endless mode + persistent best-wave, glyph fix (committed before PR workflow was established; see commit `f3abc96`)

---

## Backlog (Phase 1 — mostly gated on hook decision)

Tracked here for visibility but not picked up by automation until Phase 0 exits. See `docs/phase-1-alpha.md` for the full plan.

Workstream 1 (foundations) was landed early since it's hook-independent — the state split, seeded RNG, and wave determinism are required by every hook variant:

- [x] Split `GameState` into `MetaState` (persistent) and `RunState` (ephemeral) — `feat/state-and-rng`
- [x] Add seeded RNG utility (`js/rng.js` — `mulberry32`)
- [x] Refactor wave generation to consume seeded RNG (verified: same seed → same wave compositions)
- [x] Add `startNewRun(seed?)` and `endRun(reason)` lifecycle methods
- [x] Persist `MetaState` on every meta change with try/catch
- [x] Wire seeded RNG into splitter chance/offset and freeze proc

Workstream 2 (procedural maps) — first slice landed; consumes the seeded RNG:

- [x] Procedural path generator (`js/path-gen.js`) — manhattan-style, left-edge to right-edge, uses run.rng — `feat/proc-path`
- [x] Path/grid/enemy paths rebuild on every `startNewRun` — verified across 100 seeds: connected, in-bounds, 260-318 placeable cells
- [ ] Path variation: backward x segments, branching paths, multiple spawn points
- [ ] Procedural terrain features: pillars, height variation, decorative voxels
- [ ] Map size variation per run

Still gated on hook decision:

- Workstream 3: voxel destruction
- Workstream 4: tower roster expansion
- Workstream 5: enemy roster + counters
- Workstream 6+: economy, meta hub, acts, balance — see `docs/phase-1-alpha.md`

---

## Pause flag

If this section contains the literal text `PAUSE_AUTOMATION`, the autonomous cycle should exit immediately at the start of its run without picking up any work. User uses this to halt the loop without revoking permissions.

(no flag set)
