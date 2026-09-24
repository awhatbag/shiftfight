import type { ActionKind, EventDef } from "@/game/config";

export type ActiveEvent = {
  id: number;
  bed: number;
  def: EventDef;
  born: number;
  ttl: number;
  scores: Partial<Record<ActionKind, number>>;
};

export type Banner = { id: number; title: string; sub: string; good: boolean };

export type CatastrophePhase = null | "intro" | "active" | "conclusion";

export type RollingHazard = {
  id: number;
  art: number;
  born: number;
  y: number;
  endY: number;
  size: number;
  speed: number;
  hitX: number | null;
  hitAt: number;
  spin: number;
};
