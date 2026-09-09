import { JOB_SECURITY_REHIRE } from "@/game/don";

export function FiredScreen({
  reason,
  onContinue,
}: {
  reason: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[image:var(--gradient-sky)] p-5 text-center">
      <div className="animate-pop w-full rounded-3xl border-4 border-alarm bg-alarm p-4 text-alarm-foreground shadow-2xl">
        <p className="font-display text-xs font-black uppercase tracking-widest">
          🚨 Human resources
        </p>
        <h2 className="font-display text-4xl font-black uppercase leading-none">
          You're fired!
        </h2>
      </div>

      <div className="w-full space-y-2 rounded-3xl border-2 border-border bg-card p-4 text-left">
        <p className="text-sm font-bold">
          Unfortunately, your employment has been terminated.
        </p>
        <p className="font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Reason
        </p>
        <p className="text-base font-bold leading-snug">{reason}</p>
        <p className="text-[11px] text-muted-foreground">HR has been notified.</p>
      </div>

      <p className="text-base font-black">
        Luckily, another hospital is hiring. 🏥
      </p>
      <p className="text-xs text-muted-foreground">
        You keep your points, XP, upgrades and team. Fresh badge, fresh start at{" "}
        {JOB_SECURITY_REHIRE}% job security.
      </p>

      <button
        onClick={onContinue}
        className="chunky chunky-press w-full rounded-2xl bg-primary py-4 font-display text-lg font-black uppercase text-primary-foreground"
      >
        Sign the new contract ▶
      </button>
    </div>
  );
}
