export type ActionKind = "ASSESS" | "INTERVENE" | "ESCALATE";

export type EventDef = {
  key: string;
  label: string;
  icon: string;
  /** 1 = chill, 3 = spicy */
  severity: 1 | 2 | 3;
  correct: ActionKind;
  ttl: number; // ms before it goes bad
  callBell?: boolean;
  /** one-line situation read-out shown when the bed is selected */
  brief: string;
  /** contextual "what this button does here" copy */
  options: Record<ActionKind, string>;
  win: string;
  fail: string;
};

export const ACTION_META: Record<
  ActionKind,
  { icon: string; tag: string; color: string }
> = {
  ASSESS: { icon: "👀", tag: "Look, ask, reassure", color: "bg-primary" },
  INTERVENE: { icon: "💪", tag: "Hands-on fix, right now", color: "bg-calm" },
  ESCALATE: { icon: "📟", tag: "Bleep the team, fast", color: "bg-alarm" },
};

export const EVENTS: EventDef[] = [
  {
    key: "sats",
    label: "SATS DIPPING",
    icon: "🫁",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Oxygen numbers sliding. This is bigger than you.",
    options: {
      ASSESS: "Stare at the monitor hopefully",
      INTERVENE: "Fiddle with the mask alone",
      ESCALATE: "Fast bleep the medical team",
    },
    win: "Team at the bedside. Sats climbing!",
    fail: "Machine goes beep-boop-sad.",
  },
  {
    key: "bleed",
    label: "POST-OP OOZE",
    icon: "🩸",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Dressing is soaking through. Surgeon problem.",
    options: {
      ASSESS: "Peek and hope it stops",
      INTERVENE: "Add yet another dressing",
      ESCALATE: "Page the surgical reg NOW",
    },
    win: "Surgeon paged. Legend.",
    fail: "The linen budget weeps.",
  },
  {
    key: "pump",
    label: "IV PUMP SCREAMING",
    icon: "🔔",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14000,
    brief: "Kinked line. Fixable in ten seconds.",
    options: {
      ASSESS: "Watch it scream at you",
      INTERVENE: "Unkink the line, restart pump",
      ESCALATE: "Bleep a doctor about a beep",
    },
    win: "Line unkinked. Blessed silence!",
    fail: "Beeping achieves sentience.",
  },
  {
    key: "nausea",
    label: "QUEASY",
    icon: "🤢",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Green around the gills. Bowl and anti-sick.",
    options: {
      ASSESS: "Ask how green they feel",
      INTERVENE: "Bowl, water, anti-sick",
      ESCALATE: "Crash call for a burp",
    },
    win: "Anti-sick given. Crisis dodged.",
    fail: "Mop. So much mop.",
  },
  {
    key: "pain",
    label: "OUCH SCALE 8",
    icon: "😖",
    severity: 2,
    correct: "INTERVENE",
    ttl: 15000,
    brief: "Pain is climbing. They need comfort, not chat.",
    options: {
      ASSESS: "Ask about it. Again.",
      INTERVENE: "Reposition + pain relief",
      ESCALATE: "Wake up the whole hospital",
    },
    win: "Comfort restored.",
    fail: "Patient invents new swear.",
  },
  {
    key: "confused",
    label: "WANDERING",
    icon: "🌀",
    severity: 2,
    correct: "ASSESS",
    ttl: 14000,
    brief: "Muddled and heading for the door. Talk first.",
    options: {
      ASSESS: "Orient, reassure, walk them back",
      INTERVENE: "Grab them. Rude.",
      ESCALATE: "Bleep before you've even looked",
    },
    win: "Gently redirected. Nice.",
    fail: "They found the fire exit.",
  },
  {
    key: "blanket",
    label: "CALL BELL: BLANKET",
    icon: "🛎️",
    severity: 1,
    correct: "ASSESS",
    ttl: 17000,
    callBell: true,
    brief: "Bell ringing. It's a blanket. Probably.",
    options: {
      ASSESS: "Answer the bell, sort them out",
      INTERVENE: "Deploy medical equipment. For a blanket.",
      ESCALATE: "Bleep the consultant. For a blanket.",
    },
    win: "Toasty. Five stars.",
    fail: "Bell rings into the void.",
  },
  {
    key: "tea",
    label: "CALL BELL: TV REMOTE",
    icon: "📺",
    severity: 1,
    correct: "ASSESS",
    ttl: 17000,
    callBell: true,
    brief: "Bell again. The remote has vanished.",
    options: {
      ASSESS: "Answer the bell, find the remote",
      INTERVENE: "Perform a procedure on a sofa cushion",
      ESCALATE: "Escalate a television emergency",
    },
    win: "Remote located under pillow.",
    fail: "Wrong channel forever.",
  },
];

