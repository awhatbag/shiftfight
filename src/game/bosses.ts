import { BOSS_BATTLE_CONFIG } from "@/config/bossBattleConfig";

/**
 * Boss registry + pure progression rules. Bosses sit between ladder levels:
 * each unlocks after clearing `afterLevel` and must be beaten before the next
 * level opens. Future bosses follow every 10 played levels.
 */
export type BossDef = {
  id: string;
  name: string;
  role: string;
  title: string;
  afterLevel: number;
  /** label shown on the ladder, e.g. "10.1" */
  stage: string;
};

export const BOSSES: BossDef[] = [
  {
    id: "neil",
    name: "Neil",
    role: "Rostering Manager",
    title: "The Roster From Hell",
    afterLevel: 10,
    stage: "10.1",
  },
];

export type BossProgress = Record<string, { unlocked?: boolean; defeated?: boolean }>;

export function bossById(id: string): BossDef | undefined {
  return BOSSES.find((b) => b.id === id);
}

/** the boss sitting straight after a cleared level, if any */
export function bossAfterLevel(level: number): BossDef | undefined {
  return BOSSES.find((b) => b.afterLevel === level);
}

export function bossUnlocked(b: BossDef, p: BossProgress | undefined): boolean {
  return !!(p?.[b.id]?.unlocked || p?.[b.id]?.defeated);
}

export function bossDefeated(b: BossDef, p: BossProgress | undefined): boolean {
  return !!p?.[b.id]?.defeated;
}

/** records a cleared level; unlocks the boss that follows it */
export function unlockAfterLevel(p: BossProgress, clearedLevel: number): BossProgress {
  const b = bossAfterLevel(clearedLevel);
  if (!b || bossUnlocked(b, p)) return p;
  return { ...p, [b.id]: { ...p[b.id], unlocked: true } };
}

export function markDefeated(p: BossProgress, id: string): BossProgress {
  return { ...p, [id]: { ...p[id], unlocked: true, defeated: true } };
}

/** a level is reachable only once every boss placed before it is beaten */
export function levelGateOpen(level: number, p: BossProgress | undefined): boolean {
  return BOSSES.every((b) => level <= b.afterLevel || bossDefeated(b, p));
}

export type BossPhase = 1 | 2 | 3;

export function phaseFor(hp: number, maxHp = BOSS_BATTLE_CONFIG.bossMaxHp): BossPhase {
  const pct = (Math.max(0, hp) / maxHp) * 100;
  if (pct <= BOSS_BATTLE_CONFIG.phases.phase3At) return 3;
  if (pct <= BOSS_BATTLE_CONFIG.phases.phase2At) return 2;
  return 1;
}

/** a representative HP for jumping straight to a phase (dev testing) */
export function hpForPhase(phase: BossPhase, maxHp = BOSS_BATTLE_CONFIG.bossMaxHp): number {
  const { phase2At, phase3At } = BOSS_BATTLE_CONFIG.phases;
  if (phase === 1) return maxHp;
  if (phase === 2) return Math.round((maxHp * phase2At) / 100);
  return Math.round((maxHp * phase3At) / 100);
}
