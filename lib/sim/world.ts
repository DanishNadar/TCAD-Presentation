/**
 * The persistent "world" shared by Scenes 1, 2, 3 and 14: one urban
 * intersection, deterministic in time, measured in meters.
 * Everything is a teaching illustration; geometry is simplified to 2D footprints.
 */

export const worldWidth = 160;
export const worldHeight = 90;
export const sensorRange = 50; // CAD's occupancy maps cover ~50 m (Zhang et al. §5)
export const loopPeriod = 20; // seconds

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Building extends Rect {
  height: number;
}

export const roads = {
  vertical: { x: 72, w: 16 },
  horizontal: { y: 37, h: 16 },
};

export const buildings: Building[] = [
  { x: 6, y: 4, w: 58, h: 28, height: 26 },
  { x: 96, y: 4, w: 30, h: 28, height: 40 },
  { x: 130, y: 4, w: 26, h: 28, height: 18 },
  { x: 6, y: 56, w: 34, h: 30, height: 30 },
  { x: 42, y: 56, w: 22, h: 30, height: 46 },
  { x: 96, y: 58, w: 58, h: 28, height: 22 },
];

export type AgentRole = "ego" | "cav" | "hidden" | "parked" | "pedestrian";

export interface Agent {
  id: string;
  label: string;
  role: AgentRole;
  x: number; // center
  y: number;
  heading: number; // radians, 0 = +x (east)
  length: number;
  width: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Ego: approaches, waits at the stop line, then proceeds north. */
function egoPose(t: number) {
  const p = mod(t, loopPeriod);
  let y: number;
  if (p < 8) y = 98 - (98 - 62) * (1 - Math.pow(1 - p / 8, 2));
  else if (p < 14) y = 62;
  else y = 62 - (62 + 12) * easeInOut((p - 14) / 6);
  return { x: 84, y, heading: -Math.PI / 2 };
}

export function agentsAt(t: number): Agent[] {
  const p = mod(t, loopPeriod);
  const ego = egoPose(t);
  return [
    { id: "ego", label: "EGO", role: "ego", ...ego, length: 4.8, width: 2.1 },
    // CAV-B westbound, upper lane of the horizontal road
    { id: "cavB", label: "CAV-B", role: "cav", x: 172 - 9.2 * p, y: 41, heading: Math.PI, length: 4.8, width: 2.1 },
    // CAV-C southbound, left lane of the vertical road
    { id: "cavC", label: "CAV-C", role: "cav", x: 76, y: -12 + 7.2 * mod(p + 4, loopPeriod), heading: Math.PI / 2, length: 4.8, width: 2.1 },
    // Hidden vehicle approaching from the west, occluded from ego by the SW block
    { id: "hidden", label: "occluded vehicle", role: "hidden", x: -14 + 12.8 * mod(p - 6, loopPeriod), y: 49, heading: 0, length: 4.6, width: 2.0 },
    // Pedestrian crossing on the north crosswalk
    { id: "ped", label: "pedestrian", role: "pedestrian", x: 70 + 1.1 * mod(p, loopPeriod), y: 34.5, heading: 0, length: 0.8, width: 0.8 },
    // Parked vehicles along the curbs (static occluders)
    { id: "parked1", label: "parked", role: "parked", x: 66.5, y: 66, heading: Math.PI / 2, length: 5.2, width: 2.2 },
    { id: "parked2", label: "parked", role: "parked", x: 93.5, y: 22, heading: Math.PI / 2, length: 7.5, width: 2.5 },
  ];
}

/** Fabricated "ghost" object for Scene 3 — a conceptual, synthetic illustration. */
export const ghostObject: Agent = {
  id: "ghost",
  label: "fabricated object",
  role: "cav",
  x: 84,
  y: 47,
  heading: -Math.PI / 2,
  length: 4.6,
  width: 2.0,
};

// ----------------------------------------------------------------------------
// Geometry: oriented-box corners, segments, ray casting
// ----------------------------------------------------------------------------
export type Vec = { x: number; y: number };
type Segment = [Vec, Vec];

export function agentCorners(a: Agent): Vec[] {
  const c = Math.cos(a.heading);
  const s = Math.sin(a.heading);
  const hl = a.length / 2;
  const hw = a.width / 2;
  return [
    [hl, hw],
    [hl, -hw],
    [-hl, -hw],
    [-hl, hw],
  ].map(([lx, ly]) => ({ x: a.x + lx * c - ly * s, y: a.y + lx * s + ly * c }));
}

const rectCorners = (r: Rect): Vec[] => [
  { x: r.x, y: r.y },
  { x: r.x + r.w, y: r.y },
  { x: r.x + r.w, y: r.y + r.h },
  { x: r.x, y: r.y + r.h },
];

const polySegments = (poly: Vec[]): Segment[] => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);

export function obstacleSegments(agents: Agent[], excludeIds: string[]): Segment[] {
  const segs: Segment[] = [];
  for (const b of buildings) segs.push(...polySegments(rectCorners(b)));
  for (const a of agents) {
    if (excludeIds.includes(a.id) || a.role === "pedestrian") continue;
    segs.push(...polySegments(agentCorners(a)));
  }
  return segs;
}

/** Distance along a ray to the first segment hit (or Infinity). */
function raySegment(o: Vec, dx: number, dy: number, [a, b]: Segment): number {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return Infinity;
  const t = ((a.x - o.x) * ey - (a.y - o.y) * ex) / den;
  const u = ((a.x - o.x) * dy - (a.y - o.y) * dx) / den;
  return t > 1e-6 && u >= 0 && u <= 1 ? t : Infinity;
}

export interface VisibilityResult {
  polygon: Vec[];
  hits: { p: Vec; hit: boolean }[];
}

/** Visibility polygon by casting `rayCount` rays out to `range`. */
export function visibility(origin: Vec, segments: Segment[], range = sensorRange, rayCount = 240): VisibilityResult {
  const polygon: Vec[] = [];
  const hits: { p: Vec; hit: boolean }[] = [];
  for (let k = 0; k < rayCount; k++) {
    const ang = (k / rayCount) * Math.PI * 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let best = range;
    for (const seg of segments) {
      const d = raySegment(origin, dx, dy, seg);
      if (d < best) best = d;
    }
    const p = { x: origin.x + dx * best, y: origin.y + dy * best };
    polygon.push(p);
    hits.push({ p, hit: best < range });
  }
  return { polygon, hits };
}

/** True if any corner/center of `target` is in line of sight and in range of `observer`. */
export function canSee(observer: Agent, target: Agent, agents: Agent[], range = sensorRange): boolean {
  const segs = obstacleSegments(agents, [observer.id, target.id]);
  const pts = [{ x: target.x, y: target.y }, ...agentCorners(target)];
  return pts.some((p) => {
    const dx = p.x - observer.x;
    const dy = p.y - observer.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;
    const ux = dx / dist;
    const uy = dy / dist;
    return !segs.some((s) => raySegment(observer, ux, uy, s) < dist - 0.05);
  });
}

export function pointInPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y,
      xj = poly[j].x,
      yj = poly[j].y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
