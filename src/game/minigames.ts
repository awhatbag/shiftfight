import type { ComponentType } from "react";
import { MedMatchGame } from "@/components/game/MedMatchGame";
import { CannulaGame } from "@/components/game/CannulaGame";
import { VomitGame } from "@/components/game/VomitGame";
import { WeeGame } from "@/components/game/WeeGame";
import { IVMixGame } from "@/components/game/IVMixGame";
import { SutureGame } from "@/components/game/SutureGame";
import { MandatoryTrainingGame } from "@/components/game/MandatoryTrainingGame";

/** Shared contract every mini-game must satisfy. */
export type MiniGameProps = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

export type MiniGameDef = {
  key: string;
  name: string;
  blurb: string;
  component: ComponentType<MiniGameProps>;
};

/**
 * Central mini-game registry.
 * Add a new mini-game here once and it becomes available to the ward rotation
 * and to the Dev Mode "Mini Games" sub-menu automatically.
 */
export const MINI_GAMES: MiniGameDef[] = [
  {
    key: "med",
    name: "Med Trolley Dash",
    blurb: "Tap the fictional meds in chart order.",
    component: MedMatchGame,
  },
  {
    key: "cannula",
    name: "Cannula Challenge",
    blurb: "Hit the blue vein, avoid the red artery.",
    component: CannulaGame,
  },
  {
    key: "vomit",
    name: "Sick Bowl Sprint",
    blurb: "Wipe the mess off the screen before time runs out.",
    component: VomitGame,
  },
  {
    key: "wee",
    name: "Catch The Wee!",
    blurb: "Slide the bottle under the stream and fill it up.",
    component: WeeGame,
  },
  {
    key: "ivmix",
    name: "Mix The IV Meds",
    blurb: "Line up the syringe, then shake to mix.",
    component: IVMixGame,
  },
  {
    key: "suture",
    name: "Wound Suturing",
    blurb: "Drag the needle across the wound to close it.",
    component: SutureGame,
  },
  {
    key: "training",
    name: "Mandatory Training",
    blurb: "Finish fast. Nobody actually expects you to read it.",
    component: MandatoryTrainingGame,
  },
];

export function miniGameByKey(key: string): MiniGameDef {
  return MINI_GAMES.find((g) => g.key === key) ?? MINI_GAMES[0]!;
}

export function miniGameKeyForIndex(n: number): string {
  return MINI_GAMES[n % MINI_GAMES.length]!.key;
}

/**
 * Pick a random mini-game key from the whole registry, never the same one
 * twice in a row. New entries in MINI_GAMES are eligible automatically.
 */
export function randomMiniGameKey(previous?: string | null): string {
  const pool = MINI_GAMES.filter((g) => g.key !== previous);
  const list = pool.length ? pool : MINI_GAMES;
  return list[Math.floor(Math.random() * list.length)]!.key;
}
