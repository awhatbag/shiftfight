import type { MiniGameDef } from "@/game/minigames";

/** Shown every time a mini-game opens; the game itself only mounts after START. */
export function MiniGameIntro({ game, onStart }: { game: MiniGameDef; onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col items-center justify-center gap-4 bg-background/98 p-5 pb-[104px] text-center">
      <p className="font-display text-[11px] font-black uppercase tracking-widest text-primary">How to play</p>
      <div className="text-5xl">{game.icon}</div>
      <h2 className="font-display text-3xl font-black uppercase leading-none">{game.name}</h2>
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
        ⚠️ The ward keeps going at 1/3 speed in the background
      </p>
      <button
        onClick={onStart}
        className="font-display chunky chunky-press w-full rounded-2xl bg-primary py-4 text-xl font-black uppercase tracking-wide text-primary-foreground"
      >
        Start ▶
      </button>
    </div>
  );
}
