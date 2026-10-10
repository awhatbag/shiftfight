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

Automatic catastrophe timing is decided only by the pure scheduler in src/game/catastrophes.ts (gap, rotation, eligibility) and persisted in the save; each catastrophe definition owns its own gameplay and duration, and Dev Mode launches never advance the schedule, so new events only need registering.
