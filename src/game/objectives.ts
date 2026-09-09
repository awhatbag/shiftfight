/**
 * SHIFT OBJECTIVES ("This shift's challenges")
 *
 * A small, modular challenge layer that sits on top of the existing gameplay.
 * It never changes scoring, events, staff or mini-game rules — it only *reads*
 * counters reported by the ward and awards a one-off bonus of the existing
 * currencies (points or XP) when a target is reached.
 *
 * Adding a new objective later = add one entry to OBJECTIVE_POOL.
 * Adding a new tracked stat later = add one field to ShiftCounters and bump it
 * from the ward, then reference it as an objective `metric`.
 */

/** Every counter an objective can be measured against. */
export type ShiftCounters = {
  points: number;
  /** best run of consecutive successful actions this shift */
  streak: number;
  /** patients attended (any outcome) */
  patients: number;
  criticalOk: number;
  urgentOk: number;
  routineOk: number;
  /** patient events resolved with the best response */
  eventsOk: number;
  callBells: number;
  miniDone: number;
  miniPerfect: number;
  /** per mini-game completions, keyed by the mini-game registry key */
  miniByKey: Record<string, number>;
};

export function emptyCounters(): ShiftCounters {
  return {
    points: 0,
    streak: 0,
    patients: 0,
    criticalOk: 0,
    urgentOk: 0,
    routineOk: 0,
    eventsOk: 0,
    callBells: 0,
    miniDone: 0,
    miniPerfect: 0,
    miniByKey: {},
  };
}

/**
 * Objective categories. Cosmetic/future categories are listed here so new
 * gameplay systems have an obvious home — they simply have no objectives yet.
 */
export const OBJECTIVE_CATEGORIES = [
  { key: "scoring", label: "Scoring" },
  { key: "patients", label: "Patients" },
  { key: "urgency", label: "Urgency" },
  { key: "minigames", label: "Mini-games" },
  { key: "style", label: "Play style" },
  /* --- reserved for systems not built yet: leave empty until they exist --- */
  { key: "ward", label: "Ward (future)" },
  { key: "staff", label: "Staff (future)" },
  { key: "cosmetics", label: "Cosmetics (future)" },
] as const;

export type ObjectiveCategory = (typeof OBJECTIVE_CATEGORIES)[number]["key"];

export type ObjectiveDef = {
  key: string;
  category: ObjectiveCategory;
  icon: string;
  /** short label shown to the player, target already baked in */
  label: (target: number) => string;
  /** which counter to read */
  metric: (c: ShiftCounters) => number;
  /** target scales gently with shift level */
  target: (level: number) => number;
  /** rough difficulty 1-3, drives the size of the bonus */
  tier: 1 | 2 | 3;
  /** only offer from this shift level upwards */
  minLevel?: number;
};

const miniKey = (k: string) => (c: ShiftCounters) => c.miniByKey[k] ?? 0;

