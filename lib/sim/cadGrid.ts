/**
 * Grid rendition of CAD's consistency checks (Zhang et al. 2024, §5.4, Eq. 5–7).
 * Sets are represented as sets of cell indices. ILLUSTRATIVE: real CAD uses
 * polygonal regions (convex hulls of clustered LiDAR points, sector free space).
 *
 *   ε_occ    = ∪_{i,j} S_O^(i) ∩ S_F^(j)                              (Eq. 5)
 *   S'_O     = S_O^(0) ∪ (∪_{i≥1} S_O^(i) − ε_occ − S_F^(0))          (Eq. 6)
 *   S'_F     = S_F^(0) ∪ (∪_{i≥1} S_F^(i) − ε_occ − S_O^(0))
 *   ε_spoof  = ∪_{y∈Y} y ∩ S'_F                                        (Eq. 7)
 *   ε_remove = ∪_{s∈S'_O} s − Y
 * Conflict components with area < σ are ignored.
 */

export const gridW = 22;
export const gridH = 14;
export const cellMeters = 2; // each cell = 2 m × 2 m = 4 m²
const range = 11; // cells (≈ 22 m in this toy)

export type CellSet = Set<number>;
export const idx = (x: number, y: number) => y * gridW + x;
export const cellXY = (i: number) => ({ x: i % gridW, y: Math.floor(i / gridW) });

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Static background (removed via HD map in CAD — occludes but is not "occupied"). */
export const buildingsGrid: Box[] = [
  { id: "bldg1", x: 6, y: 0, w: 5, h: 5 },
  { id: "bldg2", x: 12, y: 8, w: 4, h: 6 },
];

export const objects: Box[] = [
  { id: "A", x: 4, y: 6, w: 2, h: 1 }, // car visible to EGO
  { id: "B", x: 13, y: 5, w: 2, h: 1 }, // car hidden from EGO by bldg2? (seen by V2)
];
export const ghostBox: Box = { id: "G", x: 8, y: 9, w: 2, h: 1 }; // truly free region

export interface Vehicle {
  id: string;
  label: string;
  x: number;
  y: number;
  role: "ego" | "benign" | "attacker";
}

export const vehicles: Vehicle[] = [
  { id: "v0", label: "EGO (i=0)", x: 2, y: 10, role: "ego" },
  { id: "v1", label: "CAV-1 (i=1)", x: 19, y: 3, role: "benign" },
  { id: "v2", label: "CAV-2 (i=2)", x: 19, y: 11, role: "attacker" },
];

export type Scenario = "benign" | "spoof" | "remove";

const boxCells = (b: Box): number[] => {
  const out: number[] = [];
  for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) out.push(idx(x, y));
  return out;
};

const backgroundCells = new Set(buildingsGrid.flatMap(boxCells));
const objectCells = new Set(objects.flatMap(boxCells));

/** Honest occupancy map by sampling a line of sight to every cell. */
function honestMap(v: Vehicle): { occ: CellSet; free: CellSet } {
  const occ: CellSet = new Set();
  const free: CellSet = new Set();
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const i = idx(x, y);
      if (backgroundCells.has(i)) continue;
      const dx = x - v.x;
      const dy = y - v.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range) continue;
      const steps = Math.ceil(dist * 3);
      let blocked = false;
      for (let s = 1; s < steps; s++) {
        const cx = Math.round(v.x + (dx * s) / steps);
        const cy = Math.round(v.y + (dy * s) / steps);
        const ci = idx(cx, cy);
        if (ci === i || (cx === v.x && cy === v.y)) continue;
        if (backgroundCells.has(ci) || objectCells.has(ci)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      (objectCells.has(i) ? occ : free).add(i);
    }
  }
  return { occ, free };
}

export interface CadResult {
  maps: { occ: CellSet; free: CellSet }[];
  epsOcc: CellSet;
  mergedOcc: CellSet;
  mergedFree: CellSet;
  predictedBoxes: Box[];
  epsSpoof: CellSet;
  epsRemove: CellSet;
  /** Components (connected cell groups) and whether they pass σ. */
  components: { kind: "occ" | "spoof" | "remove"; cells: number[]; flagged: boolean }[];
  background: CellSet;
  truthObjects: CellSet;
}

const union = (...sets: CellSet[]) => new Set(sets.flatMap((s) => [...s]));
const minus = (a: CellSet, ...bs: CellSet[]) => new Set([...a].filter((x) => !bs.some((b) => b.has(x))));
const intersect = (a: CellSet, b: CellSet) => new Set([...a].filter((x) => b.has(x)));

function components(cells: CellSet): number[][] {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (const start of cells) {
    if (seen.has(start)) continue;
    const comp: number[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const c = stack.pop()!;
      comp.push(c);
      const { x, y } = cellXY(c);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue;
        const n = idx(nx, ny);
        if (cells.has(n) && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    out.push(comp);
  }
  return out;
}

export function runCad(scenario: Scenario, sigmaCells: number, benignNoise: boolean): CadResult {
  const maps = vehicles.map(honestMap);

  // Benign sensor noise: CAV-1 wrongly reports one cell occupied in EGO's free space.
  if (benignNoise) {
    const noisy = idx(11, 7);
    maps[1].occ.add(noisy);
    maps[1].free.delete(noisy);
  }

  const ghost = boxCells(ghostBox);
  const removedCells = boxCells(objects[1]);
  if (scenario === "spoof") {
    // Attacker's shared map is made consistent with its fabricated object.
    ghost.forEach((c) => {
      maps[2].occ.add(c);
      maps[2].free.delete(c);
    });
  }
  // Removal: the attacker suppresses object B in the fused perception output Y,
  // but (non-adaptively) shares its honest occupancy map.
  void removedCells;

  // Eq. 5
  const epsOcc: CellSet = new Set();
  maps.forEach((mi, i) =>
    maps.forEach((mj, j) => {
      if (i !== j) intersect(mi.occ, mj.free).forEach((c) => epsOcc.add(c));
    }),
  );
  // Eq. 6
  const remoteOcc = union(...maps.slice(1).map((m) => m.occ));
  const remoteFree = union(...maps.slice(1).map((m) => m.free));
  const mergedOcc = union(maps[0].occ, minus(remoteOcc, epsOcc, maps[0].free));
  const mergedFree = union(maps[0].free, minus(remoteFree, epsOcc, maps[0].occ));

  // Victim's perception output Y (after fusion with attacker's data)
  const predictedBoxes: Box[] = [objects[0]];
  if (scenario !== "remove") predictedBoxes.push(objects[1]);
  if (scenario === "spoof") predictedBoxes.push(ghostBox);
  const yCells = new Set(predictedBoxes.flatMap(boxCells));

  // Eq. 7
  const epsSpoof = intersect(yCells, mergedFree);
  const epsRemove = minus(mergedOcc, yCells);

  const comps = [
    ...components(epsOcc).map((cells) => ({ kind: "occ" as const, cells })),
    ...components(epsSpoof).map((cells) => ({ kind: "spoof" as const, cells })),
    ...components(epsRemove).map((cells) => ({ kind: "remove" as const, cells })),
  ].map((c) => ({ ...c, flagged: c.cells.length >= sigmaCells }));

  return {
    maps,
    epsOcc,
    mergedOcc,
    mergedFree,
    predictedBoxes,
    epsSpoof,
    epsRemove,
    components: comps,
    background: backgroundCells,
    truthObjects: objectCells,
  };
}
