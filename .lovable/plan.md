# Cohesive progression and reward layer

## Goal
Build a focused reward presentation on top of the game’s existing XP, nurse ranks, combo tracking, objectives, scoring, sound, haptics, saves, and shift flow. Reuse the red smooth pixel treatment already used by `READY… SET… SHIFT FIGHT!`, `3, 2, 1`, and `TIME’S UP!`; do not introduce another visual language.

## Current systems to preserve
- Nurse rank is already derived from cumulative XP at the existing thresholds; shift XP is committed after a shift and affected by current XP modifiers.
- Correct patient outcomes already build a combo; partial, failed, and timed-out outcomes already reset it according to current rules.
- Three random objectives are already selected, tracked, rewarded, shown in the ward, and recapped at shift end.
- The current shift outro, DON review, auto-save, summary, fired state, shop, and next-shift navigation remain intact.
- Existing rank-gated staff, equipment, bed upgrades, and level-gated beds are the authoritative unlock sources. Future paid cosmetics remain locked and are not converted into XP unlocks.

## Build plan

### 1. Shared arcade reward styling
- Generalise the existing pixel-countdown treatment into reusable reward text variants while keeping its font, stepped shading, outline, and smooth hi-bit pixel feel.
- Add restrained reusable animations for rise, pause, flare, burst, and shrink-to-target, with reduced-motion fallbacks.
- Keep all ward feedback transparent, pointer-safe, and clear of patient issue text and controls.

### 2. Compact ward progression strip
- Rework the ward HUD’s top information area to include a compact job-security meter and a new nurse-level tab without increasing the overall HUD footprint.
- Pass the existing cumulative XP/rank into the ward; show nurse level and progress using the existing rank calculation only.
- Reuse the same level tab on the summary as the final target of the level-up animation.

### 3. Combo and positive outcome feedback
- Keep the existing success-based combo calculation and reset behavior unchanged.
- Add milestone callouts at meaningful thresholds such as `COMBO x3!`, `COMBO x5!`, and `ON FIRE!`, rather than on every correct answer.
- Add occasional non-blocking feedback chosen from nurse-themed lines such as `PERFECT!`, `QUICK THINKING!`, and `NICE TRIAGE!`.
- Use the existing quick-response bonus signal for `QUICK THINKING!`; use event severity, correctness, and silly-call context for other lines, including humorous nonsense acknowledgements where appropriate.
- Give these callouts separate transient state so they do not replace the existing scoring/outcome banner or interfere with controls.
- Reuse existing positive sound and haptic controls for restrained milestone emphasis.

### 4. End-of-shift progression sequence
- Extend the existing `TIME’S UP!` handoff into a staged summary rather than replacing the current summary screen.
- Present `SHIFT COMPLETE!`, then reveal shift points, final XP earned after existing modifiers, best combo, completed objectives, and one notable achievement derived from existing shift stats.
- Animate cumulative XP from its pre-shift value to its saved post-shift value in the summary level bar.
- Preserve immediate final-state auto-save before presentation, so closing or refreshing during the sequence cannot lose rewards.

### 5. Level-up and unlock celebration
- Detect rank changes by comparing pre-shift and post-shift XP through the existing `nurseRank` function; do not alter XP awards or thresholds.
- On a rank increase, show the new nurse level prominently with the shared arcade styling, a compact flare/burst, existing level-complete sound, and existing haptics.
- Animate the level result rising from the bottom, pausing briefly, then shrinking and travelling into the summary nurse-level tab before disappearing.
- Follow with `NEW UNLOCK!` only when the crossed rank or shift level actually opens existing staff, equipment, bed upgrades, beds, or progression content. List the real newly available entries; do not invent rewards or unlock paid cosmetics.
- Keep the sequence skippable/advanceable after its key information has appeared, then reveal the existing DON assessment and normal Shop flow.

### 6. Verification
- Add focused tests for rank crossing, no-rank-change shifts, max nurse rank, collapsed shifts, objective rewards, combo milestones/resets, and unlock diffing.
- Run a complete mobile-sized flow through intro, active ward feedback, `3–2–1`, `TIME’S UP!`, reward count-up, level-up travel into the tab, unlock reveal, DON review, shop, and auto-save reload.
- Confirm overlays never block patient controls, audio/haptics respect settings, reduced motion works, and existing gameplay/scoring values remain unchanged.

## Technical notes
- Add a small reward-presentation payload at shift end containing pre/post XP, adjusted XP earned, old/new rank, and actual unlock differences; this is display metadata, not a second progression system.
- Keep transient ward callouts in a focused overlay component and the staged summary celebration in a focused reward component, avoiding further growth of the ward controller.
- Record the reward-layer boundary and rank/unlock derivation rule in the project architecture notes after implementation.
