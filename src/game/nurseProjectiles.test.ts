import { describe, expect, it } from "vitest";
import { emptyNurseSupplies, refillNurseSupplies, takeNurseProjectile } from "./nurseProjectiles";

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
});