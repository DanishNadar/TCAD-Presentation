"use client";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { ResultsDashboard } from "@/components/viz/ResultsDashboard";

export function S13Evaluation() {
  return (
    <div className="absolute inset-0 px-16 pb-6 pt-10">
      <SceneHeader
        kicker="13 · Evaluation"
        accent="var(--color-consistent)"
        title="Evaluation: what our implementation measured"
        subtitle="Main ablation on the held-out test split, loaded from /results/tcad-results.json. Robustness sweeps, research questions and all figures are in the backup slides."
      />
      <div className="mt-4">
        <ResultsDashboard />
      </div>
    </div>
  );
}
