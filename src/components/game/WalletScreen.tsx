export function WalletScreen({
  points,
  xp,
  level,
  rank,
  lastPoints,
  lastXp,
  onShop,
  onPlay,
}: {
  points: number;
  xp: number;
  level: number;
  rank: {
    level: number;
    title: string;
    perk: string;
    next: { xp: number; title: string } | null;
    progress: number;
  };
  lastPoints: number;
  lastXp: number;
  onShop: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="animate-pop rounded-3xl bg-[image:var(--gradient-calm)] p-4 text-center text-primary-foreground shadow-[var(--shadow-card)]">
        <p className="font-display text-xs font-bold uppercase tracking-widest">Your wallet</p>
        <h2 className="font-display text-3xl font-black leading-tight">Points &amp; XP</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border-2 border-border bg-card p-3 text-center">
          <p className="text-lg">⭐</p>
          <p className="font-display text-2xl font-black leading-none">{points}</p>
          <p className="text-[10px] uppercase text-muted-foreground">Points · shop money</p>
          <p className="font-display mt-1 text-[11px] font-black text-calm-foreground">
            +{lastPoints} this shift
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-3 text-center">
          <p className="text-lg">✨</p>
          <p className="font-display text-2xl font-black leading-none">{xp}</p>
          <p className="text-[10px] uppercase text-muted-foreground">XP · nurse rank</p>
          <p className="font-display mt-1 text-[11px] font-black text-calm-foreground">
            +{lastXp} this shift
          </p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-black uppercase">
            Nurse Lv {rank.level} · {rank.title}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {rank.next ? `Next: ${rank.next.title}` : "Max rank"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-calm)]"
            style={{ width: `${rank.progress * 100}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{rank.perk}</p>
      </div>

      <div className="mt-auto space-y-2">
        <button
          onClick={onShop}
          className="chunky chunky-press w-full rounded-2xl bg-primary py-4 font-display text-lg font-black uppercase text-primary-foreground"
        >
          🛒 Go to shop
        </button>
        <button
          onClick={onPlay}
          className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          Skip shop · Start Shift (Level {level}) ▶
        </button>
      </div>
    </div>
  );
}
