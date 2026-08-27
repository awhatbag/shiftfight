import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Bed, type BedState } from "./Bed";
import { Nurse } from "./Nurse";
import { MedMatchGame } from "./MedMatchGame";
import { CannulaGame } from "./CannulaGame";
import {
  buzz,
  playBad,
  playCallBell,
  playGood,
  playRoundBells,
  playWhistle,
  primeAudio,
} from "@/lib/sfx";
import {
  ACTION_META,
  EVENTS,
  PATIENT_NAMES,
  SHIFT_MS,
  STAFF,
  STAFF_BEHAVIOUR,
  URGENCY_META,
  damageMult,
  levelConfig,
  payMult,
  rollQuirks,
  ttlMult,
  urgencyOf,
  type ActionKind,
  type EventDef,
  type Quirk,
  type Upgrades,
} from "@/game/config";

export type ShiftStats = {
  level: number;
  points: number;
  cash: number;
  xp: number;
  helped: number;
  handled: number;
  mistakes: number;
  callBells: number;
  maxCombo: number;
  miniGames: number;
  staffAssists: number;
  steps: number;
  quirks: Quirk[];
  collapsed: boolean;
};

type ActiveEvent = {
  id: number;
  bed: number;
  def: EventDef;
  born: number; // game-time ms
  ttl: number;
};

type Banner = { id: number; title: string; sub: string; good: boolean };
type Point = { x: number; y: number };

const ACTIONS: ActionKind[] = ["ASSESS", "INTERVENE", "ESCALATE"];

/** bed layout in ward-percentage coords; corridor runs down the middle */
const BED_SLOTS: Point[] = [
  { x: 0.16, y: 0.16 },
  { x: 0.84, y: 0.16 },
  { x: 0.16, y: 0.47 },
  { x: 0.84, y: 0.47 },
  { x: 0.16, y: 0.76 },
  { x: 0.84, y: 0.76 },
];

const STATION: Point = { x: 0.5, y: 0.94 };

/** curtain sections in the corridor the nurse must walk around */
const GATES = [
  { y: 0.31, side: "left" as const, lane: 0.6 },
  { y: 0.62, side: "right" as const, lane: 0.4 },
];

const MS_PER_UNIT = (u: Upgrades) => Math.max(620, 1500 - u.speed * 230);

