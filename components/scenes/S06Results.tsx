"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { HelpCircle, CheckCircle2, CircleSlash } from "lucide-react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { Segmented } from "@/components/ui/Controls";
import { HBarChart } from "@/components/viz/charts";
import { colors } from "@/components/viz/palette";
import { headlineClaims, table3, table3SourceFile, paperMetricDefinitions, cadTemporalFacts } from "@/lib/research/publishedResults";

type Metric = "attackSucc" | "defenseSucc" | "tpr" | "fpr" | "iou" | "confidence" | "apDrop";

const metricInfo: Record<Metric, { label: string; color: string; def: string }> = {
  attackSucc: { label: "Attack success", color: colors.anomaly, def: paperMetricDefinitions[0].def },
  defenseSucc: { label: "CAD region detection (“Defense Succ.”)", color: colors.collab, def: paperMetricDefinitions[1].def },
  tpr: { label: "CAD TPR (whole frame)", color: colors.collab, def: paperMetricDefinitions[2].def },
  fpr: { label: "CAD FPR (whole frame)", color: colors.collab, def: "False-positive rate over whole LiDAR frames at AUC-selected thresholds." },
  iou: { label: "Attack IoU", color: colors.anomaly, def: "IoU between the attack target and the best-matching predicted box (higher = spoof landed / removal failed)." },
  confidence: { label: "Attack confidence score", color: colors.anomaly, def: "Detector confidence of the best-matching box for the target." },
  apDrop: { label: "Benign AP drop (−ΔAP)", color: colors.anomaly, def: "Drop in average precision on non-target objects caused by the attack; small values mean a stealthy attack." },
};
const unitFor = (m: Metric) => (m === "iou" || m === "confidence" ? "" : "%");
const maxFor = (m: Metric) => (m === "fpr" ? 12 : m === "iou" || m === "confidence" ? 1 : m === "apDrop" ? 70 : 100);

export function S06Results() {
  const [metric, setMetric] = useState<Metric>("defenseSucc");
  const info = metricInfo[metric];
  const data = table3.map((r) => ({
    key: r.setting,
    label: r.setting,
    value: metric === "apDrop" ? (r.deltaAp === null ? null : -r.deltaAp) : r[metric],
    color: info.color,
    muted: r.isPriorWork,
    note: `${r.setting} · ${r.fusion} fusion, ${r.goal}${r.isPriorWork ? " · prior attack [72], shown for comparison" : ""} — attack ${r.attackSucc ?? "–"}%, IoU ${r.iou ?? "–"}, ΔAP ${r.deltaAp ?? "–"}%, region detection ${r.defenseSucc ?? "not reported"}${r.defenseSucc !== null ? "%" : ""}, frame TPR ${r.tpr ?? "–"}${r.tpr !== null ? "%" : ""}, frame FPR ${r.fpr ?? "–"}${r.fpr !== null ? "%" : ""}`,
  }));

  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="06 · Published results"
        accent="var(--color-collab)"
        title="What the original paper demonstrates"
        subtitle="All values below are reported by Zhang et al. (2024) on Adv-OPV2V (simulated) unless noted — not measured by us."
        right={<EvidenceBadge kind="published" detail="Abstract · Table 3 · §6.4" />}
      />

      <div className="mt-6 grid grid-cols-4 gap-4">
        {headlineClaims.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="rounded-xl border border-line bg-panel/80 p-4"
            title={`Source: ${c.where} → research-data/published/published_headline_metrics.csv`}
          >
            <div className="font-display text-[40px] font-semibold leading-none" style={{ color: c.id === "attack" ? colors.anomaly : colors.collab }}>
              {c.value}
            </div>
            <div className="mt-1.5 text-[16px] text-ink">{c.label}</div>
            <div className="mt-1 text-[13px] leading-snug text-ink-3">{c.context}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex gap-6">
        <div className="rounded-xl border border-line bg-panel/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">Table 3 · Adv-OPV2V</span>
            <Segmented<Metric>
              size="sm"
              ariaLabel="Metric"
              value={metric}
              onChange={setMetric}
              color={info.color}
              options={[
                { value: "attackSucc", label: "Attack succ." },
                { value: "iou", label: "IoU" },
                { value: "apDrop", label: "AP drop" },
                { value: "defenseSucc", label: "Region det." },
                { value: "tpr", label: "Frame TPR" },
                { value: "fpr", label: "Frame FPR" },
              ]}
            />
          </div>
          <HBarChart
            data={data}
            max={maxFor(metric)}
            unit={unitFor(metric)}
            decimals={unitFor(metric) ? 1 : 2}
            width={760}
            rowHeight={33}
            labelWidth={190}
            marker={metric === "fpr" ? { value: 3, label: "3% (abstract)" } : undefined}
          />
          <p className="mt-2 max-w-[740px] text-[13px] leading-snug text-ink-3">
            <span className="text-ink-2">{info.label}:</span> {info.def} Gray rows = prior attack [72]. “n/a” = not reported in the paper.
          </p>
          <SourceNote kind="publishedChart" source={`Zhang et al. 2024, Table 3 → ${table3SourceFile} (verbatim)`} className="mt-1" />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="rounded-xl border border-line bg-panel/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-[15px] font-medium text-consistent">
              <CheckCircle2 size={16} /> Demonstrated
            </div>
            <ul className="space-y-1.5 text-[14px] leading-snug text-ink-2">
              <li>Fabrication attacks are highly effective against early, intermediate and late fusion.</li>
              <li>Geometric consistency detects ~81–84% of attacked regions at low FPR (sync is key: TPR 35%→60% spoof).</li>
              <li>CAD runs at ~92 ms end-to-end and holds up in real-vehicle tests.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-panel/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-[15px] font-medium text-temporal">
              <CircleSlash size={16} /> Not established
            </div>
            <ul className="space-y-1.5 text-[14px] leading-snug text-ink-2">
              <li>Frame-level removal TPR is only 38–43% (benign faults, ~50 m map range).</li>
              <li>No benign observer of the region at that instant → no conflict to detect.</li>
              <li>{cadTemporalFacts[2]}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-panel-2/60 p-4 text-[13px] leading-snug text-ink-3">
            <span className="text-ink-2">CAD already uses time for alignment:</span> multi-object tracking estimates motion so occupancy maps from different
            vehicles are synchronized to one timestamp.
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-4 flex items-center gap-3 font-display text-[24px] font-medium text-temporal"
      >
        <HelpCircle size={24} /> What changes when perception evidence evolves over time?
      </motion.div>
    </div>
  );
}
