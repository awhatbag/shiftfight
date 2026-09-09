import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FICTIONAL_MEDS } from "@/game/config";
import { Pill, PillCup, pillLookFor } from "./Pill";
import { playBad, playPop } from "@/lib/sfx";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

type Flying = { id: number; name: string; from: { x: number; y: number } };

export function MedMatchGame({ level, paused, onDone }: Props) {
  // difficulty: more orders + more choices as level rises
  const orders = Math.min(6, 2 + Math.floor(level / 2));
  const choices = Math.min(8, Math.max(4, orders + 2 + Math.floor(level / 3)));
  const totalMs = 9000 + orders * 3200;

  const round = useMemo(() => {
    const pool = [...FICTIONAL_MEDS].sort(() => Math.random() - 0.5).slice(0, choices);
    const order = [...pool].sort(() => Math.random() - 0.5).slice(0, orders);
    return { pool, order };
  }, [choices, orders]);

  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [bad, setBad] = useState<string | null>(null);
  const [time, setTime] = useState(1);
  const [flying, setFlying] = useState<Flying[]>([]);
  const flyId = useRef(1);
  const done = useRef(false);
  const timeRef = useRef(1);
  const cupRef = useRef<HTMLDivElement | null>(null);
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

  function finish(complete: boolean) {
    if (done.current) return;
    done.current = true;
    const base = complete
      ? Math.round(50 + orders * 25 + timeRef.current * 140 - wrong * 25)
      : 20;
    onDone(Math.max(10, base), complete && wrong === 0);
  }

  function tapCup(name: string, el: HTMLElement) {
    if (done.current) return;
    if (name === round.order[step]) {
      playPop();
      const box = el.getBoundingClientRect();
      const cup = cupRef.current?.getBoundingClientRect();
      const id = flyId.current++;
      setFlying((f) => [
        ...f,
        {
          id,
          name,
          from: {
            x: box.left + box.width / 2 - (cup ? cup.left + cup.width / 2 : 0),
            y: box.top + box.height / 2 - (cup ? cup.top + cup.height / 2 : 0),
          },
        },
      ]);
      setTimeout(() => setFlying((f) => f.filter((x) => x.id !== id)), 460);
      const next = step + 1;
      setStep(next);
      if (next >= round.order.length) setTimeout(() => finish(true), 480);
    } else {
      playBad();
      setWrong((w) => w + 1);
      setBad(name);
      setTimeout(() => setBad(null), 320);
    }
  }

  const current = round.order[step];

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3 pb-[104px]">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">MED TROLLEY DASH</h2>
        <p className="text-[11px] text-muted-foreground">
          Tap the pills in chart order. Fictional meds only!
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

      <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <div ref={cupRef} className="relative shrink-0">
          <PillCup filled={step} label={`${step}/${round.order.length}`} />
          {flying.map((f) => (
            <span
              key={f.id}
              className="pointer-events-none absolute left-1/2 top-1/2 z-40"
              style={{
                animation: "pill-fly 0.45s cubic-bezier(0.4,0,0.3,1) forwards",
                // @ts-expect-error custom props
                "--fx": `${f.from.x}px`,
                "--fy": `${f.from.y}px`,
              }}
            >
              <Pill look={pillLookFor(f.name)} size={40} />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Next on chart
          </p>
          <p className="font-display truncate text-xl font-black leading-tight">
            {current ? current : "DONE!"}
          </p>
          <div className="mt-1 flex gap-1">
            {round.order.map((m, i) => (
              <span
                key={m}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < step ? "bg-calm" : i === step ? "bg-gold" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid flex-1 content-center gap-2",
          choices > 6 ? "grid-cols-4" : "grid-cols-3",
        )}
      >
        {round.pool.map((m) => {
          const taken = round.order.indexOf(m) > -1 && round.order.indexOf(m) < step;
          return (
            <button
              key={m}
              onClick={(e) => tapCup(m, e.currentTarget)}
              disabled={taken}
              className={cn(
                "chunky chunky-press flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-border bg-card p-1.5",
                taken && "opacity-25",
                bad === m && "animate-shake border-alarm bg-alarm/20",
              )}
            >
              <Pill look={pillLookFor(m)} size={choices > 6 ? 40 : 52} />
              <span className="font-display text-[10px] font-black uppercase leading-tight">
                {m}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
