import type { ActionKind, EventDef } from "./config";

export const AVOCADO_DURATION_MS = 30_000;
export const AVOCADO_KEY_PREFIX = "avocado-";

type AvocadoProblem = {
  label: string;
  call: string;
  brief: string;
  correct: Exclude<ActionKind, "ASSESS">;
  response: string;
  wrong1: [Exclude<ActionKind, "ASSESS">, string];
  wrong2: [Exclude<ActionKind, "ASSESS">, string];
};

const PROBLEMS: AvocadoProblem[] = [
  { label: "AVOCADO UNDER PILLOW", call: "My pillow is unusually lumpy!", brief: "A whole avocado is wedged beneath the pillow.", correct: "INTERVENE", response: "Remove it and restore the pillow", wrong1: ["REASSURE", "Tell them it's a memory-foam feature"], wrong2: ["ESCALATE", "Escalate to the Pillow Standards Committee"] },
  { label: "GUACAMOLE PANIC", call: "Something green is touching my sock!", brief: "A burst avocado has reached the patient's foot.", correct: "REASSURE", response: "Reassure, clean up and keep them safe", wrong1: ["FETCH", "Fetch a single brave paper towel"], wrong2: ["ESCALATE", "Declare the sock a write-off"] },
  { label: "AVOCADO IN WATER JUG", call: "My water has developed a stone!", brief: "An avocado has landed neatly in the water jug.", correct: "FETCH", response: "Fetch fresh water and a clean jug", wrong1: ["REASSURE", "Reassure the jug it's doing great"], wrong2: ["ADJUST", "Stir it and call it a smoothie"] },
  { label: "ROLLING TRIP HAZARD", call: "The floor is trying to trip everyone!", brief: "Three avocados are rolling through the walking route.", correct: "ESCALATE", response: "Escalate the widespread floor hazard", wrong1: ["INTERVENE", "Chase them down the corridor personally"], wrong2: ["REASSURE", "Ask the avocados to please stop"] },
  { label: "BLANKET BULGE", call: "My blanket just rolled downhill!", brief: "An avocado is travelling beneath the blanket.", correct: "INTERVENE", response: "Remove it and straighten the linen", wrong1: ["REASSURE", "Tell them the blanket is just happy to see them"], wrong2: ["ADJUST", "Tuck the avocado in as well"] },
  { label: "CALL BELL PINNED", call: "The green thing has trapped my bell!", brief: "The call bell cable is pinned by an avocado.", correct: "ADJUST", response: "Free and reposition the call bell", wrong1: ["ESCALATE", "Escalate the hostage situation"], wrong2: ["REASSURE", "Reassure the bell until help arrives"] },
  { label: "SLIPPER OCCUPIED", call: "There is produce in my slipper!", brief: "A small avocado is occupying the left slipper.", correct: "INTERVENE", response: "Remove it before the patient stands", wrong1: ["FETCH", "Fetch the avocado its own tiny slipper"], wrong2: ["REASSURE", "Explain that it's paying rent now"] },
  { label: "AVOCADO ON TABLE", call: "My table is under agricultural pressure!", brief: "The bedside table is crowded with unstable avocados.", correct: "ASSIST", response: "Help clear and secure the table", wrong1: ["ADJUST", "Rearrange them into a tasteful centrepiece"], wrong2: ["ESCALATE", "Escalate to the Fruit Union"] },
  { label: "GREEN PROJECTILE", call: "One just flew past my custard!", brief: "Avocados are crossing the patient's meal space.", correct: "RESPOND", response: "Respond and shield the meal area", wrong1: ["REASSURE", "Reassure the custard it is safe now"], wrong2: ["INTERVENE", "Catch the next one mid-air, heroically"] },
  { label: "MASHED SHEETS", call: "I appear to be lying in guacamole!", brief: "A soft avocado has burst across the sheets.", correct: "FETCH", response: "Fetch clean linen and replace the sheets", wrong1: ["REASSURE", "Tell them it's an exfoliating treatment"], wrong2: ["ADJUST", "Smooth it out and hope for the best"] },
  { label: "BED BRAKE BLOCKED", call: "There is fruit near the wheel!", brief: "An avocado is lodged against a bed brake.", correct: "ADJUST", response: "Clear it and check the brake", wrong1: ["ESCALATE", "Escalate before the bed achieves escape velocity"], wrong2: ["REASSURE", "Reassure the patient the bed enjoys travel"] },
  { label: "AVOCADO ARMREST", call: "My elbow rest is now organic!", brief: "An avocado is balanced on the armrest.", correct: "INTERVENE", response: "Remove the unstable avocado", wrong1: ["ADJUST", "Adjust the armrest to accommodate its new resident"], wrong2: ["REASSURE", "Tell them organic is very fashionable"] },
  { label: "FRUITFUL CONFUSION", call: "Is this part of my treatment?", brief: "The patient is worried the avalanche is a clinical procedure.", correct: "REASSURE", response: "Explain calmly that it absolutely is not", wrong1: ["FETCH", "Fetch the official Avocado Therapy consent form"], wrong2: ["ESCALATE", "Escalate to whoever approved this 'treatment'"] },
  { label: "CURTAIN IMPACT", call: "Something green hit the curtain!", brief: "Repeated impacts are shaking the bed curtain.", correct: "ESCALATE", response: "Escalate the unsafe incoming debris", wrong1: ["ADJUST", "Adjust the curtain to dodge"], wrong2: ["REASSURE", "Tell them the curtain has seen worse"] },
  { label: "SOCK GUAC", call: "My sock is becoming a dip!", brief: "Mashed avocado is spreading across the patient's sock.", correct: "FETCH", response: "Fetch cleaning supplies and fresh socks", wrong1: ["REASSURE", "Reassure them dip-coloured socks are in this season"], wrong2: ["INTERVENE", "Peel the sock off at speed, like a bandage"] },
  { label: "TRAY TABLE WOBBLE", call: "My tray is doing a tiny dance!", brief: "A rolling avocado keeps striking the tray table leg.", correct: "ADJUST", response: "Secure the tray and clear the fruit", wrong1: ["REASSURE", "Compliment the tray on its moves"], wrong2: ["ESCALATE", "Escalate the unauthorised choreography"] },
  { label: "AVOCADO HAT", call: "There is produce on my head!", brief: "A small avocado has landed on the patient's head.", correct: "INTERVENE", response: "Remove it and check the patient", wrong1: ["REASSURE", "Tell them it really suits them"], wrong2: ["ADJUST", "Tilt it to a more flattering angle"] },
  { label: "GUAC IN THE NOTES", call: "The paperwork has gone green!", brief: "An avocado has opened across the bedside notes.", correct: "RESPOND", response: "Protect the notes and report the spill", wrong1: ["REASSURE", "Call it a green initiative and move on"], wrong2: ["FETCH", "Fetch a magnifying glass to read through the guac"] },
  { label: "WALKING AID BLOCKED", call: "My frame has captured an avocado!", brief: "Fruit is wedged at the base of the walking aid.", correct: "INTERVENE", response: "Clear it before the patient mobilises", wrong1: ["ADJUST", "Adjust the frame to roll over future fruit"], wrong2: ["REASSURE", "Congratulate the frame on its catch"] },
  { label: "AVOCADO TOWER", call: "They are stacking themselves!", brief: "An improbable avocado tower is leaning over the bed.", correct: "ASSIST", response: "Assist with a controlled dismantling", wrong1: ["ESCALATE", "Escalate to Structural Engineering"], wrong2: ["REASSURE", "Admire the craftsmanship out loud"] },
  { label: "MYSTERY THUD", call: "Something keeps thudding under the bed!", brief: "Several avocados are ricocheting beneath the frame.", correct: "INTERVENE", response: "Clear the fruit from beneath the bed", wrong1: ["REASSURE", "Tell them it's just the ward settling"], wrong2: ["ESCALATE", "Escalate the under-bed percussion section"] },
  { label: "FRUIT IN FOOTWELL", call: "I cannot put my feet down safely!", brief: "The floor beside the bed is covered in avocados.", correct: "ESCALATE", response: "Escalate and isolate the unsafe floor", wrong1: ["INTERVENE", "Sweep them aside with one confident foot"], wrong2: ["REASSURE", "Suggest they simply never stand again"] },
  { label: "AVOCADO ON OBS MACHINE", call: "The machine has acquired a snack!", brief: "An avocado is resting against the observation equipment.", correct: "ADJUST", response: "Remove it and check the equipment", wrong1: ["REASSURE", "Reassure the machine it hasn't been replaced"], wrong2: ["ESCALATE", "Escalate the machine's new dietary habits"] },
  { label: "GUACAMOLE SPLASH", call: "There has been a green incident!", brief: "A burst avocado has splashed the patient and linen.", correct: "ASSIST", response: "Assist with cleaning and fresh linen", wrong1: ["FETCH", "Fetch a tortilla chip, for morale"], wrong2: ["REASSURE", "Tell them green is very soothing"] },
  { label: "PANICKED BY PRODUCE", call: "They keep looking at me!", brief: "The patient is distressed by the relentless rolling fruit.", correct: "REASSURE", response: "Reassure and move hazards away", wrong1: ["INTERVENE", "Make eye contact back, to establish dominance"], wrong2: ["ESCALATE", "Escalate the avocados' staring problem"] },
  { label: "AVOCADO IN BASIN", call: "The wash bowl has grown a stone!", brief: "A whole avocado has landed in the wash basin.", correct: "FETCH", response: "Fetch a clean basin", wrong1: ["ADJUST", "Declare it a decorative water feature"], wrong2: ["REASSURE", "Reassure them the basin is still technically a basin"] },
  { label: "BEDSIDE BARRAGE", call: "They are attacking from the right!", brief: "A concentrated stream of avocados is striking the bedside.", correct: "ESCALATE", response: "Escalate and protect the patient area", wrong1: ["INTERVENE", "Form a human shield, arms out"], wrong2: ["REASSURE", "Tell them the left flank remains secure"] },
  { label: "GREEN BUTTON", call: "I nearly pressed an avocado!", brief: "An avocado is covering the nurse-call control.", correct: "RESPOND", response: "Respond, uncover and test the control", wrong1: ["ADJUST", "Press the avocado and see what happens"], wrong2: ["REASSURE", "Reassure them the avocado means well"] },
  { label: "AVOCADO FOOTREST", call: "The footrest is full of fruit!", brief: "Two avocados are jammed beneath the footrest.", correct: "INTERVENE", response: "Remove them and check movement", wrong1: ["ADJUST", "Raise the footrest to fruit-clearance height"], wrong2: ["FETCH", "Fetch a fruit bowl, embrace the theme"] },
  { label: "GUACAMOLE DRIP", call: "Something green is dripping!", brief: "Mashed avocado is dripping from the overbed table.", correct: "ASSIST", response: "Assist with containment and cleanup", wrong1: ["ADJUST", "Position a cup to catch it, like a leaky roof"], wrong2: ["ESCALATE", "Escalate the drip before it becomes a flow"] },
  { label: "FRUITFUL ALARM", call: "My equipment is beeping at an avocado!", brief: "An avocado has nudged a cable near the monitor.", correct: "ESCALATE", response: "Escalate and keep the equipment untouched", wrong1: ["ADJUST", "Adjust the avocado's cable privileges"], wrong2: ["REASSURE", "Reassure the monitor it's just a phase"] },
  { label: "AVOCADO IN HANDBAG", call: "My handbag has been provisioned!", brief: "An avocado has landed inside the patient's open bag.", correct: "REASSURE", response: "Reassure and return the unexpected item", wrong1: ["FETCH", "Fetch a receipt, for the paperwork"], wrong2: ["INTERVENE", "Confiscate the handbag pending investigation"] },
  { label: "ROLLING TOWARD DRAIN", call: "That one is making an escape!", brief: "An avocado is rolling toward a floor drain.", correct: "RESPOND", response: "Respond before it blocks the drain", wrong1: ["REASSURE", "Wish it well on its journey"], wrong2: ["ESCALATE", "Escalate the attempted drainage infiltration"] },
  { label: "GREEN BED CONTROL", call: "The bed control is wearing guacamole!", brief: "Mashed avocado is covering the bed handset.", correct: "ESCALATE", response: "Escalate the contaminated control", wrong1: ["ADJUST", "Wipe it with a sleeve and say nothing"], wrong2: ["REASSURE", "Reassure the patient the bed still respects them"] },
  { label: "AVOCADO CUDDLE", call: "I have accidentally adopted one!", brief: "The patient is clutching an avocado for emotional support.", correct: "REASSURE", response: "Reassure and gently relocate it", wrong1: ["INTERVENE", "Prise it free like a rugby ball"], wrong2: ["FETCH", "Fetch adoption papers and a tiny blanket"] },
  { label: "PRODUCE PILE-UP", call: "There is a traffic jam by my bed!", brief: "A pile of avocados is blocking safe access.", correct: "ASSIST", response: "Assist with clearing the access route", wrong1: ["ESCALATE", "Escalate to Ward Traffic Control"], wrong2: ["ADJUST", "Install a small roundabout"] },
];

