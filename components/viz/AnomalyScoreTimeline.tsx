"use client";
import { useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import {
  alarms,
  episodeLength,
  monteCarlo,
  scoreEpisode,
  showcaseEpisode,
  suspectIndex,
  vehicleCount,
  type AnomalyParams,
  type ScoringMode,
} from "@/lib/sim/anomaly";
import { useAnimationFrame } from "@/lib/sim/clock";
import { IconButton, Segmented, Slider } from "@/components/ui/Controls";
import { MathBlock } from "@/components/ui/MathBlock";
import { LineChart } from "./charts";
import { colors } from "./palette";

const rowW = 900;
const rowLeft = 64;
const plotW = rowW - rowLeft - 10;
const xOf = (t: number) => rowLeft + (t / (episodeLength - 1)) * plotW;

export function AnomalyScoreTimeline() {
  const [mode, setMode] = useState<ScoringMode>("temporal");
  const [threshold, setThreshold] = useState(1.4);
  const [persistence, setPersistence] = useState(1);
  const [reliability, setReliability] = useState(0.85);
  const [missingRate, setMissingRate] = useState(0.25);
  const [cursor, setCursor] = useState(episodeLength - 1);
  const [playing, setPlaying] = useState(true);

  const params: AnomalyParams = useMemo(
    () => ({ reliability, missingRate, transition: { pFreeToOcc: 0.05, pOccToFree: 0.1 } }),
    [reliability, missingRate],
  );
  const episode = useMemo(() => showcaseEpisode(params), [params]);
  const trace = useMemo(() => scoreEpisode(episode, params, mode), [episode, params, mode]);
  const alarmRows = useMemo(() => trace.score.map((s) => alarms(s, threshold, persistence)), [trace, threshold, persistence]);
  const summary = useMemo(() => monteCarlo(params, mode, threshold, persistence), [params, mode, threshold, persistence]);
  const otherSummary = useMemo(
    () => monteCarlo(params, mode === "temporal" ? "perFrame" : "temporal", threshold, persistence),
    [params, mode, threshold, persistence],
  );
  const maxScore = -Math.log(1 - reliability) + 0.2;

  useAnimationFrame((_, dt) => {
    if (!playing) return;
    setCursor((c) => (c >= episodeLength - 1 + 8 ? 0 : c + dt * 9));
  });
  const tNow = Math.min(episodeLength - 1, Math.floor(cursor));

  const rowsMeta = [
    { label: "V1", note: "benign · glitch t=7–8", color: colors.sensor },
    { label: "V2", note: "benign · sees arrival first", color: colors.collab },
    { label: "V3", note: "under test · fabricates t=16–27", color: colors.collab },
  ];

  return (
    <div className="flex gap-5">
      <div>
        <div className="rounded-xl border border-line bg-panel/80 p-3">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-temporal">
              Rolling score A_i,t · {mode === "temporal" ? "temporal (HMM prior)" : "per-frame (memoryless)"}
            </span>
            <div className="flex items-center gap-2">
              <IconButton label={playing ? "Pause playback" : "Play"} onClick={() => setPlaying((v) => !v)} active={playing}>
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </IconButton>
              <input
                type="range"
                min={0}
                max={episodeLength - 1}
                step={1}
                value={tNow}
                onChange={(e) => {
                  setPlaying(false);
                  setCursor(parseInt(e.target.value, 10));
                }}
                aria-label="Time step"
                style={{ width: 200 }}
              />
              <span className="w-14 font-mono text-[13px] text-temporal">t={tNow}</span>
            </div>
          </div>
          <svg width={rowW} height={vehicleCount * 118 + 26} role="img" aria-label="Anomaly score per vehicle over time">
            {/* event bands */}
            <rect x={xOf(41) - 6} y={0} width={xOf(49) - xOf(41) + 12} height={vehicleCount * 118} fill={colors.ink} opacity={0.045} />
            <text x={xOf(45)} y={vehicleCount * 118 + 18} fill={colors.inkMuted} fontSize={11} textAnchor="middle" fontFamily="var(--font-mono)">
              real object arrives
            </text>
            {Array.from({ length: vehicleCount }).map((_, v) => {
              const y0 = v * 118;
              const sy = (s: number) => y0 + 100 - (s / maxScore) * 70;
              const pts = trace.score[v].map((s, t) => ({ t, s })).filter((p) => p.t <= tNow);
              let d = "";
              let pen = false;
              for (const p of pts) {
                if (p.s === null) {
                  pen = false;
                  continue;
                }
                d += `${pen ? "L" : "M"}${xOf(p.t)},${sy(p.s)} `;
                pen = true;
              }
              return (
                <g key={v}>
                  <text x={0} y={y0 + 16} fill={rowsMeta[v].color} fontSize={14} fontFamily="var(--font-mono)">
                    {rowsMeta[v].label}
                  </text>
                  <text x={rowLeft} y={y0 + 12} fill={colors.inkMuted} fontSize={11} fontFamily="var(--font-mono)">
                    {rowsMeta[v].note}
                  </text>
                  {v === suspectIndex && (
                    <rect x={xOf(16) - 6} y={y0 + 18} width={xOf(27) - xOf(16) + 12} height={86} fill={colors.anomaly} opacity={0.08} rx={4} />
                  )}
                  {v === 0 && <rect x={xOf(7) - 6} y={y0 + 18} width={xOf(8) - xOf(7) + 12} height={86} fill={colors.temporal} opacity={0.1} rx={4} />}
                  {/* observation strip */}
                  {episode.obs[v].map((z, t) => (
                    <rect
                      key={t}
                      x={xOf(t) - 6}
                      y={y0 + 18}
                      width={12}
                      height={9}
                      rx={2}
                      opacity={t <= tNow ? 1 : 0.15}
                      fill={z === "none" ? "transparent" : z === "occ" ? colors.sensor : colors.freeCell}
                      stroke={z === "none" ? colors.unknown : "none"}
                      strokeDasharray={z === "none" ? "2 2" : undefined}
                    />
                  ))}
                  <line x1={rowLeft} x2={rowW - 10} y1={sy(threshold)} y2={sy(threshold)} stroke={colors.anomaly} strokeDasharray="5 4" strokeOpacity={0.7} />
                  {v === 0 && (
                    <text x={rowW - 12} y={sy(threshold) - 4} fill={colors.ink2} fontSize={11} textAnchor="end" fontFamily="var(--font-mono)">
                      τ = {threshold.toFixed(2)}
                    </text>
                  )}
                  <line x1={rowLeft} x2={rowW - 10} y1={y0 + 100} y2={y0 + 100} stroke={colors.line} />
                  <path d={d} fill="none" stroke={colors.chartTemporal} strokeWidth={2} strokeLinejoin="round" />
                  {alarmRows[v].map((a, t) =>
                    a && t <= tNow ? <rect key={t} x={xOf(t) - 4} y={y0 + 104} width={8} height={8} rx={2} fill={colors.anomaly} /> : null,
                  )}
                </g>
              );
            })}
            <line x1={xOf(tNow)} x2={xOf(tNow)} y1={0} y2={vehicleCount * 118} stroke={colors.temporal} strokeOpacity={0.55} />
          </svg>
        </div>

        {/* current classification */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          {rowsMeta.map((r, v) => {
            const z = episode.obs[v][tNow];
            const s = trace.score[v][tNow];
            const alarm = alarmRows[v][tNow];
            const truthAttack = v === suspectIndex && episode.attackFrames[tNow];
            const state = z === "none" ? "NO REPORT" : alarm ? "SUSPICIOUS" : "CONSISTENT";
            const c = z === "none" ? colors.unknown : alarm ? colors.anomaly : colors.consistent;
            const outcome = z === "none" ? "" : alarm && truthAttack ? "true positive" : alarm ? "false positive" : truthAttack ? "missed" : "true negative";
            return (
              <div key={r.label} className="flex items-center justify-between rounded-xl border border-line bg-panel/80 px-4 py-2.5">
                <div>
                  <div className="font-mono text-[13px]" style={{ color: r.color }}>
                    {r.label} @ t={tNow}
                  </div>
                  <div className="font-mono text-[12px] text-ink-3">A = {s === null ? "—" : s.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[15px] font-medium" style={{ color: c }}>
                    {state}
                  </div>
                  <div className="text-[12px] text-ink-3">{outcome}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-6 rounded-xl border border-line bg-panel/60 px-4 py-2.5">
          <span className="text-[19px]">
            <MathBlock tex={`A_{i,t} = -\\log \\sum_{x} P(Z_{i,t}\\mid x)\\,P(x \\mid Z_{-i,1:t})`} />
          </span>
          <span className="text-[13px] leading-snug text-ink-3">Higher = less compatible with the other vehicles and history. Watch V2 at t≈41: honest, but surprising.</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-2.5 rounded-xl border border-line bg-panel/80 p-3.5">
          <Segmented<ScoringMode>
            ariaLabel="Scoring mode"
            value={mode}
            onChange={setMode}
            color={mode === "temporal" ? colors.temporal : colors.collab}
            options={[
              { value: "perFrame", label: "Per-frame" },
              { value: "temporal", label: "Temporal (HMM)" },
            ]}
          />
          <Slider label="Decision threshold τ" value={threshold} min={0.3} max={maxScore} onChange={setThreshold} color={colors.anomaly} />
          <Slider
            label="Persistence k (consecutive frames)"
            value={persistence}
            min={1}
            max={4}
            step={1}
            onChange={setPersistence}
            color={colors.temporal}
            format={(v) => `${v}`}
          />
          <div className="grid grid-cols-2 gap-3">
            <Slider label="Sensor reliability" value={reliability} min={0.7} max={0.95} onChange={setReliability} color={colors.prob} />
            <Slider label="Missing rate" value={missingRate} min={0} max={0.5} onChange={setMissingRate} color={colors.unknown} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel/80 px-4 py-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-prob">300 synthetic episodes</span>
            <span className="text-[11px] text-ink-3">illustrates tradeoffs · not results</span>
          </div>
          <table className="w-full font-mono text-[14px]">
            <thead>
              <tr className="text-[11px] text-ink-3">
                <th className="text-left font-normal">metric</th>
                <th className="text-right font-normal" style={{ color: colors.chartCollab }}>
                  per-frame
                </th>
                <th className="text-right font-normal" style={{ color: colors.temporal }}>
                  temporal
                </th>
              </tr>
            </thead>
            <tbody className="text-ink">
              {(() => {
                const pf = mode === "perFrame" ? summary : otherSummary;
                const tp = mode === "temporal" ? summary : otherSummary;
                const rows: [string, (s: typeof summary) => string][] = [
                  ["frame TPR", (s) => `${(s.tpr * 100).toFixed(1)}%`],
                  ["frame FPR", (s) => `${(s.fpr * 100).toFixed(1)}%`],
                  ["episodes caught", (s) => `${(s.episodeDetection * 100).toFixed(0)}%`],
                  ["median delay", (s) => (s.medianDelay === null ? "—" : `${s.medianDelay} fr`)],
                ];
                return rows.map(([name, f]) => (
                  <tr key={name} className="border-t border-line">
                    <td className="py-1 text-ink-2">{name}</td>
                    <td className="py-1 text-right">{f(pf)}</td>
                    <td className="py-1 text-right">{f(tp)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-line bg-panel/80 p-3">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">ROC (per-frame score, k=1)</div>
          <LineChart
            width={410}
            height={128}
            xDomain={[0, 1]}
            yDomain={[0, 1]}
            xTicks={[0, 0.5, 1]}
            yTicks={[0, 0.5, 1]}
            xLabel="false-positive rate"
            series={[
              { key: "pf", label: "per-frame", color: colors.chartCollab, points: (mode === "perFrame" ? summary : otherSummary).roc.map((p) => ({ x: p.fpr, y: p.tpr })) },
              { key: "tp", label: "temporal", color: colors.chartTemporal, points: (mode === "temporal" ? summary : otherSummary).roc.map((p) => ({ x: p.fpr, y: p.tpr })) },
            ]}
            markers={[{ x: summary.fpr, y: summary.tpr, color: colors.anomaly, label: "τ, k" }]}
          >
            {({ x, y }) => <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke={colors.line} strokeDasharray="3 3" />}
          </LineChart>
        </div>
      </div>
    </div>
  );
}
