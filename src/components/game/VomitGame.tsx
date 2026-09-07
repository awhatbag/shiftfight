import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playPop } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

type Splat = {
  id: number;
  x: number; // 0..1
  y: number; // 0..1
  r: number; // radius in %
  hue: number;
  wipes: number; // wipes needed
};

/** Wipe-the-vomit bonus round. Drag a cloth over every splat to clear it. */
export function VomitGame({ level, paused, onDone }: Props) {
  const count = Math.min(14, 5 + Math.floor(level * 0.9));
  const toughness = 1 + Math.floor(level / 4); // wipes per splat
  const totalMs = 11000 + count * 900;

  const initial = useMemo<Splat[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 0.12 + Math.random() * 0.76,
        y: 0.1 + Math.random() * 0.8,
        r: 7 + Math.random() * 5,
        hue: 95 + Math.random() * 35,
        wipes: toughness,
      })),
    [count, toughness],
  );

  const [splats, setSplats] = useState<Splat[]>(initial);
  const [time, setTime] = useState(1);
  const [cloth, setCloth] = useState<{ x: number; y: number } | null>(null);
  const [missed, setMissed] = useState(0);
  const timeRef = useRef(1);
  const done = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const areaRef = useRef<HTMLDivElement | null>(null);
  const wiping = useRef(false);
  const cleared = useRef(0);

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

  function finish(complete: boolean) {
    if (done.current) return;
    done.current = true;
    const base = complete
      ? Math.round(60 + count * 18 + timeRef.current * 150 - missed * 8)
      : 20 + cleared.current * 10;
    onDone(Math.max(10, base), complete && timeRef.current > 0.45);
  }

  function wipeAt(clientX: number, clientY: number) {
    if (done.current || pausedRef.current) return;
    const box = areaRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = (clientX - box.left) / box.width;
    const y = (clientY - box.top) / box.height;
    setCloth({ x, y });
    let hit = false;
    setSplats((cur) => {
      const next: Splat[] = [];
      for (const s of cur) {
        const dx = (s.x - x) * box.width;
        const dy = (s.y - y) * box.height;
        const dist = Math.hypot(dx, dy);
        if (dist < (s.r / 100) * box.width + 26) {
          hit = true;
          if (s.wipes > 1) next.push({ ...s, wipes: s.wipes - 1, r: s.r * 0.78 });
          else cleared.current++;
        } else {
          next.push(s);
        }
      }
      if (next.length === 0 && cur.length > 0) setTimeout(() => finish(true), 260);
      return next;
    });
    if (hit) playPop();
  }

  function onDown(e: React.PointerEvent) {
    wiping.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    wipeAt(e.clientX, e.clientY);
  }
  function onMove(e: React.PointerEvent) {
    if (!wiping.current) return;
    wipeAt(e.clientX, e.clientY);
  }
  function onUp() {
    wiping.current = false;
    setCloth(null);
  }

  useEffect(() => {
    if (time < 0.15 && splats.length > 0 && !done.current) playBad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time < 0.15]);

  const remaining = splats.length;
  const total = initial.length;

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">SICK BOWL SPRINT</h2>
        <p className="text-[11px] text-muted-foreground">
          Drag your cloth over every splat to wipe it clean.
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
        <span className="text-2xl">🧽</span>
        <p className="font-display flex-1 text-sm font-black uppercase">
          {remaining === 0 ? "Spotless!" : `${total - remaining}/${total} wiped`}
        </p>
        <span className="font-display rounded-lg bg-secondary px-2 py-1 text-xs font-black">
          {toughness > 1 ? `${toughness}x scrub` : "1x scrub"}
        </span>
      </div>

      <div
        ref={areaRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative flex-1 touch-none overflow-hidden rounded-3xl border-4 border-border bg-floor shadow-[inset_0_0_0_2px_var(--color-border)]"
      >
        {splats.map((s) => (
          <span
            key={s.id}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-pop"
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: `${s.r * 2}%`,
            }}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <path
                d="M50 8c16 0 30 10 34 24 5 16-4 24-2 36 2 11-10 24-32 24S14 79 16 68c2-12-7-20-2-36C18 18 34 8 50 8z"
                fill={`oklch(0.7 0.14 ${s.hue})`}
                stroke={`oklch(0.5 0.12 ${s.hue})`}
                strokeWidth="4"
              />
              <circle cx="34" cy="44" r="7" fill={`oklch(0.82 0.11 ${s.hue})`} />
              <circle cx="62" cy="60" r="9" fill={`oklch(0.82 0.11 ${s.hue})`} />
              <circle cx="58" cy="34" r="5" fill={`oklch(0.55 0.1 ${s.hue})`} />
            </svg>
          </span>
        ))}

        {cloth && (
          <span
            className="pointer-events-none absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-sheet/80 text-3xl shadow-md"
            style={{ left: `${cloth.x * 100}%`, top: `${cloth.y * 100}%` }}
          >
            🧻
          </span>
        )}

        {remaining === 0 && (
          <div className="absolute inset-0 grid place-items-center">
            <p className="font-display animate-pop text-3xl font-black uppercase text-calm-foreground">
              Spotless! ✨
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
