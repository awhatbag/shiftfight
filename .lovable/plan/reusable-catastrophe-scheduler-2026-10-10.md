# Reusable Catastrophe Scheduler

Avocado Avalanche's gameplay stays exactly as it is. Only the decision about *when* a catastrophe happens moves into one shared scheduler.

## How it will work for the player

- A new game starts with no gap, so the first catastrophe that suits the current level (Avocado Avalanche on Level 3) shows up on that shift, just like it does now.
- After any catastrophe, the game picks a random gap of 2 to 6 ordinary shifts. The catastrophe shift doesn't count toward the gap.
- Do not introduce a catastrophe on level 1 or 2.
- Each catastrophe happens once before any of them repeats. When all have happened, the cycle resets and starts again, with no limit.
- If the gap has run out but no catastrophe suits the current level, the shift plays normally and the game checks again next shift. Nothing is marked as done until it actually happens.
- Only one catastrophe runs at a time. Each one still won't start too late in a shift (each keeps its own "time left" minimum, 40s for the avalanche).
- Saved games keep their place in the cycle. A brand-new game resets it.
- Catastrophes are selected randomly from the available catastrophe events.
- Dev Mode triggers still work at any level and never change the normal schedule.

## Technical details

- `src/game/catastrophes.ts`: add a general eligibility check per entry: `levels?: number[]` or `minLevel` plus `available: boolean`. Avocado keeps `level: 3` as its rule. Add pure scheduler functions with an injectable RNG:
  - `type CatastropheSchedule = { shiftsUntilNext: number; completed: string[] }`
  - `newSchedule()` → `{ shiftsUntilNext: 0, completed: [] }`
  - `pickCatastrophe(schedule, level, rng)` → eligible, available entry not in `completed`. If every eligible entry is completed but the cycle isn't full, it waits. Once every registered entry is completed, `completed` resets. Returns null if the gap is still running.
  - `advanceSchedule(schedule, occurredId | null, rng)` → if a catastrophe happened: add it to completed (resetting when full) and set the gap to `2 + floor(rng*5)`. Otherwise, if one was scheduled but didn't happen (for example the shift ended early), leave the state as it was. On an ordinary shift: lower the gap by 1, never below 0.
- `src/routes/index.tsx`: save `catastropheSchedule` in `SaveData`, falling back to `newSchedule()` for older saves. Reset it on new game. Pick at shift start and pass `scheduledCatastropheId` to `WardScreen`. In `endShift`, advance using `stats.catastrophe` together with the id that actually auto-started. Dev-triggered runs are flagged and treated as ordinary for scheduling.
- `WardScreen.tsx`: replace `catastrophesForLevel(level).find(...)` with the scheduled id, keeping the same `minRemainingMs` and trigger-time checks. Report `catastropheId` and `catastropheSource: "auto" | "dev"` in `ShiftStats`. Lifecycle, overlap guard (`avocadoStarted`) and cleanup stay the same.
- Tests: add vitest `src/game/catastrophes.test.ts` with a seeded RNG and a fake second registered entry used only inside the test (nothing is added to the registry). It checks: the gap is always between 2 and 6, catastrophe shifts aren't counted, no repeats before the cycle completes, reset over 200+ shifts, level restrictions, unavailable entries skipped, missed events not marked done, and the new-schedule reset.
- Live check with Playwright: start a fresh game at Level 3 and confirm the avalanche still triggers. Confirm Dev Mode triggering still works.
- Record the scheduler rule in `AGENTS.md`.