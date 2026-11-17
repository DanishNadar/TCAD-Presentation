# Research Content Map — provenance ledger

Updated 2026-11-17 after integrating the two context packages:

- **Claude handoff** (`T-CAD_Claude_Complete_Context.zip`): implementation brief, research context, source PDF, Table 3 CSV, headline-metrics CSV, results schema, three SVG diagrams.
- **T-CAD repository package** (`tcadChatGptContext.zip`): full Python implementation, configs, docs, and the **logged results of the last complete experiment run** (A0–A5-LR, R1–R10, 20 figures).

The two packages disagree on one point. The handoff says no measured T-CAD results exist, but the repository package contains them (99/99 scenarios ok, logs, bootstrap CIs). Brief item 5 says to use real run outputs when they are present, so the deck now shows them, labeled **Our measured experiment** and scoped to the synthetic simulator.

## Evidence categories (badges in the UI)

| Badge | Meaning |
|---|---|
| PUBLISHED — ZHANG ET AL. (2024) | Paper numbers; every one traces to `research-data/published/*.csv` |
| OUR MEASURED EXPERIMENT | T-CAD repository results, `research-data/measured/` (synthetic simulator, 45 test scenarios) |
| RECORDED SIMULATOR RUN | Videos rendered from my simulation: demonstrations, not metrics |
| ILLUSTRATIVE SIMULATION | In-browser teaching simulations (`lib/sim/*`) |
| PROPOSED / NOT YET MEASURED | Used only by the Scene 13 empty state and the ND row |

Every research graphic also carries a caption: *Redrawn conceptual diagram*, *Redrawn chart of published data*, *Measured plot (our experiment)*, *Recorded simulator replay*, or *Interactive illustration*.

## 1. Published (Zhang et al., USENIX Security 2024)

| Item | Source row | Scenes |
|---|---|---|
| Table 3, all columns (attack succ., IoU, confidence, ΔAP, region detection = “Defense Succ.”, frame TPR, frame FPR) | `research-data/published/published_cad_table3.csv` | 6 |
| > 86% attack success, 91.5% detection, 3% FPR, 92 ms | `published_headline_metrics.csv` (Abstract, §1, §6.4) | 6 |
| CAD method, Eq. 5–7, σ thresholds | PDF §5.4 (`claudeCtx/source/CS528_Original_USENIX2024.pdf`) | 5 |

Corrections kept: region detection is **not** frame TPR. 91.5% matches no single Table 3 row. RC-Early-Remove FPR is 5.6%, so "< 3% everywhere" is false.

## 2. Our measured experiment (synthetic simulator)

| Data | File in `research-data/measured/` | Scenes |
|---|---|---|
| Report/frame metrics with 95% CIs (A0–A5-LR) | `confidence_intervals.csv` → `public/results/tcad-results.json` | 12, 13 |
| Paired comparisons vs A0, seeds | `model_comparisons.csv` | 12 |
| Component contributions | `statistics/component_contributions.csv` | 13 |
| Episode detection / delay, benign false alarms | `ablations/events_summary.csv`, `benign_events_summary.csv` | 11 |
| FPR by benign condition | `ablations/false_alarms.csv` | Q&A |
| Runtime | `latency_metrics.csv`, `robustness/R10_runtime.csv` | 13, Q&A, backup |
| Calibration metrics (ECE, Brier, NLL) | `calibration_metrics.csv` | 8, 10 |
| Calibrated likelihood table, ρ, transitions | `demoCContradictory/model_artifacts.json` | 8, 9, 10 |
| HMM effect per family | `statistics/hmm_effect_by_family.csv` | 9 |
| Model variants (naive independence, memory evidence…) | `ablations/variants.csv` | 9, 10 |
| Robustness sweeps R1–R9 | `robustness.csv` | 10 (R7), backup |
| 15 research questions + verdicts | `statistics/research_questions.csv` | backup |
| 20 figures | `figure_manifest.csv` → `public/figures/` | 5, 7, 8, 9, 11, backup |

Conversion: `python3 scripts/import_research_data.py` (copies values, renames to camelCase, rounds to 4–5 dp; nothing is recomputed).

Hardware: Windows 11 ARM64, Qualcomm 12-core, 31.6 GB, Python 3.12 (`demoCContradictory/run_metadata.json`).

**Known provenance wrinkle:** the inter-source correlation ρ appears as 0.677 in the stored run's `model_artifacts.json` (shown in the deck), 0.672 in the results-report text, and 0.665 in the current repository calibration file. The slide caption states all three.

## 3. Recorded simulator runs (videos)

No videos were supplied in either package. The nine clips in `public/videos/` were recorded with the repository's own scripts:

```
python scripts/runHeadless.py --scenario {B,C,D,G} --seed 42 --runId demo{B,C,D,G} --noFigures
python scripts/replayExperiment.py --runId <id> --exportVideo --start S --end E --view <view> --fps 10
ffmpeg … -c:v libx264 -crf 28 -movflags +faststart (1280 px)
```

These runs use the calibrated observation model and validation thresholds (converted from `ablations/decision/thresholds.json`). The current code draws different random numbers from the stored experiment (see the package's naming note), so the clips are demonstrations, not the test runs. Catalog: `lib/research/media.ts`.

| Clip | Scenario / view | Scene |
|---|---|---|
| occlusion-world, occlusion-lidar | B / world, LiDAR | 2, replays |
| contradictory-occupancy | C / merged occupancy | 3 |
| contradictory-cad | C / CAD conflicts | 5 |
| contradictory-tcad, contradictory-gt | C / T-CAD, ground truth | 11 |
| transient-hmm | D / CAD-HMM belief | 9 |
| correlated-bayes | G / Bayesian posterior | 10 |
| contradictory-bayes | C / Bayesian posterior | replays |

## 4. Diagrams

`research-data/diagrams/*.svg` (handoff, new editable diagrams). `cad_tcad_architecture.svg` wording was updated from "not yet empirically validated" to "measured on my simulation only (not Adv-OPV2V)". All three appear in the figure gallery; the CAD→T-CAD diagram is also on Scene 7.

Redraw pass (2026-11-17): the three concept SVGs were redrawn to remove overlaps and inaccuracies (the occlusion scene now has the building actually blocking ego's line of sight; the HMM example uses the calibrated p01/p10, so the prediction decays 0.30 → 0.28 instead of rising; oversized arrowheads fixed) and now carry intrinsic `width`/`height` so they size correctly in gallery thumbnails and the lightbox. The matplotlib diagrams fig01, fig06, fig07 and fig08 had overlapping titles, clipped boxes and tangled arrows; they were redrawn with the same content and parameters as SVG sources in `research-data/diagrams/figures/` and rendered at 2× into `public/figures/` (same filenames). The self-citation of the T-CAD repository was removed from the references slide because there is no published paper or public repository to link.

## 5. Still missing / not claimed

- No Adv-OPV2V or Adv-MCity evaluation of T-CAD. Datasets are not bundled; see https://github.com/zqzqz/AdvCollaborativePerception.
- No reproduction of the authors' CAD code. A0 is a CAD-inspired re-implementation (results report §2).
- The paper's ray-casting and adversarial attacks are not reproduced, by design.
- The A5-LR logistic model (`decisionLr.pkl`) was not in the package. Recordings therefore show A0–A5 rule flags only; A5-LR numbers come from the logged results.
- A full regeneration with the camelCase code did not finish (package note), so the stored snake_case run is authoritative.