export const OBJECTIVE_POOL: ObjectiveDef[] = [
  /* ---------------- scoring ---------------- */
  {
    key: "points-small",
    category: "scoring",
    icon: "⭐",
    label: (t) => `Bank ${t} points this shift`,
    metric: (c) => c.points,
    target: (lv) => 120 + lv * 30,
    tier: 1,
  },
  {
    key: "points-big",
    category: "scoring",
    icon: "💰",
    label: (t) => `Big earner: ${t} points`,
    metric: (c) => c.points,
    target: (lv) => 260 + lv * 55,
    tier: 3,
    minLevel: 2,
  },
  {
    key: "streak-3",
    category: "scoring",
    icon: "🔥",
    label: (t) => `Hit a ${t}-in-a-row streak`,
    metric: (c) => c.streak,
    target: () => 3,
    tier: 1,
  },
  {
    key: "streak-5",
    category: "scoring",
    icon: "🔥",
    label: (t) => `Winning streak of ${t}`,
    metric: (c) => c.streak,
    target: () => 5,
    tier: 2,
  },
  {
    key: "streak-7",
    category: "scoring",
    icon: "🏆",
    label: (t) => `${t} perfect calls back to back`,
    metric: (c) => c.streak,
    target: () => 7,
    tier: 3,
    minLevel: 3,
  },

  /* ---------------- patients ---------------- */
  {
    key: "patients-4",
    category: "patients",
    icon: "🧑‍🦽",
    label: (t) => `Attend ${t} patients`,
    metric: (c) => c.patients,
    target: (lv) => 4 + Math.floor(lv / 3),
    tier: 1,
  },
  {
    key: "patients-8",
    category: "patients",
    icon: "🚶‍♀️",
    label: (t) => `Busy bee: attend ${t} patients`,
    metric: (c) => c.patients,
    target: (lv) => 8 + Math.floor(lv / 2),
    tier: 2,
  },
  {
    key: "events-ok-4",
    category: "patients",
    icon: "✅",
    label: (t) => `Nail ${t} patient events`,
    metric: (c) => c.eventsOk,
    target: (lv) => 4 + Math.floor(lv / 3),
    tier: 2,
  },
  {
    key: "events-ok-8",
    category: "patients",
    icon: "🌟",
    label: (t) => `Perfect response on ${t} events`,
    metric: (c) => c.eventsOk,
    target: (lv) => 8 + Math.floor(lv / 2),
    tier: 3,
    minLevel: 3,
  },
  {
    key: "bells-3",
    category: "patients",
    icon: "🛎️",
    label: (t) => `Answer ${t} call bells`,
    metric: (c) => c.callBells,
    target: () => 3,
    tier: 1,
  },
  {
    key: "bells-6",
    category: "patients",
    icon: "🔔",
    label: (t) => `Bell magnet: answer ${t}`,
    metric: (c) => c.callBells,
    target: () => 6,
    tier: 2,
    minLevel: 2,
  },

  /* ---------------- urgency ---------------- */
  {
    key: "critical-1",
    category: "urgency",
    icon: "🚨",
    label: (t) => `Sort out ${t} critical patient${t > 1 ? "s" : ""}`,
    metric: (c) => c.criticalOk,
    target: () => 1,
    tier: 1,
  },
  {
    key: "critical-3",
    category: "urgency",
    icon: "🚨",
    label: (t) => `Handle ${t} critical patients`,
    metric: (c) => c.criticalOk,
    target: () => 3,
    tier: 3,
    minLevel: 2,
  },
  {
    key: "urgent-2",
    category: "urgency",
    icon: "⚡",
    label: (t) => `Deal with ${t} urgent patients`,
    metric: (c) => c.urgentOk,
    target: () => 2,
    tier: 1,
  },
  {
    key: "urgent-4",
    category: "urgency",
    icon: "⚡",
    label: (t) => `Urgent specialist: ${t} sorted`,
    metric: (c) => c.urgentOk,
    target: () => 4,
    tier: 2,
    minLevel: 2,
  },
  {
    key: "routine-4",
    category: "urgency",
    icon: "🫖",
    label: (t) => `Don't forget the little things: ${t} routine jobs`,
    metric: (c) => c.routineOk,
    target: () => 4,
    tier: 1,
  },
  {
    key: "mixed-bag",
    category: "urgency",
    icon: "🎭",
    label: () => `One of each: critical, urgent and routine`,
    metric: (c) =>
      Math.min(1, c.criticalOk) + Math.min(1, c.urgentOk) + Math.min(1, c.routineOk),
    target: () => 3,
    tier: 2,
  },

  /* ---------------- mini-games ---------------- */
  {
    key: "mini-1",
    category: "minigames",
    icon: "🎯",
    label: (t) => `Complete ${t} bonus round${t > 1 ? "s" : ""}`,
    metric: (c) => c.miniDone,
    target: () => 1,
    tier: 1,
  },
  {
    key: "mini-2",
    category: "minigames",
    icon: "🎮",
    label: (t) => `Complete ${t} bonus rounds`,
    metric: (c) => c.miniDone,
    target: () => 2,
    tier: 2,
  },
  {
    key: "mini-perfect",
    category: "minigames",
    icon: "💎",
    label: (t) => `Score a flawless bonus round`,
    metric: (c) => c.miniPerfect,
    target: () => 1,
    tier: 3,
    minLevel: 2,
  },
  {
    key: "mini-med",
    category: "minigames",
    icon: "💊",
    label: () => `Finish a Med Trolley Dash`,
    metric: miniKey("med"),
    target: () => 1,
    tier: 2,
  },
  {
    key: "mini-cannula",
    category: "minigames",
    icon: "🩸",
    label: () => `Finish a Cannula Challenge`,
    metric: miniKey("cannula"),
    target: () => 1,
    tier: 2,
  },
  {
    key: "mini-vomit",
    category: "minigames",
    icon: "🪣",
    label: () => `Finish a Sick Bowl Sprint`,
    metric: miniKey("vomit"),
    target: () => 1,
    tier: 2,
  },

  /* ---------------- play style ---------------- */
  {
    key: "style-streak-and-points",
    category: "style",
    icon: "🧠",
    label: (t) => `Steady hands: ${t} points without panicking`,
    metric: (c) => c.points,
    target: (lv) => 180 + lv * 40,
    tier: 2,
  },
  {
    key: "style-allrounder",
    category: "style",
    icon: "🤹",
    label: (t) => `All-rounder: ${t} patients plus a bonus round`,
    metric: (c) => Math.min(c.patients, 6) + Math.min(c.miniDone, 1) * 4,
    target: () => 10,
    tier: 3,
    minLevel: 2,
  },
];

