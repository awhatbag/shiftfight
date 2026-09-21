import backClickAsset from "@/assets/back_click.wav.asset.json";
import forwardClickAsset from "@/assets/forward_click.wav.asset.json";
import equipAsset from "@/assets/equip.wav.asset.json";
import levelCompleteAsset from "@/assets/level_complete.wav.asset.json";
import bellsAsset from "@/assets/boxing_bell_x3.m4a.asset.json";
import whistleAsset from "@/assets/shift_end_steam_whistle.m4a.asset.json";

let ctx: AudioContext | null = null;
let soundOn = true;
let hapticsOn = true;

export function setSoundEnabled(on: boolean) {
  soundOn = on;
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
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
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
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Classic two-tone ding-dong nurse call bell. Noticeable, not obnoxious. */
export function playCallBell() {
  tone(988, 0, 0.5, 0.12);
  tone(784, 0.22, 0.75, 0.11);
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
  noise.start(t);
  noise.stop(t + dur + 0.05);
  lfo.start(t);
  lfo.stop(t + dur + 0.05);

  tone(120, 0.05, 0.5, 0.06, "sawtooth");
  buzz([40, 30, 90]);
}


/** Play a supplied audio file. Respects the same sound-effects mute flag. */
function sample(url: string, volume = 0.9): HTMLAudioElement | null {
  if (!soundOn) return null;
  if (typeof Audio === "undefined") return null;
  const el = new Audio(url);
  el.volume = volume;
  void el.play().catch(() => {});
  return el;
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
  if (!el || el.ended) return Promise.resolve();
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("ended", finish);
      el.removeEventListener("error", finish);
      window.clearTimeout(guard);
      resolve();
    };
    /* safety net: never leave the music waiting forever */
    const guard = window.setTimeout(finish, 8000);
    el.addEventListener("ended", finish);
    el.addEventListener("error", finish);
    /* if it can't play at all (codec/autoplay), don't stall the music */
    void el.play().catch(finish);
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
