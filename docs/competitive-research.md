# Competitive research — Roguelite Voxel TD

Phase 0 input. Compiled 2026-04-29. Companion doc to [`phase-0-hook.md`](phase-0-hook.md) — the differentiation hypotheses below feed the hook decision and the pitch drafts that follow.

Numbers below are sourced from public stores, postmortems, and third-party trackers (SteamSpy, Steam-Revenue-Calculator, How-To-Market-A-Game writeups). Gamalytic was rate-limiting during research, so a few owner bands are review-multiplier estimates rather than direct queries; those are flagged inline.

---

## Reference games

### 1. Rogue Tower (appid 1843760)

- **Hook:** You build the path the enemies walk on — placing road tiles is a tactical decision interleaved with placing towers, so the maze is something you author mid-run rather than a fixed track.
- **Sales / scale signals:** ~5,700 total Steam reviews (4,300 English), 80% positive. Third-party revenue calculator estimates ~$3M gross / ~$884K net to developer. Owner band ~150K–300K, medium confidence (review-multiplier method).
- **Launch wishlists:** Unknown. No public postmortem from solo dev Die of Death Games found; the game launched Jan 28 2022 with viral YouTuber pickup (Real Civil Engineer especially) driving most discovery.
- **Price:** $14.99 currently. Launch price $9.99 (raised over time as content was added).
- **Capsule art pattern:** Dark blue/teal background, isometric view of a single tower atop a hex platform with enemy path winding away. Title typography is a clean fantasy serif in white/orange — no human hero, the tower IS the hero.
- **Trailer first 5s:** Opens directly on top-down gameplay — towers firing at a path of advancing enemies. No logo card, no cinematic. Procedural path-laying shown by ~second 4. The hook is communicated through pure mechanic visibility.
- **Top negative review theme:** Late-game RNG and abandonment — players say the first 20–30 hours are great but RNG card draws plus dev silence/lack of QoL features (no cloud saves, weak achievement support) sour the long tail.

### 2. Mindustry (appid 1127400)

- **Hook:** Factory-builder logistics is the tower defense — you don't just place turrets, you route conveyor belts of ammo into them, so every defensive line is a supply-chain puzzle.
- **Sales / scale signals:** ~26K total Steam reviews, 96% positive. Sales numbers misleading because the game is also free/open-source on its website and mobile; Steam version is a "support the dev" purchase. Steam owner band 500K–1M, low confidence — most user base is off-Steam.
- **Launch wishlists:** Unknown. Game predates its Steam release as a free download, so wishlist signal was never a primary metric.
- **Price:** $9.99 currently, has been $9.99 since Steam launch (Oct 2019).
- **Capsule art pattern:** Bright orange/yellow industrial palette, top-down composition of a base under construction with conveyor belts and turret. Title set in chunky sci-fi sans-serif — emphasizes the factory-aesthetic mash-up.
- **Trailer first 5s:** Opens on top-down factory gameplay with conveyors moving resources into turrets that fire at incoming enemies. Pure mechanic-on-screen, no narrative framing.
- **Top negative review theme:** Steep, opaque learning curve — unintuitive controls (bracket-key item handling), unclear logistics primitives, and difficulty spikes (Fungal Pass) that require wiki consultation.

### 3. Dome Keeper (appid 1637320)

- **Hook:** Two-phase loop — drill downward to mine resources, then race back up to defend a static dome from a wave; the spatial tension comes from being too deep when the timer hits.
- **Sales / scale signals:** ~20K total reviews, 92% positive. Generated ~$1M revenue at launch (publicly disclosed). SteamSpy owner band 500K–1M, medium-high confidence. Likely 1M+ owners as of 2025–26 across DLC + sales.
- **Launch wishlists:** ~189K wishlists at launch (Sep 2022) — disclosed in How To Market A Game writeup. Demo had 1.5h average playtime, 5x indie median.
- **Price:** $19.99 base now (was $17.99). Launched at $14.99.
- **Capsule art pattern:** Dark earth-tones with a glowing dome silhouette under attack — orange/red enemy glow against deep blue. Title in geometric sans, isolated dome reinforces the "siege of one structure" pitch.
- **Trailer first 5s:** Opens on the keeper inside the dome, switches to mining phase pixel-art digging within ~2 seconds, then defense phase by ~5. Both halves of the loop visible inside 5 seconds.
- **Top negative review theme:** Repetitive / shallow content — runs blur together after ~4 hours, upgrades feel restrictive, "saw everything in 10 hours."

