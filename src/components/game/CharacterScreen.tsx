import { useState } from "react";
import {
  COSMETIC_SLOTS,
  cosmeticColor,
  HAIR_COLORS,
  PRESENTATIONS,
  randomCharacter,
  SKIN_TONES,
  type CosmeticOption,
  type PlayerCharacter,
} from "@/game/character";

/** large placeholder preview — real nurse sprites land in a later stage */
function CharacterPreview({ character }: { character: PlayerCharacter }) {
  const skin = cosmeticColor("skin", character.cosmetics.skin);
  const hair = cosmeticColor("hair", character.cosmetics.hair);
  return (
    <div className="relative grid h-44 w-full place-items-center rounded-2xl border-2 border-dashed border-border bg-card/70">
      <svg viewBox="0 0 48 60" className="h-40 w-auto drop-shadow-md" role="img" aria-label="Character preview">
        <rect x="17" y="42" width="6" height="13" rx="3" fill="oklch(0.45 0.1 200)" />
        <rect x="25" y="42" width="6" height="13" rx="3" fill="oklch(0.45 0.1 200)" />
        <rect x="11" y="24" width="26" height="22" rx="9" fill="var(--color-scrub)" />
        <rect x="5" y="27" width="7" height="15" rx="3.5" fill="var(--color-scrub)" />
        <rect x="36" y="27" width="7" height="15" rx="3.5" fill="var(--color-scrub)" />
        <circle cx="24" cy="15" r="11" fill={skin} />
        <path d="M12 12a12 12 0 0 1 24 0z" fill={hair} />
        {character.presentation === "female" && (
          <path d="M12 12v12a4 4 0 0 0 3-4V12zM36 12v12a4 4 0 0 1-3-4V12z" fill={hair} />
        )}
        {character.presentation === "nonbinary" && (
          <path d="M34 8l5-3-1 6z" fill={hair} />
        )}
        <circle cx="20" cy="16" r="1.6" fill="oklch(0.25 0.05 250)" />
        <circle cx="28" cy="16" r="1.6" fill="oklch(0.25 0.05 250)" />
        <path d="M21 20q3 2.5 6 0" stroke="oklch(0.35 0.06 30)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-1 right-2 font-display text-[10px] font-black uppercase text-muted-foreground">
        Placeholder
      </span>
    </div>
  );
}

function Swatches({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: CosmeticOption[];
  value: string | undefined;
  onPick: (key: string) => void;
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
            style={{ background: o.color }}
            className={`h-9 w-9 rounded-full border-2 disabled:opacity-40 ${
              value === o.key ? "border-primary ring-2 ring-primary" : "border-border"
            }`}
          >
            {o.locked ? "🔒" : ""}
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

  function setCosmetic(slot: "skin" | "hair", key: string) {
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
          {COSMETIC_SLOTS.filter((s) => !s.available).map((s) => (
            <p
              key={s.key}
              className="flex items-center justify-between font-display text-xs font-black uppercase"
            >
              {s.name}
              <span className="text-muted-foreground">Coming soon 🔒</span>
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
