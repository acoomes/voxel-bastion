# Phase 0 — Pick the Hook

**Duration:** 1–2 weeks (mostly thinking, research, and pitch validation)

**Status:** not started

---

## Goal

Lock in the **one-sentence differentiator** that everything else in the roadmap builds on. By the end of Phase 0, you can finish the sentence "It's like X, but with Y" and a non-gamer says *"huh, interesting."*

## Why this phase exists

The current prototype is a generic isometric tower defense. Steam has 300+ TD games. The genre is dominated by Kingdom Rush, BTD6, They Are Billions, Mindustry, and a long tail of forgettable releases. **A "voxel TD" framing alone will not sell** — voxels are a visual style, not a hook.

Every hit indie TD has a specific reason it exists beyond "it's a TD":
- *Bloons TD 6* — monkey synergy + co-op multiplayer
- *Kingdom Rush* — handcrafted polish + heroes
- *They Are Billions* — RTS scale + permadeath + zombie horror
- *Mindustry* — factory-builder fused with TD
- *Defender's Quest* — RPG layer + writing
- *Dome Keeper* — compact roguelite loop with mining
- *Last Spell* — turn-based tactics + roguelite
- *Rogue Tower* — pure roguelite with unlocks tree

If you cannot articulate why someone would buy *Voxel Bastion* over those, **no amount of polish later will fix it.** Phase 0 prevents that failure mode.

## Selection criteria

The hook needs to satisfy all four:

1. **Distinctive** — answers "why this and not Kingdom Rush?"
2. **Implementable solo** — within the engineering budget for the rest of the roadmap
3. **Leverages existing prototype** — not throwing away 8 weeks of code
4. **Has proven market demand** — comparable Steam games selling well, not unproven niche

---

## Candidate hooks

### A. Roguelite voxel TD ⭐ recommended

**Pitch:** *"It's a tower defense roguelite where every run is a procedurally-generated map and your towers tear apart the world as they fight."*

**Comparables:** Rogue Tower (130k+ owners), Dome Keeper (1M+ owners), Slay the Spire DNA in TD form.

**Pros:**
- Run-based structure naturally gates content — you can ship with fewer maps if each run feels fresh
- Meta-progression unlock loop is well-understood and addictive
- **Voxel destruction** as a signature visual feature — terrain damages, structures collapse, towers can be destroyed and rebuilt mid-run. Leverages the voxel-shatter code already shipped.
- Permadeath runs lower the polish bar per individual map
- Roguelite + TD is a hot but not saturated niche — good ratio of demand to competition

**Cons / risks:**
- Procedural map generation is non-trivial — needs path-finding, validation, balanced difficulty
- Meta-progression design has its own depth — easy to make it feel grindy
- Need run modifiers / "ascensions" to reach the long-tail mastery audience

**Engineering implications:**
- Replace fixed `PATH_WAYPOINTS` with a runtime path generator
- Add a meta-state layer above `GameState` (current state is per-run; meta is permanent)
- Voxel destruction system: terrain cells need health/state and can collapse

---

### B. Tower-crafting TD

**Pitch:** *"Combine elemental cores into custom towers — fire + ice = shatter, lightning + chain = arc — and discover synergies in run-based dungeons."*

**Comparables:** Backpack Battles (1M+ owners), Inscryption, Bloons monkey knowledge graph.

**Pros:**
- Synergy hunt creates compulsive theorycrafting — the same hook that made StS and Backpack Battles huge
- Less art-asset-hungry than multi-biome content
- Naturally generates "build of the week" content for streamers

**Cons / risks:**
- Combinatorial design is **hard** — must avoid degenerate combos and dead options
- Without enough combinations, runs out of theorycrafting fuel quickly (need 6-8 cores → 28-36 pairs minimum)
- Less obvious visual signature — voxel aesthetic less load-bearing

---

### C. Co-op tactical TD

**Pitch:** *"Two-to-four-player online tower defense — coordinate or die."*

**Comparables:** Bloons TD 6 co-op, Sanctum, Orcs Must Die!.

**Pros:**
- Co-op TD has loyal audience and lower competition
- Word-of-mouth from "found a buddy who plays" effect
- Streaming-friendly

**Cons / risks (significant):**
- **Online netcode + lobby + matchmaking is enormous solo scope** — easily 6+ months on top of base game
- Server costs ongoing
- Without seamless drop-in/drop-out, retention is poor
- Solo dev co-op games frequently ship broken at launch and never recover from review damage

**Verdict:** only viable if you have netcode experience or budget for a contractor.

---

### D. Narrative TD

**Pitch:** *"A tower defense with a story between every battle — defend the last city, watch its people change as the war progresses."*

**Comparables:** Defender's Quest (200k+ owners), Banner Saga.

**Pros:**
- Story carries between mechanically-similar levels — lower mechanical content burden
- Strong differentiation from competitors
- Reviewer/streamer hook ("this TD made me cry")

**Cons / risks:**
- Writing is its own craft — bad writing tanks the entire pitch
- Voice acting expectations on Steam are higher than indies usually account for
- Voxel aesthetic is harder to read as "serious story" — may need art pivot

---

## Recommendation: Hook A (Roguelite voxel TD)

