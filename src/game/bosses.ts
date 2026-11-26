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

/** Neil cannot glide left or right while raising his arms or throwing pens (any phase). */
export function canBossGlide(poseAnim: "throw" | "raise" | null, nowMs: number, poseUntilMs: number): boolean {
  return !(poseAnim !== null && nowMs < poseUntilMs);
}

/** Neil becomes faster and more erratic as his health declines from maxHp toward 0. */
export function bossMovementProfile(hp: number, maxHp = BOSS_BATTLE_CONFIG.bossMaxHp) {
  const clampedHp = Math.max(0, Math.min(maxHp, hp));
  const damageFrac = maxHp > 0 ? 1 - clampedHp / maxHp : 0;
  const speed = BOSS_BATTLE_CONFIG.bossSpeed * (1 + damageFrac * (BOSS_BATTLE_CONFIG.bossMaxSpeedMultiplier - 1));
  const pauseScale = 1 - damageFrac * (1 - BOSS_BATTLE_CONFIG.bossMinPauseScale);
  return {
    speed,
    pauseMinMs: BOSS_BATTLE_CONFIG.bossPauseMinMs * pauseScale,
    pauseMaxMs: BOSS_BATTLE_CONFIG.bossPauseMaxMs * pauseScale,
    erraticChancePerSec: damageFrac * BOSS_BATTLE_CONFIG.bossErraticReversalPerSec,
  };
}

/** Total duration of Neil's raise-arms telegraph (raise up + 2s enraged hold + lower back down). */
export function bossRaiseTotalMs(
  stepMs = BOSS_BATTLE_CONFIG.bossRaiseStepMs,
  holdMs = BOSS_BATTLE_CONFIG.bossRaiseHoldMs,
): number {
  return 5 * stepMs + holdMs + 5 * stepMs;
}

/**
 * Frame & enraged state for Neil's raise-arms sequence:
 * raises 0→4, holds frame 5 for `holdMs` (shaking + red glaze), then lowers 4→0 cleanly.
 */
export function getBossRaiseFrame(
  elapsedMs: number,
  stepMs = BOSS_BATTLE_CONFIG.bossRaiseStepMs,
  holdMs = BOSS_BATTLE_CONFIG.bossRaiseHoldMs,
): { col: number; enraged: boolean; done: boolean } {
  const t = Math.max(0, elapsedMs);
  const upMs = 5 * stepMs;
  const holdEndMs = upMs + holdMs;
  const totalMs = holdEndMs + 5 * stepMs;
  if (t < upMs) {
    return { col: Math.min(4, Math.floor(t / stepMs)), enraged: false, done: false };
  }
  if (t < holdEndMs) {
    return { col: 5, enraged: true, done: false };
  }
  if (t < totalMs) {
    const step = Math.floor((t - holdEndMs) / stepMs);
    return { col: Math.max(0, 4 - step), enraged: false, done: false };
  }
  return { col: 0, enraged: false, done: true };
}
