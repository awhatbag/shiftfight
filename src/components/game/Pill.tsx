import { PILL_COLORS, type PillShape } from "@/game/config";

export type PillLook = { shape: PillShape; color: number };

export function pillLookFor(name: string): PillLook {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const shapes: PillShape[] = ["round", "capsule", "oblong", "triangle"];
  return {
    shape: shapes[h % shapes.length]!,
    color: Math.floor(h / 7) % PILL_COLORS.length,
  };
}

export function Pill({ look, size = 56 }: { look: PillLook; size?: number }) {
  const c = PILL_COLORS[look.color % PILL_COLORS.length]!;
  const id = `pg-${look.color}-${look.shape}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="drop-shadow-md">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={c.a} />
          <stop offset="100%" stopColor={c.b} />
        </linearGradient>
      </defs>
      {look.shape === "round" && (
        <>
          <circle cx="32" cy="32" r="22" fill={`url(#${id})`} stroke="oklch(0.3 0.03 250 / 0.35)" strokeWidth="2" />
          <rect x="12" y="30.5" width="40" height="3" rx="1.5" fill="oklch(0.2 0 0 / 0.22)" />
          <ellipse cx="24" cy="22" rx="7" ry="4" fill="oklch(1 0 0 / 0.45)" />
        </>
      )}
      {look.shape === "capsule" && (
        <>
          <rect x="6" y="21" width="52" height="22" rx="11" fill={c.b} stroke="oklch(0.3 0.03 250 / 0.35)" strokeWidth="2" />
          <path d="M32 21H17a11 11 0 0 0 0 22h15z" fill="oklch(0.96 0.01 240)" stroke="oklch(0.3 0.03 250 / 0.3)" strokeWidth="2" />
          <ellipse cx="22" cy="27" rx="7" ry="3" fill="oklch(1 0 0 / 0.6)" />
          <ellipse cx="44" cy="27" rx="6" ry="3" fill="oklch(1 0 0 / 0.35)" />
        </>
      )}
      {look.shape === "oblong" && (
        <>
          <rect x="6" y="24" width="52" height="17" rx="8.5" fill={`url(#${id})`} stroke="oklch(0.3 0.03 250 / 0.35)" strokeWidth="2" />
          <rect x="31" y="26" width="2.5" height="13" rx="1.2" fill="oklch(0.2 0 0 / 0.25)" />
          <ellipse cx="20" cy="29" rx="8" ry="2.6" fill="oklch(1 0 0 / 0.4)" />
        </>
      )}
      {look.shape === "triangle" && (
        <>
          <path
            d="M32 11 55 50a6 6 0 0 1-5 8H14a6 6 0 0 1-5-8z"
            fill={`url(#${id})`}
            stroke="oklch(0.3 0.03 250 / 0.35)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse cx="27" cy="27" rx="6" ry="3" fill="oklch(1 0 0 / 0.4)" transform="rotate(-12 27 27)" />
        </>
      )}
    </svg>
  );
}

export function PillCup({ filled, label }: { filled: number; label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 64 56" width="64" height="56">
        <path
          d="M10 8h44l-6 42a6 6 0 0 1-6 5H22a6 6 0 0 1-6-5z"
          fill="oklch(0.97 0.02 40 / 0.85)"
          stroke="oklch(0.6 0.12 40)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="7" y="4" width="50" height="7" rx="3.5" fill="oklch(0.85 0.1 40)" />
        {Array.from({ length: 4 }).map((_, i) => (
          <path
            key={i}
            d={`M${18 + i * 9} 14 L${20 + i * 9} 48`}
            stroke="oklch(0.6 0.12 40 / 0.35)"
            strokeWidth="2"
          />
        ))}
      </svg>
      <span className="font-display -mt-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-black">
        {label ?? `${filled} in cup`}
      </span>
    </div>
  );
}
