import { type PillShape } from "@/game/config";

export type PillLook = { shape: PillShape; color: number };

/* Vivid cartoon hues for 32-bit pill sprites (oklch hue angles). */
const HUES = [25, 145, 90, 265, 330, 200, 55, 300];
const CREAM = ["oklch(0.42 0.04 70)", "oklch(0.7 0.04 80)", "oklch(0.82 0.035 85)", "oklch(0.9 0.03 88)", "oklch(0.96 0.02 90)", "oklch(0.995 0.01 90)"];

function ramp(h: number) {
  // outline, deep, shadow, mid, light, highlight
  return [
    `oklch(0.3 0.12 ${h})`,
    `oklch(0.48 0.2 ${h})`,
    `oklch(0.58 0.22 ${h})`,
    `oklch(0.68 0.22 ${h})`,
    `oklch(0.79 0.17 ${h})`,
    `oklch(0.94 0.08 ${h})`,
  ];
}

export function pillLookFor(name: string): PillLook {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const shapes: PillShape[] = ["round", "capsule", "oblong", "triangle"];
  return { shape: shapes[h % shapes.length]!, color: Math.floor(h / 7) % HUES.length };
}

const G = 20; // sprite grid

function inside(shape: PillShape, x: number, y: number) {
  const px = x + 0.5, py = y + 0.5;
  switch (shape) {
    case "round":
      return (px - 10) ** 2 + (py - 10) ** 2 <= 8.6 ** 2;
    case "capsule": {
      if (py < 5 || py > 15) return false;
      if (px >= 6 && px <= 14) return true;
      return (px - 6) ** 2 + (py - 10) ** 2 <= 25 || (px - 14) ** 2 + (py - 10) ** 2 <= 25;
    }
    case "oblong": {
      if (py < 6 || py > 14) return false;
      if (px >= 5 && px <= 15) return true;
      return (px - 5) ** 2 + (py - 10) ** 2 <= 16.5 || (px - 15) ** 2 + (py - 10) ** 2 <= 16.5;
    }
    case "triangle": {
      if (py < 2.5 || py > 17.5) return false;
      const half = ((py - 2.5) / 15) * 8.6;
      return Math.abs(px - 10) <= half + 0.4;
    }
  }
}

const cache = new Map<string, { x: number; y: number; c: string }[]>();

function pixels(look: PillLook) {
  const key = `${look.shape}-${look.color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = ramp(HUES[look.color % HUES.length]!);
  const out: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      if (!inside(look.shape, x, y)) continue;
      const edge =
        !inside(look.shape, x - 1, y) || !inside(look.shape, x + 1, y) ||
        !inside(look.shape, x, y - 1) || !inside(look.shape, x, y + 1);
      const pal = look.shape === "capsule" && x < 10 ? CREAM : r;
      if (edge) { out.push({ x, y, c: pal[0]! }); continue; }
      // light from top-left
      const l = 1 - (x / G) * 0.45 - (y / G) * 0.75;
      let i = l > 0.62 ? 4 : l > 0.42 ? 3 : l > 0.22 ? 2 : 1;
      // score lines
      if (look.shape === "round" && y === 10 && x > 3 && x < 17) i = Math.max(1, i - 2);
      if (look.shape === "oblong" && x === 10) i = Math.max(1, i - 2);
      if (look.shape === "capsule" && x === 10) i = 1;
      out.push({ x, y, c: pal[i]! });
    }
  // specular glints
  const glint: Record<PillShape, [number, number][]> = {
    round: [[6, 5], [7, 5], [5, 6], [6, 6]],
    capsule: [[4, 7], [5, 7], [6, 7], [12, 7], [13, 7]],
    oblong: [[4, 8], [5, 8], [6, 8], [7, 8]],
    triangle: [[9, 6], [8, 7], [9, 7]],
  };
  for (const [gx, gy] of glint[look.shape]) {
    const pal = look.shape === "capsule" && gx < 10 ? CREAM : r;
    out.push({ x: gx, y: gy, c: pal[5]! });
  }
  cache.set(key, out);
  return out;
}

export function Pill({ look, size = 56 }: { look: PillLook; size?: number }) {
  return (
    <svg
      viewBox={`0 0 ${G} ${G + 2}`}
      width={size}
      height={(size * (G + 2)) / G}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      {/* pixel drop shadow */}
      <rect x={5} y={G} width={10} height={1} fill="oklch(0.2 0.03 250 / 0.3)" />
      <rect x={7} y={G + 1} width={6} height={1} fill="oklch(0.2 0.03 250 / 0.2)" />
      {pixels(look).map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={1.02} height={1.02} fill={p.c} />
      ))}
    </svg>
  );
}

/* 32-bit dosing cup: 32x28 grid, translucent plastic with stepped ramp + ticks */
const CW = 32, CH = 30;
function cupInside(x: number, y: number) {
  if (y < 3 || y > 28) return false;
  const t = (y - 3) / 25;
  const half = 14 - t * 4;
  return Math.abs(x + 0.5 - 16) <= half;
}
const CUP: { x: number; y: number; c: string }[] = (() => {
  const out: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      if (!cupInside(x, y)) continue;
      const edge = !cupInside(x - 1, y) || !cupInside(x + 1, y) || !cupInside(x, y + 1);
      if (edge) { out.push({ x, y, c: "oklch(0.45 0.08 220)" }); continue; }
      const l = x / CW;
      const c =
        l < 0.2 ? "oklch(0.97 0.03 210 / 0.9)" :
        l < 0.3 ? "oklch(0.92 0.04 210 / 0.6)" :
        l > 0.8 ? "oklch(0.72 0.06 220 / 0.7)" :
        l > 0.7 ? "oklch(0.82 0.05 215 / 0.6)" : "oklch(0.9 0.035 210 / 0.45)";
      out.push({ x, y, c });
    }
  // rim
  for (let x = 1; x < 31; x++) {
    out.push({ x, y: 1, c: "oklch(0.45 0.08 220)" });
    out.push({ x, y: 2, c: x < 8 ? "oklch(0.99 0.01 210)" : "oklch(0.88 0.05 210)" });
    out.push({ x, y: 3, c: "oklch(0.7 0.07 220)" });
  }
  // measurement ticks
  for (const ty of [9, 15, 21]) for (let x = 20; x < 24; x++) out.push({ x, y: ty, c: "oklch(0.5 0.12 240)" });
  return out;
})();

export function PillCup({
  filled,
  label,
  looks = [],
  size = 128,
}: {
  filled: number;
  label?: string;
  looks?: PillLook[];
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${CW} ${CH}`}
        width={size}
        height={(size * CH) / CW}
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        {/* pills stacked inside, behind front plastic */}
        {looks.map((lk, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          return (
            <svg key={i} x={7 + col * 6 + (row % 2) * 3} y={21 - row * 5} width={7} height={7.7} viewBox={`0 0 ${G} ${G + 2}`}>
              {pixels(lk).map((p, j) => (
                <rect key={j} x={p.x} y={p.y} width={1.02} height={1.02} fill={p.c} />
              ))}
            </svg>
          );
        })}
        {CUP.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1.02} height={1.02} fill={p.c} />
        ))}
      </svg>
      <span className="font-display -mt-1 rounded-md border-2 border-foreground/70 bg-card px-3 py-0.5 text-lg font-black">
        {label ?? `${filled} in cup`}
      </span>
    </div>
  );
}
