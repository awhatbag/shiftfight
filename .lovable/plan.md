# Replace the ward background artwork

## Scope
- Upload the supplied ward artwork as a project image asset.
- Place it as the lowest visual layer inside the existing ward play area.
- Scale it proportionally with `contain` so the full artwork remains visible without distortion or meaningful cropping; use the existing ward colour behind any narrow edge space.
- Remove only the current generated corridor-floor background that the artwork replaces.
- Leave the existing bed slots, curtains/obstacles, nurse and staff coordinates, patients, call bells, overlays, menus, controls, and all game logic untouched.

## Verification
- Check the active shift at the current mobile size and a narrower phone size.
- Confirm the artwork fills the ward cleanly, gameplay objects remain above it, buttons remain usable, and no object coordinates or interactions changed.

## Technical details
- Add one CDN-backed image pointer under `src/assets`.
- Make one focused presentation edit in `WardScreen.tsx`; no gameplay state, timers, scoring, movement, progression, or registry changes.
