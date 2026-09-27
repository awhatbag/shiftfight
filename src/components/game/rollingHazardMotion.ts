import type { RollingHazard } from "./wardTypes";

/** Quantised SNES-style movement; also used for centre-point collision samples. */
export function rollingHazardPosition(hazard: RollingHazard, age: number) {
  const step = Math.floor(Math.max(0, age) / hazard.stepMs);
  const travel = Math.min(1, (step * hazard.stepMs) / hazard.speed);
  const bounce = step % 3 === 1 ? -0.006 : step % 3 === 2 ? -0.003 : 0;
  return {
    x: 1.1 - travel * 1.22,
    y: hazard.y + (hazard.endY - hazard.y) * travel + bounce,
    rotation: hazard.spin * step * 15,
  };
}