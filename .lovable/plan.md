# Make Barry and Priya actually look like they're walking

## Likely cause (to confirm first)
- Barry's left/right walk sequences only use 4–6 of the 10 frames (the cells without red X's). With the 3.9-second cycle, each pose stays on screen for roughly 0.65–1 second while he keeps sliding across the floor. That reads as one frozen sprite gliding, and sideways walking is where it shows most.
- Priya uses all 9 frames, but at about 0.43 seconds per frame her feet still move far too slowly for the distance she covers.
- The speed of the feet and the speed of travel aren't linked, so legs and floor never match up.

## Plan
1. **Check the artwork first:** make a side-by-side strip of each walking row (Barry and Priya, all 4 directions) so we can both see which cells are real stride poses. I won't edit the artwork.
2. **Count steps by distance, not by time:** move the walk frame forward each time the character covers a fixed bit of floor (about one stride per pose), not on a fixed timer. Feet then match travel in every direction, and short or long rows (Barry's 4-frame right walk, Priya's 9-frame rows) both look natural.
3. **Keep the relaxed pace:** travel speed stays the same. Only the stepping changes, so a full walk cycle still lasts roughly 3 seconds across the ward.
4. **Leave the DON, the player nurse and sitting/helping poses alone.**
5. **Check it:** update the small animation tests. Then record frames during a Dev Mode shift to confirm each staff member shows several different poses while walking left and right.

## Technical notes
- `staffAnimation.ts`: add `strideFrame(distanceTravelled, strideLen, seqLen)`. `StaffWalker` builds up `Math.hypot(dx, dy)` from position changes instead of using a `setInterval` while walking. The helping animation keeps its timer.
- Stride length gets one tuning setting per staff member in `STAFF_ART`.
