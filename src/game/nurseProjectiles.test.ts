import { describe, expect, it } from "vitest";
import { BOSS_BATTLE_CONFIG, NEIL_ARENA_LAYOUT } from "../config/bossBattleConfig";
import {
  createAimedProjectile,
  emptyNurseSupplies,
  hitsBossHitbox,
  isInRestockZone,
  isLowAmmo,
  isProjectileInBounds,
  refillNurseSupplies,
  stepProjectile,
  stepRestockState,
  takeNurseProjectile,
} from "./nurseProjectiles";

describe("Neil nurse supplies", () => {
  it("starts empty and cannot throw before refilling", () => {
    expect(emptyNurseSupplies().ammo).toBe(0);
    expect(takeNurseProjectile(emptyNurseSupplies())).toBeNull();
  });
  it("refills all twenty yellow squares", () => {
    expect(refillNurseSupplies().ammo).toBe(20);
  });
  it("throws the pictured items in grid order and empties after twenty throws", () => {
    let supplies = refillNurseSupplies();
    const items: number[] = [];
    for (let i = 0; i < 20; i++) {
      const shot = takeNurseProjectile(supplies);
      if (!shot) throw new Error("Missing supplied projectile");
      items.push(shot.item);
      supplies = { ammo: shot.ammo };
    }
    expect(items).toEqual([0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4]);
    expect(supplies.ammo).toBe(0);
    expect(takeNurseProjectile(supplies)).toBeNull();
  });

  it("flags low ammo at 5 remaining down to 1, not at 6 or 0", () => {
    expect(isLowAmmo(6)).toBe(false);
    expect(isLowAmmo(5)).toBe(true);
    expect(isLowAmmo(1)).toBe(true);
    expect(isLowAmmo(0)).toBe(false);
  });
});

describe("Nurse projectiles & Neil hitbox", () => {
  it("travels in a straight line toward Neil's position at fire time and leaves bounds if it misses", () => {
    const aspect = NEIL_ARENA_LAYOUT.aspect;
    const speed = BOSS_BATTLE_CONFIG.nurseProjectileSpeed;
    const shot = createAimedProjectile(1, 0, 0.5, 0.73, 0.7, 0.32, speed, aspect);
    const dx = 0.7 - 0.5;
    const dyW = (0.32 - 0.73) / aspect;
    const travelSec = Math.hypot(dx, dyW) / speed;
    const atTarget = stepProjectile(shot, travelSec);
    expect(atTarget.x).toBeCloseTo(0.7, 4);
    expect(atTarget.y).toBeCloseTo(0.32, 4);
    expect(isProjectileInBounds(atTarget)).toBe(true);
    // continues past aim point and leaves playable area
    const pastBounds = stepProjectile(atTarget, 3);
    expect(isProjectileInBounds(pastBounds)).toBe(false);
  });

  it("intersects Neil only within his configured collision hitbox", () => {
    const laneY = NEIL_ARENA_LAYOUT.bossLaneY;
    const centerY = laneY + BOSS_BATTLE_CONFIG.bossHitbox.offsetY;
    expect(hitsBossHitbox({ x: 0.5, y: centerY }, 0.5, laneY)).toBe(true);
    expect(hitsBossHitbox({ x: 0.85, y: centerY }, 0.5, laneY)).toBe(false);
    expect(hitsBossHitbox({ x: 0.5, y: 0.8 }, 0.5, laneY)).toBe(false);
  });
});

describe("Trolley restocking zone", () => {
  it("detects entry, takes 1000 ms to complete, and interrupts without refilling if the nurse leaves", () => {
    expect(isInRestockZone(NEIL_ARENA_LAYOUT.cart.restockX, NEIL_ARENA_LAYOUT.nurseLaneY)).toBe(true);
    expect(isInRestockZone(0.5, NEIL_ARENA_LAYOUT.nurseLaneY)).toBe(false);

    let state = { elapsedMs: 0, completedInZone: false };
    // Enter at 5 ammo and stay 600ms -> still active, not yet refilled
    const mid = stepRestockState(state, true, 5, 20, 600, BOSS_BATTLE_CONFIG.restockMs);
    expect(mid.active).toBe(true);
    expect(mid.completedNow).toBe(false);
    expect(mid.progress).toBeCloseTo(0.6, 4);

    // Leave zone -> interrupts and resets progress
    const left = stepRestockState(mid, false, 5, 20, 100, BOSS_BATTLE_CONFIG.restockMs);
    expect(left.active).toBe(false);
    expect(left.completedNow).toBe(false);
    expect(left.elapsedMs).toBe(0);

    // Re-enter and stay full 1000ms -> completes immediately
    const r1 = stepRestockState(left, true, 5, 20, 500, BOSS_BATTLE_CONFIG.restockMs);
    expect(r1.completedNow).toBe(false);
    const r2 = stepRestockState(r1, true, 5, 20, 500, BOSS_BATTLE_CONFIG.restockMs);
    expect(r2.completedNow).toBe(true);
    expect(r2.active).toBe(false);

    // Staying in zone after completion does not re-trigger restocking until leaving
    const after = stepRestockState(r2, true, 19, 20, 500, BOSS_BATTLE_CONFIG.restockMs);
    expect(after.active).toBe(false);
    expect(after.completedNow).toBe(false);
  });
});