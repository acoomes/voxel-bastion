# Steam Partner / Steam Direct application — preparation checklist

For getting Voxel Bastion onto Steam: from "I want to publish" to "Partner account active, first app fee paid, 30-day clock running." This is hook-independent — the legal/account side can run in parallel with Phase 0 hook validation.

> **Disclaimer:** This is a checklist, not legal or tax advice. For entity formation (LLC/S-corp/etc.) and international tax treaty selection, talk to a real accountant. Steam's process changes; verify against the canonical [Steamworks docs](https://partner.steamgames.com/) before submitting.

---

## What you're applying to

There are two layers:

1. **Steamworks Partner account** — your *publisher* account on Steam. One per legal entity, used for all your future games. Free to create.
2. **Steam Direct app submission** — the per-app application that gets a specific game listed. Costs $100 per app, recoupable from sales after $1,000 in adjusted gross revenue (AGR). Each new app you ever publish under the partner account is another $100.

Voxel Bastion will need both: the Partner account once, and the Direct app fee when you're ready to put up the Steam page.

---

## Critical timing fact

**Steam imposes a 30-day waiting period** between when you pay the Steam Direct app fee and when the game is allowed to launch. Plus a 1–5 day review for the store page itself before it can go live ([Steamworks Direct docs](https://partner.steamgames.com/steamdirect)).

For this project's roadmap (Phase 2 has Steam page submission at month 3–4), this means:

- **Submit the Partner application now-ish** — entity setup, ID verification, and bank/tax forms can be done weeks before the first app fee. No clock starts until you pay the $100 fee.
- **Pay the $100 app fee at least 30 days before the desired launch date** — comfortably more, since 30 days is the *floor*, not the timeline.
- **For a target ship in month 12–15**: pay the $100 fee no later than month 11. Most projects pay it earlier (when submitting the Steam page in Phase 2) since Steam page review is independent of the launch clock.

---

## Pre-submission decisions

Before you sit down to apply, lock these:

### 1. Legal entity

Pick one. Each has tax/liability implications:

- **Sole proprietor / individual** — fastest, cheapest, no separate entity. You're personally liable. US: just use your SSN on tax forms. Non-US: depends on country.
- **LLC (US) / Ltd (UK) / equivalent** — limits personal liability, opens business banking, often required if revenue grows past hobby scale. Costs $50–500 to form depending on state/country. **Recommended once you're past Phase 0** if you're serious about commercial release. Don't bother for Phase 0 hook validation alone.
- **S-corp / C-corp** — overkill for a solo indie unless you're raising or scaling employees. Skip.

If switching from individual → LLC later, Steam supports transferring the partner account but it's annoying. Better to start with the entity you'll publish under.

### 2. Game name

Must:
- Not infringe an existing trademark (Google + USPTO TESS search; do a Steam search too)
- Not contain offensive content per Steam's [Onboarding Guidelines](https://partner.steamgames.com/doc/gettingstarted/onboarding)
- Be the *exact* name that will appear on the store page (changing it after launch is painful)

For Voxel Bastion specifically: a quick search shows no Steam trademark conflicts as of 2026-04-29, but verify before submitting. Domain: check `voxelbastion.com` availability for a future devlog/marketing site.

### 3. Bank + tax info ready

You'll need:

- **Bank account** for revenue payouts. Steam pays in USD; non-US devs should be ready for currency conversion fees.
- **Tax form** — W-9 (US persons) or W-8BEN/W-8BEN-E (non-US). Steam's online wizard walks you through this. Non-US: have your country's tax treaty number with the US handy if claiming reduced withholding.
- **Tax ID** — SSN/EIN for US, equivalent for non-US.

### 4. ID verification

Steam will require a government-issued photo ID for the individual or beneficial owner of the entity. Have a passport or driver's license ready as a digital scan/photo.

### 5. App-specific decisions due at submission

These get locked when you fill out the Steam page (after the $100 app fee). Decide them now to avoid stalling:

- **Game name (final)** — same as above, but final.
- **Short description** (≤300 chars) — use the 50-word pitch as a base ([`pitches.md`](pitches.md)).
- **Store tags** — pick 5–10 most relevant. For Voxel Bastion, candidate tags: *Tower Defense, Roguelite, Voxel, Procedural Generation, Indie, Strategy, Singleplayer, Difficult, Building, Destruction*. Tags drive discovery — don't tag inaccurately, but pick the broadest accurate set.
- **Age rating** — Steam routes this through IARC. Voxel Bastion likely E10+ (cartoon violence). The questionnaire takes ~10 minutes.
- **Languages supported** — declare even if just English at launch. Per the roadmap, EN/ZH/DE/RU/ES is the localization target by Phase 5.
- **Pricing tier** — final price decision can wait until Phase 5, but rough range now: $9.99–$14.99.
- **Genre / category** — pick conservatively (Indie + Strategy). Steam allows multiple.

---

## The actual submission steps

Once decisions above are locked:

1. **Create Steamworks account** → https://partner.steamgames.com/. Use a long-term email; this is your publisher identity for life.
2. **Sign the Steamworks Distribution Agreement** — read it. Real terms, not a clickwrap.
3. **Submit identity verification** — upload ID per the wizard.
4. **Complete tax interview** — W-9 or W-8 wizard.
5. **Add bank info** — for payouts.
6. **(Wait)** — Valve reviews your partner application. Typically a few days.
7. **Once approved: create the app** — pay the $100 Steam Direct fee. **30-day clock starts.**
8. **Set up Steamworks app config** — depot for the build, achievements, cloud saves config. Most of this can be skipped for Phase 0/1 and configured during Phase 2.
9. **Build the Steam page** — capsule art, screenshots, trailer, descriptions. **This goes live separately**, after a 1–5 day Steam review of the page.

---

## What's hook-independent vs. hook-gated

Can run **in parallel with Phase 0 hook validation** (do these now if you're ready):

- Entity formation (if going LLC)
- Steamworks Partner account creation + ID verification + tax/bank wizard
- Trademark / Google / Steam-search the name "Voxel Bastion"
- Domain registration (`voxelbastion.com` and variants)

**Hook-gated** (wait until pitch validation locks the verb and the differentiator):

- Pay the $100 app fee → starts 30-day clock; only do this when you're ~6+ weeks from a Phase 2 vertical slice that can plausibly be on a Steam page
- Final game name commitment (could change post-validation if pitches surface a better name)
- Short / long descriptions (use [`pitches.md`](pitches.md) as draft material; final after hook lock)
- Capsule art (Phase 2 deliverable)
- Trailer (Phase 2 deliverable)

---

## Costs to budget

| Item | Cost | When |
|------|------|------|
| LLC formation (optional, US, varies by state) | $50–500 | Now if going LLC |
| Steam Direct app fee | $100 (recoupable after $1K AGR) | Phase 2, pre-Steam-page |
| Domain registration (`voxelbastion.com`) | ~$15/yr | Now |
| Capsule art (freelance) | $300–1,500 | Phase 2 |
| Trailer production (if not DIY) | $0–2,000 | Phase 2 |
| Music commission (5–10 tracks) | $1,000–5,000 | Phase 3 |
| Localization (5 languages, ~5K words) | $500–2,500 | Phase 5 |

For just *Steam Partner activation* in this checklist's scope: **$100 + optional $50–500 entity formation.** Everything else is downstream.

---

## What to bring back to the queue once done

After completing this checklist, update [`docs/queue.md`](queue.md):

- Move "Steam Partner approval" from "Blocked / awaiting user" → "Completed" with the approval date
- Add a note with your Steamworks publisher slug (used in future Steam-page-related items)
- Optionally: add a `app-fee-paid: 2026-XX-XX` field that the cron loop can use to compute "earliest legal launch date"

---

## Sources

- [Steam Direct Product Submission Fee — store page](https://store.steampowered.com/sub/163632/)
- [Steam Direct Fee — Steamworks docs](https://partner.steamgames.com/doc/gettingstarted/appfee)
- [Steamworks Partner Program / Steam Direct](https://partner.steamgames.com/steamdirect)
- [Steam Direct: Fee, Requirements and ROI (2026 Guide) — Datahumble](https://datahumble.com/blog/steam-direct-fee-requirements-roi-2026-guide)
- [How to Publish a Game on Steam in 2026 — Ziva](https://ziva.sh/blogs/publish-game-steam)
- [Self-Publish On Steam: The Ultimate Guide — Xsolla](https://xsolla.com/blog/self-publish-on-steam-the-ultimate-guide)
