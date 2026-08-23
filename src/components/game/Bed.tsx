import { cn } from "@/lib/utils";
import type { EventDef } from "@/game/config";

export type BedState = {
  id: number;
  name: string;
  locked: boolean;
};

function BedSprite({ mood }: { mood: "calm" | "worried" | "urgent" }) {
  const face =
    mood === "urgent" ? "😫" : mood === "worried" ? "😕" : "😌";
  return (
    <svg viewBox="0 0 120 64" className="h-full w-full">
      {/* head board */}
      <rect x="4" y="10" width="8" height="38" rx="3" fill="oklch(0.72 0.03 235)" />
      <rect x="6" y="12" width="4" height="20" rx="2" fill="oklch(0.86 0.02 235)" />
      {/* foot board */}
      <rect x="108" y="20" width="8" height="28" rx="3" fill="oklch(0.72 0.03 235)" />
      {/* mattress */}
      <rect x="10" y="30" width="100" height="14" rx="6" fill="var(--color-linen)" stroke="oklch(0.7 0.03 235)" strokeWidth="1.5" />
      {/* blanket */}
      <path d="M52 30h56a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H52z" fill="var(--color-sheet)" />
      <path d="M52 33h60" stroke="oklch(0.72 0.05 230)" strokeWidth="2" />
      {/* pillow */}
      <rect x="14" y="22" width="24" height="11" rx="5" fill="oklch(0.99 0.005 240)" stroke="oklch(0.8 0.02 235)" strokeWidth="1.5" />
      {/* patient head */}
      <circle cx="40" cy="24" r="9" fill="oklch(0.87 0.06 60)" stroke="oklch(0.66 0.07 55)" strokeWidth="1.2" />
      <text x="40" y="28" textAnchor="middle" fontSize="11">
        {face}
      </text>
      {/* body lump under blanket */}
      <path d="M50 32q14-8 26 0" stroke="oklch(0.72 0.05 230)" strokeWidth="2" fill="none" />
      {/* frame + legs */}
      <rect x="10" y="44" width="100" height="4" rx="2" fill="oklch(0.65 0.03 235)" />
      <rect x="20" y="48" width="4" height="9" fill="oklch(0.6 0.02 235)" />
      <rect x="96" y="48" width="4" height="9" fill="oklch(0.6 0.02 235)" />
      <circle cx="22" cy="59" r="4" fill="oklch(0.38 0.02 250)" />
      <circle cx="98" cy="59" r="4" fill="oklch(0.38 0.02 250)" />
      {/* drip stand */}
      <rect x="100" y="2" width="2.5" height="30" fill="oklch(0.7 0.02 240)" />
      <rect x="96" y="4" width="11" height="14" rx="3" fill="oklch(0.85 0.1 155 / 0.8)" stroke="oklch(0.6 0.1 160)" strokeWidth="1.2" />
    </svg>
  );
}

export function Bed({
  bed,
  event,
  progress,
  flash,
  onTap,
  active,
  nurseHere,
}: {
  bed: BedState;
  event?: EventDef | undefined;
  progress: number; // 0..1 remaining
  flash?: "good" | "bad" | null;
  onTap: () => void;
  active: boolean;
  nurseHere?: boolean;
}) {
  const urgent = !!event && progress < 0.35;
  return (
    <button
      onClick={onTap}
      disabled={bed.locked}
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border-2 p-1.5 text-left transition-transform",
        bed.locked
          ? "border-dashed border-border bg-muted/40"
          : "border-border bg-linen shadow-[var(--shadow-card)]",
        (active || nurseHere) && "scale-[1.02] border-gold ring-2 ring-gold",
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

          <div className="relative mx-auto h-11 w-full">
            <BedSprite mood={urgent ? "urgent" : event ? "worried" : "calm"} />
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
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
            <div className="rounded-lg bg-muted/70 px-1.5 py-0.5 text-center font-display text-[10px] font-bold uppercase text-muted-foreground">
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
