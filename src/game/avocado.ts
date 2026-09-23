import type { ActionKind, EventDef } from "./config";

export const AVOCADO_DURATION_MS = 30_000;
export const AVOCADO_KEY_PREFIX = "avocado-";

type AvocadoProblem = {
  label: string;
  call: string;
  brief: string;
  correct: Exclude<ActionKind, "ASSESS">;
  response: string;
};

const PROBLEMS: AvocadoProblem[] = [
  { label: "AVOCADO UNDER PILLOW", call: "My pillow is unusually lumpy!", brief: "A whole avocado is wedged beneath the pillow.", correct: "INTERVENE", response: "Remove it and restore the pillow" },
  { label: "GUACAMOLE PANIC", call: "Something green is touching my sock!", brief: "A burst avocado has reached the patient's foot.", correct: "REASSURE", response: "Reassure, clean up and keep them safe" },
  { label: "AVOCADO IN WATER JUG", call: "My water has developed a stone!", brief: "An avocado has landed neatly in the water jug.", correct: "FETCH", response: "Fetch fresh water and a clean jug" },
  { label: "ROLLING TRIP HAZARD", call: "The floor is trying to trip everyone!", brief: "Three avocados are rolling through the walking route.", correct: "ESCALATE", response: "Escalate the widespread floor hazard" },
  { label: "BLANKET BULGE", call: "My blanket just rolled downhill!", brief: "An avocado is travelling beneath the blanket.", correct: "INTERVENE", response: "Remove it and straighten the linen" },
  { label: "CALL BELL PINNED", call: "The green thing has trapped my bell!", brief: "The call bell cable is pinned by an avocado.", correct: "ADJUST", response: "Free and reposition the call bell" },
  { label: "SLIPPER OCCUPIED", call: "There is produce in my slipper!", brief: "A small avocado is occupying the left slipper.", correct: "INTERVENE", response: "Remove it before the patient stands" },
  { label: "AVOCADO ON TABLE", call: "My table is under agricultural pressure!", brief: "The bedside table is crowded with unstable avocados.", correct: "ASSIST", response: "Help clear and secure the table" },
  { label: "GREEN PROJECTILE", call: "One just flew past my custard!", brief: "Avocados are crossing the patient's meal space.", correct: "RESPOND", response: "Respond and shield the meal area" },
  { label: "MASHED SHEETS", call: "I appear to be lying in guacamole!", brief: "A soft avocado has burst across the sheets.", correct: "FETCH", response: "Fetch clean linen and replace the sheets" },
  { label: "BED BRAKE BLOCKED", call: "There is fruit near the wheel!", brief: "An avocado is lodged against a bed brake.", correct: "ADJUST", response: "Clear it and check the brake" },
  { label: "AVOCADO ARMREST", call: "My elbow rest is now organic!", brief: "An avocado is balanced on the armrest.", correct: "INTERVENE", response: "Remove the unstable avocado" },
  { label: "FRUITFUL CONFUSION", call: "Is this part of my treatment?", brief: "The patient is worried the avalanche is a clinical procedure.", correct: "REASSURE", response: "Explain calmly that it absolutely is not" },
  { label: "CURTAIN IMPACT", call: "Something green hit the curtain!", brief: "Repeated impacts are shaking the bed curtain.", correct: "ESCALATE", response: "Escalate the unsafe incoming debris" },
  { label: "SOCK GUAC", call: "My sock is becoming a dip!", brief: "Mashed avocado is spreading across the patient's sock.", correct: "FETCH", response: "Fetch cleaning supplies and fresh socks" },
  { label: "TRAY TABLE WOBBLE", call: "My tray is doing a tiny dance!", brief: "A rolling avocado keeps striking the tray table leg.", correct: "ADJUST", response: "Secure the tray and clear the fruit" },
  { label: "AVOCADO HAT", call: "There is produce on my head!", brief: "A small avocado has landed on the patient's head.", correct: "INTERVENE", response: "Remove it and check the patient" },
  { label: "GUAC IN THE NOTES", call: "The paperwork has gone green!", brief: "An avocado has opened across the bedside notes.", correct: "RESPOND", response: "Protect the notes and report the spill" },
  { label: "WALKING AID BLOCKED", call: "My frame has captured an avocado!", brief: "Fruit is wedged at the base of the walking aid.", correct: "INTERVENE", response: "Clear it before the patient mobilises" },
  { label: "AVOCADO TOWER", call: "They are stacking themselves!", brief: "An improbable avocado tower is leaning over the bed.", correct: "ASSIST", response: "Assist with a controlled dismantling" },
  { label: "MYSTERY THUD", call: "Something keeps thudding under the bed!", brief: "Several avocados are ricocheting beneath the frame.", correct: "INTERVENE", response: "Clear the fruit from beneath the bed" },
  { label: "FRUIT IN FOOTWELL", call: "I cannot put my feet down safely!", brief: "The floor beside the bed is covered in avocados.", correct: "ESCALATE", response: "Escalate and isolate the unsafe floor" },
  { label: "AVOCADO ON OBS MACHINE", call: "The machine has acquired a snack!", brief: "An avocado is resting against the observation equipment.", correct: "ADJUST", response: "Remove it and check the equipment" },
  { label: "GUACAMOLE SPLASH", call: "There has been a green incident!", brief: "A burst avocado has splashed the patient and linen.", correct: "ASSIST", response: "Assist with cleaning and fresh linen" },
  { label: "PANICKED BY PRODUCE", call: "They keep looking at me!", brief: "The patient is distressed by the relentless rolling fruit.", correct: "REASSURE", response: "Reassure and move hazards away" },
  { label: "AVOCADO IN BASIN", call: "The wash bowl has grown a stone!", brief: "A whole avocado has landed in the wash basin.", correct: "FETCH", response: "Fetch a clean basin" },
  { label: "BEDSIDE BARRAGE", call: "They are attacking from the right!", brief: "A concentrated stream of avocados is striking the bedside.", correct: "ESCALATE", response: "Escalate and protect the patient area" },
  { label: "GREEN BUTTON", call: "I nearly pressed an avocado!", brief: "An avocado is covering the nurse-call control.", correct: "RESPOND", response: "Respond, uncover and test the control" },
  { label: "AVOCADO FOOTREST", call: "The footrest is full of fruit!", brief: "Two avocados are jammed beneath the footrest.", correct: "INTERVENE", response: "Remove them and check movement" },
  { label: "GUACAMOLE DRIP", call: "Something green is dripping!", brief: "Mashed avocado is dripping from the overbed table.", correct: "ASSIST", response: "Assist with containment and cleanup" },
  { label: "FRUITFUL ALARM", call: "My equipment is beeping at an avocado!", brief: "An avocado has nudged a cable near the monitor.", correct: "ESCALATE", response: "Escalate and keep the equipment untouched" },
  { label: "AVOCADO IN HANDBAG", call: "My handbag has been provisioned!", brief: "An avocado has landed inside the patient's open bag.", correct: "REASSURE", response: "Reassure and return the unexpected item" },
  { label: "ROLLING TOWARD DRAIN", call: "That one is making an escape!", brief: "An avocado is rolling toward a floor drain.", correct: "RESPOND", response: "Respond before it blocks the drain" },
  { label: "GREEN BED CONTROL", call: "The bed control is wearing guacamole!", brief: "Mashed avocado is covering the bed handset.", correct: "ESCALATE", response: "Escalate the contaminated control" },
  { label: "AVOCADO CUDDLE", call: "I have accidentally adopted one!", brief: "The patient is clutching an avocado for emotional support.", correct: "REASSURE", response: "Reassure and gently relocate it" },
  { label: "PRODUCE PILE-UP", call: "There is a traffic jam by my bed!", brief: "A pile of avocados is blocking safe access.", correct: "ASSIST", response: "Assist with clearing the access route" },
];

