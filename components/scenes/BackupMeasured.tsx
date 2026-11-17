"use client";
/** Backup slides built from our measured T-CAD results (research-data/measured). */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { Segmented } from "@/components/ui/Controls";
import { FigurePlate, FigureThumb, VideoPanel } from "@/components/ui/Media";
import { LineChart } from "@/components/viz/charts";
import { colors } from "@/components/viz/palette";
import { measured, configNames, type ConfigId } from "@/lib/research/measured";
import { measuredFigureSource, videoCatalog, type VideoId } from "@/lib/research/media";

// Validated 4-series palette (dark surface): CVD ΔE ≥ 10.8, contrast ≥ 3:1.
const series: { config: ConfigId; color: string }[] = [
  { config: "A0", color: "#4f8cff" },
  { config: "A2", color: "#9a72f0" },
  { config: "A4", color: "#c47c08" },
  { config: "A5-LR", color: "#2fa37a" },
];

const experiments: { id: string; label: string; axis: string; figure?: string; note: string }[] = [
  { id: "R1_sensor_noise", label: "R1 · LiDAR noise", axis: "noise scale (× nominal)", figure: "fig10_fpr_vs_noise.png", note: "Adding the HMM to fusion (A4 − A2) improves AUROC at every noise level and cuts FPR more as noise grows (−0.074 at ×6)." },
  { id: "R2_missing", label: "R2 · Packet loss", axis: "packet-loss probability", figure: "fig16_missing_observations.png", note: "Packet loss erodes every method (A0 AUROC 0.85 → 0.77 at 80% loss). A4 keeps a small edge over A0 up to 60% loss, then falls behind." },
  { id: "R3_observers", label: "R3 · # CAVs", axis: "number of collaborating CAVs", figure: "fig11_recall_vs_observers.png", note: "With only 2 CAVs there is little to corroborate against: every method's recall collapses." },
  { id: "R4_temporal", label: "R4 · Fabrication length", axis: "fabrication duration (s)", figure: "fig14_detection_delay_tradeoff.png", note: "HMM hurts for 0.1–0.3 s contradictions: short events are absorbed by the prior." },
  { id: "R5_moving", label: "R5 · Moving traffic", axis: "max traffic speed (m/s)", figure: "fig17_moving_objects.png", note: "Legitimate occupancy change: at 8 m/s the fused/temporal configs raise FPR (A4 7.9% vs A0 5.5%); at 4 m/s they lower it (2.1% vs 5.2%)." },
  { id: "R6_localization", label: "R6 · Localization", axis: "position σ (m)", note: "The largest weakness found: pose error σ ≥ 0.2 m creates spurious conflicts for every method (A0 FPR 3.5% → 47% at σ = 0.4 m)." },
  { id: "R8_delay", label: "R8 · Network delay", axis: "base delay (s)", note: "Delay ≥ 0.1 s erodes all methods (A0 AUROC 0.85 → 0.68 at 0.4 s); A4 stays at or above A0 at every delay." },
];
type RMetric = "auroc" | "tpr" | "fpr";

