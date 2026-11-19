import { describe, expect, it } from "vitest";
import { bossById, bossUnlocked, levelGateOpen, markDefeated, phaseFor, unlockAfterLevel } from "./bosses";

const neil = bossById("neil")!;

describe("Neil boss progression", () => {
  it("unlocks only after clearing Level 10", () => {
    expect(bossUnlocked(neil, unlockAfterLevel({}, 9))).toBe(false);
    expect(bossUnlocked(neil, unlockAfterLevel({}, 10))).toBe(true);
  });
  it("Level 11 opens only after Neil is defeated", () => {
    const unlocked = unlockAfterLevel({}, 10);
    expect(levelGateOpen(10, unlocked)).toBe(true);
    expect(levelGateOpen(11, unlocked)).toBe(false);
    expect(levelGateOpen(11, markDefeated(unlocked, "neil"))).toBe(true);
  });
  it("stays available for rematches once defeated", () => {
    expect(bossUnlocked(neil, markDefeated({}, "neil"))).toBe(true);
  });
});

describe("Neil phases", () => {
  it("uses 100–61 / 60–26 / 25–0", () => {
    expect(phaseFor(100)).toBe(1);
    expect(phaseFor(61)).toBe(1);
    expect(phaseFor(60)).toBe(2);
    expect(phaseFor(26)).toBe(2);
    expect(phaseFor(25)).toBe(3);
    expect(phaseFor(0)).toBe(3);
  });
});
