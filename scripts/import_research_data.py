"""Convert the raw research CSVs in research-data/ into typed JSON for the deck.

    python3 scripts/import_research_data.py

Inputs (copied verbatim from the two context packages):
  research-data/published/   Zhang et al. 2024 Table 3 + headline metrics (Claude handoff)
  research-data/measured/    T-CAD simulator results (results/ of the T-CAD repository, last complete run)
Outputs:
  lib/research/data/published.generated.json
  lib/research/data/measured.generated.json
  public/results/tcad-results.json            (Scene 13 endpoint, schema research-data/published/tcad-results.schema.json + extensions)

Every number in the outputs is copied from a CSV/JSON cell; nothing is computed except
renaming and rounding to 4 decimals. Each block records its source file.
"""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
pub = root / "research-data" / "published"
mea = root / "research-data" / "measured"
outDir = root / "lib" / "research" / "data"
outDir.mkdir(parents=True, exist_ok=True)


def rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(v):
    if v is None or v == "" or v.lower() in ("nan", "none"):
        return None
    try:
        x = float(v)
    except ValueError:
        return v
    return round(x, 4)


def camel(s):
    parts = s.replace("-", "_").split("_")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


# --------------------------------------------------------------------------- published
table3 = [
    {
        "setting": r["attack_setting"],
        "group": r["source_group"],
        "attackSuccPct": num(r["attack_success_pct"]),
        "iou": num(r["iou"]),
        "confidence": num(r["confidence_score"]),
        "deltaApPct": num(r["delta_ap_pct"]),
        "regionDetectionPct": num(r["cad_region_detection_pct"]),
        "frameTprPct": num(r["cad_frame_tpr_pct"]),
        "frameFprPct": num(r["cad_frame_fpr_pct"]),
        "source": r["source"],
    }
    for r in rows(pub / "published_cad_table3.csv")
]
headline = [
    {"metric": r["metric"], "value": num(r["value"]), "unit": r["unit"], "sourceLocation": r["source_location"], "qualifier": r["qualifier"]}
    for r in rows(pub / "published_headline_metrics.csv")
]
(outDir / "published.generated.json").write_text(
    json.dumps({"sourceFiles": ["research-data/published/published_cad_table3.csv", "research-data/published/published_headline_metrics.csv"], "table3": table3, "headline": headline}, indent=1)
)

# --------------------------------------------------------------------------- measured
configs = ["A0", "A1", "A2", "A3", "A4", "A5", "A5-LR"]
descriptions = {r["config"]: r["description"] for r in rows(mea / "summary.csv")}


def ciBlock(path, level):
    out = {}
    for r in rows(path):
        if r["level"] != level:
            continue
        out.setdefault(r["config"], {})[camel(r["metric"])] = {
            "est": num(r["estimate"]), "lo": num(r["ci_low"]), "hi": num(r["ci_high"]),
            "nUnits": int(float(r["n_units"])), "nRows": int(float(r["n_rows"])), "nPos": int(float(r["n_pos"])), "nNeg": int(float(r["n_neg"])),
        }
    return out


summary = ciBlock(mea / "confidence_intervals.csv", "report")
frame = ciBlock(mea / "confidence_intervals.csv", "frame")

comparisons = [
    {"base": r["base"], "config": r["config"], "metric": camel(r["metric"]), "a": num(r["a"]), "b": num(r["b"]), "diff": num(r["diff"]),
     "lo": num(r["ci_low"]), "hi": num(r["ci_high"]), "direction": r["direction"], "seedsBetter": int(r["seeds_b_better"]), "seedsTotal": int(r["seeds_total"])}
    for r in rows(mea / "model_comparisons.csv") if r["level"] == "report"
]
contributions = [
    {"step": r["step"], "component": r["component"], "metric": r["metric"], "diff": num(r["diff"]), "lo": num(r["ci_low"]), "hi": num(r["ci_high"]), "direction": r["direction"]}
    for r in rows(mea / "statistics" / "component_contributions.csv")
]
events = {r["config"]: {"episodes": int(r["n_episodes"]), "detectionRate": num(r["detection_rate"]), "meanDelayS": num(r["mean_delay_s"]), "medianDelayS": num(r["median_delay_s"])}
          for r in rows(mea / "ablations" / "events_summary.csv")}
benign = {r["config"]: {"episodes": int(r["n_episodes"]), "falseAlarmRate": num(r["false_alarm_rate"])} for r in rows(mea / "ablations" / "benign_events_summary.csv")}
fprByCondition = {}
for r in rows(mea / "ablations" / "false_alarms.csv"):
    fprByCondition.setdefault(r["config"], {})[camel(r["condition"])] = {"fpr": num(r["fpr"]), "nNeg": int(float(r["n_neg"]))}
