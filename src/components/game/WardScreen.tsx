import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import wardBackgroundAsset from "@/assets/shift-fight-ward-spring-background.png.asset.json";
import curtainAsset from "@/assets/curtain-partition.png.asset.json";
import leftSideBedAsset from "@/assets/left-side-bed.png.asset.json";
import rightSideBedAsset from "@/assets/right-side-bed.png.asset.json";
import nursesStationAsset from "@/assets/nurses-station.png.asset.json";
import { cn } from "@/lib/utils";
import { Bed, type BedState } from "./Bed";
import { Nurse } from "./Nurse";
import type { NurseAction, NurseDirection } from "./Nurse";
import type { PlayerCharacter } from "@/game/character";
import { miniGameByKey, randomMiniGameKey } from "@/game/minigames";
import { onDevCommand, reportDevInfo } from "@/game/dev";
import { NO_EFFECTS, type Effects } from "@/game/gear";
import { shiftTitle } from "@/game/shifts";
import {
  buzz,
  playBad,
  playCallBell,
  playGood,
  playRoundBells,
  playWhistle,
  primeAudio,
} from "@/lib/sfx";
import { isMusicOn, playMusic, setMusicEnabled, stopMusic, subscribeMusic, toggleMusic } from "@/lib/music";
import {
  ACTION_META,
  EVENTS,
  shuffledPatientNames,
  MAX_BEDS,
  SHIFT_MS,
  STAFF,
  STAFF_BEHAVIOUR,
  URGENCY_META,
  damageMult,
  levelConfig,
  payMult,
  randomPauseLine,
  rollOutcomes,
  rollQuirks,
  ttlMult,
  urgencyOf,
  type ActionKind,
  type EventDef,
  type Quirk,
  type Upgrades,
} from "@/game/config";
import {
  emptyCounters,
  evaluateObjectives,
  objectiveProgress,
  pickObjectives,
  type ShiftCounters,
  type ShiftObjective,
} from "@/game/objectives";
import {
  DON_LINES,
  DON_VISIT_MS,
  pickDonQuip,
  DON_QUIPS,
  FINAL_WARNING_AT,
  donVisitChance,
} from "@/game/don";

export type ShiftStats = {
  level: number;
  points: number;
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
  objectives: ShiftObjective[];
  /** job security / DON inputs — reuse of the existing shift tracking */
  miniFailed: number;
  miniAbandoned: number;
  overdue: number;
  donVisited: boolean;
  donAnnoyed: number;
};


type ActiveEvent = {
  id: number;
  bed: number;
  def: EventDef;
  born: number; // game-time ms
  ttl: number;
  /** payout multiplier per offered action, randomised at spawn */
  scores: Partial<Record<ActionKind, number>>;
};

type Banner = { id: number; title: string; sub: string; good: boolean };
type Point = { x: number; y: number };

/** Fixed 890 × 1123 ward-world coordinates, matching the supplied layout mock-up. */
const BED_SLOTS: Point[] = [
  { x: 0.245, y: 0.375 },
  { x: 0.755, y: 0.375 },
  { x: 0.245, y: 0.545 },
  { x: 0.755, y: 0.545 },
  { x: 0.245, y: 0.71 },
  { x: 0.755, y: 0.71 },
  { x: 0.245, y: 0.865 },
  { x: 0.755, y: 0.865 },
];

const STATION_FRAME = { x: 0.21, y: 0.11, width: 0.58, height: 0.22 };

/** chair centres in the nurses' station artwork, from left to right */
const STATION_CHAIRS: readonly [Point, Point, Point, Point, Point] = [
  { x: 0.195, y: 0.485 },
  { x: 0.35, y: 0.49 },
  { x: 0.5, y: 0.5 },
  { x: 0.645, y: 0.49 },
  { x: 0.795, y: 0.485 },
];

function stationChair(index: number): Point {
  return STATION_CHAIRS[index] ?? STATION_CHAIRS[0];
}

function stationChairInWard(index: number): Point {
  const chair = stationChair(index);
  return {
    x: STATION_FRAME.x + chair.x * STATION_FRAME.width,
    y: STATION_FRAME.y + chair.y * STATION_FRAME.height,
  };
}

/** ward-space destination matching the first visible chair */
const STATION: Point = stationChairInWard(0);

/** curtain sections in the corridor the nurse must walk around.
    box = exact placement measured from the ward reference artwork
    (890x1123 world space), expressed as fractions of the ward world. */
const GATES = [
  {
    y: 0.405,
    side: "left" as const,
    lane: 0.61,
    box: { left: 0.2921, top: 0.3401, width: 0.1663, height: 0.1470 },
  },
  {
    y: 0.57,
    side: "right" as const,
    lane: 0.39,
    box: { left: 0.5281, top: 0.4934, width: 0.1685, height: 0.1416 },
  },
  {
    y: 0.735,
    side: "left" as const,
    lane: 0.61,
    box: { left: 0.3146, top: 0.6608, width: 0.1629, height: 0.1630 },
  },
];

/** bedside standing spots, one per bed, taken from the ward path map */
const BED_ARRIVAL: Point[] = [
  { x: 0.24, y: 0.33 },
  { x: 0.79, y: 0.33 },
  { x: 0.23, y: 0.6 },
  { x: 0.79, y: 0.5 },
  { x: 0.24, y: 0.77 },
  { x: 0.76, y: 0.75 },
  { x: 0.24, y: 0.92 },
  { x: 0.76, y: 0.92 },
];

/* ---------- walkable network (fixed ward-world coordinates) ----------
   Horizontal lanes run in the clear floor between bed rows; a single
   central spine joins them, and the station is entered/left over the
   open north top of the desk and down the outer side aisles. */
const LANE_Y = [0.33, 0.46, 0.628, 0.7875, 0.94];
const LANE_X = [0.24, 0.5, 0.79];
const DESK_TOP_Y = 0.14;
const SIDE_X = [0.16, 0.84];

type NavNode = { p: Point; edges: number[] };

const NAV: NavNode[] = [];
function navAdd(p: Point) {
  NAV.push({ p, edges: [] });
  return NAV.length - 1;
}
function navLink(a: number, b: number) {
  NAV[a]!.edges.push(b);
  NAV[b]!.edges.push(a);
}

const laneNode: number[][] = LANE_Y.map((y) => LANE_X.map((x) => navAdd({ x, y })));
LANE_Y.forEach((_, r) => {
  navLink(laneNode[r]![0]!, laneNode[r]![1]!);
  navLink(laneNode[r]![1]!, laneNode[r]![2]!);
  if (r > 0) navLink(laneNode[r - 1]![1]!, laneNode[r]![1]!);
});

