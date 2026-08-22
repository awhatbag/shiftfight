import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = { onDone: (score: number, perfect: boolean) => void };

const ROUNDS = 3;

export function CannulaGame({ onDone }: Props) {
  const [pos, setPos] = useState(0); // 0..1 sweep
  const [dir, setDir] = useState(1);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [hit, setHit] = useState<{ x: number; label: string; good: boolean } | null>(null);
  const running = useRef(true);
  const speed = 0.016 + round * 0.006;

  useEffect(() => {
    const id = setInterval(() => {
      if (!running.current) return;
      setPos((p) => {
        let n = p + dir * speed;
        if (n >= 1) {
          n = 1;
          setDir(-1);
        } else if (n <= 0) {
          n = 0;
          setDir(1);
        }
        return n;
      });
    }, 16);
    return () => clearInterval(id);
  }, [dir, speed]);

  function tap() {
    if (!running.current) return;
    running.current = false;
    const dist = Math.abs(pos - 0.5);
    const good = dist < 0.16;
    const points = Math.max(0, Math.round((1 - dist * 2.6) * 100));
    setHit({
      x: pos,
      label: dist < 0.05 ? "PERFECT VEIN!" : good ? "FLASHBACK!" : "OW. TISSUED.",
      good,
    });
    setTimeout(() => {
      const next = [...results, points];
      setResults(next);
      setHit(null);
      if (round + 1 >= ROUNDS) {
        const total = next.reduce((a, b) => a + b, 0);
        onDone(total, next.every((p) => p > 80));
      } else {
        setRound((r) => r + 1);
        setPos(0);
        setDir(1);
        running.current = true;
      }
    }, 750);
  }

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-3 bg-background/98 p-4">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
          Mini-game
        </p>
        <h2 className="font-display text-2xl font-black">CANNULA CHALLENGE</h2>
        <p className="text-xs text-muted-foreground">
          Tap in the green zone. Arcade, not clinical!
        </p>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-8 rounded-full",
              i < results.length ? "bg-calm" : i === round ? "bg-gold" : "bg-muted",
            )}
          />
        ))}
      </div>

      <button
        onClick={tap}
        className="relative flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-border bg-card p-4"
      >
        {/* cartoon arm */}
        <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-[oklch(0.87_0.06_60)]">
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rotate-[-4deg] bg-[oklch(0.62_0.09_270)]/70" />
          <div className="absolute inset-x-6 top-1/2 h-1.5 translate-y-4 rotate-[3deg] rounded-full bg-[oklch(0.62_0.09_270)]/40" />
          {/* target zone */}
          <div className="absolute left-1/2 top-0 h-full w-[32%] -translate-x-1/2 border-x-2 border-dashed border-calm bg-calm/25" />
          <div className="absolute left-1/2 top-0 h-full w-[10%] -translate-x-1/2 bg-gold/50" />
          {/* needle */}
          <div
            className="absolute top-0 h-full w-1 -translate-x-1/2 bg-foreground"
            style={{ left: `${pos * 100}%` }}
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-lg">💉</span>
          </div>
          {hit && (
            <span
              className={cn(
                "font-display absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop whitespace-nowrap rounded-full px-2 py-1 text-xs font-black",
                hit.good ? "bg-calm text-calm-foreground" : "bg-alarm text-alarm-foreground",
              )}
              style={{ left: `${hit.x * 100}%` }}
            >
              {hit.label}
            </span>
          )}
        </div>
        <span className="font-display mt-6 rounded-full bg-primary px-8 py-3 text-lg font-black uppercase text-primary-foreground chunky">
          TAP TO STICK
        </span>
      </button>
    </div>
  );
}
