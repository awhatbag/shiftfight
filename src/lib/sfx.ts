import backClickAsset from "@/assets/back_click.wav.asset.json";
import forwardClickAsset from "@/assets/forward_click.wav.asset.json";
import equipAsset from "@/assets/equip.wav.asset.json";
import levelCompleteAsset from "@/assets/level_complete.wav.asset.json";
import bellsAsset from "@/assets/boxing_bell_x3.m4a.asset.json";
import whistleAsset from "@/assets/shift_end_steam_whistle.m4a.asset.json";

import { AudioPool, clampAudioVolume } from "./audioGuards";

const voices = new AudioPool(24);
const samples = new AudioPool(8);
const sampleByUrl = new Map<string, () => void>();

export function stopAllSounds() {
  voices.clear();
  samples.clear();
}

let ctx: AudioContext | null = null;
let soundOn = true;
let hapticsOn = true;

export function setSoundEnabled(on: boolean) {
  soundOn = on;
  if (!on) stopAllSounds();
}
export function setHapticsEnabled(on: boolean) {
  hapticsOn = on;
}

export function buzz(pattern: number | number[]) {
  if (!hapticsOn) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx || ctx.state === "closed") {
      const Ctor = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

/** Unlock audio on the first user gesture (mobile browsers). */
export function primeAudio() {
  audio();
}

function tone(
  freq: number,
  at: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
) {
  if (!soundOn) return;
  const c = audio();
  if (!c) return;
  try {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, clampAudioVolume(gain)), t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  const release = voices.add(() => {
    osc.onended = null;
    try { osc.stop(); } catch { /* already stopped */ }
    osc.disconnect();
    g.disconnect();
  });
  osc.onended = release;
  try { osc.start(t); osc.stop(t + dur + 0.05); } catch { release(); }
  } catch { /* unsupported audio must not interrupt play */ }
}

/** Classic two-tone ding-dong nurse call bell. Noticeable, not obnoxious. */
export function playCallBell() {
  // bright chime with overtones so it cuts through the ward music
  tone(988, 0, 0.55, 0.32, "triangle");
  tone(1976, 0, 0.3, 0.08);
  tone(784, 0.22, 0.8, 0.3, "triangle");
  tone(1568, 0.22, 0.35, 0.07);
  buzz(20);
}

export function playGood() {
  tone(660, 0, 0.14, 0.07);
  tone(990, 0.09, 0.2, 0.06);
  buzz(15);
}

export function playBad() {
  tone(220, 0, 0.22, 0.08);
  tone(165, 0.1, 0.3, 0.07);
  buzz([25, 40, 25]);
}

export function playPop() {
  tone(520, 0, 0.09, 0.05);
}

/** Comedic splatter: a wet, gurgling noise burst. */
export function playVomit() {
  if (!soundOn) return;
  const c = audio();
  if (!c) return;
  try {
  const t = c.currentTime;
  const dur = 1.1;

  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const p = i / len;
    data[i] = (Math.random() * 2 - 1) * (1 - p * 0.6);
  }
  const noise = c.createBufferSource();
  noise.buffer = buf;

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.linearRampToValueAtTime(320, t + dur);
  lp.Q.setValueAtTime(6, t);

  // wobble for the gurgle
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.setValueAtTime(11, t);
  lfoGain.gain.setValueAtTime(220, t);
  lfo.connect(lfoGain).connect(lp.frequency);

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  noise.connect(lp).connect(g).connect(c.destination);
  const release = voices.add(() => {
    noise.onended = null;
    for (const source of [noise, lfo]) { try { source.stop(); } catch { /* stopped */ } }
    for (const node of [noise, lp, lfo, lfoGain, g]) node.disconnect();
  });
  noise.onended = release;
  try {
  noise.start(t);
  noise.stop(t + dur + 0.05);
  lfo.start(t);
  lfo.stop(t + dur + 0.05);
  } catch { release(); }

  tone(120, 0.05, 0.5, 0.06, "sawtooth");
  buzz([40, 30, 90]);
  } catch { /* unsupported audio must not interrupt play */ }
}


/** Play a supplied audio file. Respects the same sound-effects mute flag. */
function sample(url: string, volume = 0.9): HTMLAudioElement | null {
  if (!soundOn) return null;
  if (typeof Audio === "undefined") return null;
  try {
    sampleByUrl.get(url)?.();
    const el = new Audio(url);
    el.volume = clampAudioVolume(volume);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = samples.add(() => {
      if (timer !== undefined) clearTimeout(timer);
      el.removeEventListener("ended", release);
      el.removeEventListener("error", release);
      if (sampleByUrl.get(url) === release) sampleByUrl.delete(url);
      el.pause();
      el.dispatchEvent(new Event("sfxstop"));
      el.removeAttribute("src");
      el.load();
    });
    sampleByUrl.set(url, release);
    el.addEventListener("ended", release);
    el.addEventListener("error", release);
    timer = setTimeout(release, 15000);
    try { void el.play().catch(release); } catch { release(); }
    return el;
  } catch { return null; }
}

/** Three bells to start the round (supplied boxing-bell recording). */
export function playRoundBells() {
  sample(bellsAsset.url, 0.9);
  buzz([30, 80, 30, 80, 30]);
}

