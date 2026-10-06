import { cn } from "@/lib/utils";

export function NurseLevelTab({ level, progress, compact = false }: { level: number; progress: number; compact?: boolean }) {
  return (
    <div data-level-target className={cn("shrink-0 border-2 border-border bg-card", compact ? "w-[74px] rounded-xl px-2 py-1" : "w-24 rounded-2xl p-2")}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-base leading-none">✨</span>
        <span className="font-display text-[11px] font-black uppercase">Nurse Lv {level}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-calm transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
      </div>
    </div>
  );
}