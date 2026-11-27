import { describe, expect, it } from "vitest";
import { activateSpecial, cooldownRemaining } from "./specialCooldowns";

describe("special button cooldowns", () => {
  it("blocks repeat activation for five seconds and unlocks at the deadline", () => {
    const until = activateSpecial(0, 100);
    expect(until).toBe(5100);
    if (until === null) throw new Error("First activation must succeed");
    expect(activateSpecial(until, 5099)).toBeNull();
    expect(cooldownRemaining(until, 1100)).toBe(4000);
    expect(cooldownRemaining(until, 5100)).toBe(0);
    expect(activateSpecial(until, 5100)).toBe(10100);
  });

  it("does not lock the other blue buttons", () => {
    const deadlines = { avocado: activateSpecial(0, 100), goose: 0, pillow: 0 };
    expect(activateSpecial(deadlines.goose, 200)).toBe(5200);
    expect(activateSpecial(deadlines.pillow, 300)).toBe(5300);
    expect(deadlines.avocado).toBe(5100);
  });
});