export const AVOCADO_EVENTS: EventDef[] = PROBLEMS.map((problem, index) => ({
  key: `${AVOCADO_KEY_PREFIX}${index + 1}`,
  label: problem.label,
  icon: index % 3 === 0 ? "🥑" : index % 3 === 1 ? "🟢" : "💥",
  severity: index % 7 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
  correct: problem.correct,
  // same base countdown band as ordinary problems of this severity
  ttl: index % 7 === 0 ? 11_500 : index % 3 === 0 ? 14_000 : 17_000,

  callBell: true,
  callLine: problem.call,
  brief: problem.brief,
  options: {
    [problem.correct]: problem.response,
    [problem.wrong1[0]]: problem.wrong1[1],
    [problem.wrong2[0]]: problem.wrong2[1],
  },
  win: "Normal care defeats abnormal produce.",
  fail: "The avocado remains clinically unhelpful.",
}));

export const isAvocadoEvent = (event: EventDef) => event.key.startsWith(AVOCADO_KEY_PREFIX);
/** breathing space before the same patient gets another silly problem */
export const AVOCADO_RESPAWN_MS = 500;

export type AvocadoTally = {
  generated: number;
  best: number;
  sortOf: number;
  worst: number;
  missed: number;
};

export type CatastropheOutcome = "positive" | "neutral" | "negative";