export const PATIENT_NAMES = [
  "Mr Pemberly",
  "Ms Okoro",
  "Mrs Vance",
  "Mr Dhillon",
  "Ms Trent",
  "Mr Baird",
];

/** Big bank of obviously-fictional medication names. Not real drugs. */
export const FICTIONAL_MEDS = [
  "Zolvarin",
  "Brenupax",
  "Corvidyne",
  "Mellodex",
  "Pantorine",
  "Quillaxin",
  "Ferrodyne",
  "Nimbucaine",
  "Trazolen",
  "Balmoxin",
  "Crestapine",
  "Dovaxol",
  "Elmoridan",
  "Fibrolane",
  "Glyverin",
  "Halcyprin",
  "Ibrizole",
  "Junaxide",
  "Kelvorin",
  "Lumaphen",
  "Morvexa",
  "Nyxaprol",
  "Orvadine",
  "Prendasol",
  "Quorvanix",
  "Ravindol",
  "Sombrelex",
  "Tavoquine",
  "Ulmarin",
  "Vextrapil",
  "Wynovax",
  "Xandriline",
  "Yarrowex",
  "Zephyrone",
  "Amberlox",
  "Bindalor",
  "Cystamune",
  "Drossilan",
  "Emberide",
  "Frondazil",
  "Grivalox",
  "Hesperene",
  "Indralux",
  "Jorvatine",
  "Kryllomab",
  "Lantifex",
  "Murovent",
  "Nectarel",
  "Obsidane",
  "Ptarmigal",
  "Quibblex",
  "Rosterol",
  "Sablefen",
  "Thornazide",
  "Umbraphen",
  "Verdilix",
];

export type PillShape = "round" | "capsule" | "oblong" | "triangle";

export const PILL_COLORS = [
  { a: "oklch(0.68 0.2 25)", b: "oklch(0.55 0.2 20)" },
  { a: "oklch(0.75 0.16 155)", b: "oklch(0.6 0.16 160)" },
  { a: "oklch(0.85 0.16 85)", b: "oklch(0.72 0.16 70)" },
  { a: "oklch(0.68 0.15 260)", b: "oklch(0.55 0.16 265)" },
  { a: "oklch(0.72 0.14 320)", b: "oklch(0.6 0.15 325)" },
  { a: "oklch(0.7 0.15 195)", b: "oklch(0.57 0.15 200)" },
  { a: "oklch(0.93 0.02 240)", b: "oklch(0.82 0.03 240)" },
  { a: "oklch(0.72 0.17 45)", b: "oklch(0.6 0.18 40)" },
];

export type Upgrades = { speed: number; response: number; equipment: number };

export const UPGRADE_INFO = [
  {
    key: "speed" as const,
    name: "Nurse Speed",
    icon: "👟",
    blurb: "Sprint between beds",
    cost: (l: number) => 1200 + l * 900,
  },
  {
    key: "response" as const,
    name: "Response Time",
    icon: "⏱️",
    blurb: "Patients wait longer",
    cost: (l: number) => 1400 + l * 1000,
  },
  {
    key: "equipment" as const,
    name: "Equipment",
    icon: "🩺",
    blurb: "Bigger payouts, softer hits",
    cost: (l: number) => 1600 + l * 1100,
  },
];

export const STAFF = [
  {
    key: "hca",
    name: "Barry the HCA",
    icon: "🧹",
    bonus: "Walks the ward, grabs call bells & criticals",
    cost: 4500,
  },
  {
    key: "student",
    name: "Priya, Student Nurse",
    icon: "🎓",
    bonus: "+15% points, handles anything (slowly)",
    cost: 6000,
  },
];

export const BED_UNLOCK_COST = 8000;

export const travelMs = (u: Upgrades) => Math.max(140, 520 - u.speed * 85);
export const ttlMult = (u: Upgrades) => 1 + u.response * 0.16;
export const payMult = (u: Upgrades, staffBonus: number) =>
  1 + u.equipment * 0.18 + staffBonus;
export const damageMult = (u: Upgrades) => Math.max(0.4, 1 - u.equipment * 0.15);

export const SHIFT_MS = 100000;
/** Gentle opening: no pressure ramp until this much of the shift has passed. */
export const WARMUP_MS = 22000;

