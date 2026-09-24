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
