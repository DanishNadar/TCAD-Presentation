/**
 * Bibliography. Every number shown on screen links back to one of these keys.
 */
export interface Reference {
  key: string;
  short: string;
  full: string;
  url?: string;
  role: string;
}

export const references: Reference[] = [
  {
    key: "zhang2024",
    short: "Zhang et al., USENIX Security 2024",
    full: "Q. Zhang, S. Jin, R. Zhu, J. Sun, X. Zhang, Q. A. Chen, Z. M. Mao. “On Data Fabrication in Collaborative Vehicular Perception: Attacks and Countermeasures.” 33rd USENIX Security Symposium, pp. 6309–6326, 2024. arXiv:2309.12955.",
    url: "https://www.usenix.org/conference/usenixsecurity24/presentation/zhang-qingzhao",
    role: "Primary paper — threat model, attacks, CAD defense, all published results in this deck.",
  },
  {
    key: "zhang2024arxiv",
    short: "arXiv:2309.12955",
    full: "Open-access preprint of the primary paper (v2, Oct 2023).",
    url: "https://arxiv.org/abs/2309.12955",
    role: "Accessible full text used to verify equations (Eq. 5–7) and Table 3.",
  },
  {
    key: "zhang2024repo",
    short: "AdvCollaborativePerception (authors' code)",
    full: "Q. Zhang et al. AdvCollaborativePerception — original authors' repository: attacks, CAD defense, Adv-OPV2V download scripts.",
    url: "https://github.com/zqzqz/AdvCollaborativePerception",
    role: "Original code and data source for OPV2V / Adv-OPV2V (datasets not bundled with this deck).",
  },
  {
    key: "opv2v",
    short: "Xu et al., ICRA 2022 (OPV2V)",
    full: "R. Xu, H. Xiang, X. Xia, X. Han, J. Li, J. Ma. “OPV2V: An Open Benchmark Dataset and Fusion Pipeline for Perception with Vehicle-to-Vehicle Communication.” ICRA 2022.",
    url: "https://arxiv.org/abs/2109.07644",
    role: "Base dataset (CARLA + OpenCDA) from which the paper builds Adv-OPV2V.",
  },
  {
    key: "ab3dmot",
    short: "Weng et al., IROS 2020 (AB3DMOT)",
    full: "X. Weng, J. Wang, D. Held, K. Kitani. “3D Multi-Object Tracking: A Baseline and New Evaluation Metrics.” IROS 2020.",
    url: "https://arxiv.org/abs/1907.03961",
    role: "Tracking baseline that CAD's motion estimation for map synchronization is inspired by.",
  },
  {
    key: "rabiner1989",
    short: "Rabiner, Proc. IEEE 1989",
    full: "L. R. Rabiner. “A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition.” Proceedings of the IEEE 77(2):257–286, 1989.",
    url: "https://doi.org/10.1109/5.18626",
    role: "HMM definitions and the forward (filtering) recursion used in T-CAD.",
  },
  {
    key: "thrun2005",
    short: "Thrun, Burgard, Fox — Probabilistic Robotics (2005)",
    full: "S. Thrun, W. Burgard, D. Fox. Probabilistic Robotics. MIT Press, 2005. (Bayes filters, binary Bayes filter / log-odds occupancy grids.)",
    role: "Occupancy-grid log-odds updates and Bayes-filter formulation.",
  },
  {
    key: "elfes1989",
    short: "Elfes, Computer 1989",
    full: "A. Elfes. “Using Occupancy Grids for Mobile Robot Perception and Navigation.” Computer 22(6):46–57, 1989.",
    url: "https://doi.org/10.1109/2.30720",
    role: "Original occupancy-grid representation.",
  },
  {
    key: "julier1997",
    short: "Julier & Uhlmann, ACC 1997",
    full: "S. J. Julier, J. K. Uhlmann. “A Non-divergent Estimation Algorithm in the Presence of Unknown Correlations.” American Control Conference, 1997. (Covariance intersection.)",
    url: "https://doi.org/10.1109/ACC.1997.609105",
    role: "Why fusing correlated sources as independent is overconfident; conservative fusion alternatives.",
  },
  {
    key: "guo2017",
    short: "Guo et al., ICML 2017",
    full: "C. Guo, G. Pleiss, Y. Sun, K. Q. Weinberger. “On Calibration of Modern Neural Networks.” ICML 2017.",
    url: "https://arxiv.org/abs/1706.04599",
    role: "Calibration and Expected Calibration Error (ECE) — metric for calibrated likelihoods.",
  },
  {
    key: "page1954",
    short: "Page, Biometrika 1954 (CUSUM)",
    full: "E. S. Page. “Continuous Inspection Schemes.” Biometrika 41(1/2):100–115, 1954.",
    url: "https://doi.org/10.1093/biomet/41.1-2.100",
    role: "Sequential change detection — the delay-vs-false-alarm tradeoff of accumulated scores.",
  },
  {
    key: "chandola2009",
    short: "Chandola et al., ACM CSUR 2009",
    full: "V. Chandola, A. Banerjee, V. Kumar. “Anomaly Detection: A Survey.” ACM Computing Surveys 41(3), 2009.",
    url: "https://doi.org/10.1145/1541880.1541882",
    role: "Background on score-based anomaly detection and thresholding.",
  },
];

export const paperUrl = references[0].url!;
export const arxivUrl = references[1].url!;
export const authorsRepoUrl = "https://github.com/zqzqz/AdvCollaborativePerception";
