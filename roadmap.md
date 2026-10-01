# Roadmap

- [x] Create reusable animated pixel nurse renderer and sprite state model (sprite sheets cropped from the supplied nurse artwork).
- [x] Expand character cosmetics with future real-money locked hairstyles and scrubs.
- [x] Replace character preview and controls with the complete reference-board selection.
- [x] Connect selected appearance, facing, seating, and interactions to the ward.
- [x] Preserve save compatibility and existing gameplay/pathfinding/layering.
- [x] Verify character selection and ward animations at mobile size (Playwright, 420x900).
- [x] Apply saved skin and hair colours to the supplied nurse artwork in preview and ward.
- [x] Verify immediate preview updates, ward consistency, and saved persistence.
- [x] Add the Level 3 Avocado Avalanche catastrophe using the supplied artwork.
- [x] Add a Dev Mode trigger for the Avocado Avalanche.
- [x] Restore direct avocado patient interactions with complaint, problem, and actions shown together.
- [x] Avocado Avalanche: normal patient flow, 0.5s follow-up problems, tallied outcome, DON conclusion art, job-security impact
- [x] Avocado Avalanche intro: player-dismissed continue button with rotating avocado names
- [x] Refine the Cannula mini-game into detailed 32-bit pixel art (higher-density grid, contoured arm/hand, organic veins, detailed catheter)
- [x] Move the cannula to the right side of the screen, needle pointing inward

- [x] Refactor WardScreen into focused modules without changing gameplay.
- [x] Clock in with an existing save now prompts Continue saved shift (opens save slots) or Start a new shift; Continue save button removed from the title screen.
- [x] Use the supplied east-west collision map for randomly selected avocado collisions and stepped rolling animation.
- [x] Patient names now change every shift with anti-repeat rotation (no patient repeats in consecutive shifts).
- [x] Place the first supplied patient bed at an unlocked bed each shift, matching existing bed dimensions and preserving bed layers, positions, and shadows.
- [ ] Add remaining patient bed variants when supplied, so graphics can rotate between different patients across shifts.

