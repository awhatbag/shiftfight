import { describe, expect, it } from "vitest";
import {
  AVOCADO_AVALANCHE,
  advanceSchedule,
  newSchedule,
  normalizeSchedule,
  pickCatastrophe,
  type SchedulableCatastrophe,
} from "./catastrophes";

/** deterministic RNG */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// test-only registry: never added to the real game
const REG: SchedulableCatastrophe[] = [
  { id: "a" },
  { id: "b" },
  { id: "c", level: 5 },
];

/** play shifts on a fixed level; every scheduled catastrophe occurs */
function simulate(shifts: number, levelOf: (i: number) => number, rng = seeded(7), reg = REG) {
  let sched = newSchedule();
  const log: { shift: number; id: string | null }[] = [];
  for (let i = 0; i < shifts; i++) {
    const id = pickCatastrophe(sched, levelOf(i), rng, reg);
    log.push({ shift: i, id });
    sched = advanceSchedule(sched, id, rng, reg);
  }
  return log;
}

describe("catastrophe scheduler", () => {
  it("leaves a gap of 2–6 ordinary shifts after each catastrophe", () => {
    const log = simulate(400, () => 5, seeded(3), [{ id: "a" }]);
    const hits = log.filter((l) => l.id).map((l) => l.shift);
    expect(hits.length).toBeGreaterThan(40);
    const gaps = hits.slice(1).map((h, i) => h - hits[i]! - 1);
    expect(Math.min(...gaps)).toBe(2);
    expect(Math.max(...gaps)).toBe(6);
  });

  it("never runs a catastrophe on level 1 or 2", () => {
    const log = simulate(50, (i) => (i % 2) + 1);
    expect(log.every((l) => l.id === null)).toBe(true);
  });

  it("does not repeat before the rotation completes, then repeats indefinitely", () => {
    const log = simulate(600, () => 5);
    const ids = log.flatMap((l) => (l.id ? [l.id] : []));
    expect(ids.length).toBeGreaterThan(80);
    for (let i = 0; i + 3 <= ids.length; i += 3) {
      expect(new Set(ids.slice(i, i + 3)).size).toBe(3);
    }
  });

  it("respects level restrictions and does not mark ineligible events done", () => {
    // level 4: "c" (level 5 only) is ineligible; a and b run then the scheduler waits
    const log = simulate(60, () => 4);
    const ids = log.flatMap((l) => (l.id ? [l.id] : []));
    expect(ids.sort()).toEqual(["a", "b"]);
  });

  it("skips unavailable catastrophes", () => {
    const log = simulate(100, () => 5, seeded(1), [{ id: "a" }, { id: "x", available: false }]);
    expect(log.some((l) => l.id === "x")).toBe(false);
    expect(log.filter((l) => l.id === "a").length).toBeGreaterThan(5);
  });

  it("a scheduled catastrophe that did not occur keeps its place", () => {
    const s = newSchedule();
    expect(pickCatastrophe(s, 5, seeded(1), REG)).not.toBeNull();
    // shift ended before it started: the game does not advance the schedule
    expect(s).toEqual({ shiftsUntilNext: 0, completed: [] });
  });

  it("new games start fresh and saves restore the schedule", () => {
    expect(newSchedule()).toEqual({ shiftsUntilNext: 0, completed: [] });
    const saved = JSON.parse(JSON.stringify({ shiftsUntilNext: 4, completed: ["a"] }));
    expect(normalizeSchedule(saved)).toEqual({ shiftsUntilNext: 4, completed: ["a"] });
    expect(normalizeSchedule(undefined)).toEqual(newSchedule());
  });

  it("Avocado Avalanche is still Level 3 only and first eligible on a new game", () => {
    expect(pickCatastrophe(newSchedule(), 3)).toBe(AVOCADO_AVALANCHE.id);
    expect(pickCatastrophe(newSchedule(), 4)).toBeNull();
    expect(pickCatastrophe(newSchedule(), 2)).toBeNull();
  });
});
