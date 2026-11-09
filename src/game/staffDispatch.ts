import type { ActiveEvent, StaffRuntime } from "@/components/game/wardTypes";
import { STAFF_BEHAVIOUR } from "./config";
import { isCatastropheEvent } from "./catastrophes";
import { isPillowEvent } from "./pillowProblems";

/** One shared reservation check for automatic, manual and interrupted dispatch. */
export function pickStaffCall(
  key: string,
  events: readonly ActiveEvent[],
  runtimes: Readonly<Record<string, StaffRuntime>>,
  now: number,
  mode: "auto" | "manual" | "retarget" = "auto",
  resolved: ReadonlySet<number> = new Set(),
): ActiveEvent | undefined {
  const behaviour = STAFF_BEHAVIOUR[key];
  if (!behaviour) return undefined;
  const reserved = new Set(Object.entries(runtimes)
    .filter(([other, rt]) => other !== key && rt.eventId !== null)
    .map(([, rt]) => rt.eventId));
  const available = events.filter((event) =>
    !reserved.has(event.id) && !resolved.has(event.id) &&
    !isPillowEvent(event.def) && event.def.severity <= behaviour.maxSeverity &&
    (mode !== "auto" || now - event.born >= behaviour.responseMs) &&
    (mode !== "manual" || !isCatastropheEvent(event.def)));
  if (mode === "manual") {
    available.sort((a, b) => b.def.severity - a.def.severity ||
      (now - b.born) / b.ttl - (now - a.born) / a.ttl);
  }
  return available[0];
}

/** Bedside care is committed; only an outbound journey can be redirected. */
export function staffCallInterrupted(rt: StaffRuntime, events: readonly ActiveEvent[], resolved: ReadonlySet<number> = new Set()): boolean {
  return rt.eventId !== null && rt.attendUntil === undefined && !rt.goingHome &&
    (resolved.has(rt.eventId) || !events.some((event) => event.id === rt.eventId));
}