export const emptyTally = (): AvocadoTally => ({
  generated: 0, best: 0, sortOf: 0, worst: 0, missed: 0,
});

/** grade the catastrophe from the outcomes the existing gameplay produced */
export function gradeAvalanche(t: AvocadoTally): CatastropheOutcome {
  const resolved = t.best + t.sortOf + t.worst + t.missed;
  if (!resolved) return "negative";
  const score = (t.best * 1 + t.sortOf * 0.4 - t.worst * 0.6 - t.missed * 1) / resolved;
  if (score >= 0.55) return "positive";
  if (score >= 0.1) return "neutral";
  return "negative";
}

type Conclusion = { title: string; line: string };

const POSITIVE: Conclusion[] = [
  { title: "🥑 The avocados have been contained", line: "Excellent work. I haven't seen avocado-related competence like that in years." },
  { title: "🥑 Avocados: defeated", line: "Excellent work. The avocados have been dealt with." },
  { title: "🥑 Guacamole disaster averted", line: "Outstanding. Nobody mention this to Facilities." },
  { title: "🥑 The Guacening has been prevented", line: "Outstanding. The hospital remains substantially less guacamole-based than it could have been." },
  { title: "🥑 Avocado situation: under control", line: "Excellent work. Please don't ask where the remaining 400 went." },
  { title: "🥑 Zero avocados, zero problems", line: "Well done. Technically there are still avocados everywhere, but we're calling that a win." },
];

