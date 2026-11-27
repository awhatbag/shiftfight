import { BOSS_BATTLE_CONFIG } from "@/config/bossBattleConfig";

/** Battle-local deadlines; each special move owns its own cooldown. */
export function cooldownRemaining(until: number, now: number): number {
  return Math.max(0, until - now);
}

/** Reject repeated activation without extending the original deadline. */
export function activateSpecial(until: number, now: number): number | null {
  if (cooldownRemaining(until, now) > 0) return null;
  return now + BOSS_BATTLE_CONFIG.specialCooldownMs;
}