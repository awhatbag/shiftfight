import { BOSS_BATTLE_CONFIG } from "../config/bossBattleConfig";

export const NURSE_SUPPLY_ORDER = [
  0, 1, 2, 3, 4, 0, 1, 2, 3, 4,
  0, 1, 2, 3, 4, 0, 1, 2, 3, 4,
] as const;

export type NurseSupplies = { ammo: number };

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