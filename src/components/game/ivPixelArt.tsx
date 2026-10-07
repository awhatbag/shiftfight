/* 32-bit pixel sprites for the IV mix mini-game. Pure presentation. */
type Px = { x: number; y: number; w?: number; c: string };

function Sprite({ w, h, scale, px }: { w: number; h: number; scale: number; px: Px[] }) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {px.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={(p.w ?? 1) + 0.02} height={1.02} fill={p.c} />
      ))}
    </svg>
  );
}

const OUT = "oklch(0.28 0.04 240)";
const METAL = ["oklch(0.45 0.02 240)", "oklch(0.62 0.02 240)", "oklch(0.78 0.015 240)", "oklch(0.93 0.01 240)"];
const GLASS = {
  shine: "oklch(0.99 0.01 210 / 0.95)",
  hi: "oklch(0.95 0.03 210 / 0.6)",
  mid: "oklch(0.9 0.035 210 / 0.35)",
  shade: "oklch(0.72 0.05 220 / 0.55)",
};

/* Vial: 32 x 53 grid at 4px -> 128 x 212 (matches the old vial footprint). */
export function PixelVial({ near, mix }: { near: boolean; mix: number }) {
  const W = 32;
  const px: Px[] = [];
  // crimp cap rows 0-5, x 6..25
  for (let y = 0; y < 6; y++) {
    px.push({ x: 6, y, c: OUT }, { x: 25, y, c: OUT });
    for (let x = 7; x < 25; x++) {
      const t = (x - 7) / 18;
      const c = y === 0 || y === 5 ? OUT : t < 0.15 ? METAL[3]! : t < 0.4 ? METAL[2]! : t < 0.8 ? METAL[1]! : METAL[0]!;
      px.push({ x, y, c });
    }
  }
  // rubber port window
  const rub = near ? ["oklch(0.55 0.16 155)", "oklch(0.75 0.17 155)"] : ["oklch(0.3 0.03 20)", "oklch(0.45 0.05 20)"];
  for (let x = 11; x < 21; x++) {
    px.push({ x, y: 1, c: rub[1]! }, { x, y: 2, c: rub[0]! });
  }
  // neck rows 6-8, x 8..23
  for (let y = 6; y < 9; y++) {
    px.push({ x: 8, y, c: OUT }, { x: 23, y, c: OUT });
    for (let x = 9; x < 23; x++) px.push({ x, y, c: x < 11 ? GLASS.shine : x > 20 ? GLASS.shade : GLASS.mid });
  }
  // body rows 9-52, x 0..31 with rounded corners
  const H = 53;
  const liquidTop = 9 + Math.round(44 * 0.38);
  const mixing = mix >= 0;
  const L = mixing ? 0.8 - mix * 0.1 : 0.9;
  const C = mixing ? 0.06 + mix * 0.14 : 0.03;
  const Hh = mixing ? 200 + mix * 120 : 210;
  const liq = [`oklch(${L - 0.18} ${C + 0.03} ${Hh})`, `oklch(${L - 0.08} ${C + 0.02} ${Hh})`, `oklch(${L} ${C} ${Hh})`, `oklch(${Math.min(0.98, L + 0.08)} ${C * 0.6} ${Hh})`];
  for (let y = 9; y < H; y++) {
    const inset = y === 9 ? 3 : y === 10 ? 1 : y >= H - 1 ? 4 : y === H - 2 ? 2 : y === H - 3 ? 1 : 0;
    const x0 = inset, x1 = W - 1 - inset;
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === 9 || y === H - 1;
      if (edge) { px.push({ x, y, c: OUT }); continue; }
      const t = x / W;
      if (y >= liquidTop && y < H - 2 && x > x0 + 1 && x < x1 - 1) {
        const c = y === liquidTop ? liq[3]! : t < 0.2 ? liq[3]! : t > 0.8 ? liq[0]! : t > 0.6 ? liq[1]! : liq[2]!;
        px.push({ x, y, c });
        continue;
      }
      px.push({ x, y, c: t < 0.1 ? GLASS.shine : t < 0.18 ? GLASS.hi : t > 0.85 ? GLASS.shade : GLASS.mid });
    }
  }
  // glass bottom rim
  for (let x = 4; x < 28; x++) px.push({ x, y: H - 2, c: GLASS.shade });
  // bubbles while mixing
  if (mixing && mix > 0) {
    const n = 3 + Math.floor(mix * 6);
    for (let i = 0; i < n; i++) {
      const bx = 6 + ((i * 7 + Math.floor(mix * 40)) % 20);
      const by = liquidTop + 2 + ((i * 11 + Math.floor(mix * 60)) % (H - liquidTop - 5));
      px.push({ x: bx, y: by, c: liq[3]! });
    }
  }
  return <Sprite w={W} h={H} scale={4} px={px} />;
}

/* Syringe: 12 x 48 grid at 4px -> 48 x 192 (needle tip at bottom centre, as before). */
export function PixelSyringe() {
  const px: Px[] = [];
  const W = 12;
  // thumb rest rows 0-2
  for (let x = 0; x < W; x++) {
    px.push({ x, y: 0, c: OUT }, { x, y: 2, c: OUT });
    px.push({ x, y: 1, c: x === 0 || x === W - 1 ? OUT : x < 4 ? METAL[3]! : METAL[1]! });
  }
  // plunger rod rows 3-8, x 5..6
  for (let y = 3; y < 9; y++) px.push({ x: 4, y, c: OUT }, { x: 5, y, c: METAL[2]! }, { x: 6, y, c: METAL[1]! }, { x: 7, y, c: OUT });
  // barrel flange row 9
  for (let x = 0; x < W; x++) px.push({ x, y: 9, c: x === 0 || x === W - 1 ? OUT : METAL[2]! });
  // barrel rows 10-30, x 1..10
  for (let y = 10; y < 31; y++) {
    px.push({ x: 1, y, c: OUT }, { x: 10, y, c: OUT });
    for (let x = 2; x < 10; x++) {
      let c = x === 3 ? GLASS.shine : x === 9 ? GLASS.shade : GLASS.mid;
      if (y === 10 || y === 11) c = "oklch(0.3 0.02 20)"; // rubber piston
      else if (y >= 16 && x > 3 && x < 9) c = x > 7 ? "oklch(0.55 0.15 200)" : "oklch(0.7 0.14 200)";
      if (x === 8 && y > 12 && y % 4 === 0) c = OUT; // ticks
      px.push({ x, y, c });
    }
  }
  for (let x = 1; x < 11; x++) px.push({ x, y: 31, c: OUT });
  // hub rows 32-34
  for (let y = 32; y < 35; y++) for (let x = 4; x < 8; x++) px.push({ x, y, c: x === 4 || x === 7 ? OUT : METAL[2]! });
  // needle rows 35-47
  for (let y = 35; y < 48; y++) {
    px.push({ x: 5, y, c: METAL[3]! });
    if (y < 46) px.push({ x: 6, y, c: METAL[0]! });
  }
  return <Sprite w={W} h={48} scale={4} px={px} />;
}
