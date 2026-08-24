import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Bed, type BedState } from "./Bed";
import { Nurse } from "./Nurse";
import { MedMatchGame } from "./MedMatchGame";
import { CannulaGame } from "./CannulaGame";
import { playBad, playCallBell, playGood, primeAudio } from "@/lib/sfx";
import {
  ACTION_META,
  EVENTS,
  PATIENT_NAMES,
  SHIFT_MS,
  WARMUP_MS,
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

type Banner = { id: number; title: string; sub: string; good: boolean };

const ACTIONS: ActionKind[] = ["ASSESS", "INTERVENE", "ESCALATE"];

/** bed layout in ward-percentage coords; corridor runs down the middle */
const BED_SLOTS = [
  { x: 0.19, y: 0.17 },
  { x: 0.81, y: 0.17 },
  { x: 0.19, y: 0.5 },
  { x: 0.81, y: 0.5 },
  { x: 0.19, y: 0.83 },
  { x: 0.81, y: 0.83 },
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
  const [manualPause, setManualPause] = useState(false);
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [flash, setFlash] = useState<Record<number, "good" | "bad" | null>>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [combo, setCombo] = useState(0);
  const [stability, setStability] = useState(100);
  const [mini, setMini] = useState<null | "med" | "cannula">(null);
  const [miniLevel, setMiniLevel] = useState(0);

  /* nurse position, fractional coords inside the ward box */
  const wardRef = useRef<HTMLDivElement | null>(null);
  const [nurse, setNurse] = useState({ x: 0.5, y: 0.9 });
  const nurseRef = useRef(nurse);
  nurseRef.current = nurse;
  const [dragging, setDragging] = useState(false);
  const [gliding, setGliding] = useState(false);

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
  const bannerId = useRef(1);
  const [, force] = useState(0);

  const paused = mini !== null || manualPause;

  const finish = useCallback(
    (collapsed: boolean) => {
      if (ended.current) return;
      ended.current = true;
      onEnd({ ...stats.current, collapsed });
    },
    [onEnd],
  );

  const say = useCallback((title: string, sub: string, good: boolean) => {
    const id = bannerId.current++;
    setBanner({ id, title, sub, good });
    setTimeout(() => setBanner((b) => (b && b.id === id ? null : b)), 1500);
  }, []);

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
      setNow(Date.now());
    }
  }, [paused, pausedAt]);

  const elapsed = (pausedAt ?? now) - startRef.current;
  const shiftLeft = Math.max(0, 1 - elapsed / SHIFT_MS);
  const secondsLeft = Math.max(0, Math.ceil((SHIFT_MS - elapsed) / 1000));
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  /* spawner — gentle warm-up, ramps later */
  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      setEvents((cur) => {
        const e = elapsedRef.current;
        const heat =
          e < WARMUP_MS ? 0 : Math.min(1, (e - WARMUP_MS) / (SHIFT_MS - WARMUP_MS));
        const cap = e < WARMUP_MS ? 1 : 2 + Math.round(heat * 2);
        if (cur.length >= Math.min(cap, bedCount)) return cur;
        const free = Array.from({ length: bedCount }, (_, i) => i).filter(
          (b) => !cur.some((ev) => ev.bed === b),
        );
        if (!free.length) return cur;
        if (Math.random() > 0.3 + heat * 0.5) return cur;
        const bed = free[Math.floor(Math.random() * free.length)]!;
        const pool = EVENTS.filter((ev) => (heat > 0.3 ? true : ev.severity < 3));
        const def = pool[Math.floor(Math.random() * pool.length)]!;
        if (def.callBell) playCallBell();
        return [
          ...cur,
          {
            id: uid.current++,
            bed,
            def,
            born: Date.now(),
            ttl:
              def.ttl *
              ttlMult(upgrades) *
              (e < WARMUP_MS ? 1.8 : 1.5 - Math.min(0.55, heat * 0.55)),
          },
        ];
      });
    }, 1100);
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
          say("BARRY GOT IT", "Your HCA is a hero", true);
          continue;
        }
        dmg += (5 + e.def.severity * 5) * damageMult(upgrades);
        stats.current.mistakes++;
        say("TOO SLOW", e.def.fail, false);
      }
      if (dmg) {
        playBad();
        setCombo(0);
        streak.current = 0;
        setStability((s) => Math.max(0, s - dmg));
      }
      if (selected !== null && expired.some((e) => e.bed === selected)) setSelected(null);
    }
    if (shiftLeft <= 0) finish(false);
    if (stability <= 0) finish(true);
  }, [now, events, paused, shiftLeft, stability, upgrades, hasHca, selected, finish, say]);

  const selectedEvent = events.find((e) => e.bed === selected);

  /* ---- movement ---- */
  const nearestBed = useCallback(
    (x: number, y: number) => {
      let best = -1;
      let bd = 1;
      for (let i = 0; i < bedCount; i++) {
        const s = BED_SLOTS[i]!;
        const d = Math.hypot((s.x - x) * 1.1, s.y - y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return bd < 0.2 ? best : -1;
    },
    [bedCount],
  );

  /* auto-select whichever bed the nurse is standing at */
  useEffect(() => {
    const b = nearestBed(nurse.x, nurse.y);
    setSelected(b >= 0 && events.some((e) => e.bed === b) ? b : null);
  }, [nurse, events, nearestBed]);

  function moveFromPointer(clientX: number, clientY: number) {
    const box = wardRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = Math.min(0.94, Math.max(0.06, (clientX - box.left) / box.width));
    const y = Math.min(0.95, Math.max(0.05, (clientY - box.top) / box.height));
    setNurse({ x, y });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (paused) return;
    primeAudio();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setGliding(false);
    setDragging(true);
    moveFromPointer(e.clientX, e.clientY);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || paused) return;
    moveFromPointer(e.clientX, e.clientY);
  }
  function onPointerUp() {
    setDragging(false);
  }

  /** tap-to-bed fallback: glide the nurse over */
  function walkTo(bed: number) {
    if (paused || beds[bed]?.locked) return;
    primeAudio();
    const s = BED_SLOTS[bed]!;
    setGliding(true);
    setNurse({ x: s.x, y: s.y });
    setTimeout(() => setGliding(false), travelMs(upgrades) + 60);
  }

  function doAction(action: ActionKind) {
    const ev = selectedEvent;
    if (!ev || paused) return;
    const correct = ev.def.correct === action;
    setEvents((cur) => cur.filter((e) => e.id !== ev.id));
    setSelected(null);
    setFlash((f) => ({ ...f, [ev.bed]: correct ? "good" : "bad" }));
    setTimeout(() => setFlash((f) => ({ ...f, [ev.bed]: null })), 500);

    stats.current.handled++;
    if (correct) {
      playGood();
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
      say(isTop ? "GREAT CALL!" : "PATIENT STABLE", `+${gain} · ${ev.def.win}`, true);
      streak.current++;
      const gap = streak.current <= 6 ? 2 : 3;
      if (streak.current % gap === 0) {
        const n = stats.current.miniGames;
        stats.current.miniGames = n + 1;
        setMiniLevel(Math.floor(n / 2));
        setMini(n % 2 === 0 ? "med" : "cannula");
      }
    } else {
      playBad();
      setCombo(0);
      streak.current = 0;
      stats.current.mistakes++;
      setStability((s) => Math.max(0, s - 10 * damageMult(upgrades)));
      say("WRONG PRIORITY", `${ev.def.correct} was the move`, false);
    }
    force((n) => n + 1);
  }

  function miniDone(score: number, perfect: boolean) {
    const gain = Math.round(score * payMult(upgrades, staffBonus));
    stats.current.points += gain;
    stats.current.cash += Math.round(gain / 5);
    stats.current.xp += 25;
    say(perfect ? "FLAWLESS!" : "NICE ONE", `+${gain} points`, true);
    setStability((s) => Math.min(100, s + (perfect ? 15 : 6)));
    setMini(null);
  }

  const lowTime = secondsLeft <= 15;

  return (
    <div className="relative flex h-full w-full flex-col bg-[image:var(--gradient-sky)]">
      {/* HUD */}
      <div className="z-10 space-y-2 px-3 pt-2">
        <div className="flex items-stretch gap-2">
          {/* big shift timer */}
          <div
            className={cn(
              "flex flex-1 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-1.5",
              lowTime && "animate-throb border-alarm",
            )}
          >
            <span className="text-2xl leading-none">⏱️</span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-display text-3xl font-black leading-none tabular-nums",
                  lowTime && "text-alarm",
                )}
              >
                {Math.floor(secondsLeft / 60)}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-100 ease-linear",
                    lowTime ? "bg-alarm" : "bg-primary",
                  )}
                  style={{ width: `${shiftLeft * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setManualPause((p) => !p)}
            aria-label={manualPause ? "Resume shift" : "Pause shift"}
            className="chunky chunky-press grid w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl text-secondary-foreground"
          >
            {manualPause ? "▶️" : "⏸️"}
          </button>
        </div>

        <div className="flex items-stretch gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-border bg-card px-2.5 py-1.5">
            <span className="text-xl leading-none">❤️</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Ward stability
              </p>
              <div className="mt-0.5 h-3 overflow-hidden rounded-full bg-muted">
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
          <span className="font-display grid place-items-center rounded-2xl border-2 border-border bg-card px-2 text-sm font-black">
            ⭐{stats.current.points}
          </span>
          <span
            className={cn(
              "font-display grid place-items-center rounded-2xl border-2 border-border px-2 text-sm font-black",
              combo > 2 ? "animate-throb bg-gold text-gold-foreground" : "bg-card",
            )}
          >
            🔥x{combo}
          </span>
        </div>
      </div>

      {/* WARD with wide central corridor */}
      <div
        ref={wardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex-1 touch-none select-none overflow-hidden px-2 py-2"
      >
        {/* corridor floor */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[34%] -translate-x-1/2 rounded-3xl bg-floor shadow-[inset_0_0_0_2px_var(--color-border)]">
          <div className="absolute inset-x-[42%] inset-y-3 rounded-full bg-primary/15" />
          <span className="font-display absolute inset-x-0 bottom-1 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            corridor · drag me
          </span>
        </div>

        {/* beds pinned each side of the corridor */}
        {beds.map((b) => {
          const slot = BED_SLOTS[b.id]!;
          const ev = events.find((e) => e.bed === b.id);
          const here = nearestBed(nurse.x, nurse.y) === b.id;
          return (
            <div
              key={b.id}
              className="absolute h-[29%] w-[31%]"
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                transform: "translate(-50%,-50%)",
              }}
            >
              <Bed
                bed={b}
                event={ev?.def}
                progress={ev ? 1 - (now - ev.born) / ev.ttl : 0}
                flash={flash[b.id] ?? null}
                active={selected === b.id}
                nurseHere={here}
                onTap={() => walkTo(b.id)}
              />
            </div>
          );
        })}

        {/* nurse */}
        <div
          className={cn(
            "pointer-events-none absolute z-20 h-16 w-12",
            gliding && "transition-all ease-out",
            dragging && "scale-110",
          )}
          style={{
            left: `${nurse.x * 100}%`,
            top: `${nurse.y * 100}%`,
            transform: "translate(-50%,-60%)",
            transitionDuration: gliding ? `${travelMs(upgrades)}ms` : undefined,
          }}
        >
          <Nurse moving={dragging || gliding} />
        </div>

        {/* BIG feedback banner */}
        {banner && (
          <div className="pointer-events-none absolute inset-x-2 top-[38%] z-30 flex justify-center">
            <div
              className={cn(
                "rounded-3xl border-4 px-5 py-3 text-center shadow-2xl",
                "animate-[banner-in_0.35s_cubic-bezier(0.34,1.56,0.64,1)]",
                banner.good
                  ? "border-calm-foreground/20 bg-calm text-calm-foreground"
                  : "border-alarm-foreground/20 bg-alarm text-alarm-foreground",
              )}
            >
              <p className="font-display text-3xl font-black uppercase leading-none">
                {banner.title}
              </p>
              <p className="font-display mt-1 text-sm font-bold">{banner.sub}</p>
            </div>
          </div>
        )}

        {/* pause veil */}
        {manualPause && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
            <p className="font-display text-4xl font-black uppercase">Paused</p>
            <p className="text-sm text-muted-foreground">Tea break. Nothing is ticking.</p>
            <button
              onClick={() => setManualPause(false)}
              className="chunky chunky-press rounded-2xl bg-primary px-8 py-4 font-display text-xl font-black uppercase text-primary-foreground"
            >
              Resume ▶
            </button>
          </div>
        )}
      </div>

      {/* action bar */}
      <div className="z-10 rounded-t-3xl border-t-2 border-border bg-card px-3 pb-4 pt-3 shadow-[0_-10px_24px_-16px_oklch(0_0_0/0.5)]">
        {selectedEvent ? (
          <div className="animate-slide-up space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedEvent.def.icon}</span>
              <div className="min-w-0">
                <p className="font-display truncate text-sm font-black uppercase">
                  {beds[selectedEvent.bed]?.name} — {selectedEvent.def.label}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {selectedEvent.def.brief}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => doAction(a)}
                  className={cn(
                    "chunky chunky-press flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-primary-foreground",
                    ACTION_META[a].color,
                  )}
                >
                  <span className="text-xl leading-none">{ACTION_META[a].icon}</span>
                  <span className="font-display text-[11px] font-black">{a}</span>
                  <span className="text-[9px] font-bold leading-tight opacity-90">
                    {selectedEvent.def.options[a]}
                  </span>
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
                Drag your nurse down the corridor to a flashing bay.
              </p>
            </div>
          </div>
        )}
      </div>

      {mini === "med" && <MedMatchGame level={miniLevel} onDone={miniDone} />}
      {mini === "cannula" && <CannulaGame level={miniLevel} onDone={miniDone} />}
    </div>
  );
}
