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
  if (timer) clearTimeout(timer);
  timer = null;
  if (holders.size) {
    if (phase === "open" || phase === "opening") return;
    set("opening");
    timer = setTimeout(() => set("open"), DOOR_OPEN_MS);
  } else {
    if (phase === "closed" || phase === "closing") return;
    set("closing");
    timer = setTimeout(() => set("closed"), DOOR_OPEN_MS);
  }
}

export function holdDoor(id: symbol) { holders.add(id); update(); }
export function releaseDoor(id: symbol) { if (holders.delete(id)) update(); }
export function doorPhase() { return phase; }
export function subscribeDoor(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useDoorPhase() { return useSyncExternalStore(subscribeDoor, doorPhase, () => "closed" as DoorPhase); }
