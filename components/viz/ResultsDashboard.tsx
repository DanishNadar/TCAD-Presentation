"use client";
/**
 * Scene 13 results dashboard. Reads OUR measured results from the endpoint
 * /results/tcad-results.json (contract v1.0). With no experiments it shows a
 * polished "Awaiting verified measurements" protocol view — never placeholder numbers.
 */
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FileClock, FlaskConical } from "lucide-react";
import { emptyEndpoint, endpointMetricSpecs, validateEndpoint, type EndpointMetric, type ResultsEndpoint } from "@/lib/research/experimentResults";
import { measured, configNames, type ConfigId } from "@/lib/research/measured";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { Segmented } from "@/components/ui/Controls";
import { ForestPlot, HBarChart } from "./charts";
import { colors } from "./palette";
import { assetPath } from "@/lib/research/media";

const configColor = (c: string) =>
  c === "A0" ? colors.collab : c === "A5-LR" ? colors.consistent : c === "A3" || c === "A4" ? colors.temporal : c === "A5" ? colors.anomaly : colors.prob;

export function ResultsDashboard() {
  const [endpoint, setEndpoint] = useState<ResultsEndpoint>(emptyEndpoint);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch(assetPath("/results/tcad-results.json"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setEndpoint(validateEndpoint(json)))
      .catch(() => setEndpoint(emptyEndpoint))
      .finally(() => setLoaded(true));
  }, []);
  if (!loaded) return <div className="text-ink-3">Loading /results/tcad-results.json…</div>;
  return endpoint.status === "measured" ? <MeasuredView endpoint={endpoint} /> : <AwaitingView />;
}

