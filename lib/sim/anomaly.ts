/**
 * ILLUSTRATIVE SIMULATION of leave-one-vehicle-out anomaly scoring
 *   A_{i,t} = −log P(Z_{i,t} | Z_{−i,1:t})
 * on a single shared region observed by three vehicles. V3 is the vehicle
 * under test; in "attack" episodes it reports a fabricated "occupied" reading
 * for a contiguous window of frames. Nothing here is a measurement of T-CAD.
 *
 * The scenario deliberately includes the cases that make detection hard:
 *  - benign sensor faults (V1 glitches)       → false positives
 *  - occlusion / missing data                 → no evidence for either side
 *  - a genuine object arriving while two vehicles are occluded → the honest
 *    first observer contradicts the temporal prior (a temporal-model FP mode)
 */
import { createRng } from "./random";
import {
  filterStep,
  predictiveProbability,
  symmetricSensor,
  type Observation,
  type TransitionModel,
} from "./hmm";

export const episodeLength = 60;
export const vehicleCount = 3;
export const suspectIndex = 2; // V3

export type ScoringMode = "perFrame" | "temporal";

export interface AnomalyParams {
  reliability: number; // honest sensor accuracy (model assumes the same value)
  missingRate: number; // independent per-frame dropout
  transition: TransitionModel;
}

export interface Episode {
  truth: boolean[]; // true = occupied
  obs: Observation[][]; // [vehicle][t]
  attackFrames: boolean[]; // frames where V3 fabricates
  attackStart: number | null;
  arrivalStart: number | null;
  glitchFrames: boolean[]; // frames where V1 has a benign fault
}

interface EpisodeShape {
  attackStart: number | null;
  attackLength: number;
  arrivalStart: number | null;
  arrivalLength: number;
  glitchStart: number | null;
}

function generateEpisode(seed: number, params: AnomalyParams, shape: EpisodeShape): Episode {
  const rng = createRng(seed);
  const T = episodeLength;
  const truth = Array.from({ length: T }, (_, t) =>
    shape.arrivalStart !== null && t >= shape.arrivalStart && t < shape.arrivalStart + shape.arrivalLength,
  );
  const attackFrames = Array.from({ length: T }, (_, t) =>
    shape.attackStart !== null && t >= shape.attackStart && t < shape.attackStart + shape.attackLength,
  );
  const glitchFrames = Array.from({ length: T }, (_, t) =>
    shape.glitchStart !== null && t >= shape.glitchStart && t < shape.glitchStart + 2,
  );
  const obs: Observation[][] = [];
  for (let v = 0; v < vehicleCount; v++) {
    const row: Observation[] = [];
    for (let t = 0; t < T; t++) {
      // Two vehicles are occluded during the first 3 frames of a genuine arrival:
      // only V2 sees the new object at first.
      const occludedAtArrival =
        shape.arrivalStart !== null && v !== 1 && t >= shape.arrivalStart && t < shape.arrivalStart + 3;
      if (occludedAtArrival || rng.bernoulli(params.missingRate)) {
        row.push("none");
        continue;
      }
      if (v === suspectIndex && attackFrames[t]) {
        row.push("occ"); // fabricated report (conceptual; no mechanism modeled)
        continue;
      }
      if (v === 0 && glitchFrames[t]) {
        row.push(truth[t] ? "free" : "occ"); // benign fault: wrong reading
        continue;
      }
      const correct = rng.bernoulli(params.reliability);
      row.push(correct === truth[t] ? "occ" : "free");
    }
    obs.push(row);
  }
  return { truth, obs, attackFrames, attackStart: shape.attackStart, arrivalStart: shape.arrivalStart, glitchFrames };
}

/** The fixed episode shown on screen: glitch, attack, then a genuine arrival. */
export function showcaseEpisode(params: AnomalyParams, seed = 7): Episode {
  return generateEpisode(seed, params, {
    attackStart: 16,
    attackLength: 12,
    arrivalStart: 41,
    arrivalLength: 9,
    glitchStart: 7,
  });
}

function randomEpisode(seed: number, params: AnomalyParams, withAttack: boolean): Episode {
  const rng = createRng(seed * 7919 + 13);
  const arrival = rng.bernoulli(0.6) ? rng.int(38, 48) : null;
  return generateEpisode(seed, params, {
    attackStart: withAttack ? rng.int(6, 22) : null,
    attackLength: rng.int(8, 14),
    arrivalStart: arrival,
    arrivalLength: rng.int(6, 10),
    glitchStart: rng.bernoulli(0.35) ? rng.int(2, 36) : null,
  });
}

export interface ScoreTrace {
  score: (number | null)[][]; // [vehicle][t]; null when the vehicle reported nothing
  belief: number[][]; // leave-one-out P(Occ | Z_{-i}) per vehicle
  fused: number[]; // all-vehicle filtered P(Occ)
}

