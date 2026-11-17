"use client";
import { measured } from "@/lib/research/measured";
import { HBarChart } from "./charts";
import { colors } from "./palette";
import { SourceNote } from "@/components/ui/EvidenceBadge";
import { FigurePlate } from "@/components/ui/Media";
import { measuredFigureSource } from "@/lib/research/media";

const modelLabels: Record<string, string> = {
  bayesCalibrated: "Bayes, calibrated",
  bayesNominal: "Bayes, nominal model",
  bayesNaive: "Bayes, naive independence",
  hmmCalibrated: "HMM, calibrated",
  singleEgo: "Single ego map",
};

/** Measured calibration evidence for Scene 8 (our experiment). */
export function MeasuredCalibration() {
  const p = measured.calibrationParams;
  const bins = p.rangeBinsM;
  const label = (i: number) => `${bins[i]}–${Math.round(bins[i + 1])} m`;
  // table[bin][z][x]: z (0 unknown, 1 free, 2 occupied); x (0 free, 1 occupied)
  const hit = p.likelihoodTable.map((b, i) => ({ key: `h${i}`, label: label(i), value: b[2][1] * 100, color: colors.sensor, note: `P(occ | Occ) = ${b[2][1]} · P(unknown | Occ) = ${b[0][1]}` }));
  const freeOk = p.likelihoodTable.map((b, i) => ({ key: `f${i}`, label: label(i), value: b[1][0] * 100, color: colors.consistent, note: `P(free | Free) = ${b[1][0]} · P(occ | Free) = ${b[2][0]}` }));
  const rows = [...measured.calibrationMetrics].sort((a, b) => a.ece - b.ece);
  return (
    <div className="grid grid-cols-[520px_470px_1fr] gap-5">
      <div className="rounded-xl border border-line bg-panel/80 p-3">
        <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-prob">Calibrated likelihoods by range</div>
        <div className="flex gap-3">
          <div>
            <div className="text-[12.5px] text-ink-2">P(Z = occ | X = Occ)</div>
            <HBarChart data={hit} max={100} width={245} rowHeight={22} labelWidth={72} />
          </div>
          <div>
            <div className="text-[12.5px] text-ink-2">P(Z = free | X = Free)</div>
            <HBarChart data={freeOk} max={100} width={245} rowHeight={22} labelWidth={72} />
          </div>
        </div>
        <p className="text-[12px] leading-snug text-ink-3">
          Detection of occupied space collapses with range (most far cells read <i>unknown</i>), so one global “reliability r” is wrong. Prior P(Occ) = {p.priorOccupied}.
        </p>
        <SourceNote kind="measuredPlot" source="demoCContradictory/model_artifacts.json → observation_model.table (calibration split)" className="mt-1" />
      </div>
      <div className="rounded-xl border border-line bg-panel/80 p-3">
        <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-prob">Occupancy calibration on test cells</div>
        <table className="w-full font-mono text-[12.5px]">
          <thead>
            <tr className="text-[11px] text-ink-3">
              <th className="text-left font-normal">model</th>
              <th className="text-right font-normal">ECE</th>
              <th className="text-right font-normal">Brier</th>
              <th className="text-right font-normal">NLL</th>
              <th className="text-right font-normal">acc.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.model} className="border-t border-line text-ink">
                <td className="py-[3px] text-ink-2">{modelLabels[r.model] ?? r.model}</td>
                <td className="text-right" style={{ color: r.model === "bayesCalibrated" ? colors.consistent : undefined }}>{r.ece.toFixed(4)}</td>
                <td className="text-right">{r.brier.toFixed(4)}</td>
                <td className="text-right">{r.nll.toFixed(4)}</td>
                <td className="text-right">{(r.accuracy * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
          Calibration cuts fused-belief ECE ~5× vs the nominal model (0.0016 vs 0.0077). Single-ego row is scored on fewer cells (n = 2.4×10⁸ vs 4.4×10⁸), so it is not a like-for-like winner.
        </p>
        <SourceNote kind="measuredPlot" source="research-data/measured/calibration_metrics.csv" className="mt-1" />
      </div>
      <FigurePlate
        file="fig15_calibration_reliability.png"
        title="Reliability diagram: calibrated vs nominal posterior"
        source={measuredFigureSource("fig15_calibration_reliability")}
        width={395}
        maxHeight={170}
      />
    </div>
  );
}
