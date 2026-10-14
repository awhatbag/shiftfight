import type { Upgrades } from "@/game/config";

export type Point = { x: number; y: number };

/** Fixed 890 × 1123 ward-world coordinates, matching the supplied layout mock-up. */
export const BED_SLOTS: Point[] = [
  { x: 0.245, y: 0.375 }, { x: 0.755, y: 0.375 },
  { x: 0.245, y: 0.545 }, { x: 0.755, y: 0.545 },
  { x: 0.245, y: 0.71 }, { x: 0.755, y: 0.71 },
  { x: 0.245, y: 0.865 }, { x: 0.755, y: 0.865 },
];

export const STATION_FRAME = { x: 0.21, y: 0.11, width: 0.58, height: 0.22 };

export const STATION_CHAIRS: readonly [Point, Point, Point, Point, Point] = [
  { x: 0.195, y: 0.485 }, { x: 0.35, y: 0.49 }, { x: 0.5, y: 0.5 },
  { x: 0.645, y: 0.49 }, { x: 0.795, y: 0.485 },
];

export function stationChair(index: number): Point {
  return STATION_CHAIRS[index] ?? STATION_CHAIRS[0];
}

export function stationChairInWard(index: number): Point {
  const chair = stationChair(index);
  return {
    x: STATION_FRAME.x + chair.x * STATION_FRAME.width,
    y: STATION_FRAME.y + chair.y * STATION_FRAME.height,
  };
}

export const STATION: Point = stationChairInWard(0);

export const GATES = [
  { y: 0.405, side: "left" as const, lane: 0.61, box: { left: 0.2921, top: 0.3401, width: 0.1663, height: 0.1470 } },
  { y: 0.57, side: "right" as const, lane: 0.39, box: { left: 0.5281, top: 0.4934, width: 0.1685, height: 0.1416 } },
  { y: 0.735, side: "left" as const, lane: 0.61, box: { left: 0.3146, top: 0.6608, width: 0.1629, height: 0.1630 } },
];

/** Bedside standing spots, taken from the green arrows on the supplied v2 staff path map. */
export const BED_ARRIVAL: Point[] = [
  { x: 0.236, y: 0.315 }, { x: 0.787, y: 0.315 },
  { x: 0.234, y: 0.62 }, { x: 0.785, y: 0.465 },
  { x: 0.243, y: 0.76 }, { x: 0.76, y: 0.76 },
  { x: 0.238, y: 0.92 }, { x: 0.763, y: 0.92 },
];

const DESK_TOP_Y = 0.13;
type NavNode = { p: Point; edges: number[] };
const NAV: NavNode[] = [];

function navAdd(p: Point) {
  NAV.push({ p, edges: [] });
  return NAV.length - 1;
}
function navLink(a: number, b: number) {
  NAV[a]?.edges.push(b);
  NAV[b]?.edges.push(a);
}
function navChain(...ids: number[]) {
  for (let i = 1; i < ids.length; i++) navLink(ids[i - 1] ?? 0, ids[i] ?? 0);
}