/* station approach: outer side aisles up over the desk arms */
const deskTopL = navAdd({ x: SIDE_X[0]!, y: DESK_TOP_Y });
const deskTopR = navAdd({ x: SIDE_X[1]!, y: DESK_TOP_Y });
const deskTopC = navAdd({ x: 0.5, y: DESK_TOP_Y });
const outL = navAdd({ x: SIDE_X[0]!, y: LANE_Y[0]! });
const outR = navAdd({ x: SIDE_X[1]!, y: LANE_Y[0]! });
navLink(deskTopL, deskTopC);
navLink(deskTopC, deskTopR);
navLink(deskTopL, outL);
navLink(deskTopR, outR);
navLink(outL, laneNode[0]![0]!);
navLink(outR, laneNode[0]![2]!);

/* bedside spots hang off their own lane */
const bedNode = BED_ARRIVAL.map((p, i) => {
  const id = navAdd(p);
  const lane = [0, 0, 2, 1, 3, 3, 4, 4][i]!;
  const col = i % 2 === 0 ? 0 : 2;
  const anchor = laneNode[lane]![col]!;
  if (anchor !== id) navLink(id, anchor);
  return id;
});

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestNavNode(p: Point) {
  let best = 0;
  let bd = Infinity;
  NAV.forEach((n, i) => {
    const d = dist(n.p, p);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

function navPath(a: number, b: number): Point[] {
  const dists = NAV.map(() => Infinity);
  const prev = NAV.map(() => -1);
  const seen = NAV.map(() => false);
  dists[a] = 0;
  for (;;) {
    let cur = -1;
    let cd = Infinity;
    dists.forEach((d, i) => {
      if (!seen[i] && d < cd) {
        cd = d;
        cur = i;
      }
    });
    if (cur === -1 || cur === b) break;
    seen[cur] = true;
    for (const e of NAV[cur]!.edges) {
      const nd = cd + dist(NAV[cur]!.p, NAV[e]!.p);
      if (nd < dists[e]!) {
        dists[e] = nd;
        prev[e] = cur;
      }
    }
  }
  const out: Point[] = [];
  let cur = b;
  while (cur !== -1) {
    out.unshift(NAV[cur]!.p);
    if (cur === a) break;
    cur = prev[cur]!;
  }
  return out;
}

const MS_PER_UNIT = (u: Upgrades) => Math.max(620, 1500 - u.speed * 230);


export function WardScreen({
  level,
  upgrades,
  bedCount,
  staffBonus,
  staff,
  character,
  soundOn,
  hapticsOn,
  onToggleSound,
  onToggleHaptics,
  autoSaveOn,
  onToggleAutoSave,
  onEnd,
  onSave,
  onQuit,
  jobSecurity = 100,
  tutorial = false,
  onTutorialDone,
  mods = NO_EFFECTS,
}: {
  level: number;
  upgrades: Upgrades;
  bedCount: number;
  staffBonus: number;
  staff: string[];
  character: PlayerCharacter;
  soundOn: boolean;
  hapticsOn: boolean;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  autoSaveOn: boolean;
  onToggleAutoSave: () => void;
  onEnd: (s: ShiftStats) => void;
  /** save progress locally from the in-shift menu */
  onSave?: () => void;
  /** leave the shift and go back to the title screen */
  onQuit?: () => void;
  /** persistent job security — drives DON visit odds and the final warning */
  jobSecurity?: number;
  /** show the first-shift walkthrough */
  tutorial?: boolean;
  onTutorialDone?: () => void;
  /** combined gear / bed-upgrade / staff effects for this shift */
  mods?: Effects;
}) {
  const story = shiftTitle(level);
  const [musicOn, setMusicOnState] = useState(isMusicOn);
  useEffect(() => {
    const unsub = subscribeMusic(setMusicOnState);
    return () => {
      unsub();
    };
  }, []);
  const cfg = useMemo(() => levelConfig(level), [level]);
  /** every bed the player owns is a live bed — purchased beds unlock immediately */
  const activeBeds = Math.max(1, bedCount);

  /** fresh, non-repeating patient names every shift */
  const shiftNames = useMemo(() => shuffledPatientNames(MAX_BEDS), []);

  const beds: BedState[] = Array.from({ length: MAX_BEDS }, (_, i) => ({
    id: i,
    name: shiftNames[i] ?? `Bay ${i + 1}`,
    locked: i >= activeBeds,
  }));


  /* ---------------- phases ---------------- */
  type Phase = "ready" | "play" | "ending";
  const [phase, setPhase] = useState<Phase>("ready");
  const [cue, setCue] = useState<string>("READY...");

  const [manualPause, setManualPause] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [flash, setFlash] = useState<Record<number, "good" | "bad" | null>>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [combo, setCombo] = useState(0);
  const [stability, setStability] = useState(100);
  /** first-shift walkthrough: 0 intro card · 1 "tap a bay" hint · 2 scoring card · -1 done */
  const [tutStep, setTutStep] = useState(tutorial ? 0 : -1);
  const tutPause = tutorial && (tutStep === 0 || tutStep === 2);

  /* mini-game state */
  const [miniOffer, setMiniOffer] = useState<null | {
    kind: string;
    bonus: number;
    lvl: number;
  }>(null);
  const [mini, setMini] = useState<null | { kind: string; lvl: number }>(null);

  /* nurse */
  const wardRef = useRef<HTMLDivElement | null>(null);
  const [nurse, setNurse] = useState<Point>({ ...STATION });
  const [walking, setWalking] = useState(false);
  const [nurseDirection, setNurseDirection] = useState<NurseDirection>("north");
  const [nurseAction, setNurseAction] = useState<NurseAction>("idle");
  const nurseRef = useRef<Point>({ ...STATION });
  const returning = useRef(false);
  const journey = useRef<Point[]>([]);
  const journeyBed = useRef<number | null>(null);
  const lastMoveT = useRef(0);
  const [atBed, setAtBed] = useState<number | null>(null);

  const stats = useRef<ShiftStats>({
    level,
    points: 0,
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
    objectives: [],
    miniFailed: 0,
    miniAbandoned: 0,
    overdue: 0,
    donVisited: false,
    donAnnoyed: 0,
  });
  const streak = useRef(0);
  /** last mini-game played, so the next one is always different */
  const lastMini = useRef<string | null>(null);
  const uid = useRef(1);
  const ended = useRef(false);
  const bannerId = useRef(1);
  const [, force] = useState(0);

  /* ---------------- the DON's ward visit ---------------- */
  const [don, setDon] = useState<null | { line: string }>(null);
  const donOn = useRef(false);
  donOn.current = !!don;
  const donScheduled = useRef(false);
  /** quips already used this shift, so he never repeats himself */
  const donUsed = useRef<Set<string>>(new Set());
  const donSay = useCallback((kind: keyof typeof DON_QUIPS, annoyed = false) => {
    if (!donOn.current) return;
    if (annoyed) stats.current.donAnnoyed++;
    setDon({ line: pickDonQuip(kind, donUsed.current) });
  }, []);

  /* ---------------- shift objectives ---------------- */
  const [briefing, setBriefing] = useState(true);
  const [objectives, setObjectives] = useState<ShiftObjective[]>(() =>
    pickObjectives(level, 3),
  );
  const counters = useRef<ShiftCounters>(emptyCounters());
  const objectivesRef = useRef<ShiftObjective[]>(objectives);
  objectivesRef.current = objectives;


  /* ---------------- staff runtime ---------------- */
  type StaffRt = {
    path: Point[];
    eventId: number | null;
    goingHome: boolean;
    cooldownUntil: number;
    lastT: number;
  };
  const staffRt = useRef<Record<string, StaffRt>>({});
  const staffPosRef = useRef<Record<string, Point>>({});
  const [staffPos, setStaffPos] = useState<Record<string, Point>>({});
  const [staffFlash, setStaffFlash] = useState<string | null>(null);
  const [pauseLine, setPauseLine] = useState(randomPauseLine());

  const staffHome = useCallback(
    (k: string): Point => {
      const i = Math.max(0, staff.indexOf(k));
      return stationChairInWard(Math.min(i + 1, STATION_CHAIRS.length - 1));
    },
    [staff],
  );

  useEffect(() => {
    for (const k of staff) {
      staffRt.current[k] ??= {
        path: [],
        eventId: null,
        goingHome: false,
        cooldownUntil: 0,
        lastT: 0,
      };
      staffPosRef.current[k] ??= staffHome(k);
    }
    setStaffPos({ ...staffPosRef.current });
  }, [staff, staffHome]);


  const eventsRef = useRef<ActiveEvent[]>([]);
  eventsRef.current = events;

  const rate =
    manualPause || settingsOpen || phase !== "play" || miniOffer || tutPause
      ? 0
      : mini
        ? 1 / 3
        : 1;
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
    if (briefing) return;
    primeAudio();
    playRoundBells();
    const t1 = window.setTimeout(() => setCue("SET..."), 800);
    const t2 = window.setTimeout(() => setCue("SHIFT FIGHT!"), 1600);
    const t3 = window.setTimeout(() => {
      setPhase("play");
      setCue("");
      /* the shift song only starts once the opening bells have rung out */
      playMusic("ward");
    }, 2500);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, [briefing]);

  const say = useCallback((title: string, sub: string, good: boolean) => {
    const id = bannerId.current++;
    setBanner({ id, title, sub, good });
    window.setTimeout(() => setBanner((b) => (b && b.id === id ? null : b)), 1500);
  }, []);

  /** re-check the shift objectives and pay out any that just completed */
  const checkObjectives = useCallback(() => {
    counters.current.points = stats.current.points;
    const { objectives: next, completed } = evaluateObjectives(
      objectivesRef.current,
      counters.current,
    );
    if (!completed.length) return;
    objectivesRef.current = next;
    setObjectives(next);
    for (const o of completed) {
      if (o.reward.type === "points") stats.current.points += o.reward.amount;
      else stats.current.xp += o.reward.amount;
    }
    const first = completed[0]!;
    say(
      "CHALLENGE COMPLETE!",
      `${first.label} · +${first.reward.amount} ${
        first.reward.type === "points" ? "points" : "XP"
      }`,
      true,
    );
  }, [say]);

  const finish = useCallback(
    (collapsed: boolean) => {
      if (ended.current) return;
      ended.current = true;
      stats.current.collapsed = collapsed;
      stats.current.quirks = rollQuirks(3);
      stats.current.points = Math.max(
        0,
        stats.current.points +
          Math.round(stats.current.quirks.reduce((a, q) => a + q.pts, 0) * 0.3),
      );
      stats.current.objectives = objectivesRef.current;
      /* clear the shift song so the end-of-shift whistle plays on its own */
      stopMusic("ward");
      playWhistle();
      onEnd({ ...stats.current });
    },
    [onEnd],
  );


  const elapsed = Math.min(SHIFT_MS, gameT.current);
  const shiftLeft = Math.max(0, 1 - elapsed / SHIFT_MS);
  const secondsLeft = Math.max(0, Math.ceil((SHIFT_MS - elapsed) / 1000));

  /* ---------------- ending sequence (synced to the real timer) ---------------- */
  const endCountValue =
    phase === "play" && secondsLeft > 0 && secondsLeft <= 3 ? secondsLeft : null;

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
  }, [stability, phase]);

  useEffect(() => {
    if (phase !== "ending") return undefined;
    const t = window.setTimeout(() => finish(stats.current.collapsed), 450);
    return () => window.clearTimeout(t);
  }, [phase, finish]);


  /* ---------------- spawner ---------------- */
  useEffect(() => {
    if (rate === 0) return;
    const spawnOne = (force: boolean) => {
      const heat = Math.min(1, gameT.current / SHIFT_MS);
      const cur = eventsRef.current;
      if (cur.length >= Math.min(cfg.maxEvents, activeBeds)) return;
      const free = Array.from({ length: activeBeds }, (_, i) => i).filter(
        (b) => !cur.some((ev) => ev.bed === b),
      );
      if (!free.length) return;
      if (!force && Math.random() > cfg.spawnChance * (0.7 + heat * 0.5)) return;
      const bed = free[Math.floor(Math.random() * free.length)]!;

      // pick a severity band first, so urgent/critical show up even early on
      const w = cfg.sevWeights;
      const total = w[0] + w[1] + w[2];
      let roll = Math.random() * total;
      let sev: 1 | 2 | 3 = 1;
      if (roll > w[0]) sev = 2;
      roll -= w[0];
      if (roll > w[1]) sev = 3;
      /** bed upgrades / gear can quieten the silly routine bells */
      if (sev === 1 && mods.sillyMult < 1 && Math.random() > mods.sillyMult) return;
      const pool = EVENTS.filter((ev) => ev.severity === sev);
      const def = pool[Math.floor(Math.random() * pool.length)]!;
      const u = URGENCY_META[urgencyOf(def)];
      const ev: ActiveEvent = {
        id: uid.current++,
        bed,
        def,
        born: gameT.current,
        scores: rollOutcomes(def),
        ttl:
          def.ttl *
          ttlMult(upgrades) *
          mods.ttlMult *
          u.mult *
          cfg.timeMult *
          (1 - heat * 0.18),
      };
      // the bell only ever rings because this patient is ringing it
      if (def.callBell) playCallBell();
      setEvents((c) => [...c, ev]);
    };
    const id = window.setInterval(() => spawnOne(false), 1200);
    const offDev = onDevCommand("spawnEvent", () => spawnOne(true));
    return () => {
      window.clearInterval(id);
      offDev();
    };
  }, [rate, activeBeds, cfg, upgrades, mods]);

  /* ---------------- dev info ---------------- */
  useEffect(() => {
    reportDevInfo({ activeEvents: events.length, inShift: true });
    return () => reportDevInfo({ activeEvents: 0, inShift: false });
  }, [events.length]);

  /* ---------------- expiry ---------------- */
  useEffect(() => {
    if (rate === 0 || ended.current) return;
    const expired = events.filter((e) => gameT.current - e.born > e.ttl);
    if (!expired.length) return;
    setEvents((cur) => cur.filter((e) => !expired.some((x) => x.id === e.id)));
    let dmg = 0;
    for (const e of expired) {
      dmg +=
        (5 + e.def.severity * 5) * damageMult(upgrades) * mods.damageMult * cfg.damage;
      stats.current.mistakes++;
      stats.current.overdue++;
      say("TOO SLOW", e.def.fail, false);
    }
    if (dmg) {
      playBad();
      setCombo(0);
      streak.current = 0;
      setStability((s) => Math.max(0, s - dmg));
    }
    donSay("overdue", true);
    if (selected !== null && expired.some((e) => e.bed === selected)) setSelected(null);
  }, [tick, rate, events, upgrades, cfg, selected, say, donSay]);

  /* ---------------- DON visit scheduling ---------------- */
  useEffect(() => {
    if (phase !== "play" || donScheduled.current) return undefined;
    donScheduled.current = true;
    if (Math.random() > donVisitChance(jobSecurity)) return undefined;
    const delay = 10000 + Math.random() * 22000;
    const t1 = window.setTimeout(() => {
      stats.current.donVisited = true;
      setDon({ line: DON_LINES.arrive });
      playCallBell();
      buzz(30);
      say(DON_LINES.arrive, DON_LINES.arriveSub, false);
      window.setTimeout(() => setDon((d) => (d ? { line: pickDonQuip("idle", donUsed.current) } : d)), 2600);
    }, delay);
    const t2 = window.setTimeout(() => {
      setDon(null);
      say(
        "THE DON LEAVES",
        stats.current.donAnnoyed ? DON_LINES.leaveBad : DON_LINES.leaveOk,
        !stats.current.donAnnoyed,
      );
    }, delay + DON_VISIT_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase, jobSecurity, say]);

  /* dev tools: summon the DON on demand */
  useEffect(() => {
    let leave = 0;
    let settle = 0;
    const off = onDevCommand("donVisit", () => {
      stats.current.donVisited = true;
      setDon({ line: DON_LINES.arrive });
      playCallBell();
      buzz(30);
      say(DON_LINES.arrive, DON_LINES.arriveSub, false);
      window.clearTimeout(settle);
      window.clearTimeout(leave);
      settle = window.setTimeout(() => setDon((d) => (d ? { line: pickDonQuip("idle", donUsed.current) } : d)), 2600);
      leave = window.setTimeout(() => {
        setDon(null);
        say(
          "THE DON LEAVES",
          stats.current.donAnnoyed ? DON_LINES.leaveBad : DON_LINES.leaveOk,
          !stats.current.donAnnoyed,
        );
      }, DON_VISIT_MS);
    });
    return () => {
      off();
      window.clearTimeout(settle);
      window.clearTimeout(leave);
    };
  }, [say]);

  const selectedEvent = events.find((e) => e.bed === selected);
  const nurseHereBed = atBed;

  /* ---------------- movement ---------------- */
  const routeTo = useCallback(
    (dest: Point, from: Point): Point[] => {
      const atStation = (p: Point) => p.y < 0.3;
      const pts: Point[] = [];

      /* leaving a chair: step north over the open top of the desk first */
      const startNode = atStation(from)
        ? (pts.push({ x: from.x, y: DESK_TOP_Y }),
          from.x < 0.5 ? deskTopL : deskTopR)
        : nearestNavNode(from);
      if (atStation(from)) pts.push(NAV[startNode]!.p);

      const endNode = atStation(dest)
        ? dest.x < 0.5
          ? deskTopL
          : deskTopR
        : nearestNavNode(dest);

      pts.push(...navPath(startNode, endNode));
      if (atStation(dest)) pts.push({ x: dest.x, y: DESK_TOP_Y });
      pts.push(dest);

      /* prune duplicate / collinear waypoints for smooth motion */
      const out: Point[] = [];
      for (const p of pts) {
        const prev = out[out.length - 1] ?? from;
        if (Math.abs(prev.x - p.x) < 0.004 && Math.abs(prev.y - p.y) < 0.004)
          continue;
        const before = out[out.length - 2] ?? from;
        if (
          out.length &&
          Math.abs(before.x - prev.x) < 0.004 &&
          Math.abs(prev.x - p.x) < 0.004
        )
          out.pop();
        else if (
          out.length &&
          Math.abs(before.y - prev.y) < 0.004 &&
          Math.abs(prev.y - p.y) < 0.004
        )
          out.pop();
        out.push(p);
      }
      return out;
    },
    [],
  );



  const walkTo = useCallback(
    (dest: Point, bed: number | null, slow = false) => {
      returning.current = slow;
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
    let remaining =
      (gameT.current - lastMoveT.current) /
      (MS_PER_UNIT(upgrades) * mods.travelMult * (returning.current ? 1.9 : 1));
    lastMoveT.current = gameT.current;
    let current = nurseRef.current;
    while (remaining > 0 && journey.current.length) {
      const target = journey.current[0];
      if (!target) break;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      if (Math.abs(dx) > Math.abs(dy)) setNurseDirection(dx < 0 ? "west" : "east");
      else if (Math.abs(dy) > 0.001) setNurseDirection(dy < 0 ? "north" : "south");
      setNurseAction(returning.current ? "walk" : upgrades.speed >= 3 ? "run" : "walk");
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
      setNurseAction(journeyBed.current === null ? "sit" : "idle");
      setAtBed(journeyBed.current);
    }
  }, [tick, rate, upgrades]);

  /* ---------------- staff: walk, work, return ---------------- */
  const isRed = useCallback((e: ActiveEvent) => {
    const left = 1 - (gameT.current - e.born) / e.ttl;
    return urgencyOf(e.def) === "critical" || left < 0.4;
  }, []);
  const redAlert = events.some(isRed);

  const dispatchStaff = useCallback(
    (key: string, ev: ActiveEvent) => {
      const rt = staffRt.current[key];
      if (!rt) return;
      rt.eventId = ev.id;
      rt.goingHome = false;
      rt.lastT = gameT.current;
      rt.path = routeTo(BED_ARRIVAL[ev.bed] ?? BED_SLOTS[ev.bed]!, staffPosRef.current[key] ?? staffHome(key));
    },
    [routeTo, staffHome],
  );

  useEffect(() => {
    if (rate === 0 || !staff.length) return;
    const now = gameT.current;
    let moved = false;
    for (const key of staff) {
      const b = STAFF_BEHAVIOUR[key];
      const rt = staffRt.current[key];
      if (!b || !rt) continue;

      // idle at the station: wait for a red/critical situation
      if (!rt.path.length && rt.eventId === null) {
        if (now < rt.cooldownUntil) continue;
        const target = events.find((e) => {
          if (now - e.born < b.responseMs) return false;
          return e.def.severity <= b.maxSeverity;
        });
        if (!target) continue;
        dispatchStaff(key, target);
      }

      if (!rt.path.length) continue;
      let remaining = (now - rt.lastT) / (MS_PER_UNIT(upgrades) * 1.3);
      rt.lastT = now;
      let cur = staffPosRef.current[key] ?? staffHome(key);
      while (remaining > 0 && rt.path.length) {
        const t = rt.path[0]!;
        const dx = t.x - cur.x;
        const dy = t.y - cur.y;
        const d = Math.hypot(dx * 0.8, dy) || 0.0001;
        if (d <= remaining) {
          cur = t;
          rt.path.shift();
          remaining -= d;
        } else {
          const r = remaining / d;
          cur = { x: cur.x + dx * r, y: cur.y + dy * r };
          remaining = 0;
        }
      }
      staffPosRef.current[key] = cur;
      moved = true;

      if (!rt.path.length) {
        if (rt.goingHome) {
          rt.goingHome = false;
          continue;
        }
        const evId = rt.eventId;
        rt.eventId = null;
        rt.cooldownUntil = now + b.cooldownMs;
        const target = events.find((e) => e.id === evId);
        if (target) {
          setEvents((c) => c.filter((e) => e.id !== target.id));
          const gain = Math.round(8 * target.def.severity * payMult(upgrades, staffBonus));
          stats.current.points += gain;
          stats.current.handled++;
          stats.current.staffAssists++;
          stats.current.xp += 2;
          if (target.def.callBell) stats.current.callBells++;
          setStability((s) => Math.min(100, s + 2));
          setStaffFlash(key);
          window.setTimeout(() => setStaffFlash((s) => (s === key ? null : s)), 900);
          say("TEAMWORK", `${b.line} +${gain}`, true);
          force((n) => n + 1);
        }
        rt.goingHome = true;
        rt.lastT = now;
        rt.path = routeTo(staffHome(key), cur);
      }
    }
    if (moved) setStaffPos({ ...staffPosRef.current });
  }, [
    tick,
    rate,
    staff,
    events,
    upgrades,
    staffBonus,
    say,
    isRed,
    dispatchStaff,
    routeTo,
    staffHome,
  ]);

  /** manual assignment: tap a staff member to send them to the worst bay */
  function tapStaff(key: string) {
    if (rate === 0) return;
    const rt = staffRt.current[key];
    const info = STAFF.find((s) => s.key === key);
    if (!rt) return;
    if (rt.path.length || rt.eventId !== null) {
      say("ON IT", `${info?.name ?? "Staff"} is already going`, true);
      return;
    }
    const b = STAFF_BEHAVIOUR[key];
    const pick = [...events].filter((e) => !b || e.def.severity <= b.maxSeverity).sort(
      (a, z) =>
        z.def.severity - a.def.severity ||
        (gameT.current - z.born) / z.ttl - (gameT.current - a.born) / a.ttl,
    )[0];
    if (!pick) {
      say("STANDING BY", `${info?.name ?? "Staff"} can't take those`, true);
      return;
    }
    buzz(10);
    rt.cooldownUntil = 0;
    dispatchStaff(key, pick);
    say("DELEGATED", `${info?.name ?? "Staff"} → ${beds[pick.bed]?.name}`, true);
  }



  function tapBed(bed: number) {
    if (rate === 0 || beds[bed]?.locked) return;
    primeAudio();
    buzz(10);
    if (tutStep === 1) setTutStep(2);
    setSelected(bed);
    walkTo(BED_ARRIVAL[bed] ?? BED_SLOTS[bed]!, bed);


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
    setNurseAction(action === "ASSESS" ? "check" : "interact");
    window.setTimeout(() => setNurseAction("idle"), 620);
    if (tutStep >= 0) {
      setTutStep(-1);
      onTutorialDone?.();
    }
    const mult = ev.scores[action] ?? 0;
    const correct = mult === 1;
    setEvents((cur) => cur.filter((e) => e.id !== ev.id));
    setSelected(null);
    setFlash((f) => ({ ...f, [ev.bed]: correct ? "good" : "bad" }));
    window.setTimeout(() => setFlash((f) => ({ ...f, [ev.bed]: null })), 500);

    stats.current.handled++;
    counters.current.patients++;
    if (correct) {
      counters.current.eventsOk++;
      if (ev.def.severity === 3) counters.current.criticalOk++;
      else if (ev.def.severity === 2) counters.current.urgentOk++;
      else counters.current.routineOk++;
      if (ev.def.callBell) counters.current.callBells++;

      playGood();
      const isTop = !events.some(
        (e) => e.id !== ev.id && e.def.severity > ev.def.severity,
      );
      const newCombo = combo + 1;
      setCombo(newCombo);
      stats.current.maxCombo = Math.max(stats.current.maxCombo, newCombo);
      counters.current.streak = Math.max(counters.current.streak, newCombo);

      const base = 14 * ev.def.severity * (isTop ? 1.4 : 1);
      const gain = Math.round(
        base * (1 + newCombo * 0.1) * payMult(upgrades, staffBonus) * (1 + level * 0.05),
      );
      stats.current.points += gain;
      stats.current.xp += 4 * ev.def.severity;
      stats.current.helped++;
      if (ev.def.callBell) stats.current.callBells++;
      setStability((s) => Math.min(100, s + 3));
      say(isTop ? "GREAT CALL!" : "PATIENT STABLE", `+${gain} · ${ev.def.win}`, true);
      if (isTop && newCombo >= 2) donSay("good");
      streak.current++;
      const gap = streak.current <= 8 ? 4 : 5;
      if (streak.current % gap === 0) {
        const n = stats.current.miniGames;
        const lvl = Math.min(9, Math.floor(n / 2) + Math.floor(level / 3));
        setMiniOffer({
          kind: randomMiniGameKey(lastMini.current),
          bonus: Math.round((120 + lvl * 40 + level * 15) * mods.miniMult),
          lvl,
        });
      }
    } else {
      const base = 14 * ev.def.severity;
      const raw = Math.round(
        base * payMult(upgrades, staffBonus) * (1 + level * 0.05) * mult,
      );
      stats.current.points = Math.max(0, stats.current.points + raw);
      setCombo(0);
      streak.current = 0;
      if (mult > 0) {
        playGood();
        stats.current.xp += 2;
        stats.current.helped++;
        say("SORT OF WORKED", `+${raw} · half marks for effort`, true);
      } else if (mult === 0) {
        playBad();
        stats.current.mistakes++;
        setStability((s) =>
          Math.max(0, s - 6 * damageMult(upgrades) * mods.damageMult * cfg.damage),
        );
        say("NOTHING HAPPENED", `0 points · ${ev.def.correct} was the move`, false);
      } else {
        playBad();
        stats.current.mistakes++;
        setStability((s) =>
          Math.max(0, s - 10 * damageMult(upgrades) * mods.damageMult * cfg.damage),
        );
        say("WRONG PRIORITY", `${raw} points · ${ev.def.correct} was the move`, false);
      }
    }
    checkObjectives();
    window.setTimeout(() => {
      if (journey.current.length) return; // player already sent her elsewhere
      walkTo(STATION, null, true);
    }, 350);
    force((n) => n + 1);
  }

  function startMini() {
    if (!miniOffer) return;
    stats.current.miniGames++;
    lastMini.current = miniOffer.kind;
    setMini({ kind: miniOffer.kind, lvl: miniOffer.lvl });
    setMiniOffer(null);
  }

  function miniDone(score: number, perfect: boolean) {
    const bonus = Math.round(score * 0.4 * payMult(upgrades, staffBonus) * mods.miniMult);
    /** a low score means the bonus round ran out before it was finished */
    const flunked = !perfect && score < 60;
    stats.current.points += bonus;
    stats.current.xp += 12;
    say(perfect ? "FLAWLESS!" : "BONUS BANKED", `+${bonus} points`, true);
    setStability((s) => Math.min(100, s + (perfect ? 15 : 6)));
    const kind = mini?.kind;
    counters.current.miniDone++;
    if (perfect) counters.current.miniPerfect++;
    if (kind) {
      counters.current.miniByKey[kind] = (counters.current.miniByKey[kind] ?? 0) + 1;
    }
    if (flunked) {
      stats.current.miniFailed++;
      donSay("miniFail", true);
    } else {
      donSay("good");
    }
    setMini(null);
    window.setTimeout(checkObjectives, 1600);
  }


  function abandonMini() {
    setMini(null);
    stats.current.miniAbandoned++;
    /** bailing mid-round costs a little — failing it properly costs less */
    stats.current.points = Math.max(0, stats.current.points - 15);
    setStability((s) => Math.max(0, s - 5));
    donSay("struggling", true);
    say("ABANDONED", "-15 points. The DON noticed.", false);
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
            onClick={() => {
              setManualPause((p) => {
                if (!p) setPauseLine(randomPauseLine());
                return !p;
              });
            }}
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

        {/* this shift's challenges — compact tracker with live progress */}
        <div className="flex items-stretch gap-1.5 overflow-hidden">
          {objectives.map((o) => {
            const prog = Math.min(
              o.target,
              objectiveProgress(o.key, {
                ...counters.current,
                points: stats.current.points,
              }),
            );
            return (
              <span
                key={o.key}
                title={o.label}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1 rounded-xl border-2 border-border px-1.5 py-0.5 text-[10px] font-bold leading-tight",
                  o.done ? "bg-calm text-calm-foreground" : "bg-card",
                )}
              >
                <span className="text-sm leading-none">{o.done ? "✅" : o.icon}</span>
                <span className={cn("truncate", o.done && "line-through")}>{o.label}</span>
                <span className="font-display ml-auto shrink-0">
                  {prog}/{o.target}
                </span>
              </span>
            );
          })}
        </div>

        {jobSecurity > 0 && jobSecurity < FINAL_WARNING_AT && (
          <p className="font-display animate-throb rounded-xl bg-alarm px-2 py-1 text-center text-[11px] font-black uppercase tracking-wider text-alarm-foreground">
            ⚠️ Final warning · job security {jobSecurity}%
          </p>
        )}

      </div>


      {/* WARD */}
      <div
        ref={wardRef}
        className="ward-viewport relative flex-1 select-none overflow-hidden bg-ward-deep"
      >
        <div className="ward-world">
          <img
            src={wardBackgroundAsset.url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          {/* nurses station — fixed to the floor plan, with its original chair anchors */}
          <div
            className="absolute z-10"
            style={{
              left: `${STATION_FRAME.x * 100}%`,
              top: `${STATION_FRAME.y * 100}%`,
              width: `${STATION_FRAME.width * 100}%`,
              height: `${STATION_FRAME.height * 100}%`,
            }}
          >
            <button
              onClick={goStation}
              className="pointer-events-auto absolute inset-0 text-left"
              aria-label="Return to nurses station"
            >
              <img
                src={nursesStationAsset.url}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />
              <div className="absolute bottom-[17%] left-1/2 w-[22%] -translate-x-1/2 text-center text-primary-foreground">
                <p className="font-display truncate text-[9px] font-black uppercase leading-none">Lv {cfg.level}</p>
                <p className="font-display truncate text-[6px] font-black uppercase leading-none">{cfg.name}</p>
              </div>
            </button>

            <div className="pointer-events-none absolute inset-0" aria-label="Five station chairs">
              {Array.from({ length: 5 }, (_, i) => {
                const staffKey = i > 0 ? staff[i - 1] : undefined;
                const info = staffKey ? STAFF.find((s) => s.key === staffKey) : undefined;
                const rt = staffKey ? staffRt.current[staffKey] : undefined;
                const playerSeated = i === 0 && !walking && atBed === null;
                const seated = playerSeated || (!!staffKey && !rt?.eventId && !rt?.path.length);
                const activated = !!staffKey && seated && redAlert;
                const chair = stationChair(i);
                return (
                  <button
                    key={i}
                    onClick={() => staffKey ? tapStaff(staffKey) : goStation()}
                    aria-label={staffKey ? `Send ${info?.name ?? "staff"}` : i === 0 ? "Nurse chair" : "Empty chair"}
                    className={cn(
                      "pointer-events-auto absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center text-xl",
                      activated && "animate-throb rounded-full ring-4 ring-alarm/30",
                    )}
                    style={{ left: `${chair.x * 100}%`, top: `${chair.y * 100}%` }}
                  >
                    <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full">
                      {playerSeated ? (
                        <span className="block h-[52px] w-[41px] overflow-hidden"><Nurse character={character} action="sit" direction="north" /></span>
                      ) : seated && info ? info.icon : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* station facade — counter, side arms and outer rims drawn over
              nurses; only the inner floor (chairs) stays open */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${STATION_FRAME.x * 100}%`,
              top: `${STATION_FRAME.y * 100}%`,
              width: `${STATION_FRAME.width * 100}%`,
              height: `${STATION_FRAME.height * 100}%`,
              /* depth-sorted on the desk's front edge so anyone standing
                 south of the counter walks in front of it */
              zIndex: Math.round((STATION_FRAME.y + STATION_FRAME.height) * 100),
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 13% 24%, 13% 62%, 87% 62%, 87% 24%, 13% 24%)",
            }}
          >

            <img
              src={nursesStationAsset.url}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>



        {/* curtain obstacles */}
        {GATES.map((g) => (
          <div
            key={g.y}
            className="pointer-events-none absolute overflow-visible"
            style={{
              top: `${g.box.top * 100}%`,
              left: `${g.box.left * 100}%`,
              width: `${g.box.width * 100}%`,
              height: `${g.box.height * 100}%`,
              zIndex: Math.round((g.y + 0.0325) * 100),
            }}
          >
            <img
              src={curtainAsset.url}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full object-fill"
              style={{ transform: g.side === "right" ? "scaleX(-1)" : undefined }}
            />
          </div>
        ))}

        {/* staff characters */}
        {staff.map((k) => {
          const info = STAFF.find((s) => s.key === k);
          const rt = staffRt.current[k];
          const pos = staffPos[k] ?? staffHome(k);
          const onJob = !!rt && (rt.eventId !== null || rt.path.length > 0);
          const activated = !onJob && redAlert;
          return onJob ? (
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
          ) : null;
        })}

        {/* beds */}
        {beds.map((b) => {
          const slot = BED_SLOTS[b.id]!;
          const ev = events.find((e) => e.bed === b.id);
          const urg = ev ? urgencyOf(ev.def) : null;
          return (
            <div
              key={b.id}
              className="absolute h-[14%] w-[26%]"
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                transform: "translate(-50%,-50%)",
                zIndex: Math.round(slot.y * 100),
              }}
            >
              {urg && urg !== "routine" && level <= 3 && (
                <span
                  className={cn(
                    "font-display absolute -bottom-1 right-1 z-20 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
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
                revealed={nurseHereBed === b.id}
                onTap={() => tapBed(b.id)}
              />
            </div>
          );
        })}

        {/* contact shadows — a single low layer so characters always
            walk over them, never underneath */}
        <div className="pointer-events-none absolute inset-0 z-[4]">
          {beds.map((b) => {
            const slot = BED_SLOTS[b.id]!;
            return (
              <div
                key={`sh-bed-${b.id}`}
                className="absolute rounded-[50%] bg-black/45 blur-[5px]"
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${(slot.y + 0.042) * 100}%`,
                  width: "25%",
                  height: "6%",
                  transform: "translate(-50%,-50%)",
                }}
              />
            );
          })}
          {GATES.map((g) => (
            <div
              key={`sh-curtain-${g.y}`}
              className="absolute rounded-[50%] bg-black/45 blur-[5px]"
              style={{
                left: `${(g.box.left + g.box.width / 2) * 100}%`,
                top: `${(g.box.top + g.box.height - 0.02) * 100}%`,
                width: `${g.box.width * 88}%`,
                height: "4.5%",
                transform: "translate(-50%,-50%)",
              }}
            />
          ))}
        </div>




        {/* nurse */}
        <div
          className={cn(
            "pointer-events-none absolute h-[84px] w-[62px] transition-all ease-linear",
            !walking && atBed === null && "invisible",
          )}
          style={{
            left: `${nurse.x * 100}%`,
            top: `${nurse.y * 100}%`,
            transform: "translate(-50%,-80%)",
            transitionDuration: "80ms",
            zIndex: Math.round(nurse.y * 100) + 1,
          }}
        >
          <Nurse character={character} moving={walking} action={nurseAction} direction={nurseDirection} expression={selectedEvent && atBed !== null ? "concerned" : "neutral"} />
        </div>
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

        {/* the DON only appears on the live ward screen, never during mini-games or overlays */}
        {don && phase === "play" && !mini && !settingsOpen && !manualPause && (
          <div
            className="pointer-events-none absolute left-1/2 top-[2%] z-[45] flex -translate-x-1/2 flex-col items-center"
            aria-label="The DON is on the ward"
          >
            <div className="animate-pop max-w-[220px] rounded-2xl border-2 border-border bg-card px-2.5 py-1 text-center shadow-lg">
              <p className="font-display text-[11px] font-black uppercase leading-tight">
                {don.line}
              </p>
            </div>
            <span className="animate-bob mt-0.5 grid h-11 w-11 place-items-center rounded-full border-2 border-alarm bg-card text-2xl shadow-lg ring-4 ring-alarm/30">
              🧑‍💼
            </span>
            <span className="font-display rounded-full bg-alarm px-1.5 text-[8px] font-black uppercase text-alarm-foreground">
              DON
            </span>
          </div>
        )}



        {/* shift objectives briefing */}
        {briefing && (
          <div className="absolute inset-0 z-[70] grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
            <div className="animate-pop w-full rounded-3xl border-4 border-border bg-card p-4 shadow-2xl">
              <p className="font-display text-center text-[11px] font-black uppercase tracking-widest text-primary">
                Shift {cfg.level} · {cfg.name}
              </p>
              <h3 className="font-display mt-1 text-center text-2xl font-black uppercase leading-none">
                “{story.title}”
              </h3>
              <p className="mt-1 text-center text-sm font-semibold text-muted-foreground">
                {story.lead}
              </p>
              <p className="font-display mt-3 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                This shift's challenges
              </p>
              <div className="mt-3 space-y-2">
                {objectives.map((o) => (
                  <div
                    key={o.key}
                    className="flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-2.5 py-2"
                  >
                    <span className="text-2xl leading-none">{o.icon}</span>
                    <span className="min-w-0 flex-1 text-sm font-bold leading-tight">
                      {o.label}
                    </span>
                    <span className="font-display shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs font-black text-gold-foreground">
                      +{o.reward.amount} {o.reward.type === "points" ? "⭐" : "✨"}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBriefing(false)}
                className="chunky chunky-press mt-4 w-full rounded-2xl bg-primary py-4 font-display text-xl font-black uppercase text-primary-foreground"
              >
                Start shift ▶
              </button>
            </div>
          </div>
        )}

        {/* start cue */}
        {phase === "ready" && !briefing && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
            <p
              key={cue}
              className="font-display animate-pop text-center text-5xl font-black uppercase leading-none text-primary"
            >
              {cue}
            </p>
          </div>
        )}


        {/* first-shift walkthrough */}
        {tutorial && phase === "play" && tutStep === 0 && (
          <div className="absolute inset-0 z-[65] grid place-items-center bg-background/80 p-5 backdrop-blur-sm">
            <div className="animate-pop w-full rounded-3xl border-4 border-border bg-card p-4 text-center shadow-2xl">
              <p className="font-display text-[11px] font-black uppercase tracking-widest text-primary">
                First shift? Ten-second tour
              </p>
              <h3 className="font-display mt-1 text-3xl font-black uppercase leading-none">
                Your job 🏥
              </h3>
              <p className="mt-3 text-base font-bold">
                Keep every patient stable until the shift timer runs out.
              </p>
              <p className="mt-1 text-base font-semibold text-muted-foreground">
                When a bay lights up or rings the bell, someone needs you.
              </p>
              <button
                onClick={() => setTutStep(1)}
                className="chunky chunky-press mt-4 w-full rounded-2xl bg-primary py-4 font-display text-xl font-black uppercase text-primary-foreground"
              >
                Got it ▶
              </button>
            </div>
          </div>
        )}
        {tutorial && phase === "play" && tutStep === 2 && (
          <div className="absolute inset-0 z-[65] grid place-items-center bg-background/80 p-5 backdrop-blur-sm">
            <div className="animate-pop w-full rounded-3xl border-4 border-border bg-card p-4 text-center shadow-2xl">
              <p className="font-display text-[11px] font-black uppercase tracking-widest text-primary">
                She's on her way
              </p>
              <h3 className="font-display mt-1 text-3xl font-black uppercase leading-none">
                Read, then respond 💬
              </h3>
              <p className="mt-3 text-base font-bold">
                When she arrives you'll see what's wrong — pick the response that fits.
              </p>
              <p className="mt-1 text-base font-semibold text-muted-foreground">
                The best answer pays full points. Others pay half, nothing, or even
                cost you — revealed only after you choose. Judge, don't guess!
              </p>
              <button
                onClick={() => setTutStep(3)}
                className="chunky chunky-press mt-4 w-full rounded-2xl bg-primary py-4 font-display text-xl font-black uppercase text-primary-foreground"
              >
                Got it ▶
              </button>
            </div>
          </div>
        )}

        {/* end countdown — floats over the ward, synced to the real timer */}
        {endCountValue !== null && (
          <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center">
            <div className="text-center">
              <p className="font-display text-xl font-black uppercase tracking-widest text-primary drop-shadow-[0_2px_0_var(--color-background)]">
                Shift finishes in
              </p>
              <p
                key={endCountValue}
                className="font-display animate-pop text-[7rem] font-black leading-none text-primary drop-shadow-[0_4px_0_var(--color-background)]"
              >
                {endCountValue}
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
                {miniGameByKey(miniOffer.kind).name}
              </h3>
              <p className="mt-1 text-sm font-bold">{miniGameByKey(miniOffer.kind).blurb}</p>
              <p className="font-display mt-2 rounded-2xl bg-[image:var(--gradient-gold)] py-2 text-xl font-black text-gold-foreground">
                Reward: up to +{miniOffer.bonus} ⭐
              </p>
              <p className="font-display mt-1 text-sm font-black uppercase text-calm-foreground">
                + 12 ✨ XP for finishing it
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                A small bonus on top of your shift — finish it for the full reward. The ward
                keeps ticking at 1/3 speed and you can abandon any time.
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
                label="All sound"
                icon="🔊"
                on={soundOn && musicOn}
                onToggle={() => {
                  const next = !(soundOn && musicOn);
                  if (soundOn !== next) onToggleSound();
                  setMusicEnabled(next);
                }}
              />
              <SettingRow
                label="Game sounds"
                icon="🎮"
                on={soundOn}
                onToggle={onToggleSound}
              />
              <SettingRow
                label="Music"
                icon="🎵"
                on={musicOn}
                onToggle={toggleMusic}
              />
              <SettingRow
                label="Haptics"
                icon="📳"
                on={hapticsOn}
                onToggle={onToggleHaptics}
              />
              <SettingRow
                label="Auto-save"
                icon="💾"
                on={autoSaveOn}
                onToggle={onToggleAutoSave}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSave?.()}
                  className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-lg font-black uppercase text-secondary-foreground"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => onQuit?.()}
                  className="chunky chunky-press rounded-2xl bg-alarm py-3 font-display text-lg font-black uppercase text-alarm-foreground"
                >
                  🚪 Quit
                </button>
              </div>
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

      {/* action overlay — floats above the ward so opening it never resizes the play area */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30",
          selectedEvent
            ? "max-h-[58%] overflow-y-auto rounded-t-3xl border-t-2 border-border bg-card px-3 pb-4 pt-3 shadow-[0_-10px_24px_-16px_oklch(0_0_0/0.5)]"
            : "pointer-events-none px-2 pb-1",
        )}
      >
        {selectedEvent ? (
          <div className="animate-slide-up space-y-2">
            {(() => {
              const here = nurseHereBed === selectedEvent.bed;
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{here ? selectedEvent.def.icon : "🚶‍♀️"}</span>
                    <div className="min-w-0">
                      <p className="font-display truncate text-base font-black uppercase">
                        {beds[selectedEvent.bed]?.name}
                        {here ? ` — ${selectedEvent.def.label}` : " — on my way"}
                      </p>
                      <p
                        className={cn(
                          "text-base font-bold leading-snug",
                          here ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {here ? selectedEvent.def.brief : "Walking over… you'll see what they want on arrival."}
                      </p>
                    </div>
                  </div>
                  {here ? (
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(selectedEvent.def.options) as ActionKind[]).map((a) => (
                        <button
                          key={a}
                          onClick={() => doAction(a)}
                          className={cn(
                            "chunky chunky-press flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5",
                            ACTION_META[a].color,
                          )}
                        >
                          <span className="text-3xl leading-none">{ACTION_META[a].icon}</span>
                          <span className="font-display text-base font-black">{a}</span>
                          <span className="text-[15px] font-bold leading-snug opacity-95">
                            {selectedEvent.def.options[a]}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-0.5 rounded-2xl bg-muted px-1 py-2 opacity-70"
                        >
                          <span className="text-xl leading-none">❓</span>
                          <span className="font-display text-[11px] font-black text-muted-foreground">
                            ???
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : null}
      </div>

      {/* mini-game overlay + controls */}
      {mini && (
        <>
          {(() => {
            const Game = miniGameByKey(mini.kind).component;
            return (
              <Game level={mini.lvl} paused={manualPause || settingsOpen} onDone={miniDone} />
            );
          })()}
          <div className="absolute inset-x-0 bottom-0 z-40 flex items-stretch gap-2 border-t-2 border-border bg-card px-3 pb-4 pt-3">
            <button
              onClick={() => {
                setPauseLine(randomPauseLine());
                setManualPause(true);
              }}
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
