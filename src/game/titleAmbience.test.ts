import { describe, expect, it } from "vitest";
import { addTitleProp, liveTitleProps, nextTitleSpawnDelay, type TitleProp } from "./titleAmbience";
const prop = (id: number): TitleProp => ({ id, kind: "avocado", born: 0, life: 6_000, y: 80, x: 50, reverse: false });
describe("title decorations", () => {
  it("schedules appearances between three and five seconds", () => {
    expect(nextTitleSpawnDelay(() => 0)).toBe(3_000);
    expect(nextTitleSpawnDelay(() => 1)).toBe(5_000);
  });
  it("never admits more than two decorations", () => {
    expect(addTitleProp([prop(1), prop(2)], prop(3), 1_000).map(p => p.id)).toEqual([1, 2]);
  });
  it("removes an expired decoration from state at its lifetime", () => {
    expect(liveTitleProps([prop(1)], 5_999)).toHaveLength(1);
    expect(liveTitleProps([prop(1)], 6_000)).toEqual([]);
  });
});