latency = {r["config"]: {"meanMs": num(r["mean_ms"]), "p50Ms": num(r["p50_ms"]), "p95Ms": num(r["p95_ms"]), "maxMs": num(r["max_ms"]),
                         "egoFrames": int(r["n_ego_frames"]), "fracUnder100ms": num(r["frac_under_100ms"])} for r in rows(mea / "latency_metrics.csv")}
calibration = [{"model": camel(r["model"]), "n": int(r["n"]), "brier": num(r["brier"]), "nll": num(r["nll"]), "ece": num(r["ece"]), "accuracy": num(r["accuracy"])}
               for r in rows(mea / "calibration_metrics.csv")]
hmmByFamily = [{"family": camel(r["family"]), "metric": r["metric"], "delta": num(r["delta"]), "lo": num(r["lo"]), "hi": num(r["hi"]), "betterIf": r["better_if"], "comparison": r["comparison"]}
               for r in rows(mea / "statistics" / "hmm_effect_by_family.csv")]
questions = [{"question": r["question"], "answer": r["answer"], "evidence": r["evidence"], "status": r["status"]} for r in rows(mea / "statistics" / "research_questions.csv")]

variants = {}
for r in rows(mea / "ablations" / "variants.csv"):
    if r["level"] == "report" and r["metric"] == "auroc":
        variants.setdefault(camel(r["variant"]), {})[r["config"]] = {"est": num(r["estimate"]), "lo": num(r["ci_low"]), "hi": num(r["ci_high"])}

byFamily = {}
for r in rows(mea / "ablations" / "by_family.csv"):
    byFamily.setdefault(camel(r["family"]), {}).setdefault(r["config"], {})[camel(r["metric"])] = num(r["value"])

robustness = []
for r in rows(mea / "robustness.csv"):
    if r["variant"] != "main" and not r["experiment"].startswith("R9"):
        continue
    robustness.append({
        "experiment": r["experiment"], "param": r["param"], "value": r["value"] if r["experiment"].startswith(("R7", "R9")) else num(r["value"]),
        "variant": r["variant"], "config": r["config"], "runs": int(r["n_runs"]),
        "auroc": num(r["auroc"]), "aurocLo": num(r["auroc_lo"]), "aurocHi": num(r["auroc_hi"]),
        "tpr": num(r["tpr"]), "tprLo": num(r["tpr_lo"]), "tprHi": num(r["tpr_hi"]),
        "fpr": num(r["fpr"]), "fprLo": num(r["fpr_lo"]), "fprHi": num(r["fpr_hi"]),
        "eventDetection": num(r["event_detection_rate"]), "meanDelayS": num(r["mean_delay_s"]),
    })
runtimeScaling = [{"sweep": r["sweep"], "value": num(r["value"]), "config": r["config"], "p95Ms": num(r["p95_ms"]), "meanMs": num(r["mean_ms"]), "cells": int(float(r["n_cells"]))}
                  for r in rows(mea / "robustness" / "R10_runtime.csv")]

thresholds = json.loads((mea / "ablations" / "decision" / "thresholds.json").read_text())
abl = json.loads((mea / "ablations" / "ablation_summary.json").read_text())
artifacts = json.loads((mea / "demoCContradictory" / "model_artifacts.json").read_text())["observation_model"]
runStatus = rows(mea / "ablations" / "run_status.csv")
splits = {}
for r in runStatus:
    splits.setdefault(r["split"], {"ok": 0, "total": 0})
    splits[r["split"]]["total"] += 1
    splits[r["split"]]["ok"] += r["status"] == "ok"
env = json.loads((mea / "demoCContradictory" / "run_metadata.json").read_text())["environment"]
hardware = f"{env['platform']} · {env['machine']} · {env['processor'].split(',')[0]} · {env['cpu_count']} cores · {env['memory_gb']} GB · Python {env['python']}"

figures = [{"file": Path(r["file_path"].replace("\\", "/")).name, "id": r["figure"], "kind": r["kind"], "experiment": r["experiment_id"], "scenario": r["scenario_id"],
            "description": r["description"], "metrics": r["metrics"]} for r in rows(mea / "figure_manifest.csv")]