### 4. Backpack Battles (appid 2427700)

- **Hook:** Auto-battler synergies via a Tetris-style inventory grid — items have spatial adjacency rules, so build crafting is a packing puzzle, not a list of upgrades.
- **Sales / scale signals:** 640K+ copies in first month (publicly disclosed by dev), 500K wishlists at launch. ~20K Steam reviews, 92% positive. Owner band 1M+ confirmed, high confidence.
- **Launch wishlists:** ~471K in early Feb 2024, surpassed 500K right before Mar 2024 EA launch. Built primarily through a long-running free demo with weekly patches (38 total).
- **Price:** $14.99 currently, launched at $14.99 EA.
- **Capsule art pattern:** Bright cartoony palette, hero character holding an overstuffed backpack with items poking out. Title in playful chunky sans — communicates "casual approachable" while the screenshot grid does the depth-selling.
- **Trailer first 5s:** Opens on the inventory grid being filled with items, then cuts immediately to the auto-battle. The packing mechanic is on screen by second 1.
- **Top negative review theme:** Triple-RNG (shop / opponents / fight), bloated item pool with no shop-capacity increase, balance "all over the place" at high ranks.

### 5. They Are Billions (appid 644930)

- **Hook:** RTS-scale zombie sieges with literal-billions enemy density and permadeath survival — defense at a swarm scale that feels qualitatively different from any TD's 30-enemy waves.
- **Sales / scale signals:** ~45K total reviews, 80% positive. Owner band 2M–5M (SteamSpy), reportedly 600K+ copies in EA's first month. High confidence on multi-million scale.
- **Launch wishlists:** Unknown precise number, but the EA launch in Dec 2017 hit Steam top-sellers immediately; pre-release wishlist count not publicly documented in postmortem.
- **Price:** $29.99 currently, launched EA at $24.99.
- **Capsule art pattern:** Apocalyptic muted palette (rust/brown/grey), wide vista of a fortified colony with a massive zombie horde silhouette in foreground/background. Title in metal/scratched serif. Scale is the visual pitch.
- **Trailer first 5s:** Opens on a zoom-out from a single fortified base to reveal an overwhelming horde — the "billions" claim demonstrated literally before any UI is shown.
- **Top negative review theme:** No mid-mission save / time-sink frustration — losing a 4-hour map run to one wall mistake; uneven difficulty + RNG map quality.

### 6. Kingdom Rush Frontiers (appid 246420 / 458710)

- **Hook:** Tightly hand-authored levels with named heroes and "moment" abilities (rain of fire, reinforcements) — TD as a curated puzzle box rather than a sandbox, polished to mobile-port shine.
- **Sales / scale signals:** ~16K total reviews on Frontiers, 95% positive. Series is the dominant non-Bloons TD baseline; SteamSpy puts Frontiers in the 500K–1M owner band, medium confidence. Series cumulative is multi-million across mobile + Steam.
- **Launch wishlists:** Unknown / not publicly disclosed. The series predates PC and migrated from mobile, so the wishlist funnel was atypical.
- **Price:** $9.99 currently. Launch price ~$9.99 (essentially flat across the run).
- **Capsule art pattern:** Cartoon stylized hero character (often a knight/wizard) in foreground, painterly fantasy background. Title in fantasy display serif, gold/red. Hero-led capsule, mobile-game DNA visible.
- **Trailer first 5s:** Opens with hand-drawn cinematic shots of heroes and enemies clashing, cuts to gameplay around ~5s. More cinematic-led than the indie comps — leans on character IP.
- **Top negative review theme:** Difficulty spikes (jungle/catacombs), upgrade paths not scaling with enemies, RNG bosses; on Switch port, tap accuracy issues. Some "this is just a reskin of KR1."

### 7. Bloons TD 6 (appid 960090)

