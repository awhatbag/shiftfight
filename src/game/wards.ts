/**
 * Ward / hospital-section architecture.
 *
 * The game is structured as a list of wards, each owning a range of levels.
 * Only the first ward exists today; the rest are declared so progression,
 * the level ladder and Dev Mode can already handle multiple sections,
 * larger wards and many more levels. Ward designs and their gameplay
 * differences are deliberately NOT implemented yet.
 */

export type WardDef = {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** inclusive global level range this ward covers */
  from: number;
  to: number;
  /** global level the player must have completed to move here */
  unlockAt: number;
  /** beds this section can run up to (future sections can be larger) */
  maxBeds: number;
  /** "live" = playable now, "planned" = architecture only */
  status: "live" | "planned";
};

export const WARDS: WardDef[] = [
  {
    id: "ward-a",
    name: "Ward A · General Medical",
    icon: "🏥",
    blurb: "Four bays, then eight. Where every nurse learns to run.",
    from: 1,
    to: 10,
    unlockAt: 0,
    maxBeds: 8,
    status: "live",
  },
  {
    id: "ward-b",
    name: "Ward B · Surgical Wing",
    icon: "🔪",
    blurb: "Bigger ward, post-op everything. Design to come.",
    from: 11,
    to: 20,
    unlockAt: 10,
    maxBeds: 10,
    status: "planned",
  },
  {
    id: "ed",
    name: "Emergency Department",
    icon: "🚑",
    blurb: "Doors never close. Design to come.",
    from: 21,
    to: 30,
    unlockAt: 20,
    maxBeds: 12,
    status: "planned",
  },
];

export const FIRST_WARD = WARDS[0]!;

/** the highest level the game currently supports across all wards */
export const TOTAL_LEVELS = WARDS[WARDS.length - 1]!.to;

export function wardForLevel(level: number): WardDef {
  return WARDS.find((w) => level >= w.from && level <= w.to) ?? FIRST_WARD;
}

export function wardById(id: string): WardDef {
  return WARDS.find((w) => w.id === id) ?? FIRST_WARD;
}

/** a ward opens once the player has cleared its unlock level (and it exists) */
export function wardUnlocked(w: WardDef, highestLevel: number): boolean {
  return w.status === "live" && highestLevel >= w.unlockAt;
}

/** wards visible on the ladder, including locked/planned ones as teasers */
export function wardLadder(highestLevel: number) {
  return WARDS.map((w) => ({
    ward: w,
    unlocked: wardUnlocked(w, highestLevel),
    levels: Array.from({ length: w.to - w.from + 1 }, (_, i) => w.from + i),
  }));
}

/**
 * Per-ward progression, kept separate so different sections can progress
 * independently later (and so hired staff can eventually run older wards).
 */
export type WardProgress = Record<string, { highestLevel: number }>;

export function updateWardProgress(
  progress: WardProgress,
  level: number,
): WardProgress {
  const w = wardForLevel(level);
  const cur = progress[w.id]?.highestLevel ?? 0;
  if (level <= cur) return progress;
  return { ...progress, [w.id]: { highestLevel: level } };
}
