import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Bed, type BedState } from "./Bed";
import { Nurse } from "./Nurse";
import { MedMatchGame } from "./MedMatchGame";
import { CannulaGame } from "./CannulaGame";
import {
  EVENTS,
  PATIENT_NAMES,
  SHIFT_MS,
  damageMult,
  payMult,
  travelMs,
  ttlMult,
  type ActionKind,
  type EventDef,
  type Upgrades,
} from "@/game/config";

export type ShiftStats = {
  points: number;
  cash: number;
  xp: number;
  helped: number;
  handled: number;
  mistakes: number;
  callBells: number;
  maxCombo: number;
  miniGames: number;
  collapsed: boolean;
};

type ActiveEvent = {
  id: number;
  bed: number;
  def: EventDef;
  born: number;
  ttl: number;
};

type Toast = { id: number; text: string; good: boolean };

const ACTIONS: { key: ActionKind; icon: string; hint: string }[] = [
  { key: "ASSESS", icon: "👀", hint: "look & reassure" },
  { key: "INTERVENE", icon: "💪", hint: "do the thing" },
  { key: "ESCALATE", icon: "📟", hint: "get help fast" },
];

export function WardScreen({
  upgrades,
  bedCount,
  staffBonus,
  hasHca,
  onEnd,
}: {
  upgrades: Upgrades;
  bedCount: number;
  staffBonus: number;
  hasHca: boolean;
  onEnd: (s: ShiftStats) => void;
}) {
  const beds: BedState[] = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    name: PATIENT_NAMES[i] ?? `Bay ${i + 1}`,
    locked: i >= bedCount,
  }));

  const [now, setNow] = useState(Date.now());
  const startRef = useRef(Date.now());
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [nurseBed, setNurseBed] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [flash, setFlash] = useState<Record<number, "good" | "bad" | null>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [combo, setCombo] = useState(0);
  const [stability, setStability] = useState(100);
  const [mini, setMini] = useState<null | "med" | "cannula">(null);
  const stats = useRef<ShiftStats>({
    points: 0,
    cash: 0,
    xp: 0,
    helped: 0,
    handled: 0,
    mistakes: 0,
    callBells: 0,
    maxCombo: 0,
    miniGames: 0,
    collapsed: false,
  });
  const streak = useRef(0);
  const hcaUsed = useRef(false);
  const uid = useRef(1);
  const ended = useRef(false);
  const [, force] = useState(0);

  const paused = mini !== null;

  const finish = useCallback(
    (collapsed: boolean) => {
      if (ended.current) return;
      ended.current = true;
      onEnd({ ...stats.current, collapsed });
    },
    [onEnd],
  );

  const say = (text: string, good: boolean) => {
    const id = uid.current++;
    setToasts((t) => [...t.slice(-2), { id, text, good }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 900);
  };

  /* clock */
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedAt === null) setNow(Date.now());
    }, 80);
    return () => clearInterval(id);
  }, [pausedAt]);

  /* pause handling */
  useEffect(() => {
    if (paused && pausedAt === null) setPausedAt(Date.now());
    if (!paused && pausedAt !== null) {
      const delta = Date.now() - pausedAt;
      startRef.current += delta;
      setEvents((evs) => evs.map((e) => ({ ...e, born: e.born + delta })));
      setPausedAt(null);
    }
  }, [paused, pausedAt]);

  const elapsed = (pausedAt ?? now) - startRef.current;
  const shiftLeft = Math.max(0, 1 - elapsed / SHIFT_MS);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  /* spawner */
  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      setEvents((cur) => {
        const heat = Math.min(1, elapsedRef.current / SHIFT_MS);
        const cap = 2 + Math.round(heat * 2);
        if (cur.length >= Math.min(cap, bedCount)) return cur;
        const free = Array.from({ length: bedCount }, (_, i) => i).filter(
          (b) => !cur.some((e) => e.bed === b),
        );
        if (!free.length) return cur;
        if (Math.random() > 0.5 + heat * 0.3) return cur;
        const bed = free[Math.floor(Math.random() * free.length)]!;
        const pool = EVENTS.filter((e) => (heat > 0.25 ? true : e.severity < 3));
        const def = pool[Math.floor(Math.random() * pool.length)]!;
        return [
          ...cur,
          {
            id: uid.current++,
            bed,
            def,
            born: Date.now(),
            ttl: def.ttl * ttlMult(upgrades) * (1 - Math.min(0.3, heat * 0.3)),
          },
        ];
      });
    }, 850);
    return () => clearInterval(tick);
  }, [paused, bedCount, upgrades]);


  /* expiry + shift end */
  useEffect(() => {
    if (paused || ended.current) return;
    const expired = events.filter((e) => now - e.born > e.ttl);
    if (expired.length) {
      setEvents((cur) => cur.filter((e) => !expired.some((x) => x.id === e.id)));
      let dmg = 0;
      for (const e of expired) {
        if (hasHca && e.def.callBell && !hcaUsed.current) {
          hcaUsed.current = true;
          stats.current.callBells++;
          stats.current.handled++;
          say("Barry got it 🧹", true);
          continue;
        }
        dmg += (5 + e.def.severity * 5) * damageMult(upgrades);
        stats.current.mistakes++;
        say(e.def.fail, false);
      }
      if (dmg) {
        setCombo(0);
        streak.current = 0;
        setStability((s) => Math.max(0, s - dmg));
      }
      if (selected !== null && expired.some((e) => e.bed === selected)) setSelected(null);
    }
    if (shiftLeft <= 0) finish(false);
    if (stability <= 0) finish(true);
  }, [now, events, paused, shiftLeft, stability, upgrades, hasHca, selected, finish]);

  const selectedEvent = events.find((e) => e.bed === selected);

  function tapBed(bed: number) {
    if (paused || beds[bed]?.locked) return;
    const ev = events.find((e) => e.bed === bed);
    setMoving(true);
    setNurseBed(bed);
    setTimeout(() => setMoving(false), travelMs(upgrades));
    if (!ev) {
      setSelected(null);
      return;
    }
    setTimeout(() => setSelected(bed), travelMs(upgrades));
  }

  function doAction(action: ActionKind) {
    const ev = selectedEvent;
    if (!ev) return;
    const correct = ev.def.correct === action;
    setEvents((cur) => cur.filter((e) => e.id !== ev.id));
    setSelected(null);
    setFlash((f) => ({ ...f, [ev.bed]: correct ? "good" : "bad" }));
    setTimeout(() => setFlash((f) => ({ ...f, [ev.bed]: null })), 450);

    stats.current.handled++;
    if (correct) {
      const isTop = !events.some((e) => e.id !== ev.id && e.def.severity > ev.def.severity);
      const newCombo = combo + 1;
      setCombo(newCombo);
      stats.current.maxCombo = Math.max(stats.current.maxCombo, newCombo);
      const base = 40 * ev.def.severity * (isTop ? 1.5 : 1);
      const gain = Math.round(base * (1 + newCombo * 0.12) * payMult(upgrades, staffBonus));
      stats.current.points += gain;
      stats.current.cash += Math.round(gain / 6);
      stats.current.xp += 8 * ev.def.severity;
      stats.current.helped++;
      if (ev.def.callBell) stats.current.callBells++;
      setStability((s) => Math.min(100, s + 3));
      say(`${isTop ? "PRIORITY! " : ""}+${gain} ${ev.def.win}`, true);
      streak.current++;
      if (streak.current % 4 === 0) {
        stats.current.miniGames++;
        setMini(stats.current.miniGames % 2 === 1 ? "med" : "cannula");
      }
    } else {
      setCombo(0);
      streak.current = 0;
      stats.current.mistakes++;
      setStability((s) => Math.max(0, s - 10 * damageMult(upgrades)));
      say(`Wrong call! ${ev.def.correct} was it`, false);
    }
    force((n) => n + 1);
  }

  function miniDone(score: number, perfect: boolean) {
    const gain = Math.round(score * payMult(upgrades, staffBonus));
    stats.current.points += gain;
    stats.current.cash += Math.round(gain / 5);
    stats.current.xp += 25;
    say(perfect ? `FLAWLESS +${gain}` : `+${gain}`, true);
    setStability((s) => Math.min(100, s + (perfect ? 15 : 6)));
    setMini(null);
  }

  const nurseCol = nurseBed === null ? 0.5 : nurseBed % 2 === 0 ? 0.28 : 0.78;
  const nurseRow = nurseBed === null ? 0.93 : (Math.floor(nurseBed / 2) + 0.72) / 3.35;

  return (
    <div className="relative flex h-full w-full flex-col bg-[image:var(--gradient-sky)]">
      {/* HUD */}
      <div className="z-10 space-y-1.5 px-3 pt-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-display shrink-0 rounded-lg bg-card px-2 py-1 text-sm font-black">
              ⭐ {stats.current.points}
            </span>
            <span className="font-display shrink-0 rounded-lg bg-card px-2 py-1 text-sm font-black text-gold-foreground">
              💷 {stats.current.cash}
            </span>
          </div>
          <span
            className={cn(
              "font-display shrink-0 rounded-lg px-2 py-1 text-sm font-black",
              combo > 2 ? "animate-throb bg-gold text-gold-foreground" : "bg-card",
            )}
          >
            🔥 x{combo}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display w-10 shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
            Shift
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
              style={{ width: `${shiftLeft * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display w-10 shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
            Ward
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-200",
                stability > 55 ? "bg-calm" : stability > 25 ? "bg-gold" : "bg-alarm",
              )}
              style={{ width: `${stability}%` }}
            />
          </div>
        </div>
      </div>

      {/* WARD */}
      <div className="relative flex-1 px-3 py-3">
        <div className="grid h-full grid-cols-2 grid-rows-[1fr_1fr_1fr] gap-2.5">
          {beds.map((b) => {
            const ev = events.find((e) => e.bed === b.id);
            return (
              <Bed
                key={b.id}
                bed={b}
                event={ev?.def}
                progress={ev ? 1 - (now - ev.born) / ev.ttl : 0}
                flash={flash[b.id] ?? null}
                active={selected === b.id}
                onTap={() => tapBed(b.id)}
              />
            );
          })}
        </div>

        {/* nurse */}
        <div
          className="pointer-events-none absolute h-14 w-11 transition-all ease-out"
          style={{
            left: `${nurseCol * 100}%`,
            top: `${nurseRow * 100}%`,
            transform: "translate(-50%,-50%)",
            transitionDuration: `${travelMs(upgrades)}ms`,
          }}
        >
          <Nurse moving={moving} />
        </div>

        {/* toasts */}
        <div className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center gap-1">
          {toasts.map((t) => (
            <span
              key={t.id}
              className={cn(
                "font-display animate-rise rounded-full px-3 py-1 text-xs font-black shadow-[var(--shadow-card)]",
                t.good ? "bg-calm text-calm-foreground" : "bg-alarm text-alarm-foreground",
              )}
            >
              {t.text}
            </span>
          ))}
        </div>
      </div>

      {/* station / action bar */}
      <div className="z-10 rounded-t-3xl border-t-2 border-border bg-card px-3 pb-4 pt-3 shadow-[0_-10px_24px_-16px_oklch(0_0_0/0.5)]">
        {selectedEvent ? (
          <div className="animate-slide-up space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedEvent.def.icon}</span>
              <div className="min-w-0">
                <p className="font-display truncate text-sm font-black uppercase">
                  {beds[selectedEvent.bed]?.name} — {selectedEvent.def.label}
                </p>
                <p className="text-[11px] text-muted-foreground">Pick your move, fast.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => doAction(a.key)}
                  className="chunky chunky-press flex flex-col items-center gap-0.5 rounded-2xl bg-primary px-1 py-2.5 text-primary-foreground"
                >
                  <span className="text-xl leading-none">{a.icon}</span>
                  <span className="font-display text-[11px] font-black">{a.key}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-xl">
              🖥️
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-black uppercase">Nurses station</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Tap the bed that needs you most.
              </p>
            </div>
          </div>
        )}
      </div>

      {mini === "med" && <MedMatchGame onDone={miniDone} />}
      {mini === "cannula" && <CannulaGame onDone={miniDone} />}
    </div>
  );
}
