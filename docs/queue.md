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

### Draft three pitch lengths
- **Type:** doc
- **Branch:** `doc/phase-0-pitches`
- **What:** Three pitches for Voxel Bastion — 15-word elevator, 50-word short, 200-word long. All three lead with the differentiator, not the genre. Include 2–3 alternate phrasings of each so user can pick.
- **Acceptance:** `docs/pitches.md` lands. Each pitch passes a "could this describe a different game?" test — if yes, it's too generic.
- **Status:** PR open ([this PR]). Pitch validation testing is user-driven and unblocks the hook decision.

---

## Next up

### Draft devlog #1
- **Type:** doc
- **Branch:** `doc/devlog-001`
- **What:** ~600-word post: "I'm building a roguelite voxel TD — here's why and what makes it different." Lead with the hook, show the prototype's voxel-shatter as the visual anchor, end with a public timeline. Tone: builder, not marketer.
- **Acceptance:** `docs/devlog/001-why-this.md` lands. User can copy-paste to their devlog channel of choice.
- **Depends on:** hook locked (user decision after pitch validation)
- **Notes:** I don't post; user posts under their identity.

### Draft Steam Partner application checklist
- **Type:** doc
- **Branch:** `doc/steam-partner-prep`
- **What:** Step-by-step checklist of what user needs to gather before submitting Steam Partner application: legal entity, bank/tax info, ID verification, $100 fee, expected approval timeline. Include a list of Steam-specific decisions due at submission (game name, store tags, age rating).
- **Acceptance:** `docs/steam-partner-prep.md` lands. User can sit down and complete the application from this doc.
- **Notes:** Submission is user-only; this doc removes friction.

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
- [ ] Procedural map seeded determinism — needs Workstream 2 (proc map gen)

Still gated on hook decision:

- Workstream 2: procedural map generation (consumes the seeded RNG)
- Workstream 3: voxel destruction
- Workstream 4: tower roster expansion
- Workstream 5: enemy roster + counters
- Workstream 6+: economy, meta hub, acts, balance — see `docs/phase-1-alpha.md`

---

## Pause flag

If this section contains the literal text `PAUSE_AUTOMATION`, the autonomous cycle should exit immediately at the start of its run without picking up any work. User uses this to halt the loop without revoking permissions.

(no flag set)
