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

/** Pixel-art helpers: the arm is drawn on a 120x220 vertical canvas. */
const ARM_TOP = 14;
const ARM_SPAN = 112;
const SKIN = "var(--suture-skin)";
const SKIN_SHADE = "color-mix(in oklab, var(--suture-skin) 78%, black)";
const SKIN_LIGHT = "color-mix(in oklab, var(--suture-skin) 82%, white)";
const SKIN_LINE = "color-mix(in oklab, var(--suture-skin) 55%, black)";


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
        <div className="relative w-full overflow-hidden rounded-3xl">
          <svg viewBox="0 0 200 130" className="w-full">
            {/* forearm */}
            <defs>
              <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.9 0.06 62)" />
                <stop offset="100%" stopColor="oklch(0.79 0.08 55)" />
              </linearGradient>
            </defs>
            <path
              d="M2 30 Q30 14 70 16 L150 20 Q186 24 196 44 Q198 66 190 96 Q170 116 132 114 L64 110 Q22 106 4 88 Z"
              fill="url(#skin)"
              stroke="oklch(0.62 0.09 50)"
              strokeWidth="2.5"
            />
            {/* hand hint */}
            <path
              d="M188 40 q12 8 8 26 q-4 16 -14 20"
              fill="none"
              stroke="oklch(0.62 0.09 50)"
              strokeWidth="2"
              opacity="0.5"
            />
            {/* bands / vessels */}
            {bands.map((b, i) => {
              const cx = 6 + b.x * 188;
              const isV = b.kind === "vein";
              return (
                <g key={i}>
                  <rect
                    x={cx - (b.w * 188) / 2}
                    y={18}
                    width={b.w * 188}
                    height={94}
                    rx={6}
                    fill={isV ? "oklch(0.65 0.18 240 / 0.25)" : "oklch(0.62 0.22 22 / 0.2)"}
                    stroke={isV ? "oklch(0.45 0.16 240)" : "oklch(0.6 0.22 22)"}
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <path
                    d={`M${cx - 5} 20 C ${cx + 8} 48, ${cx - 10} 76, ${cx + 4} 110`}
                    fill="none"
                    stroke={isV ? "oklch(0.4 0.16 240)" : "oklch(0.55 0.23 22)"}
                    strokeWidth={isV ? 6 : 7}
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <text
                    x={cx}
                    y={126}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill={isV ? "oklch(0.35 0.15 240)" : "oklch(0.5 0.22 22)"}
                  >
                    {isV ? "VEIN" : "ARTERY"}
                  </text>
                </g>
              );
            })}
            {/* needle */}
            <g transform={`translate(${6 + pos * 188} 0)`}>
              <rect x="-1.5" y="6" width="3" height="104" rx="1.5" fill="oklch(0.3 0.02 250)" />
              <rect x="-7" y="0" width="14" height="12" rx="3" fill="oklch(0.62 0.15 195)" />
            </g>
          </svg>

          {hit && (
            <span
              className={cn(
                "font-display absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-black shadow-lg",
                hit.good ? "bg-calm text-calm-foreground" : "bg-alarm text-alarm-foreground",
              )}
              style={{ left: `${Math.min(80, Math.max(20, hit.x * 100))}%` }}
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
