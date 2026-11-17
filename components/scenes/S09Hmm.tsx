"use client";
import { useState } from "react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { TemporalInferenceModel } from "@/components/viz/TemporalInferenceModel";
import { Segmented } from "@/components/ui/Controls";
import { FigurePlate, VideoPanel } from "@/components/ui/Media";
import { measuredFigureSource } from "@/lib/research/media";
import { measured } from "@/lib/research/measured";
import { colors } from "@/components/viz/palette";

type Mode = "interactive" | "measured" | "recorded";

const familyLabel: Record<string, string> = {
  removal: "Removal",
  missingObservations: "Missing observations",
  persistentFabrication: "Persistent fabrication",
  contradictory: "Contradictory (2.5–5 s)",
  correlatedErrors: "Correlated errors",
  transientNoise: "Transient noise",
  normal: "Normal",
  occlusion: "Occlusion",
  movingObject: "Moving objects",
};

export function S09Hmm() {
  const [mode, setMode] = useState<Mode>("interactive");
  const effects = measured.hmmByFamily.filter((h) => h.comparison === "A4-A2");
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="09 · Contribution B — temporal state estimation"
        accent="var(--color-temporal)"
        title="Temporal reasoning with an HMM"
        subtitle="Zoom into one cell of the grid, as a hidden Markov model. Each frame: predict with the transition model, weight by the new evidence, normalize."
        right={
          <div className="flex flex-col items-end gap-2">
            <Segmented<Mode>
              size="sm"
              ariaLabel="HMM view"
              value={mode}
              onChange={setMode}
              color={colors.temporal}
              options={[
                { value: "interactive", label: "Interactive filter" },
                { value: "measured", label: "Measured" },
                { value: "recorded", label: "Recorded replay" },
              ]}
            />
            {mode === "interactive" && <EvidenceBadge kind="illustrative" detail="forward filter (Rabiner 1989)" />}
            {mode === "measured" && <EvidenceBadge kind="measured" />}
            {mode === "recorded" && <EvidenceBadge kind="recorded" detail="scenario D, seed 42" />}
          </div>
        }
      />
      <div className={`mt-5 ${mode === "interactive" ? "" : "hidden"}`}>
        <TemporalInferenceModel />
      </div>
      {mode === "measured" && (
        <div className="mt-5 flex gap-5">
          <FigurePlate
            file="fig12_hmm_probability_timeline.png"
            title="CAD-HMM belief at three diagnostic regions: predicted (amber) vs filtered (purple) P(occ) vs ground truth"
            source={measuredFigureSource("fig12_hmm_probability_timeline", "test_persistent_fabrication_s4000, cav_00")}
            width={520}
            maxHeight={470}
          />
          <div className="flex flex-1 flex-col gap-3">
            <FigurePlate
              file="fig20_hmm_helps_hurts.png"
              title="Where the HMM helps and hurts (Δ AUROC / Δ FPR with 95% CIs)"
              source={measuredFigureSource("fig20_hmm_helps_hurts")}
              width={930}
              maxHeight={300}
            />
            <div className="rounded-xl border border-line bg-panel/80 p-3">
              <div className="mb-1.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-temporal">Adding the HMM to fused evidence (A4 − A2), per scenario family</div>
              <div className="grid grid-cols-3 gap-x-5 gap-y-1">
                {effects.map((e) => {
                  const lowerBetter = e.betterIf === "negative";
                  const good = lowerBetter ? e.hi < 0 : e.lo > 0;
                  const bad = lowerBetter ? e.lo > 0 : e.hi < 0;
                  const c = good ? colors.consistent : bad ? colors.anomaly : colors.inkMuted;
                  return (
                    <div key={e.family} className="flex items-baseline justify-between gap-2 border-b border-line py-0.5 text-[12.5px]">
                      <span className="text-ink-2">{familyLabel[e.family] ?? e.family}</span>
                      <span className="font-mono" style={{ color: c }} title={`95% CI [${e.lo}, ${e.hi}]`}>
                        {e.metric.startsWith("FPR") ? "FPR " : "AUROC "}
                        {e.delta > 0 ? "+" : ""}
                        {e.delta.toFixed(3)} {good ? "✓" : bad ? "✗" : "~"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[12px] text-ink-3">
                ✓ CI excludes 0 in the good direction · ~ inconclusive. Largest gain: removal (+0.104 AUROC). Using unobserved-cell memory as evidence instead drops A3 to AUROC 0.697.
              </p>
              <SourceNote kind="measuredPlot" source="research-data/measured/statistics/hmm_effect_by_family.csv · ablations/variants.csv (hmmMemoryEvidence)" className="mt-1" />
            </div>
          </div>
        </div>
      )}
      {mode === "recorded" && (
        <div className="mt-5 flex gap-5">
          <VideoPanel id="transientHmm" width={900} />
          <div className="flex flex-1 flex-col gap-3">
            <FigurePlate
              file="fig06_hmm_state_transition.png"
              title="Two-state HMM with transitions learned on the calibration split"
              source={measuredFigureSource("fig06_hmm_state_transition", "illustrative diagram with calibrated p01, p10")}
              width={545}
              kind="redrawn"
            />
            <div className="rounded-xl border border-line bg-panel/80 p-3 text-[13.5px] leading-snug text-ink-2">
              Learned per 0.1 s: P(Free→Occ) = {measured.calibrationParams.pFreeToOcc}, P(Occ→Free) = {measured.calibrationParams.pOccToFree}. Watch 1–3-frame ghost returns:
              strong memory damps them (transient-noise FPR −0.010 for A3 vs A1), but the same memory delays legitimate change.
              <SourceNote source="model_artifacts.json · hmm_effect_by_family.csv (A3−A1, transientNoise)" className="mt-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
