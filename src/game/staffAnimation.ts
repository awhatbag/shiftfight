import type { Point } from "./wardNav";

export const STAFF_WALK_FRAMES = 10;
// Three seconds per cycle at the existing relaxed, unupgraded ward speed.
// Use the same 0.8 horizontal weighting as the staff movement runtime.
export const STAFF_DISTANCE_PER_FRAME = 3 / (1.5 * 3.2 * STAFF_WALK_FRAMES);

export function advanceStaffWalk(phase: number, from: Point, to: Point): number {
  const distance = Math.hypot((to.x - from.x) * 0.8, to.y - from.y);
  return (phase + distance / STAFF_DISTANCE_PER_FRAME) % STAFF_WALK_FRAMES;
}