- **Hook:** Long-tail TD with absurd late-game power scaling (tier-5 monkeys), ten-year update cadence, and co-op — "live-service TD" with constant content drops keeps it on streamer rotations.
- **Sales / scale signals:** ~385K total reviews, 97% positive. Owner band 2M–5M (SteamSpy), high confidence. Ninja Kiwi's 2023 revenue was $89.5M total across all titles; BTD6 is the flagship Steam SKU.
- **Launch wishlists:** Unknown / not publicly relevant — game launched on mobile first (2018) then Steam (Dec 2018), so the Steam wishlist funnel was secondary.
- **Price:** $13.99 currently. Launched at $9.99 on Steam.
- **Capsule art pattern:** Ultra-bright cartoony saturation (sky blue + neon balloon colors), lineup of named monkey heroes in foreground. Title in bold rounded sans, big "6". Pure character/IP capsule.
- **Trailer first 5s:** Opens on a chaotic mid-run gameplay shot — many monkeys firing, balloons popping, particle explosions everywhere. The "screen full of stuff happening" hook is shown immediately.
- **Top negative review theme:** Predatory monetization in a paid game — multiple in-app-purchase buttons on home screen, monkey-knowledge progression behind paywalls, "mobile slop on PC."

---

## Patterns that work

The four high-scale comps (Dome Keeper, Backpack Battles, They Are Billions, Bloons TD 6) all share three structural traits beyond raw genre fit:

1. **Single-image-legible hook.** Each one can be communicated in one screenshot: the dome under siege, the backpack grid, the zombie horde, the screen-full-of-monkeys. Rogue Tower is the weakest at this — a path of dots is harder to parse cold than a literal dome. Mindustry is also weaker at single-image legibility but compensates with off-Steam free distribution.
2. **Mechanically asymmetric phases.** Dome Keeper (mine vs defend), Backpack Battles (build vs battle), They Are Billions (build vs siege) all have a phase-flip rhythm. Pure TD (Kingdom Rush, Bloons) leans on character IP and live-service instead. The phase-flip pattern is the easier hook to claim if you don't have a 10-year IP.
3. **A "verb" the genre didn't already have.** Rogue Tower → "lay path." Mindustry → "route belts." Backpack Battles → "pack the bag." Dome Keeper → "drill down." They Are Billions → "survive the swarm." None of the successful comps describe themselves as "tower defense with X." They describe themselves with a new verb that contains TD as a side effect.

## Capsule + trailer signals

- **Capsule:** Three of the four high-scale comps put a single recognizable hero subject — character or structure — at center. The dome, the backpack, the lineup of monkeys. They Are Billions instead sells scale (horde-as-subject). None show menus, UI, or text-heavy compositions. Color palette is high-contrast and mood-coherent (Dome Keeper dark + glow, Bloons saturation, TAB rust apocalypse). Rogue Tower is the outlier — its capsule is essentially a top-down gameplay diorama, which probably under-converts vs the comps.
- **Trailer first 5s:** Across all six commercial comps (excluding Mindustry, a special case), the core mechanic is on screen by second 3 — never the menu, never a logo card alone. Dome Keeper and Backpack Battles both show *both* phases of their loop within the first 5 seconds, which is the strongest possible hook compression. The cinematic-led approach (Kingdom Rush) is the weakest converter for indie-scale projects per general How-To-Market-A-Game findings.

## Differentiation hypotheses — "we beat this comp because ___"

