# Refactor WardScreen without changing gameplay

## Goal

Break the 2,264-line ward screen into focused modules while preserving every visible screen, timer, movement path, score, patient interaction, catastrophe, mini-game, sound, and save callback exactly as they work now.

## Changes

- Extract the fixed ward geometry and pathfinding graph into a pure navigation module. Keep all existing coordinates, station chairs, bed approach points, routes, and movement-speed calculations unchanged.
- Extract the ward’s large presentational sections into focused components:
  - status display and shift objectives
  - ward scene artwork, beds, curtains, staff, nurse, shadows, and catastrophe sprites
  - patient action panel
  - briefing, tutorial, pause, settings, mini-game offer, and catastrophe announcement/result overlays
- Move shared ward-only types into a small shared module where needed, avoiding duplicate definitions or circular imports.
- Keep live gameplay state and orchestration in `WardScreen`: the game clock, event spawning/expiry, action scoring, nurse/staff movement, catastrophe lifecycle, DON behavior, mini-game transitions, and shift completion.
- Rename internal avocado-specific lifecycle variables only where doing so is necessary for the existing catastrophe registry; do not alter event data or behavior.

## Safety constraints

- Do not change the fixed 890 × 1123 ward world, coordinates, depth ordering, collision routes, or artwork.
- Do not change patient choices, timers, upgrades, scoring, job security, objectives, staff behavior, catastrophe timing, or mini-game behavior.
- Preserve all current accessibility labels, button text, styling, audio calls, and parent callbacks.
- Keep this a structural refactor only; no visual redesign or new feature work.

## Verification

- Run the project type check.
- Verify a normal shift on a phone-sized viewport: briefing, patient selection, nurse travel, three action choices, pause/settings, and mini-game overlay.
- Verify Dev Mode → Events → Avocado Avalanche through intro, active phase, conclusion, resumed ward play, and a working Menu button.
- Check the browser console for new errors and confirm the ward remains correctly framed on portrait and wide/short viewports.
