"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ablations, pipelineComponents } from "@/lib/research/implementationStatus";
import { measured, pct } from "@/lib/research/measured";
import { CadArchitecture } from "./CadArchitecture";
import { colors } from "./palette";
import { SourceNote } from "@/components/ui/EvidenceBadge";

const directionColor = (d: string) => (d === "improves" ? colors.consistent : d === "worsens" ? colors.anomaly : colors.inkMuted);

export function AblationSelector() {
  const [selected, setSelected] = useState("A0");
  const cfg = ablations.find((a) => a.id === selected)!;
  const enabled = new Set(cfg.components);
  const m = cfg.measuredId ? measured.report[cfg.measuredId] : null;
  const vsA0 = cfg.measuredId && cfg.measuredId !== "A0" ? measured.comparisons.filter((c) => c.config === cfg.measuredId && ["auroc", "tpr", "fpr"].includes(c.metric)) : [];

  return (
    <div>
      <div className="flex gap-2" role="tablist" aria-label="Ablation configuration">
        {ablations.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={a.id === selected}
            onClick={() => setSelected(a.id)}
            className={`flex-1 rounded-xl border px-3 py-1.5 text-left transition-colors ${
              a.id === selected ? "border-temporal bg-temporal/10" : "border-line bg-panel/70 hover:border-ink-3"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[15px]" style={{ color: a.id === selected ? colors.temporal : colors.ink2 }}>
                {a.id}
              </span>
              {a.measuredId && <span className="font-mono text-[11px] text-consistent">{measured.report[a.measuredId].auroc.est.toFixed(3)}</span>}
            </div>
            <div className="text-[12.5px] leading-tight text-ink">{a.name}</div>
          </button>
        ))}
      </div>

      <div className="mt-2.5 rounded-xl border border-line bg-panel/50 px-2 pt-2">
        <CadArchitecture enabled={enabled} showStatus width={1080} />
      </div>

      <div className="mt-2.5 flex gap-5">
        <table className="border-separate border-spacing-0 font-mono text-[12px]">
          <thead>
            <tr>
              <th className="pr-3 text-left font-normal text-ink-3">config</th>
              {pipelineComponents.map((p) => (
                <th key={p.id} className="w-[62px] px-1 pb-1 text-center align-bottom font-normal leading-tight" style={{ color: colors[p.color as keyof typeof colors] }}>
                  {p.label.replace(" check", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ablations.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a.id)}
                className="cursor-pointer"
                style={{ background: a.id === selected ? "color-mix(in srgb, var(--color-temporal) 10%, transparent)" : undefined }}
              >
                <td className="py-[2px] pr-3 text-ink">{a.id}</td>
                {pipelineComponents.map((p) => (
                  <td key={p.id} className="text-center">
                    {a.components.includes(p.id) ? <span style={{ color: colors[p.color as keyof typeof colors] }}>●</span> : <span className="text-line">○</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 rounded-xl border border-line bg-panel/80 px-4 py-2.5"
          >
            <div className="font-display text-[21px] font-medium">
              <span className="text-temporal">{cfg.id}</span> · {cfg.name}
            </div>
            <div className="mt-0.5 text-[13.5px] text-ink-2">{cfg.implementationNote}</div>
            {m ? (
              <>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["AUROC", m.auroc, (v: number) => v.toFixed(3)],
                      ["TPR @ frozen τ", m.tpr, (v: number) => pct(v)],
                      ["FPR @ frozen τ", m.fpr, (v: number) => pct(v)],
                    ] as const
                  ).map(([label, ci, f]) => (
                    <div key={label} className="rounded-lg bg-panel-2 px-2.5 py-1.5">
                      <div className="text-[11px] text-ink-3">{label}</div>
                      <div className="font-mono text-[18px] text-ink">{f(ci.est)}</div>
                      <div className="font-mono text-[10.5px] text-ink-3">
                        [{f(ci.lo)}, {f(ci.hi)}]
                      </div>
                    </div>
                  ))}
                </div>
                {vsA0.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[11.5px]">
                    <span className="text-ink-3">vs A0:</span>
                    {vsA0.map((c) => (
                      <span key={c.metric} style={{ color: directionColor(c.metric === "fpr" ? (c.direction === "worsens" ? "worsens" : c.direction) : c.direction) }}>
                        {c.metric.toUpperCase()} {c.diff > 0 ? "+" : ""}
                        {c.diff.toFixed(3)} {c.direction === "inconclusive" ? "~" : c.direction === "improves" ? "▲" : "▼"} {c.seedsBetter}/{c.seedsTotal}
                      </span>
                    ))}
                  </div>
                )}
                <SourceNote
                  source={`confidence_intervals.csv · model_comparisons.csv · n = ${m.auroc.nUnits} scenarios, ${m.auroc.nRows.toLocaleString()} reports`}
                  className="mt-1"
                />
              </>
            ) : (
              <p className="mt-2 text-[13.5px] text-ink-3">Not evaluated — reference row only.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