export const RATINGS: { min: number; title: string; line: string }[] = [
  { min: 900, title: "WARD LEGEND", line: "Rumours say you never blinked once." },
  { min: 600, title: "SAFE PAIR OF HANDS", line: "Handover took 4 minutes. Unheard of." },
  { min: 350, title: "MILDLY FERAL", line: "You drank cold tea and liked it." },
  { min: 150, title: "SURVIVED, BARELY", line: "Your ID badge is on backwards." },
  { min: 0, title: "SEEN THINGS", line: "You are now legally a beeping sound." },
];

/* ------------------------------------------------------------------ */
/* URGENCY                                                             */
/* ------------------------------------------------------------------ */

export type Urgency = "routine" | "urgent" | "critical";

export const URGENCY_META: Record<
  Urgency,
  { label: string; ring: string; chip: string; bar: string; mult: number }
> = {
  routine: {
    label: "ROUTINE",
    ring: "ring-calm",
    chip: "bg-calm text-calm-foreground",
    bar: "bg-calm",
    mult: 1.55,
  },
  urgent: {
    label: "URGENT",
    ring: "ring-gold",
    chip: "bg-gold text-gold-foreground",
    bar: "bg-gold",
    mult: 1,
  },
  critical: {
    label: "CRITICAL",
    ring: "ring-alarm",
    chip: "bg-alarm text-alarm-foreground",
    bar: "bg-alarm",
    mult: 0.62,
  },
};

export const urgencyOf = (def: EventDef): Urgency =>
  def.severity === 3 ? "critical" : def.severity === 2 ? "urgent" : "routine";

/* ------------------------------------------------------------------ */
/* LEVELS 1..10                                                        */
/* ------------------------------------------------------------------ */

export const MAX_LEVEL = 10;

export type LevelConfig = {
  level: number;
  name: string;
  /** beds in play this level (capped by unlocked beds) */
  beds: number;
  /** max simultaneous events */
  maxEvents: number;
  /** chance an eligible spawn tick actually spawns */
  spawnChance: number;
  /** multiplies event ttl — high = generous */
  timeMult: number;
  /** deterioration damage multiplier */
  damage: number;
  /** highest event severity allowed */
  maxSeverity: 1 | 2 | 3;
};

export function levelConfig(levelRaw: number): LevelConfig {
  const level = Math.max(1, Math.min(MAX_LEVEL, levelRaw));
  const t = (level - 1) / (MAX_LEVEL - 1); // 0..1
  const names = [
    "Day One Jitters",
    "Gentle Bay",
    "Getting Busy",
    "Proper Shift",
    "Bells Everywhere",
    "Short Staffed",
    "Full House",
    "Winter Pressures",
    "Absolute Chaos",
    "Ward Legend Run",
  ];
  return {
    level,
    name: names[level - 1] ?? "Ward",
    beds: Math.min(6, 2 + Math.floor(t * 4 + 0.5)),
    maxEvents: Math.min(5, 1 + Math.round(t * 4)),
    spawnChance: 0.28 + t * 0.55,
    /** response windows tighten steadily with level (urgency tiers preserved) */
    timeMult: 1.9 - t * 1.25,
    damage: 0.7 + t * 0.8,
    maxSeverity: level <= 2 ? 1 : level <= 4 ? 2 : 3,
  };
}

/* ------------------------------------------------------------------ */
/* STAFF BEHAVIOUR                                                     */
/* ------------------------------------------------------------------ */

export const STAFF_BEHAVIOUR: Record<
  string,
  { responseMs: number; cooldownMs: number; handles: "bells" | "any"; line: string }
> = {
  hca: {
    responseMs: 4200,
    cooldownMs: 11000,
    handles: "bells",
    line: "Barry got the bell!",
  },
  student: {
    responseMs: 6200,
    cooldownMs: 14000,
    handles: "any",
    line: "Priya handled it (and asked 4 questions)",
  },
};

/* ------------------------------------------------------------------ */
/* SILLY SUMMARY MODIFIERS                                             */
/* ------------------------------------------------------------------ */

export type Quirk = { label: string; pts: number };

