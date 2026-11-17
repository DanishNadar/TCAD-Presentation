"use client";
import { useState } from "react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { ConsistencyComparison } from "@/components/viz/ConsistencyComparison";
import { Segmented } from "@/components/ui/Controls";
import { FigurePlate, VideoPanel } from "@/components/ui/Media";
import { measuredFigureSource } from "@/lib/research/media";

type Mode = "explainer" | "implementation";

/** Paper component → our implementation (from the T-CAD results report §2, "Baseline reproduction"). */
const fidelity: [string, string, string][] = [
  ["Occupancy maps (free / occ / unknown)", "2-D ray-cast LiDAR; per-1° free sectors; buffered hulls of clustered returns", "simplified"],
  ["Occ ↔ Occ check, σ_occ", "free-vs-occupied cell conflicts; 8-connected regions < 1 m² ignored", "faithful logic, grid"],
  ["Perc ↔ Occ (spoof / remove)", "boxes over others' uncontested free space / occupied space with no box", "adapted to late fusion"],
  ["Temporal synchronisation", "tracker velocities shift occupied cells by v·dt; swept area → unknown", "faithful"],
  ["Attacks (ray casting, adversarial)", "bounded synthetic message-level phantom / removal", "not reproduced (by design)"],
];

export function S05Cad() {
  const [mode, setMode] = useState<Mode>("explainer");
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="05 · CAD (published method)"
        accent="var(--color-collab)"
        title="Understanding CAD: geometric consistency"
        subtitle="Vehicles share lightweight occupancy maps (~10 KB metadata each), synchronized to one timestamp via tracking. Two checks expose contradictions — no head-counting."
        right={
          <div className="flex flex-col items-end gap-2">
            <Segmented<Mode>
              size="sm"
              ariaLabel="CAD view"
              value={mode}
              onChange={setMode}
              options={[
                { value: "explainer", label: "Grid explainer" },
                { value: "implementation", label: "Our implementation" },
              ]}
            />
            <div className="flex flex-col items-end gap-1.5">
              <EvidenceBadge kind="published" detail="method" />
              {mode === "explainer" ? <EvidenceBadge kind="illustrative" detail="grid" /> : <EvidenceBadge kind="measured" detail="replay + fig05" />}
            </div>
          </div>
        }
      />
      <div className="mt-5">
        {mode === "explainer" ? (
          <ConsistencyComparison />
        ) : (
          <div className="flex gap-5">
            <VideoPanel id="contradictoryCad" width={840} />
            <div className="flex flex-1 flex-col gap-3">
              <FigurePlate
                file="fig05_cad_conflicts.png"
                title="CAD conflicts for a contradictory report at t = 6.6 s: occupancy conflict 8.2 m² + spoof 2.8 m² = 11.0 m² > threshold 10.0 m²"
                source={measuredFigureSource("fig05_cad_conflicts", "test_contradictory_s4000, ego cav_02, reporter cav_01")}
                width={588}
                maxHeight={232}
              />
              <div className="rounded-xl border border-line bg-panel/80 p-3">
                <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">Paper → our CAD-inspired baseline (A0)</div>
                <table className="w-full text-[11.5px] leading-tight">
                  <tbody>
                    {fidelity.map(([paper, ours, f]) => (
                      <tr key={paper} className="border-t border-line align-top">
                        <td className="py-[3px] pr-2 text-ink">{paper}</td>
                        <td className="py-[3px] pr-2 text-ink-2">{ours}</td>
                        <td className={`py-[3px] font-mono text-[11px] ${f.startsWith("not") ? "text-temporal" : "text-consistent"}`}>{f}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <SourceNote source="T-CAD docs/resultsReport.md §2 · src/tcad/models/cadBaseline.py" className="mt-1.5" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
