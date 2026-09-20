# Replace the nurse with the supplied artwork

## Goal

Remove the generic drawn nurse and replace it with sprites that faithfully use the supplied `nurse choices` artwork: the same faces, proportions, hair, scrubs, outlines, colours, and pixel-art finish.

## Artwork conversion

- Use the three large reference characters as the exact visual standard for female, male, and non-binary nurses.
- Extract and clean the supplied turnaround, and action figures into transparent game-ready sprite assets rather than redrawing them as generic shapes.
- Remove the ability to select facial expressions.
- Preserve crisp pixel edges and consistent feet anchors so sprites do not wobble or resize between states.
- Prepare the states shown on the sheet: idle, walking down, walking sideways, running, interacting, using/checking, returning to station, sitting, and the available directional views.
- Use the six supplied facial expressions in the close-up character preview.
- Ensure the characters look like pixel art. Use pixel art skill.

## Customisation

- Keep the free skin-tone and hair-colour choices, applying them while preserving the original shading and linework.
- Use the hairstyles and special scrubs pictured on the supplied sheet for the locked cosmetic choices.
- Keep locked cosmetics reserved for future real-money purchases; no payment flow will be added now.
- Ensure female, male, and non-binary selections show their corresponding supplied design in both the preview and ward.

## In-game replacement

- Replace the current generic vector nurse everywhere it appears: character selection, station chair, ward walking, running, and patient interactions.
- Map the existing movement direction and action state to the matching supplied sprite frame.
- Keep the nurse at the current gameplay anchor and scale, adjusting only the visible sprite bounds where necessary to avoid clipping.
- Preserve all pathfinding, bed stops, curtain/station depth behaviour, scoring, timers, saves, mini-games, and staff behaviour.

## Compatibility

- Keep current character selections and old saves working with safe defaults.
- Do not change the ward artwork, furniture, shadows, walking routes, or gameplay systems.

## Validation

- Compare each of the three base nurses side-by-side with the supplied sheet before completion.
- Check every movement/action state for correct artwork, direction, scale, and feet alignment.
- Verify customisation persists through save/load and appears consistently in the character screen and ward.
- Test portrait mobile play around beds, curtains, and the nurses' station without changing navigation or layering.