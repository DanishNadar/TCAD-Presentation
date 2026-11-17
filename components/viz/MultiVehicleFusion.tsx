"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { likelihood, symmetricSensor, type Observation } from "@/lib/sim/hmm";
import { MathBlock, term } from "@/components/ui/MathBlock";
import { Segmented, Slider } from "@/components/ui/Controls";
import { colors } from "./palette";
import { useStage } from "@/components/shell/StageContext";

interface VehicleState {
  id: string;
  reliability: number;
  report: Observation;
}

const positions = [
  { x: 90, y: 90, label: "V1" },
  { x: 470, y: 70, label: "V2" },
  { x: 440, y: 390, label: "V3" },
];
const region = { x: 280, y: 240 };

export function MultiVehicleFusion() {
  const { reducedMotion, paused } = useStage();
  const [vehicles, setVehicles] = useState<VehicleState[]>([
    { id: "V1", reliability: 0.75, report: "free" },
    { id: "V2", reliability: 0.8, report: "occ" },
    { id: "V3", reliability: 0.8, report: "occ" },
  ]);
  const [correlated, setCorrelated] = useState(false);

  const effective = useMemo(
    () => vehicles.map((v, i) => (correlated && i === 2 ? { ...v, report: vehicles[1].report, reliability: vehicles[1].reliability } : v)),
    [vehicles, correlated],
  );

  const contributions = (tempered: boolean) =>
    effective.map((v, i) => {
      const [lo, lf] = likelihood(v.report, symmetricSensor(v.reliability));
      const w = tempered && correlated && i > 0 ? 0.5 : 1;
      return { id: v.id, w, llr: w * Math.log(lo / lf) };
    });
  const posteriorFrom = (c: { llr: number }[]) => 1 / (1 + Math.exp(-c.reduce((s, x) => s + x.llr, 0)));
  const naive = contributions(false);
  const tempered = contributions(true);
  const pNaive = posteriorFrom(naive);
  const pTempered = posteriorFrom(tempered);

  const update = (i: number, patch: Partial<VehicleState>) => setVehicles((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="flex gap-5">
      {/* spatial view */}
      <div className="rounded-xl border border-line bg-panel/80 p-2">
        <svg width={560} height={470} viewBox="0 0 560 470" role="img" aria-label="Three vehicles observing one shared region">
          <defs>
            <radialGradient id="regionGlow">
              <stop offset="0%" stopColor={colors.prob} stopOpacity={0.55} />
              <stop offset="100%" stopColor={colors.prob} stopOpacity={0} />
            </radialGradient>
          </defs>
          {effective.map((v, i) => {
            const p = positions[i];
            const ang = Math.atan2(region.y - p.y, region.x - p.x);
            const r = 330;
            const spread = 0.32;
            const wedge = `M${p.x},${p.y} L${p.x + r * Math.cos(ang - spread)},${p.y + r * Math.sin(ang - spread)} A${r},${r} 0 0 1 ${p.x + r * Math.cos(ang + spread)},${p.y + r * Math.sin(ang + spread)} Z`;
            const c = v.report === "none" ? colors.unknown : i === 0 ? colors.sensor : colors.collab;
            const isCopy = correlated && i === 2;
            return (
              <g key={v.id}>
                <path d={wedge} fill={c} opacity={v.report === "none" ? 0.04 : 0.05 + 0.18 * (v.reliability - 0.5) * 2} />
                <line x1={p.x} y1={p.y} x2={region.x} y2={region.y} stroke={c} strokeOpacity={0.5} strokeDasharray={v.report === "none" ? "3 5" : undefined} strokeWidth={1.5} />
                {v.report !== "none" && !reducedMotion && !paused &&
                  [0, 1, 2].map((k) => (
                    <circle key={k} r={3} fill={c}>
                      <animateMotion dur="1.8s" begin={`${k * 0.6}s`} repeatCount="indefinite" path={`M${p.x},${p.y} L${region.x},${region.y}`} />
                    </circle>
                  ))}
                {isCopy && (
                  <path
                    d={`M${positions[1].x},${positions[1].y + 26} C${positions[1].x + 70},${positions[1].y + 160} ${p.x + 60},${p.y - 140} ${p.x + 8},${p.y - 26}`}
                    fill="none"
                    stroke={colors.anomaly}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                )}
                <rect x={p.x - 22} y={p.y - 14} width={44} height={28} rx={7} fill={colors.panel2} stroke={c} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fill={colors.ink} fontSize={14} fontFamily="var(--font-mono)">
                  {v.id}
                </text>
                <text x={p.x} y={p.y + (i === 2 ? 44 : -24)} textAnchor="middle" fill={c} fontSize={13} fontFamily="var(--font-mono)">
                  {v.report === "none" ? "no report" : `"${v.report}" · r=${v.reliability.toFixed(2)}`}
                </text>
              </g>
            );
          })}
          {correlated && (
            <text x={24} y={452} fill={colors.anomaly} fontSize={13} fontFamily="var(--font-mono)">
              V3 relays V2 — same information, counted twice by naive fusion
            </text>
          )}
          <circle cx={region.x} cy={region.y} r={60} fill="url(#regionGlow)" />
          <motion.rect
            x={region.x - 22}
            y={region.y - 22}
            width={44}
            height={44}
            rx={6}
            animate={{ fill: `color-mix(in srgb, ${colors.prob} ${Math.round(pTempered * 100)}%, ${colors.freeCell})` }}
            stroke={colors.prob}
            strokeWidth={2}
          />
          <text x={region.x} y={region.y + 48} textAnchor="middle" fill={colors.ink2} fontSize={13} fontFamily="var(--font-mono)">
            shared region
          </text>
        </svg>
      </div>

      {/* per-vehicle controls */}
      <div className="w-[300px] space-y-3">
        {vehicles.map((v, i) => {
          const locked = correlated && i === 2;
          return (
            <div key={v.id} className={`rounded-xl border bg-panel/80 p-3 ${locked ? "border-anomaly/50" : "border-line"}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[14px]" style={{ color: i === 0 ? colors.sensor : colors.collab }}>
                  {v.id}
                </span>
                {locked ? (
                  <span className="text-[12px] text-anomaly">copies V2</span>
                ) : (
                  <Segmented<Observation>
                    size="sm"
                    ariaLabel={`${v.id} report`}
                    value={v.report}
                    onChange={(report) => update(i, { report })}
                    color={v.report === "none" ? colors.unknown : colors.sensor}
                    options={[
                      { value: "occ", label: "occ" },
                      { value: "free", label: "free" },
                      { value: "none", label: "∅" },
                    ]}
                  />
                )}
              </div>
              <Slider
                label="Reliability r"
                value={locked ? vehicles[1].reliability : v.reliability}
                min={0.5}
                max={0.98}
                onChange={(r) => !locked && update(i, { reliability: r })}
                color={colors.prob}
              />
            </div>
          );
        })}
        <label className="flex items-center gap-2 rounded-xl border border-line bg-panel/80 p-3 text-[14px] text-ink">
          <input type="checkbox" checked={correlated} onChange={(e) => setCorrelated(e.target.checked)} />
          Correlated sources: V3 relays V2's observation
        </label>
      </div>

      {/* fused belief */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="rounded-xl border border-line bg-panel/80 p-4">
          <div className="mb-3 font-mono text-[12px] uppercase tracking-[0.1em] text-prob">Fused P(Occupied), prior 0.5</div>
          <FusedBar label="Naive product (assumes independence)" p={pNaive} warn={correlated} />
          <FusedBar label="Correlation-aware (correlated group tempered)" p={pTempered} />
          <div className="mt-4 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-3">Evidence in log-odds (naive)</div>
          <EvidenceStrip items={naive} />
          {correlated && (
            <p className="mt-3 text-[13px] leading-snug text-temporal">
              Naive fusion counts V2's information twice ({(pNaive * 100).toFixed(0)}% vs {(pTempered * 100).toFixed(0)}%). In an adversarial setting,
              duplicated or colluding reports can push belief further than the evidence justifies.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-panel/80 px-4 py-3 text-[17px]">
          <MathBlock
            display
            tex={`P(X_t \\mid Z_{1:N,t}) \\propto P(X_t)\\prod_{i=1}^{N} P(Z_{i,t}\\mid X_t)^{${term("w", colors.anomaly, "w_i")}}`}
          />
          <p className="text-[13px] leading-snug text-ink-3">
            w_i = 1 is valid only if errors are conditionally independent given X_t. Tempering a correlated group (Σ w = 1) is one conservative choice;
            covariance intersection (Julier &amp; Uhlmann, 1997) is a classic alternative. Detecting correlation is itself an open question for T-CAD.
          </p>
        </div>
      </div>
    </div>
  );
}

function FusedBar({ label, p, warn = false }: { label: string; p: number; warn?: boolean }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[14px]">
        <span className={warn ? "text-temporal" : "text-ink-2"}>{label}</span>
        <span className="font-mono text-ink">{p.toFixed(3)}</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full bg-panel-2">
        <motion.div className="h-full rounded-full" animate={{ width: `${p * 100}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} style={{ background: colors.prob }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-ink-3" />
      </div>
    </div>
  );
}

function EvidenceStrip({ items }: { items: { id: string; llr: number }[] }) {
  const scale = 46; // px per nat
  return (
    <div className="relative mt-2 h-[78px]">
      <div className="absolute bottom-0 left-1/2 top-0 w-px bg-ink-3" />
      <span className="absolute left-0 top-0 text-[11px] text-ink-3">← Free</span>
      <span className="absolute right-0 top-0 text-[11px] text-ink-3">Occupied →</span>
      {items.map((it, i) => {
        const w = Math.min(190, Math.abs(it.llr) * scale);
        return (
          <motion.div
            key={it.id}
            className="absolute flex h-[16px] items-center rounded-sm px-1 font-mono text-[11px] text-void"
            animate={{ width: Math.max(2, w), left: it.llr >= 0 ? "50%" : `calc(50% - ${w}px)` }}
            style={{ top: 18 + i * 20, background: it.llr >= 0 ? colors.prob : colors.sensor, justifyContent: it.llr >= 0 ? "flex-start" : "flex-end" }}
          >
            {w > 30 ? it.id : ""}
          </motion.div>
        );
      })}
    </div>
  );
}
