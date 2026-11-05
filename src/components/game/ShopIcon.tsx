import { cn } from "@/lib/utils";

/** generated pixel-art item icons, keyed by shop item key (falls back to emoji) */
const ICONS = import.meta.glob<string>("@/assets/shop-icons/*.png", {
  eager: true,
  import: "default",
});
const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(ICONS)) {
  byKey[path.split("/").pop()!.replace(".png", "")] = url;
}

export function ShopIcon({ itemKey, fallback, className }: { itemKey: string; fallback: string; className?: string }) {
  const src = byKey[itemKey];
  return (
    <span className={cn("ds-icon grid h-11 w-11 shrink-0 place-items-center text-xl", className)}>
      {src ? (
        <img src={src} alt="" width={96} height={96} className="h-9 w-9" style={{ imageRendering: "pixelated" }} />
      ) : (
        fallback
      )}
    </span>
  );
}
