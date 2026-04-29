# Automation cadence — daily autonomous Claude sessions

This document defines how Claude runs autonomously against the Voxel Bastion repo on a recurring schedule. The goal is to compound velocity by landing 1 PR per cycle without requiring synchronous user time, while keeping all merging and irreversible actions in user hands.

## Principles

1. **Steering vs. execution** — User decides what to build and reviews/merges. Claude writes the code, drafts the docs, runs the verification, and opens the PR.
2. **One scope per cycle** — Each scheduled run produces at most one PR. Smaller is better. If the next queue item is too large, break it down and ship the first slice.
3. **Branch + PR, never main** — Same rule as interactive sessions. The cron loop never merges anything.
4. **Stop on ambiguity** — If the queue item is unclear, the right next step is non-obvious, or a decision touches scope/strategy, Claude pauses and writes the question into the queue rather than guessing.
5. **Fail loud, not silent** — Tests fail, fetches error, dependencies blow up: the cycle aborts and posts a status comment to the queue, doesn't paper over.
6. **Always queue what's next** — Every cycle ends by updating `docs/queue.md` so the next cycle (or the user) has unambiguous context.

## Cycle structure

Each scheduled run executes this loop:

1. **Sync** — `git checkout main && git pull`
2. **Read context** — `CLAUDE.md`, memory files, `docs/queue.md`, any open-PR review feedback
3. **Pick task** — top item in the "Next up" section of `docs/queue.md` that isn't blocked
4. **Branch** — `git checkout -b <type>/<short-name>` per branch-naming convention
5. **Execute** — write code/docs, syntax-check, manual verification where possible
6. **Update queue** — move task from "Next up" to "In flight", add follow-up tasks discovered, update "Completed" log entry
7. **Commit + push** — single commit (or small logical commits), descriptive message
8. **Open PR** — print the GitHub PR-creation URL (since `gh` isn't installed); user clicks through to file the PR
9. **Report** — write a one-line summary of what happened to a session log

If any step blocks, the cycle exits cleanly with a clear status message and leaves the working tree clean.

## Guardrails

These are hard rules. Violations should make the cycle abort rather than work around.

| Rule | Why |
|------|-----|
| **Never merge a PR.** Only the user merges. | Preserves human-in-the-loop on what hits main. |
| **Never push to `main`.** Always a topic branch. | Mirrors the manual workflow. |
| **Never delete user content** (saves, configs, credentials, art assets) without explicit approval in the queue item. | Irreversible actions need confirmation. |
| **Never modify `.claude/`, `.git/`, `settings.*.json`** unless the queue item is explicitly an automation/permissions task with user authorization. | Avoids accidentally weakening guardrails. |
| **Never post under user identity** (Twitter/X, Bluesky, Reddit, Discord, Steam forums, email). I draft, user posts. | Reputation and identity stay with the human. |
| **Never spend money** (Steam Partner fees, contractor invoices, ad budgets, asset purchases). | Money decisions are user-only. |
| **Max 2 open PRs from automation at any time.** If 2 are already open, the cycle waits. | Prevents pile-up; respects review capacity. |
| **One PR per cycle, max.** | Keeps changes reviewable. |
| **Time-budget: ~30 min of agent time per cycle.** | Cost control. If a task overruns, ship partial work + queue note. |
| **Working tree must be clean at end of cycle.** | No dangling state for the next cycle to inherit. |

## When to pause autonomous work

The cycle should explicitly *not* run (or should pause) under any of these:

- Phase 0 hook decision is still pending and the queue's top item is Phase 1 implementation work
- The queue is empty (nothing to do — wake user, don't invent work)
- Two PRs are already open from automation
- The previous cycle ended in error and the error wasn't resolved
- A queue item explicitly marked `pause-after`

## How decisions get made

| Decision type | Who decides |
|---------------|-------------|
| Roadmap direction, hook choice, scope cuts | User |
| Architecture (e.g. how to structure MetaState) | Claude proposes in PR; user reviews |
| Implementation details within a sketched architecture | Claude |
| Library/dependency choices | Claude proposes; user can override |
| Anything money/legal/identity | User only |
| Reordering / killing queue items | User edits `docs/queue.md` anytime |

## The queue — `docs/queue.md`

Single source of truth for what's next. Three sections:

- **Next up** — ordered list, top item executes next cycle
- **Blocked / awaiting user** — items that need user input (decisions, validation, accounts)
- **Completed** — append-only log; trim quarterly

Format per item is in `docs/queue.md` itself. Claude updates it at the end of every cycle.

## Suggested cadence

Start conservative, expand if quality holds:

- **Week 1–2: manual daily.** User pings Claude in a session each day. No cron yet. This builds calibration on output quality and queue management.
- **Week 3+: scheduled daily.** One cron-driven cycle per day, at a user-chosen time (e.g. 7am local). User reviews PRs in their own rhythm.
- **Later (if sustained quality): twice daily** or task-triggered. Defer until the daily rhythm is proven.

Each cycle should land *something*. If it lands less than a half-day of equivalent work, escalate complexity (bigger queue items) or add a second daily cycle. If it lands more than a day's worth, slow down — quality is probably degrading.

## Setting it up

When the user is ready to switch from manual to scheduled, the steps are:

1. Confirm the queue is well-formed and the next 3–5 items are unambiguous
2. Pick a time of day that aligns with the user's review cadence (don't fire at 3am if user reviews at 9am — pile-up is no good)
3. Use the `/schedule` skill to register a cron schedule. The autonomous-loop sentinel is `<<autonomous-loop>>` (per the harness's CronCreate convention).
4. Watch the first 3 cycles closely; pause if quality drops

The exact `/schedule` invocation will look something like:

```
/schedule "daily 0 7 * * *" "<<autonomous-loop>>"
```

(Confirm the exact syntax via the skill help when the user is ready to enable it.)

## Failure recovery

If a cycle leaves things in a bad state (broken branch, stuck PR, working tree dirty):

1. Don't run the next cycle — pause first
2. User checks the latest PR / branch and decides: merge, fix, or abandon
3. Working tree on `main` should be clean before resuming
4. Add a postmortem note to `docs/queue.md` so the same failure mode is avoided

## Open questions for the user

Before flipping the switch from manual-daily to cron-scheduled, three things to confirm:

1. **Time of day** for the daily cron (recommend ~7–8am local so user can review with morning coffee)
2. **PR cap** — is 2 the right ceiling, or stricter (1) until trust builds?
3. **Pause command convention** — agree on a way to halt the loop (e.g., a `pause-automation` flag in `docs/queue.md` that the cycle checks first)

Defaults if user doesn't specify: daily at 7am local, 1-PR cap during week 3, escalate to 2 if quality holds.
