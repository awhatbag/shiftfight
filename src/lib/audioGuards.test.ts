import { describe, expect, it, vi } from "vitest";
import { AudioPool, clampAudioVolume } from "./audioGuards";

describe("audio safeguards", () => {
  it("clamps volumes and rejects non-finite values", () => {
    expect(clampAudioVolume(-1)).toBe(0);
    expect(clampAudioVolume(2)).toBe(1);
    expect(clampAudioVolume(NaN, 0.4)).toBe(0.4);
    expect(clampAudioVolume(Infinity, 0.4)).toBe(0.4);
  });
  it("evicts oldest playback at capacity and releases exactly once", () => {
    const pool = new AudioPool(2);
    const first = vi.fn();
    const release = pool.add(first);
    pool.add(() => {});
    pool.add(() => {});
    expect(pool.size).toBe(2);
    expect(first).toHaveBeenCalledTimes(1);
    release();
    expect(first).toHaveBeenCalledTimes(1);
    pool.clear();
    expect(pool.size).toBe(0);
  });
  it("continues cleanup when browser audio cleanup throws", () => {
    const pool = new AudioPool(2);
    pool.add(() => { throw Error("unavailable"); });
    const cleanup = vi.fn();
    pool.add(cleanup);
    expect(() => pool.clear()).not.toThrow();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(pool.size).toBe(0);
  });
});
