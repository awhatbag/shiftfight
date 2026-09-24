import { cn } from "@/lib/utils";
import { objectiveProgress, type ShiftCounters, type ShiftObjective } from "@/game/objectives";
import { FINAL_WARNING_AT } from "@/game/don";

export function WardHud({
  secondsLeft, shiftLeft, stability, points, combo, objectives, counters,
  jobSecurity, paused, onTogglePause, onOpenSettings,
}: {
  secondsLeft: number; shiftLeft: number; stability: number; points: number; combo: number;
  objectives: ShiftObjective[]; counters: ShiftCounters; jobSecurity: number; paused: boolean;
  onTogglePause: () => void; onOpenSettings: () => void;
}) {
  const lowTime = secondsLeft <= 15;
  return (
    <div className="z-10 space-y-2 px-3 pt-2">
      <div className="flex items-stretch gap-2">
        <div className={cn("flex flex-1 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-1.5", lowTime && "animate-throb border-alarm")}>
          <span className="text-2xl leading-none">⏱️</span>
          <div className="min-w-0 flex-1">
            <p className={cn("font-display text-3xl font-black leading-none tabular-nums", lowTime && "text-alarm")}>
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-[width] duration-100 ease-linear", lowTime ? "bg-alarm" : "bg-primary")} style={{ width: `${shiftLeft * 100}%` }} />
            </div>
          </div>
        </div>
        <button onClick={onTogglePause} aria-label={paused ? "Resume shift" : "Pause shift"} className="chunky chunky-press grid w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl text-secondary-foreground">
          {paused ? "▶️" : "⏸️"}
        </button>
        <button onClick={onOpenSettings} aria-label="Settings" className="chunky chunky-press grid w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl text-secondary-foreground">⚙️</button>
      </div>
      <div className="flex items-stretch gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-border bg-card px-2.5 py-1.5">
          <span className="text-xl leading-none">❤️</span>
          <div className="min-w-0 flex-1"><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-all duration-200", stability > 55 ? "bg-calm" : stability > 25 ? "bg-gold" : "bg-alarm")} style={{ width: `${stability}%` }} /></div></div>
        </div>
        <span className="font-display grid place-items-center rounded-2xl border-2 border-border bg-card px-2 text-sm font-black">⭐{points}</span>
        <span className={cn("font-display grid place-items-center rounded-2xl border-2 border-border px-2 text-sm font-black", combo > 2 ? "animate-throb bg-gold text-gold-foreground" : "bg-card")}>🔥x{combo}</span>
      </div>
      <div className="flex items-stretch gap-1.5 overflow-hidden">
        {objectives.map((objective) => {
          const progress = Math.min(objective.target, objectiveProgress(objective.key, { ...counters, points }));
          return <span key={objective.key} title={objective.label} className={cn("flex min-w-0 flex-1 items-center gap-1 rounded-xl border-2 border-border px-1.5 py-0.5 text-[10px] font-bold leading-tight", objective.done ? "bg-calm text-calm-foreground" : "bg-card")}>
            <span className="text-sm leading-none">{objective.done ? "✅" : objective.icon}</span><span className={cn("truncate", objective.done && "line-through")}>{objective.label}</span><span className="font-display ml-auto shrink-0">{progress}/{objective.target}</span>
          </span>;
        })}
      </div>
      {jobSecurity > 0 && jobSecurity < FINAL_WARNING_AT && <p className="font-display animate-throb rounded-xl bg-alarm px-2 py-1 text-center text-[11px] font-black uppercase tracking-wider text-alarm-foreground">⚠️ Final warning · job security {jobSecurity}%</p>}
    </div>
  );
}
