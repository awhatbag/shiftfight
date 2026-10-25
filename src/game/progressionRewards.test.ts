import { describe, expect, it } from "vitest";
import { freshUnlockKeys } from "./progressionRewards";
import { BED_UPGRADES } from "./bedUpgrades";
import { GEAR_ITEMS } from "./gear";
import { STAFF } from "./config";

/** smallest xp that reaches a given rank level, found by scanning */
function xpForRank(level: number): number {
  // nurseRank thresholds grow; scan upward until the rank matches
  for (let xp = 0; xp <= 1_000_000; xp += 50) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  }
  return -1;
}

import { nurseRank } from "./config";

function firstXpAtRank(level: number): number {
  for (let xp = 0; xp <= 2_000_000; xp += 10) {
    if (nurseRank(xp).level >= level) return xp;
  }
  throw new Error(`rank ${level} unreachable`);
}

describe("freshUnlockKeys", () => {
  it("returns nothing when the rank does not change", () => {
    const xp = firstXpAtRank(2);
    expect(freshUnlockKeys(xp, xp + 5)).toEqual([]);
  });

  it("flags exactly the items whose rank requirement was crossed", () => {
    const before = firstXpAtRank(2) - 10; // still rank 1
    const after = firstXpAtRank(2); // just reached rank 2
    const keys = freshUnlockKeys(before, after);
    const expected = [
      ...GEAR_ITEMS.filter((g) => (g.rank ?? 1) === 2).map((g) => g.key),
      ...BED_UPGRADES.filter((b) => (b.rank ?? 1) === 2).map((b) => b.key),
      ...STAFF.filter((s) => (s.rank ?? 2) === 2).map((s) => s.key),
    ];
    expect(keys.sort()).toEqual(expected.sort());
    expect(keys).not.toContain("tier5");
  });

  it("includes tier5 only when crossing into rank 4", () => {
    const before = firstXpAtRank(4) - 10;
    const after = firstXpAtRank(4);
    expect(freshUnlockKeys(before, after)).toContain("tier5");
    const r2 = freshUnlockKeys(firstXpAtRank(3) - 10, firstXpAtRank(3));
    expect(r2).not.toContain("tier5");
  });
});
