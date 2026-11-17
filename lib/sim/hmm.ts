/**
 * Two-state HMM for a single spatial region.
 *   Hidden state  X_t ∈ {Free, Occupied}
 *   Observation   Z_t ∈ {occ, free, none}
 *
 * "none" = no observation available (occluded / out of range / dropped packet).
 * It is NOT a third physical state: under a missing-at-random assumption its
 * likelihood is identical under both states, so it leaves the belief to the
 * transition prediction alone. (If missingness depends on the state — e.g. an
 * attacker hides exactly where objects are — this assumption breaks.)
 */

export type Observation = "occ" | "free" | "none";

export interface TransitionModel {
  /** P(X_t = Occ | X_{t-1} = Free) */
  pFreeToOcc: number;
  /** P(X_t = Free | X_{t-1} = Occ) */
  pOccToFree: number;
}

export interface SensorModel {
  /** P(Z = occ | X = Occ) — detection probability */
  hitRate: number;
  /** P(Z = occ | X = Free) — false alarm probability */
  falseAlarmRate: number;
}

/** Symmetric sensor: reliability r means P(correct reading) = r for both states. */
export const symmetricSensor = (reliability: number): SensorModel => ({
  hitRate: reliability,
  falseAlarmRate: 1 - reliability,
});

/** Likelihood pair [P(z | Occ), P(z | Free)]. */
export function likelihood(z: Observation, sensor: SensorModel): [number, number] {
  if (z === "none") return [1, 1];
  if (z === "occ") return [sensor.hitRate, sensor.falseAlarmRate];
  return [1 - sensor.hitRate, 1 - sensor.falseAlarmRate];
}

/** Prediction step: Σ_{x_{t-1}} P(X_t = Occ | x_{t-1}) P(x_{t-1} | Z_{1:t-1}). */
export function predict(pOccPrev: number, transition: TransitionModel): number {
  return pOccPrev * (1 - transition.pOccToFree) + (1 - pOccPrev) * transition.pFreeToOcc;
}

export interface WeightedObservation {
  z: Observation;
  sensor: SensorModel;
  /** Exponent on the likelihood (1 = independent source; <1 tempers correlated sources). */
  weight?: number;
}

export interface FilterStepTrace {
  prior: number; // P(X_{t-1}=Occ | Z_{1:t-1})
  predicted: number; // P(X_t=Occ | Z_{1:t-1})
  likeOcc: number; // Π P(Z_i,t | Occ)^w_i
  likeFree: number; // Π P(Z_i,t | Free)^w_i
  unnormOcc: number;
  unnormFree: number;
  posterior: number; // P(X_t=Occ | Z_{1:t})
}

/** Full forward-filter step with a trace of every intermediate term (used by Scene 9). */
export function filterStep(
  pOccPrev: number,
  observations: WeightedObservation[],
  transition: TransitionModel,
): FilterStepTrace {
  const predicted = predict(pOccPrev, transition);
  let likeOcc = 1;
  let likeFree = 1;
  for (const { z, sensor, weight = 1 } of observations) {
    const [lo, lf] = likelihood(z, sensor);
    likeOcc *= Math.pow(lo, weight);
    likeFree *= Math.pow(lf, weight);
  }
  const unnormOcc = likeOcc * predicted;
  const unnormFree = likeFree * (1 - predicted);
  const total = unnormOcc + unnormFree;
  const posterior = total > 0 ? unnormOcc / total : predicted;
  return { prior: pOccPrev, predicted, likeOcc, likeFree, unnormOcc, unnormFree, posterior };
}

/** Predictive probability of a new observation given a belief: Σ_x P(z | x) P(x). */
export function predictiveProbability(z: Observation, pOcc: number, sensor: SensorModel): number {
  const [lo, lf] = likelihood(z, sensor);
  return lo * pOcc + lf * (1 - pOcc);
}

export const logit = (p: number) => Math.log(p / (1 - p));
export const sigmoid = (l: number) => 1 / (1 + Math.exp(-l));
