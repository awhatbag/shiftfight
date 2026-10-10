/**
 * Catastrophe registry.
 * Each catastrophic event is a single data entry: its temporary problem pool,
 * trigger rules, grading, DON lines, intro copy and hazard sprites. The ward
 * runs every entry through the same lifecycle (intro → active → conclusion →
 * resume), the same patient problem flow and the same timer formula.
 * To add a new catastrophe, create its data file and append it to CATASTROPHES.
 */
import type { EventDef } from "./config";
import avocado1Asset from "@/assets/avocado1.png.asset.json";
import avocado2Asset from "@/assets/avocado2.png.asset.json";
import avocado3Asset from "@/assets/avocado3.png.asset.json";
import {
  AVOCADO_DURATION_MS,
  AVOCADO_EVENTS,
  AVOCADO_RESPAWN_MS,
  avalancheConclusion,
  gradeAvalanche,
  isAvocadoEvent,
  nextAvalancheButtonLabel,
  type AvocadoTally,
  type CatastropheOutcome,
} from "./avocado";

export type CatastropheTally = AvocadoTally;
export type { CatastropheOutcome };
export { emptyTally } from "./avocado";

export type CatastropheDef = {
  id: string;
  /** Dev Mode command name and button label */
  devCommand: string;
  devLabel: string;
  /** automatic trigger: only on this level, once per shift */
  level: number;
  /** false keeps a registered catastrophe out of automatic scheduling */
  available?: boolean;
  minRemainingMs: number;
  durationMs: number;
  /** pause before a patient receives their next temporary problem */
  respawnMs: number;
  events: EventDef[];
  isEvent: (event: EventDef) => boolean;
  grade: (tally: CatastropheTally) => CatastropheOutcome;
  conclusion: (outcome: CatastropheOutcome) => { title: string; line: string };
  nextIntroLabel: () => string;
  defaultIntroLabel: string;
  intro: { title: string; lines: string[]; closing: string };
  /** sprites for the on-screen rolling hazard */
  hazardSprites: string[];
};

export const AVOCADO_AVALANCHE: CatastropheDef = {
  id: "avocado-avalanche",
  devCommand: "avocadoAvalanche",
  devLabel: "🥑 Trigger Avocado Avalanche",
  level: 3,
  minRemainingMs: 40_000,
  durationMs: AVOCADO_DURATION_MS,
  respawnMs: AVOCADO_RESPAWN_MS,
  events: AVOCADO_EVENTS,
  isEvent: isAvocadoEvent,
  grade: gradeAvalanche,
  conclusion: avalancheConclusion,
  nextIntroLabel: nextAvalancheButtonLabel,
  defaultIntroLabel: "Brace for guac ▶",
  intro: {
    title: "The Avocado Avalanche",
    lines: [
      "A supermarket promotional display has collapsed.",
      "Approximately 8,000 avocados are currently rolling towards the hospital.",
    ],
    closing: "Please remain calm.",
  },
  hazardSprites: [avocado1Asset.url, avocado2Asset.url, avocado3Asset.url],
};

export const CATASTROPHES: CatastropheDef[] = [AVOCADO_AVALANCHE];

export const isCatastropheEvent = (event: EventDef) =>
  CATASTROPHES.some((c) => c.isEvent(event));

/** catastrophes that may trigger automatically on this level */
export const catastrophesForLevel = (level: number) =>
  CATASTROPHES.filter((c) => c.level === level);

/* ---------------- shared scheduler ----------------
   Pure functions: the scheduler only knows ids, eligibility and the rotation.
   Each catastrophe's gameplay and duration stay inside its own definition. */

/** no catastrophe ever auto-triggers below this level */
export const CATASTROPHE_MIN_LEVEL = 3;
export const CATASTROPHE_GAP_MIN = 2;
export const CATASTROPHE_GAP_MAX = 6;

export type SchedulableCatastrophe = {
  id: string;
  level?: number;
  available?: boolean;
};

export type CatastropheSchedule = {
  /** ordinary shifts still to play before the next catastrophe may run */
  shiftsUntilNext: number;
  /** ids already run in the current rotation */
  completed: string[];
};

export const newSchedule = (): CatastropheSchedule => ({ shiftsUntilNext: 0, completed: [] });

export const isEligible = (c: SchedulableCatastrophe, level: number) =>
  c.available !== false &&
  level >= CATASTROPHE_MIN_LEVEL &&
  (c.level === undefined || c.level === level);

/** id of the catastrophe for this shift, or null if none should run */
export function pickCatastrophe(
  schedule: CatastropheSchedule,
  level: number,
  rng: () => number = Math.random,
  registry: SchedulableCatastrophe[] = CATASTROPHES,
): string | null {
  if (schedule.shiftsUntilNext > 0) return null;
  const pool = registry.filter((c) => isEligible(c, level) && !schedule.completed.includes(c.id));
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!.id;
}

/** call once per finished shift; occurredId only for an automatic catastrophe that actually ran */
export function advanceSchedule(
  schedule: CatastropheSchedule,
  occurredId: string | null,
  rng: () => number = Math.random,
  registry: SchedulableCatastrophe[] = CATASTROPHES,
): CatastropheSchedule {
  if (occurredId) {
    let completed = schedule.completed.includes(occurredId)
      ? schedule.completed
      : [...schedule.completed, occurredId];
    const ids = registry.filter((c) => c.available !== false).map((c) => c.id);
    if (ids.every((id) => completed.includes(id))) completed = [];
    const span = CATASTROPHE_GAP_MAX - CATASTROPHE_GAP_MIN + 1;
    const gap = CATASTROPHE_GAP_MIN + Math.min(span - 1, Math.floor(rng() * span));
    return { shiftsUntilNext: gap, completed };
  }
  return { ...schedule, shiftsUntilNext: Math.max(0, schedule.shiftsUntilNext - 1) };
}

/** tolerate older saves or damaged data */
export function normalizeSchedule(s: unknown): CatastropheSchedule {
  const v = s as Partial<CatastropheSchedule> | null | undefined;
  if (!v || typeof v.shiftsUntilNext !== "number" || !Array.isArray(v.completed)) return newSchedule();
  return {
    shiftsUntilNext: Math.max(0, Math.min(CATASTROPHE_GAP_MAX, Math.floor(v.shiftsUntilNext))),
    completed: v.completed.filter((id): id is string => typeof id === "string"),
  };
}
