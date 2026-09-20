import { useState } from "react";
import {
  COSMETIC_SLOTS,
  HAIR_COLORS,
  HAIRSTYLES,
  PPE_STYLES,
  PRESENTATIONS,
  randomCharacter,
  SCRUB_STYLES,
  SHOE_STYLES,
  SKIN_TONES,
  type CosmeticOption,
  type CosmeticSlot,
  type PlayerCharacter,
} from "@/game/character";
import { Nurse } from "./Nurse";

function CharacterPreview({ character }: { character: PlayerCharacter }) {
  return (
    <div className="rounded-xl border-2 border-border bg-card/70 p-2">
      <div className="grid h-44 place-items-center rounded-lg bg-secondary/60">
        <Nurse character={character} variant="preview" className="h-40" />
      </div>
    </div>
  );
}

function Swatches({
  label,
  options,
  value,
  onPick,
  compact = false,
}: {
  label: string;
  options: CosmeticOption[];
  value: string | undefined;
  onPick: (key: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            aria-label={o.name}
            disabled={o.locked}
            onClick={() => onPick(o.key)}
            style={o.color ? { background: o.color } : undefined}
            className={`${compact ? "h-8 min-w-8 px-1" : "h-9 w-9"} rounded-lg border-2 text-[10px] disabled:opacity-55 ${
              value === o.key ? "border-primary ring-2 ring-primary" : "border-border"
            }`}
          >
            {o.locked ? "🔒" : !o.color ? o.name.slice(0, 3) : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CharacterScreen({
  character,
  onChange,
  onConfirm,
}: {
  character: PlayerCharacter;
  onChange: (c: PlayerCharacter) => void;
  onConfirm: (c: PlayerCharacter) => void;
}) {
  const [customising, setCustomising] = useState(false);

  function setCosmetic(slot: CosmeticSlot["key"], key: string) {
    onChange({ ...character, cosmetics: { ...character.cosmetics, [slot]: key } });
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h1 className="font-display text-center text-2xl font-black uppercase">
        Who's working today?
      </h1>

      <CharacterPreview character={character} />

      <div>
        <p className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground">
          Your name
        </p>
        <input
          value={character.name}
          maxLength={16}
          placeholder="Nurse name"
          onChange={(e) => onChange({ ...character, name: e.target.value })}
          className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-3 font-display text-base font-black uppercase"
        />
      </div>

      <div>
        <p className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground">
          Character
        </p>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {PRESENTATIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => onChange({ ...character, presentation: p.key })}
              className={`chunky-press rounded-xl border-2 py-3 font-display text-xs font-black uppercase ${
                character.presentation === p.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground"
              }`}
            >
              <span className="block text-base">{p.icon}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <Swatches
        label="Skin colour"
        options={SKIN_TONES}
        value={character.cosmetics.skin}
        onPick={(k) => setCosmetic("skin", k)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Swatches label="Hairstyle" options={HAIRSTYLES} value={character.cosmetics.hairstyle} onPick={(k) => setCosmetic("hairstyle", k)} compact />
        <Swatches label="Scrubs" options={SCRUB_STYLES} value={character.cosmetics.scrubs} onPick={(k) => setCosmetic("scrubs", k)} compact />
        <Swatches label="Shoes" options={SHOE_STYLES} value={character.cosmetics.shoes} onPick={(k) => setCosmetic("shoes", k)} compact />
        <Swatches label="PPE" options={PPE_STYLES} value={character.cosmetics.ppe} onPick={(k) => setCosmetic("ppe", k)} compact />
      </div>
      <Swatches
        label="Hair colour"
        options={HAIR_COLORS}
        value={character.cosmetics.hair}
        onPick={(k) => setCosmetic("hair", k)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setCustomising((c) => !c)}
          className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          🎨 Customise
        </button>
        <button
          onClick={() => onChange(randomCharacter(character.name))}
          className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          🎲 Randomise
        </button>
      </div>

      {customising && (
        <div className="space-y-2 rounded-2xl border-2 border-border bg-card/80 p-3">
          <p className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground">
            More cosmetics
          </p>
          {COSMETIC_SLOTS.flatMap((s) => s.options.filter((o) => o.locked).map((o) => ({ slot: s.name, option: o }))).map(({ slot, option }) => (
            <p
              key={`${slot}-${option.key}`}
              className="flex items-center justify-between font-display text-xs font-black uppercase"
            >
              <span>{option.name} <span className="text-muted-foreground">· {slot}</span></span>
              <span className="text-muted-foreground">Future purchase 🔒</span>
            </p>
          ))}
        </div>
      )}

      <button
        onClick={() => onConfirm(character)}
        className="chunky chunky-press mt-auto w-full shrink-0 rounded-2xl bg-primary py-5 font-display text-2xl font-black uppercase tracking-wide text-primary-foreground"
      >
        Clock in ▶
      </button>
    </div>
  );
}
