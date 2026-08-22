import { cn } from "@/lib/utils";
import type { EventDef } from "@/game/config";

export type BedState = {
  id: number;
  name: string;
  locked: boolean;
};

export function Bed({
  bed,
  event,
  progress,
  flash,
  onTap,
  active,
}: {
  bed: BedState;
  event?: EventDef | undefined;
  progress: number; // 0..1 remaining
  flash?: "good" | "bad" | null;
  onTap: () => void;
  active: boolean;
}) {
  const urgent = event && progress < 0.35;
  return (
    <button
      onClick={onTap}
      disabled={bed.locked}
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border-2 p-2 text-left transition-transform",
        bed.locked
          ? "border-dashed border-border bg-muted/40"
          : "border-border bg-linen",
        active && "scale-[1.03] border-gold ring-2 ring-gold",
        event && !urgent && "border-gold",
        urgent && "animate-shake border-alarm",
        flash === "good" && "border-calm",
        flash === "bad" && "border-alarm",
      )}
    >
      {bed.locked ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <span className="text-2xl">🔒</span>
          <span className="font-display text-[10px] font-bold uppercase">Empty bay</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1">
            <span className="font-display truncate text-[11px] font-extrabold uppercase tracking-wide">
              {bed.name}
            </span>
            <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 font-display text-[9px] font-bold">
              B{bed.id + 1}
            </span>
          </div>

          {/* cartoon bed */}
          <div className="relative mx-auto my-1 h-12 w-full">
            <div className="absolute bottom-0 left-0 right-0 h-7 rounded-lg bg-sheet" />
            <div className="absolute bottom-0 left-0 h-7 w-1/3 rounded-lg bg-ward-deep/60" />
            <div className="absolute bottom-6 left-1.5 h-4 w-6 rounded-full bg-card" />
            <div className="absolute bottom-[26px] left-4 text-lg leading-none">
              {event ? (urgent ? "😫" : "😕") : "😌"}
            </div>
            <div className="absolute -bottom-1 left-1 h-2 w-2 rounded-full bg-foreground/30" />
            <div className="absolute -bottom-1 right-1 h-2 w-2 rounded-full bg-foreground/30" />
          </div>

          {event ? (
            <div className="animate-pop space-y-1">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg px-1.5 py-1",
                  urgent ? "bg-alarm text-alarm-foreground" : "bg-gold text-gold-foreground",
                )}
              >
                <span className="text-sm leading-none">{event.icon}</span>
                <span className="font-display truncate text-[10px] font-extrabold uppercase">
                  {event.label}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-100 ease-linear",
                    urgent ? "bg-alarm" : "bg-calm",
                  )}
                  style={{ width: `${Math.max(0, progress) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/70 px-1.5 py-1 text-center font-display text-[10px] font-bold uppercase text-muted-foreground">
              stable
            </div>
          )}
        </>
      )}
      {flash && (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 animate-pop rounded-2xl",
            flash === "good" ? "bg-calm/35" : "bg-alarm/35",
          )}
        />
      )}
    </button>
  );
}