/* ---------------- rewards ---------------- */

export type ObjectiveReward = { type: "points" | "xp"; amount: number };

export type ShiftObjective = {
  key: string;
  icon: string;
  label: string;
  target: number;
  reward: ObjectiveReward;
  done: boolean;
};

function rewardFor(tier: 1 | 2 | 3, type: "points" | "xp"): ObjectiveReward {
  const amount =
    type === "points" ? [40, 70, 110][tier - 1]! : [12, 20, 32][tier - 1]!;
  return { type, amount };
}

/* ---------------- selection ---------------- */

const HISTORY_KEY = "shift-fight-objective-history";
/** how many recently used objective keys we avoid re-offering */
const HISTORY_LEN = 18;

function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeHistory(keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(keys.slice(-HISTORY_LEN)));
  } catch {
    /* storage unavailable — repeats are simply more likely */
  }
}

export function clearObjectiveHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Pick `count` distinct objectives for a shift, preferring ones the player
 * hasn't seen recently (keeps the first ~10 shifts varied).
 */
export function pickObjectives(level: number, count = 3): ShiftObjective[] {
  const history = readHistory();
  const eligible = OBJECTIVE_POOL.filter((o) => (o.minLevel ?? 1) <= level);
  const fresh = shuffle(eligible.filter((o) => !history.includes(o.key)));
  const stale = shuffle(eligible.filter((o) => history.includes(o.key)));
  const chosen = [...fresh, ...stale].slice(0, count);

  /* rotate the reward type so it isn't always the same currency */
  const types: ("points" | "xp")[] = shuffle(
    chosen.map((_, i) => (i % 2 === 0 ? "points" : "xp")),
  );

  writeHistory([...history, ...chosen.map((o) => o.key)]);

  return chosen.map((o, i) => {
    const target = Math.max(1, Math.round(o.target(level)));
    return {
      key: o.key,
      icon: o.icon,
      label: o.label(target),
      target,
      reward: rewardFor(o.tier, types[i] ?? "points"),
      done: false,
    };
  });
}

/** Re-evaluate objectives against the current counters. Pure. */
export function evaluateObjectives(
  objectives: ShiftObjective[],
  counters: ShiftCounters,
): { objectives: ShiftObjective[]; completed: ShiftObjective[] } {
  const completed: ShiftObjective[] = [];
  const next = objectives.map((o) => {
    if (o.done) return o;
    const def = OBJECTIVE_POOL.find((d) => d.key === o.key);
    if (!def) return o;
    if (def.metric(counters) >= o.target) {
      const done = { ...o, done: true };
      completed.push(done);
      return done;
    }
    return o;
  });
  return { objectives: next, completed };
}