function MeasuredView({ endpoint }: { endpoint: ResultsEndpoint }) {
  const [metric, setMetric] = useState<EndpointMetric>("rocAuc");
  const spec = endpointMetricSpecs.find((m) => m.key === metric)!;
  const exps = endpoint.experiments;
  const a0 = exps.find((e) => e.configuration === "A0");
  const isPct = spec.unit === "%";
  const values = exps.flatMap((e) => [e.metrics[metric], ...(e.ci95?.[metric] ?? [])]).filter((v): v is number => typeof v === "number");
  const lo = Math.max(0, Math.floor((Math.min(...values) - 0.02) * 20) / 20);
  const hi = Math.min(1, Math.ceil((Math.max(...values) + 0.02) * 20) / 20);
  const rows = exps
    .filter((e) => typeof e.metrics[metric] === "number")
    .map((e) => ({
      key: e.configuration,
      label: e.configuration,
      sub: configNames[e.configuration as ConfigId],
      est: e.metrics[metric]!,
      lo: e.ci95?.[metric]?.[0] ?? e.metrics[metric]!,
      hi: e.ci95?.[metric]?.[1] ?? e.metrics[metric]!,
      color: configColor(e.configuration),
      emphasis: e.configuration === "A0" || e.configuration.startsWith("A5"),
      note: e.denominator ? `${e.denominator.rows.toLocaleString()} reports (${e.denominator.positives.toLocaleString()} pos.) over ${e.nScenarios} scenarios` : undefined,
    }));
  const latency = exps.map((e) => ({ key: e.configuration, label: e.configuration, value: e.metrics.latencyP95Ms ?? null, color: configColor(e.configuration) }));
  const contribs = measured.contributions.filter((c) => c.metric === "auroc" || (c.metric === "tpr" && c.step.startsWith("A5 vs")));
  const p = measured.provenance;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl border border-consistent/40 bg-consistent/5 px-4 py-2 text-[13px]">
        <FlaskConical size={17} className="text-consistent" />
        <EvidenceBadge kind="measured" />
        <span className="text-ink-2">
          {p.testScenarios} held-out scenarios · {p.reportRows.toLocaleString()} report assessments ({(p.positiveFraction * 100).toFixed(1)}% contradictory) · train {p.splits.train.ok} / val {p.splits.validation.ok} / test {p.splits.test.ok} ·
          95% scenario-bootstrap CIs · synthetic simulator — <span className="text-temporal">not comparable to the paper's 91.5% / 3%</span>
        </span>
      </div>

      <div className="mt-3 flex gap-5">
        <div className="rounded-xl border border-line bg-panel/80 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Segmented<EndpointMetric>
              size="sm"
              ariaLabel="Metric"
              value={metric}
              onChange={setMetric}
              color={colors.consistent}
              options={endpointMetricSpecs.map((m) => ({ value: m.key, label: m.label }))}
            />
          </div>
          <ForestPlot
            rows={rows}
            domain={[lo, hi]}
            width={800}
            rowHeight={40}
            labelWidth={230}
            format={(v) => (isPct ? `${(v * 100).toFixed(1)}%` : v.toFixed(3))}
            reference={a0 && typeof a0.metrics[metric] === "number" ? { value: a0.metrics[metric]!, label: "A0" } : undefined}
            axisLabel={spec.label}
          />
          <p className="max-w-[790px] text-[12.5px] leading-snug text-ink-2">
            <span className="text-ink">{spec.label}:</span> {spec.definition} {spec.higherIsBetter ? "Higher is better." : "Lower is better."}
          </p>
          <SourceNote kind="measuredPlot" source={`${assetPath("/results/tcad-results.json")} ← ${exps[0]?.sourceFile ?? ""} (import_research_data.py)`} className="mt-1" />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="rounded-xl border border-line bg-panel/80 p-3">
            <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-2">What each component adds (paired, 95% CI)</div>
            <table className="w-full text-[12.5px]">
              <tbody>
                {contribs.map((c) => (
                  <tr key={c.step + c.metric} className="border-t border-line">
                    <td className="py-[3px] pr-2 font-mono text-ink">{c.step}</td>
                    <td className="pr-2 text-ink-2">{c.component}</td>
                    <td className="whitespace-nowrap text-right font-mono" style={{ color: c.direction === "improves" ? colors.consistent : c.direction === "worsens" ? colors.anomaly : colors.inkMuted }}>
                      {c.metric.toUpperCase()} {c.diff > 0 ? "+" : ""}
                      {c.diff.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <SourceNote source="statistics/component_contributions.csv" className="mt-1" />
          </div>
          <div className="rounded-xl border border-line bg-panel/80 p-3">
            <div className="mb-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-2">p95 runtime per ego frame (ms)</div>
            <HBarChart data={latency} max={100} unit="" decimals={1} width={560} rowHeight={23} labelWidth={70} marker={{ value: 92, label: "CAD paper 92 ms (different scope)" }} />
            <SourceNote kind="measuredPlot" source="latency_metrics.csv · 27,000 ego frames · Snapdragon ARM64 laptop, Python" className="mt-0.5" />
          </div>
        </div>
      </div>
      <p className="mt-2 text-[13.5px] leading-snug text-ink-2">
        <span className="text-ink">Verdict:</span> the interpretable T-CAD rule (A5) and fused HMM (A4) are statistically indistinguishable from CAD; components A1–A3 alone are worse. Only the learned
        logistic layer (A5-LR) improves clearly (AUROC 0.970 vs 0.911, TPR 0.90 vs 0.52 at matched ~5% FPR) — and may exploit simulator regularities.
      </p>
    </div>
  );
}

function AwaitingView() {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-3 rounded-xl border border-temporal/40 bg-temporal/5 px-4 py-3 text-[16px]">
        <FileClock size={20} className="text-temporal" />
        <span className="text-ink">Awaiting verified measurements.</span>
        <span className="text-ink-2">The endpoint /results/tcad-results.json has no experiments yet; nothing below is a result.</span>
        <span className="ml-auto">
          <EvidenceBadge kind="proposed" />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {endpointMetricSpecs.map((m, i) => (
          <motion.div key={m.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-line bg-panel/80 p-3">
            <div className="font-display text-[17px] font-medium">{m.label}</div>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{m.definition}</p>
            <div className="mt-2 rounded-md border border-dashed border-line px-2 py-1 font-mono text-[12px] text-ink-3">awaiting measurement</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

