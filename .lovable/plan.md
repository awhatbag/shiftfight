# Nurses’ station sprite and seating anchors

## Scope
- Replace the CSS-drawn nurses’ station, monitor, phone, desk spaces, and chair artwork with the uploaded transparent station sprite.
- Preserve the station’s existing button behavior and level nameplate.
- Keep the artwork proportional with its transparent background intact.

## Seating anchors
- Define five reusable chair anchor points from the visible chair centres in the uploaded artwork.
- Keep the current assignment order: player nurse in chair 1, hired staff sequentially in chairs 2–5.
- Render seated characters at those anchors and use the corresponding positions as each character’s station destination.
- Preserve staff dispatch, return, availability, and chair rejoining behavior unchanged.

## Validation
- Check the station at mobile widths with the player and hired staff seated centrally on the five pictured chairs.
- Confirm the player returns to the station, staff leave and rejoin their assigned chairs, and the station remains tappable.
- Confirm no unrelated gameplay or interface behavior changed.
