import { useSyncExternalStore } from "react";

/** Shared top double-door controller: anyone entering/leaving holds the door open, it closes once nobody needs it. */
export type DoorPhase = "closed" | "opening" | "open" | "closing";
export const DOOR_FRAME_MS = 80;
export const DOOR_OPEN_MS = DOOR_FRAME_MS * 6;

const holders = new Set<symbol>();
const listeners = new Set<() => void>();
let phase: DoorPhase = "closed";
let timer: ReturnType<typeof setTimeout> | null = null;

function set(next: DoorPhase) { phase = next; listeners.forEach((l) => l()); }
function update() {
  // repeat holds/releases must not cancel an in-flight animation timer
  if (holders.size) {
    if (phase === "open" || phase === "opening") return;
    if (timer) clearTimeout(timer);
    set("opening");
    timer = setTimeout(() => { timer = null; set("open"); }, DOOR_OPEN_MS);
  } else {
    if (phase === "closed" || phase === "closing") return;
    if (timer) clearTimeout(timer);
    set("closing");
    timer = setTimeout(() => { timer = null; set("closed"); update(); }, DOOR_OPEN_MS);
  }
}

export function holdDoor(id: symbol) { holders.add(id); update(); }
export function releaseDoor(id: symbol) { if (holders.delete(id)) update(); }
export function doorPhase() { return phase; }
export function subscribeDoor(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useDoorPhase() { return useSyncExternalStore(subscribeDoor, doorPhase, () => "closed" as DoorPhase); }
