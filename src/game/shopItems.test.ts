import { describe, expect, it } from "vitest";
import { gearByKey, gearEffects, toggleEquipped } from "./gear";

describe("new shop equipment", () => {
  it("compression socks use the footwear slot and reduce travel and damage", () => {
    expect(gearByKey("compression_socks")?.category).toBe("shoes");
    expect(gearEffects(["compression_socks"]).travelMult).toBe(0.94);
    expect(gearEffects(["compression_socks"]).damageMult).toBe(0.92);
  });
  it("Diet Cola increases mini-game rewards", () => {
    expect(gearEffects(["diet_cola"]).miniMult).toBe(1.1);
  });
  it("coffee reduces travel time and boosts XP", () => {
    expect(gearEffects(["coffee"]).travelMult).toBe(0.92);
    expect(gearEffects(["coffee"]).xpMult).toBe(1.05);
  });
  it("chocolates reduce routine bell frequency", () => {
    expect(gearEffects(["chocolates"]).sillyMult).toBe(0.9);
  });
  it("refreshments reuse the one-equipped-item slot without consuming ownership", () => {
    const owned = ["diet_cola", "coffee", "chocolates", "compression_socks"];
    expect(toggleEquipped(owned, ["diet_cola", "compression_socks"], "coffee"))
      .toEqual(["compression_socks", "coffee"]);
    expect(toggleEquipped([], [], "coffee")).toEqual([]);
  });
});