const POSITIVE_RARE: Conclusion[] = [
  { title: "🥑 Holy guacamole", line: "I genuinely have no idea how we're going to explain this." },
];

const NEUTRAL: Conclusion[] = [
  { title: "🥑 We have survived the avocados", line: "I'm not sure that's the same thing as success, but we'll take it." },
  { title: "🥑 Avocado incident: mostly fine", line: "That could have gone considerably worse." },
  { title: "🥑 Guacamole levels: acceptable", line: "I'm choosing to call that a success." },
  { title: "🥑 Avocados have been… mostly managed", line: "I've seen worse. I've also seen significantly fewer avocados." },
  { title: "🥑 Avocado situation: containedish", line: "I'll accept that." },
  { title: "🥑 Avocado damage: moderate", line: "Nobody died. Nobody ask me about the beds." },
];

const NEUTRAL_RARE: Conclusion[] = [
  { title: "🥑 Guacward bound", line: "Everyone did their best. Unfortunately, their best was not enough." },
];

const NEGATIVE: Conclusion[] = [
  { title: "🥑 The avocados have won", line: "I have several questions." },
  { title: "🥑 Guacamole event: catastrophic", line: "Who authorised the avocados?" },
  { title: "🥑 Avocado domination achieved", line: "The hospital belongs to them now." },
  { title: "🥑 We have lost the war on avocados", line: "I specifically asked everyone to remain calm." },
  { title: "🥑 Avocado situation: deeply concerning", line: "Why is there an avocado in my office?" },
  { title: "🥑 Guacamole everywhere", line: "I'm going home." },
  { title: "🥑 The great avocado disaster", line: "Facilities has stopped answering my calls." },
  { title: "🥑 Avocados: 47 — us: 0", line: "I'm not discussing the scoreboard." },
  { title: "🥑 This is no longer a hospital", line: "It's an avocado storage facility now." },
  { title: "🥑 Avocado apocalypse", line: "I don't want to talk about what happened in Ward 3." },
];