export function SRobustness() {
  const [exp, setExp] = useState(experiments[0].id);
  const [metric, setMetric] = useState<RMetric>("auroc");
  const e = experiments.find((x) => x.id === exp)!;
  const rows = measured.robustness.filter((r) => r.experiment === exp && r.variant === "main");
  const xs = Array.from(new Set(rows.map((r) => r.value as number))).sort((a, b) => a - b);
  const lines = series.map((s) => ({
    key: s.config,
    label: s.config,
    color: s.color,
    points: xs.map((x) => {
      const r = rows.find((q) => q.value === x && q.config === s.config);
      return { x, y: r ? (r[metric] as number) : NaN };
    }).filter((p) => !Number.isNaN(p.y)),
  }));
  const all = lines.flatMap((l) => l.points.map((p) => p.y));
  const yMin = metric === "fpr" ? 0 : Math.max(0, Math.floor((Math.min(...all) - 0.05) * 10) / 10);
  const yMax = metric === "fpr" ? Math.max(0.1, Math.ceil(Math.max(...all) * 20) / 20) : 1;
  const runs = rows[0]?.runs;
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader kicker="Backup · Robustness sweeps" accent="var(--color-consistent)" title="How each method degrades (R1–R8)" right={<EvidenceBadge kind="measured" detail={`${runs ?? "–"} runs per point`} />} />
      <div className="mt-5 flex items-center gap-3">
        <Segmented size="sm" ariaLabel="Experiment" value={exp} onChange={setExp} color={colors.consistent} options={experiments.map((x) => ({ value: x.id, label: x.label }))} />
        <Segmented<RMetric> size="sm" ariaLabel="Metric" value={metric} onChange={setMetric} color={colors.temporal} options={[{ value: "auroc", label: "AUROC" }, { value: "tpr", label: "TPR" }, { value: "fpr", label: "FPR" }]} />
      </div>
      <div className="mt-4 flex gap-5">
        <div className="rounded-xl border border-line bg-panel/80 p-3">
          <LineChart
            width={760}
            height={380}
            xDomain={[xs[0], xs[xs.length - 1]]}
            yDomain={[yMin, yMax]}
            xTicks={xs}
            yTicks={[yMin, (yMin + yMax) / 2, yMax]}
            xLabel={e.axis}
            yLabel={metric.toUpperCase()}
            formatX={(v) => `${+v.toFixed(2)}`}
            formatY={(v) => (metric === "auroc" ? v.toFixed(2) : `${(v * 100).toFixed(0)}%`)}
            series={lines}
            markers={lines.flatMap((l) => l.points.map((p) => ({ x: p.x, y: p.y, color: l.color })))}
          />
          <div className="mt-1 flex gap-4 px-2 text-[12.5px] text-ink-2">
            {series.map((s) => (
              <span key={s.config} className="inline-flex items-center gap-1.5">
                <span className="h-[3px] w-4 rounded" style={{ background: s.color }} />
                {s.config} <span className="text-ink-3">{configNames[s.config]}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 max-w-[740px] text-[13.5px] leading-snug text-ink-2">{e.note}</p>
          <SourceNote kind="measuredPlot" source={`research-data/measured/robustness.csv (${exp}, variant main) — CIs in robustness/${exp.split("_")[0]}_*.csv`} className="mt-1" />
        </div>
        <div className="flex-1">
          {e.figure ? (
            <FigurePlate file={e.figure} title={`Repository figure for ${e.label}`} source={measuredFigureSource(e.figure.replace(".png", ""))} width={690} maxHeight={330} />
          ) : (
            <div className="rounded-xl border border-dashed border-line p-6 text-[14px] text-ink-3">No dedicated repository figure for this sweep; the chart is drawn directly from robustness.csv.</div>
          )}
          <FigurePlate file="fig18_runtime_scaling.png" title="R10 · p95 runtime vs #CAVs and grid size" source={measuredFigureSource("fig18_runtime_scaling", "R10")} width={690} maxHeight={170} />
        </div>
      </div>
    </div>
  );
}

const statusColor = (s: string) => (s.startsWith("SUPPORTED") ? colors.consistent : s.startsWith("NEGATIVE") ? colors.anomaly : s.startsWith("MIXED") || s.startsWith("SMALL") || s.startsWith("LIMITED") ? colors.temporal : colors.inkMuted);
/** Short chip text: the leading verdict word(s) before any qualifier. */
const chip = (s: string) => (s === "SEE TEXT" ? "DESCRIPTIVE" : s.split(/[ (]/)[0] === "SMALL" ? "SMALL EFFECT" : s.split(/[ (]/)[0] === "LIMITED" ? "LIMITED" : s.split(/[ (]/)[0]);

export function SResearchQuestions() {
  const [open, setOpen] = useState(0);
  const qs = measured.researchQuestions;
  const tally = useMemo(() => {
    const t: Record<string, number> = {};
    qs.forEach((q) => {
      const k = chip(q.status);
      t[k] = (t[k] ?? 0) + 1;
    });
    return t;
  }, [qs]);
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="Backup · Research questions"
        accent="var(--color-consistent)"
        title="Fifteen questions, answered by the data"
        subtitle={`Verdicts from 95% scenario-bootstrap CIs, as written by the analysis script: ${Object.entries(tally).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(" · ")}.`}
        right={<EvidenceBadge kind="measured" />}
      />
      <div className="mt-5 flex gap-6">
        <div className="flex w-[640px] flex-col gap-1.5" data-capture-keys>
          {qs.map((q, i) => (
            <button
              key={q.question}
              onClick={() => setOpen(i)}
              className={`flex items-start gap-2 rounded-lg border px-3 py-1.5 text-left text-[13.5px] leading-snug transition-colors ${open === i ? "border-ink-3 bg-panel-2 text-ink" : "border-line bg-panel/60 text-ink-2 hover:text-ink"}`}
            >
              <span className="mt-0.5 shrink-0 rounded px-1.5 font-mono text-[10px]" style={{ color: statusColor(q.status), border: `1px solid ${statusColor(q.status)}66` }}>
                {chip(q.status)}
              </span>
              {q.question}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={open} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 rounded-2xl border border-line bg-panel/80 p-6">
            <div className="font-mono text-[13px]" style={{ color: statusColor(qs[open].status) }}>
              {qs[open].status}
            </div>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight">{qs[open].question}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{qs[open].answer}</p>
            <SourceNote source={`research-data/measured/statistics/research_questions.csv ← ${qs[open].evidence}`} className="mt-3" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function SFigureGallery() {
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader kicker="Backup · Figure gallery" accent="var(--color-consistent)" title="All 20 repository figures + 3 concept diagrams" subtitle="Click any figure to enlarge. Kind comes from figure_manifest.csv: measured plot, illustrative (calibrated parameters), or architecture diagram." right={<EvidenceBadge kind="measured" detail="+ diagrams" />} />
      <div className="mt-5 grid grid-cols-6 gap-2.5">
        {measured.figures.map((f) => (
          <FigureThumb key={f.id} file={f.file} title={`${f.id.slice(0, 5).replace("fig", "Fig ")} · ${f.description}`} kind={f.kind} width={233} height={104} />
        ))}
        {[
          ["/diagrams/collaborative_perception.svg", "Collaborative perception & occlusion"],
          ["/diagrams/cad_tcad_architecture.svg", "From CAD to T-CAD"],
          ["/diagrams/temporal_filtering.svg", "Temporal filtering (synthetic numbers)"],
        ].map(([f, t]) => (
          <FigureThumb key={f} file={f} title={t} kind="concept" width={233} height={104} />
        ))}
      </div>
      <SourceNote source="research-data/measured/figure_manifest.csv · public/figures/*.png (resized copies of results/figures) · research-data/diagrams/*.svg (handoff concept diagrams)" className="mt-3" />
    </div>
  );
}

const replayOrder: VideoId[] = ["occlusionWorld", "occlusionLidar", "contradictoryOccupancy", "contradictoryCad", "contradictoryBayes", "contradictoryTcad", "contradictoryGt", "transientHmm", "correlatedBayes"];

export function SReplays() {
  const [sel, setSel] = useState<VideoId>("contradictoryTcad");
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader kicker="Backup · Simulator replays" accent="#2dd4bf" title="Recorded runs of our simulator" subtitle="Rendered with the T-CAD repository's replayExperiment.py from headless recordings (seed 42, calibrated model, validation thresholds)." right={<EvidenceBadge kind="recorded" detail="demonstrations, not metrics" />} />
      <div className="mt-5 flex gap-5">
        <VideoPanel key={sel} id={sel} width={960} />
        <div className="flex flex-1 flex-col gap-1.5" data-capture-keys>
          {replayOrder.map((id) => (
            <button
              key={id}
              onClick={() => setSel(id)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${sel === id ? "border-[#2dd4bf] bg-[#2dd4bf]/10" : "border-line bg-panel/60 hover:border-ink-3"}`}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#2dd4bf]">
                {videoCatalog[id].scenario} · {videoCatalog[id].view}
              </div>
              <div className="text-[13px] leading-snug text-ink">{videoCatalog[id].title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
