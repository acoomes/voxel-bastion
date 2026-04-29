# Voxel Bastion — Steam Release Roadmap

**Goal:** ship a polished, commercially viable tower defense game on Steam.

**Honest framing:** most indie TD games on Steam earn under $5K lifetime. Engineering is roughly 60% of the work; the rest is hook, marketing, and production. This roadmap is sequenced for a solo dev working full-time. Halve the velocity for nights-and-weekends.

See [`roadmap.svg`](roadmap.svg) for the visual timeline.

---

## Phase 0 — Pick the hook

**Duration:** 1–2 weeks (mostly thinking)

The current prototype is a generic TD competing with Kingdom Rush, BTD6, and 200+ others. A "voxel TD" framing alone won't sell. Phase 0 picks the differentiator everything else builds on.

**Candidate hooks:**
- **Roguelite voxel TD** — run-based, randomized maps, meta-progression, voxel destruction as the signature
- **Tower-crafting TD** — combine elemental cores into custom towers, deep synergy hunt
- **Co-op tactical TD** — 2–4 player online, harder than solo (riskier scope)
- **Narrative TD** — story carries between levels (Defender's Quest model)

**Recommendation for solo dev:** roguelite voxel TD. Best ratio of "leverages existing prototype" to "market traction." Voxel shatter already in the codebase becomes the visual signature.

**Exit criteria:** the one-sentence pitch — "It's like X, but with Y" — doesn't sound generic.

→ Detailed plan: [`phase-0-hook.md`](phase-0-hook.md)

---

## Phase 1 — Alpha: nail the core loop

**Duration:** 2–3 months

A 30-minute run that's genuinely fun. No polish, no second biome, no music — just the loop.

**Workstreams:**
- Procedural map generation (replace fixed waypoints; multiple branching paths)
- Run structure: 3 acts × ~8 waves, randomized per run
- Tower roster: current 3 + 4–5 more, each with 3+ upgrade branches
- Enemy roster: 8–10 types with rock-paper-scissors counters
- Voxel destruction: terrain damages, structures collapse — make it the signature
- In-run economy + permanent meta-currency for unlocks
- Death = run ends, return to meta hub

**Exit criteria:** you (or a friend) can play 5 runs back-to-back without it feeling repetitive.

→ Detailed plan: [`phase-1-alpha.md`](phase-1-alpha.md)

---

## Phase 2 — Vertical slice + Steam page live

**Duration:** 1–2 months

A 30-minute slice that looks shipped. Steam page goes live and starts collecting wishlists.

- One fully polished biome (terrain, enemy variants, music)
- Tutorial first-run flow + save/resume
- Settings: keybinds, audio sliders, UI scale, colorblind mode
- **Capsule art, screenshots, ~90s trailer** — non-negotiable. Hire a freelance artist for capsules ($300–1500). Trailer is its own skill — study what works on r/IndieDev.
- **Submit Steam page** → wishlists start accumulating

**Decision gate:** if the trailer doesn't make *you* want to play the game, fix it before submitting.

---

## Phase 3 — Content expansion

**Duration:** 3–4 months

- 2–3 additional biomes with distinct enemies/visuals
- Meta-progression tree (towers, modifiers, daily challenge mode)
- Run modifiers / "ascension" levels (StS-style difficulty ladder for mastery players)
- Original music — commission ~5–10 tracks ($200–500/track)
- Performance verified: 60fps with 200+ enemies on screen
- Controller support + Steam Deck verification

---

## Phase 4 — Closed beta + Steam Next Fest

**Duration:** 1–2 months

The make-or-break gate.

- Recruit 50–200 testers (Discord, r/playmygame, TD subreddits)
- Instrument metrics: where players quit runs, which towers go unused, win rates by act
- **Submit to Steam Next Fest** — must have a stable demo. Free, single biggest wishlist driver in indie.
- Iterate from data, not opinions

**Decision gate:** if wishlists don't climb past ~3,000 during Next Fest, the launch will be quiet. Don't push to release — fix the hook, trailer, or capsule and try again next Fest.

---

## Phase 5 — Polish + release prep

**Duration:** 2–3 months

- Bug bash + balance pass against beta data
- 30–50 achievements
- Localization: English + Simplified Chinese + German + Russian + Spanish (Chinese alone can 1.5–2× lifetime sales)
- Cloud saves, screenshots refreshed for store
- Press: Keymailer for codes, individual outreach to 50–100 streamers/reviewers
- Pricing: $9.99–$14.99 realistic for this scope

---

## Phase 6 — Launch + post-launch

**Duration:** ongoing

- Realistic launch goal: 7,000+ wishlists or expect <$5K lifetime
- Patch weekly for first month, then monthly
- One free major content update at ~3 months — drives a Steam visibility bump
- **Recommend 1.0 launch with a permanent free demo** for this scope (rather than Early Access, which forgives unfinished games but caps lifetime ceiling)

---

## Reality checks

| Concern | Reality |
|---------|---------|
| **Time** | 12–18 months solo full-time. Nights/weekends → 2–3 years. |
| **Money** | Median indie earns <$5K. Top 10% earn $50K+. Roguelite TD niche has $1M+ hits but most flop. |
| **Marketing > engineering** | Plan 20–30% of total time on Steam page, devlogs, social, content creator outreach. Skipping this is the #1 reason good games earn nothing. |
| **Scope cuts** | You will cut a biome, 2–3 towers, probably co-op if you flirt with it. Plan for it. |
| **Genre saturation** | TD is crowded. Phase 0 hook is the only mitigation. If after Phase 2 you can't finish "this is different because ___" without a generic answer, stop and rethink. |

---

## Decision gates

Three points where you should pause and honestly evaluate before continuing:

1. **End of Phase 0** — Pitch test. Can you describe the hook in one sentence to a non-gamer and have them say "huh, interesting"?
2. **End of Phase 2** — Capsule + trailer test. Does the Steam page convert browsers to wishlisters? Aim for ≥10% impression-to-wishlist on traffic.
3. **End of Phase 4** — Wishlist test. ≥3,000 wishlists post-Next Fest, or rework before launch.

Each gate has a "stop and rework" option that's better than launching weak and burning your one chance at Steam visibility.
