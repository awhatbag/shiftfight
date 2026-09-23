# Avocado Avalanche: normal gameplay, real scoring, real consequences

## What changes

**Patient problems behave like every other problem.** During the catastrophe each occupied bed gets a silly avocado problem from the existing pool, shown and answered through the normal complaint + response-choice flow, with the usual Best / Sort-of / Worst outcomes, points, combo and sounds. No assess step, no avocado-only response system.

**Problems refresh fast.** Each avocado problem now has a normal short countdown rather than one that lasts the whole event. Half a second after a patient's problem is answered, that patient receives another random avocado problem, until the 30 seconds are up.

**Timeouts stay as they are.** An unanswered problem times out through the existing mechanic (damage, "TOO SLOW", counted as overdue). It is simply also recorded as missed for the catastrophe tally.

**The event is scored.** While it runs, the ward counts problems generated, and how many ended as Best, Sort-of, Worst or missed. At the end that tally produces one of three outcomes:

- Positive — mostly Best answers (happy DON)
- Neutral — mixed results: disappointed DON (new artwork).
- Negative — mostly Worst or missed:  angry DON (new artwork).

The closing card shows the DON portrait for that outcome plus the tally.

For each outcome, randomly select an appropriate headline and DON conclusion from the pools below.

### POSITIVE OUTCOME POOL

Randomly choose one:

**🥑 THE AVOCADOS HAVE BEEN CONTAINED**  
DON: “Excellent work. I haven't seen avocado-related competence like that in years.”

**🥑 AVOCADOS: DEFEATED**  
DON: “Excellent work. The avocados have been dealt with.”

**🥑 GUACAMOLE DISASTER AVERTED**  
DON: “Outstanding. Nobody mention this to Facilities.”

**🥑 THE GUACENING HAS BEEN PREVENTED**  
DON: “Outstanding. The hospital remains substantially less guacamole-based than it could have been.”

**🥑 AVOCADO SITUATION: UNDER CONTROL**  
DON: “Excellent work. Please don't ask where the remaining 400 went.”

**🥑 ZERO AVOCADOS, ZERO PROBLEMS**  
DON: “Well done. Technically there are still avocados everywhere, but we're calling that a win.”

### NEUTRAL OUTCOME POOL

Randomly choose one:

**🥑 WE HAVE SURVIVED THE AVOCADOS**  
DON: “I'm not sure that's the same thing as success, but we'll take it.”

**🥑 AVOCADO INCIDENT: MOSTLY FINE**  
DON: “That could have gone considerably worse.”

**🥑 GUACAMOLE LEVELS: ACCEPTABLE**  
DON: “I'm choosing to call that a success.”

**🥑 AVOCADOS HAVE BEEN... MOSTLY MANAGED**  
DON: “I've seen worse. I've also seen significantly fewer avocados.”

**🥑 AVOCADO SITUATION: CONTAINEDISH**  
DON: “I'll accept that.”

**🥑 AVOCADO DAMAGE: MODERATE**  
DON: “Nobody died. Nobody ask me about the beds.”

### NEGATIVE OUTCOME POOL

Randomly choose one:

**🥑 THE AVOCADOS HAVE WON**  
DON: “I have several questions.”

**🥑 GUACAMOLE EVENT: CATASTROPHIC**  
DON: “Who authorised the avocados?”

**🥑 AVOCADO DOMINATION ACHIEVED**  
DON: “The hospital belongs to them now.”

**🥑 WE HAVE LOST THE WAR ON AVOCADOS**  
DON: “I specifically asked everyone to remain calm.”

**🥑 AVOCADO SITUATION: DEEPLY CONCERNING**  
DON: “Why is there an avocado in my office?”

**🥑 GUACAMOLE EVERYWHERE**  
DON: “I'm going home.”

**🥑 THE GREAT AVOCADO DISASTER**  
DON: “Facilities has stopped answering my calls.”

**🥑 AVOCADOS: 47 — US: 0**  
DON: “I'm not discussing the scoreboard.”

**🥑 THIS IS NO LONGER A HOSPITAL**  
DON: “It's an avocado storage facility now.”

**🥑 AVOCADO APOCALYPSE**  
DON: “I don't want to talk about what happened in Ward 3.”

### REALLY STUPID / RARE OUTCOME MESSAGES

Also include these as **rare alternatives**. They should only appear when appropriate to the outcome and should be randomly selected.

For a positive outcome:

**🥑 HOLY GUACAMOLE**  
DON: “I genuinely have no idea how we're going to explain this.”

For a neutral outcome:

**🥑 GUACWARD BOUND**  
DON: “Everyone did their best. Unfortunately, their best was not enough.”

For a negative outcome:

**🥑 AVOCADO: 1. HOSPITAL: 0.**  
DON: “I would like to formally blame the supermarket.”

**🥑 THE AVOCADOS HAVE ESCAPED**  
DON: “If anyone sees one, do not approach it.”

**🥑 GUACAMOLE INCIDENT DECLARED**  
DON: “This is now someone else's problem.”

### RANDOMISATION RULES

- Select randomly from the appropriate outcome pool.
- Never select a positive message for a neutral/negative result.
- Never select a negative message for a positive/neutral result.
- The rare “really stupid” messages should have a lower chance of appearing than the standard messages.
- Do not show the same headline/DON combination every time the event is played.
- Keep the headline large and prominent, with the DON conclusion underneath using the existing catastrophe conclusion UI.
- Continue using the existing DON artwork.
- Keep the humour deadpan and absurd rather than making the messages overly dramatic.
- Do not add any new gameplay or scoring mechanics.

**Job security and the DON review react.** The outcome is carried out of the shift with the other shift statistics and folded into the existing end-of-shift DON review: positive gives a meaningful job-security gain, neutral a small nudge, negative a meaningful loss, each shown as a line in the review notes. Noticeable, but never shift-deciding on its own.

**Everything else is untouched.** Level 3 only, once per shift, 30 seconds, at least 40 seconds remaining, shift clock unaffected, normal problems suspended and restored exactly as now, Dev Mode trigger unchanged, all state cleared when the event ends.

## Technical notes

- `WardScreen.tsx`: add an `avocadoTally` ref; count on spawn, classify in `doAction` by the existing outcome multiplier, count misses in the expiry effect; respawn a fresh avocado event for that bed 0.5s after resolution while the phase is active; give avocado events a short per-problem ttl instead of the full event length.
- `avocado.ts`: add the outcome grading helper and per-problem ttl.
- `ShiftStats` gains an optional `catastrophe` field; `ReviewInput`/`reviewShift` in `don.ts` gain an optional catastrophe outcome contributing a fixed delta and a note.
- Two new transparent DON portraits registered as assets.

## Verification

Trigger from Dev Mode: confirm no assess step, normal response choices, 0.5s follow-up problems, timeouts behaving as before, the tally-driven conclusion with the right DON, cleanup, and a job-security line in the shift review.