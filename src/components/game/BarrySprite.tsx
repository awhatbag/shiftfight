import { useEffect, useRef, useState } from "react";
import barrySheet from "@/assets/barry-ward-sprites.png.asset.json";
import barrySitting from "@/assets/barry-sitting.png.asset.json";
import priyaSheet from "@/assets/priya-ward-sprites.png.asset.json";
import priyaSitting from "@/assets/priya-sitting.png.asset.json";
import type { Point } from "@/game/wardNav";
import { advanceStaffWalk } from "@/game/staffAnimation";

/**
 * Supplied staff sheets: 10 cols × 5 rows. Rows 0-3 walk down/left/right/up, row 4 attend.
 * Register new staff artwork here; the shared staff runtime drives position.
 */
type StaffArt = { sheet: string; cellW: number; cellH: number; sitting: string; attendSeq: number[]; idle: [number, number] };
const STAFF_ART: Record<string, StaffArt> = {
  hca: { sheet: barrySheet.url, cellW: 117, cellH: 191, sitting: barrySitting.url, attendSeq: [0, 1, 0, 1, 2, 3, 2, 3, 6, 6, 7, 7, 8, 8], idle: [4, 9] },
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
  return <img src={art.sitting} alt="" aria-hidden="true" className="block h-full w-auto" style={{ imageRendering: "pixelated" }} draggable={false} />;
}

/** Staff walking the ward or attending at a bedside. Position comes from the shared staff runtime. */
export function StaffWalker({ staffKey, pos, attending }: { staffKey: string; pos: Point; attending: boolean }) {
  const art = STAFF_ART[staffKey];
  const prev = useRef(pos);
  const walkPhase = useRef(0);
  const [dir, setDir] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [attendFrame, setAttendFrame] = useState(0);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const dx = pos.x - prev.current.x;
    const dy = pos.y - prev.current.y;
    const from = prev.current;
    prev.current = pos;
    if (attending || Math.hypot(dx, dy) < 1e-5) { setMoving(false); return; }
    walkPhase.current = advanceStaffWalk(walkPhase.current, from, pos);
    setWalkFrame(Math.floor(walkPhase.current));
    setMoving(true);
    setDir(Math.abs(dx * 0.8) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3);
  }, [pos, attending]);

  useEffect(() => {
    if (!attending) return;
    const id = window.setInterval(() => setAttendFrame((f) => f + 1), 260);
    return () => window.clearInterval(id);
  }, [attending]);

  if (!art) return null;
  const row = attending ? 4 : moving ? dir : art.idle[0];
  const col = attending ? (art.attendSeq[attendFrame % art.attendSeq.length] ?? art.idle[1]) : moving ? walkFrame : art.idle[1];
  return (
    <div className="h-[84px]">
      <Frame art={art} row={row} col={col} />
    </div>
  );
}