1. **vs Rogue Tower: the destruction loop is screenshot-bait, theirs isn't.** Rogue Tower kills are number-tick events on a flat top-down grid. Voxel shatter produces a visible silhouette-changing event per kill — every successful defense literally reshapes the map and generates a unique stream/trailer asset. We get more shareable moments per minute, and our capsule can show a half-collapsed map mid-defense — something no other roguelite TD capsule can show because their maps don't deform.
2. **vs Dome Keeper: enemies dig too, so the map is two-sided destructible.** Dome Keeper's defense phase is static; the dome takes hits but the world doesn't change. If voxel enemies tunnel and we tunnel, the topology of the run is mutually authored — late-run map state is unique to that run, which directly counters Dome Keeper's #1 negative review theme ("repetitive after 4 hours").
3. **vs They Are Billions: terrain is the wall, so wall-building is geological not architectural.** TAB's failure mode is "one wall-placement mistake erases 4 hours." If the terrain itself is your wall and it's destructible/regrowable inside the run, the failure mode shifts from binary-wipe to gradient-erosion — which keeps the late-game tension TAB is famous for without the hard refund-trigger frustration.
4. **vs Bloons TD 6 / Kingdom Rush: the run, not the map, is the content.** Both baselines depend on hand-authored maps + heroes as their content treadmill (and BTD6's monetization is a live negative review theme). A roguelite voxel TD's content is procedural map state — every run authors a new arena via destruction. We don't compete on hero count, we compete on "no two runs produce the same skyline."
5. **vs Backpack Battles: spatial decisions are 3D, not 2D grid.** Backpack Battles' top complaint is RNG dependence on the 2D grid. Building tower placements into a 3D voxel arena where elevation is itself a damage modifier (like Rogue Tower hints at, but with destructible cliffs) means players can *create* high ground through digging rather than waiting for it in the shop — agency over the spatial axis Backpack Battles can't offer.

---

## Implications for Phase 0 hook decision

Read alongside [`phase-0-hook.md`](phase-0-hook.md). The five differentiation hypotheses above all assume Hook A (roguelite voxel TD with destructible terrain). Three things to take into pitch validation:

- The verb test. Before committing, name the new verb. *"Defend with a map that bends"* is one option; *"erode the world while you defend it"* is another. Pick a verb-led pitch and test it.
- The single-image test. Sketch a placeholder capsule that shows mid-run terrain destruction. If a non-gamer can identify "you're defending something while the ground falls apart" from a single image, the visual hook is real. If they need explanation, the hook isn't carrying.
- The asymmetric-phase test. The successful comps all have a phase flip. Voxel Bastion's natural phase flip is *build phase* (place towers, shape terrain) vs *wave phase* (defend, watch terrain erode). Make sure both phases are equally screenshot-worthy.

## Sources

- [Rogue Tower on Steam](https://store.steampowered.com/app/1843760/Rogue_Tower/)
- [Rogue Tower revenue calculator](https://steam-revenue-calculator.com/app/1843760/rogue-tower)
- [Rogue Tower launch trailer](https://www.youtube.com/watch?v=CSxF4Irv_es)
- [Mindustry on Steam](https://store.steampowered.com/app/1127400/Mindustry/)
- [Mindustry — Wikipedia (free/open-source distribution)](https://en.wikipedia.org/wiki/Mindustry)
- [Dome Keeper on Steam](https://store.steampowered.com/app/1637320/Dome_Keeper/)
- [Dome Keeper $1M launch postmortem (Game World Observer)](https://gameworldobserver.com/2022/10/17/dome-keeper-1-million-revenue-wishlists-success-raw-fury)
- [How Dome Keeper achieved a million-dollar launch (How To Market A Game)](https://howtomarketagame.com/2022/10/17/how-dome-keeper-achieved-a-million-dollar-launch/)
- [6 lessons from the Dome Keeper launch — trailer A/B notes](https://howtomarketagame.com/2022/10/19/6-interesting-lessons-from-the-dome-keeper-launch/)
- [Backpack Battles on Steam](https://store.steampowered.com/app/2427700/Backpack_Battles/)
- [Backpack Battles 640K copies / China sales (Game World Observer)](https://gameworldobserver.com/2024/04/25/backpack-battles-sales-640k-copies-china-top-country)
- [How Backpack Battles sold 650k copies in its first month (GameDiscover)](https://newsletter.gamediscover.co/p/how-backpack-battles-sold-650k-copies)
- [They Are Billions on Steam](https://store.steampowered.com/app/644930/They_Are_Billions/)
- [They Are Billions sales statistics (Levvvel)](https://levvvel.com/they-are-billions-statistics/)
- [They Are Billions — SteamSpy](https://steamspy.com/app/644930)
- [Kingdom Rush on Steam](https://store.steampowered.com/app/246420/Kingdom_Rush___Tower_Defense/)
- [Kingdom Rush Frontiers on Steam](https://store.steampowered.com/app/458710/Kingdom_Rush_Frontiers__Tower_Defense/)
- [Bloons TD 6 on Steam](https://store.steampowered.com/app/960090/Bloons_TD_6/)
- [Bloons TD 6 — SteamSpy](https://steamspy.com/app/960090)
