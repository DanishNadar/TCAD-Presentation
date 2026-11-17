"use client";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { AblationSelector } from "@/components/viz/AblationSelector";

export function S12Ablation() {
  return (
    <div className="absolute inset-0 px-16 pb-6 pt-10">
      <SceneHeader
        kicker="12 · Implementation & ablation"
        accent="var(--color-temporal)"
        title="A0–A5: isolating each idea — measured"
        subtitle="Each configuration as implemented in src/tcad/models/tcad.py. All were scored on the same recorded test observations (45 scenarios, thresholds frozen on validation)."
        right={<EvidenceBadge kind="measured" detail="synthetic simulator · not comparable to the paper" />}
      />
      <div className="mt-4">
        <AblationSelector />
      </div>
    </div>
  );
}
