/**
 * Tiny developer-tools bus.
 * Lets Dev Mode poke the running ward (and read live info) without changing
 * any gameplay wiring. Nothing here runs unless Dev Mode is opened.
 */

type Handler = () => void;

const handlers: Record<string, Set<Handler>> = {};
const pending = new Set<string>();

export function onDevCommand(name: string, fn: Handler): () => void {
  (handlers[name] ??= new Set()).add(fn);
  if (pending.delete(name)) window.setTimeout(fn, 0);
  return () => {
    handlers[name]?.delete(fn);
  };
}

export function emitDevCommand(name: string) {
  const listeners = handlers[name];
  if (!listeners?.size) {
    pending.add(name);
    return;
  }
  listeners.forEach((fn) => fn());
}

/* ---- live debug info reported by the ward ---- */

export type DevInfo = { activeEvents: number; inShift: boolean };

let info: DevInfo = { activeEvents: 0, inShift: false };
const infoSubs = new Set<(i: DevInfo) => void>();

export function reportDevInfo(next: Partial<DevInfo>) {
  info = { ...info, ...next };
  infoSubs.forEach((fn) => fn(info));
}

export function subscribeDevInfo(fn: (i: DevInfo) => void): () => void {
  infoSubs.add(fn);
  fn(info);
  return () => {
    infoSubs.delete(fn);
  };
}

export const DEV_PIN = "124500";
