# Eliminate ward nurse skin/hair colour bleed

## Confirmed cause

The ward nurse is rendered from the supplied three-column, eight-row sprite atlas. `Nurse.tsx` places a skin-colour layer and then a hair-colour layer over the same frame using two independent mask images. The rendering and saved colour flow are already correct; the bleed is inside the ward masks themselves. Automatic colour classification has assigned some face pixels to hair and some hair/fringe pixels to skin, so the later hair layer can paint over the face.

## Targeted fix

- Keep the supplied nurse artwork, current sprite atlas, animations, sizes, directions, customisation choices, and save flow unchanged.
- Rebuild only the **ward** skin and hair masks; leave the working character-selection preview masks untouched.
- Audit all 24 atlas cells individually: female, male, and non-binary across idle, walk-down, both side-walk frames, run, interact, check, and back-facing states.
- Define the visible head silhouette in each cell, then classify its pixels into three exclusive groups:
  - hair, including the full fringe, hairline, side hair, bun/cap, and rear hair;
  - skin, including face, ears, neck, exposed arms, and hands;
  - protected artwork, including eyes, brows, mouth, outlines, scrubs, equipment, and transparent space.
- Treat the hair region as a dedicated artwork-derived overlay over the head rather than inferring it from skin colour proximity. Use the original hair contours from each supplied pose so the fringe remains hair while cheeks, forehead, ears, and neck remain skin.
- Enforce strict mask subtraction before export:
  - `hair = approved hair pixels`
  - `skin = approved skin pixels minus hair`
  - assert that `skin ∩ hair = 0` for every frame.
- Preserve original linework and shading by masking only the coloured interior pixels; do not tint outlines, facial features, clothing, or props.
- Replace the two existing ward mask assets in place so `Nurse.tsx` requires no parallel character system or gameplay changes.

## Validation

- Produce enlarged per-frame inspection sheets showing the original sprite, skin mask, hair mask, and combined result for all 24 cells.
- Programmatically verify zero overlapping non-transparent pixels between the two masks in every cell.
- Test contrasting combinations that expose errors clearly: deepest skin with blonde/pink hair and lightest skin with black/teal hair.
- Verify female, male, and non-binary nurses while facing south, east, west, and north; walking, running, sitting, checking, and interacting.
- Confirm arms and hands retain the chosen skin colour, fringes retain the chosen hair colour, and no colour crosses the hairline during animation.
- Check the ward at portrait mobile size and confirm movement, sprite scale, feet anchors, layering, and saved appearance remain unchanged.