const NEGATIVE_RARE: Conclusion[] = [
  { title: "🥑 Avocado: 1. Hospital: 0.", line: "I would like to formally blame the supermarket." },
  { title: "🥑 The avocados have escaped", line: "If anyone sees one, do not approach it." },
  { title: "🥑 Guacamole incident declared", line: "This is now someone else's problem." },
];

const POOLS: Record<CatastropheOutcome, { common: Conclusion[]; rare: Conclusion[] }> = {
  positive: { common: POSITIVE, rare: POSITIVE_RARE },
  neutral: { common: NEUTRAL, rare: NEUTRAL_RARE },
  negative: { common: NEGATIVE, rare: NEGATIVE_RARE },
};

/** random headline + DON line for an outcome; the silly ones stay rare */
export function avalancheConclusion(outcome: CatastropheOutcome): Conclusion {
  const { common, rare } = POOLS[outcome];
  const pool = Math.random() < 0.12 && rare.length ? rare : common;
  return pool[Math.floor(Math.random() * pool.length)] ?? common[0]!;
}

/* The intro announcement waits for the player. Its button name rotates
   through the three labels so repeat catastrophes stay fresh. */
const INTRO_BUTTONS = ["Brace for guac ▶", "Let's guac & roll ▶", "To the pits! ▶"] as const;
let introButtonIndex = 0;

export function nextAvalancheButtonLabel(): string {
  const label = INTRO_BUTTONS[introButtonIndex % INTRO_BUTTONS.length]!;
  introButtonIndex++;
  return label;
}
