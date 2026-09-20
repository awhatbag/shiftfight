/**
 * Player character identity + cosmetics.
 *
 * Deliberately kept separate from gameplay equipment (src/game/gear.ts) and from
 * progression: nothing in here affects stats. Cosmetic options are data-driven so
 * new hairstyles, scrubs, shoes and PPE can be added later. Locked cosmetics are
 * reserved for the future real-money shop; payment logic is intentionally absent.
 */

export type Presentation = "female" | "male" | "nonbinary";

export type CosmeticOption = {
  key: string;
  name: string;
  /** swatch colour for pickers (CSS colour) */
  color?: string;
  /** reserved for future paid cosmetics — not purchasable yet */
  locked?: boolean;
  /** locked cosmetics will be sold for real money when payments launch */
  futurePurchase?: boolean;
};

export type CosmeticSlot = {
  key: "skin" | "hair" | "hairstyle" | "scrubs" | "shoes" | "ppe";
  name: string;
  /** slots that are not editable yet still render as "coming soon" */
  available: boolean;
  options: CosmeticOption[];
};

export const PRESENTATIONS: { key: Presentation; name: string; icon: string }[] = [
  { key: "female", name: "Female", icon: "♀" },
  { key: "male", name: "Male", icon: "♂" },
  { key: "nonbinary", name: "Non-binary", icon: "⚧" },
];

export const SKIN_TONES: CosmeticOption[] = [
  { key: "porcelain", name: "Porcelain", color: "oklch(0.92 0.03 70)" },
  { key: "light", name: "Light", color: "oklch(0.86 0.06 65)" },
  { key: "tan", name: "Tan", color: "oklch(0.75 0.08 60)" },
  { key: "olive", name: "Olive", color: "oklch(0.66 0.07 75)" },
  { key: "brown", name: "Brown", color: "oklch(0.52 0.07 55)" },
  { key: "deep", name: "Deep", color: "oklch(0.38 0.05 45)" },
];

export const HAIR_COLORS: CosmeticOption[] = [
  { key: "black", name: "Black", color: "oklch(0.24 0.02 280)" },
  { key: "brown", name: "Brown", color: "oklch(0.42 0.06 50)" },
  { key: "blonde", name: "Blonde", color: "oklch(0.83 0.12 90)" },
  { key: "ginger", name: "Ginger", color: "oklch(0.62 0.16 45)" },
  { key: "grey", name: "Grey", color: "oklch(0.78 0.01 250)" },
  { key: "pink", name: "Ward pink", color: "oklch(0.72 0.17 350)" },
  { key: "teal", name: "Scrub teal", color: "oklch(0.66 0.12 195)" },
];

export const HAIRSTYLES: CosmeticOption[] = [
  { key: "signature", name: "Signature", color: "oklch(0.42 0.06 50)" },
  { key: "high-bun", name: "High bun", locked: true, futurePurchase: true },
  { key: "long-wave", name: "Long wave", locked: true, futurePurchase: true },
  { key: "side-braid", name: "Side braid", locked: true, futurePurchase: true },
  { key: "soft-crop", name: "Soft crop", locked: true, futurePurchase: true },
  { key: "ponytail", name: "Ponytail", locked: true, futurePurchase: true },
  { key: "side-sweep", name: "Side sweep", locked: true, futurePurchase: true },
];

export const SCRUB_STYLES: CosmeticOption[] = [
  { key: "standard-blue", name: "Ward blue", color: "oklch(0.58 0.16 250)" },
  { key: "rose", name: "Rose rounds", color: "oklch(0.72 0.16 350)", locked: true, futurePurchase: true },
  { key: "teal", name: "Theatre teal", color: "oklch(0.66 0.13 190)", locked: true, futurePurchase: true },
  { key: "violet", name: "Violet shift", color: "oklch(0.61 0.16 300)", locked: true, futurePurchase: true },
  { key: "sky", name: "Sky rounds", color: "oklch(0.7 0.13 230)", locked: true, futurePurchase: true },
  { key: "night", name: "Night response", color: "oklch(0.35 0.08 250)", locked: true, futurePurchase: true },
  { key: "pattern", name: "Pattern ward", color: "oklch(0.68 0.12 195)", locked: true, futurePurchase: true },
];

export const SHOE_STYLES: CosmeticOption[] = [
  { key: "white", name: "White trainers", color: "oklch(0.96 0.01 230)" },
  { key: "clogs", name: "Ward clogs", color: "oklch(0.78 0.04 230)", locked: true, futurePurchase: true },
];