measured = {
    "provenance": {
        "source": "T-CAD repository results/ (last complete run; snake_case names, see snakeToCamelNameMap.json)",
        "simulator": "Synthetic PyGame/NumPy multi-vehicle simulator; 2-D ray-cast LiDAR; bounded synthetic message-level contradictions",
        "testScenarios": abl["n_test_scenarios"], "reportRows": abl["n_report_rows"], "positiveRows": abl["n_positive_rows"],
        "positiveFraction": round(abl["positive_fraction"], 5), "splits": splits, "ciMethod": "95% scenario-level bootstrap; seeds_better over 5 seed groups",
        "hardware": hardware, "wallTimeS": round(abl["wall_time_s"], 1),
        "notComparableTo": "Zhang et al. (2024) 91.5% detection / ~3% FPR — different data, attacks and metric denominators",
    },
    "configs": configs,
    "descriptions": descriptions,
    "report": summary,
    "frame": frame,
    "comparisons": comparisons,
    "contributions": contributions,
    "events": events,
    "benignEvents": benign,
    "fprByCondition": fprByCondition,
    "latency": latency,
    "calibrationMetrics": calibration,
    "calibrationParams": {
        "priorOccupied": round(artifacts["prior_occupied"], 4), "rho": round(artifacts["rho"], 4),
        "pFreeToOcc": round(artifacts["p_free_to_occ"], 5), "pOccToFree": round(artifacts["p_occ_to_free"], 4),
        "rangeBinsM": artifacts["bins"],
        # table[bin][z][x]: z in (unknown, free, occupied); x in (free, occupied)
        "likelihoodTable": [[[round(v, 4) for v in z] for z in b] for b in artifacts["table"]],
        "source": "research-data/measured/demoCContradictory/model_artifacts.json (observation model used for the stored run)",
    },
    "thresholds": {"perConfigM2": thresholds["thresholds"], "strongCadM2": thresholds["strong_cad"], "ruleTau4M2": thresholds["rule_tau4"], "lrTau": thresholds["lr_tau"], "source": thresholds["source"]},
    "hmmByFamily": hmmByFamily,
    "variants": variants,
    "byFamily": byFamily,
    "researchQuestions": questions,
    "robustness": robustness,
    "runtimeScaling": runtimeScaling,
    "figures": figures,
}
(outDir / "measured.generated.json").write_text(json.dumps(measured, indent=1))

# --------------------------------------------------------------------------- Scene 13 endpoint
metricMap = {"tpr": "frameTpr", "fpr": "frameFpr"}  # placeholder names replaced below
experiments = []
for c in configs:
    rep = summary[c]
    experiments.append({
        "configuration": c,
        "condition": "nominal test split (9 scenario families)",
        "dataset": "T-CAD synthetic simulator, held-out test split",
        "runId": "ablation-test (45 scenarios, seeds 4000-4004)",
        "sourceFile": "research-data/measured/confidence_intervals.csv",
        "hardware": hardware,
        "nScenarios": abl["n_test_scenarios"],
        "level": "report",
        "denominator": {"rows": rep["tpr"]["nRows"], "positives": rep["tpr"]["nPos"], "negatives": rep["tpr"]["nNeg"]},
        "metrics": {
            "reportTpr": rep["tpr"]["est"], "reportFpr": rep["fpr"]["est"], "precision": rep["precision"]["est"], "f1": rep["f1"]["est"],
            "prAuc": rep["auprc"]["est"], "rocAuc": rep["auroc"]["est"], "frameTpr": frame[c]["tpr"]["est"], "frameFpr": frame[c]["fpr"]["est"],
            "eventDetectionRate": events[c]["detectionRate"], "meanDetectionDelayS": events[c]["meanDelayS"],
            "latencyP95Ms": latency[c]["p95Ms"],
        },
        "ci95": {k: [rep[m]["lo"], rep[m]["hi"]] for k, m in [("reportTpr", "tpr"), ("reportFpr", "fpr"), ("precision", "precision"), ("f1", "f1"), ("prAuc", "auprc"), ("rocAuc", "auroc")]}
        | {"frameTpr": [frame[c]["tpr"]["lo"], frame[c]["tpr"]["hi"]], "frameFpr": [frame[c]["fpr"]["lo"], frame[c]["fpr"]["hi"]]},
    })
endpoint = {
    "schemaVersion": "1.0",
    "status": "measured",
    "provenance": "Measured on the T-CAD synthetic simulator (not Adv-OPV2V). Converted by scripts/import_research_data.py from research-data/measured/. "
                  "Not comparable to Zhang et al. (2024).",
    "generatedFrom": "research-data/measured/confidence_intervals.csv, events_summary.csv, latency_metrics.csv",
    "experiments": experiments,
}
(root / "public" / "results" / "tcad-results.json").write_text(json.dumps(endpoint, indent=1))
print("published rows:", len(table3), "| measured configs:", len(configs), "| robustness rows:", len(robustness), "| figures:", len(figures))
