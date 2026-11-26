import { describe, expect, it } from "vitest";
import {
  bossById,
  bossMovementProfile,
  bossRaiseTotalMs,
  bossUnlocked,
  canBossGlide,
  getBossRaiseFrame,
  levelGateOpen,
  markDefeated,
  phaseFor,
  unlockAfterLevel,
} from "./bosses";

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

  it("locks left/right movement while raising arms or throwing pens", () => {
    expect(canBossGlide("raise", 500, 1200)).toBe(false);
    expect(canBossGlide("throw", 500, 1200)).toBe(false);
    expect(canBossGlide("raise", 1200, 1200)).toBe(true);
    expect(canBossGlide("throw", 1200, 1200)).toBe(true);
    expect(canBossGlide(null, 500, 1200)).toBe(true);
  });

  it("makes Neil faster and more erratic as his health declines", () => {
    const full = bossMovementProfile(100);
    const mid = bossMovementProfile(60);
    const low = bossMovementProfile(25);
    const critical = bossMovementProfile(5);

    expect(mid.speed).toBeGreaterThan(full.speed);
    expect(low.speed).toBeGreaterThan(mid.speed);
    expect(critical.speed).toBeGreaterThan(low.speed);

    expect(mid.pauseMaxMs).toBeLessThan(full.pauseMaxMs);
    expect(low.pauseMaxMs).toBeLessThan(mid.pauseMaxMs);
    expect(critical.pauseMinMs).toBeLessThan(low.pauseMinMs);

    expect(full.erraticChancePerSec).toBe(0);
    expect(mid.erraticChancePerSec).toBeGreaterThan(0);
    expect(low.erraticChancePerSec).toBeGreaterThan(mid.erraticChancePerSec);
  });

  it("holds Neil's arms raised and enraged for 2 seconds, then removes enraged and lowers arms", () => {
    const stepMs = 60;
    const holdMs = 2000;
    expect(bossRaiseTotalMs(stepMs, holdMs)).toBe(2600);

    // raising up (0..299ms)
    expect(getBossRaiseFrame(0, stepMs, holdMs)).toEqual({ col: 0, enraged: false, done: false });
    expect(getBossRaiseFrame(240, stepMs, holdMs)).toEqual({ col: 4, enraged: false, done: false });

    // held raised for 2000ms (300..2299ms) with red glaze + shake active
    expect(getBossRaiseFrame(300, stepMs, holdMs)).toEqual({ col: 5, enraged: true, done: false });
    expect(getBossRaiseFrame(1300, stepMs, holdMs)).toEqual({ col: 5, enraged: true, done: false });
    expect(getBossRaiseFrame(2299, stepMs, holdMs)).toEqual({ col: 5, enraged: true, done: false });

    // after 2000ms: red/shake removed and arms lower back down (2300..2599ms)
    expect(getBossRaiseFrame(2300, stepMs, holdMs)).toEqual({ col: 4, enraged: false, done: false });
    expect(getBossRaiseFrame(2540, stepMs, holdMs)).toEqual({ col: 0, enraged: false, done: false });
    expect(getBossRaiseFrame(2600, stepMs, holdMs)).toEqual({ col: 0, enraged: false, done: true });
  });
});