export const PPE_STYLES: CosmeticOption[] = [
  { key: "none", name: "No PPE" },
  { key: "visor", name: "Splash visor", color: "oklch(0.86 0.08 210)", locked: true, futurePurchase: true },
];

/** every cosmetic slot the character system knows about — future slots included */
export const COSMETIC_SLOTS: CosmeticSlot[] = [
  { key: "skin", name: "Skin colour", available: true, options: SKIN_TONES },
  { key: "hair", name: "Hair colour", available: true, options: HAIR_COLORS },
  { key: "hairstyle", name: "Hairstyle", available: true, options: HAIRSTYLES },
  { key: "scrubs", name: "Scrubs", available: true, options: SCRUB_STYLES },
  { key: "shoes", name: "Shoes", available: true, options: SHOE_STYLES },
  { key: "ppe", name: "PPE", available: true, options: PPE_STYLES },
];

export type PlayerCharacter = {
  name: string;
  presentation: Presentation;
  /** cosmetic option keys, keyed by slot — unknown slots are ignored */
  cosmetics: Partial<Record<CosmeticSlot["key"], string>>;
};

export const DEFAULT_CHARACTER: PlayerCharacter = {
  name: "",
  presentation: "female",
  cosmetics: {
    skin: "light",
    hair: "brown",
    hairstyle: "signature",
    scrubs: "standard-blue",
    shoes: "white",
    ppe: "none",
  },
};

const NAME_POOL = [
  "Alex",
  "Sam",
  "Jo",
  "Riley",
  "Nev",
  "Pip",
  "Kit",
  "Frankie",
  "Bex",
  "Marlo",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function unlocked(options: CosmeticOption[]) {
  const free = options.filter((o) => !o.locked);
  return free.length ? free : options;
}

export function randomCharacter(keepName?: string): PlayerCharacter {
  return {
    name: keepName?.trim() ? keepName : pick(NAME_POOL),
    presentation: pick(PRESENTATIONS).key,
    cosmetics: {
      skin: pick(unlocked(SKIN_TONES)).key,
      hair: pick(unlocked(HAIR_COLORS)).key,
      hairstyle: pick(unlocked(HAIRSTYLES)).key,
      scrubs: pick(unlocked(SCRUB_STYLES)).key,
      shoes: pick(unlocked(SHOE_STYLES)).key,
      ppe: pick(unlocked(PPE_STYLES)).key,
    },
  };
}

export function cosmeticColor(slot: CosmeticSlot["key"], key: string | undefined) {
  const s = COSMETIC_SLOTS.find((c) => c.key === slot);
  return s?.options.find((o) => o.key === key)?.color ?? "oklch(0.7 0 0)";
}

export function normalizeCharacter(c: Partial<PlayerCharacter> | null | undefined): PlayerCharacter {
  if (!c) return { ...DEFAULT_CHARACTER, cosmetics: { ...DEFAULT_CHARACTER.cosmetics } };
  return {
    name: typeof c.name === "string" ? c.name.slice(0, 16) : "",
    presentation:
      PRESENTATIONS.some((p) => p.key === c.presentation) && c.presentation
        ? c.presentation
        : DEFAULT_CHARACTER.presentation,
    cosmetics: {
      skin:
        SKIN_TONES.find((o) => o.key === c.cosmetics?.skin)?.key ?? SKIN_TONES[0]!.key,
      hair:
        HAIR_COLORS.find((o) => o.key === c.cosmetics?.hair)?.key ?? HAIR_COLORS[1]!.key,
      hairstyle:
        HAIRSTYLES.find((o) => o.key === c.cosmetics?.hairstyle)?.key ?? "signature",
      scrubs:
        SCRUB_STYLES.find((o) => o.key === c.cosmetics?.scrubs)?.key ?? "standard-blue",
      shoes:
        SHOE_STYLES.find((o) => o.key === c.cosmetics?.shoes)?.key ?? "white",
      ppe: PPE_STYLES.find((o) => o.key === c.cosmetics?.ppe)?.key ?? "none",
    },
  };
}

const CHARACTER_KEY = "shift-fight-character";

export function readCharacter(): PlayerCharacter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHARACTER_KEY);
    return raw ? normalizeCharacter(JSON.parse(raw) as PlayerCharacter) : null;
  } catch {
    return null;
  }
}

export function writeCharacter(c: PlayerCharacter) {
  try {
    window.localStorage.setItem(CHARACTER_KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable */
  }
}

export function clearCharacter() {
  try {
    window.localStorage.removeItem(CHARACTER_KEY);
  } catch {
    /* storage unavailable */
  }
}
