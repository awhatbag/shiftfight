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
import { clampAudioVolume } from "./audioGuards";
import titleTrack from "@/assets/shift-fight-title.mp3.asset.json";
import savePointTrack from "@/assets/save-point.mp3.asset.json";
import wardTrack from "@/assets/pixel-triage.mp3.asset.json";
import coinOpTrack from "@/assets/Coin_Op_Daydream.mp3.asset.json";
import picnicTrack from "@/assets/Pixel_Picnic.mp3.asset.json";
import crtTrack from "@/assets/CRT_Controller_2.mp3.asset.json";
import levelSelectTrack from "@/assets/Level_Select.mp3.asset.json";
import triage2Track from "@/assets/Pixel_Triage2.mp3.asset.json";
import clinic2Track from "@/assets/Pixel_Clinic2.mp3.asset.json";
import shopTrack from "@/assets/level-select-shop.mp3.asset.json";

export type MusicKey = "title" | "savePoint" | "ward" | "shop";

type TrackDef = { url: string; volume: number };

/** Ward shift playlist: one song per shift, looped; each new shift moves to the next song. */
export const WARD_PLAYLIST = [
  wardTrack.url,
  coinOpTrack.url,
  picnicTrack.url,
  crtTrack.url,
  levelSelectTrack.url,
  triage2Track.url,
  clinic2Track.url,
];
const WARD_IDX_KEY = "shift-fight-ward-song";

export const MUSIC_TRACKS: Record<MusicKey, TrackDef> = {
  /** replace src/assets/shift-fight-title.mp3.asset.json to swap this music */
  title: { url: titleTrack.url, volume: 0.55 },
  /** character customisation screen */
  savePoint: { url: savePointTrack.url, volume: 0.55 },
  /** ward gameplay — url is swapped per shift by nextWardSong() */
  ward: { url: wardTrack.url, volume: 0.4 },
  /** shop screen */
  shop: { url: shopTrack.url, volume: 0.55 },
};

/** Advance to the next ward song. Call once when a new shift starts. */
export function nextWardSong() {
  if (typeof window === "undefined") return;
  let idx = -1;
  try {
    const raw = window.localStorage.getItem(WARD_IDX_KEY);
    if (raw !== null) idx = Number(raw);
  } catch {
    /* ignore */
  }
  if (!Number.isInteger(idx) || idx < -1) idx = -1;
  const next = (idx + 1) % WARD_PLAYLIST.length;
  try {
    window.localStorage.setItem(WARD_IDX_KEY, String(next));
  } catch {
    /* ignore */
  }
  MUSIC_TRACKS.ward.url = WARD_PLAYLIST[next] ?? wardTrack.url;
}

const FADE_MS = 450;
const STEP_MS = 40;

let musicOn = true;
const listeners = new Set<(on: boolean) => void>();

type Playing = {
  el: HTMLAudioElement;
  fade: ReturnType<typeof setInterval> | null;
  target: number;
  url: string;
  active: boolean;
  revision: number;
};

const players = new Map<MusicKey, Playing>();
const autoplay = new Map<MusicKey, () => void>();

function disarmAutoplay(key: MusicKey) {
  autoplay.get(key)?.();
}

/** Silence recovery immediately; invalidate pending play promises as well. */
export function stopAllMusic() {
  for (const [key, p] of players) {
    disarmAutoplay(key);
    p.active = false;
    p.target = 0;
    p.revision += 1;
    if (p.fade) clearInterval(p.fade);
    p.fade = null;
    p.el.pause();
  }
}

function startPlayback(key: MusicKey, p: Playing) {
  const revision = ++p.revision;
  try {
    void p.el.play().then(() => {
      if (p.revision !== revision || !p.active || !musicOn) {
        if (!p.active || !musicOn) p.el.pause();
        return;
      }
      fadeTo(p, p.target);
      disarmAutoplay(key);
    }).catch(() => {
      if (p.revision === revision && p.active && musicOn) armAutoplay(key);
    });
  } catch { if (p.active && musicOn) armAutoplay(key); }
}

