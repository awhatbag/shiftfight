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

/**
 * Realistic factory / steam whistle: a breathy filtered-noise jet under a
 * stack of slightly detuned sine partials, with a gentle chiff and fall-off.
 */
export function playWhistle() {
  if (!soundOn) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const dur = 2.4;

  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.22, t + 0.22); // steam build-up
  master.gain.setValueAtTime(0.22, t + dur - 0.7);
  master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  master.connect(c.destination);

  // slow vibrato / wobble, like a real steam column
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.setValueAtTime(5.2, t);
  lfoGain.gain.setValueAtTime(4.5, t);
  lfo.connect(lfoGain);

  // whistle partials (chord-like, as multi-chime factory whistles are)
  const partials: [number, number][] = [
    [392, 0.5],
    [466, 0.34],
    [587, 0.26],
    [784, 0.16],
    [1175, 0.07],
  ];
  for (const [freq, amp] of partials) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 0.985, t);
    osc.frequency.linearRampToValueAtTime(freq, t + 0.3);
    osc.frequency.setValueAtTime(freq, t + dur - 0.6);
    osc.frequency.linearRampToValueAtTime(freq * 0.94, t + dur);
    lfoGain.connect(osc.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(amp, t);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // steam hiss: band-passed white noise
  const len = Math.floor(c.sampleRate * (dur + 0.2));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1500, t);
  bp.Q.setValueAtTime(1.1, t);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.34, t + 0.12); // initial chiff
  ng.gain.exponentialRampToValueAtTime(0.12, t + 0.5);
  ng.gain.setValueAtTime(0.12, t + dur - 0.6);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  noise.connect(bp).connect(ng).connect(master);
  noise.start(t);
  noise.stop(t + dur + 0.1);

  lfo.start(t);
  lfo.stop(t + dur + 0.1);
  buzz([60, 40, 160]);
}
