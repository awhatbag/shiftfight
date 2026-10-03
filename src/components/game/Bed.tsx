import { cn } from "@/lib/utils";
import type { EventDef } from "@/game/config";
import { PATIENT_BED_SPRITES } from "@/game/patientBeds";
import leftSideBedAsset from "@/assets/left-side-bed.png.asset.json";
import rightSideBedAsset from "@/assets/right-side-bed.png.asset.json";

export type BedState = {
  id: number;
  name: string;
  locked: boolean;
  /** id from PATIENT_BED_SPRITES; undefined = empty bed artwork */
  patientSprite?: string | undefined;
};

function BedSprite({ side, patientSprite }: { side: "left" | "right"; patientSprite?: string | undefined }) {
  const entry = patientSprite
    ? PATIENT_BED_SPRITES.find((s) => s.id === patientSprite)
    : undefined;
  const sprite = entry?.asset;
  return (
    <img
      src={sprite ? sprite.url : side === "left" ? leftSideBedAsset.url : rightSideBedAsset.url}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn(
        "pointer-events-none w-full object-contain",
        // taller canvases keep the same width and wheel baseline, extending upward only
        entry?.tall ? "absolute bottom-0 left-0 h-[129.717%] object-bottom" : "h-full",
        sprite && side === "right" && "scale-x-[-1]",
      )}
    />
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
        "relative flex h-full w-full flex-col justify-between overflow-visible rounded-2xl border-2 border-transparent bg-transparent p-1.5 text-left transition-transform",
        bed.locked
          ? "border-dashed border-border"
          : "hover:border-border/60",
        (active || nurseHere) && "scale-[1.02] border-gold ring-2 ring-gold",
        event && !urgent && "border-gold",
        urgent && "animate-shake border-alarm",
        flash === "good" && "border-calm",
        flash === "bad" && "border-alarm",
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <BedSprite side={bed.id % 2 === 0 ? "left" : "right"} patientSprite={!bed.locked ? bed.patientSprite : undefined} />
      </div>

      {bed.locked ? (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-border bg-card/90 text-xl shadow-md">🔒</span>
          <span className="rounded-md bg-card/90 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase shadow-sm">Empty bay</span>
        </div>
      ) : (
        <>
          <div className="h-11" aria-hidden="true" />

          {event ? (
            <div className="relative z-10 animate-pop space-y-1">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg px-1.5 py-1",
                  urgent ? "bg-alarm text-alarm-foreground" : "bg-gold text-gold-foreground",
                )}
              >
                <span className="text-sm leading-none">{revealed ? event.icon : "🛎️"}</span>
                <span className="font-display truncate text-[10px] font-extrabold uppercase">
                  {revealed ? event.label : "Needs you"}
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
            <div className="relative z-10 rounded-lg bg-muted/70 px-1.5 py-0.5 text-center font-display text-[10px] font-bold uppercase text-muted-foreground">
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
