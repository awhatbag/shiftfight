import { RATINGS } from "@/game/config";
import { DON_MOOD_META, type ShiftReview } from "@/game/don";
import { JobSecurityBar } from "./JobSecurityBar";
import type { ShiftStats } from "./WardScreen";

export function SummaryScreen({
  stats,
  totalPoints,
  totalXp,
  review,
  onNext,
}: {
  stats: ShiftStats;
  totalPoints: number;
  totalXp: number;
  review?: ShiftReview | null;
  onNext: () => void;
}) {
  const rating = RATINGS.find((r) => stats.points >= r.min) ?? RATINGS[RATINGS.length - 1];
  if (!rating) return null;
  const rows = [
    { label: "Patients helped", value: stats.helped, icon: "🧑‍🦽" },
    { label: "Events handled", value: stats.handled, icon: "⚡" },
    { label: "Patients left waiting", value: stats.overdue, icon: "⌛" },
    { label: "Mistakes", value: stats.mistakes, icon: "🙈" },
    { label: "Call bells answered", value: stats.callBells, icon: "🛎️" },
    { label: "Best combo", value: `x${stats.maxCombo}`, icon: "🔥" },
    { label: "Mini-games done", value: stats.miniGames - stats.miniFailed, icon: "🎯" },
    { label: "Mini-games failed", value: stats.miniFailed, icon: "💥" },
  ];

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="animate-pop rounded-3xl bg-[image:var(--gradient-gold)] p-4 text-center text-gold-foreground shadow-[var(--shadow-card)]">
        <p className="font-display text-xs font-bold uppercase tracking-widest">
          {stats.collapsed ? "Ward went sideways" : "Shift complete"}
        </p>
        <h2 className="font-display text-3xl font-black leading-tight">{rating.title}</h2>
        <p className="text-xs font-semibold">{rating.line}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { k: "⭐", v: stats.points, l: "Points (shop)" },
          { k: "✨", v: stats.xp, l: "XP (nurse)" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border-2 border-border bg-card p-2 text-center"
          >
            <p className="text-lg">{s.k}</p>
            <p className="font-display text-lg font-black leading-none">{s.v}</p>
            <p className="text-[10px] uppercase text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { k: "⭐", v: totalPoints, l: "Total points" },
          { k: "✨", v: totalXp, l: "Total XP" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border-2 border-border bg-card p-2 text-center">
            <p className="text-lg">{s.k}</p>
            <p className="font-display text-lg font-black leading-none">{s.v}</p>
            <p className="text-[10px] uppercase text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {review && (
        <div className="space-y-2 rounded-2xl border-2 border-border bg-card p-3">
          <p className="font-display text-xs font-black uppercase text-muted-foreground">
            The DON's assessment
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{DON_MOOD_META[review.mood].face}</span>
            <div className="min-w-0">
              <p className="font-display text-lg font-black leading-none">
                {"⭐".repeat(review.stars)}
                {"☆".repeat(5 - review.stars)}
              </p>
              <p className="font-display text-[11px] font-black uppercase text-muted-foreground">
                {review.rating}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold leading-snug">“{review.quote}”</p>
          {review.notes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.notes.map((n) => (
                <span
                  key={n.label}
                  className={
                    n.pts >= 0
                      ? "rounded-full bg-calm px-2 py-0.5 text-[10px] font-bold text-calm-foreground"
                      : "rounded-full bg-alarm px-2 py-0.5 text-[10px] font-bold text-alarm-foreground"
                  }
                >
                  {n.label}
                </span>
              ))}
            </div>
          )}
          <JobSecurityBar value={review.after} delta={review.delta} />
        </div>
      )}


      <div className="space-y-1.5 rounded-2xl border-2 border-border bg-card p-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <span>{r.icon}</span>
              <span className="truncate text-muted-foreground">{r.label}</span>
            </span>
            <span className="font-display shrink-0 text-base font-black">{r.value}</span>
          </div>
        ))}
      </div>

      {stats.objectives?.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border-2 border-border bg-card p-3">
          <p className="font-display text-xs font-black uppercase text-muted-foreground">
            This shift's challenges
          </p>
          {stats.objectives.map((o) => (
            <div key={o.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span>{o.done ? "✅" : "⬜"}</span>
                <span className={o.done ? "min-w-0 truncate" : "min-w-0 truncate text-muted-foreground"}>
                  {o.label}
                </span>
              </span>
              <span
                className={
                  o.done
                    ? "font-display shrink-0 font-black text-calm-foreground"
                    : "font-display shrink-0 font-black text-muted-foreground"
                }
              >
                {o.done ? "+" : ""}
                {o.reward.amount} {o.reward.type === "points" ? "⭐" : "✨"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5 rounded-2xl border-2 border-border bg-card p-3">
        <p className="font-display text-xs font-black uppercase text-muted-foreground">
          Shift modifiers
        </p>
        {stats.quirks.map((quirk) => (
          <div key={quirk.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{quirk.label}</span>
            <span
              className={quirk.pts >= 0 ? "font-display font-black text-calm-foreground" : "font-display font-black text-alarm"}
            >
              {quirk.pts >= 0 ? "+" : ""}{quirk.pts}
            </span>
          </div>
        ))}
      </div>


      <button
        onClick={onNext}
        className="chunky chunky-press mt-auto w-full rounded-2xl bg-primary py-4 font-display text-lg font-black uppercase text-primary-foreground"
      >
        Go to the shop →
      </button>
    </div>
  );
}
