/**
 * Bed upgrades — a separate shop category that changes how patient calls
 * behave on the ward. Data-driven: add an object and it appears everywhere.
 */

import type { Effects } from "./gear";

export type BedUpgrade = {
  key: string;
  name: string;
  icon: string;
  blurb: string;
  cost: number;
  /** nurse rank level required before it can be bought */
  rank?: number;
  effects: Partial<Effects>;
};

export const BED_UPGRADES: BedUpgrade[] = [
  {
    key: "profiling",
    name: "Profiling Beds",
    icon: "🛏️",
    blurb: "Patients sit themselves up — calls come in a little less urgently.",
    cost: 3200,
    effects: { ttlMult: 1.1 },
  },
  {
    key: "airmattress",
    name: "Air Mattresses",
    icon: "☁️",
    blurb: "Comfier bays mean fewer silly bells.",
    cost: 4400,
    effects: { sillyMult: 0.85 },
  },
  {
    key: "bedrails",
    name: "Padded Bed Rails",
    icon: "🧱",
    blurb: "Fewer wobbles, softer knocks to ward stability.",
    cost: 5200,
    rank: 2,
    effects: { damageMult: 0.88 },
  },
  {
    key: "bedside",
    name: "Bedside Everything Table",
    icon: "🪑",
    blurb: "Remote, water and phone all in reach. Bells drop noticeably.",
    cost: 6800,
    rank: 2,
    effects: { sillyMult: 0.78, ttlMult: 1.04 },
  },
  {
    key: "smartbell",
    name: "Smart Call Bells",
    icon: "🛎️",
    blurb: "Bells triage themselves — more time, slightly chattier ward.",
    cost: 8200,
    rank: 3,
    effects: { ttlMult: 1.16, sillyMult: 1.05 },
  },
  {
    key: "monitorpack",
    name: "Bedside Monitor Pack",
    icon: "📟",
    blurb: "Better obs, better paperwork, better pay.",
    cost: 9600,
    rank: 3,
    effects: { payBonus: 0.1 },
  },
];

export function bedUpgradeByKey(key: string): BedUpgrade | undefined {
  return BED_UPGRADES.find((b) => b.key === key);
}

export function bedUpgradeEffects(owned: string[]): Partial<Effects>[] {
  return owned.map((k) => bedUpgradeByKey(k)?.effects ?? {});
}
