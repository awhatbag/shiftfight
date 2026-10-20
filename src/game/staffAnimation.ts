/** The final cell is a standing pose, not part of the supplied walk cycle. */
export const STAFF_WALK_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export const STAFF_WALK_CYCLE_MS = 3000;

/** Walk frames for a direction row; per-staff overrides drop frames the artist marked unusable. */
export function walkFramesFor(direction: number, walkSeq?: readonly (readonly number[])[]): readonly number[] {
  return walkSeq?.[direction] ?? STAFF_WALK_FRAMES;
}

export function staffAnimationFrame({ walking, attending, direction, frame, attendSeq, idle, walkSeq }: {
  walking: boolean; attending: boolean; direction: number; frame: number;
  attendSeq: readonly number[]; idle: readonly [number, number]; walkSeq?: readonly (readonly number[])[];
}) {
  if (walking) { const seq = walkFramesFor(direction, walkSeq); return { row: direction, col: seq[frame % seq.length] ?? 0 }; }
  if (attending) return { row: 4, col: attendSeq[frame % attendSeq.length] ?? idle[1] };
  return { row: idle[0], col: idle[1] };
}
