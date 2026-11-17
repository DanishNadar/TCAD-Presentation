/**
 * ILLUSTRATIVE ego-centric occupancy grid with a per-cell two-state HMM.
 * Separates three things that are easy to conflate:
 *   truth[c]   hidden physical state (never available to the vehicle)
 *   obs[c]     this frame's observation: occ | free | none (occluded / dropped)
 *   belief[c]  P(X_t = Occ | Z_1:t) from the forward filter
 * The *assumed* sensor reliability used by the filter can differ from the
 * *actual* noise — that mismatch is what miscalibration looks like.
 */
import { createRng, type Rng } from "./random";
import { filterStep, symmetricSensor, type Observation } from "./hmm";

export const occW = 40;
export const occH = 24;
const sensorRangeCells = 22;
const egoCell = { x: 6, y: 12 };

export interface OccupancyParams {
  noise: number; // actual probability a visible cell is mis-read
  missing: number; // actual per-cell dropout probability
  assumedReliability: number; // filter's P(correct reading)
  occlusion: number; // 0–3 parked trucks near the ego
  pFreeToOcc: number;
  pOccToFree: number;
}

const staticBlocks = [
  { x: 16, y: 0, w: 6, h: 8 },
  { x: 26, y: 17, w: 8, h: 7 },
];
const trucks = [
  { x: 9, y: 15, w: 5, h: 2 },
  { x: 10, y: 8, w: 6, h: 2 },
  { x: 14, y: 12, w: 2, h: 3 },
];
const lanes = [
  { y: 10, dir: 1, speed: 9, phase: 0 },
  { y: 10, dir: 1, speed: 9, phase: 21 },
  { y: 13, dir: -1, speed: 7, phase: 6 },
  { y: 13, dir: -1, speed: 7, phase: 27 },
];

export class OccupancySim {
  truth = new Uint8Array(occW * occH);
  obs: Observation[] = new Array(occW * occH).fill("none");
  belief = new Float32Array(occW * occH).fill(0.5);
  lastSeen = new Int32Array(occW * occH).fill(-1);
  frame = 0;
  ece = 0;
  private rng: Rng;

  constructor(seed = 3) {
    this.rng = createRng(seed);
  }

  reset() {
    this.belief.fill(0.5);
    this.lastSeen.fill(-1);
    this.frame = 0;
    this.ece = 0;
  }

  private computeTruth(time: number, p: OccupancyParams) {
    const t = this.truth;
    t.fill(0);
    const fill = (b: { x: number; y: number; w: number; h: number }) => {
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (x >= 0 && x < occW && y >= 0 && y < occH) t[y * occW + x] = 1;
    };
    staticBlocks.forEach(fill);
    trucks.slice(0, Math.round(p.occlusion)).forEach(fill);
    const loop = occW + 10;
    for (const l of lanes) {
      const pos = (((l.phase + l.dir * l.speed * time) % loop) + loop) % loop - 5;
      fill({ x: Math.round(pos), y: l.y, w: 4, h: 2 });
    }
  }

  private visible(cx: number, cy: number): boolean {
    const dx = cx - egoCell.x;
    const dy = cy - egoCell.y;
    const dist = Math.hypot(dx, dy);
    if (dist > sensorRangeCells) return false;
    const steps = Math.ceil(dist * 2);
    for (let s = 1; s < steps; s++) {
      const x = Math.round(egoCell.x + (dx * s) / steps);
      const y = Math.round(egoCell.y + (dy * s) / steps);
      if (x === cx && y === cy) continue;
      if (this.truth[y * occW + x]) return false;
    }
    return true;
  }

  step(time: number, p: OccupancyParams) {
    this.frame++;
    this.computeTruth(time, p);
    const sensor = symmetricSensor(p.assumedReliability);
    const transition = { pFreeToOcc: p.pFreeToOcc, pOccToFree: p.pOccToFree };
    const bins = Array.from({ length: 10 }, () => ({ n: 0, conf: 0, acc: 0 }));
    for (let y = 0; y < occH; y++) {
      for (let x = 0; x < occW; x++) {
        const c = y * occW + x;
        let z: Observation = "none";
        if (!(x === egoCell.x && y === egoCell.y) && this.visible(x, y) && !this.rng.bernoulli(p.missing)) {
          const truthOcc = this.truth[c] === 1;
          const flipped = this.rng.bernoulli(p.noise);
          z = truthOcc !== flipped ? "occ" : "free";
          this.lastSeen[c] = this.frame;
        }
        this.obs[c] = z;
        this.belief[c] = filterStep(this.belief[c], [{ z, sensor }], transition).posterior;
        // Calibration bins over cells observed at least once
        if (this.lastSeen[c] >= 0) {
          const b = Math.min(9, Math.floor(this.belief[c] * 10));
          bins[b].n++;
          bins[b].conf += this.belief[c];
          bins[b].acc += this.truth[c];
        }
      }
    }
    const total = bins.reduce((s, b) => s + b.n, 0) || 1;
    const ece = bins.reduce((s, b) => (b.n ? s + (b.n / total) * Math.abs(b.acc / b.n - b.conf / b.n) : s), 0);
    this.ece = this.frame < 3 ? ece : 0.85 * this.ece + 0.15 * ece;
  }

  get ego() {
    return egoCell;
  }
}
