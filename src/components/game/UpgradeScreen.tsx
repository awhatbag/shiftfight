import { cn } from "@/lib/utils";
import {
  BED_UNLOCK_COST,
  STAFF,
  UPGRADE_INFO,
  type Upgrades,
} from "@/game/config";

export function UpgradeScreen({
  cash,
  upgrades,
  bedCount,
  staff,
  onBuy,
  onUnlockBeds,
  onHire,
  onPlay,
}: {
  cash: number;
  upgrades: Upgrades;
  bedCount: number;
  staff: string[];
  onBuy: (k: keyof Upgrades, cost: number) => void;
  onUnlockBeds: () => void;
  onHire: (k: string, cost: number) => void;
  onPlay: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="font-display truncate text-2xl font-black uppercase">Ward Shop</h2>
        <span className="font-display shrink-0 rounded-xl bg-[image:var(--gradient-gold)] px-3 py-1.5 text-base font-black text-gold-foreground">
          💷 {cash}
        </span>
      </div>

      <div className="space-y-2">
        {UPGRADE_INFO.map((u) => {
          const lvl = upgrades[u.key];
          const cost = u.cost(lvl);
          const max = lvl >= 4;
          const can = !max && cash >= cost;
          return (
            <button
              key={u.key}
              disabled={!can}
              onClick={() => onBuy(u.key, cost)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left transition-transform",
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
                  {Array.from({ length: 4 }).map((_, i) => (
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
                {max ? "MAX" : `💷${cost}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border bg-card/70 p-3">
        <p className="font-display text-xs font-black uppercase text-muted-foreground">
          Ward expansion
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
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
          {bedCount < 6 ? (
            <button
              disabled={cash < BED_UNLOCK_COST}
              onClick={onUnlockBeds}
              className={cn(
                "font-display shrink-0 rounded-xl bg-gold px-3 py-2 text-xs font-black text-gold-foreground",
                cash < BED_UNLOCK_COST ? "opacity-50" : "chunky chunky-press",
              )}
            >
              +2 BEDS 💷{BED_UNLOCK_COST}
            </button>
          ) : (
            <span className="font-display shrink-0 text-xs font-black text-calm-foreground">
              6-BED WARD!
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-display text-xs font-black uppercase text-muted-foreground">
          Hire the team
        </p>
        {STAFF.map((s) => {
          const hired = staff.includes(s.key);
          const can = !hired && cash >= s.cost;
          return (
            <button
              key={s.key}
              disabled={!can}
              onClick={() => onHire(s.key, s.cost)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left",
                can ? "chunky chunky-press" : "opacity-60",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-xl">
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-black uppercase">
                  {s.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{s.bonus}</p>
              </div>
              <span className="font-display shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-black text-primary-foreground">
                {hired ? "ON SHIFT" : `💷${s.cost}`}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onPlay}
        className="chunky chunky-press mt-auto w-full rounded-2xl bg-[image:var(--gradient-calm)] py-4 font-display text-lg font-black uppercase text-primary-foreground"
      >
        Start next shift ▶
      </button>
    </div>
  );
}
