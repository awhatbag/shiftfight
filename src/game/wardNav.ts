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

export const BED_ARRIVAL: Point[] = [
  { x: 0.24, y: 0.33 }, { x: 0.79, y: 0.33 },
  { x: 0.23, y: 0.6 }, { x: 0.79, y: 0.5 },
  { x: 0.24, y: 0.77 }, { x: 0.76, y: 0.75 },
  { x: 0.24, y: 0.92 }, { x: 0.76, y: 0.92 },
];

const LANE_Y = [0.33, 0.46, 0.628, 0.7875, 0.94];
const LANE_X = [0.24, 0.5, 0.79];
const DESK_TOP_Y = 0.14;
const SIDE_X = [0.16, 0.84];
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

const laneNode: number[][] = LANE_Y.map((y) => LANE_X.map((x) => navAdd({ x, y })));
LANE_Y.forEach((_, r) => {
  navLink(laneNode[r]?.[0] ?? 0, laneNode[r]?.[1] ?? 0);
  navLink(laneNode[r]?.[1] ?? 0, laneNode[r]?.[2] ?? 0);
  if (r > 0) navLink(laneNode[r - 1]?.[1] ?? 0, laneNode[r]?.[1] ?? 0);
});

const deskTopL = navAdd({ x: SIDE_X[0] ?? 0.16, y: DESK_TOP_Y });
const deskTopR = navAdd({ x: SIDE_X[1] ?? 0.84, y: DESK_TOP_Y });
const deskTopC = navAdd({ x: 0.5, y: DESK_TOP_Y });
const outL = navAdd({ x: SIDE_X[0] ?? 0.16, y: LANE_Y[0] ?? 0.33 });
const outR = navAdd({ x: SIDE_X[1] ?? 0.84, y: LANE_Y[0] ?? 0.33 });
navLink(deskTopL, deskTopC); navLink(deskTopC, deskTopR);
navLink(deskTopL, outL); navLink(deskTopR, outR);
navLink(outL, laneNode[0]?.[0] ?? 0); navLink(outR, laneNode[0]?.[2] ?? 0);

BED_ARRIVAL.forEach((p, i) => {
  const id = navAdd(p);
  const lane = [0, 0, 2, 1, 3, 3, 4, 4][i] ?? 0;
  const col = i % 2 === 0 ? 0 : 2;
  const anchor = laneNode[lane]?.[col] ?? 0;
  if (anchor !== id) navLink(id, anchor);
});

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
