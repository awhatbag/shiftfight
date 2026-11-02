import { describe, expect, it } from "vitest";
import { PILLOW_EVENTS, gradePillows } from "./pillowProblems";
const t = (best: number, generated: number) => ({ generated, best, sortOf: 0, worst: 0, missed: 0 });
describe("Great Pillow Shortage", () => {
  it("has 40 different complaints", () => {
    expect(PILLOW_EVENTS).toHaveLength(40);
    expect(new Set(PILLOW_EVENTS.map((e) => e.callLine)).size).toBe(40);
  });
  it("grades by proportion of requests fulfilled", () => {
    expect(gradePillows(t(6, 10))).toBe("positive");
    expect(gradePillows(t(3, 10))).toBe("neutral");
    expect(gradePillows(t(1, 10))).toBe("negative");
  });
});
