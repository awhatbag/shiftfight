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
import { ShopIcon } from "./ShopIcon";
import { Nurse } from "./Nurse";
import type { PlayerCharacter } from "@/game/character";
import { useState, type ReactNode } from "react";
import lockerBg from "@/assets/locker-room-bg.jpg";

function Section({
  title,
  children,
  show,
  open = true,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  show: boolean;
  cork?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  if (!show) return null;
  return (
    <div className="locker-panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-display text-base font-black uppercase"
      >
        <span className="truncate">{title}</span>
        {onToggle && (
          <span className={cn("text-sm leading-none transition-transform duration-300", open && "rotate-180")}>▼</span>
        )}
      </button>
      <div className="ds-acc" data-open={open}>
        <div>
          <div className="space-y-2 px-2 pb-3">{children}</div>
        </div>
      </div>
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
  const [tab, setTab] = useState<string>("locker");
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
        "locker-tab chunky-press relative flex h-12 w-full items-center justify-center px-1 text-center font-display text-xs font-black uppercase leading-tight",
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

  const gearTabs = tabs.filter((t) => t.id !== "ward" && t.id !== "staff");
  const isGearTab = tab === "locker" || gearTabs.some((t) => t.id === tab);
  const mainTabs = [
    { id: "locker", icon: "scrubs_teal", label: "Your Locker", active: isGearTab, go: gearTabs[0]?.id ?? "ward", hasNew: gearTabs.some((t) => tabHasNew(t.id)) },
    { id: "ward", icon: "profiling", label: "Ward Supplies", active: tab === "ward", go: "ward", hasNew: tabHasNew("ward") },
    { id: "staff", icon: "star", label: "Staff Roster", active: tab === "staff", go: "staff", hasNew: tabHasNew("staff") },
  ];

  return (
    <div className="locker-page flex h-full flex-col overflow-y-auto">
      <div className="locker-stage shrink-0">
        <img
          src={lockerBg}
          alt=""
          width={1024}
          height={768}
          className="absolute inset-0 h-full w-full object-cover object-left"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="relative z-10 flex justify-center pt-2">
          <h2 className="locker-sign px-3 py-1 font-display text-base font-black uppercase leading-tight">
            <span className="text-destructive">✚</span> Staff Locker Room
          </h2>
        </div>
        <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_minmax(0,11rem)] items-end gap-1 px-2 pb-3">
          <button
            type="button"
            onClick={onCustomise}
            disabled={!onCustomise}
            aria-label="Customise nurse"
            className={cn("relative mx-auto h-[20rem] w-full max-w-56", onCustomise && "chunky-press cursor-pointer")}
          >
            <Nurse character={character} variant="preview" className="h-full" />
          </button>
          <div className="mb-1 flex flex-col items-stretch gap-2">
            <div className="locker-glass p-2.5">
              <p className="font-display text-base font-black uppercase leading-none">Your nurse</p>
              <p className="mt-1 text-[11px] leading-tight">{rank.title} · Level {rank.level}</p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--locker-navy)]">
                <div className="h-full bg-[var(--locker-yellow)]" style={{ width: `${rank.progress * 100}%` }} />
              </div>
              <p className="mt-1 text-[10px] leading-tight opacity-80">
                {rank.next ? `Next: ${rank.next.title}` : "Max rank"}
              </p>
              <p className="mt-2 font-display text-[11px] font-black uppercase">Equipped:</p>
              <p className="text-[10px] leading-tight">
                {equippedGear.length === 0
                  ? "Nothing yet"
                  : equippedGear
                      .map((k) => GEAR_ITEMS.find((x) => x.key === k)?.name)
                      .filter(Boolean)
                      .join(", ")}
              </p>
              {onCustomise && (
                <button
                  onClick={onCustomise}
                  className="locker-btn-yellow chunky-press mt-2 w-full py-1.5 font-display text-xs font-black uppercase"
                >
                  🎨 Customise
                </button>
              )}
            </div>
            <span className="locker-stars self-end px-3 py-1 font-display text-lg font-black">⭐ {points}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-3 gap-2">
        {mainTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.go)}
            className={cn(
              "locker-tab chunky-press relative flex h-[4.5rem] flex-col items-center justify-center gap-0.5 px-1 text-center font-display text-sm font-black uppercase leading-tight",
              t.active && "locker-tab-active",
            )}
          >
            <ShopIcon itemKey={t.icon} fallback="" className="h-8 w-8 bg-transparent shadow-none [&>img]:h-8 [&>img]:w-8" />
            {t.label}
            {t.hasNew && (
              <span className="absolute -right-1 -top-1 animate-pulse rounded-full bg-destructive px-1.5 py-0.5 font-display text-[9px] font-black text-destructive-foreground shadow">
                NEW
              </span>
            )}
          </button>
        ))}
      </div>

      <Section show={tab === "ward"} title="Ward Kit">
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
                "locker-row flex w-full items-center gap-3 p-2.5 text-left",
                can ? "chunky chunky-press" : "opacity-60",
              )}
            >
