/**
 * Job Security + DON (Director of Nursing) meta-layer.
 *
 * This module owns nothing but pure logic: the persistent job-security value,
 * the DON's mood bands, the end-of-shift review and the (very fictional)
 * firing reasons. It reads the shift statistics the game already tracks — no
 * duplicate tracking systems.
 */

export const JOB_SECURITY_START = 100;
export const JOB_SECURITY_REHIRE = 50;
/** below this the ward gets a dramatic (but harmless) final warning */
export const FINAL_WARNING_AT = 20;

export type DonMood = "happy" | "watching" | "concerned" | "furious";

export const DON_MOOD_META: Record<
  DonMood,
  { dot: string; label: string; line: string; chip: string; face: string }
> = {
  happy: {
    dot: "🟢",
    label: "Happy",
    line: "Good work. Keep it up.",
    chip: "bg-calm text-calm-foreground",
    face: "🙂",
  },
  watching: {
    dot: "🟡",
    label: "Watching",
    line: "Things are starting to get a little messy.",
    chip: "bg-gold text-gold-foreground",
    face: "👀",
  },
  concerned: {
    dot: "🟠",
    label: "Concerned",
    line: "I'm going to need you to get this ward under control.",
    chip: "bg-gold text-gold-foreground",
    face: "😐",
  },
  furious: {
    dot: "🔴",
    label: "Furious",
    line: "WE NEED TO TALK.",
    chip: "bg-alarm text-alarm-foreground",
    face: "😡",
  },
};

export function moodFor(jobSecurity: number): DonMood {
  if (jobSecurity >= 75) return "happy";
  if (jobSecurity >= 50) return "watching";
  if (jobSecurity >= 25) return "concerned";
  return "furious";
}

/** banded label for the job-security bar */
export function securityBand(js: number): { label: string; tone: string } {
  if (js >= 80) return { label: "Stable", tone: "bg-calm" };
  if (js >= 60) return { label: "Minor concern", tone: "bg-calm" };
  if (js >= 40) return { label: "Warning", tone: "bg-gold" };
  if (js >= 20) return { label: "Serious concern", tone: "bg-gold" };
  if (js > 0) return { label: "Final warning", tone: "bg-alarm" };
  return { label: "Fired", tone: "bg-alarm" };
}

