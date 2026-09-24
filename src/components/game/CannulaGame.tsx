import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

type Band = { x: number; w: number; kind: "vein" | "artery" };

const ROUNDS = 3;

const SKIN_TONES = [
  "suture-skin-light",
  "suture-skin-tan",
  "suture-skin-brown",
  "suture-skin-dark",
] as const;
const SKIN_TONE_KEY = "shift-fight-cannula-skin-tone";

/** Hi-bit (32-bit era) arm drawn on a 240x440 canvas, rasterised at half res. */
const CANVAS_W = 240;
const CANVAS_H = 440;
const PIXEL_SCALE = 0.5; // render at 120x220, scale up crisp -> fine hi-bit pixels
const ARM_TOP = 34;
const ARM_SPAN = 224;

const VEIN_DEEP = "oklch(0.42 0.14 262)";
const VEIN_MID = "oklch(0.52 0.15 258)";
const VEIN_HI = "oklch(0.66 0.13 252)";
const ART_DEEP = "oklch(0.44 0.19 22)";
const ART_MID = "oklch(0.56 0.21 24)";
const ART_HI = "oklch(0.68 0.19 26)";

type Oklch = [l: number, c: number, h: number];

/** Base skin LCH per tone, matching the suturing mini-game palette. */
const SKIN_BASE: Record<(typeof SKIN_TONES)[number], Oklch> = {
  "suture-skin-light": [0.88, 0.065, 58],
  "suture-skin-tan": [0.74, 0.105, 62],
  "suture-skin-brown": [0.56, 0.105, 54],
  "suture-skin-dark": [0.39, 0.075, 48],
};

function mixToward([l, c, h]: Oklch, t: number, toWhite: boolean): string {
  const nl = toWhite ? l + (1 - l) * t : l * (1 - t);
  const nc = toWhite ? c * (1 - t * 0.35) : c * (1 - t * 0.25);
  return `oklch(${nl.toFixed(3)} ${nc.toFixed(3)} ${h})`;
}

/** 6-8 step tonal ramp per skin, in the style of 32-bit arcade sprites. */
function buildRamp(base: Oklch) {
  return {
    hi2: mixToward(base, 0.55, true),
    hi1: mixToward(base, 0.3, true),
    mid: mixToward(base, 0.05, false),
    sh1: mixToward(base, 0.17, false),
    sh2: mixToward(base, 0.31, false),
    line: mixToward(base, 0.48, false),
    deep: mixToward(base, 0.62, false),
  };
}

type Ramp = ReturnType<typeof buildRamp>;

function buildBands(level: number, round: number): Band[] {
  const rnd = () => Math.random();
  const veinW = Math.max(0.09, 0.3 - level * 0.03 - round * 0.015);
  const bands: Band[] = [];
  const veins = level >= 4 ? 3 : level >= 2 ? 2 : 1;
  const arteries = level >= 1 ? Math.min(2, Math.ceil(level / 2)) : 0;

  const slots = [0.14, 0.3, 0.46, 0.62, 0.78].sort(() => rnd() - 0.5);
  let i = 0;
  for (let v = 0; v < veins; v++) {
    const x = slots[i++] ?? 0.5;
    bands.push({ x, w: veinW, kind: "vein" });
  }
  for (let a = 0; a < arteries; a++) {
    const x = slots[i++] ?? 0.9;
    bands.push({ x, w: Math.max(0.07, veinW * 0.8), kind: "artery" });
  }
  // keep vessels from visually merging: nudge apart, collision radii unchanged
  bands.sort((a, b) => a.x - b.x);
  for (let b = 1; b < bands.length; b++) {
    const minGap = (bands[b - 1].w + bands[b].w) / 2 + 0.02;
    if (bands[b].x - bands[b - 1].x < minGap) {
      bands[b].x = Math.min(0.86, bands[b - 1].x + minGap);
    }
  }
  return bands;
}

/* ---------- SVG builders (rasterised to a pixel canvas) ---------- */

