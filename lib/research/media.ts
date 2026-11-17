/**
 * Catalog of recorded simulator videos (public/videos) and measured figures
 * (public/figures). Videos were rendered with the T-CAD repository's own
 * scripts/replayExperiment.py --exportVideo from traces recorded by
 * scripts/runHeadless.py (seed 42, calibrated observation model, validation
 * thresholds). Re-running the camelCase code draws different random numbers
 * than the stored experiment, so these clips are demonstrations, not the test runs.
 */
export const assetPath = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${p}`;

export type VideoId =
  | "occlusionWorld"
  | "occlusionLidar"
  | "contradictoryCad"
  | "contradictoryTcad"
  | "contradictoryGt"
  | "contradictoryBayes"
  | "contradictoryOccupancy"
  | "transientHmm"
  | "correlatedBayes";

interface VideoEntry {
  file: string;
  poster: string;
  title: string;
  scenario: string;
  view: string;
  source: string;
}

const src = (scenario: string, view: string, interval: string) =>
  `T-CAD simulator replay · scenario ${scenario} · seed 42 · view “${view}” · ${interval} · scripts/replayExperiment.py`;

export const videoCatalog: Record<VideoId, VideoEntry> = {
  occlusionWorld: {
    file: "occlusion-world.mp4",
    poster: "occlusion-world.jpg",
    title: "Occlusion: trf00 is hidden from cav00 by the NE building but visible to cav01",
    scenario: "B occlusion",
    view: "world",
    source: src("B (occlusion)", "1 world", "0–9 s"),
  },
  occlusionLidar: {
    file: "occlusion-lidar.mp4",
    poster: "occlusion-lidar.jpg",
    title: "Every CAV's 2-D LiDAR rays and returns at the same instants",
    scenario: "B occlusion",
    view: "lidar",
    source: src("B (occlusion)", "3 LiDAR", "0–9 s"),
  },
  contradictoryCad: {
    file: "contradictory-cad.mp4",
    poster: "contradictory-cad.jpg",
    title: "CAD conflict view: occupancy (red), spoof (magenta) and remove (cyan) conflicts while cav00's report carries a synthetic phantom",
    scenario: "C contradictory",
    view: "cad",
    source: src("C (contradictory, phantom 6.5–9.4 s)", "6 CAD conflicts", "5–11.5 s"),
  },
  contradictoryTcad: {
    file: "contradictory-tcad.mp4",
    poster: "contradictory-tcad.jpg",
    title: "T-CAD view: A4 cell evidence; flagged reporters outlined red with “!”",
    scenario: "C contradictory",
    view: "tcad",
    source: src("C (contradictory, phantom 6.5–9.4 s)", "9 T-CAD", "5–11.5 s"),
  },
  contradictoryGt: {
    file: "contradictory-gt.mp4",
    poster: "contradictory-gt.jpg",
    title: "Ground-truth comparison: green = true positive, red = false positive, yellow = false negative",
    scenario: "C contradictory",
    view: "gt",
    source: src("C (contradictory, phantom 6.5–9.4 s)", "0 ground truth", "5–11.5 s"),
  },
  contradictoryBayes: {
    file: "contradictory-bayes.mp4",
    poster: "contradictory-bayes.jpg",
    title: "Bayesian posterior (purple; yellow = uncertain 0.25–0.75) before, during and after the phantom",
    scenario: "C contradictory",
    view: "bayes",
    source: src("C (contradictory, phantom 6.5–9.4 s)", "7 Bayesian posterior", "3–11 s"),
  },
  contradictoryOccupancy: {
    file: "contradictory-occupancy.mp4",
    poster: "contradictory-occupancy.jpg",
    title: "Merged occupancy (CAD merge): contested space turns red when the phantom report arrives",
    scenario: "C contradictory",
    view: "occupancy",
    source: src("C (contradictory, phantom 6.5–9.4 s)", "5 merged occupancy", "4–10 s"),
  },
  transientHmm: {
    file: "transient-hmm.mp4",
    poster: "transient-hmm.jpg",
    title: "CAD-HMM filtered belief under 1–3-frame ghost returns (transient noise)",
    scenario: "D transient noise",
    view: "hmm",
    source: src("D (transient noise)", "8 CAD-HMM belief", "0–10 s"),
  },
  correlatedBayes: {
    file: "correlated-bayes.mp4",
    poster: "correlated-bayes.jpg",
    title: "Correlated errors: a shared spray/dust disturbance seen by several CAVs at once",
    scenario: "G correlated",
    view: "bayes",
    source: src("G (correlated errors)", "7 Bayesian posterior", "1–11 s"),
  },
};

export const measuredFigureSource = (id: string, extra = "") =>
  `research-data/measured/figure_manifest.csv → ${id}${extra ? ` · ${extra}` : ""} (T-CAD simulator, last complete run)`;