export function WardScreen({
  level,
  upgrades,
  bedCount,
  staffBonus,
  staff,
  soundOn,
  hapticsOn,
  onToggleSound,
  onToggleHaptics,
  onEnd,
}: {
  level: number;
  upgrades: Upgrades;
  bedCount: number;
  staffBonus: number;
  staff: string[];
  soundOn: boolean;
  hapticsOn: boolean;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onEnd: (s: ShiftStats) => void;
}) {
  const cfg = useMemo(() => levelConfig(level), [level]);
  const activeBeds = Math.min(bedCount, cfg.beds);

  const beds: BedState[] = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    name: PATIENT_NAMES[i] ?? `Bay ${i + 1}`,
    locked: i >= activeBeds,
  }));

  /* ---------------- phases ---------------- */
  type Phase = "ready" | "play" | "ending";
  const [phase, setPhase] = useState<Phase>("ready");
  const [cue, setCue] = useState<string>("READY...");
  const [endCount, setEndCount] = useState(3);

  const [manualPause, setManualPause] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [flash, setFlash] = useState<Record<number, "good" | "bad" | null>>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [combo, setCombo] = useState(0);
  const [stability, setStability] = useState(100);

  /* mini-game state */
  const [miniOffer, setMiniOffer] = useState<null | {
    kind: "med" | "cannula";
    bonus: number;
    lvl: number;
  }>(null);
  const [mini, setMini] = useState<null | { kind: "med" | "cannula"; lvl: number }>(null);

  /* nurse */
  const wardRef = useRef<HTMLDivElement | null>(null);
  const [nurse, setNurse] = useState<Point>({ ...STATION });
  const [walking, setWalking] = useState(false);
  const nurseRef = useRef<Point>({ ...STATION });
  const journey = useRef<Point[]>([]);
  const journeyBed = useRef<number | null>(null);
  const lastMoveT = useRef(0);
  const [atBed, setAtBed] = useState<number | null>(null);

  const stats = useRef<ShiftStats>({
    level,
    points: 0,
    cash: 0,
    xp: 0,
    helped: 0,
    handled: 0,
    mistakes: 0,
    callBells: 0,
    maxCombo: 0,
    miniGames: 0,
    staffAssists: 0,
    steps: 0,
    quirks: [],
    collapsed: false,
  });
  const streak = useRef(0);
  const uid = useRef(1);
  const ended = useRef(false);
  const bannerId = useRef(1);
  const [, force] = useState(0);

  /* staff readiness (real-time cooldown clocks in game ms) */
  const staffBusy = useRef<Record<string, number>>({});
  const [staffFlash, setStaffFlash] = useState<string | null>(null);

  const rate = manualPause || settingsOpen || phase !== "play" || miniOffer ? 0 : mini ? 1 / 3 : 1;
  const rateRef = useRef(rate);
  rateRef.current = rate;

  /* ---------------- game clock ---------------- */
  const gameT = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(250, now - last);
      last = now;
      if (rateRef.current > 0) {
        gameT.current += dt * rateRef.current;
        setTick((t) => t + 1);
      }
    }, 70);
    return () => window.clearInterval(id);
  }, []);

  /* ---------------- start sequence ---------------- */
  useEffect(() => {
    primeAudio();
    playRoundBells();
    const t1 = window.setTimeout(() => setCue("SET..."), 800);
    const t2 = window.setTimeout(() => setCue("SHIFT FIGHT!"), 1600);
    const t3 = window.setTimeout(() => {
      setPhase("play");
      setCue("");
    }, 2500);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, []);

  const say = useCallback((title: string, sub: string, good: boolean) => {
    const id = bannerId.current++;
    setBanner({ id, title, sub, good });
    window.setTimeout(() => setBanner((b) => (b && b.id === id ? null : b)), 1500);
  }, []);

  const finish = useCallback(
    (collapsed: boolean) => {
      if (ended.current) return;
      ended.current = true;
      stats.current.collapsed = collapsed;
      stats.current.quirks = rollQuirks(3);
      stats.current.points = Math.max(
        0,
        stats.current.points + stats.current.quirks.reduce((a, q) => a + q.pts, 0),
      );
      playWhistle();
      onEnd({ ...stats.current });
    },
    [onEnd],
  );

  const elapsed = Math.min(SHIFT_MS, gameT.current);
  const shiftLeft = Math.max(0, 1 - elapsed / SHIFT_MS);
  const secondsLeft = Math.max(0, Math.ceil((SHIFT_MS - elapsed) / 1000));

  /* ---------------- ending sequence ---------------- */
  useEffect(() => {
    if (phase !== "play") return;
    if (elapsed < SHIFT_MS) return;
    setPhase("ending");
  }, [phase, elapsed]);

  useEffect(() => {
    if (stability <= 0 && phase === "play") {
      stats.current.collapsed = true;
      setPhase("ending");
    }
    return undefined;
  }, [stability, phase, finish]);

  useEffect(() => {
    if (phase !== "ending") return;
    setEndCount(3);
    const t1 = window.setTimeout(() => setEndCount(2), 700);
    const t2 = window.setTimeout(() => setEndCount(1), 1400);
    const t3 = window.setTimeout(() => finish(stats.current.collapsed), 2200);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, [phase, finish]);

  /* ---------------- spawner ---------------- */
  useEffect(() => {
    if (rate === 0) return;
    const id = window.setInterval(() => {
      setEvents((cur) => {
        const heat = Math.min(1, gameT.current / SHIFT_MS);
        if (cur.length >= Math.min(cfg.maxEvents, activeBeds)) return cur;
        const free = Array.from({ length: activeBeds }, (_, i) => i).filter(
          (b) => !cur.some((ev) => ev.bed === b),
        );
        if (!free.length) return cur;
        if (Math.random() > cfg.spawnChance * (0.7 + heat * 0.5)) return cur;
        const bed = free[Math.floor(Math.random() * free.length)]!;
        const pool = EVENTS.filter((ev) => ev.severity <= cfg.maxSeverity);
        const def = pool[Math.floor(Math.random() * pool.length)]!;
        if (def.callBell) playCallBell();
        const u = URGENCY_META[urgencyOf(def)];
        return [
          ...cur,
          {
            id: uid.current++,
            bed,
            def,
            born: gameT.current,
            ttl:
              def.ttl *
              ttlMult(upgrades) *
              u.mult *
              cfg.timeMult *
              (1 - heat * 0.18),
          },
        ];
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, [rate, activeBeds, cfg, upgrades]);

  /* ---------------- staff auto-response ---------------- */
  useEffect(() => {
    if (rate === 0 || !staff.length || !events.length) return;
    for (const key of staff) {
      const b = STAFF_BEHAVIOUR[key];
      if (!b) continue;
      if ((staffBusy.current[key] ?? 0) > gameT.current) continue;
      const target = events.find((e) => {
        const age = gameT.current - e.born;
        if (age < b.responseMs) return false;
        return b.handles === "any" ? true : e.def.callBell || e.def.severity === 3;
      });
      if (!target) continue;
      staffBusy.current[key] = gameT.current + b.cooldownMs;
      setEvents((cur) => cur.filter((e) => e.id !== target.id));
      const gain = Math.round(18 * target.def.severity * payMult(upgrades, staffBonus));
      stats.current.points += gain;
      stats.current.cash += Math.round(gain / 8);
      stats.current.handled++;
      stats.current.staffAssists++;
      if (target.def.callBell) stats.current.callBells++;
      setStaffFlash(key);
      window.setTimeout(() => setStaffFlash((s) => (s === key ? null : s)), 900);
      say("TEAMWORK", `${b.line} +${gain}`, true);
      force((n) => n + 1);
      break;
    }
  }, [tick, rate, staff, events, upgrades, staffBonus, say]);

  /* ---------------- expiry ---------------- */
  useEffect(() => {
    if (rate === 0 || ended.current) return;
    const expired = events.filter((e) => gameT.current - e.born > e.ttl);
    if (!expired.length) return;
    setEvents((cur) => cur.filter((e) => !expired.some((x) => x.id === e.id)));
    let dmg = 0;
    for (const e of expired) {
      dmg += (5 + e.def.severity * 5) * damageMult(upgrades) * cfg.damage;
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
  }, [tick, rate, events, upgrades, cfg, selected, say]);

  const selectedEvent = events.find((e) => e.bed === selected);
  const nurseHereBed = atBed;

  /* ---------------- movement ---------------- */
  const routeTo = useCallback(
    (dest: Point, from: Point): Point[] => {
      const pts: Point[] = [];
      const lane = 0.5;
      if (Math.abs(from.x - lane) > 0.04) pts.push({ x: lane, y: from.y });
      const y0 = from.y;
      const y1 = dest.y;
      const gates = GATES.filter(
        (g) => g.y > Math.min(y0, y1) && g.y < Math.max(y0, y1),
      ).sort((a, b) => (y1 > y0 ? a.y - b.y : b.y - a.y));
      for (const g of gates) {
        pts.push({ x: g.lane, y: g.y - 0.05 * (y1 > y0 ? 1 : -1) });
        pts.push({ x: g.lane, y: g.y + 0.05 * (y1 > y0 ? 1 : -1) });
      }
      pts.push({ x: lane, y: dest.y });
      pts.push(dest);
      return pts;
    },
    [],
  );

  const walkTo = useCallback(
    (dest: Point, bed: number | null) => {
      setAtBed(null);
      journey.current = routeTo(dest, nurseRef.current);
      journeyBed.current = bed;
      lastMoveT.current = gameT.current;
      setWalking(true);
    },
    [routeTo],
  );

  useEffect(() => {
    if (rate === 0 || !journey.current.length) return;
    let remaining = (gameT.current - lastMoveT.current) / MS_PER_UNIT(upgrades);
    lastMoveT.current = gameT.current;
    let current = nurseRef.current;
    while (remaining > 0 && journey.current.length) {
      const target = journey.current[0];
      if (!target) break;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const distance = Math.hypot(dx * 0.8, dy);
      if (distance <= remaining) {
        current = target;
        journey.current.shift();
        remaining -= distance;
      } else {
        const ratio = remaining / distance;
        current = { x: current.x + dx * ratio, y: current.y + dy * ratio };
        remaining = 0;
      }
    }
    nurseRef.current = current;
    setNurse(current);
    stats.current.steps++;
    if (!journey.current.length) {
      setWalking(false);
      setAtBed(journeyBed.current);
    }
  }, [tick, rate, upgrades]);

  function tapBed(bed: number) {
    if (rate === 0 || beds[bed]?.locked) return;
    primeAudio();
    buzz(10);
    setSelected(bed);
    walkTo(BED_SLOTS[bed]!, bed);
  }

  function goStation() {
    if (rate === 0) return;
    setSelected(null);
    walkTo(STATION, null);
  }

  /* ---------------- actions ---------------- */
  function doAction(action: ActionKind) {
    const ev = selectedEvent;
    if (!ev || rate === 0 || nurseHereBed !== ev.bed) return;
    const correct = ev.def.correct === action;
    setEvents((cur) => cur.filter((e) => e.id !== ev.id));
    setSelected(null);
    setFlash((f) => ({ ...f, [ev.bed]: correct ? "good" : "bad" }));
    window.setTimeout(() => setFlash((f) => ({ ...f, [ev.bed]: null })), 500);

    stats.current.handled++;
    if (correct) {
      playGood();
      const isTop = !events.some(
        (e) => e.id !== ev.id && e.def.severity > ev.def.severity,
      );
      const newCombo = combo + 1;
      setCombo(newCombo);
      stats.current.maxCombo = Math.max(stats.current.maxCombo, newCombo);
      const base = 40 * ev.def.severity * (isTop ? 1.5 : 1);
      const gain = Math.round(
        base * (1 + newCombo * 0.12) * payMult(upgrades, staffBonus) * (1 + level * 0.05),
      );
      stats.current.points += gain;
      stats.current.cash += Math.round(gain / 6);
      stats.current.xp += 8 * ev.def.severity;
      stats.current.helped++;
      if (ev.def.callBell) stats.current.callBells++;
      setStability((s) => Math.min(100, s + 3));
      say(isTop ? "GREAT CALL!" : "PATIENT STABLE", `+${gain} · ${ev.def.win}`, true);
      streak.current++;
      const gap = streak.current <= 8 ? 4 : 5;
      if (streak.current % gap === 0) {
        const n = stats.current.miniGames;
        const lvl = Math.min(9, Math.floor(n / 2) + Math.floor(level / 3));
        setMiniOffer({
          kind: n % 2 === 0 ? "med" : "cannula",
          bonus: 120 + lvl * 40 + level * 15,
          lvl,
        });
      }
    } else {
      playBad();
      setCombo(0);
      streak.current = 0;
      stats.current.mistakes++;
      setStability((s) => Math.max(0, s - 10 * damageMult(upgrades) * cfg.damage));
      say("WRONG PRIORITY", `${ev.def.correct} was the move`, false);
    }
    force((n) => n + 1);
  }

  function startMini() {
    if (!miniOffer) return;
    stats.current.miniGames++;
    setMini({ kind: miniOffer.kind, lvl: miniOffer.lvl });
    setMiniOffer(null);
  }

  function miniDone(score: number, perfect: boolean) {
    const bonus = Math.round(score * payMult(upgrades, staffBonus));
    stats.current.points += bonus;
    stats.current.cash += Math.round(bonus / 5);
    stats.current.xp += 25;
    say(perfect ? "FLAWLESS!" : "BONUS BANKED", `+${bonus} points`, true);
    setStability((s) => Math.min(100, s + (perfect ? 15 : 6)));
    setMini(null);
  }

  function abandonMini() {
    setMini(null);
    say("ABANDONED", "No bonus, no harm. Back to the ward.", false);
  }

  const lowTime = secondsLeft <= 15;

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col bg-[image:var(--gradient-sky)]",
        (manualPause || settingsOpen) && "game-frozen",
      )}
    >
      {/* HUD */}
      <div className="z-10 space-y-2 px-3 pt-2">
        <div className="flex items-stretch gap-2">
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
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
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
            className="chunky chunky-press grid w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl text-secondary-foreground"
          >
            {manualPause ? "▶️" : "⏸️"}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="chunky chunky-press grid w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl text-secondary-foreground"
          >
            ⚙️
          </button>
        </div>

        <div className="flex items-stretch gap-2">
          <span className="font-display grid shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-gold)] px-2 text-xs font-black uppercase text-gold-foreground">
            Lv {cfg.level}
          </span>
          <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-border bg-card px-2.5 py-1.5">
            <span className="text-xl leading-none">❤️</span>
            <div className="min-w-0 flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
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

      {/* WARD */}
      <div ref={wardRef} className="relative flex-1 select-none overflow-hidden px-1 py-2">
        {/* wide corridor floor */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[46%] -translate-x-1/2 rounded-3xl bg-floor shadow-[inset_0_0_0_2px_var(--color-border)]">
          <div className="absolute inset-x-[46%] inset-y-3 rounded-full bg-primary/10" />
        </div>

        {/* curtain obstacles */}
        {GATES.map((g) => (
          <div
            key={g.y}
            className="pointer-events-none absolute h-[8%] w-[22%] rounded-xl bg-[repeating-linear-gradient(90deg,var(--color-sheet)_0_6px,var(--color-linen)_6px_12px)] shadow-[inset_0_0_0_2px_var(--color-border)]"
            style={{
              top: `${g.y * 100}%`,
              left: g.side === "left" ? "29%" : "49%",
              transform: "translateY(-50%)",
            }}
          />
        ))}

        {/* nurses station desk */}
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2">
          <div className="rounded-xl border-2 border-border bg-card px-4 py-1 text-center">
            <p className="font-display text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Station
            </p>
            {staff.length === 0 && <span className="text-lg opacity-40">🪑</span>}
          </div>
        </div>

        {/* staff characters */}
        {staff.map((k) => {
          const info = STAFF.find((s) => s.key === k);
          const rt = staffRt.current[k];
          const pos = staffPos[k] ?? staffHome(k);
          const onJob = !!rt && (rt.eventId !== null || rt.path.length > 0);
          const activated = !onJob && redAlert;
          return (
            <button
              key={k}
              onClick={() => tapStaff(k)}
              aria-label={`Send ${info?.name ?? "staff"}`}
              className="absolute z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
              style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
            >
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card text-xl shadow-md",
                  onJob && "animate-throb border-primary",
                  activated && "animate-throb border-alarm ring-4 ring-alarm/40",
                  staffFlash === k && "animate-pop",
                )}
              >
                {info?.icon ?? "🧑‍⚕️"}
              </span>
            </button>
          );
        })}

        {/* beds */}
        {beds.map((b) => {
          const slot = BED_SLOTS[b.id]!;
          const ev = events.find((e) => e.bed === b.id);
          const urg = ev ? urgencyOf(ev.def) : null;
          return (
            <div
              key={b.id}
              className="absolute h-[26%] w-[29%]"
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                transform: "translate(-50%,-50%)",
              }}
            >
              {urg && (
                <span
                  className={cn(
                    "font-display absolute -top-1 left-1/2 z-20 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                    URGENCY_META[urg].chip,
                    urg === "critical" && "animate-throb",
                  )}
                >
                  {URGENCY_META[urg].label}
                </span>
              )}
              <Bed
                bed={b}
                event={ev?.def}
                progress={ev ? 1 - (gameT.current - ev.born) / ev.ttl : 0}
                flash={flash[b.id] ?? null}
                active={selected === b.id}
                nurseHere={nurseHereBed === b.id}
                onTap={() => tapBed(b.id)}
              />
            </div>
          );
        })}

        {/* nurse */}
        <div
          className="pointer-events-none absolute z-20 h-16 w-12 transition-all ease-linear"
          style={{
            left: `${nurse.x * 100}%`,
            top: `${nurse.y * 100}%`,
            transform: "translate(-50%,-60%)",
            transitionDuration: "80ms",
          }}
        >
          <Nurse moving={walking} />
        </div>

        {/* banner */}
        {banner && (
          <div className="pointer-events-none absolute inset-x-2 top-[36%] z-30 flex justify-center">
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

        {/* start cue */}
        {phase === "ready" && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
            <p
              key={cue}
              className="font-display animate-pop text-center text-5xl font-black uppercase leading-none text-primary"
            >
              {cue}
            </p>
          </div>
        )}

        {/* end countdown — floats over the ward, synced to the real timer */}
        {endCount !== null && (
          <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center">
            <div className="text-center">
              <p className="font-display text-xl font-black uppercase tracking-widest text-primary drop-shadow-[0_2px_0_var(--color-background)]">
                Shift finishes in
              </p>
              <p
                key={endCount}
                className="font-display animate-pop text-[7rem] font-black leading-none text-primary drop-shadow-[0_4px_0_var(--color-background)]"
              >
                {endCount}
              </p>
            </div>
          </div>
        )}

        {/* mini-game offer */}
        {miniOffer && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-background/85 p-5 backdrop-blur-sm">
            <div className="animate-pop w-full rounded-3xl border-4 border-border bg-card p-4 text-center shadow-2xl">
              <p className="font-display text-[11px] font-black uppercase tracking-widest text-primary">
                Bonus round available
              </p>
              <h3 className="font-display text-2xl font-black uppercase leading-none">
                {miniOffer.kind === "med" ? "Med Trolley Dash" : "Cannula Challenge"}
              </h3>
              <p className="font-display mt-2 rounded-2xl bg-[image:var(--gradient-gold)] py-2 text-xl font-black text-gold-foreground">
                up to +{miniOffer.bonus} ⭐
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                The ward keeps ticking at 1/3 speed. You can abandon any time.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMiniOffer(null)}
                  className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-lg font-black uppercase text-secondary-foreground"
                >
                  Skip
                </button>
                <button
                  onClick={startMini}
                  className="chunky chunky-press rounded-2xl bg-primary py-3 font-display text-lg font-black uppercase text-primary-foreground"
                >
                  Start ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* pause veil */}
        {manualPause && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/85 px-6 text-center backdrop-blur-sm">
            <p className="font-display text-4xl font-black uppercase">Paused</p>
            <p className="text-sm font-semibold text-muted-foreground">{pauseLine}</p>
            <button
              onClick={() => setManualPause(false)}
              className="chunky chunky-press rounded-2xl bg-primary px-8 py-4 font-display text-xl font-black uppercase text-primary-foreground"
            >
              Resume ▶
            </button>
          </div>
        )}

        {/* settings */}
        {settingsOpen && (
          <div className="absolute inset-0 z-[70] grid place-items-center bg-background/90 p-5 backdrop-blur-sm">
            <div className="w-full space-y-2 rounded-3xl border-4 border-border bg-card p-4">
              <h3 className="font-display text-2xl font-black uppercase">Settings</h3>
              <SettingRow
                label="Sound"
                icon="🔊"
                on={soundOn}
                onToggle={onToggleSound}
              />
              <SettingRow
                label="Haptics"
                icon="📳"
                on={hapticsOn}
                onToggle={onToggleHaptics}
              />
              <button
                onClick={() => setSettingsOpen(false)}
                className="chunky chunky-press w-full rounded-2xl bg-primary py-3 font-display text-lg font-black uppercase text-primary-foreground"
              >
                Back to shift
              </button>
            </div>
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
                  {nurseHereBed === selectedEvent.bed
                    ? selectedEvent.def.brief
                    : "Walking over…"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => doAction(a)}
                  disabled={nurseHereBed !== selectedEvent.bed}
                  className={cn(
                    "chunky chunky-press flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-primary-foreground",
                    ACTION_META[a].color,
                    nurseHereBed !== selectedEvent.bed && "opacity-40",
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
          <button
            onClick={goStation}
            className="flex w-full items-center gap-3 py-1 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-xl">
              🖥️
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-black uppercase">
                Level {cfg.level} · {cfg.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Tap a flashing bay — your nurse walks there. Tap here to head back.
              </p>
            </div>
          </button>
        )}
      </div>

      {/* mini-game overlay + controls */}
      {mini && (
        <>
          {mini.kind === "med" ? (
            <MedMatchGame level={mini.lvl} paused={manualPause || settingsOpen} onDone={miniDone} />
          ) : (
            <CannulaGame level={mini.lvl} paused={manualPause || settingsOpen} onDone={miniDone} />
          )}
          <div className="absolute inset-x-0 bottom-0 z-40 flex items-stretch gap-2 border-t-2 border-border bg-card px-3 pb-4 pt-3">
            <button
              onClick={() => setManualPause(true)}
              aria-label="Pause"
              className="chunky chunky-press grid h-14 w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl text-secondary-foreground"
            >
              ⏸️
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Mini-game settings"
              className="chunky chunky-press grid h-14 w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl text-secondary-foreground"
            >
              ⚙️
            </button>
            <span className="font-display grid h-14 flex-1 place-items-center rounded-2xl border-2 border-border bg-background text-lg font-black tabular-nums">
              ⏱️ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </span>
            <button
              onClick={abandonMini}
              className="chunky chunky-press h-14 shrink-0 rounded-2xl bg-alarm px-4 font-display text-base font-black uppercase text-alarm-foreground"
            >
              Abandon
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SettingRow({
  label,
  icon,
  on,
  onToggle,
}: {
  label: string;
  icon: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-border bg-background px-3 py-3"
    >
      <span className="font-display flex items-center gap-2 text-base font-black uppercase">
        <span className="text-xl">{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          "font-display rounded-xl px-3 py-1 text-sm font-black",
          on ? "bg-calm text-calm-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}