let whistleEl: HTMLAudioElement | null = null;

/** Shift-end steam whistle (supplied recording). */
export function playWhistle() {
  whistleEl = sample(whistleAsset.url, 0.85);
  buzz([60, 40, 160]);
}

/**
 * Resolves when the shift-end whistle has finished (or straight away if it
 * never started / failed to decode). Used to time the shop music so it starts
 * exactly when the whistle ends instead of on a guessed delay.
 */
export function whistleEnded(): Promise<void> {
  const el = whistleEl;
  if (!el || el.ended || el.paused) return Promise.resolve();
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("ended", finish);
      el.removeEventListener("error", finish);
      el.removeEventListener("sfxstop", finish);
      window.clearTimeout(guard);
      resolve();
    };
    /* safety net: never leave the music waiting forever */
    const guard = window.setTimeout(finish, 8000);
    el.addEventListener("ended", finish);
    el.addEventListener("error", finish);
    el.addEventListener("sfxstop", finish);
    /* if it can't play at all (codec/autoplay), don't stall the music */
    try { void el.play().catch(finish); } catch { finish(); }
  });
}

/** UI: back navigation. */
export function playBackClick() {
  sample(backClickAsset.url, 0.8);
  buzz(10);
}

/** UI: any forward / confirm button. */
export function playForwardClick() {
  sample(forwardClickAsset.url, 0.8);
  buzz(10);
}

/** Shop: selecting / equipping an item. */
export function playEquip() {
  sample(equipAsset.url, 0.9);
  buzz(15);
}

/** Shift successfully completed. */
export function playLevelComplete() {
  sample(levelCompleteAsset.url, 0.9);
  buzz([20, 60, 20]);
}

/* ---------- Goosepocalypse honks (supplied recordings) ---------- */
import honkAsset from "@/assets/honk-sound.mp3.asset.json";
import untitledHonkAsset from "@/assets/untitled-goose-honk.mp3.asset.json";
import babyHonkAsset from "@/assets/baby-goose-honk.mp3.asset.json";
import canadaHonkAsset from "@/assets/canada-goose-honk.mp3.asset.json";

const HONKS = [honkAsset.url, untitledHonkAsset.url, babyHonkAsset.url];
const ALL_HONKS = [...HONKS, canadaHonkAsset.url];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]!;
const honkTimers = new Set<ReturnType<typeof setTimeout>>();

/** Overlapping honk voice (unlike sample(), repeats of one file may overlap). */
function honkNow(url: string, volume = 0.8) {
  if (!soundOn || typeof Audio === "undefined") return;
  try {
    const el = new Audio(url);
    el.volume = clampAudioVolume(volume);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = samples.add(() => {
      if (timer !== undefined) clearTimeout(timer);
      el.removeEventListener("ended", release);
      el.removeEventListener("error", release);
      el.pause();
      el.removeAttribute("src");
      el.load();
    });
    el.addEventListener("ended", release);
    el.addEventListener("error", release);
    timer = setTimeout(release, 6000);
    try { void el.play().catch(release); } catch { release(); }
  } catch { /* ignore */ }
}

function honkSequence(seq: Array<[string, number]>) {
  for (const [url, at] of seq) {
    if (at <= 0) { honkNow(url); continue; }
    const t = setTimeout(() => { honkTimers.delete(t); honkNow(url); }, at);
    honkTimers.add(t);
  }
}

export function stopGooseHonks() {
  for (const t of honkTimers) clearTimeout(t);
  honkTimers.clear();
}

/** A roaming goose honks once or twice. */
export function playGooseHonk() {
  const url = pick(HONKS);
  honkSequence(Math.random() < 0.5 ? [[url, 0]] : [[url, 0], [url, 260]]);
}

/** Geese burst through the doors: quick flurry, pause, one more. */
export function playGooseArrival() {
  const n = 3 + Math.floor(Math.random() * 2);
  const seq: Array<[string, number]> = Array.from({ length: n }, (_, i) => [pick(HONKS), i * 160]);
  seq.push([pick(HONKS), n * 160 + 550]);
  honkSequence(seq);
}

/** Patient attacked: three honks from any recording. */
export function playGooseAttack() {
  honkSequence([0, 180, 360].map((at) => [pick(ALL_HONKS), at]));
}

/** Shooing a goose: one Canada goose honk only. */
export function playGooseShoo() {
  honkNow(canadaHonkAsset.url, 0.85);
}

/** Geese leaving: every recording, doubled/tripled honks, Canada goose at most once. */
export function playGooseExit() {
  const seq: Array<[string, number]> = [];
  let at = 0;
  const order = [...HONKS].sort(() => Math.random() - 0.5);
  for (const url of order) {
    const reps = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < reps; i++) { seq.push([url, at]); at += 170; }
    at += 220;
  }
  if (Math.random() < 0.75) seq.splice(1 + Math.floor(Math.random() * (seq.length - 1)), 0, [canadaHonkAsset.url, Math.floor(Math.random() * at)]);
  honkSequence(seq);
}

/* ---------- Great Pillow Shortage ---------- */
import pillowPopAsset from "@/assets/pillow-pop.mp3.asset.json";
/** a pillow pops into existence */
export function playPillowPop() {
  honkNow(pillowPopAsset.url, 0.7);
}