const QUIRKS: Quirk[] = [
  { label: "Found a pen that actually works", pts: 40 },
  { label: "Drank an entire hot tea", pts: 60 },
  { label: "Tea went cold. Again.", pts: -35 },
  { label: "Correctly guessed the lunch order", pts: 25 },
  { label: "Squeaky shoe incident", pts: -20 },
  { label: "Restocked the glove box unprompted", pts: 45 },
  { label: "Called a doctor by the wrong name", pts: -30 },
  { label: "Survived the printer", pts: 50 },
  { label: "Left the linen trolley somewhere odd", pts: -25 },
  { label: "Fixed the telly for bay 3", pts: 35 },
  { label: "Alarm went off in your pocket", pts: -15 },
  { label: "Handover finished on time", pts: 70 },
  { label: "Ate a biscuit from the mystery tin", pts: 20 },
  { label: "Lost your favourite pen", pts: -40 },
  { label: "Complimented on your lanyard", pts: 30 },
  { label: "Won the biscuit tin lottery", pts: 55 },
  { label: "Stole a chair from the doctors' office", pts: 40 },
  { label: "Chair immediately reclaimed", pts: -30 },
  { label: "Found the good scissors", pts: 65 },
  { label: "Lost the good scissors", pts: -55 },
  { label: "Badge photo compliment", pts: 25 },
  { label: "Sat down for eleven whole seconds", pts: 45 },
  { label: "Bleep went off mid-sandwich", pts: -35 },
  { label: "Sandwich survived anyway", pts: 30 },
  { label: "Perfect handover voice", pts: 50 },
  { label: "Said 'you too' to the porter's joke", pts: -10 },
  { label: "Untangled every single cable", pts: 60 },
  { label: "Beeped by an empty room", pts: -20 },
  { label: "Found parking on the first lap", pts: 80 },
  { label: "Parking machine ate your coin", pts: -45 },
  { label: "Correctly predicted the fire alarm test", pts: 35 },
  { label: "Sneezed during a quiet moment", pts: -15 },
  { label: "Hair survived the whole shift", pts: 40 },
  { label: "Hair did not survive the whole shift", pts: -25 },
  { label: "Vending machine gave two of them", pts: 70 },
  { label: "Vending machine kept the crisps", pts: -50 },
  { label: "Wore the comfy shoes", pts: 55 },
  { label: "Wore the squeaky shoes. Bold.", pts: -30 },
  { label: "Refilled the water jug army", pts: 45 },
  { label: "Knocked over a water jug", pts: -35 },
  { label: "Made the ward laugh at 4am", pts: 65 },
  { label: "Laughed at your own joke first", pts: -10 },
  { label: "Kept the store cupboard alphabetical", pts: 50 },
  { label: "Left the store cupboard feral", pts: -40 },
  { label: "Rescued a slipper from under a bed", pts: 30 },
  { label: "Bumped the linen trolley into a wall", pts: -20 },
  { label: "Nailed the blood pressure cuff velcro", pts: 25 },
  { label: "Velcro noise woke the whole bay", pts: -30 },
  { label: "Found the last clean pillowcase", pts: 45 },
  { label: "Pillowcase mountain collapsed", pts: -25 },
  { label: "Charted before the end of shift", pts: 75 },
  { label: "Charted with a dying pen", pts: -20 },
  { label: "Remembered everyone's tea order", pts: 60 },
  { label: "Forgot your own tea order", pts: -15 },
  { label: "Silenced the pump in one tap", pts: 55 },
  { label: "Pressed the wrong button twice", pts: -35 },
  { label: "Held a door for eleven people", pts: 30 },
  { label: "Door held you instead", pts: -10 },
  { label: "Got the good locker", pts: 50 },
  { label: "Locker key vanished", pts: -45 },
  { label: "Hand gel dispenser worked first go", pts: 35 },
  { label: "Hand gel jumpscare", pts: -20 },
  { label: "Perfect apron tie", pts: 25 },
  { label: "Apron tie became a knot for life", pts: -25 },
  { label: "Answered the ward phone in a nice voice", pts: 40 },
  { label: "Ward phone rang 31 times", pts: -30 },
  { label: "Convinced the printer to print", pts: 70 },
  { label: "Printer printed 40 blank pages", pts: -50 },
  { label: "Found a working thermometer", pts: 45 },
  { label: "Thermometer went walkabout", pts: -35 },
  { label: "Correctly guessed the doctor's name", pts: 35 },
  { label: "Called the consultant 'mate'", pts: -40 },
  { label: "Fixed the wobbly table with a folded leaflet", pts: 55 },
  { label: "Sat on the wobbly table", pts: -20 },
  { label: "Perfect corner on a bedsheet", pts: 60 },
  { label: "Bedsheet defeated you", pts: -30 },
  { label: "Cheered up the grumpiest visitor", pts: 80 },
  { label: "Got trapped in a 20-minute chat", pts: -35 },
  { label: "Discovered a secret biscuit stash", pts: 75 },
  { label: "Secret biscuit stash discovered by others", pts: -45 },
  { label: "Lift arrived instantly", pts: 65 },
  { label: "Lift stopped at every floor", pts: -40 },
  { label: "Took the stairs. Twice.", pts: 40 },
  { label: "Regretted the stairs", pts: -15 },
  { label: "Kept your pen for the entire shift", pts: 85 },
  { label: "Pen borrowed and never returned", pts: -40 },
  { label: "Restocked the gloves before anyone noticed", pts: 50 },
  { label: "Opened the last glove box wrong way up", pts: -25 },
  { label: "Smashed the handover bingo card", pts: 70 },
  { label: "Said 'quiet' out loud. Rookie.", pts: -60 },
  { label: "Nobody said the Q word", pts: 90 },
  { label: "Warmed a blanket to perfection", pts: 55 },
  { label: "Blanket warmer had opinions", pts: -20 },
  { label: "Beat the trolley to the corner", pts: 35 },
  { label: "Lost to the trolley", pts: -15 },
  { label: "Sorted the notes trolley alphabetically", pts: 60 },
  { label: "Notes trolley now a mystery", pts: -35 },
  { label: "Learned a new joke from bay 2", pts: 45 },
  { label: "Told it wrong to bay 4", pts: -20 },
  { label: "Emptied the bin before it overflowed", pts: 40 },
  { label: "Bin lid attacked", pts: -25 },
  { label: "Kept the nurses' station tidy", pts: 55 },
  { label: "Station now a paperwork volcano", pts: -40 },
  { label: "Found the missing TV remote (again)", pts: 45 },
  { label: "Remote batteries were in backwards", pts: -15 },
  { label: "Hit the bay curtain slide perfectly", pts: 30 },
  { label: "Curtain came off its rail", pts: -45 },
  { label: "Free cake in the staff room", pts: 95 },
  { label: "Cake gone before your break", pts: -55 },
  { label: "Break actually happened", pts: 100 },
  { label: "Break happened in your imagination", pts: -50 },
  { label: "Nailed the pump alarm dance", pts: 40 },
  { label: "Alarm dance witnessed by visitors", pts: -20 },
  { label: "Left the ward better than you found it", pts: 85 },
];

