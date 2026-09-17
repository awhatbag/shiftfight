# Fix ward bed sizing

## Scope
- Keep the existing bed artwork, bed IDs, coordinates, movement targets, patient links, and all gameplay logic unchanged.
- Increase each bed sprite to the footprint shown in the supplied ward reference.
- Expand the containing bed/patient interaction area around that sprite so the container no longer scales the artwork down.
- Keep the complete ward as one fixed 890 × 1123 world that scales and crops only as a whole.

## Implementation
- Update only the ward bed footprint and the sprite sizing inside the existing `Bed` component.
- Preserve the current center point for every bed, ensuring patients, calls, timers, selection, and pathfinding remain attached to the same bed.
- Check the ward at portrait and short/wide preview sizes, then confirm the project remains error-free.
