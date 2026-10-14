import { useEffect, useRef, useState } from "react";
import donSheet from "@/assets/don-ward-sprites.png.asset.json";
import { BED_ARRIVAL, routeTo, type Point } from "@/game/wardNav";
import { DOOR_OPEN_MS, doorPhase, holdDoor, releaseDoor } from "@/game/wardDoor";

/** Supplied DON sheet: 10 cols × 5 rows. Rows 0-3 walk down/up/right/left, row 4 = poses. */
export type DonPose = "happy" | "point" | "angry" | "smug" | "triumphant" | "stressed" | "disappointed" | "ecstatic";
const POSE_COL: Record<DonPose, number> = { happy: 0, point: 1, angry: 2, smug: 3, triumphant: 4, stressed: 5, disappointed: 6, ecstatic: 7 };
const CELL_W = 192;
const CELL_H = 1029 / 5;

export function DonFrame({ row, col, className = "" }: { row: number; col: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        aspectRatio: `${CELL_W} / ${CELL_H}`,
        backgroundImage: `url(${donSheet.url})`,
        backgroundSize: "1000% 500%",
        backgroundPosition: `${(col / 9) * 100}% ${(row / 4) * 100}%`,
        imageRendering: "pixelated",
      }}
    />
  );
}

export function DonPortrait({ pose, className }: { pose: DonPose; className?: string }) {
  return <DonFrame row={4} col={POSE_COL[pose]} className={className ?? ""} />;
}

const ENTRY: Point = { x: 0.5, y: 0.08 }; // top double doors behind the nurses' station
const SPEED = 0.11; // ward units per second
const PAUSE_MS = 2600;

/** The DON patrols the ward on her own, inspecting random bays and posing on reactions. */
export function DonSprite({ line, pose, poseKey, leaving = false, onExit }: { line: string; pose: DonPose; poseKey: number; leaving?: boolean; onExit: () => void }) {
  const [pos, setPos] = useState<Point>(ENTRY);
  const [dir, setDir] = useState(0);
  const [frame, setFrame] = useState(0);
  const [moving, setMoving] = useState(true);
  const [posing, setPosing] = useState(true);
  const path = useRef<Point[]>([]);
  const posRef = useRef(ENTRY);
  const pauseUntil = useRef(0);
  const leavingRef = useRef(leaving);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const doorId = useRef(Symbol("don"));
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const exited = useRef(false);

  // door opens first, then she steps out; release once she is clear of the doorway
  useEffect(() => {
    const id = doorId.current;
    holdDoor(id);
    return () => releaseDoor(id);
  }, []);

  useEffect(() => {
    leavingRef.current = leaving;
    if (!leaving) return;
    path.current = routeTo(ENTRY, posRef.current);
    pauseUntil.current = 0;
    setPosing(false);
    setMoving(true);
  }, [leaving]);

  // react with a pose whenever the DON says something new
  useEffect(() => {
    if (leaving) return;
    setPosing(true);
    pauseUntil.current = Math.max(pauseUntil.current, performance.now() + PAUSE_MS);
    const t = window.setTimeout(() => setPosing(false), PAUSE_MS);
    return () => window.clearTimeout(t);
  }, [poseKey, leaving]);

  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      if (exited.current) return;
      if (!visibleRef.current) {
        if (doorPhase() !== "open") return;
        visibleRef.current = true; setVisible(true);
      }
      const nearDoor = posRef.current.y < 0.2;
      if (leavingRef.current && nearDoor) holdDoor(doorId.current);
      else if (!nearDoor) releaseDoor(doorId.current);
      if (now < pauseUntil.current) { setMoving(false); return; }
      if (!path.current.length) {
        if (leavingRef.current) {
          if (doorPhase() !== "open") return; // wait for the doors to open before stepping through
          exited.current = true; setVisible(false); releaseDoor(doorId.current);
          window.setTimeout(() => onExitRef.current(), DOOR_OPEN_MS + 50);
          return;
        }
        const bay = BED_ARRIVAL[Math.floor(Math.random() * BED_ARRIVAL.length)] ?? ENTRY;
        const fromDoor = posRef.current.y < 0.3;
        path.current = routeTo({ x: 0.5, y: bay.y }, posRef.current).filter((p) => fromDoor || p.y > 0.3);
        if (!path.current.length) path.current = [{ x: 0.5, y: 0.6 }];
      }
      const target = path.current[0];
      if (!target) return;
      const p = posRef.current;
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const d = Math.hypot(dx, dy);
      const step = SPEED * dt;
      let next: Point;
      if (d <= step) {
        next = target;
        path.current.shift();
        if (!path.current.length && !leavingRef.current) pauseUntil.current = now + PAUSE_MS;
      } else next = { x: p.x + (dx / d) * step, y: p.y + (dy / d) * step };
      posRef.current = next;
      setPos(next);
      setMoving(true);
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : dy > 0 ? 0 : 1);
      acc += dt;
      if (acc > 0.09) { acc = 0; setFrame((f) => (f + 1) % 10); }
    }, 60);
    return () => window.clearInterval(id);
  }, []);

  const row = posing || !moving ? 4 : dir;
  const col = posing ? POSE_COL[pose] : moving ? frame : POSE_COL.smug;
  return (
    <div
      className={`pointer-events-none absolute h-[92px] ${visible ? "" : "invisible"}`}
      style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%,-82%)", zIndex: Math.round(pos.y * 100) + 1 }}
      role="img"
      aria-label="The DON"
    >
      <DonFrame row={row} col={col} className="h-full" />
      <div className="animate-pop absolute bottom-full left-1/2 mb-1 w-max max-w-[150px] -translate-x-1/2 rounded-xl border-2 border-border bg-card px-2 py-1 text-center font-display text-[10px] font-black leading-tight text-card-foreground shadow-lg">
        {line}
      </div>
    </div>
  );
}
