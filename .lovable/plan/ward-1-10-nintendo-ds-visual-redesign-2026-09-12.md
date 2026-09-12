# Ward 1–10 Nintendo DS visual redesign

## Direction

- Use the supplied image strictly as visual reference, not as an embedded background.
- Rebuild the Level 1–10 ward in crisp Nintendo DS-style pixel art: near-top-down perspective, visible square-pixel edges, stepped highlights, compact tile shading, and the selected blue/cream palette.
- Keep the game phone-first and preserve the current portrait play area, readable touch targets, and fast arcade feel.

## Ward playfield

- Replace the current card-like corridor with a complete pixel-art hospital room: tiled floor, framed perimeter walls, upper windows/doors, and a clear central circulation area inspired by the reference.
- Arrange the beds as a 2×4 grid matching the reference. Levels still begin with four active beds and progressively reveal the remaining bays through Level 10.
- Redraw beds and privacy curtains as detailed top-down pixel sprites, while retaining patient names, bay numbers, timers, locked states, urgency cues, selection states, and tap behavior.
- Reposition movement waypoints and obstacles to match the new grid so nurse and staff travel remains visible and functional without changing movement speed or gameplay rules.

## Station and HUD

- Redraw the existing bottom nurses’ station, five chairs, computer, phone, level nameplate, and reserved upgrade spaces in the same crisp pixel-art language.
- The nurses station should be a crescent moon curved shape.
- Restyle the in-shift HUD and objective tracker with compact DS-era panels, pixel borders, hard shadows, and high-contrast status colours.
- Preserve all existing information, buttons, overlays, action panels, warnings, and menu behavior; this pass changes their visual treatment and placement only where necessary for fit.

## Scope boundaries

- Do not redesign characters, mini-games, title/ladder/summary/shop screens, or later wards in this pass.
- Do not add decorative environmental objects beyond the structural ward elements needed to establish the reference look; those can follow later direction.
- Do not alter events, scoring, objectives, progression, upgrades, staff logic, DON behavior, saving, or difficulty.

## Technical details

- Build the room and equipment from reusable pixel-style React/SVG/CSS artwork rather than using the reference image directly, keeping graphics sharp across phone densities.
- Add semantic ward-art colour and shadow tokens to the global design system; avoid unrelated global visual changes.
- As levels progress, wall colours, bed colours, floor colours and door colours should change per level, keeping each level within a matching colour scheme.
- Keep locked and active bed slots stable so expansion from four to eight beds never shifts the room layout.

## Validation

- Test Levels 1, 5, and 10 at the current 448×830 viewport and a 390×844 phone viewport.
- Confirm all active and locked beds, the nurses’ station, five chairs, HUD, objectives, nurse/staff movement, urgency states, and bottom action overlay remain visible and tappable.
- Verify no labels overlap, no room elements are clipped, and the pixel artwork stays crisp without changing ward dimensions during interactions.
- Run the project typecheck and inspect final screenshots against the supplied reference for palette, perspective, density, and retro clarity.