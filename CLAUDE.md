# Voxel Bastion — Working notes for Claude

A voxel-styled tower defense prototype, intended for commercial Steam release. This file is the orientation doc for any session working on the repo: what it is, how it's built, and how work should land.

## Current state

- **Phase:** prototype, pre-Phase 0 of the roadmap. Nothing in `docs/` has been started yet — the roadmap defines what's next.
- **Hook:** not yet chosen. Phase 0 (1–2 weeks) is hook selection. Don't start Phase 1 implementation work until the hook is decided.
- **Recommended hook:** roguelite voxel TD with destructible terrain. See [`docs/phase-0-hook.md`](docs/phase-0-hook.md) for the full comparison.

## What's in `docs/`

- [`docs/roadmap.md`](docs/roadmap.md) — 7-phase roadmap from prototype to Steam launch (~12–18 months solo full-time)
- [`docs/roadmap.svg`](docs/roadmap.svg) — visual version of the same
- [`docs/phase-0-hook.md`](docs/phase-0-hook.md) — full Phase 0 plan: hook candidates, validation tasks, exit criteria
- [`docs/phase-1-alpha.md`](docs/phase-1-alpha.md) — full Phase 1 plan: 9 workstreams over ~13 weeks, with concrete tasks and acceptance criteria

When work touches feature scope, check the relevant phase plan first. If the work doesn't fit the current phase, push back or write it to a backlog file rather than expanding scope.

## Tech stack

- **Vanilla JS + ES modules.** No build step, no bundler. `index.html` loads `js/main.js` directly.
- **Three.js** via importmap CDN (`three@0.171.0`). Optional bloom postprocessing loaded dynamically and skipped if it fails.
- **Web Audio API** for procedural sound — no audio files in the repo.
- **`localStorage`** for persistence (currently just `voxel-bastion-best-wave`; will grow during Phase 1's MetaState refactor).
- **No tests** beyond `node --check` for syntax sanity. Manual browser playtest is the test loop.

## Repo layout

```
index.html             Bootstrap + all CSS + UI overlay markup
js/
  main.js              Three.js scene init, game loop, top-level wiring
  config.js            All game constants (towers, enemies, waves, palette)
  game.js              GameState — wave control, economy, persistent best-wave
  grid.js              Grid cells, terrain mesh, placement validation
  path.js              Fixed path waypoints + path mesh (procedural in Phase 1)
  tower.js             TowerManager — targeting, firing, upgrades, target modes
  enemy.js             EnemyManager — pathing, status effects, voxel shatter death
  projectile.js        ProjectileManager — pooled projectiles, splash, freeze
  particles.js         Pooled instanced-mesh particle system + voxel shatter
  voxel-models.js      Voxel model definitions + builders (Group + Instanced)
  renderer.js          Camera (orthographic isometric), lights, bloom, shake
  input.js             Mouse raycasting, hover highlight, keyboard
  audio.js             Procedural Web Audio synth for every sound
  ui.js                HUD, tower panel, upgrade panel (HTML/CSS overlay)
docs/                  Roadmap and phase plans (see above)
```

Most game tuning lives in `js/config.js` (TOWERS, ENEMIES, WAVES, GAME). Prefer editing config over hardcoding.

## Running locally

There's no dev server in the repo — any static file server works. From the project root:

```sh
python -m http.server 8000      # then open http://localhost:8000
# or
npx serve                       # pick any port it offers
```

The game uses ES modules, so opening `index.html` via `file://` does not work. Always use a server.

## Working on this repo

### Git workflow

- **Never commit directly to `main`.** Always work on a topic branch and open a PR.
- Branch naming: `docs/...`, `feat/...`, `fix/...`, `refactor/...`.
- One commit per logical change. Commit messages imperative, focused on the *why*.
- `gh` CLI is **not installed** on the dev box. Push the branch, then either:
  - Print the GitHub `pull/new/<branch>` URL the remote returns, and ask the user to click through, OR
  - Ask the user to install `gh`.
- Don't push to `main` even if a previous push in the session was direct — each scope is fresh.
- If you ever accidentally commit to `main` locally, fix it before pushing: branch the commit, `git reset --hard origin/main` on main, push the branch.

### Verifying changes

Manual browser playtest is the truth. Before reporting work as complete:

- `node --check js/<file>.js` on every modified JS file to catch syntax errors fast (no runtime — modules don't execute, but syntax is verified)
- If you can't actually drive the browser yourself, **say so explicitly** rather than claiming the feature works. The user runs the visual check and confirms.
- For perf-sensitive work, watch the FPS-adaptive code in `main.js` (`particles.setQuality`) — the game already drops particle density below 45fps. Don't break that signal.

### Code conventions (observed from the prototype)

- **Default to no comments.** Existing code is sparse and self-documenting via naming. Add comments only when *why* is non-obvious — never restate what.
- **ES modules, named exports.** No default exports.
- **Shared geometries and materials** wherever feasible — see `enemy.js` `_matCache`, `_hpBgGeo`, etc. Three.js performance is dominated by allocations.
- **Pooling**: particles and projectiles already pool. Continue this pattern for new entity types.
- **No backwards-compat hacks.** This is a prototype heading toward 1.0. Delete unused code rather than leaving compat shims.
- **Trust internal callers.** Validate at boundaries (user input, `localStorage`); don't add defensive checks for impossible states inside the game loop.

### Scope discipline

This game is being built toward a commercial Steam release. Watch for:

- **Generic-TD bloat.** Don't add features that don't build toward the hook. New towers and enemies belong in Phase 1's roster expansion, not as one-off additions.
- **Premature polish.** Tutorial flows, settings menus, achievements, localization, controller support — all are explicitly Phase 2+ in the roadmap. Don't burn Phase 1 time on them.
- **Premature optimization.** The pooling and instancing already in place are sufficient for current scale. Don't refactor for performance until profiling says you must.
- **Commercial readiness.** When proposing features, weigh them against marketing/hook readiness. "Cool engineering" without commercial signal is a phase-0 failure mode.

## Things that are easy to break

- **Wave preview cache** (`game.js: peekUpcomingWave` + `ui.js: _renderWavePreview`). The `upcomingQueue` cache is what makes the preview match what actually spawns. Don't regenerate the wave inside `startNextWave` if a cached queue exists.
- **Best-wave persistence**. `bestWave` lives on `MetaState` (currently inlined in `GameState`); never reset it inside `reset()`. Phase 1 will formally split `MetaState` from `RunState` — preserve the persistence semantics through that refactor.
- **Frozen enemies** are skipped by standard tower targeting but **not** by beam towers — this is intentional (matches pre-existing behavior). Don't "fix" it without checking the targeting plan.
- **Tower target mode** lives on the per-tower object and defaults to `'first'`. Aura towers don't use it — `ui.js` correctly hides the mode row for them. New tower types should explicitly opt in.

## Common commands

```sh
# Pull latest, branch off
git checkout main && git pull && git checkout -b feat/<short-name>

# Syntax-check JS quickly
for f in js/*.js; do node --check "$f"; done

# Push branch (PR URL printed by the remote)
git push -u origin HEAD

# Bring a feature branch up to date
git fetch origin && git rebase origin/main
```

## When in doubt

- **Phase question** (is this Phase 1 work?) → check `docs/roadmap.md` and the relevant phase plan
- **Scope question** (should we add this?) → frame against the commercial-readiness lens; ask the user if unclear
- **Pattern question** (how do other systems do this?) → grep existing code; the prototype already has answers for pooling, voxel models, status effects, UI panels
- **Hook question** (does this serve the differentiator?) → if Phase 0 isn't done yet, the answer is "ask the user before building"