/** Compute A_{i,t} for every vehicle and frame. */
export function scoreEpisode(ep: Episode, params: AnomalyParams, mode: ScoringMode): ScoreTrace {
  const sensor = symmetricSensor(params.reliability);
  const T = episodeLength;
  const score: (number | null)[][] = [];
  const belief: number[][] = [];
  for (let i = 0; i < vehicleCount; i++) {
    let b = 0.5;
    const s: (number | null)[] = [];
    const bs: number[] = [];
    for (let t = 0; t < T; t++) {
      const others = ep.obs
        .map((row, v) => ({ z: row[t], sensor, v }))
        .filter((o) => o.v !== i);
      // perFrame: memoryless (uniform prior each frame, like a single-frame check);
      // temporal: HMM forward filter over Z_{-i,1:t}.
      const prior = mode === "temporal" ? b : 0.5;
      const step =
        mode === "temporal"
          ? filterStep(prior, others, params.transition)
          : filterStep(0.5, others, { pFreeToOcc: 0.5, pOccToFree: 0.5 });
      b = step.posterior;
      bs.push(b);
      const z = ep.obs[i][t];
      s.push(z === "none" ? null : -Math.log(Math.max(1e-9, predictiveProbability(z, b, sensor))));
    }
    score.push(s);
    belief.push(bs);
  }
  // Fused (all vehicles) temporal belief for display.
  const fused: number[] = [];
  let f = 0.5;
  for (let t = 0; t < T; t++) {
    f = filterStep(
      mode === "temporal" ? f : 0.5,
      ep.obs.map((row) => ({ z: row[t], sensor })),
      mode === "temporal" ? params.transition : { pFreeToOcc: 0.5, pOccToFree: 0.5 },
    ).posterior;
    fused.push(f);
  }
  return { score, belief, fused };
}

/** Alarm when score > threshold for `persistence` consecutive reported frames. */
export function alarms(scores: (number | null)[], threshold: number, persistence: number): boolean[] {
  const out: boolean[] = [];
  let run = 0;
  for (const s of scores) {
    if (s === null) {
      out.push(false); // no report → no evidence; run is kept, not reset
      continue;
    }
    run = s > threshold ? run + 1 : 0;
    out.push(run >= persistence);
  }
  return out;
}

export interface MonteCarloSummary {
  tpr: number;
  fpr: number;
  episodeDetection: number;
  medianDelay: number | null;
  roc: { fpr: number; tpr: number; threshold: number }[];
  attackFrameCount: number;
  benignFrameCount: number;
}

interface ScoredEpisode {
  ep: Episode;
  trace: ScoreTrace;
}

const cache = new Map<string, ScoredEpisode[]>();

function scoredEpisodes(params: AnomalyParams, mode: ScoringMode, count: number): ScoredEpisode[] {
  const key = JSON.stringify([params, mode, count]);
  const hit = cache.get(key);
  if (hit) return hit;
  const list: ScoredEpisode[] = [];
  for (let k = 0; k < count; k++) {
    const ep = randomEpisode(1000 + k, params, k % 2 === 0);
    list.push({ ep, trace: scoreEpisode(ep, params, mode) });
  }
  if (cache.size > 24) cache.clear();
  cache.set(key, list);
  return list;
}

/** Frame-level TPR/FPR, episode detection and delay over synthetic episodes. */
export function monteCarlo(
  params: AnomalyParams,
  mode: ScoringMode,
  threshold: number,
  persistence: number,
  count = 300,
): MonteCarloSummary {
  const episodes = scoredEpisodes(params, mode, count);
  let tp = 0,
    fn = 0,
    fp = 0,
    tn = 0,
    attackEpisodes = 0,
    detectedEpisodes = 0;
  const delays: number[] = [];
  const attackScores: number[] = [];
  const benignScores: number[] = [];

  for (const { ep, trace } of episodes) {
    if (ep.attackStart !== null) attackEpisodes++;
    let detectedAt: number | null = null;
    for (let v = 0; v < vehicleCount; v++) {
      const alarm = alarms(trace.score[v], threshold, persistence);
      for (let t = 0; t < episodeLength; t++) {
        const s = trace.score[v][t];
        if (s === null) continue;
        const isAttack = v === suspectIndex && ep.attackFrames[t];
        if (isAttack) {
          attackScores.push(s);
          if (alarm[t]) {
            tp++;
            if (detectedAt === null) detectedAt = t;
          } else fn++;
        } else {
          benignScores.push(s);
          if (alarm[t]) fp++;
          else tn++;
        }
      }
    }
    if (ep.attackStart !== null && detectedAt !== null) {
      detectedEpisodes++;
      delays.push(detectedAt - ep.attackStart);
    }
  }

  // ROC over the raw per-frame score (persistence = 1).
  const thresholds = Array.from(new Set([...attackScores, ...benignScores].map((s) => +s.toFixed(3)))).sort(
    (a, b) => b - a,
  );
  const roc = [{ fpr: 0, tpr: 0, threshold: Infinity }];
  for (const th of thresholds) {
    const tprAt = attackScores.filter((s) => s >= th).length / Math.max(1, attackScores.length);
    const fprAt = benignScores.filter((s) => s >= th).length / Math.max(1, benignScores.length);
    roc.push({ fpr: fprAt, tpr: tprAt, threshold: th });
  }
  roc.push({ fpr: 1, tpr: 1, threshold: -Infinity });

  delays.sort((a, b) => a - b);
  return {
    tpr: tp / Math.max(1, tp + fn),
    fpr: fp / Math.max(1, fp + tn),
    episodeDetection: detectedEpisodes / Math.max(1, attackEpisodes),
    medianDelay: delays.length ? delays[Math.floor(delays.length / 2)] : null,
    roc,
    attackFrameCount: tp + fn,
    benignFrameCount: fp + tn,
  };
}