<ShopIcon itemKey={u.key} fallback={u.icon} />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">
                  {u.name}
                </p>
                <p className="truncate text-[11px] opacity-80">{u.blurb}</p>
                <div className="ds-pips mt-1">
                  {Array.from({ length: maxTier }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2 w-5 border border-[var(--locker-navy)]",
                        i < lvl ? "bg-[var(--ds-blue)]" : "bg-[var(--locker-cream)]",
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="locker-price font-display shrink-0 px-2.5 py-1 text-sm font-black">
                {max ? "MAX" : `⭐${cost}`}
              </span>
            </button>
          );
        })}
      <div className="locker-row border-dashed p-3">
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
            <Section key={cat.key} show={isGearTab} title={cat.name} open={tab === cat.key} onToggle={() => setTab(tab === cat.key ? "locker" : cat.key)}>
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
                      "locker-row flex w-full items-center gap-3 p-2.5 text-left",
                      owned || can ? "chunky chunky-press" : "opacity-60",
                      equipped && "locker-row-equipped",
                      isNew && "border-gold shadow-[0_0_10px_var(--gold)]",
                    )}
                  >
<ShopIcon itemKey={g.key} fallback={g.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate text-sm font-black uppercase">
                        {g.name}
                      </p>
                      <p className="text-[11px] leading-tight opacity-80">
                        {g.blurb}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-display shrink-0 px-2.5 py-1 text-sm font-black rounded-[3px]",
                        equipped
                          ? "locker-equipped-pill"
                          : isNew
                            ? "animate-pulse bg-[image:var(--gradient-gold)] text-gold-foreground"
                            : locked && !owned
                              ? "store-stamp"
                              : "locker-price",
                      )}
                    >
                      {equipped
                        ? "✔ EQUIPPED"
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
      <Section show={tab === "ward"} title="Beds">
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
                "locker-row flex w-full items-center gap-3 p-2.5 text-left",
                can ? "chunky chunky-press" : "opacity-60",
                isNew && "border-gold shadow-[0_0_10px_var(--gold)]",
              )}
            >
<ShopIcon itemKey={b.key} fallback={b.icon} />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">{b.name}</p>
                <p className="text-[11px] leading-tight opacity-80">{b.blurb}</p>
              </div>
              <span
                className={cn(
                  "font-display shrink-0 px-2.5 py-1 text-sm font-black rounded-[3px]",
                  isNew
                    ? "animate-pulse bg-[image:var(--gradient-gold)] text-gold-foreground"
                    : "locker-price",
                )}
              >
                {owned ? "FITTED" : isNew ? "✨ NEW" : locked ? `RESTRICTED · Lv${b.rank}` : `⭐${b.cost}`}
              </span>
            </button>
          );
        })}
      </Section>

      {/* ---------- staff ---------- */}
      <Section cork show={tab === "staff"} title={`Duty Roster · ${staff.length}/${MAX_STAFF} seats filled`}>
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
                "locker-row flex w-full items-center gap-3 p-2.5 text-left",
                can ? "chunky chunky-press" : "opacity-60",
                isNew && "border-gold shadow-[0_0_10px_var(--gold)]",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden ds-icon text-xl">
                <StaffPortrait staffKey={s.key} fallback={s.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">{s.name}</p>
                <p className="text-[11px] leading-tight opacity-80">{s.bonus}</p>
              </div>
              <span
                className={cn(
                  "font-display shrink-0 px-2.5 py-1 text-sm font-black rounded-[3px]",
                  isNew
                    ? "animate-pulse bg-[image:var(--gradient-gold)] text-gold-foreground"
                    : locked && !hired
                      ? "store-stamp"
                      : "locker-price",
                )}
              >
                {hired
                  ? "ON DUTY"
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

      <div className="mt-auto space-y-2 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onBack}
            className="chunky chunky-press locker-tab py-3 font-display text-sm font-black uppercase"
          >
            ← Back to Summary
          </button>
          <button
            onClick={onSave}
            className="chunky chunky-press locker-tab py-3 font-display text-sm font-black uppercase"
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
    </div>
  );
}