export function isMusicOn() {
  return musicOn;
}

export function subscribeMusic(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMusicEnabled(on: boolean) {
  musicOn = on;
  for (const [key, p] of players) {
    if (!on) {
      disarmAutoplay(key);
      p.revision += 1;
      if (p.fade) clearInterval(p.fade);
      p.fade = null;
      p.el.pause();
    } else if (p.active) startPlayback(key, p);
  }
  listeners.forEach((l) => l(on));
}

const VOL_KEY = "shift-fight-music-volume";
let musicVolume = (() => {
  if (typeof window === "undefined") return 1;
  try {
    const raw = window.localStorage.getItem(VOL_KEY);
    return raw === null ? 1 : clampAudioVolume(Number(raw));
  } catch { return 1; }
})();
const volListeners = new Set<(v: number) => void>();

export function getMusicVolume() {
  return musicVolume;
}

export function subscribeMusicVolume(fn: (v: number) => void) {
  volListeners.add(fn);
  return () => volListeners.delete(fn);
}

/** User music volume (0–1). Scales every track; mute still wins. */
export function setMusicVolume(v: number) {
  musicVolume = clampAudioVolume(v, musicVolume);
  try {
    window.localStorage.setItem(VOL_KEY, String(musicVolume));
  } catch {
    /* ignore */
  }
  for (const [key, p] of players) {
    if (!p.active) continue;
    p.target = clampAudioVolume(MUSIC_TRACKS[key].volume) * musicVolume;
    if (p.fade) clearInterval(p.fade);
    p.fade = null;
    if (musicOn) p.el.volume = p.target;
  }
  volListeners.forEach((l) => l(musicVolume));
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
    p.el.volume = clampAudioVolume(v, 0);
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
  disarmAutoplay(key);
  const retry = () => {
    const p = players.get(key);
    if (!p || !musicOn || !p.active) return disarm();
    startPlayback(key, p);
  };
  const disarm = () => {
    for (const g of GESTURES) window.removeEventListener(g, retry);
    autoplay.delete(key);
  };
  autoplay.set(key, disarm);
  for (const g of GESTURES) window.addEventListener(g, retry);
}

/** Start (or resume) a looping track with a quick fade in. Safe to call twice. */
export function playMusic(key: MusicKey) {
  if (typeof window === "undefined") return;
  const def = MUSIC_TRACKS[key];
  disarmAutoplay(key);
  let p = players.get(key);
  if (p && p.url !== def.url) {
    if (p.fade) clearInterval(p.fade);
    p.active = false;
    p.revision += 1;
    p.el.pause();
    p.el.removeAttribute("src");
    p.el.load();
    players.delete(key);
    p = undefined;
  }
  if (!p) {
    let el: HTMLAudioElement;
    try { el = new Audio(def.url); } catch { return; }
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    p = { el, fade: null, target: clampAudioVolume(def.volume) * musicVolume, url: def.url, active: true, revision: 0 };
    players.set(key, p);
  }
  p.target = clampAudioVolume(def.volume) * musicVolume;
  p.active = true;
  if (musicOn) startPlayback(key, p);
}

/** Pause instantly, keeping the play position (e.g. catastrophe earthquake). */
export function pauseMusic(key: MusicKey) {
  const p = players.get(key);
  if (!p) return;
  disarmAutoplay(key);
  p.active = false;
  p.revision += 1;
  if (p.fade) clearInterval(p.fade);
  p.fade = null;
  p.el.pause();
}

/** Resume from the paused position with a quick fade back in. */
export function resumeMusic(key: MusicKey) {
  const p = players.get(key);
  if (!p) return;
  p.active = true;
  if (musicOn) startPlayback(key, p);
}

/** Fade out quickly and pause. */
export function stopMusic(key: MusicKey) {
  const p = players.get(key);
  if (!p) return;
  disarmAutoplay(key);
  p.active = false;
  p.revision += 1;
  p.target = 0;
  fadeTo(p, 0, () => {
    p.el.pause();
    try { p.el.currentTime = 0; } catch { /* media not loaded */ }
  });
}
