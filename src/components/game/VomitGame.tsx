import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop, playVomit } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

const COLS = 36;
const ROWS = 54;
const TARGET = 0.95;

type Sparkle = { id: number; x: number; y: number; d: number };

/** Wipe-the-vomit bonus round: the screen gets splashed, you swipe it clean. */
export function VomitGame({ level, paused, onDone }: Props) {
  const blobs = Math.min(26, 10 + Math.floor(level * 1.6));
  const totalMs = 14000 + blobs * 500;

  const [time, setTime] = useState(1);
  const [phase, setPhase] = useState<"splash" | "wipe" | "done">("splash");
  const [pct, setPct] = useState(0);
  const [cloth, setCloth] = useState<{ x: number; y: number } | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const areaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Uint8Array | null>(null); // 1 = dirty
  const dirtyTotal = useRef(0);
  const cleanedRef = useRef(0);
  const pctRef = useRef(0);
  const timeRef = useRef(1);
  const done = useRef(false);
  const wiping = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const phaseRef = useRef<"splash" | "wipe" | "done">("splash");
  phaseRef.current = phase;

  /* ---------- splash ---------- */
  useEffect(() => {
    const el = areaRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const box = el.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.floor(box.width * dpr));
    cv.height = Math.max(1, Math.floor(box.height * dpr));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    playVomit();

    const w = box.width;
    const h = box.height;
    let i = 0;
    const timer = setInterval(() => {
      for (let k = 0; k < 2 && i < blobs; k++, i++) {
        const cx = 0.08 * w + Math.random() * 0.84 * w;
        const cy = 0.06 * h + Math.random() * 0.88 * h;
        const r = Math.min(w, h) * (0.1 + Math.random() * 0.12);
        const hue = 95 + Math.random() * 35;
        splat(ctx, cx, cy, r, hue);
      }
      if (i >= blobs) {
        clearInterval(timer);
        measure(ctx, w, h, dpr);
        setPhase("wipe");
      }
    }, 70);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function splat(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    hue: number,
  ) {
    ctx.save();
    ctx.fillStyle = `oklch(0.7 0.14 ${hue})`;
    ctx.beginPath();
    const pts = 12;
    for (let p = 0; p <= pts; p++) {
      const a = (p / pts) * Math.PI * 2;
      const rr = r * (0.68 + Math.random() * 0.5);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // droplets + chunks
    for (let d = 0; d < 6; d++) {
      const a = Math.random() * Math.PI * 2;
      const dist = r * (1 + Math.random() * 0.9);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, r * (0.08 + Math.random() * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `oklch(0.82 0.11 ${hue})`;
    for (let d = 0; d < 4; d++) {
      ctx.beginPath();
      ctx.arc(
        cx + (Math.random() - 0.5) * r,
        cy + (Math.random() - 0.5) * r,
        r * (0.1 + Math.random() * 0.16),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function measure(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) {
    const grid = new Uint8Array(COLS * ROWS);
    let total = 0;
    const img = ctx.getImageData(0, 0, Math.floor(w * dpr), Math.floor(h * dpr));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const px = Math.floor(((c + 0.5) / COLS) * w * dpr);
        const py = Math.floor(((r + 0.5) / ROWS) * h * dpr);
        const a = img.data[(py * img.width + px) * 4 + 3] ?? 0;
        if (a > 20) {
          grid[r * COLS + c] = 1;
          total++;
        }
      }
    }
    gridRef.current = grid;
    dirtyTotal.current = Math.max(1, total);
  }

  /* ---------- timer ---------- */
  useEffect(() => {
    let last = performance.now();
    let elapsed = 0;
    const id = setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current && phaseRef.current === "wipe") elapsed += now - last;
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
    setPhase("done");
    if (success) {
      playGood();
      burstSparkles();
      const base = Math.round(70 + blobs * 8 + timeRef.current * 160);
      setTimeout(() => onDone(base, timeRef.current > 0.4), 1200);
    } else {
      playBad();
      setTimeout(() => onDone(Math.max(10, Math.round(pctRef.current * 70)), false), 700);
    }
  }

  function burstSparkles() {
    const list: Sparkle[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 8 + Math.random() * 84,
      y: 8 + Math.random() * 84,
      d: Math.random() * 600,
    }));
    setSparkles(list);
  }

  /* ---------- wiping ---------- */
  function wipeAt(clientX: number, clientY: number) {
    if (done.current || pausedRef.current || phaseRef.current !== "wipe") return;
    const el = areaRef.current;
    const cv = canvasRef.current;
    const grid = gridRef.current;
    if (!el || !cv || !grid) return;
    const box = el.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    setCloth({ x: x / box.width, y: y / box.height });

    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const radius = Math.min(box.width, box.height) * 0.11;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let gained = 0;
    const cw = box.width / COLS;
    const ch = box.height / ROWS;
    const c0 = Math.max(0, Math.floor((x - radius) / cw));
    const c1 = Math.min(COLS - 1, Math.floor((x + radius) / cw));
    const r0 = Math.max(0, Math.floor((y - radius) / ch));
    const r1 = Math.min(ROWS - 1, Math.floor((y + radius) / ch));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const idx = r * COLS + c;
        if (!grid[idx]) continue;
        const gx = (c + 0.5) * cw;
        const gy = (r + 0.5) * ch;
        if (Math.hypot(gx - x, gy - y) <= radius) {
          grid[idx] = 0;
          gained++;
        }
      }
    }
    if (gained > 0) {
      cleanedRef.current += gained;
      const p = cleanedRef.current / dirtyTotal.current;
      pctRef.current = p;
      setPct(p);
      if (Math.random() < 0.25) playPop();
      if (p >= TARGET) finish(true);
    }
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

  const shown = Math.min(100, Math.round(pct * 100));

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">SICK BOWL SPRINT</h2>
        <p className="text-[11px] text-muted-foreground">
          Swipe the mess away — get it 95% clean.
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
          {phase === "splash" ? "Incoming…" : `${shown}% clean`}
        </p>
        <span className="font-display rounded-lg bg-secondary px-2 py-1 text-xs font-black">
          Target 95%
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
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {cloth && (
          <span
            className="pointer-events-none absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-sheet/80 text-3xl shadow-md"
            style={{ left: `${cloth.x * 100}%`, top: `${cloth.y * 100}%` }}
          >
            🧻
          </span>
        )}

        {sparkles.map((s) => (
          <span
            key={s.id}
            className="pointer-events-none absolute text-2xl"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animation: `sparkle 900ms ease-out ${s.d}ms both`,
            }}
          >
            ✨
          </span>
        ))}

        {phase === "done" && pctRef.current >= TARGET && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="font-display animate-pop text-3xl font-black uppercase text-calm-foreground">
              Spotless! ✨
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
