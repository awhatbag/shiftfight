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

/** Hi-bit (32-bit era) arm drawn on a high-density 240x440 vertical canvas. */
const CANVAS_W = 240;
const CANVAS_H = 440;
const ARM_TOP = 34;
const ARM_SPAN = 224;

/** Long tonal ramp per skin tone, in the style of 32-bit arcade sprites. */
const SKIN = "var(--suture-skin)";
const SKIN_HI2 = "color-mix(in oklab, var(--suture-skin) 68%, white)";
const SKIN_HI1 = "color-mix(in oklab, var(--suture-skin) 84%, white)";
const SKIN_MID = "color-mix(in oklab, var(--suture-skin) 94%, black)";
const SKIN_SH1 = "color-mix(in oklab, var(--suture-skin) 84%, black)";
const SKIN_SH2 = "color-mix(in oklab, var(--suture-skin) 70%, black)";
const SKIN_LINE = "color-mix(in oklab, var(--suture-skin) 52%, black)";
const SKIN_DEEP = "color-mix(in oklab, var(--suture-skin) 38%, black)";

const VEIN_DEEP = "oklch(0.42 0.14 262)";
const VEIN_MID = "oklch(0.52 0.15 258)";
const VEIN_HI = "oklch(0.66 0.13 252)";
const ART_DEEP = "oklch(0.44 0.19 22)";
const ART_MID = "oklch(0.56 0.21 24)";
const ART_HI = "oklch(0.68 0.19 26)";



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
  return bands;
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
        <div
          className={cn("relative flex w-full flex-1 justify-center overflow-hidden", skinTone)}
          style={{ backgroundColor: "transparent", imageRendering: "pixelated" }}
        >
          <svg viewBox="0 0 120 220" className="h-full w-auto" shapeRendering="crispEdges">
            {/* pixel-art arm: upper arm at top, wrist and hand at the bottom */}
            <path
              d="M26 0 L26 34 L29 34 L29 68 L32 68 L32 104 L35 104 L35 130 L38 130 L38 150 L28 150 L28 210 L92 210 L92 150 L82 150 L82 130 L85 130 L85 104 L88 104 L88 68 L91 68 L91 34 L94 34 L94 0 Z"
              fill={SKIN}
              stroke={SKIN_LINE}
              strokeWidth="2"
            />
            {/* thumb */}
            <path
              d="M28 158 L18 158 L18 162 L14 162 L14 180 L18 180 L18 184 L28 184 Z"
              fill={SKIN}
              stroke={SKIN_LINE}
              strokeWidth="2"
            />
            {/* pixel shading columns */}
            <rect x="33" y="6" width="7" height="140" fill={SKIN_LIGHT} opacity="0.7" />
            <rect x="34" y="154" width="7" height="50" fill={SKIN_LIGHT} opacity="0.55" />
            <rect x="80" y="6" width="8" height="140" fill={SKIN_SHADE} opacity="0.6" />
            <rect x="82" y="154" width="8" height="52" fill={SKIN_SHADE} opacity="0.6" />
            {/* knuckles + finger separations */}
            <rect x="28" y="194" width="64" height="2" fill={SKIN_LINE} opacity="0.55" />
            {[44, 60, 76].map((fx) => (
              <rect key={fx} x={fx} y="196" width="2" height="14" fill={SKIN_LINE} opacity="0.7" />
            ))}
            {/* bands / vessels, now stacked vertically down the forearm */}
            {bands.map((b, i) => {
              const cy = ARM_TOP + b.x * ARM_SPAN;
              const h = b.w * ARM_SPAN;
              const isV = b.kind === "vein";
              return (
                <g key={i}>
                  <rect
                    x={32}
                    y={cy - h / 2}
                    width={56}
                    height={h}
                    fill={isV ? "oklch(0.65 0.18 240 / 0.25)" : "oklch(0.62 0.22 22 / 0.2)"}
                    stroke={isV ? "oklch(0.45 0.16 240)" : "oklch(0.6 0.22 22)"}
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <path
                    d={`M34 ${cy} h8 v-3 h10 v3 h10 v-3 h10 v3 h12`}
                    fill="none"
                    stroke={isV ? "oklch(0.4 0.16 240)" : "oklch(0.55 0.23 22)"}
                    strokeWidth={isV ? 5 : 6}
                    opacity="0.9"
                  />
                  <text
                    x={2}
                    y={cy + 3}
                    textAnchor="start"
                    fontSize="7"
                    fontWeight="800"
                    fill={isV ? "oklch(0.35 0.15 240)" : "oklch(0.5 0.22 22)"}
                  >
                    {isV ? "VEIN" : "ARTERY"}
                  </text>
                </g>
              );
            })}
            {/* pixel-art cannula, sliding up and down the arm */}
            <g transform={`translate(0 ${ARM_TOP + pos * ARM_SPAN})`}>
              <rect x="22" y="-2" width="24" height="4" fill="oklch(0.3 0.02 250)" />
              <rect x="46" y="-1" width="4" height="2" fill="oklch(0.45 0.02 250)" />
              <rect x="6" y="-12" width="12" height="6" fill="oklch(0.52 0.13 195)" />
              <rect x="6" y="6" width="12" height="6" fill="oklch(0.52 0.13 195)" />
              <rect x="2" y="-6" width="20" height="12" fill="oklch(0.62 0.15 195)" />
              <rect x="6" y="-3" width="9" height="6" fill="oklch(0.82 0.08 195)" />
              <rect x="-8" y="-3" width="10" height="6" fill="oklch(0.42 0.02 250)" />
            </g>
          </svg>

          {hit && (
            <span
              className={cn(
                "font-display absolute left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-black shadow-lg",
                hit.good ? "bg-calm text-calm-foreground" : "bg-alarm text-alarm-foreground",
              )}
              style={{
                top: `${Math.min(88, Math.max(12, ((ARM_TOP + hit.x * ARM_SPAN) / 220) * 100))}%`,
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