export function clampSecurity(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** the slice of shift stats the review cares about */
export type ReviewInput = {
  helped: number;
  handled: number;
  mistakes: number;
  miniGames: number;
  miniFailed: number;
  miniAbandoned: number;
  overdue: number;
  collapsed: boolean;
  objectivesDone: number;
  donVisited: boolean;
  donAnnoyed: number;
};

export type ShiftReview = {
  stars: number;
  rating: string;
  quote: string;
  delta: number;
  before: number;
  after: number;
  mood: DonMood;
  fired: boolean;
  reason: string | null;
  /** itemised things that moved the needle, best-first */
  notes: { label: string; pts: number }[];
};

const RATING_TEXT: Record<number, { rating: string; quotes: string[] }> = {
  5: {
    rating: "Outstanding",
    quotes: [
      "I have nothing to add. Frightening.",
      "Do that again and I'll start expecting it.",
    ],
  },
  4: {
    rating: "Excellent",
    quotes: ["Could have been worse.", "Nearly impressive. Nearly."],
  },
  3: {
    rating: "Satisfactory",
    quotes: ["Adequate. The ward survived.", "Fine. Not memorable, but fine."],
  },
  2: {
    rating: "Needs Improvement",
    quotes: [
      "Your prioritisation has been described as 'interesting'.",
      "I watched some of that. I wish I hadn't.",
    ],
  },
  1: {
    rating: "Unacceptable",
    quotes: ["WE NEED TO TALK.", "I've seen car parks run better than this."],
  },
};

const DELTA_BY_STARS: Record<number, number> = {
  5: 6,
  4: 3,
  3: 0,
  2: -5,
  1: -10,
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function reviewShift(s: ReviewInput, jobSecurity: number): ShiftReview {
  const good = s.helped + s.miniGames * 1.2 + s.objectivesDone * 2;
  const bad =
    s.mistakes * 1.4 +
    s.overdue * 0.8 +
    s.miniFailed * 0.8 +
    s.miniAbandoned * 1.5 +
    s.donAnnoyed * 1.5 +
    (s.collapsed ? 8 : 0);
  const ratio = good + bad <= 0 ? 0.5 : good / (good + bad);

  let stars = 3;
  if (ratio >= 0.85) stars = 5;
  else if (ratio >= 0.7) stars = 4;
  else if (ratio >= 0.5) stars = 3;
  else if (ratio >= 0.3) stars = 2;
  else stars = 1;
  /** a ward that collapsed can never be praised */
  if (s.collapsed) stars = Math.min(stars, 2);

  let delta = DELTA_BY_STARS[stars] ?? 0;
  /** one bad moment shouldn't sink you; sustained chaos should */
  if (stars <= 2 && s.mistakes <= 1 && !s.collapsed) delta = Math.round(delta / 2);
  if (s.donVisited && stars >= 4) delta += 2;

  const before = clampSecurity(jobSecurity);
  const after = clampSecurity(before + delta);
  const text = RATING_TEXT[stars]!;

  const notes: { label: string; pts: number }[] = [];
  if (s.helped) notes.push({ label: `${s.helped} patients sorted`, pts: 1 });
  if (s.miniGames - s.miniFailed > 0)
    notes.push({ label: `${s.miniGames - s.miniFailed} bonus rounds nailed`, pts: 1 });
  if (s.objectivesDone) notes.push({ label: `${s.objectivesDone} challenges done`, pts: 1 });
  if (s.mistakes) notes.push({ label: `${s.mistakes} slip-ups`, pts: -1 });
  if (s.overdue) notes.push({ label: `${s.overdue} patients left waiting`, pts: -1 });
  if (s.miniFailed) notes.push({ label: `${s.miniFailed} bonus rounds fumbled`, pts: -1 });
  if (s.miniAbandoned) notes.push({ label: `${s.miniAbandoned} bonus rounds bailed on`, pts: -2 });
  if (s.collapsed) notes.push({ label: "The ward fell over", pts: -1 });
  if (s.donAnnoyed) notes.push({ label: "The DON saw things", pts: -1 });

  return {
    stars,
    rating: text.rating,
    quote: pick(text.quotes),
    delta: after - before,
    before,
    after,
    mood: moodFor(after),
    fired: after <= 0,
    reason: after <= 0 ? firingReason(s) : null,
    notes,
  };
}

/** a suitably ridiculous, entirely fictional reason for the paperwork */
export function firingReason(s: ReviewInput): string {
  const pool: string[] = [
    "Your clinical prioritisation has been described as 'interesting'.",
    "The DON has requested that you return your ID badge.",
    "The DON witnessed you standing around while the ward descended into chaos.",
    "HR received a strongly worded note written in biro.",
  ];
  if (s.miniFailed >= 2) pool.push("You failed multiple bonus rounds in a row.");
  if (s.miniFailed >= 1)
    pool.push("You somehow lost a patient while playing Catch The Wee.");
  if (s.miniAbandoned >= 1)
    pool.push("You abandoned a bonus round mid-squirt. There were witnesses.");
  if (s.overdue >= 3) pool.push("You allowed the entire ward to become critically overdue.");
  if (s.collapsed) pool.push("The ward collapsed. Literally the one thing.");
  if (s.mistakes >= 4) pool.push("You spent 43 seconds doing the wrong thing, repeatedly.");
  if (s.helped === 0) pool.push("You helped nobody. Nobody at all. All shift.");
  return pick(pool);
}

/* ---------------- DON ward visits ---------------- */

/** chance (0..1) of the DON turning up during a shift — worse security, more visits */
export function donVisitChance(jobSecurity: number): number {
  const js = clampSecurity(jobSecurity);
  return Math.min(0.55, 0.1 + (100 - js) / 220);
}

export const DON_VISIT_MS = 25000;

export const DON_LINES = {
  arrive: "🚨 THE DON IS HERE",
  arriveSub: "Act natural.",
  good: "Impressive.",
  struggling: "I'll come back later.",
  miniFail: "Really?",
  overdue: "Would you like me to come back tomorrow?",
  leaveOk: "Carry on.",
  leaveBad: "We'll talk after your shift.",
} as const;

/* ---------------- DON one-liner catalogue ---------------- */

/** short, snappy quips grouped by the moment that triggers them */
export const DON_QUIPS: Record<
  "good" | "struggling" | "miniFail" | "overdue" | "idle",
  string[]
> = {
  good: [
    "Impressive.",
    "Hm. Adequate.",
    "Don't let it go to your head.",
    "I saw that. Barely.",
    "Look at you, employed.",
    "Keep doing that exact thing.",
    "Noted. In pencil.",
    "That was almost professional.",
  ],
  struggling: [
    "I'll come back later.",
    "Take your time. Everyone else is.",
    "Shall I hold the ward for you?",
    "This is a lot of standing.",
    "I've seen quicker queues.",
    "Blink twice if you need help.",
  ],
  miniFail: [
    "Really?",
    "That was a choice.",
    "Was that the plan?",
    "I'll pretend I didn't see it.",
    "Interesting technique.",
    "Bold. Wrong, but bold.",
  ],
  overdue: [
    "Would you like me to come back tomorrow?",
    "Bed's been buzzing a while.",
    "Someone is still waiting, you know.",
    "The call bell isn't decorative.",
    "I can hear that from my office.",
  ],
  idle: [
    "…",
    "Carry on. I'm just watching.",
    "Don't mind me.",
    "I have all day.",
    "Pretend I'm not here.",
  ],
};

/** pick a quip that hasn't been used yet this shift; falls back once exhausted */
export function pickDonQuip(kind: keyof typeof DON_QUIPS, used: Set<string>): string {
  const pool = DON_QUIPS[kind];
  const fresh = pool.filter((q) => !used.has(q));
  const line = pick(fresh.length ? fresh : pool);
  used.add(line);
  return line;
}
