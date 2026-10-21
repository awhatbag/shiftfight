import { useEffect, useRef, useState } from "react";
import barrySheet from "@/assets/barry-ward-sprites.png.asset.json";
import barrySitting from "@/assets/barry-sitting.png.asset.json";
import priyaSheet from "@/assets/priya-ward-sprites.png.asset.json";
import priyaSitting from "@/assets/priya-sitting.png.asset.json";
import type { Point } from "@/game/wardNav";
import { STAFF_ATTEND_FRAME_MS, STAFF_STRIDE_LEN, staffAnimationFrame, strideFrame } from "@/game/staffAnimation";

/**
 * Supplied staff sheets: 10 cols × 5 rows. Rows 0-3 walk down/left/right/up, row 4 attend.
 * Register new staff artwork here; the shared staff runtime drives position.
 */
type StaffArt = { sheet: string; cellW: number; cellH: number; sitting: string; attendSeq: number[]; idle: [number, number]; walkSeq?: number[][] };
const STAFF_ART: Record<string, StaffArt> = {
  // Barry walk frames per row (down, left, right, up): only cells not marked with a red X on his v2 sheet.
  hca: { sheet: barrySheet.url, cellW: 117, cellH: 191, sitting: barrySitting.url, attendSeq: [0, 1, 0, 1, 2, 3, 2, 3, 6, 6, 7, 7, 8, 8], idle: [4, 9], walkSeq: [[0, 1, 2, 4, 9], [0, 1, 3, 5, 6, 7], [0, 3, 4, 7], [0, 3, 4, 7, 8]] },
  student: { sheet: priyaSheet.url, cellW: 136, cellH: 206, sitting: priyaSitting.url, attendSeq: [1, 2, 1, 2, 5, 5, 6, 6, 7, 7, 9, 9], idle: [4, 8] },
};

export const hasStaffArt = (key: string | undefined): key is string => !!key && key in STAFF_ART;

function Frame({ art, row, col }: { art: StaffArt; row: number; col: number }) {
  return (
    <span
      aria-hidden="true"
      className="block h-full"
      style={{
        aspectRatio: `${art.cellW} / ${art.cellH}`,
        backgroundImage: `url(${art.sheet})`,
        backgroundSize: "1000% 500%",
        backgroundPosition: `${(col / 9) * 100}% ${(row / 4) * 100}%`,
        imageRendering: "pixelated",
      }}
    />
  );
}

export function StaffSitting({ staffKey }: { staffKey: string }) {
  const art = STAFF_ART[staffKey];
  if (!art) return null;
  // Barry's narrower seated art is shown 10% smaller, bottom-anchored in the same slot.
  const scale = staffKey === "hca" ? 0.9 : 1;
  return <img src={art.sitting} alt="" aria-hidden="true" className="block h-full w-auto" style={{ transform: `scale(${scale})`, transformOrigin: "50% 100%", imageRendering: "pixelated" }} draggable={false} />;
}

/** Staff walking the ward or attending at a bedside. Position comes from the shared staff runtime. */
export function StaffWalker({ staffKey, pos, walking, attending, frozen = false }: { staffKey: string; pos: Point; walking: boolean; attending: boolean; frozen?: boolean }) {
  const art = STAFF_ART[staffKey];
  const prev = useRef(pos);
  const [dir, setDir] = useState(0);
  const [frame, setFrame] = useState(0);
  const [travelled, setTravelled] = useState(0);

  useEffect(() => {
    const dx = pos.x - prev.current.x;
    const dy = pos.y - prev.current.y;
    prev.current = pos;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-5) return; // Keep direction during unchanged-position ticks.
    if (dist < 0.2) setTravelled((t) => t + dist); // ignore teleports
    setDir(Math.abs(dx * 0.8) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3);
  }, [pos]);

  // Walking steps follow distance; the timer only drives bedside actions.
  useEffect(() => {
    if (frozen || walking) return;
    const id = window.setInterval(() => setFrame((f) => f + 1), STAFF_ATTEND_FRAME_MS);
    return () => window.clearInterval(id);
  }, [walking, attending, frozen]);

  if (!art) return null;
  const { row, col } = staffAnimationFrame({ walking, attending, direction: dir, frame: walking ? strideFrame(travelled, STAFF_STRIDE_LEN) : frame, attendSeq: art.attendSeq, idle: art.idle, walkSeq: art.walkSeq });
  return (
    <div className="relative h-[84px]">
      {attending && (
        <span className="font-display pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-foreground bg-card px-1.5 py-0.5 text-[9px] font-black uppercase text-foreground shadow-[2px_2px_0_0_hsl(var(--foreground)/0.6)] animate-pop" style={{ imageRendering: "pixelated" }}>
          On it!
          <span className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 -translate-y-[3px] rotate-45 border-b-2 border-r-2 border-foreground bg-card" />
        </span>
      )}
      <Frame art={art} row={row} col={col} />
    </div>
  );
}