function armSvg(bands: Band[], r: Ramp): string {
  const vessels = bands
    .map((b) => {
      const cy = ARM_TOP + b.x * ARM_SPAN;
      const h = Math.max(7, b.w * ARM_SPAN * 0.5);
      const isV = b.kind === "vein";
      const deep = isV ? VEIN_DEEP : ART_DEEP;
      const mid = isV ? VEIN_MID : ART_MID;
      const hi = isV ? VEIN_HI : ART_HI;
      const wave = `M66 ${cy + 3} C 88 ${cy - 7}, 104 ${cy + 8}, 122 ${cy} S 156 ${cy - 8}, 176 ${cy + 3}`;
      return `<g>
        <ellipse cx="120" cy="${cy}" rx="56" ry="${(h * 0.95).toFixed(1)}" fill="${isV ? "oklch(0.52 0.14 258 / 0.14)" : "oklch(0.58 0.2 24 / 0.13)"}"/>
        <path d="${wave}" fill="none" stroke="${deep}" stroke-width="${h.toFixed(1)}" stroke-linecap="round" opacity="0.55"/>
        <path d="${wave}" fill="none" stroke="${mid}" stroke-width="${(h * 0.62).toFixed(1)}" stroke-linecap="round"/>
        <path d="M78 ${cy + 0.5} C 96 ${cy - 7}, 108 ${cy + 5}, 124 ${cy - 2}" fill="none" stroke="${hi}" stroke-width="${Math.max(1.5, h * 0.2).toFixed(1)}" stroke-linecap="round" opacity="0.75"/>
        <path d="M126 ${cy} q 14 ${isV ? -12 : 12} 30 ${isV ? -14 : 14}" fill="none" stroke="${mid}" stroke-width="${Math.max(2, h * 0.32).toFixed(1)}" stroke-linecap="round" opacity="0.6"/>
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    <path d="M66 -2 L66 92 L68 152 L72 212 L80 264 L85 288 L74 302 L65 324 L63 362 L68 398 L77 426 L163 426 L172 398 L177 362 L175 324 L166 302 L155 288 L160 264 L168 212 L172 152 L174 92 L174 -2 Z" fill="${r.mid}" stroke="${r.line}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M72 306 L48 316 L37 337 L40 360 L54 368 L72 357 Z" fill="${r.mid}" stroke="${r.line}" stroke-width="3" stroke-linejoin="round"/>
    ${[
      [78, 100],
      [102, 124],
      [126, 148],
      [150, 168],
    ]
      .map(
        ([a, b]) =>
          `<path d="M${a} 418 L${a} 434 Q${(a + b) / 2} 440 ${b} 434 L${b} 418 Z" fill="${r.mid}" stroke="${r.line}" stroke-width="2.5" stroke-linejoin="round"/>`,
      )
      .join("")}
    <path d="M88 4 L104 4 L100 280 L86 280 Z" fill="${r.hi1}" opacity="0.5"/>
    <path d="M93 8 L100 8 L97 268 L91 268 Z" fill="${r.hi2}" opacity="0.45"/>
    <path d="M144 4 L170 4 L160 280 L142 280 Z" fill="${r.sh1}" opacity="0.42"/>
    <path d="M160 6 L171 6 L158 276 L150 276 Z" fill="${r.sh2}" opacity="0.38"/>
    <path d="M86 292 Q120 300 154 292" fill="none" stroke="${r.sh2}" stroke-width="3" opacity="0.55"/>
    <path d="M84 300 Q120 309 156 300" fill="none" stroke="${r.sh1}" stroke-width="2.5" opacity="0.45"/>
    <ellipse cx="88" cy="344" rx="20" ry="30" fill="${r.hi1}" opacity="0.38"/>
    <ellipse cx="152" cy="352" rx="22" ry="38" fill="${r.sh1}" opacity="0.32"/>
    <path d="M70 410 Q120 420 172 408" fill="none" stroke="${r.sh2}" stroke-width="4" opacity="0.4"/>
    ${[
      [78, 100],
      [102, 124],
      [126, 148],
      [150, 168],
    ]
      .map(
        ([a, b], i) =>
          `<path d="M${a + 3} 420 Q${(a + b) / 2} 424 ${b - 3} 420" fill="none" stroke="${r.sh2}" stroke-width="2" opacity="0.5"/>
           <path d="M${a + 5} 429 Q${(a + b) / 2} 433 ${b - 5} 429" fill="none" stroke="${r.hi1}" stroke-width="2.5" opacity="0.55"/>`,
      )
      .join("")}
    ${vessels}
  </svg>`;
}

function cannulaSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="78 -24 162 48">
    <rect x="96" y="-2.6" width="80" height="5.2" fill="oklch(0.62 0.02 250)"/>
    <rect x="96" y="-2.6" width="80" height="1.6" fill="oklch(0.9 0.01 250)"/>
    <rect x="96" y="1.4" width="80" height="1.4" fill="oklch(0.4 0.02 250)"/>
    <path d="M96 -2.6 L96 2.6 L82 2.6 Z" fill="oklch(0.86 0.01 250)"/>
    <path d="M96 -2.6 L88 0.4 L82 2.6 Z" fill="oklch(0.55 0.02 250)" opacity="0.7"/>
    <path d="M176 -20 L206 -12 L206 -6 L176 -6 Z" fill="oklch(0.56 0.13 195)" stroke="oklch(0.3 0.05 210)" stroke-width="1"/>
    <path d="M176 20 L206 12 L206 6 L176 6 Z" fill="oklch(0.5 0.12 195)" stroke="oklch(0.3 0.05 210)" stroke-width="1"/>
    <rect x="176" y="-9" width="36" height="18" rx="3" fill="oklch(0.86 0.05 200 / 0.9)" stroke="oklch(0.45 0.04 220)" stroke-width="1.2"/>
    <rect x="180" y="-5" width="20" height="10" rx="2" fill="oklch(0.66 0.16 22 / 0.55)"/>
    <rect x="180" y="-5" width="20" height="3" fill="oklch(0.95 0.02 200 / 0.7)"/>
    <rect x="210" y="-7" width="24" height="14" rx="3" fill="oklch(0.52 0.12 195)" stroke="oklch(0.36 0.08 200)" stroke-width="1.2"/>
    <rect x="214" y="-5" width="2" height="10" fill="oklch(0.7 0.1 195)" opacity="0.7"/>
    <rect x="219" y="-5" width="2" height="10" fill="oklch(0.7 0.1 195)" opacity="0.7"/>
    <rect x="224" y="-5" width="2" height="10" fill="oklch(0.7 0.1 195)" opacity="0.7"/>
    <rect x="229" y="-5" width="2" height="10" fill="oklch(0.7 0.1 195)" opacity="0.7"/>
  </svg>`;
}

/** Rasterise an SVG string to a small canvas for crisp hi-bit scaling. */
async function rasterise(svg: string, w: number, h: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg rasterise failed"));
      img.src = url;
    });
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CannulaGame({ level, paused, onDone }: Props) {
  const [intro, setIntro] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("shift-cannula-seen") !== "yes";
  });
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const dir = useRef(1);
  const [results, setResults] = useState<number[]>([]);
  const [hit, setHit] = useState<{ x: number; label: string; good: boolean } | null>(null);
  const running = useRef(true);
  const posRef = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const speed = 0.011 + level * 0.0022 + round * 0.0035;

  const bands = useMemo(() => buildBands(level, round), [level, round]);
  const bandsRef = useRef(bands);
  bandsRef.current = bands;

  const [skinTone, setSkinTone] = useState<(typeof SKIN_TONES)[number]>(SKIN_TONES[0]);
  useEffect(() => {
    try {
      const previous = Number(window.localStorage.getItem(SKIN_TONE_KEY) ?? "-1");
      const next = (previous + 1) % SKIN_TONES.length;
      setSkinTone(SKIN_TONES[next] ?? SKIN_TONES[0]);
      window.localStorage.setItem(SKIN_TONE_KEY, String(next));
    } catch {
      setSkinTone(SKIN_TONES[0]);
    }
  }, []);

  /* rasterised pixel layers */
  const screenRef = useRef<HTMLCanvasElement | null>(null);
  const armLayer = useRef<HTMLCanvasElement | null>(null);
  const cannulaLayer = useRef<HTMLCanvasElement | null>(null);
  const [artReady, setArtReady] = useState(0);

  useEffect(() => {
    let alive = true;
    const ramp = buildRamp(SKIN_BASE[skinTone]);
    (async () => {
      try {
        const [arm, cann] = await Promise.all([
          rasterise(armSvg(bands, ramp), CANVAS_W * PIXEL_SCALE, CANVAS_H * PIXEL_SCALE),
          rasterise(cannulaSvg(), Math.ceil(162 * PIXEL_SCALE), Math.ceil(48 * PIXEL_SCALE)),
        ]);
        if (!alive) return;
        armLayer.current = arm;
        cannulaLayer.current = cann;
        setArtReady((n) => n + 1);
      } catch {
        /* leave previous layers */
      }
    })();
    return () => {
      alive = false;
    };
  }, [bands, skinTone]);

  /* composite the pixel layers each frame */
  useEffect(() => {
    const screen = screenRef.current;
    const arm = armLayer.current;
    const cann = cannulaLayer.current;
    if (!screen || !arm || !cann) return;
    const ctx = screen.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, screen.width, screen.height);
    ctx.drawImage(arm, 0, 0);
    const s = PIXEL_SCALE;
    const cx = ((78 + 162 / 2) - cann.width / (2 * s) + 162 / 2) * 0; // keep simple math below
    void cx;
    const drawX = Math.round((78 + (162 - cann.width / s) / 2) * s);
    const drawY = Math.round((ARM_TOP + pos * ARM_SPAN - 24) * s);
    ctx.drawImage(cann, drawX, drawY);
  }, [pos, artReady]);

  useEffect(() => {
    if (intro) return;
    const id = setInterval(() => {
      if (!running.current || pausedRef.current) return;
      setPos((p) => {
        let n = p + dir.current * speed;
        if (n >= 1) {
          n = 1;
          dir.current = -1;
        } else if (n <= 0) {
          n = 0;
          dir.current = 1;
        }
        posRef.current = n;
        return n;
      });
    }, 16);
    return () => clearInterval(id);
  }, [speed, intro]);

  function tap() {
    if (!running.current) return;
    running.current = false;
    const p = posRef.current;
    const artery = bandsRef.current.find(
      (b) => b.kind === "artery" && Math.abs(p - b.x) < b.w / 2,
    );
    if (artery) {
      playBad();
      setHit({ x: p, label: "ARTERY! ABORT!", good: false });
      setTimeout(() => next(0), 1100);
      return;
    }
    const vein = bandsRef.current
      .filter((b) => b.kind === "vein")
      .map((b) => ({ b, d: Math.abs(p - b.x) }))
      .sort((a, z) => a.d - z.d)[0];
    if (vein && vein.d < vein.b.w / 2) {
      const acc = 1 - vein.d / (vein.b.w / 2);
      playGood();
      const pts = Math.round(40 + acc * 90);
      setHit({
        x: p,
        label: acc > 0.65 ? "PERFECT VEIN!" : "FLASHBACK!",
        good: true,
      });
      setTimeout(() => next(pts), 900);
    } else {
      playPop();
      setHit({ x: p, label: "OW. TISSUED.", good: false });
      setTimeout(() => next(5), 900);
    }
  }

  function next(points: number) {
    const all = [...results, points];
    setResults(all);
    setHit(null);
    if (round + 1 >= ROUNDS) {
      onDone(
        all.reduce((a, b) => a + b, 0),
        all.every((p) => p > 100),
      );
    } else {
      setRound((r) => r + 1);
      setPos(0);
      posRef.current = 0;
      dir.current = 1;
      running.current = true;
    }
  }

  function dismissIntro() {
    window.localStorage.setItem("shift-cannula-seen", "yes");
    setIntro(false);
  }

  if (intro) {
    return (
      <div className="absolute inset-0 z-30 flex animate-slide-up flex-col items-center justify-center gap-5 bg-background/98 p-6 text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-3xl font-black leading-none">CANNULA CHALLENGE</h2>
        <div className="space-y-3 rounded-3xl border-2 border-border bg-card p-5 text-left">
          <p className="text-sm font-semibold">INSERT THE CANNULA INTO THE VEIN.</p>
          <div className="flex items-center gap-3">
            <span
              className="font-display inline-block h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: "oklch(0.55 0.18 240)" }}
            />
            <p className="text-sm font-semibold">BLUE = VEIN · success</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-display inline-block h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: "oklch(0.55 0.22 22)" }}
            />
            <p className="text-sm font-semibold">RED = ARTERY · fail</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tap when the needle is over a blue vein. Avoid the red arteries.
          </p>
        </div>
        <button
          onClick={dismissIntro}
          className="font-display chunky chunky-press w-full rounded-2xl bg-primary py-4 text-lg font-black uppercase tracking-wide text-primary-foreground"
        >
          GOT IT ▶
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-3 bg-background/98 p-4 pb-[104px]">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">CANNULA CHALLENGE</h2>
        <p className="text-[11px] text-muted-foreground">INSERT THE CANNULA INTO THE VEIN.</p>
        <div className="mt-1.5 flex justify-center gap-2">
          <span
            className="font-display rounded-full px-3 py-1 text-[11px] font-black uppercase text-white"
            style={{ backgroundColor: "oklch(0.55 0.18 240)" }}
          >
            🔵 Blue = vein · success
          </span>
          <span className="font-display rounded-full bg-alarm px-3 py-1 text-[11px] font-black uppercase text-alarm-foreground">
            🔴 Red = artery · fail
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Arcade fun, not clinical instruction.</p>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-10 rounded-full",
              i < results.length ? "bg-calm" : i === round ? "bg-gold" : "bg-muted",
            )}
          />
        ))}
      </div>

      <button
        onClick={tap}
        className="relative flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-border bg-card p-3"
      >
        <div className="relative flex w-full flex-1 justify-center overflow-hidden">
          <canvas
            ref={screenRef}
            width={CANVAS_W * PIXEL_SCALE}
            height={CANVAS_H * PIXEL_SCALE}
            className="h-full w-auto"
            style={{ imageRendering: "pixelated" }}
          />

          {hit && (
            <span
              className={cn(
                "font-display absolute left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-black shadow-lg",
                hit.good ? "bg-calm text-calm-foreground" : "bg-alarm text-alarm-foreground",
              )}
              style={{
                top: `${Math.min(88, Math.max(12, ((ARM_TOP + hit.x * ARM_SPAN) / CANVAS_H) * 100))}%`,
              }}
            >
              {hit.label}
            </span>
          )}
        </div>


        <span className="font-display chunky mt-5 rounded-full bg-primary px-8 py-3.5 text-lg font-black uppercase text-primary-foreground">
          TAP TO STICK
        </span>
      </button>
    </div>
  );
}
