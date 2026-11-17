"use client";
import { useState } from "react";
import { measured, configNames, type ConfigId } from "@/lib/research/measured";
import { SourceNote } from "@/components/ui/EvidenceBadge";
import { FigurePlate, VideoPanel } from "@/components/ui/Media";
import { Segmented } from "@/components/ui/Controls";
import { measuredFigureSource } from "@/lib/research/media";
import { colors } from "./palette";

/** Scene 11 measured mode: what happened at the episode level in our test split. */
export function MeasuredEvents() {
  const [video, setVideo] = useState<"contradictoryTcad" | "contradictoryGt">("contradictoryTcad");
  const cfgs = measured.configs;
  const best = (f: (c: ConfigId) => number, lowerBetter = false) => {
    const vals = cfgs.map(f);
    return lowerBetter ? Math.min(...vals) : Math.max(...vals);
  };
  const bestDet = best((c) => measured.events[c].detectionRate);
  const bestDelay = best((c) => measured.events[c].meanDelayS, true);
  const bestFa = best((c) => measured.benignEvents[c].falseAlarmRate, true);
  return (
    <div className="flex gap-5">
      <div className="flex w-[700px] flex-col gap-2">
        <Segmented
          size="sm"
          ariaLabel="Replay view"
          value={video}
          onChange={setVideo}
          color="#2dd4bf"
          options={[
            { value: "contradictoryTcad", label: "T-CAD view" },
            { value: "contradictoryGt", label: "vs ground truth" },
          ]}
        />
        <VideoPanel key={video} id={video} width={700} />

      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="rounded-xl border border-line bg-panel/80 p-3">
          <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-anomaly">Episode level · test split</div>
          <table className="w-full font-mono text-[13px]">
            <thead>
              <tr className="text-[11px] text-ink-3">
                <th className="text-left font-normal">config</th>
                <th className="text-right font-normal">attacks caught</th>
                <th className="text-right font-normal">mean delay</th>
                <th className="text-right font-normal">median</th>
                <th className="text-right font-normal">benign faults alarmed</th>
              </tr>
            </thead>
            <tbody>
              {cfgs.map((c) => {
                const e = measured.events[c];
                const b = measured.benignEvents[c];
                return (
                  <tr key={c} className="border-t border-line text-ink">
                    <td className="py-[3px]">
                      {c} <span className="font-sans text-[11.5px] text-ink-3">{configNames[c]}</span>
                    </td>
                    <td className="text-right" style={{ color: e.detectionRate === bestDet ? colors.consistent : undefined }}>
                      {(e.detectionRate * 100).toFixed(1)}%
                    </td>
                    <td className="text-right" style={{ color: e.meanDelayS === bestDelay ? colors.consistent : undefined }}>
                      {e.meanDelayS.toFixed(2)} s
                    </td>
                    <td className="text-right">{e.medianDelayS.toFixed(1)} s</td>
                    <td className="text-right" style={{ color: b.falseAlarmRate === bestFa ? colors.consistent : undefined }}>
                      {(b.falseAlarmRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">
            {measured.events.A0.episodes} contradictory-report episodes; {measured.benignEvents.A0.episodes} benign fault episodes. Temporal configs (A3, A4) wait ~0.1 s longer
            than A0 on average — the delay cost the illustrative demo predicts. A3 has the fewest benign false alarms (24.8%); A5-LR is fastest and catches all 60 but alarms on 33% of benign faults.
          </p>
          <SourceNote kind="measuredPlot" source="research-data/measured/ablations/events_summary.csv · benign_events_summary.csv" className="mt-1" />
        </div>
        <FigurePlate
          file="fig14_detection_delay_tradeoff.png"
          title="Detection rate vs delay trade-off (ablation test + R4 fabrication-duration sweep)"
          source={measuredFigureSource("fig14_detection_delay_tradeoff", "ablation-test, R4")}
          width={746}
          maxHeight={236}
        />
      </div>
    </div>
  );
}
