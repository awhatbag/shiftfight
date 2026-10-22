import type { ActionKind, EventDef } from "@/game/config";

export type ActiveEvent = {
  id: number;
  bed: number;
  def: EventDef;
  born: number;
  ttl: number;
  scores: Partial<Record<ActionKind, number>>;
  actionOrder: ActionKind[];
};

export type Banner = { id: number; title: string; sub: string; good: boolean };

export type RewardCallout = {
  id: number;
  title: string;
  kind: "combo" | "quick" | "perfect" | "funny";
};

export type CatastrophePhase = null | "intro" | "wave" | "active" | "exit" | "conclusion";

export type RollingHazard = {
  id: number;
  art: number;
  born: number;
  y: number;
  endY: number;
  size: number;
  speed: number;
  hitX: number | null;
  hitY: number | null;
  hitAt: number;
  spin: number;
  stepMs: number;
};

export type StaffRuntime = {
  path: import("@/game/wardNav").Point[];
  eventId: number | null;
  goingHome: boolean;
  cooldownUntil: number;
  lastT: number;
  /** game time at which a newly-arrived staff member walks in through the top doors */
  enterAt?: number | undefined;
  /** walking in from the doors at a visible, unhurried pace */
  entering?: boolean | undefined;
  /** game time until which the staff member attends the patient at the bedside */
  attendUntil?: number | undefined;
};
