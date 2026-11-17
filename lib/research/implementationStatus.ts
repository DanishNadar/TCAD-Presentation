/**
 * Single source of truth for what exists. Scene 7/12 and the ablation matrix read it.
 * Updated 2026-11-17 from the T-CAD repository (src/tcad/models/*) and its logged
 * results (research-data/measured/). All T-CAD components are implemented and were
 * evaluated on our synthetic simulator; the CAD components are our CAD-INSPIRED
 * re-implementation (see resultsReport §2 "Baseline reproduction"), not the authors' code.
 *
 * Status meanings:
 *  - "published"    : part of the original CAD paper (method description).
 *  - "measured"     : implemented in our pipeline AND evaluated with logged results.
 *  - "implemented"  : implemented, not yet evaluated.
 *  - "illustrative" : exists only as an in-browser teaching simulation.
 *  - "proposed"     : designed, not implemented.
 */
export type ComponentStatus = "published" | "measured" | "implemented" | "illustrative" | "proposed";

export type ComponentId =
  | "occupancy"
  | "sync"
  | "occCheck"
  | "percCheck"
  | "calibration"
  | "fusion"
  | "hmm"
  | "scoring"
  | "decision";

export interface PipelineComponent {
  id: ComponentId;
  label: string;
  sub: string;
  origin: "cad" | "tcad";
  status: ComponentStatus;
  color: string; // semantic token name
  code: string; // file in the T-CAD repository
}

export const pipelineComponents: PipelineComponent[] = [
  { id: "occupancy", label: "Occupancy maps", sub: "free / occ / unknown", origin: "cad", status: "measured", color: "sensor", code: "perception/occupancy.py" },
  { id: "sync", label: "Tracking + sync", sub: "align to one timestamp", origin: "cad", status: "measured", color: "sensor", code: "perception/tracking.py · network/synchronization.py" },
  { id: "occCheck", label: "Occ ↔ Occ check", sub: "ε_occ = S_O ∩ S_F", origin: "cad", status: "measured", color: "collab", code: "models/cadBaseline.py" },
  { id: "percCheck", label: "Perc ↔ Occ check", sub: "ε_spoof, ε_remove", origin: "cad", status: "measured", color: "collab", code: "models/cadBaseline.py" },
  { id: "calibration", label: "Calibration", sub: "P(Z | X, range)", origin: "tcad", status: "measured", color: "prob", code: "models/observationModel.py · sensors/calibration.py" },
  { id: "fusion", label: "Fusion", sub: "LOO posterior, ρ-tempered", origin: "tcad", status: "measured", color: "prob", code: "models/bayesianFusion.py" },
  { id: "hmm", label: "Temporal HMM", sub: "P(X_t | Z_1:t)", origin: "tcad", status: "measured", color: "temporal", code: "models/occupancyHmm.py · models/cadHmm.py" },
  { id: "scoring", label: "Anomaly score", sub: "LOO evidence score", origin: "tcad", status: "measured", color: "temporal", code: "models/anomalyScoring.py" },
  { id: "decision", label: "Decision layer", sub: "rule or logistic", origin: "tcad", status: "measured", color: "anomaly", code: "models/tcad.py (DecisionLayer)" },
];

export interface AblationConfig {
  id: string;
  name: string;
  purpose: string;
  components: ComponentId[];
  isolates: string;
  measuredId?: "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A5-LR";
  implementationNote: string;
}

const cadCore: ComponentId[] = ["occupancy", "sync", "occCheck", "percCheck"];

/** Configurations exactly as implemented in src/tcad/models/tcad.py. */
export const ablations: AblationConfig[] = [
  { id: "ND", name: "No defense", purpose: "Reference: attack impact without detection", components: ["occupancy"], isolates: "Not run as a configuration", implementationNote: "Not evaluated; every measured row is a reporter assessment, so ‘no defense’ has no score." },
  { id: "A0", name: "CAD baseline", purpose: "Reproduce CAD's checks as the reference", components: [...cadCore], isolates: "Baseline", measuredId: "A0", implementationNote: "CAD-inspired: binary conflict area (occupancy + spoof + remove), threshold from validation ROC." },
  { id: "A1", name: "+ calibrated observations", purpose: "Isolate probability calibration", components: [...cadCore, "calibration"], isolates: "Calibration", measuredId: "A1", implementationNote: "Conflicts weighted by calibrated, range-dependent likelihoods; pairwise." },
  { id: "A2", name: "+ Bayesian LOO corroboration", purpose: "Isolate multi-vehicle evidence fusion", components: [...cadCore, "calibration", "fusion", "scoring"], isolates: "Fusion", measuredId: "A2", implementationNote: "Leave-one-agent-out fused posterior, tempered for correlated sources." },
  { id: "A3", name: "CAD-HMM (per-source)", purpose: "Isolate temporal modeling", components: [...cadCore, "calibration", "hmm"], isolates: "Temporal inference", measuredId: "A3", implementationNote: "Per-source forward filters; pairwise; no cross-source fusion." },
  { id: "A4", name: "Bayes + HMM (fused, LOO)", purpose: "Measure fusion × time", components: [...cadCore, "calibration", "fusion", "hmm", "scoring"], isolates: "Interaction of fusion and HMM", measuredId: "A4", implementationNote: "Leave-one-out temporal filter on fused evidence." },
  { id: "A5", name: "T-CAD rule", purpose: "Interpretable decision layer", components: [...cadCore, "calibration", "fusion", "hmm", "scoring", "decision"], isolates: "Rule decision layer", measuredId: "A5", implementationNote: "Strong CAD alert OR A4 alert; abstain without corroboration (never triggered on test)." },
  { id: "A5-LR", name: "T-CAD logistic", purpose: "Learned decision layer", components: [...cadCore, "calibration", "fusion", "hmm", "scoring", "decision"], isolates: "Logistic decision layer", measuredId: "A5-LR", implementationNote: "L2 logistic regression on evidence features + strong-CAD override; may exploit simulator regularities." },
];

export const statusMeta: Record<ComponentStatus, { label: string; tone: string }> = {
  published: { label: "Published (CAD)", tone: "collab" },
  measured: { label: "Measured (sim)", tone: "consistent" },
  implemented: { label: "Implemented", tone: "temporal" },
  illustrative: { label: "Illustrative only", tone: "prob" },
  proposed: { label: "Proposed", tone: "unknown" },
};
