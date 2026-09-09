import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

type Stitch = { y: number; done: boolean; good: boolean };

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
    })),
  );
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
    setTrail(p);
    // must start on the left entry point
    if (p.x < 0.42 && Math.abs(p.y - target.y) < bandTol * 1.6) {
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
    setTrail(p);
    if (Math.abs(p.y - target.y) > bandTol) {
      if (cleanRef.current) {
        cleanRef.current = false;
        strayRef.current++;
        setWarn(true);
        setTimeout(() => setWarn(false), 300);
      }
    }
    if (p.x > 0.62) completeStitch(cleanRef.current);
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
          Drag the needle across the wound at each gold marker.
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
          warn && "animate-shake border-alarm",
        )}
        style={{ background: "oklch(0.86 0.07 58)" }}
      >
        {/* wound */}
        <div
          className="absolute left-1/2 top-[10%] h-[80%] w-6 -translate-x-1/2 rounded-full"
          style={{
            background: "oklch(0.5 0.19 22)",
            opacity: Math.max(0.25, 1 - idx / count),
          }}
        />

        {stitches.map((s, i) => (
          <div key={i} className="absolute inset-x-6" style={{ top: `${s.y * 100}%` }}>
            {s.done ? (
              <div
                className="h-1.5 w-full rounded-full"
                style={{
                  background: s.good ? "oklch(0.35 0.05 250)" : "oklch(0.55 0.05 250)",
                }}
              />
            ) : (
              <div
                className={cn(
                  "h-1.5 w-full rounded-full border-2 border-dashed",
                  i === idx ? "border-gold" : "border-border/50",
                )}
              />
            )}
            {i === idx && !s.done && (
              <span className="absolute -left-4 -top-3 text-lg">🪡</span>
            )}
          </div>
        ))}

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