Reasoning:
- **Best leverage of existing prototype** — the current GameState, wave system, towers, and voxel-shatter all map cleanly to roguelite structure
- **Lowest scope risk** — no netcode, no writing dependency, no combinatorial design landmines
- **Hot market** — Rogue Tower, Dome Keeper, Backpack Battles all show strong demand for run-based games with strong loops
- **Voxel destruction** is a real, demonstrable signature — terrain that crumbles, towers that take damage from explosions, enemies that can carve paths through walls. Plays directly to the voxel aesthetic's strength.

The full one-sentence pitch to validate: *"Voxel Bastion is a roguelite tower defense where the battlefield itself is destructible — every run is a new map, and your towers and the terrain shatter into voxels as the fight escalates."*

---

## Tasks

### Research (3–4 days)

- [ ] **Steam tag analysis** — pull SteamDB / Steam Charts data for top 30 games tagged `Tower Defense + Roguelite`. Note: launch wishlists, lifetime sales, key reviews. Identify the top 5 closest comps.
- [ ] **Trailer teardown** — watch the launch trailers of Rogue Tower, Dome Keeper, Mindustry, BTD6, They Are Billions. Note what they show in the first 5 seconds. (Hint: the hook, every time.)
- [ ] **Subreddit lurk** — `/r/towerdefense`, `/r/IndieDev`, `/r/roguelites`. Read the "what TD should I play next" threads from the last 3 months. What do players ask for that doesn't exist?
- [ ] **Capsule study** — collect 20 indie TD capsules. Note common patterns (one big visual, bold title text, one color dominating).

### Validation (4–5 days)

- [ ] **Write the pitch** — three versions (short / medium / long), each with the differentiator first.
- [ ] **Pitch test on 5–10 non-gamers** — read them the short pitch, ask them to repeat it back, then ask "would you play that?" Record reactions verbatim.
- [ ] **Pitch test on 5–10 TD players** — recruit via Discord / Reddit. Ask: "what's missing in TD games right now?" Then pitch yours. Compare reactions.
- [ ] **Decide and document** — pick the hook based on data, write a one-page hook doc.

### Setup (2–3 days)

- [ ] **Reserve game name** — verify no existing trademark, no domain conflict, no offensive Google translations. Voxel Bastion is fine but verify.
- [ ] **Create internal Steam Partner account** — application takes ~1 week to approve, start now.
- [ ] **Set up devlog cadence** — Twitter/Bluesky/IndieDev forum presence with one post per week starting now. The launch wishlist comes from the audience you build over months.
- [ ] **Define "vertical slice" target** — given the chosen hook, what does Phase 2's 30-minute slice look like? Sketch it.

---

## Deliverables

By end of Phase 0:

1. **`docs/hook.md`** — one-page document with chosen hook, pitch (3 lengths), competitive comparison, and rationale.
2. **`docs/competitive-research.md`** — Steam comp analysis with concrete numbers (wishlists, sales, reviews) for the top 5 reference games.
3. **`docs/pitch-validation.md`** — record of pitch tests with both gamer and non-gamer audiences. Reactions verbatim.
4. **Steam Partner application submitted** (approval pending — that's fine, takes a week).
5. **Devlog post #1 published** — "I'm making a roguelite voxel TD, here's why."

## Exit criteria

All must be true:

- [ ] Hook chosen and documented in one sentence
- [ ] Pitch reaction from at least 3 of 5 non-gamers is positive ("interesting", "I'd try that") — not polite indifference
- [ ] At least 2 Steam comp games in the chosen niche have shipped successfully (>50k wishlists pre-launch or >$50k revenue)
- [ ] You can articulate why this game beats each of those comps in one sentence each
- [ ] Phase 1's content backlog can be sketched in one afternoon (i.e. the hook constrains scope enough to plan)

## Decision gate

**If after 2 weeks you cannot satisfy the exit criteria, stop and rethink.** Don't push into Phase 1 with a generic pitch — Phase 1 work that's built on the wrong hook is mostly wasted. It's cheaper to spend another week thinking than 8 weeks coding the wrong thing.

Specifically, watch for these failure modes:

- **The "it's just a TD" pitch** — if you cannot say what's different in one sentence, you don't have a hook
- **"Polish will be the hook"** — polish is table stakes, never a hook
- **"The voxel art is the hook"** — visual style is differentiation, not a hook (Minecraft set the floor for voxel art recognizability decades ago)
- **Comp envy** — picking a hook because another game succeeded with it, without understanding *why* (most comp envy ships flat clones)

## Risks

| Risk | Mitigation |
|------|------------|
| Pitch tests skewed by friend-bias | Recruit testers outside your network. Reddit DMs, Discord game-dev servers. Pay $5/test on Userlytics if needed. |
| Choosing the hook based on what *you* want to build | The hook is a market decision, not an artistic one. Cross-check against actual sales data. |
| Spending too long in Phase 0 | 2-week cap. If you're still researching at week 3, pick the best option and move. Imperfect hook + execution beats perfect hook + procrastination. |
| Hook depends on assets you can't produce | If the chosen hook needs hand-drawn portraits or voice acting, scope it now. Otherwise pivot. |
| Steam Partner application delay blocks Phase 2 | Apply on day 1 of Phase 0 — even if hook isn't chosen, the legal entity setup is the same. |

---

## What Phase 0 does *not* include

- Implementing anything
- Writing design docs for systems beyond what the hook requires
- Polishing the existing prototype
- Marketing beyond the first devlog post

If you find yourself coding during Phase 0, you've started Phase 1 prematurely. Stop, finish the hook decision, then start Phase 1 deliberately.
