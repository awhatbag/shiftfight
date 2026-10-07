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
  const [jiggle, setJiggle] = useState(0);
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
      const cx = cup ? cup.left + cup.width / 2 : 0;
      const cy = cup ? cup.top + cup.height * 0.3 : 0;
      setFlying((f) => [
        ...f,
        { id, name, from: { x: box.left + box.width / 2 - cx, y: box.top + box.height / 2 - cy } },
      ]);
      setTimeout(() => {
        setFlying((f) => f.filter((x) => x.id !== id));
        setJiggle((j) => j + 1);
      }, 550);
      const next = step + 1;
      setStep(next);
      if (next >= round.order.length) setTimeout(() => finish(true), 1000);
    } else {
      playBad();
      setWrong((w) => w + 1);
      setBad(name);
      setTimeout(() => setBad(null), 320);
    }
  }

  const current = round.order[step];
  const landed = round.order.slice(0, Math.max(0, step - flying.length)).map(pillLookFor);

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3 pb-[104px]">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-3xl font-black leading-none">MED TROLLEY DASH</h2>
        <p className="text-sm text-muted-foreground">Tap the pills in chart order. Fictional meds only!</p>
      </div>

      <div className="h-4 overflow-hidden rounded-sm border-2 border-foreground/60 bg-muted">
        <div
          className={cn("h-full transition-[width] duration-75 ease-linear", time < 0.3 ? "bg-alarm" : "bg-calm")}
          style={{ width: `${Math.max(0, time) * 100}%` }}
        />
      </div>

      {/* Medication order chart (top) */}
      <div className="rounded-md border-[3px] border-foreground/70 bg-card p-2.5 shadow-[var(--shadow-pop)]">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Medication order · next on chart
        </p>
        <p className="font-display truncate text-3xl font-black leading-tight text-primary">
          {current ? current : "DONE!"}
        </p>
        <div className="mt-1.5 flex gap-1">
          {round.order.map((m, i) => (
            <span
              key={m}
              className={cn("h-2.5 flex-1 rounded-sm", i < step ? "bg-calm" : i === step ? "bg-gold" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      {/* Pills (middle) */}
      <div className={cn("grid flex-1 content-center gap-2", choices > 6 ? "grid-cols-4" : "grid-cols-3")}>
        {round.pool.map((m) => {
          const taken = round.order.indexOf(m) > -1 && round.order.indexOf(m) < step;
          return (
            <button
              key={m}
              onClick={(e) => tapCup(m, e.currentTarget)}
              disabled={taken}
              className={cn(
                "chunky chunky-press flex flex-col items-center justify-center gap-1 rounded-md border-[3px] border-border bg-card p-1.5",
                taken && "opacity-25",
                bad === m && "animate-shake border-alarm bg-alarm/20",
              )}
            >
              <span className={cn(taken && "invisible")}>
                <Pill look={pillLookFor(m)} size={choices > 6 ? 56 : 72} />
              </span>
              <span className="font-display text-sm font-black uppercase leading-tight">{m}</span>
            </button>
          );
        })}
      </div>

      {/* Medicine cup (bottom) */}
      <div className="flex justify-center">
        <div ref={cupRef} className="relative">
          <div key={jiggle} className={cn(jiggle > 0 && "cup-jiggle")}>
            <PillCup filled={step} label={`${step}/${round.order.length}`} looks={landed} size={120} />
          </div>
          {flying.map((f) => (
            <span
              key={f.id}
              className="pointer-events-none absolute left-1/2 top-[30%] z-40"
              style={{
                animation: "pill-fly 0.55s linear forwards",
                // @ts-expect-error custom props
                "--fx": `${f.from.x}px`,
                "--fy": `${f.from.y}px`,
              }}
            >
              <Pill look={pillLookFor(f.name)} size={56} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
