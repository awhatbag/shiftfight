# Add auto-save after every shift

## Goal
Make Shift Fight! automatically save progress when a shift ends, so players don't lose progress if they close the app after a completed shift. Keep the existing manual Save / Continue save flow untouched.

## What will change

1. Track an "active save slot"
   - Add an `activeSlot` index state in `src/routes/index.tsx`.
   - Set it when the player:
     - loads a save file from the slot picker,
     - manually saves to a slot,
     - continues from the legacy single-save migration (slot 0).
   - Persist `activeSlot` in a small localStorage key so it survives refreshes.

2. Auto-save at end of shift
   - In the existing `endShift` function, after points/xp/level/job-security state updates, call a new `autoSave()` helper.
   - `autoSave()` writes `currentSaveData()` to the active slot.
   - If no active slot exists yet (e.g. brand-new game that has never been saved or loaded), fall back to slot 0 with a default name like "Auto save".
   - Show a brief, non-blocking "Auto-saved" note using the existing `saveNote` toast area.

3. Leave manual save as-is
   - The in-menu Save button still opens the slot picker.
   - Saving manually updates the active slot so future auto-saves target the same file.
   - Loading still lets the player pick a slot and routes to the level ladder.

## What will NOT change
- Gameplay, scoring, XP, shop, staff, upgrades, DON, objectives, mini-games, visuals, or sound.
- The three named save-slot system.
- The requirement that the player must explicitly save the first time if they want a custom name; auto-save uses a default name until then.

## Verification
- Run `bunx tsgo --noEmit` after edits.
- Test on a mobile-sized viewport:
  1. Start a new game, complete Level 1, reach the Summary screen.
  2. Close/reopen the preview and choose Continue save.
  3. Confirm the save includes the points/XP/level from the completed shift.
  4. Confirm manual Save still works and updates the active slot.
