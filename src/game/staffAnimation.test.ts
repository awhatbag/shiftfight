import { describe, expect, it } from "vitest";
import { advanceStaffWalk } from "./staffAnimation";

describe("distance-synced staff walking", () => {
  it("takes three seconds to complete ten frames at the relaxed base speed", () => {
    const speed = 1 / (1.5 * 3.2);
    const start = { x: 0, y: 0 };
    expect(advanceStaffWalk(0, start, { x: 0, y: speed * 0.3 })).toBeCloseTo(1);
    expect(advanceStaffWalk(0, start, { x: 0, y: speed * 2.7 })).toBeCloseTo(9);
    expect(advanceStaffWalk(0, start, { x: 0, y: speed * 3 })).toBeCloseTo(0);
  });

  it("does not advance while stationary", () => {
    expect(advanceStaffWalk(4.25, { x: 0.44, y: 0.08 }, { x: 0.44, y: 0.08 })).toBe(4.25);
  });

  it("matches the runtime distance metric in both directions", () => {
    expect(advanceStaffWalk(0, { x: 0, y: 0 }, { x: 0.078125, y: 0 })).toBeCloseTo(1);
    expect(advanceStaffWalk(0, { x: 0, y: 0 }, { x: 0, y: 0.0625 })).toBeCloseTo(1);
  });

  it("retains fractional steps across updates and slows with movement", () => {
    const first = advanceStaffWalk(0, { x: 0, y: 0 }, { x: 0, y: 0.02 });
    expect(first).toBeCloseTo(0.32);
    expect(advanceStaffWalk(first, { x: 0, y: 0.02 }, { x: 0, y: 0.0625 })).toBeCloseTo(1);
  });
});