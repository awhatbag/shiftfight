import { describe, expect, it } from "vitest";
import { EVENTS } from "./config";
import type { ActiveEvent, StaffRuntime } from "@/components/game/wardTypes";
import { pickStaffCall, releaseInterruptedStaffCall, staffCallInterrupted } from "./staffDispatch";

const mild = EVENTS.find((event) => event.severity === 1);
if (!mild) throw new Error("Staff tests require an ordinary severity-one call");
function call(id: number): ActiveEvent {
  if (!mild) throw new Error("Missing ordinary staff test call");
  return { id, bed: id - 1, def: mild, born: 0, ttl: 30000, scores: {}, actionOrder: [] };
}
function runtime(eventId: number | null = null): StaffRuntime {
  return { eventId, path: [{ x: 0.3, y: 0.4 }], goingHome: false, cooldownUntil: 12000, lastT: 0 };
}

describe("staff dispatch", () => {
  it.each(["auto", "manual", "retarget"] as const)("%s dispatch never selects a colleague's patient", (mode) => {
    expect(pickStaffCall("student", [call(1), call(2)], { hca: runtime(1), student: runtime() }, 10000, mode)?.id).toBe(2);
  });
  it("reserves assignments immediately for the next staff member in the same tick", () => {
    const staff = { hca: runtime(), student: runtime() };
    const first = pickStaffCall("hca", [call(1), call(2)], staff, 10000);
    staff.hca.eventId = first?.id ?? null;
    expect(pickStaffCall("student", [call(1), call(2)], staff, 10000)?.id).toBe(2);
  });
  it("reroutes an outbound staff member after the player's resolution, without resetting position", () => {
    const rt = runtime(1);
    rt.lastT = 5000;
    expect(staffCallInterrupted(rt, [call(2)])).toBe(true);
    releaseInterruptedStaffCall(rt);
    expect(pickStaffCall("hca", [call(2)], { hca: rt }, 5000, "retarget")?.id).toBe(2);
    expect(rt.lastT).toBe(5000);
    expect(rt.cooldownUntil).toBe(0);
  });
  it("refunds cancelled care with no replacement so the next call is immediately available", () => {
    const rt = runtime(1);
    releaseInterruptedStaffCall(rt);
    expect(pickStaffCall("hca", [], { hca: rt }, 10000, "retarget")).toBeUndefined();
    expect(rt.cooldownUntil).toBe(0);
    expect(rt.eventId).toBeNull();
    expect(pickStaffCall("hca", [call(2)], { hca: rt }, 10000)?.id).toBe(2);
  });
  it("excludes calls resolved by a colleague earlier in the same tick", () => {
    const rt = runtime(1);
    expect(staffCallInterrupted(rt, [call(1), call(2)], new Set([1]))).toBe(true);
    expect(pickStaffCall("student", [call(1), call(2)], { student: rt }, 10000, "retarget", new Set([1]))?.id).toBe(2);
  });
  it("preserves the two-second bedside stay once attendance has started", () => {
    const rt = runtime(1);
    rt.path = [];
    rt.attendUntil = 12000;
    expect(staffCallInterrupted(rt, [], new Set([1]))).toBe(false);
    expect(rt.attendUntil - 10000).toBe(2000);
  });
  it("keeps automatic response delay but reroutes an existing assignment to a fresh call", () => {
    expect(pickStaffCall("hca", [call(1)], {}, 1000)).toBeUndefined();
    expect(pickStaffCall("hca", [call(1)], {}, 1000, "retarget")?.id).toBe(1);
  });
});