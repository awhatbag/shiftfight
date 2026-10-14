import { useEffect, useRef, useState } from "react";
import barrySheet from "@/assets/barry-ward-sprites.png.asset.json";
import barrySitting from "@/assets/barry-sitting.png.asset.json";
import type { Point } from "@/game/wardNav";

/** Supplied Barry sheet (cleaned): 10 cols × 5 rows of 136×184. Rows 0-3 walk down/left/right/up, row 4 attend. */
const CELL_W = 136;
const CELL_H = 184;
/* attend row: pair 1-2, pair 3-4, then 7, 8, 9 individually (5-6 unused, 10 static idle) */
const ATTEND_SEQ = [0, 1, 0, 1, 2, 3, 2, 3, 6, 6, 7, 7, 8, 8];
const IDLE_COL = 9;

function Frame({ row, col }: { row: number; col: number }) {
  return (
    <span
      aria-hidden="true"
      className="block h-full"
      style={{
        aspectRatio: `${CELL_W} / ${CELL_H}`,
        backgroundImage: `url(${barrySheet.url})`,
        backgroundSize: "1000% 500%",
        backgroundPosition: `${(col / 9) * 100}% ${(row / 4) * 100}%`,
        imageRendering: "pixelated",
      }}
    />
  );
}

export function BarrySitting() {
  return <img src={barrySitting.url} alt="" aria-hidden="true" className="block h-full w-auto" style={{ imageRendering: "pixelated" }} draggable={false} />;
}

/** Barry walking the ward or attending at a bedside. Position comes from the shared staff runtime. */
export function BarryWalker({ pos, attending }: { pos: Point; attending: boolean }) {
  const prev = useRef(pos);
  const [dir, setDir] = useState(0);
  const [frame, setFrame] = useState(0);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const dx = pos.x - prev.current.x;
    const dy = pos.y - prev.current.y;
    prev.current = pos;
    if (Math.hypot(dx, dy) < 1e-5) { setMoving(false); return; }
    setMoving(true);
    setDir(Math.abs(dx * 0.8) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3);
  }, [pos]);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => f + 1), attending ? 260 : 90);
    return () => window.clearInterval(id);
  }, [attending]);

  const row = attending || !moving ? 4 : dir;
  const col = attending ? ATTEND_SEQ[frame % ATTEND_SEQ.length]! : moving ? frame % 10 : IDLE_COL;
  return (
    <div className="h-[84px]">
      <Frame row={row} col={col} />
    </div>
  );
}
