# Add Mandatory Training mini-game

## Scope
Add one new registry-driven mini-game, **Mandatory Training**, while preserving the existing shift, reward, failure, abandon, progression, and timer systems.

## Implementation
- Create a mobile-first speed-tapping mini-game using the existing `level`, `paused`, and `onDone(score, perfect)` contract.
- Present the challenge inside a clearly illustrated yellowed 1990s PC setup: bulky CRT, tower, keyboard, and mouse, with a crisp modern corporate training deck inside the screen.
- Build a shuffled catalogue of short fictional training slides. Most use one large NEXT/CONTINUE acknowledgement; question slides always use exactly two choices with one immediately obvious answer.
- Scale the number of slides, question frequency, button sizing, and visual distractions by level without making answers difficult.
- Track elapsed time, progress, mistakes, and remaining game time. Pause its own countdown whenever the existing mini-game pause state is active.
- Reuse existing sound effects for clicks, mistakes, and completion; provide immediate pressed/slide-transition feedback and subtle CRT flicker.
- Calculate completion score primarily from speed, with small penalties for wrong taps; report timeout through the existing failure callback and clean completion through the existing reward flow.
- Register the game in the central mini-game list so normal random selection, no-repeat behavior, and Dev Mode discovery work automatically.

## Verification
- Run the focused checks for the new component and registry integration.
- Play the game in the mobile preview, verifying touch targets, timer pausing, two-option questions, completion/failure callbacks, and that existing abandon controls remain visible without covering the PC.
- Confirm all content pages retain their existing metadata.

## Assumptions
- The existing pre-game offer card supplies the requested START/SKIP introduction; its registry title and description will carry the Mandatory Training introduction copy.
- The shared bottom ABANDON controls remain owned by the ward rather than duplicated inside this mini-game.