export function rollQuirks(count = 3): Quirk[] {
  return [...QUIRKS].sort(() => Math.random() - 0.5).slice(0, count);
}

/* ------------------------------------------------------------------ */
/* PAUSE / BREAK LINES                                                 */
/* ------------------------------------------------------------------ */

export const PAUSE_LINES = [
  "Tea break. Nothing is ticking.",
  "Hiding in the store cupboard. Shh.",
  "Pretending to check the notes trolley.",
  "Eating a biscuit at inhuman speed.",
  "Sitting down. Revolutionary.",
  "Looking for a pen that works.",
  "Staring into the fridge of forgotten lunches.",
  "Letting the bleep ring. Just once.",
  "Warming your hands on someone's tea.",
  "Practising your handover voice.",
  "Nobody say the Q word.",
  "Untangling one cable. It's therapy.",
  "Reading the noticeboard from 2014.",
  "Waiting for the kettle. Eternally.",
  "Doing the big sigh. The famous one.",
  "Checking your pockets for the good scissors.",
  "Two minutes of blessed silence.",
  "Taking your shoes off. Briefly.",
  "Rehearsing 'I'm fine, just busy!'",
  "Watching the corridor like a hawk. Resting hawk.",
];

export const randomPauseLine = () =>
  PAUSE_LINES[Math.floor(Math.random() * PAUSE_LINES.length)]!;

/* ------------------------------------------------------------------ */
/* NURSE PROGRESSION (XP)                                              */
/* ------------------------------------------------------------------ */

export type NurseRank = { xp: number; title: string; perk: string };

export const NURSE_RANKS: NurseRank[] = [
  { xp: 0, title: "Bank Shift", perk: "Ward shop: upgrades unlocked" },
  { xp: 120, title: "Staff Nurse", perk: "Unlocks hiring staff" },
  { xp: 320, title: "Senior Nurse", perk: "Unlocks ward expansion" },
  { xp: 650, title: "Ward Sister", perk: "Upgrades go one tier higher" },
  { xp: 1100, title: "Matron", perk: "Total ward legend" },
];

export function nurseRank(xp: number) {
  let index = 0;
  NURSE_RANKS.forEach((r, i) => {
    if (xp >= r.xp) index = i;
  });
  const current = NURSE_RANKS[index]!;
  const next = NURSE_RANKS[index + 1] ?? null;
  const span = next ? next.xp - current.xp : 1;
  return {
    index,
    level: index + 1,
    title: current.title,
    perk: current.perk,
    next,
    progress: next ? Math.min(1, (xp - current.xp) / span) : 1,
  };
}
