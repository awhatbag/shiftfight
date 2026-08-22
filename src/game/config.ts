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
  win: string;
  fail: string;
};

export const EVENTS: EventDef[] = [
  {
    key: "sats",
    label: "SATS DIPPING",
    icon: "🫁",
    severity: 3,
    correct: "ESCALATE",
    ttl: 9000,
    win: "Oxygen on. Sats climbing!",
    fail: "Machine goes beep-boop-sad.",
  },
  {
    key: "bleed",
    label: "POST-OP OOZE",
    icon: "🩸",
    severity: 3,
    correct: "ESCALATE",
    ttl: 9000,
    win: "Surgeon paged. Legend.",
    fail: "The linen budget weeps.",
  },
  {
    key: "pump",
    label: "IV PUMP SCREAMING",
    icon: "🔔",
    severity: 2,
    correct: "INTERVENE",
    ttl: 11000,
    win: "Line unkinked. Silence!",
    fail: "Beeping achieves sentience.",
  },
  {
    key: "nausea",
    label: "QUEASY",
    icon: "🤢",
    severity: 2,
    correct: "INTERVENE",
    ttl: 11500,
    win: "Anti-sick given. Crisis dodged.",
    fail: "Mop. So much mop.",
  },
  {
    key: "pain",
    label: "OUCH SCALE 8",
    icon: "😖",
    severity: 2,
    correct: "INTERVENE",
    ttl: 12000,
    win: "Comfort restored.",
    fail: "Patient invents new swear.",
  },
  {
    key: "confused",
    label: "WANDERING",
    icon: "🌀",
    severity: 2,
    correct: "ASSESS",
    ttl: 11000,
    win: "Gently redirected. Nice.",
    fail: "They found the fire exit.",
  },
  {
    key: "blanket",
    label: "CALL BELL: BLANKET",
    icon: "🛎️",
    severity: 1,
    correct: "ASSESS",
    ttl: 14000,
    callBell: true,
    win: "Toasty. Five stars.",
    fail: "Bell rings into the void.",
  },
  {
    key: "tea",
    label: "CALL BELL: TV REMOTE",
    icon: "📺",
    severity: 1,
    correct: "ASSESS",
    ttl: 14000,
    callBell: true,
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

export type Upgrades = { speed: number; response: number; equipment: number };

export const UPGRADE_INFO = [
  {
    key: "speed" as const,
    name: "Nurse Speed",
    icon: "👟",
    blurb: "Sprint between beds",
    cost: (l: number) => 60 + l * 45,
  },
  {
    key: "response" as const,
    name: "Response Time",
    icon: "⏱️",
    blurb: "Patients wait longer",
    cost: (l: number) => 70 + l * 50,
  },
  {
    key: "equipment" as const,
    name: "Equipment",
    icon: "🩺",
    blurb: "Bigger payouts, softer hits",
    cost: (l: number) => 80 + l * 55,
  },
];

export const STAFF = [
  {
    key: "hca",
    name: "Barry the HCA",
    icon: "🧹",
    bonus: "Auto-answers 1 call bell per shift",
    cost: 220,
  },
  {
    key: "student",
    name: "Priya, Student Nurse",
    icon: "🎓",
    bonus: "+15% shift points, asks 400 questions",
    cost: 300,
  },
];

export const BED_UNLOCK_COST = 400;

export const travelMs = (u: Upgrades) => Math.max(140, 520 - u.speed * 85);
export const ttlMult = (u: Upgrades) => 1 + u.response * 0.16;
export const payMult = (u: Upgrades, staffBonus: number) =>
  1 + u.equipment * 0.18 + staffBonus;
export const damageMult = (u: Upgrades) => Math.max(0.4, 1 - u.equipment * 0.15);

export const SHIFT_MS = 80000;

export const RATINGS: { min: number; title: string; line: string }[] = [
  { min: 900, title: "WARD LEGEND", line: "Rumours say you never blinked once." },
  { min: 600, title: "SAFE PAIR OF HANDS", line: "Handover took 4 minutes. Unheard of." },
  { min: 350, title: "MILDLY FERAL", line: "You drank cold tea and liked it." },
  { min: 150, title: "SURVIVED, BARELY", line: "Your ID badge is on backwards." },
  { min: 0, title: "SEEN THINGS", line: "You are now legally a beeping sound." },
];
