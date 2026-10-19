# Customise Your Nurse from the shop

## What changes
- Add a **"🎨 Customise your nurse"** button in the shop, just under the nurse panel at the top so it's easy to find.
- Tapping it opens the existing "Who's working today?" customisation screen with the current nurse already loaded (name, look, colours).
- When opened from the shop, the bottom button reads **"Save & back to shop ◀"** instead of "Clock in ▶". It saves the changes and returns to the shop — it does not start a shift.
- The top bar Back button on that screen also returns to the shop (changes made so far are kept, same as now).
- The shop's nurse panel updates straight away with the new look.
- Locked cosmetics stay locked, as they are today.
- Nothing else in the shop or the normal new-game flow changes.

## Technical details
- `src/routes/index.tsx`: add a `characterReturn` state ("play" | "shop"). Shop's new `onCustomise` sets it to "shop" and `setPhase("character")`. `CharacterScreen.onConfirm` saves via `writeCharacter`, then either `setPhase("shop")` or `play()`. `handleBack` for "character" returns to shop when `characterReturn === "shop"`. Reset to "play" on other entries. Music already switches to the customisation track by phase; returning restores the shop track.
- `CharacterScreen.tsx`: optional `confirmLabel` prop (default "Clock in ▶").
- `UpgradeScreen.tsx`: new `onCustomise` prop and button beneath the nurse panel, existing chunky secondary styling.
