# Animated, customisable nurse sprites

## Goal
Replace the placeholder nurse drawing with a cohesive 32-bit pixel-art character system based on the supplied reference board. The player’s chosen presentation and cosmetics will appear consistently in character selection, movement, seating, patient interactions, and return-to-station animations.

## Sprite system
- Create production-ready transparent sprite atlases inspired by the reference rather than embedding or cropping the reference board.
- Build the character in composable layers so combinations do not require a separate full sheet for every option:
  - three base presentations: female, male, non-binary
  - six skin tones
  - seven hair colours
  - six unlockable hairstyles
  - standard blue scrubs plus six special scrub sets
  - shoes and visible PPE/equipment hooks for existing and future gear
- Keep every frame on a consistent pixel grid, with bottom-centre foot anchors and crisp nearest-neighbour rendering.
- Include animation states for idle, seated, walking north/south/east/west, running, interacting, using/checking equipment, and returning to the station.
- Include neutral, happy, concerned, angry, tired, and surprised expressions for close-up previews and suitable in-game reactions.

## Character customisation
- Replace the placeholder character preview with the selected animated sprite.
- Expand the customisation screen to show presentation, skin tone, hair colour, hairstyle, scrub set, shoes, and PPE where applicable.
- Show locked hairstyles and special scrubs clearly, without making unavailable items selectable.
- Connect locked cosmetics to the existing points shop, level progression, events, or achievements; no real-money payment flow.
- Preserve existing names, randomisation, save files, and old saves by supplying safe defaults for newly added cosmetic fields.

## Ward animation and behaviour
- Pass the saved player character into the ward and use it for both the walking nurse and the seated station nurse.
- Select the correct walking direction from each path segment, with horizontal mirroring only where the design is symmetrical.
- Use the seated animation only when the nurse is back in chair one.
- Use the interaction/check animation when the nurse reaches a patient and performs ward actions; return to idle afterward.
- Preserve the current navigation graph, bed destinations, curtain handling, depth sorting, station layering, scoring, timers, and mini-game logic.
- Keep hired staff behaviour unchanged in this pass; their existing icons remain separate from the player’s customisable nurse.

## Technical approach
- Add a central sprite manifest describing atlas frames, timing, direction, expression, and cosmetic layers.
- Replace the current SVG-based `Nurse` renderer with a reusable pixel-sprite renderer driven by character, action, direction, and animation frame.
- Track facing direction and short-lived interaction state alongside the existing movement state without changing pathfinding.
- Extend the existing character data and shop inventory in a backward-compatible, data-driven way.
- Store generated artwork as project assets and render it with pixelated scaling and stable frame dimensions.

## Validation
- Verify every presentation, skin tone, hair colour, hairstyle, and scrub option in the character preview.
- Confirm the selected appearance survives save/load, randomise, shift completion, and reopening a save slot.
- Confirm idle, four-direction walking, seating, interaction, checking, running, and return animations display without frame jumps.
- Check that the nurse remains correctly layered around beds, curtains, station furniture, and all existing shadows.
- Test the complete ward flow at portrait mobile sizes and confirm gameplay timing and navigation are unchanged.
