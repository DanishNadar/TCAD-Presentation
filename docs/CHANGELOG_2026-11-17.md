# 2026-11-17 — Research data, measured results and recorded replays integrated

## Sourcing of each data visualization

| Scene | Visualization | Source | Badge |
|---|---|---|---|
| 2 | Occlusion replays (world, LiDAR) | Our simulator, scenario B, seed 42 | Recorded simulator run |
| 3 | Merged-occupancy replay | Scenario C, seed 42 (phantom 6.5–9.4 s) | Recorded simulator run |
| 5 | CAD-conflict replay; fig05; fidelity table | Scenario C replay · `figure_manifest.csv` → fig05 · results report §2 | Published method + Our measured |
| 6 | Table 3 chart (7 metrics) + headline tiles | `research-data/published/published_cad_table3.csv`, `published_headline_metrics.csv` | Published — Zhang et al. (2024) |
| 7 | Implemented architecture (fig08, fig01); concept diagram | `figure_manifest.csv`; `research-data/diagrams/cad_tcad_architecture.svg` | Redrawn conceptual diagram |
| 8 | Likelihood-by-range bars; ECE table; fig15 | `demoCContradictory/model_artifacts.json`; `calibration_metrics.csv` | Our measured experiment |
| 9 | fig12, fig20, per-family Δ table; HMM replay; fig06; learned-transitions preset | `hmm_effect_by_family.csv`, `variants.csv`, `model_artifacts.json`; scenario D replay | Measured + Recorded |
| 10 | ρ; tempered vs naive AUROC forest plot; R7 FPR table; correlated-errors replay | `model_artifacts.json`, `variants.csv`, `robustness.csv`; scenario G replay | Measured + Recorded |
| 11 | Episode detection/delay/false-alarm table; T-CAD + ground-truth replays; fig14 | `events_summary.csv`, `benign_events_summary.csv`; scenario C replays | Measured + Recorded |
| 12 | Per-config AUROC/TPR/FPR with CIs, paired diffs vs A0 | `confidence_intervals.csv`, `model_comparisons.csv` | Our measured experiment |
| 13 | Endpoint-driven forest plot (8 metrics); component table; p95 runtime | `/results/tcad-results.json` ← `confidence_intervals.csv`; `component_contributions.csv`; `latency_metrics.csv` | Our measured experiment |
| Backup | Robustness explorer R1–R8 (+ fig10/11/14/16/17/18) | `robustness.csv` | Our measured experiment |
| Backup | 15 research questions | `statistics/research_questions.csv` | Our measured experiment |
| Backup | Figure gallery (20 PNG + 3 SVG) | `figure_manifest.csv`, `research-data/diagrams` | Measured / conceptual |
| Backup | Replay theatre (9 clips) | `lib/research/media.ts` | Recorded simulator run |

The in-browser simulations (intersection, CAD grid, occupancy grid, HMM filter, fusion, anomaly score) are unchanged and remain labeled *Illustrative simulation*.

## Verification

- `npx tsc --noEmit`: clean. `npm run build` (static export): clean.
- Headless Chrome, 1600×900:
  - All 21 slides visited by → key, in order, with correct URL hashes.
  - Every scene mode toggled and screenshotted.
  - Dashboard metric switching works.
  - Empty endpoint renders "Awaiting verified measurements" (tested with the handoff's empty JSON, then restored).
  - Videos play (readyState 4), pause on the global P key, and do not autoplay in reduced-motion mode.
  - Lightbox opens and Esc closes it without changing slides.
  - Notes drawer works, and the presenter window drives the deck.
  - **0 console errors, 0 failed requests.**
- Each caption's numeric claim was checked against its CSV. Several robustness notes were rewritten after that check.

## Deploying to the existing Vercel project

This folder is the presentation's source repository. Copy it over your local checkout (or commit it on a branch), then either:

```bash
git add -A && git commit -m "Integrate published CSVs, measured T-CAD results and simulator replays" && git push   # Vercel auto-deploys
# or
npx vercel --prod
```

No environment variables are needed. Build command `npm run build`, output directory `out`.

## Missing real experiment files you may want to provide

1. `ablations/decision/main/decisionLr.pkl`: the A5-LR model. The replays show A0–A5 rule flags only.
2. A finished full regeneration with the camelCase code, or confirmation that the snake_case run is final.
3. Any Adv-OPV2V / Adv-MCity run of T-CAD. Without it, nothing can be compared to the paper's 91.5% / 3%.
4. The source of ρ = 0.672 in the results-report text, which differs from 0.677 in `model_artifacts.json` and 0.665 in the current repo.
5. The original `results/presentation/vehicle_diagnostics/*.png`, which are referenced in the manifest but not bundled.
