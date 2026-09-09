import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

/**
 * CATCH THE WEE! — a continuous fluid stream pours from the top of the
 * screen; drag the specimen bottle to catch it and fill it up.
 * Higher levels: the stream whips left/right faster and the bottle shrinks.
 */
export function WeeGame({ level, paused, onDone }: Props) {
  // Bottle mouth shrinks from a generous 22% of arena width to ~9% by level 10.
  const bottleW = Math.max(9, 22 - level * 1.4);
  // Stream travels faster left/right as level rises.
  const speed = 0.14 + level * 0.05;
  const wobble = 0.4 + level * 0.22;
  const streamWidth = 2.6; // % of arena width — thin continuous pour
  const target = 100;
  const totalMs = 15000 + Math.min(6000, level * 400);

  const [time, setTime] = useState(1);
  const [fill, setFill] = useState(0);
  const [bottle, setBottle] = useState(0.5);
  const [streamX, setStreamX] = useState(0.5);
  const [splash, setSplash] = useState(false);
  const [won, setWon] = useState(false);
  const [tick, setTick] = useState(0); // drives stream ripple animation

  const areaRef = useRef<HTMLDivElement | null>(null);
  const bottleRef = useRef(0.5);
  const streamRef = useRef(0.5);
  const dir = useRef(1);
  const phaseRef = useRef(0);
  const fillRef = useRef(0);
  const timeRef = useRef(1);
  const done = useRef(false);
  const dragging = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  /* stream movement + catching */
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current || done.current) return;
      phaseRef.current += 0.14;
      let n = streamRef.current + dir.current * speed * 0.03;
      n += Math.sin(phaseRef.current) * 0.004 * wobble;
      if (n > 0.94) {
        n = 0.94;
        dir.current = -1;
      } else if (n < 0.06) {
        n = 0.06;
        dir.current = 1;
      }
      if (Math.random() < 0.008 + level * 0.004) dir.current *= -1;
      streamRef.current = n;
      setStreamX(n);
      setTick((t) => t + 1);

      // caught when the stream lands inside the bottle mouth
      const caught = Math.abs(n - bottleRef.current) < bottleW / 200 + streamWidth / 200;
      setSplash(!caught);
      if (caught) {
        fillRef.current = Math.min(target, fillRef.current + 1.6);
        setFill(fillRef.current);
        if (Math.random() < 0.12) playPop();
        if (fillRef.current >= target) finish(true);
      }
    }, 40);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* shared mini-game style countdown */
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
      const base = Math.round(70 + level * 6 + timeRef.current * 170);
      setTimeout(() => onDone(base, timeRef.current > 0.4), 1100);
    } else {
      playBad();
      const pct = fillRef.current / target;
      setTimeout(() => onDone(Math.max(10, Math.round(pct * 70)), false), 600);
    }
  }

  function moveTo(clientX: number) {
    const el = areaRef.current;
    if (!el || done.current) return;
    const box = el.getBoundingClientRect();
    const x = Math.min(0.96, Math.max(0.04, (clientX - box.left) / box.width));
    bottleRef.current = x;
    setBottle(x);
  }

  const pct = Math.round((fill / target) * 100);
  void tick; // re-render keeps the stream ripple alive

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">CATCH THE WEE!</h2>
        <p className="text-[11px] text-muted-foreground">
          Slide the bottle under the stream. Don&apos;t miss.
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
        <span className="text-2xl">🧴</span>
        <p className="font-display flex-1 text-sm font-black uppercase">{pct}% collected</p>
        <span className="font-display rounded-lg bg-secondary px-2 py-1 text-xs font-black">
          Fill it up
        </span>
      </div>

      <div
        ref={areaRef}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          moveTo(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="relative flex-1 touch-none overflow-hidden rounded-3xl border-4 border-border bg-floor"
      >
        {/* continuous pouring stream */}
        <div
          className="pointer-events-none absolute top-0 bottom-[17%]"
          style={{
            left: `${streamX * 100}%`,
            width: `${streamWidth}%`,
            transform: "translateX(-50%)",
          }}
        >
          {/* main column: a smooth gradient bar, slightly wavy via skew */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.93 0.12 98), oklch(0.86 0.15 95) 40%, oklch(0.82 0.16 92))",
              opacity: 0.95,
              transform: `skewX(${Math.sin(phaseRef.current * 1.3) * 3}deg)`,
              boxShadow: "0 0 8px oklch(0.9 0.14 95 / 0.5)",
            }}
          />
          {/* fast-moving droplet highlights to sell the pour */}
          {Array.from({ length: 5 }).map((_, i) => {
            const cycle = ((phaseRef.current * 0.9 + i * 0.2) % 1) * 100;
            return (
              <span
                key={i}
                className="absolute left-1/2 h-2 w-1 -translate-x-1/2 rounded-full"
                style={{
                  top: `${cycle}%`,
                  background: "oklch(0.96 0.09 100)",
                  opacity: 0.7,
                }}
              />
            );
          })}
        </div>

        {/* splash when missed */}
        {splash && !won && (
          <span
            className="pointer-events-none absolute bottom-[13%] text-xl"
            style={{ left: `${streamX * 100}%`, transform: "translateX(-50%)" }}
          >
            💦
          </span>
        )}

        {/* big specimen bottle — mouth width matches bottleW */}
        <div
          className="pointer-events-none absolute bottom-2"
          style={{ left: `${bottle * 100}%`, transform: "translateX(-50%)" }}
        >
          <div
            className="relative h-28 rounded-b-2xl rounded-t-lg border-4 border-border bg-card/90"
            style={{ width: `clamp(52px, ${bottleW}vw, 130px)` }}
          >
            <div
              className="absolute inset-x-1 bottom-1 rounded-b-xl transition-[height] duration-100"
              style={{
                height: `${Math.min(94, (fill / target) * 94)}%`,
                background: "oklch(0.86 0.15 95)",
              }}
            />
            {/* mouth rim */}
            <div className="absolute -top-2.5 -left-1.5 -right-1.5 h-3 rounded-t-md border-4 border-b-0 border-border bg-card" />
          </div>
        </div>

        {won && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="font-display animate-pop rounded-2xl bg-calm px-5 py-3 text-2xl font-black uppercase text-calm-foreground">
              Bottled it! 🏅
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
