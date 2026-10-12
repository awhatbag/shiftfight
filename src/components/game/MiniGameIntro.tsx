import type { MiniGameDef } from "@/game/minigames";
import { cn } from "@/lib/utils";

/**
 * Single "How to Play" card shown every time a mini-game opens.
 * When `reward` + `onSkip` are given it doubles as the ward's bonus-round offer.
 */
export function MiniGameIntro({
  game,
  onStart,
  reward,
  onSkip,
  className,
}: {
  game: MiniGameDef;
  onStart: () => void;
  reward?: number;
  onSkip?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex animate-slide-up flex-col items-center justify-center gap-3 overflow-y-auto bg-background/98 p-5 text-center",
        onSkip ? "" : "pb-[104px]",
        className,
      )}
    >
      <p className="font-display text-[11px] font-black uppercase tracking-widest text-primary">
        {reward !== undefined ? "Bonus round · How to play" : "How to play"}
      </p>
      <div className="text-5xl">{game.icon}</div>
      <h2 className="font-display text-3xl font-black uppercase leading-none">{game.name}</h2>
      {reward !== undefined && (
        <div className="w-full">
          <p className="font-display rounded-2xl bg-[image:var(--gradient-gold)] py-2 text-xl font-black text-gold-foreground">
            Reward: up to +{reward} ⭐
          </p>
          <p className="font-display mt-1 text-sm font-black uppercase text-calm-foreground">
            + 12 ✨ XP for finishing it
          </p>
        </div>
      )}
      <div className="w-full space-y-3 rounded-3xl border-4 border-border bg-card p-4 text-left">
        <p className="font-display text-sm font-black uppercase text-primary">Goal</p>
        <p className="text-base font-bold leading-snug">{game.goal}</p>
        <ol className="space-y-2">
          {game.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm font-semibold leading-snug">
              <span className="font-display grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="font-display w-full rounded-2xl border-2 border-border bg-secondary px-3 py-2 text-sm font-black uppercase text-secondary-foreground">
        ⚠️ The ward keeps going at 1/3 speed in the background{onSkip ? " · you can abandon any time" : ""}
      </p>
      {onSkip ? (
        <div className="grid w-full grid-cols-2 gap-2">
          <button
            onClick={onSkip}
            className="chunky chunky-press rounded-2xl bg-secondary py-4 font-display text-xl font-black uppercase text-secondary-foreground"
          >
            Skip
          </button>
          <button
            onClick={onStart}
            className="chunky chunky-press rounded-2xl bg-primary py-4 font-display text-xl font-black uppercase text-primary-foreground"
          >
            Start ▶
          </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="font-display chunky chunky-press w-full rounded-2xl bg-primary py-4 text-xl font-black uppercase tracking-wide text-primary-foreground"
        >
          Start ▶
        </button>
      )}
    </div>
  );
}
