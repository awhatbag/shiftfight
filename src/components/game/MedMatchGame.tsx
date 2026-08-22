import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MEDS = [
  { name: "Zolvarin", color: "bg-alarm" },
  { name: "Brenupax", color: "bg-calm" },
  { name: "Corvidyne", color: "bg-gold" },
  { name: "Mellodex", color: "bg-primary" },
  { name: "Pantorine", color: "bg-accent" },
];

type Props = { onDone: (score: number, perfect: boolean) => void };

export function MedMatchGame({ onDone }: Props) {
  const round = useMemo(() => {
    const picks = [...MEDS].sort(() => Math.random() - 0.5).slice(0, 4);
    return {
      order: picks,
      cups: [...picks].sort(() => Math.random() - 0.5),
    };
  }, []);

  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [bad, setBad] = useState<string | null>(null);
  const [time, setTime] = useState(1);
  const done = useRef(false);

  useEffect(() => {
    const total = 14000;
    const start = Date.now();
    const id = setInterval(() => {
      const left = 1 - (Date.now() - start) / total;
      setTime(left);
      if (left <= 0) finish(false);
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(complete: boolean) {
    if (done.current) return;
    done.current = true;
    const score = complete ? Math.round(60 + time * 140 - wrong * 25) : 20;
    onDone(Math.max(10, score), complete && wrong === 0);
  }

  function tapCup(name: string) {
    if (done.current) return;
    if (name === round.order[step]?.name) {
      const next = step + 1;
      setStep(next);
      if (next >= round.order.length) setTimeout(() => finish(true), 220);
    } else {
      setWrong((w) => w + 1);
      setBad(name);
      setTimeout(() => setBad(null), 320);
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-3 bg-background/98 p-4">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
          Mini-game
        </p>
        <h2 className="font-display text-2xl font-black">MED TROLLEY DASH</h2>
        <p className="text-xs text-muted-foreground">
          Tap the cups in list order. (Fictional meds!)
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-75 ease-linear",
            time < 0.3 ? "bg-alarm" : "bg-calm",
          )}
          style={{ width: `${Math.max(0, time) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <p className="font-display mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Drug chart
        </p>
        <ol className="space-y-1">
          {round.order.map((m, i) => (
            <li
              key={m.name}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 font-display text-sm font-bold transition-all",
                i < step && "text-muted-foreground line-through opacity-50",
                i === step && "scale-[1.02] bg-gold/25 ring-2 ring-gold",
              )}
            >
              <span className="w-4 text-xs">{i + 1}.</span>
              <span className={cn("h-3.5 w-3.5 rounded-full", m.color)} />
              <span>{m.name}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid flex-1 grid-cols-2 content-center gap-3">
        {round.cups.map((m) => {
          const taken = round.order.findIndex((o) => o.name === m.name) < step;
          return (
            <button
              key={m.name}
              onClick={() => tapCup(m.name)}
              disabled={taken}
              className={cn(
                "chunky chunky-press flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl border-2 border-border bg-card",
                taken && "opacity-30",
                bad === m.name && "animate-shake border-alarm bg-alarm/20",
              )}
            >
              <span
                className={cn(
                  "h-14 w-14 rounded-full border-4 border-card shadow-[var(--shadow-card)]",
                  m.color,
                )}
              />
              <span className="font-display text-xs font-black uppercase">{m.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
