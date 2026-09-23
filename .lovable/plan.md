# Avocado Avalanche: normal gameplay, real scoring, real consequences

## What changes

**Patient problems behave like every other problem.** During the catastrophe each occupied bed gets a silly avocado problem from the existing pool, shown and answered through the normal complaint + response-choice flow, with the usual Best / Sort-of / Worst outcomes, points, combo and sounds. No assess step, no avocado-only response system.

**Problems refresh fast.** Each avocado problem now has a normal short countdown rather than one that lasts the whole event. Half a second after a patient's problem is answered, that patient receives another random avocado problem, until the 30 seconds are up.

**Timeouts stay as they are.** An unanswered problem times out through the existing mechanic (damage, "TOO SLOW", counted as overdue). It is simply also recorded as missed for the catastrophe tally.

**The event is scored.** While it runs, the ward counts problems generated, and how many ended as Best, Sort-of, Worst or missed. At the end that tally produces one of three outcomes:
- Positive — mostly Best answers: "AVOCADO AVALANCHE CONTAINED", happy DON.
- Neutral — mixed results: disappointed DON (new artwork).
- Negative — mostly Worst or missed: "AVOCADO AVALANCHE OUT OF CONTROL", angry DON (new artwork).

The closing card shows the DON portrait for that outcome plus the tally.

**Job security and the DON review react.** The outcome is carried out of the shift with the other shift statistics and folded into the existing end-of-shift DON review: positive gives a meaningful job-security gain, neutral a small nudge, negative a meaningful loss, each shown as a line in the review notes. Noticeable, but never shift-deciding on its own.

**Everything else is untouched.** Level 3 only, once per shift, 30 seconds, at least 40 seconds remaining, shift clock unaffected, normal problems suspended and restored exactly as now, Dev Mode trigger unchanged, all state cleared when the event ends.

## Technical notes

- `WardScreen.tsx`: add an `avocadoTally` ref; count on spawn, classify in `doAction` by the existing outcome multiplier, count misses in the expiry effect; respawn a fresh avocado event for that bed 0.5s after resolution while the phase is active; give avocado events a short per-problem ttl instead of the full event length.
- `avocado.ts`: add the outcome grading helper and per-problem ttl.
- `ShiftStats` gains an optional `catastrophe` field; `ReviewInput`/`reviewShift` in `don.ts` gain an optional catastrophe outcome contributing a fixed delta and a note.
- Two new transparent DON portraits registered as assets.

## Verification

Trigger from Dev Mode: confirm no assess step, normal response choices, 0.5s follow-up problems, timeouts behaving as before, the tally-driven conclusion with the right DON, cleanup, and a job-security line in the shift review.
