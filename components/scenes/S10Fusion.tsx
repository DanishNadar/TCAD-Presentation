"use client";
import { useState } from "react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { MultiVehicleFusion } from "@/components/viz/MultiVehicleFusion";
import { Segmented } from "@/components/ui/Controls";
import { VideoPanel } from "@/components/ui/Media";
import { ForestPlot } from "@/components/viz/charts";
import { measured, configNames, type ConfigId } from "@/lib/research/measured";
import { colors } from "@/components/viz/palette";

type Mode = "interactive" | "measured";

export function S10Fusion() {
  const [mode, setMode] = useState<Mode>("interactive");
  const v = measured.variants;
  const rows = (["A2", "A4"] as ConfigId[]).flatMap((c) => [
    { key: `${c}-main`, label: `${c} tempered (ρ)`, sub: configNames[c], est: v.main[c]!.est, lo: v.main[c]!.lo, hi: v.main[c]!.hi, color: colors.prob, emphasis: true },
    { key: `${c}-naive`, label: `${c} naive indep.`, est: v.naiveIndependence[c]!.est, lo: v.naiveIndependence[c]!.lo, hi: v.naiveIndependence[c]!.hi, color: colors.unknown },
  ]);
  const r7 = measured.robustness.filter((r) => r.experiment === "R7_correlation");
  const cal = Object.fromEntries(measured.calibrationMetrics.map((m) => [m.model, m]));
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="10 · Multi-vehicle evidence fusion"
        accent="var(--color-prob)"
        title="Probabilistic fusion — and its assumptions"
        subtitle="Three vehicles report on the same region with different reliability. Independent evidence adds in log-odds; correlated evidence must not."
        right={
          <div className="flex flex-col items-end gap-2">
            <Segmented<Mode>
              size="sm"
              ariaLabel="Fusion view"
              value={mode}
              onChange={setMode}
              color={mode === "interactive" ? colors.prob : colors.consistent}
              options={[
                { value: "interactive", label: "Interactive" },
                { value: "measured", label: "Measured + replay" },
              ]}
            />
            {mode === "interactive" ? <EvidenceBadge kind="illustrative" /> : <EvidenceBadge kind="measured" detail="+ recorded replay" />}
          </div>
        }
      />
      <div className={`mt-6 ${mode === "interactive" ? "" : "hidden"}`}>
        <MultiVehicleFusion />
      </div>
      {mode === "measured" && (
        <div className="mt-5 flex gap-5">
          <div className="flex w-[760px] flex-col gap-3">
            <VideoPanel id="correlatedBayes" width={760} />
            <div className="rounded-xl border border-line bg-panel/80 px-4 py-3">
              <div className="flex items-baseline gap-3">
                <span className="whitespace-nowrap font-display text-[38px] font-semibold leading-none text-prob">ρ = {measured.calibrationParams.rho.toFixed(2)}</span>
                <span className="text-[14px] leading-snug text-ink-2">
                  measured inter-source error correlation on the calibration split — vehicles' mistakes are far from independent, so naive ∏ P(Z_i|X) over-counts.
                </span>
              </div>
              <SourceNote source="demoCContradictory/model_artifacts.json → observation_model.rho (stored run; results report text quotes 0.672, current repo calibration 0.665)" className="mt-1" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="rounded-xl border border-line bg-panel/80 p-3">
              <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-prob">AUROC: ρ-tempered vs naive-independence fusion</div>
              <ForestPlot rows={rows} domain={[0.8, 0.95]} width={640} rowHeight={33} labelWidth={180} />
              <p className="text-[12.5px] leading-snug text-ink-2">
                Ignoring correlation lowers A2 by 0.015 AUROC; A4 barely moves (temporal filtering absorbs part of it). Belief calibration: naive-independence ECE{" "}
                {cal.bayesNaive.ece.toFixed(4)} vs tempered {cal.bayesCalibrated.ece.toFixed(4)}.
              </p>
              <SourceNote kind="measuredPlot" source="research-data/measured/ablations/variants.csv (main, naive_independence) · calibration_metrics.csv" className="mt-1" />
            </div>
            <div className="rounded-xl border border-line bg-panel/80 p-3">
              <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-temporal">R7 · benign disturbance — false-positive rate (no attacks)</div>
              <table className="w-full font-mono text-[12.5px]">
                <thead>
                  <tr className="text-[11px] text-ink-3">
                    <th className="text-left font-normal">disturbance</th>
                    {(["A0", "A2", "A3", "A4", "A5", "A5-LR"] as ConfigId[]).map((c) => (
                      <th key={c} className="text-right font-normal">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["independent", "shared"].map((mode) => (
                    <tr key={mode} className="border-t border-line text-ink">
                      <td className="py-1 text-ink-2">{mode === "shared" ? "shared (correlated)" : "independent"}</td>
                      {(["A0", "A2", "A3", "A4", "A5", "A5-LR"] as ConfigId[]).map((c) => {
                        const row = r7.find((r) => r.value === mode && r.config === c);
                        return (
                          <td key={c} className="text-right">
                            {row ? `${(row.fpr * 100).toFixed(1)}%` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">
                Fusion configs (A2, A4) raise false alarms vs CAD (A0) under disturbances; the HMM (A4 vs A2) reduces them slightly. Honest result: fusion is not a free win.
              </p>
              <SourceNote kind="measuredPlot" source="research-data/measured/robustness.csv (R7_correlation, 15 runs per cell)" className="mt-1" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
