import { useEffect, useState } from "react";
import doorFrames from "@/assets/ward-door-frames.png.asset.json";
import doorRoom from "@/assets/ward-doorway-room.png.asset.json";
import { DOOR_FRAME_MS, useDoorPhase } from "@/game/wardDoor";

/** Door box in the 897×1123 ward artwork (matches the painted double doors). */
export const DOOR_BOX = { left: 339 / 897, top: 11 / 1123, width: 112 / 897, height: 113 / 1123 };
/** Doors sit above anyone standing in the doorway; people step in front once below the door base. */
export const DOOR_Z = Math.round((DOOR_BOX.top + DOOR_BOX.height) * 100);

const box = (z: number) => ({ left: `${DOOR_BOX.left * 100}%`, top: `${DOOR_BOX.top * 100}%`, width: `${DOOR_BOX.width * 100}%`, height: `${DOOR_BOX.height * 100}%`, zIndex: z });

/** Corridor room behind the doors — always underneath doors and anyone passing through. */
export function WardDoorRoom() {
  return <div className="pointer-events-none absolute" style={box(1)}>
    <img src={doorRoom.url} alt="" aria-hidden="true" draggable={false} className="absolute object-fill" style={{ left: "10%", top: "19%", width: "80%", height: "81%", imageRendering: "pixelated" }}/>
  </div>;
}

/** Animated supplied door sprite (frames 0-5 opening, 6-11 closing). */
export function WardDoor() {
  const phase = useDoorPhase();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (phase === "closed") { setFrame(0); return; }
    if (phase === "open") { setFrame(5); return; }
    const [start, end] = phase === "opening" ? [0, 5] : [6, 11];
    let f = start; setFrame(f);
    const id = setInterval(() => { f = Math.min(end, f + 1); setFrame(f); }, DOOR_FRAME_MS);
    return () => clearInterval(id);
  }, [phase]);
  return <div aria-hidden="true" className="pointer-events-none absolute" style={{ ...box(DOOR_Z), backgroundImage: `url(${doorFrames.url})`, backgroundSize: "1200% 100%", backgroundPosition: `${(frame / 11) * 100}% 0%`, imageRendering: "pixelated" }}/>;
}
