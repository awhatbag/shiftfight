import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

type Stitch = { y: number; done: boolean; good: boolean; fromLeft: boolean };

const SKIN_TONES = ["suture-skin-light", "suture-skin-tan", "suture-skin-brown", "suture-skin-dark"] as const;
const SKIN_TONE_KEY = "shift-fight-suture-skin-tone";

function stitchPoints(stitch: Stitch) {
  return stitch.fromLeft
    ? { startX: 0.27, startY: stitch.y - 0.038, endX: 0.73, endY: stitch.y + 0.038 }
    : { startX: 0.73, startY: stitch.y - 0.038, endX: 0.27, endY: stitch.y + 0.038 };
}

/**
 * WOUND SUTURING — drag the needle across the wound at each marked stitch
 * point. Straying off the path costs accuracy but never instantly fails.
 */
export function SutureGame({ level, paused, onDone }: Props) {
  const count = Math.min(7, 3 + Math.floor(level / 2));
  const bandTol = Math.max(0.035, 0.09 - level * 0.006); // vertical tolerance
  const totalMs = 15000 + count * 2600;

  const [time, setTime] = useState(1);
  const [stitches, setStitches] = useState<Stitch[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      y: 0.18 + (i * 0.64) / Math.max(1, count - 1),
      done: false,
      good: false,
      fromLeft: i % 2 === 0,
    })),
  );
  const [skinTone, setSkinTone] = useState<(typeof SKIN_TONES)[number]>(SKIN_TONES[0]);
  const [idx, setIdx] = useState(0);
  const [trail, setTrail] = useState<{ x: number; y: number } | null>(null);
  const [warn, setWarn] = useState(false);
  const [won, setWon] = useState(false);

  const areaRef = useRef<HTMLDivElement | null>(null);
  const idxRef = useRef(0);
  const strayRef = useRef(0);
  const accurateRef = useRef(0);
  const startedRef = useRef(false);
  const cleanRef = useRef(true);
  const timeRef = useRef(1);
  const done = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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
    let last = performance.now();
    let elapsed = 0;
    const id = setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current) elapsed += now - last;
      last = now;
      const left = 1 - elapsed / totalMs;
      timeRef.current = left;
      setTime(left);
      if (left <= 0) finish(false);
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(success: boolean) {
    if (done.current) return;
    done.current = true;
    if (success) {
      setWon(true);
      playGood();
      const base = Math.round(
        70 + count * 14 + timeRef.current * 170 - strayRef.current * 6,
      );
      setTimeout(
        () => onDone(Math.max(20, base), strayRef.current === 0 && timeRef.current > 0.35),
        1100,
      );
    } else {
      playBad();
      const p = idxRef.current / count;
      setTimeout(() => onDone(Math.max(10, Math.round(p * 70)), false), 600);
    }
  }

  function rel(clientX: number, clientY: number) {
    const el = areaRef.current;
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return {
      x: (clientX - box.left) / box.width,
      y: (clientY - box.top) / box.height,
    };
  }

  function onDown(e: React.PointerEvent) {
    if (done.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = rel(e.clientX, e.clientY);
    const target = stitches[idxRef.current];
    if (!p || !target) return;
    const path = stitchPoints(target);
    setTrail(p);
    if (
      Math.abs(p.x - path.startX) < 0.13 &&
      Math.abs(p.y - path.startY) < bandTol * 1.7
    ) {
      startedRef.current = true;
      cleanRef.current = true;
      playPop();
    } else {
      startedRef.current = false;
    }
  }

  function onMove(e: React.PointerEvent) {
    if (done.current || !startedRef.current) return;
    const p = rel(e.clientX, e.clientY);
    const target = stitches[idxRef.current];
    if (!p || !target) return;
    const path = stitchPoints(target);
    setTrail(p);
    const progress = Math.max(
      0,
      Math.min(1, (p.x - path.startX) / (path.endX - path.startX)),
    );
    const expectedY = path.startY + (path.endY - path.startY) * progress;
    if (Math.abs(p.y - expectedY) > bandTol) {
      if (cleanRef.current) {
        cleanRef.current = false;
        strayRef.current++;
        setWarn(true);
        setTimeout(() => setWarn(false), 300);
      }
    }
    const reachedEnd = target.fromLeft ? p.x >= path.endX : p.x <= path.endX;
    if (reachedEnd && Math.abs(p.y - path.endY) < bandTol * 2) {
      completeStitch(cleanRef.current);
    }
  }

  function completeStitch(good: boolean) {
    startedRef.current = false;
    const i = idxRef.current;
    if (i >= count) return;
    idxRef.current = i + 1;
    if (good) accurateRef.current++;
    setStitches((s) => s.map((st, k) => (k === i ? { ...st, done: true, good } : st)));
    setIdx(i + 1);
    good ? playGood() : playPop();
    if (i + 1 >= count) setTimeout(() => finish(true), 250);
  }

  function onUp() {
    startedRef.current = false;
    setTrail(null);
  }

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">WOUND SUTURING</h2>
        <p className="text-[11px] text-muted-foreground">
          Follow the gold zigzag, starting at the needle.
        </p>
      </div>

      <div className="h-3.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-75 ease-linear",
            time < 0.3 ? "bg-alarm" : "bg-calm",
          )}
          style={{ width: `${Math.max(0, time) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2">
        <span className="text-2xl">🪡</span>
        <p className="font-display flex-1 text-sm font-black uppercase">
          {idx}/{count} stitches
        </p>
        <span className="font-display rounded-lg bg-secondary px-2 py-1 text-xs font-black">
          {strayRef.current ? `${strayRef.current} wobbly` : "Neat!"}
        </span>
      </div>

      <div
        ref={areaRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={cn(
          "relative flex-1 touch-none overflow-hidden rounded-3xl border-4 border-border",
          skinTone,
          warn && "animate-shake border-alarm",
        )}
      >
        <div className="suture-skin-texture absolute inset-0" />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M50 10 C48 18 52 25 49 34 C47 44 53 53 50 63 C47 72 52 82 50 90"
            fill="none"
            stroke="var(--suture-wound-shadow)"
            strokeLinecap="round"
            strokeWidth="8"
            opacity="0.28"
          />
          <path
            d="M50 10 C48 18 52 25 49 34 C47 44 53 53 50 63 C47 72 52 82 50 90"
            fill="none"
            stroke="var(--suture-wound-edge)"
            strokeLinecap="round"
            strokeWidth="5.5"
          />
          <path
            d="M50 10 C48 18 52 25 49 34 C47 44 53 53 50 63 C47 72 52 82 50 90"
            fill="none"
            stroke="var(--suture-wound-depth)"
            strokeLinecap="round"
            strokeWidth="2.4"
            opacity={Math.max(0.32, 1 - idx / count)}
          />
          {stitches.map((stitch, i) => {
            const path = stitchPoints(stitch);
            const active = i === idx && !stitch.done;
            return (
              <g key={i} opacity={!active && !stitch.done ? 0.26 : 1}>
                <line
                  x1={path.startX * 100}
                  y1={path.startY * 100}
                  x2={path.endX * 100}
                  y2={path.endY * 100}
                  stroke={
                    stitch.done
                      ? stitch.good
                        ? "var(--suture-thread)"
                        : "var(--suture-thread-wobbly)"
                      : "var(--suture-guide)"
                  }
                  strokeDasharray={stitch.done ? undefined : "3 2"}
                  strokeLinecap="round"
                  strokeWidth={stitch.done ? 1.4 : active ? 1.1 : 0.8}
                />
                <circle
                  cx={path.startX * 100}
                  cy={path.startY * 100}
                  r={active ? 2.4 : 1.5}
                  fill={active ? "var(--suture-guide)" : "var(--suture-marker)"}
                />
                <circle
                  cx={path.endX * 100}
                  cy={path.endY * 100}
                  r={active ? 2.4 : 1.5}
                  fill={active ? "var(--suture-guide)" : "var(--suture-marker)"}
                />
              </g>
            );
          })}
        </svg>

        {stitches[idx] && !stitches[idx].done && (() => {
          const path = stitchPoints(stitches[idx]);
          return (
            <span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow-md"
              style={{ left: `${path.startX * 100}%`, top: `${path.startY * 100}%` }}
            >
              🪡
            </span>
          );
        })()}

        {trail && (
          <span
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70"
            style={{ left: `${trail.x * 100}%`, top: `${trail.y * 100}%` }}
          />
        )}

        {won && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="font-display animate-pop rounded-2xl bg-calm px-5 py-3 text-2xl font-black uppercase text-calm-foreground">
              Wound closed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
