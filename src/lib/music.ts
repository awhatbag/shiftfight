/**
 * Global background-music system.
 *
 * - One HTMLAudioElement per track, never stacked.
 * - Short fades in/out.
 * - A single global mute flag that every music track respects (sound effects
 *   in src/lib/sfx.ts are separate and unaffected).
 *
 * Adding a new track: add an entry to MUSIC_TRACKS with its asset url and
 * volume. Everything else (mute, fades, no-overlap) works automatically.
 */
import titleTrack from "@/assets/shift-fight-title.mp3.asset.json";

export type MusicKey = "title";

type TrackDef = { url: string; volume: number };

export const MUSIC_TRACKS: Record<MusicKey, TrackDef> = {
  /** replace src/assets/shift-fight-title.mp3.asset.json to swap this music */
  title: { url: titleTrack.url, volume: 0.55 },
};

const FADE_MS = 450;
const STEP_MS = 40;

let musicOn = true;
const listeners = new Set<(on: boolean) => void>();

type Playing = {
  el: HTMLAudioElement;
  fade: ReturnType<typeof setInterval> | null;
  target: number;
};

const players = new Map<MusicKey, Playing>();

export function isMusicOn() {
  return musicOn;
}

export function subscribeMusic(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMusicEnabled(on: boolean) {
  musicOn = on;
  for (const [, p] of players) {
    if (!on) {
      fadeTo(p, 0, () => p.el.pause());
    } else if (p.target > 0) {
      void p.el.play().catch(() => {});
      fadeTo(p, p.target);
    }
  }
  listeners.forEach((l) => l(on));
}

export function toggleMusic() {
  setMusicEnabled(!musicOn);
}

function fadeTo(p: Playing, to: number, done?: () => void) {
  if (p.fade) clearInterval(p.fade);
  const from = p.el.volume;
  const steps = Math.max(1, Math.round(FADE_MS / STEP_MS));
  let i = 0;
  p.fade = setInterval(() => {
    i += 1;
    const v = from + (to - from) * (i / steps);
    p.el.volume = Math.max(0, Math.min(1, v));
    if (i >= steps) {
      if (p.fade) clearInterval(p.fade);
      p.fade = null;
      done?.();
    }
  }, STEP_MS);
}

const GESTURES = ["pointerdown", "touchstart", "keydown", "click"] as const;

/**
 * Browsers block autoplay until the user interacts. Listen for the first few
 * gesture types and retry playback until it actually succeeds.
 */
function armAutoplay(key: MusicKey) {
  if (typeof window === "undefined") return;
  const retry = () => {
    const p = players.get(key);
    if (!p || !musicOn || p.target <= 0) return disarm();
    void p.el
      .play()
      .then(() => {
        fadeTo(p, p.target);
        disarm();
      })
      .catch(() => {});
  };
  const disarm = () => {
    for (const g of GESTURES) window.removeEventListener(g, retry);
  };
  for (const g of GESTURES) window.addEventListener(g, retry);
}

/** Start (or resume) a looping track with a quick fade in. Safe to call twice. */
export function playMusic(key: MusicKey) {
  if (typeof window === "undefined") return;
  const def = MUSIC_TRACKS[key];
  let p = players.get(key);
  if (!p) {
    const el = new Audio(def.url);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    p = { el, fade: null, target: def.volume };
    players.set(key, p);
  }
  p.target = def.volume;
  if (!musicOn) return;
  const player = p;
  void player.el
    .play()
    .then(() => fadeTo(player, def.volume))
    .catch(() => armAutoplay(key));
}

/** Fade out quickly and pause. */
export function stopMusic(key: MusicKey) {
  const p = players.get(key);
  if (!p) return;
  p.target = 0;
  fadeTo(p, 0, () => {
    p.el.pause();
    p.el.currentTime = 0;
  });
}