const distractors: Exclude<ActionKind, "ASSESS">[] = [
  "INTERVENE", "ESCALATE", "FETCH", "ADJUST", "ASSIST", "REASSURE", "RESPOND",
];

export const AVOCADO_EVENTS: EventDef[] = PROBLEMS.map((problem, index) => {
  const correct = problem.correct;
  const alternatives = distractors.filter((action) => action !== correct);
  const first = alternatives[index % alternatives.length] ?? "RESPOND";
  const second = alternatives.find((action, i) => i >= (index * 3 + 2) % alternatives.length && action !== first)
    ?? alternatives.find((action) => action !== first)
    ?? "REASSURE";
  return {
    key: `${AVOCADO_KEY_PREFIX}${index + 1}`,
    label: problem.label,
    icon: index % 3 === 0 ? "🥑" : index % 3 === 1 ? "🟢" : "💥",
    severity: index % 7 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
    correct,
    // same base countdown band as ordinary problems of this severity
    ttl: index % 7 === 0 ? 11_500 : index % 3 === 0 ? 14_000 : 17_000,

    callBell: true,
    callLine: problem.call,
    brief: problem.brief,
    options: {
      ASSESS: "Assess what the avocado has actually done",
      [correct]: problem.response,
      [first]: `Try ${first.toLowerCase()} instead`,
      [second]: `Try ${second.toLowerCase()} instead`,
    },
    win: "Normal care defeats abnormal produce.",
    fail: "The avocado remains clinically unhelpful.",
  };
});

export const isAvocadoEvent = (event: EventDef) => event.key.startsWith(AVOCADO_KEY_PREFIX);

/** each avocado problem runs on a normal, short patient countdown */
export const AVOCADO_PROBLEM_TTL_MS = 9_500;
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
