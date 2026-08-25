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

/** Boxing-style ring bell (one clang). */
function clang(at: number) {
  tone(1320, at, 0.55, 0.1, "triangle");
  tone(1980, at, 0.35, 0.05, "triangle");
  tone(880, at, 0.7, 0.06, "triangle");
}

/** Three bells to start the round. */
export function playRoundBells() {
  clang(0);
  clang(0.35);
  clang(0.7);
  buzz([30, 80, 30, 80, 30]);
}

/** Factory / steam whistle for end of shift. */
export function playWhistle() {
  if (!soundOn) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc2.type = "square";
  osc.frequency.setValueAtTime(620, t);
  osc2.frequency.setValueAtTime(934, t);
  osc.frequency.linearRampToValueAtTime(560, t + 1.4);
  osc2.frequency.linearRampToValueAtTime(860, t + 1.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.18);
  g.gain.setValueAtTime(0.07, t + 1.0);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  osc.connect(g);
  osc2.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc2.start(t);
  osc.stop(t + 1.7);
  osc2.stop(t + 1.7);
  buzz([60, 40, 120]);
}
