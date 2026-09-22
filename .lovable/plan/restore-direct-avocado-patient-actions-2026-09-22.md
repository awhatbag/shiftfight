# Restore Direct Avocado Patient Actions

## Changes
- Remove the Avocado Avalanche-only assessment state and special ASSESS handling.
- Show each avocado complaint and problem together as soon as the nurse reaches the patient.
- Present the existing non-ASSESS action choices immediately, preserving their current scoring and outcomes.
- Keep all non-avocado patient interactions and all other ward systems unchanged.

## Verification
- Trigger the Avocado Avalanche from Dev Mode.
- Reach an affected patient and confirm the complaint, problem, and action choices appear together without an ASSESS step.
- Choose an action and confirm the existing resolution flow still works.
