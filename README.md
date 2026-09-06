# Shift Fight! 

Build the first playable prototype of a mobile-first fast-paced hospital shift arcade game. Working title: SHIFT HAPPENS (temporary; do not hard-code the title deeply because we may rename it). This is entertainment, NOT a nursing education product. Target casual players with one-thumb/tap interactions and very short satisfying gameplay loops, while using believable hospital details as flavour. MVP should focus on the first 5–10 minutes of gameplay, not a huge content system.

Core loop: start a shift in a small surgical ward; several patient/event cards appear; the player taps the patient/event they should attend to first; correct prioritisation earns points/money and keeps the ward stable; wrong choices cost time/health/reputation. Events escalate over time. After a handful of scenarios, trigger a short tactile mini-game, then return to ward chaos.

Create a polished, fun playable prototype with:
- Mobile portrait layout, designed primarily for one thumb.
- A simple illustrated/cartoon hospital ward rather than realistic 3D.
- A nurse/player character that can be moved by tap/drag between a few beds/station, but keep movement lightweight and intuitive.
- 4 initial beds/patients, a nurses station, and visible timer/shift progress.
- Example fictional scenarios: low oxygen saturation, post-op bleeding, IV pump alarm, nausea, call bell for a blanket, confused patient, pain complaint. Keep clinical details simplified and clearly fictionalised; don't present the game as clinical training.
- Main prioritisation interaction: tap a patient/event, then choose a simple action such as ASSESS, INTERVENE, or ESCALATE. Make consequences immediate and fun.
- A medication matching mini-game after several successful events: match a fictional medication list to pill cups under a countdown using drag/tap. Use fictional drug names or generic placeholders so this prototype is not medication-training advice.
- A cannula accuracy mini-game as a second prototype mini-game: simplified fictional arm/target and a timing/accuracy interaction, clearly arcade-like rather than clinical instruction.
- Rewards: shift points, cash, XP, combo/streak meter.
- Simple upgrade screen after a shift with 3 upgrade types: Nurse Speed, Response Time, and Equipment. Upgrades should visibly improve gameplay.
- Simple ward expansion preview: after earning enough cash, unlock 2 additional beds. It does not need a full persistent economy yet, but make the unlock feel tangible.
- Simple staff hiring preview with 2 fictional staff cards and bonuses, even if persistence is minimal.
- Include a funny end-of-shift summary with stats such as patients helped, events handled, mistakes, call bells answered, and a humorous rating.
- Add punchy feedback, animations, progress bars and satisfying success/failure states. Avoid excessive text.
- Make it possible to restart and play again immediately.

Important design direction: this should feel like a fast arcade/time-management game, not a nursing simulator. The player should understand what to do within seconds. Prioritisation and mini-games should be the fun, not educational testing. Build the MVP so we can iterate rapidly on mechanics, UI, difficulty, art direction and naming later. Do not add authentication, database, payments, multiplayer or complex backend yet; keep the prototype self-contained and playable immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shiftfight.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1ccd1dcd-2a6e-4da1-8c4c-9bf2978b655b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
