import { afterEach, describe, expect, it, vi } from "vitest";
class FakeAudio {
  static all: FakeAudio[] = [];
  volume = 0; loop = false; preload = ""; paused = true; ended = false; currentTime = 0;
  listeners = new Map<string, Set<() => void>>();
  constructor(public src: string) { FakeAudio.all.push(this); }
  play = vi.fn(() => { this.paused = false; return Promise.resolve(); });
  pause = vi.fn(() => { this.paused = true; });
  load() {}
  removeAttribute() {}
  addEventListener(key: string, fn: () => void) { const set = this.listeners.get(key) ?? new Set(); set.add(fn); this.listeners.set(key, set); }
  removeEventListener(key: string, fn: () => void) { this.listeners.get(key)?.delete(fn); }
  dispatchEvent(event: Event) { for (const fn of [...(this.listeners.get(event.type) ?? [])]) fn(); return true; }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules(); FakeAudio.all = []; });
function setup() {
  vi.useFakeTimers();
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", { localStorage: { getItem: () => { throw Error("storage blocked"); }, setItem: () => {} }, addEventListener: vi.fn(), removeEventListener: vi.fn(), setTimeout, clearTimeout });
}
describe("audio playback recovery", () => {
  it("replaces repeated samples and releases all audio on mute", async () => {
    setup();
    const sfx = await import("./sfx");
    for (let i = 0; i < 30; i++) sfx.playForwardClick();
    expect(FakeAudio.all.filter(a => !a.paused)).toHaveLength(1);
    sfx.setSoundEnabled(false);
    expect(FakeAudio.all.filter(a => !a.paused)).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("resolves whistle waits immediately on interrupted playback", async () => {
    setup();
    const sfx = await import("./sfx");
    sfx.playWhistle();
    const done = vi.fn();
    const wait = sfx.whistleEnded().then(done);
    sfx.stopAllSounds();
    await wait;
    expect(done).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("survives blocked storage, rejects NaN volume and cancels pending music", async () => {
    setup();
    const music = await import("./music");
    expect(music.getMusicVolume()).toBe(1);
    music.setMusicVolume(NaN);
    expect(music.getMusicVolume()).toBe(1);
    music.playMusic("ward");
    music.stopAllMusic();
    await Promise.resolve();
    expect(FakeAudio.all[0]?.paused).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    music.setMusicEnabled(false);
    music.setMusicEnabled(true);
    expect(FakeAudio.all[0]?.play).toHaveBeenCalledTimes(1);
  });
});
