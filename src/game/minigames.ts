import type { ComponentType } from "react";
import { MedMatchGame } from "@/components/game/MedMatchGame";
import { CannulaGame } from "@/components/game/CannulaGame";
import { VomitGame } from "@/components/game/VomitGame";

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
];

export function miniGameByKey(key: string): MiniGameDef {
  return MINI_GAMES.find((g) => g.key === key) ?? MINI_GAMES[0]!;
}

export function miniGameKeyForIndex(n: number): string {
  return MINI_GAMES[n % MINI_GAMES.length]!.key;
}
