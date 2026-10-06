import { BED_UPGRADES } from "./bedUpgrades";
import { bedsForLevel, nurseRank, STAFF, UPGRADE_INFO } from "./config";
import { GEAR_ITEMS } from "./gear";

export type RewardPresentation = {
  beforeXp: number;
  afterXp: number;
  xpEarned: number;
  beforeRank: ReturnType<typeof nurseRank>;
  afterRank: ReturnType<typeof nurseRank>;
  unlocks: string[];
};

export function unlocksBetween(
  beforeXp: number,
  afterXp: number,
  beforeShiftLevel: number,
  afterShiftLevel: number,
): string[] {
  const beforeRank = nurseRank(beforeXp).level;
  const afterRank = nurseRank(afterXp).level;
  const unlocks: string[] = [];

  for (const item of GEAR_ITEMS) {
    const need = item.rank ?? 1;
    if (need > beforeRank && need <= afterRank) unlocks.push(`${item.icon} ${item.name}`);
  }
  for (const bed of BED_UPGRADES) {
    const need = bed.rank ?? 1;
    if (need > beforeRank && need <= afterRank) unlocks.push(`${bed.icon} ${bed.name}`);
  }
  for (const member of STAFF) {
    const need = member.rank ?? 2;
    if (need > beforeRank && need <= afterRank) unlocks.push(`${member.icon} ${member.name}`);
  }
  if (beforeRank < 4 && afterRank >= 4) {
    unlocks.push(`⬆️ ${UPGRADE_INFO.map((upgrade) => upgrade.name).join(", ")} tier 5`);
  }
  const beforeBeds = bedsForLevel(beforeShiftLevel);
  const afterBeds = bedsForLevel(afterShiftLevel);
  if (afterBeds > beforeBeds) unlocks.push(`🛏️ ${afterBeds}-bed ward`);

  return [...new Set(unlocks)];
}

export function notableAchievement(stats: {
  maxCombo: number;
  mistakes: number;
  miniGames: number;
  miniFailed: number;
  callBells: number;
  helped: number;
}): string | null {
  if (stats.mistakes === 0 && stats.helped >= 3) return "✨ Clean chart — zero mistakes";
  if (stats.maxCombo >= 7) return `🔥 Ward on fire — x${stats.maxCombo} combo`;
  if (stats.miniGames > 0 && stats.miniFailed === 0) return "🎯 Bonus-round specialist";
  if (stats.callBells >= 6) return "🛎️ Bell whisperer";
  return stats.helped >= 5 ? `💚 ${stats.helped} patients steadied` : null;
}