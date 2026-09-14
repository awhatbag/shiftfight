import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { shiftTitle } from "@/game/shifts";
import { wardLadder } from "@/game/wards";

/**
 * Level ladder — pick any shift you've already unlocked, and see the wards
 * that open up beyond Level 10.
 */
export function LadderScreen({
  highestLevel,
  currentLevel,
  onPick,
  onBack,
}: {
  highestLevel: number;
  currentLevel: number;
  onPick: (level: number) => void;
  onBack: () => void;
}) {
  const ladder = wardLadder(highestLevel);

  /* the phone's own back button leaves the ladder, just like the BACK button */
  const backRef = useRef(onBack);
  backRef.current = onBack;
  useEffect(() => {
    window.history.pushState({ ladder: true }, "");
    const onPop = () => backRef.current();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h2 className="font-display text-2xl font-black uppercase">🪜 Level Ladder</h2>

      <p className="text-[11px] text-muted-foreground">
        Replay any shift you've reached. New sections of the hospital open after Level 10.
      </p>

      {ladder.map(({ ward, unlocked, levels }) => (
        <div key={ward.id} className="rounded-2xl border-2 border-border bg-card/70 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{ward.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-sm font-black uppercase">{ward.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{ward.blurb}</p>
            </div>
            <span
              className={cn(
                "font-display shrink-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase",
                unlocked
                  ? "bg-calm text-calm-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {unlocked
                ? "OPEN"
                : ward.status === "planned"
                  ? "COMING SOON"
                  : `LV${ward.unlockAt}`}
            </span>
          </div>

          {ward.status === "live" ? (
            <div className="mt-3 space-y-1.5">
              {levels.map((l) => {
                const open = unlocked && l <= Math.max(1, highestLevel);
                const story = shiftTitle(l);
                return (
                  <button
                    key={l}
                    disabled={!open}
                    onClick={() => onPick(l)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 border-border bg-background p-2 text-left",
                      open ? "chunky-press" : "opacity-50",
                      l === currentLevel && "ring-2 ring-primary",
                    )}
                  >
                    <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-black">
                      {open ? l : "🔒"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display block truncate text-xs font-black uppercase">
                        {story.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {story.lead}
                      </span>
                    </span>
                    {open && (
                      <span className="font-display shrink-0 rounded-lg bg-primary px-2 py-1 text-[10px] font-black uppercase text-primary-foreground">
                        Play ▶
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border-2 border-dashed border-border p-2 text-[11px] text-muted-foreground">
              Levels {ward.from}–{ward.to} · up to {ward.maxBeds} beds. This section is being
              built — finish Ward A first.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
