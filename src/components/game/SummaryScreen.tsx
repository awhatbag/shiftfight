import { RATINGS } from "@/game/config";
import { useEffect, useMemo, useState } from "react";
import { DON_MOOD_META, type ShiftReview } from "@/game/don";
import { JobSecurityBar } from "./JobSecurityBar";
import { NurseLevelTab } from "./NurseLevelTab";
import { notableAchievement, type RewardPresentation } from "@/game/progressionRewards";
import { buzz, playLevelComplete } from "@/lib/sfx";
import type { ShiftStats } from "./WardScreen";

export function SummaryScreen({
  stats,
  totalPoints,
  totalXp,
  review,
  reward,
  onNext,
}: {
  stats: ShiftStats;
  totalPoints: number;
  totalXp: number;
  review?: ShiftReview | null;
  reward: RewardPresentation;
  onNext: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [shownXp, setShownXp] = useState(reward.beforeXp);
  const levelledUp = reward.afterRank.level > reward.beforeRank.level;
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 380),
      window.setTimeout(() => setStage(2), 900),
      window.setTimeout(() => setStage(3), 1450),
      window.setTimeout(() => setStage(4), 2050),
      window.setTimeout(() => setShownXp(reward.afterXp), 2250),
      window.setTimeout(() => {
        if (levelledUp) {
          setStage(5);
          playLevelComplete();
          buzz(45);
        } else setStage(7);
      }, 3150),
      window.setTimeout(() => setStage(levelledUp && reward.unlocks.length ? 6 : 7), 5150),
      window.setTimeout(() => setStage(7), 6900),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [levelledUp, reward.afterXp, reward.unlocks.length]);
  const shownRank = useMemo(() => stage >= 5 ? reward.afterRank : reward.beforeRank, [reward.afterRank, reward.beforeRank, stage]);
  const achievement = notableAchievement(stats);
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
    <div className="relative flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
      <div className="animate-pop rounded-2xl bg-[image:var(--gradient-gold)] p-4 text-center text-gold-foreground shadow-[var(--shadow-card)]">
        <p className="font-display text-xs font-bold uppercase tracking-widest">
          {stats.collapsed ? "Ward went sideways" : "Shift complete"}
        </p>
        <h2 className="font-display text-3xl font-black leading-tight">{rating.title}</h2>
        <p className="text-xs font-semibold">{rating.line}</p>
      </div>
      <NurseLevelTab level={shownRank.level} progress={shownRank.progress} />
      </div>

      <div className="reward-summary-band border-y-2 border-border py-3 text-center">
        <p className="pixel-count text-4xl">Shift complete!</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={stage >= 1 ? "reward-reveal" : "opacity-0"}><p className="font-display text-2xl font-black">+{stats.points} ⭐</p><p className="text-[10px] uppercase text-muted-foreground">Points earned</p></div>
          <div className={stage >= 2 ? "reward-reveal" : "opacity-0"}><p className="font-display text-2xl font-black">+{reward.xpEarned} ✨</p><p className="text-[10px] uppercase text-muted-foreground">XP earned</p></div>
          <div className={stage >= 3 ? "reward-reveal" : "opacity-0"}><p className="font-display text-2xl font-black">x{stats.maxCombo} 🔥</p><p className="text-[10px] uppercase text-muted-foreground">Best combo</p></div>
          <div className={stage >= 4 ? "reward-reveal" : "opacity-0"}><p className="font-display text-2xl font-black">{stats.objectives.filter((o) => o.done).length}/{stats.objectives.length} ✅</p><p className="text-[10px] uppercase text-muted-foreground">Challenges</p></div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" aria-label={`${shownXp} total XP`}><div className="h-full rounded-full bg-calm transition-[width] duration-1000 ease-out" style={{ width: `${shownRank.progress * 100}%` }} /></div>
        <p className="mt-1 font-display text-[11px] font-black uppercase">{shownXp} XP · {shownRank.title}</p>
        {achievement && stage >= 4 && <p className="reward-reveal mt-2 text-xs font-bold text-calm-foreground">{achievement}</p>}
      </div>

      {stage === 5 && <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-live="assertive"><div className="level-up-flight"><div className="reward-flare" /><p className="pixel-count text-center text-6xl">Level up!</p><p className="pixel-count mt-2 text-center text-3xl">Nurse Lv {reward.afterRank.level}</p><p className="mt-2 text-center font-display text-sm font-black uppercase text-primary-foreground">{reward.afterRank.title}</p></div></div>}
      {stage === 6 && reward.unlocks.length > 0 && <div className="pointer-events-auto fixed inset-0 z-[90] grid place-items-center bg-background/85 p-5 backdrop-blur-sm"><div className="reward-unlock w-full max-w-sm border-y-4 border-gold bg-card py-5 text-center shadow-2xl"><p className="pixel-count text-5xl">New unlock!</p><div className="mt-4 space-y-1 px-4">{reward.unlocks.map((unlock) => <p key={unlock} className="font-display text-base font-black uppercase">{unlock}</p>)}</div><button onClick={() => setStage(7)} className="chunky chunky-press mt-4 rounded-2xl bg-primary px-6 py-3 font-display text-base font-black uppercase text-primary-foreground">Nice! ▶</button></div></div>}

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
        disabled={stage < 7}
        className="chunky chunky-press mt-auto w-full rounded-2xl bg-primary py-4 font-display text-lg font-black uppercase text-primary-foreground disabled:opacity-40"
      >
        Go to the shop →
      </button>
    </div>
  );
}