/* Staff walkways traced from the supplied v2 ward path map (red strokes). */
// Top loop around the back of the nurses' station, fed by the double doors.
const deskTopL = navAdd({ x: 0.24, y: DESK_TOP_Y });
const deskTopC = navAdd({ x: 0.5, y: DESK_TOP_Y });
const deskTopR = navAdd({ x: 0.74, y: DESK_TOP_Y });
const door = navAdd({ x: 0.44, y: 0.08 });
const sideL = navAdd({ x: 0.21, y: 0.21 });
const sideR = navAdd({ x: 0.79, y: 0.21 });
navChain(deskTopL, deskTopC, deskTopR);
navLink(door, deskTopC);
// Front lane below the desk, serving the top bays.
const frontL = navAdd(BED_ARRIVAL[0] ?? { x: 0.236, y: 0.315 });
const frontC = navAdd({ x: 0.485, y: 0.32 });
const frontC2 = navAdd({ x: 0.55, y: 0.32 });
const frontR = navAdd(BED_ARRIVAL[1] ?? { x: 0.787, y: 0.315 });
navChain(deskTopL, sideL, frontL, frontC, frontC2, frontR, sideR, deskTopR);
// Right branch down past the first curtain to bay 4.
const rightBranch = navAdd({ x: 0.56, y: 0.465 });
const bed3 = navAdd(BED_ARRIVAL[3] ?? { x: 0.785, y: 0.465 });
// Central spine.
const spine1 = navAdd({ x: 0.485, y: 0.465 });
const spine2 = navAdd({ x: 0.485, y: 0.62 });
const spine3 = navAdd({ x: 0.5, y: 0.76 });
const spine4 = navAdd({ x: 0.52, y: 0.92 });
navChain(frontC2, rightBranch, bed3);
navChain(frontC, spine1, spine2, spine3, spine4);
navLink(spine1, rightBranch);
// Side lanes to the remaining bays.
navLink(spine2, navAdd(BED_ARRIVAL[2] ?? { x: 0.234, y: 0.62 }));
navLink(spine3, navAdd(BED_ARRIVAL[4] ?? { x: 0.243, y: 0.76 }));
navLink(spine3, navAdd(BED_ARRIVAL[5] ?? { x: 0.76, y: 0.76 }));
navLink(spine4, navAdd(BED_ARRIVAL[6] ?? { x: 0.238, y: 0.92 }));
navLink(spine4, navAdd(BED_ARRIVAL[7] ?? { x: 0.763, y: 0.92 }));

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function nearestNavNode(p: Point) {
  let best = 0;
  let bestDistance = Infinity;
  NAV.forEach((node, i) => {
    const distance = dist(node.p, p);
    if (distance < bestDistance) { bestDistance = distance; best = i; }
  });
  return best;
}
function navPath(a: number, b: number): Point[] {
  const distances = NAV.map(() => Infinity);
  const previous = NAV.map(() => -1);
  const seen = NAV.map(() => false);
  distances[a] = 0;
  for (;;) {
    let current = -1;
    let currentDistance = Infinity;
    distances.forEach((distance, i) => {
      if (!seen[i] && distance < currentDistance) { currentDistance = distance; current = i; }
    });
    if (current === -1 || current === b) break;
    seen[current] = true;
    for (const edge of NAV[current]?.edges ?? []) {
      const nextDistance = currentDistance + dist(NAV[current]?.p ?? pFallback, NAV[edge]?.p ?? pFallback);
      if (nextDistance < (distances[edge] ?? Infinity)) {
        distances[edge] = nextDistance;
        previous[edge] = current;
      }
    }
  }
  const path: Point[] = [];
  let current = b;
  while (current !== -1) {
    const node = NAV[current];
    if (!node) break;
    path.unshift(node.p);
    if (current === a) break;
    current = previous[current] ?? -1;
  }
  return path;
}
const pFallback: Point = { x: 0.5, y: 0.5 };

export function routeTo(dest: Point, from: Point): Point[] {
  const atStation = (point: Point) => point.y < 0.3;
  const points: Point[] = [];
  const startNode = atStation(from)
    ? (points.push({ x: from.x, y: DESK_TOP_Y }), from.x < 0.5 ? deskTopL : deskTopR)
    : nearestNavNode(from);
  if (atStation(from)) points.push(NAV[startNode]?.p ?? from);
  const endNode = atStation(dest) ? (dest.x < 0.5 ? deskTopL : deskTopR) : nearestNavNode(dest);
  points.push(...navPath(startNode, endNode));
  if (atStation(dest)) points.push({ x: dest.x, y: DESK_TOP_Y });
  points.push(dest);

  const result: Point[] = [];
  for (const point of points) {
    const previous = result[result.length - 1] ?? from;
    if (Math.abs(previous.x - point.x) < 0.004 && Math.abs(previous.y - point.y) < 0.004) continue;
    const before = result[result.length - 2] ?? from;
    if (result.length && Math.abs(before.x - previous.x) < 0.004 && Math.abs(previous.x - point.x) < 0.004) result.pop();
    else if (result.length && Math.abs(before.y - previous.y) < 0.004 && Math.abs(previous.y - point.y) < 0.004) result.pop();
    result.push(point);
  }
  return result;
}

export const msPerUnit = (upgrades: Upgrades) => Math.max(620, 1500 - upgrades.speed * 230);
