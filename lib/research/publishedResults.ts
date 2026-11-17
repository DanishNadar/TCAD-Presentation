/**
 * PUBLISHED RESULTS — reported by Zhang et al., USENIX Security 2024.
 * These are NOT measurements from our project. Verified against the arXiv v2
 * full text (Table 3, Abstract, §6.1, §6.4) on 2026-11-16.
 */

export const paperMeta = {
  title: "On Data Fabrication in Collaborative Vehicular Perception: Attacks and Countermeasures",
  authors: [
    "Qingzhao Zhang",
    "Shuowei Jin",
    "Ruiyang Zhu",
    "Jiachen Sun",
    "Xumiao Zhang",
    "Qi Alfred Chen",
    "Z. Morley Mao",
  ],
  affiliations: "University of Michigan · UC Irvine · Google",
  venue: "33rd USENIX Security Symposium",
  year: 2024,
  pages: "6309–6326",
};

/** Headline claims as stated in the abstract. */
export const headlineClaims = [
  {
    id: "attack",
    value: "> 86%",
    label: "Attack success rate",
    context: "Data-fabrication attacks on high-fidelity simulated scenarios (Adv-OPV2V). Abstract.",
    where: "Abstract; Table 3 rows range 86.0%–99.3% for the proposed attacks",
  },
  {
    id: "detect",
    value: "91.5%",
    label: "Attacks detected by CAD",
    context: "Stated in the abstract/introduction for simulated scenarios. The paper does not tabulate how this aggregate is computed.",
    where: "Abstract & §1 (not derived in a table)",
  },
  {
    id: "fpr",
    value: "≈ 3%",
    label: "False-positive rate",
    context: "Abstract states 3%; §6.4.1 states FPR < 3% at AUC-selected thresholds. Table 3’s RC-Early-Remove row reports 5.6%.",
    where: "Abstract; §6.4.1; Table 3",
  },
  {
    id: "runtime",
    value: "92 ms",
    label: "CAD end-to-end latency",
    context: "Includes ~10 ms occupancy-map transmission and ~15 ms consistency checks.",
    where: "§6.4 runtime analysis",
  },
] as const;

/**
 * Table 3 — Performance of attacks and defenses on Adv-OPV2V.
 * Loaded from research-data/published/published_cad_table3.csv (verbatim transcription,
 * via scripts/import_research_data.py). regionDetectionPct is the paper's "Defense Succ."
 * (attacked target region flagged) — NOT frame-level TPR.
 */
import publishedData from "./data/published.generated.json";

export interface Table3Row {
  setting: string;
  fusion: "Early" | "Intermediate" | "Late";
  goal: "Spoof" | "Remove";
  isPriorWork: boolean;
  attackSucc: number | null;
  iou: number | null;
  confidence: number | null;
  deltaAp: number | null;
  defenseSucc: number | null; // region-level detection ("Defense Succ.")
  tpr: number | null; // frame-level, includes benign perception faults
  fpr: number | null;
}

export const table3SourceFile = "research-data/published/published_cad_table3.csv";

export const table3: Table3Row[] = publishedData.table3.map((r) => ({
  setting: r.setting,
  fusion: r.setting.includes("Early") ? "Early" : r.setting.includes("Late") ? "Late" : "Intermediate",
  goal: r.setting.includes("Spoof") ? "Spoof" : "Remove",
  isPriorWork: r.group === "prior_attack_72",
  attackSucc: r.attackSuccPct,
  iou: r.iou,
  confidence: r.confidence,
  deltaAp: r.deltaApPct,
  defenseSucc: r.regionDetectionPct,
  tpr: r.frameTprPct,
  fpr: r.frameFprPct,
}));

export const headlineMetrics = publishedData.headline;

/** Metric definitions exactly as the paper uses them. */
export const paperMetricDefinitions = [
  { name: "Attack Succ.", def: "Spoofing succeeds if the best-matching predicted box has IoU > 0 with the target; removal succeeds if IoU = 0. Computed over attack scenarios." },
  { name: "Defense Succ. (region detection)", def: "Fraction of attacks whose attacked target region is flagged by CAD. This is NOT frame-level TPR." },
  { name: "TPR / FPR", def: "Computed on whole LiDAR frames, so benign perception faults count as anomalies too — this is why removal TPR (~38–43%) is far below region-level detection (~81–84%)." },
];

export const evaluationSetup = [
  "Adv-OPV2V (simulated, CARLA/OpenCDA): 300 spoofing + 300 removal scenarios (§6.1; the abstract says 211 — the paper is internally inconsistent).",
  "Each scenario: 10 consecutive frames, 3–5 CAVs, one attacker, one victim, target < 30 m from victim; 64-beam simulated LiDAR.",
  "Main backbone: PointPillars; also VoxelNet, V2VNet, CoBEVT, FPV-RCNN variants.",
  "Adv-MCity (real world): 3 Lincoln MKZ CAVs with Velodyne VLP-32C; 8 scenarios (4 spoof, 4 remove).",
];

export const otherPublishedFindings = [
  "Map synchronization matters: without it TPR ≈ 35% / 15% (spoof / remove) at FPR < 5%; with it ≈ 60% / 40% (Fig. 15 discussion).",
  "Smaller objects raise FPR: pedestrians 14.5% (spoof), cyclists 6.5% (spoof).",
  "A second colluding attacker lowers TPR by about 5%.",
  "Real world (Adv-MCity): early-fusion spoof succeeds in 76% of frames, intermediate spoof 92%, intermediate removal 96%.",
];

export const paperLimitations = [
  "Needs at least one benign CAV that actually observes the attacked region — otherwise there is no conflict to find.",
  "Detects anomalies but does not reliably resolve which vehicle is lying (majority voting fails if attackers are not a minority).",
  "Removal detection is weak at the frame level, partly due to benign faults beyond the ~50 m map range.",
  "An adaptive attacker can fabricate a self-consistent occupancy map, reducing the occupancy check to input validation.",
];

/** What CAD already does with time — stated so we never over-claim novelty. */
export const cadTemporalFacts = [
  "Each vehicle runs multi-object tracking (AB3DMOT-inspired) and point-cloud registration to estimate object motion.",
  "That motion is used to synchronize occupancy maps from different vehicles to a common timestamp.",
  "The consistency checks themselves are evaluated per frame; the paper does not describe accumulating anomaly evidence across frames.",
];
