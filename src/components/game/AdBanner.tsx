// Placeholder ad banner: always-on strip at the very top of the app shell.
// Real ad networks (e.g. AdMob) will drop into this slot later; nothing else
// in the game reads or depends on it.
const FAKE_AD = "🥑 Guac-Go™ — smoother than ever. Now with extra pits!";

export function AdBanner() {
  return (
    <div
      className="flex w-full shrink-0 items-center gap-2 border-b-2 border-border bg-muted px-2 pt-[env(safe-area-inset-top)]"
      style={{ height: "calc(3rem + env(safe-area-inset-top))" }}
      aria-label="Advertisement placeholder"
    >
      <span className="shrink-0 rounded-md bg-background px-1 py-0.5 font-display text-[8px] font-black uppercase leading-none text-muted-foreground ring-1 ring-border">
        Ad
      </span>
      <p className="min-w-0 flex-1 truncate text-center text-xs font-bold text-muted-foreground">
        {FAKE_AD}
      </p>
      <span className="w-8 shrink-0" aria-hidden />
    </div>
  );
}
