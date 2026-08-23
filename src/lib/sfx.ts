let ctx: AudioContext | null = null;

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

function tone(freq: number, at: number, dur: number, gain: number) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
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
}

export function playGood() {
  tone(660, 0, 0.14, 0.07);
  tone(990, 0.09, 0.2, 0.06);
}

export function playBad() {
  tone(220, 0, 0.22, 0.08);
  tone(165, 0.1, 0.3, 0.07);
}

export function playPop() {
  tone(520, 0, 0.09, 0.05);
}
