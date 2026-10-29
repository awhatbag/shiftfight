import { cn } from "@/lib/utils";
import {
  bedsForLevel,
  MAX_BEDS,
  MAX_STAFF,
  STAFF,
  UPGRADE_INFO,
  type Upgrades,
} from "@/game/config";
import { GEAR_CATEGORIES, GEAR_ITEMS } from "@/game/gear";
import { BED_UPGRADES } from "@/game/bedUpgrades";
import { StaffPortrait } from "./StaffPortrait";
import { Nurse } from "./Nurse";
import type { PlayerCharacter } from "@/game/character";
import { useState, type ReactNode } from "react";

function Section({ title, children, show, cork }: { title: string; children: ReactNode; show: boolean; cork?: boolean }) {
  if (!show) return null;
  return (
    <div className={cn("store-shelf", cork && "store-cork")}>
      <p className="store-shelf-label mx-2 -mt-1 mb-2 inline-block px-2 py-1 font-display text-xs font-black uppercase">{title}</p>
      <div className="space-y-2 px-2 pb-3">{children}</div>
    </div>
  );
}

export function UpgradeScreen({
  points,
  level,
  rank,
  upgrades,
  bedCount,
  staff,
  gear,
  equippedGear,
  bedUpgrades,
  freshUnlocks,
  onBuy,
  onHire,
  onBuyGear,
  onToggleGear,
  onBuyBedUpgrade,
  onSave,
  saveNote,
  onBack,
  onCustomise,
  character,
}: {
  character: PlayerCharacter;
  points: number;
  level: number;
  rank: {
    level: number;
    title: string;
    perk: string;
    next: { xp: number; title: string } | null;
    progress: number;
  };
  upgrades: Upgrades;
  bedCount: number;
  staff: string[];
  gear: string[];
  equippedGear: string[];
  bedUpgrades: string[];
  /** shop item keys unlocked by the latest rank-up, shown as NEW */
  freshUnlocks: string[];
  onBuy: (k: keyof Upgrades, cost: number) => void;
  onHire: (k: string, cost: number) => void;
  onBuyGear: (k: string, cost: number) => void;
  onToggleGear: (k: string) => void;
  onBuyBedUpgrade: (k: string, cost: number) => void;
  onSave: () => void;
  saveNote: string;
  onBack: () => void;
  onCustomise?: () => void;
}) {
  const maxTier = rank.level >= 4 ? 5 : 4;
  const seatsLeft = MAX_STAFF - staff.length;
  const nextBedLevel = Array.from({ length: 10 }, (_, i) => i + 1).find(
    (l) => l > level && bedsForLevel(l) > bedCount,
  );
  const [tab, setTab] = useState<string>("ward");
  const TAB_LABELS: Record<string, string> = {
    shoes: "👟 Shoes",
    ppe: "🥽 PPE",
    pager: "📟 Pagers",
    scrubs: "👕 Scrubs",
    watch: "⌚ Watches",
    cap: "🧢 Caps",
  };
  const tabs = [
    { id: "ward", label: "🩺 Ward" },
    ...GEAR_CATEGORIES.map((c) => ({ id: c.key as string, label: TAB_LABELS[c.key] ?? c.name })),
    { id: "staff", label: "👥 Staff" },
  ];
  /** does this tab contain anything freshly unlocked? */
  const tabHasNew = (id: string): boolean => {
    if (id === "ward")
      return freshUnlocks.includes("tier5") || BED_UPGRADES.some((b) => freshUnlocks.includes(b.key));
    if (id === "staff") return STAFF.some((s) => freshUnlocks.includes(s.key));
    return GEAR_ITEMS.some((g) => g.category === id && freshUnlocks.includes(g.key));
  };
  const tabButton = (t: { id: string; label: string }) => (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      className={cn(
        "chunky chunky-press relative flex h-14 w-full items-center justify-center rounded-xl px-1 text-center font-display text-xs font-black uppercase leading-tight",
        tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
      )}
    >
      {t.label}
      {tabHasNew(t.id) && (
        <span className="absolute -right-1 -top-1 animate-pulse rounded-full bg-[image:var(--gradient-gold)] px-1.5 py-0.5 font-display text-[9px] font-black text-gold-foreground shadow">
          ✨NEW
        </span>
      )}
    </button>
  );

  return (
    <div className="store-room flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="rounded-2xl border-2 border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-black uppercase">
            ✨ Nurse Lv {rank.level} · {rank.title}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {rank.next ? `Next: ${rank.next.title}` : "Max rank"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-calm)]"
            style={{ width: `${rank.progress * 100}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{rank.perk}</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="store-sign min-w-0 px-3 pb-3 pt-1.5">
          <h2 className="font-display truncate text-lg font-black uppercase leading-tight">Ward Supply Cupboard</h2>
          <p className="font-display text-[10px] font-black uppercase text-destructive">⚠ Authorised access only</p>
        </div>
        <span className="font-display shrink-0 rounded-xl bg-[image:var(--gradient-gold)] px-3 py-1.5 text-base font-black text-gold-foreground">
          ⭐ {points}
        </span>
      </div>

      <div className="store-locker p-2">
        <div className="flex flex-col items-center gap-2">
          <p className="store-shelf-label px-2 py-0.5 font-display text-[10px] font-black uppercase">🔑 Staff locker</p>
          <button
            type="button"
            onClick={onCustomise}
            disabled={!onCustomise}
            aria-label="Customise nurse"
            className={cn(
              "relative h-80 w-48 rounded-sm border-4 border-[var(--store-ink)] bg-[image:var(--gradient-gold)] p-1",
              onCustomise && "chunky-press cursor-pointer",
            )}
          >
            <Nurse character={character} variant="preview" className="h-full" />
          </button>
          {onCustomise && (
            <button
              onClick={onCustomise}
              className="chunky chunky-press w-48 rounded-xl bg-secondary py-1.5 font-display text-[11px] font-black uppercase text-secondary-foreground"
            >
              🎨 Customise
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {tabs.map((t) => tabButton(t))}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-1 rounded-sm bg-card/90 p-1">
          {equippedGear.length === 0 && (
            <span className="text-[11px] text-muted-foreground">Nothing equipped yet</span>
          )}
          {equippedGear.map((k) => {
            const g = GEAR_ITEMS.find((x) => x.key === k);
            return g ? (
              <span key={k} className="rounded-lg bg-secondary px-1.5 py-0.5 text-[11px]">
                {g.icon} {g.name}
              </span>
            ) : null;
          })}
        </div>
      </div>

      <Section show={tab === "ward"} title="🧴 Clean Utility · Ward kit">
        {freshUnlocks.includes("tier5") && (
          <p className="animate-pulse rounded-xl bg-[image:var(--gradient-gold)] px-3 py-2 text-center font-display text-xs font-black uppercase text-gold-foreground">
            ✨ New tier unlocked — upgrades can go to tier 5!
          </p>
        )}
        {UPGRADE_INFO.map((u) => {
          const lvl = upgrades[u.key];
          const cost = u.cost(lvl);
          const max = lvl >= maxTier;
          const can = !max && points >= cost;
          return (
            <button
              key={u.key}
              disabled={!can}
              data-sfx="equip"
              onClick={() => onBuy(u.key, cost)}
              className={cn(
                "store-bin flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left transition-transform",
                can ? "chunky chunky-press" : "opacity-60",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                {u.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">
                  {u.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{u.blurb}</p>
                <div className="mt-1 flex gap-1">
                  {Array.from({ length: maxTier }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-6 rounded-full",
                        i < lvl ? "bg-calm" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="font-display shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-black text-primary-foreground">
                {max ? "MAX" : `⭐${cost}`}
              </span>
            </button>
          );
        })}
      <div className="rounded-2xl border-2 border-dashed border-border bg-card/70 p-3">
        <p className="font-display text-xs font-black uppercase text-muted-foreground">
          Ward expansion · unlocked by shift level
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: MAX_BEDS }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "grid h-8 flex-1 place-items-center rounded-lg text-xs",
                  i < bedCount ? "bg-calm/40" : "bg-muted",
                )}
              >
                {i < bedCount ? "🛏️" : "🔒"}
              </span>
            ))}
          </div>
          <span className="font-display shrink-0 text-xs font-black text-calm-foreground">
            {bedCount >= MAX_BEDS
              ? `${MAX_BEDS}-BED WARD!`
              : `+1 BED AT LV${nextBedLevel ?? level}`}
          </span>
        </div>
      </div>
      </Section>

      {/* ---------- nurse equipment ---------- */}
      <>
        {GEAR_CATEGORIES.map((cat) => {
          const items = GEAR_ITEMS.filter((g) => g.category === cat.key);
          if (!items.length) return null;
          return (
            <Section key={cat.key} show={tab === cat.key} title={`${cat.icon} Uniform Stores · ${cat.name}`}>
              {items.map((g) => {
                const owned = gear.includes(g.key);
                const equipped = equippedGear.includes(g.key);
                const locked = rank.level < (g.rank ?? 1);
                const can = !owned && !locked && points >= g.cost;
                const isNew = !owned && freshUnlocks.includes(g.key);
                return (
                  <button
                    key={g.key}
                    disabled={!owned && !can}
                    data-sfx="equip"
                    onClick={() => (owned ? onToggleGear(g.key) : onBuyGear(g.key, g.cost))}
                    className={cn(
                      "store-bin flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left",
                      owned || can ? "chunky chunky-press" : "opacity-60",
                      equipped && "border-calm bg-calm/10",
                      isNew && "border-gold shadow-[0_0_10px_var(--gold)]",
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                      {g.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate text-sm font-black uppercase">
                        {g.name}
                      </p>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        {g.blurb}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-display shrink-0 rounded-lg px-2 py-1 text-xs font-black",
                        equipped
                          ? "bg-calm text-calm-foreground"
                          : isNew
                            ? "animate-pulse bg-[image:var(--gradient-gold)] text-gold-foreground"
                            : locked && !owned
                              ? "store-stamp"
                              : "bg-primary text-primary-foreground",
                      )}
                    >
                      {equipped
                        ? "EQUIPPED"
                        : owned
                          ? "EQUIP"
                          : isNew
                            ? "✨ NEW"
                            : locked
                              ? `RESTRICTED · Lv${g.rank}`
                              : `⭐${g.cost}`}
                    </span>
                  </button>
                );
              })}
            </Section>
          );
        })}
      </>

      {/* ---------- bed upgrades ---------- */}
      <Section show={tab === "ward"} title="🛏️ Equipment Bay · Beds">
        {BED_UPGRADES.map((b) => {
          const owned = bedUpgrades.includes(b.key);
          const locked = rank.level < (b.rank ?? 1);
          const can = !owned && !locked && points >= b.cost;
          const isNew = !owned && freshUnlocks.includes(b.key);
          return (
            <button
              key={b.key}
              disabled={!can}
              data-sfx="equip"
              onClick={() => onBuyBedUpgrade(b.key, b.cost)}
              className={cn(
                "store-bin flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left",
                can ? "chunky chunky-press" : "opacity-60",
                isNew && "border-gold shadow-[0_0_10px_var(--gold)]",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                {b.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">{b.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{b.blurb}</p>
              </div>
              <span
                className={cn(
                  "font-display shrink-0 rounded-lg px-2 py-1 text-xs font-black",
                  isNew
                    ? "animate-pulse bg-[image:var(--gradient-gold)] text-gold-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {owned ? "FITTED" : isNew ? "✨ NEW" : locked ? `RESTRICTED · Lv${b.rank}` : `⭐${b.cost}`}
              </span>
            </button>
          );
        })}
      </Section>

      {/* ---------- staff ---------- */}
      <Section cork show={tab === "staff"} title={`📌 Staff Roster · ${staff.length}/${MAX_STAFF}`}>
        {STAFF.map((s) => {
          const hired = staff.includes(s.key);
          const need = s.rank ?? 2;
          const locked = rank.level < need;
          const full = seatsLeft <= 0;
          const can = !hired && !locked && !full && points >= s.cost;
          const isNew = !hired && freshUnlocks.includes(s.key);
          return (
            <button
              key={s.key}
              disabled={!can}
              data-sfx="equip"
              onClick={() => onHire(s.key, s.cost)}
              className={cn(
                "store-bin flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left",
                can ? "chunky chunky-press" : "opacity-60",
                isNew && "border-gold shadow-[0_0_10px_var(--gold)]",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-xl">
                <StaffPortrait staffKey={s.key} fallback={s.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">{s.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{s.bonus}</p>
              </div>
              <span
                className={cn(
                  "font-display shrink-0 rounded-lg px-2 py-1 text-xs font-black",
                  isNew
                    ? "animate-pulse bg-[image:var(--gradient-gold)] text-gold-foreground"
                    : locked && !hired
                      ? "store-stamp"
                      : "bg-primary text-primary-foreground",
                )}
              >
                {hired
                  ? "ON SHIFT"
                  : isNew
                    ? "✨ NEW"
                    : locked
                      ? `RESTRICTED · Lv${need}`
                      : full
                        ? "NO SEATS"
                        : `⭐${s.cost}`}
              </span>
            </button>
          );
        })}
      </Section>

      <div className="mt-auto space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onBack}
            className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
          >
            ← Back to Summary
          </button>
          <button
            onClick={onSave}
            className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
          >
            💾 Save progress
          </button>
        </div>
        {saveNote && (
          <p className="text-center font-display text-xs font-black uppercase text-calm-foreground">
            {saveNote}
          </p>
        )}
      </div>
    </div>
  );
}
