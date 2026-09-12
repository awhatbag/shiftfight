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
    <svg viewBox="0 0 72 104" className="h-full w-full ward-pixel-image">
      {/* curtain rail and stepped blue curtain */}
      <path d="M7 11V3H65V11M10 3h52" fill="none" stroke="var(--ward-frame)" strokeWidth="3" />
      <rect x="4" y="9" width="8" height="61" fill="var(--ward-bed)" />
      <rect x="7" y="12" width="3" height="55" fill="var(--ward-bed-light)" />
      <rect x="60" y="9" width="8" height="61" fill="var(--ward-bed)" />
      <rect x="62" y="12" width="3" height="55" fill="var(--ward-bed-light)" />
      {/* top-down bed frame */}
      <rect x="15" y="13" width="42" height="82" fill="var(--ward-frame)" />
      <rect x="18" y="16" width="36" height="72" fill="var(--color-linen)" />
      <rect x="20" y="20" width="32" height="17" fill="var(--ward-wall-light)" />
      <rect x="19" y="49" width="34" height="37" fill="var(--ward-bed)" />
      <rect x="22" y="52" width="28" height="5" fill="var(--ward-bed-light)" />
      {/* patient, retained as the existing simple character marker */}
      <circle cx="36" cy="40" r="9" fill="oklch(0.87 0.06 60)" stroke="var(--ward-frame)" strokeWidth="2" />
      <text x="36" y="44" textAnchor="middle" fontSize="10">
        {face}
      </text>
      <rect x="17" y="88" width="38" height="8" fill="var(--ward-frame-hi)" />
      <rect x="25" y="90" width="22" height="3" fill="var(--ward-window-dark)" />
      <rect x="18" y="96" width="5" height="5" fill="var(--ward-frame)" />
      <rect x="49" y="96" width="5" height="5" fill="var(--ward-frame)" />
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
  revealed = true,
}: {
  bed: BedState;
  event?: EventDef | undefined;
  progress: number; // 0..1 remaining
  flash?: "good" | "bad" | null;
  onTap: () => void;
  active: boolean;
  nurseHere?: boolean;
  /** only show what the patient actually wants once the nurse is there */
  revealed?: boolean;
}) {
  const urgent = !!event && progress < 0.35;
  return (
    <button
      onClick={onTap}
      disabled={bed.locked}
      className={cn(
        "pixel-panel relative flex h-full w-full flex-col justify-between overflow-hidden border-2 p-1 text-left transition-transform",
        bed.locked
          ? "border-dashed border-border bg-muted/40"
          : "border-pixel-ink bg-linen",
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

          <div className="relative mx-auto min-h-0 flex-1 w-full">
            <BedSprite mood={urgent ? "urgent" : event ? "worried" : "calm"} />
          </div>

          {event ? (
            <div className="animate-pop space-y-1">
              <div
                className={cn(
                "flex items-center gap-1 rounded-sm px-1 py-0.5",
                  urgent ? "bg-alarm text-alarm-foreground" : "bg-gold text-gold-foreground",
                )}
              >
                <span className="text-sm leading-none">{revealed ? event.icon : "🛎️"}</span>
                <span className="font-display truncate text-[10px] font-extrabold uppercase">
                  {revealed ? event.label : "Needs you"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden border border-pixel-ink bg-muted">
                <div
                  className={cn(
                    "h-full transition-[width] duration-100 ease-linear",
                    urgent ? "bg-alarm" : "bg-calm",
                  )}
                  style={{ width: `${Math.max(0, progress) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-muted/70 px-1 py-0.5 text-center font-display text-[9px] font-bold uppercase text-muted-foreground">
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
