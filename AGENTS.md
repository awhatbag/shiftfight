<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

East-to-west catastrophe hazards sample their stepped sprite centre against the shared invisible mask derived from the supplied collision map; this keeps collisions artwork-accurate and reusable without bed geometry.

Patient action button order is shuffled once when each ActiveEvent is created, including catastrophe problems; keeping it on the event prevents reshuffling during renders or bed switches while preserving action-specific styling and outcomes.

Patient bed artwork is registered in src/game/patientBeds.ts and rendered within the existing Bed sprite at its existing WardScene slot and stacking layer; every sprite keeps the common bed width and wheel baseline (taller canvases only add headroom and are bottom-anchored) so new beds drop in without changing ward geometry or floor shadows.

Reward presentation derives rank changes and unlocks from the existing XP, shift-level, and shop registries; it never owns or recalculates progression state.
Summary rendering is isolated by a local error boundary after rewards are committed; its recovery uses the same fired-or-shop destination so a presentation failure cannot discard progress or bypass dismissal.

Automatic catastrophe timing is decided only by the pure scheduler in src/game/catastrophes.ts (gap, rotation, eligibility) and persisted in the save; each catastrophe definition owns its own gameplay and duration, and Dev Mode launches never advance the schedule, so new events only need registering. Level gates live on each definition: Avocado Avalanche is `level: 3` only and Goosepocalypse is `minLevel: 4`, so Level 3 always gets the Avocado Avalanche.

Goosepocalypse uses a bounded pure goose runtime with shared ward routes and door holds; completed physical melee interactions feed the existing patient factory, while sequential exit uses a separate clock to freeze all other gameplay and preserve unresolved calls. Supplied goose poses are component-separated into padded, baseline-aligned cells to avoid adjacent-frame bleed.
Goose obstruction controls are anchored inside the shared ward scene to the blocking goose and use the existing shoo handler; this keeps both goose taps and the callout aligned without duplicating movement logic.

DON visits end their gameplay reactions when departure starts, but retain the ward sprite until its shared navigation route reaches the top doors; this prevents timed visits from removing her mid-walk.

Hired staff spawn behind the top doors and walk to their station chair via the shared staff runtime (enterAt/attendUntil in StaffRuntime); character art (e.g. BarrySprite) only renders that runtime, so new staff sprites need no movement logic.
Staff dispatch shares a pure call-reservation selector across automatic, manual and interrupted journeys; same-tick resolved IDs are excluded so pending React removals cannot cause duplicate care.
Hired staff animation uses runtime path presence for walking and position deltas only for facing; shared frame selection excludes the terminal standing cell so stationary ticks cannot interrupt a journey with an action pose.
- Shop staff portraits are CSS crops of each staff member's supplied sprite sheet, registered in src/components/game/StaffPortrait.tsx; staff without artwork fall back to their emoji, so new artwork only needs a registry entry.

Ward camera tracking translates the complete scene in presentation only, measuring the existing answer panel and preserving all world coordinates, navigation and stacking; camera motion freezes with gameplay and respects reduced motion.

Nurses' station occlusion uses separate rear-desk and front-counter clips of the supplied artwork; walking characters (including staff without sprites) share floor-position depth so front-lane walkers remain visible without altering navigation or other ward layers.

Patient-card dismissal only clears WardScreen selection, leaving calls and journeys intact; the scene ignores bubbled interactive-control taps so closing the card cannot interfere with bed, pillow, staff or goose actions.

Ward and shop rendering failures unmount locally and return to the title without awarding a shift or resetting progression; audio recovery cancels active playback, fades and autoplay retries. Sound effects use bounded cleanup pools so failed or interrupted playback cannot accumulate nodes.

Shop refreshments reuse the gear registry and existing one-per-category equipment slot, remaining owned between shifts rather than adding a separate consumable inventory.

Title decorations use an isolated, bounded presentation runtime with expiry pruning and unmount cleanup, never catastrophe or ward gameplay state.

Boss battles: tunables live only in src/config/bossBattleConfig.ts, progression rules (unlock after a level, gate the next level, phases) are pure helpers in src/game/bosses.ts stored as a separate bossProgress save field, and BossBattleScreen renders crops of supplied art; this keeps ward saves untouched and new bosses registry-only. Dev launches never write progress.
