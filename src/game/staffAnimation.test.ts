import { describe, expect, it } from "vitest";
import { STAFF_WALK_CYCLE_MS, STAFF_WALK_FRAMES, staffAnimationFrame } from "./staffAnimation";

const base = { attending: false, direction: 2, frame: 0, attendSeq: [1, 2], idle: [4, 9] as const };

describe("hired staff animation", () => {
  it("stays in the walking direction for the whole route, even during a stationary tick", () => {
    for (let frame = 0; frame < 30; frame++) {
      expect(staffAnimationFrame({ ...base, walking: true, frame }).row).toBe(2);
    }
  });
  it("cycles the stride frames without the final standing pose", () => {
    expect(Array.from({ length: 10 }, (_, frame) => staffAnimationFrame({ ...base, walking: true, frame }).col))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 0]);
  });
  it("keeps a full walking cycle 30% slower than three seconds", () => {
    expect(STAFF_WALK_CYCLE_MS).toBe(3900);
    expect(STAFF_WALK_CYCLE_MS / STAFF_WALK_FRAMES.length * 9).toBe(3900);
  });
  it("uses only the allowed walk frames for a direction when supplied", () => {
    const walkSeq = [[0, 1, 2, 4, 9], [0, 1, 3, 5, 6, 7], [0, 3, 4, 7], [0, 3, 4, 7, 8]];
    expect(Array.from({ length: 5 }, (_, frame) => staffAnimationFrame({ ...base, walking: true, frame, walkSeq }).col))
      .toEqual([0, 3, 4, 7, 0]);
  });
  it("uses action poses only after arrival", () => {
    expect(staffAnimationFrame({ ...base, walking: false, attending: true, frame: 1 })).toEqual({ row: 4, col: 2 });
    expect(staffAnimationFrame({ ...base, walking: false })).toEqual({ row: 4, col: 9 });
  });
});