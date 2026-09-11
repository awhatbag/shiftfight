/**
 * Nurse equipment & cosmetic gear.
 *
 * Purely data-driven: add a new object to GEAR_ITEMS and it appears in the
 * shop, in Dev Mode and in the effect maths automatically.
 */

export type GearCategory = "shoes" | "ppe" | "pager" | "scrubs" | "watch" | "cap";

export const GEAR_CATEGORIES: { key: GearCategory; name: string; icon: string }[] = [
  { key: "shoes", name: "Shoes", icon: "👟" },
  { key: "ppe", name: "PPE", icon: "🥽" },
  { key: "pager", name: "Pagers & Phones", icon: "📟" },
  { key: "scrubs", name: "Scrubs", icon: "👕" },
  { key: "watch", name: "Fob Watches", icon: "⌚" },
  { key: "cap", name: "Nurse Caps", icon: "🧢" },
];

/** every effect a gear item (or bed upgrade) can contribute */
export type Effects = {
  /** <1 = the nurse walks faster */
  travelMult: number;
  /** >1 = patients wait longer before things go bad */
  ttlMult: number;
  /** added straight onto the existing pay bonus */
  payBonus: number;
  /** <1 = stability hits hurt less */
  damageMult: number;
  /** >1 = bigger mini-game bonuses */
  miniMult: number;
  /** <1 = fewer silly/routine call bells */
  sillyMult: number;
  /** >1 = more XP from the shift */
  xpMult: number;
};

export const NO_EFFECTS: Effects = {
  travelMult: 1,
  ttlMult: 1,
  payBonus: 0,
  damageMult: 1,
  miniMult: 1,
  sillyMult: 1,
  xpMult: 1,
};

export type GearItem = {
  key: string;
  category: GearCategory;
  name: string;
  icon: string;
  blurb: string;
  cost: number;
  /** nurse rank level required before it can be bought (1 = always) */
  rank?: number;
  effects: Partial<Effects>;
};

export const GEAR_ITEMS: GearItem[] = [
  /* 👟 shoes */
  {
    key: "clogs",
    category: "shoes",
    name: "Squeaky Clogs",
    icon: "👟",
    blurb: "Faster on your feet. Everyone hears you coming.",
    cost: 1200,
    effects: { travelMult: 0.92 },
  },
  {
    key: "trainers",
    category: "shoes",
    name: "Night-Shift Trainers",
    icon: "🏃",
    blurb: "Properly quick, but no pockets for extra kit.",
    cost: 4200,
    rank: 2,
    effects: { travelMult: 0.82, payBonus: -0.03 },
  },
  {
    key: "boots",
    category: "shoes",
    name: "Steel-Toe Ward Boots",
    icon: "🥾",
    blurb: "Slower, but nothing dropped on your foot ruins the shift.",
    cost: 3600,
    effects: { travelMult: 1.05, damageMult: 0.85 },
  },
  /* 🥽 PPE */
  {
    key: "goggles",
    category: "ppe",
    name: "Splash Goggles",
    icon: "🥽",
    blurb: "Bonus rounds get messy. You don't.",
    cost: 2600,
    effects: { miniMult: 1.12 },
  },
  {
    key: "apron",
    category: "ppe",
    name: "Industrial Apron",
    icon: "🧽",
    blurb: "Bad moments bounce off you.",
    cost: 5200,
    rank: 2,
    effects: { damageMult: 0.82 },
  },
  /* 📟 pagers */
  {
    key: "bleep",
    category: "pager",
    name: "Ancient Bleep",
    icon: "📟",
    blurb: "Half the range, all the confidence. Patients wait a bit longer.",
    cost: 1800,
    effects: { ttlMult: 1.06 },
  },
  {
    key: "smartphone",
    category: "pager",
    name: "Ward Smartphone",
    icon: "📱",
    blurb: "Escalate fast — but it buzzes constantly.",
    cost: 6400,
    rank: 3,
    effects: { ttlMult: 1.14, sillyMult: 1.1 },
  },
  /* 👕 scrubs */
  {
    key: "scrubs_teal",
    category: "scrubs",
    name: "Lucky Teal Scrubs",
    icon: "👕",
    blurb: "Slightly better tips from the universe.",
    cost: 2200,
    effects: { payBonus: 0.08 },
  },
  {
    key: "scrubs_pockets",
    category: "scrubs",
    name: "Eleven-Pocket Scrubs",
    icon: "🧵",
    blurb: "Everything to hand. Nothing findable.",
    cost: 5800,
    rank: 2,
    effects: { payBonus: 0.12, travelMult: 1.03 },
  },
  /* ⌚ fob watches */
  {
    key: "fob",
    category: "watch",
    name: "Standard Fob Watch",
    icon: "⌚",
    blurb: "You finally know what time it is.",
    cost: 1500,
    effects: { ttlMult: 1.05 },
  },
  {
    key: "fob_gold",
    category: "watch",
    name: "Retirement Gold Fob",
    icon: "🥇",
    blurb: "Given to someone else. Now yours. Time bends.",
    cost: 7600,
    rank: 3,
    effects: { ttlMult: 1.12, xpMult: 1.08 },
  },
  /* 🧢 caps */
  {
    key: "cap_classic",
    category: "cap",
    name: "Classic Nurse Cap",
    icon: "🧢",
    blurb: "Authority. Patients ring the bell slightly less.",
    cost: 3000,
    effects: { sillyMult: 0.88 },
  },
  {
    key: "cap_glitter",
    category: "cap",
    name: "Glitter Cap",
    icon: "✨",
    blurb: "Morale through the roof. Silly requests too.",
    cost: 2800,
    effects: { xpMult: 1.12, sillyMult: 1.12 },
  },
  {
    key: "cap_matron",
    category: "cap",
    name: "Matron's Cap",
    icon: "👑",
    blurb: "The ward behaves. The DON notices.",
    cost: 9800,
    rank: 4,
    effects: { sillyMult: 0.78, payBonus: 0.06 },
  },
];

export function gearByKey(key: string): GearItem | undefined {
  return GEAR_ITEMS.find((g) => g.key === key);
}

/** combine any list of partial effects into one full Effects object */
export function combineEffects(parts: Partial<Effects>[]): Effects {
  return parts.reduce<Effects>(
    (acc, p) => ({
      travelMult: acc.travelMult * (p.travelMult ?? 1),
      ttlMult: acc.ttlMult * (p.ttlMult ?? 1),
      payBonus: acc.payBonus + (p.payBonus ?? 0),
      damageMult: acc.damageMult * (p.damageMult ?? 1),
      miniMult: acc.miniMult * (p.miniMult ?? 1),
      sillyMult: acc.sillyMult * (p.sillyMult ?? 1),
      xpMult: acc.xpMult * (p.xpMult ?? 1),
    }),
    { ...NO_EFFECTS },
  );
}

export function gearEffects(owned: string[]): Effects {
  return combineEffects(owned.map((k) => gearByKey(k)?.effects ?? {}));
}
