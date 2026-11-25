import { BOSS_BATTLE_CONFIG } from "../config/bossBattleConfig";

export const NURSE_SUPPLY_ORDER = [
  0, 1, 2, 3, 4, 0, 1, 2, 3, 4,
  0, 1, 2, 3, 4, 0, 1, 2, 3, 4,
] as const;

export type NurseSupplies = { ammo: number };

export type Hitbox = { width: number; height: number };
export type BossHitbox = Hitbox & { offsetY: number };
export type RestockZone = { minX: number; maxX: number; minY: number; maxY: number };

export type NurseProjectile = {
  id: number;
  item: number;
  x: number;
  y: number;
  /** Normalized arena-width units per second */
  vx: number;
  /** Normalized arena-height units per second */
  vy: number;
  ageMs: number;
};

export type RestockState = {
  elapsedMs: number;
  completedInZone: boolean;
};

export type RestockStepResult = RestockState & {
  active: boolean;
  completedNow: boolean;
  progress: number;
};

export function emptyNurseSupplies(): NurseSupplies {
  return { ammo: 0 };
}

export function refillNurseSupplies(): NurseSupplies {
  return { ammo: BOSS_BATTLE_CONFIG.nurseAmmoCapacity };
}

export function takeNurseProjectile(supplies: NurseSupplies) {
  if (supplies.ammo <= 0) return null;
  const slot = BOSS_BATTLE_CONFIG.nurseAmmoCapacity - supplies.ammo;
  const item = NURSE_SUPPLY_ORDER[slot];
  if (item === undefined) return null;
  return { ammo: supplies.ammo - 1, item };
}

export function isLowAmmo(ammo: number, threshold = BOSS_BATTLE_CONFIG.lowAmmoThreshold): boolean {
  return ammo > 0 && ammo <= threshold;
}

/**
 * Creates a straight-line projectile aimed at Neil's position when fired.
 * Does not home; continues past the aim point until leaving the arena.
 */
export function createAimedProjectile(
  id: number,
  item: number,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  speed: number,
  aspect: number,
): NurseProjectile {
  const dx = targetX - startX;
  const dyInWidths = (targetY - startY) / aspect;
  const dist = Math.hypot(dx, dyInWidths);
  if (dist < 1e-6) {
    return { id, item, x: startX, y: startY, vx: 0, vy: -speed * aspect, ageMs: 0 };
  }
  const ux = dx / dist;
  const uyInWidths = dyInWidths / dist;
  return {
    id,
    item,
    x: startX,
    y: startY,
    vx: ux * speed,
    vy: uyInWidths * speed * aspect,
    ageMs: 0,
  };
}

export function stepProjectile(shot: NurseProjectile, dtSec: number): NurseProjectile {
  return {
    ...shot,
    x: shot.x + shot.vx * dtSec,
    y: shot.y + shot.vy * dtSec,
    ageMs: shot.ageMs + dtSec * 1000,
  };
}

export function isProjectileInBounds(shot: NurseProjectile, margin = 0.08): boolean {
  return shot.x >= -margin && shot.x <= 1 + margin && shot.y >= -margin && shot.y <= 1 + margin;
}

export function hitsBossHitbox(
  shot: Pick<NurseProjectile, "x" | "y">,
  bossX: number,
  bossLaneY: number,
  projBox: Hitbox = BOSS_BATTLE_CONFIG.nurseProjectileHitbox,
  bossBox: BossHitbox = BOSS_BATTLE_CONFIG.bossHitbox,
): boolean {
  const bossCenterY = bossLaneY + bossBox.offsetY;
  return (
    Math.abs(shot.x - bossX) <= (projBox.width + bossBox.width) / 2 &&
    Math.abs(shot.y - bossCenterY) <= (projBox.height + bossBox.height) / 2
  );
}

export function isInRestockZone(
  x: number,
  y: number,
  zone: RestockZone = BOSS_BATTLE_CONFIG.restockZone,
): boolean {
  return x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY;
}

/**
 * Advances automatic trolley restocking. Leaving the zone resets progress
 * without changing ammo; staying for restockMs refills immediately to full.
 */
export function stepRestockState(
  state: RestockState,
  inZone: boolean,
  ammo: number,
  maxAmmo: number,
  dtMs: number,
  restockMs: number,
): RestockStepResult {
  if (!inZone) {
    return { elapsedMs: 0, completedInZone: false, active: false, completedNow: false, progress: 0 };
  }
  if (state.completedInZone || ammo >= maxAmmo) {
    return { elapsedMs: 0, completedInZone: true, active: false, completedNow: false, progress: 0 };
  }
  const nextElapsed = state.elapsedMs + dtMs;
  if (nextElapsed >= restockMs) {
    return { elapsedMs: 0, completedInZone: true, active: false, completedNow: true, progress: 1 };
  }
  return {
    elapsedMs: nextElapsed,
    completedInZone: false,
    active: true,
    completedNow: false,
    progress: Math.min(1, nextElapsed / restockMs),
  };
}