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
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3 pb-[104px]">
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
          viewBox="0 0 50 100"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
        >
          {(() => {
            // Chunky pixel wound: each finished stitch pulls the edges closer.
            const open = Math.max(0, 1 - idx / count);
            const rows = [];
            for (let y = 8; y < 92; y += 2) {
              const cx = Math.round(25 + Math.sin(y / 9) * 1.5);
              const taper = Math.sin(((y - 8) / 84) * Math.PI);
              const half = Math.round(taper * 5 * open);
              rows.push(
                <g key={y}>
                  <rect x={cx - half - 1} y={y} width={half * 2 + 2} height={2} fill="var(--suture-wound-edge)" opacity={open > 0 ? 1 : 0.55} />
                  {half > 0 && (
                    <rect x={cx - half} y={y} width={half * 2} height={2} fill="var(--suture-wound-shadow)" />
                  )}
                  {half > 1 && (
                    <rect x={cx - half + 1} y={y} width={half * 2 - 2} height={2} fill="var(--suture-wound-depth)" />
                  )}
                </g>,
              );
            }
            return rows;
          })()}
          {stitches.map((stitch, i) => {
            if (!stitch.done) return null;
            const p = stitchPoints(stitch);
            return (
              <line
                key={i}
                x1={p.startX * 50}
                y1={p.startY * 100}
                x2={p.endX * 50}
                y2={p.endY * 100}
                stroke={stitch.good ? "var(--suture-thread)" : "var(--suture-thread-wobbly)"}
                strokeWidth={1.6}
              />
            );
          })}
        </svg>

        {stitches[idx] && !stitches[idx].done && (() => {
          const path = stitchPoints(stitches[idx]);
          const needle = trail && startedRef.current ? trail : { x: path.startX, y: path.startY };
          return (
            <>
              <span
                className="suture-target pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${path.endX * 100}%`, top: `${path.endY * 100}%` }}
              />
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1={path.startX * 100}
                  y1={path.startY * 100}
                  x2={needle.x * 100}
                  y2={needle.y * 100}
                  stroke="var(--suture-thread)"
                  strokeWidth={0.9}
                  vectorEffect="non-scaling-stroke"
                  style={{ strokeWidth: 3 }}
                />
              </svg>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
                style={{
                  left: `${needle.x * 100}%`,
                  top: `${needle.y * 100}%`,
                  transform: `translate(-50%,-50%) scaleX(${stitches[idx].fromLeft ? 1 : -1})`,
                }}
                viewBox="0 0 16 16"
                shapeRendering="crispEdges"
              >
                {/* Pixel curved surgical needle with swaged thread */}
                <rect x="1" y="9" width="2" height="1" fill="var(--suture-thread)" />
                <rect x="3" y="10" width="2" height="1" fill="oklch(0.55 0.02 250)" />
                <rect x="5" y="11" width="3" height="1" fill="oklch(0.85 0.01 250)" />
                <rect x="8" y="10" width="2" height="1" fill="oklch(0.92 0.01 250)" />
                <rect x="10" y="9" width="1" height="1" fill="oklch(0.92 0.01 250)" />
                <rect x="11" y="7" width="1" height="2" fill="oklch(0.85 0.01 250)" />
                <rect x="12" y="5" width="1" height="2" fill="oklch(0.75 0.01 250)" />
                <rect x="12" y="4" width="1" height="1" fill="oklch(0.98 0 0)" />
                <rect x="6" y="12" width="2" height="1" fill="oklch(0.45 0.02 250)" />
              </svg>
            </>
          );
        })()}

        {won && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            {Array.from({ length: 30 }, (_, i) => (
              <span
                key={i}
                className="pixel-sparkle absolute"
                style={{
                  left: `${(i * 37) % 95}%`,
                  top: `${(i * 53) % 92}%`,
                  animation: `sparkle 900ms steps(6) ${(i * 70) % 900}ms infinite`,
                }}
              />
            ))}
            <p
              className="pixel-spotless animate-pop whitespace-nowrap text-center leading-none"
              style={{ fontSize: "min(2.2rem, 7.5vw)" }}
            >
              WOUND CLOSED!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
