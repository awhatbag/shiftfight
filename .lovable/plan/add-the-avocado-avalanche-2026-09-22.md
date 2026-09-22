# Add the Avocado Avalanche

## Scope

Add one self-contained catastrophic event to active Level 3 shifts only. It will reuse the current beds, patients, call bells, movement, assessment, action, scoring, expiry, staff, pause, and shift timer systems.

## Build

- Prepare the five supplied artworks as transparent assets without redrawing them: three avocado sprites plus worried and happy DON portraits.
- Add an isolated avocado event catalogue with dozens of varied patient problems and call-bell lines, each mapped to the existing action types and existing scoring/outcome model.
- During Level 3, schedule one random trigger early enough to begin with at least 40 seconds left. The intro briefly freezes gameplay, then the catastrophe runs for exactly 30 seconds while the normal shift clock continues.
- Temporarily replace each occupied bed’s current displayed problem with a unique avocado-related event, preserving the same bed and patient. Require assessment before revealing the remaining response choices, then resolve through the existing ward action flow.
- Add a lightweight ward overlay that emits supplied avocado sprites east-to-west, with random artwork, moderate size variation, speed, lanes, rotation, bounce, and occasional diagonal travel. Use the known bed sprites as simple collision zones; impacts stop, fall to the ground (half the height of the bed sprite) stay still for about five seconds, flicker, then disappear.
- The avocado artworks moderate size should be slightly smaller than half the height of the bed sprites. Plus/minus small variations.
- Beging the avalanche with many avocados.
- Gradually reduce spawn frequency across the 30 seconds. Existing sprites may finish after spawning stops.
- At the end, clear unresolved temporary avocado problems, restore the normal event state, and show the supplied happy DON conclusion before normal play continues.

## Safeguards

- No admissions, bed changes, new beds, treatments, mini-games, staff behavior, progression rules, or physics engine.
- No availability outside Level 3 and no more than one trigger per shift.
- Existing non-avocado events and saved progress remain compatible.

## Verification

- Check Level 3 trigger limits, timing, pause/resume behavior, 30-second duration, east-to-west travel, bed impacts, assessment gating, call-bell copy, cleanup, and conclusion on a phone-sized preview.
- Confirm other levels never trigger the event and existing ward actions still score and resolve normally.