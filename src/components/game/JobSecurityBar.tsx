import { cn } from "@/lib/utils";
import { DON_MOOD_META, moodFor, securityBand } from "@/game/don";

/** ten chunky blocks + a percentage, in the usual Shift Fight! style */
export function JobSecurityBar({
  value,
  delta,
  compact = false,
}: {
  value: number;
  delta?: number;
  compact?: boolean;
}) {
  const band = securityBand(value);
  const mood = moodFor(value);
  const filled = Math.round(value / 10);
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-border bg-card p-2",
        value > 0 && value < 20 && "animate-throb border-alarm",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Job security
        </p>
        <span className="font-display text-base font-black tabular-nums">
          {value}%
          {typeof delta === "number" && delta !== 0 && (
            <span className={delta > 0 ? "text-calm-foreground" : "text-alarm"}>
              {" "}
              {delta > 0 ? "⬆️ +" : "⬇️ "}
              {delta}%
            </span>
          )}
        </span>
      </div>
      <div className="mt-1 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 flex-1 rounded-sm",
              i < filled ? band.tone : "bg-muted",
            )}
          />
        ))}
      </div>
      {!compact && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold">
          <span>{DON_MOOD_META[mood].dot}</span>
          <span className="uppercase">{band.label}</span>
          <span className="min-w-0 truncate text-muted-foreground">
            · “{DON_MOOD_META[mood].line}”
          </span>
        </p>
      )}
    </div>
  );
}
