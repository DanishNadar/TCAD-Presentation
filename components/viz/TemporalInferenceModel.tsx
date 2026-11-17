"use client";
/**
 * Scene 9: one region, step-by-step Bayesian filtering with synchronized
 * equation highlighting, an editable transition matrix, and a posterior
 * timeline (BayesianBeliefChart).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { filterStep, symmetricSensor, type Observation } from "@/lib/sim/hmm";
import { createRng } from "@/lib/sim/random";
import { MathBlock, term } from "@/components/ui/MathBlock";
import { IconButton, Slider } from "@/components/ui/Controls";
import { LineChart } from "./charts";
import { colors } from "./palette";
import { useStage } from "@/components/shell/StageContext";
import { measured } from "@/lib/research/measured";

const learned = measured.calibrationParams;

const T = 24;
const truth = Array.from({ length: T }, (_, t) => t >= 7 && t < 16);
const missingAt = new Set([4, 11, 12, 19]);
const uniforms = (() => {
  const rng = createRng(42);
  return Array.from({ length: T }, () => rng.next());
})();

const phases = [
  { id: "prior", label: "Previous belief", terms: ["prior"], text: "Start from what we believed at t−1, after all evidence so far." },
  { id: "predict", label: "Predict", terms: ["trans", "sum", "prior"], text: "Push the belief through the transition model: the region may have changed since the last frame." },
  { id: "observe", label: "New observation", terms: ["obs"], text: "A new reading Z_t arrives — or doesn't (occluded / dropped)." },
  { id: "weight", label: "Likelihood weighting", terms: ["like"], text: "Weight each hypothesis by how likely this reading is if it were true." },
  { id: "normalize", label: "Normalize", terms: ["prop"], text: "Rescale so P(Free) + P(Occ) = 1 — that's what ∝ hides." },
  { id: "posterior", label: "Posterior", terms: ["post"], text: "Updated belief P(X_t | Z_1:t). It becomes the prior for the next frame." },
] as const;

const eqTex =
  `${term("post", colors.temporal, "P(X_t \\mid Z_{1:t})")} ` +
  `${term("prop", colors.ink2, "\\;\\propto\\;")} ` +
  `${term("like", colors.prob, "P(Z_t \\mid X_t)")}\\, ` +
  `${term("sum", colors.ink, "\\sum_{X_{t-1}}")} ` +
  `${term("trans", colors.temporal, "P(X_t \\mid X_{t-1})")}\\, ` +
  `${term("prior", colors.ink2, "P(X_{t-1} \\mid Z_{1:t-1})")}` +
  `\\qquad ${term("obs", colors.sensor, "Z_t")}`;

export function TemporalInferenceModel() {
  const { paused } = useStage();
  const [pSwitchFO, setPSwitchFO] = useState(0.1);
  const [pSwitchOF, setPSwitchOF] = useState(0.1);
  const [reliability, setReliability] = useState(0.8);
  const [t, setT] = useState(9);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showMemoryless, setShowMemoryless] = useState(true);

  const sensor = symmetricSensor(reliability);
  const transition = { pFreeToOcc: pSwitchFO, pOccToFree: pSwitchOF };

  const { observations, traces } = useMemo(() => {
    const obs: Observation[] = truth.map((x, i) => (missingAt.has(i) ? "none" : uniforms[i] < reliability ? (x ? "occ" : "free") : x ? "free" : "occ"));
    let b = 0.5;
    const tr = obs.map((z) => {
      const s = filterStep(b, [{ z, sensor: symmetricSensor(reliability) }], { pFreeToOcc: pSwitchFO, pOccToFree: pSwitchOF });
      b = s.posterior;
      return s;
    });
    return { observations: obs, traces: tr };
  }, [reliability, pSwitchFO, pSwitchOF]);

  const stepPhase = (d: number) => {
    let ph = phase + d;
    let tt = t;
    if (ph >= phases.length) {
      if (tt >= T - 1) return false;
      ph = 0;
      tt++;
    } else if (ph < 0) {
      if (tt === 0) return false;
      ph = phases.length - 1;
      tt--;
    }
    setPhase(ph);
    setT(tt);
    return true;
  };
  const stepRef = useRef(stepPhase);
  stepRef.current = stepPhase;

  // Autoplay through phases and time
  useEffect(() => {
    if (!playing || paused) return;
    const id = setInterval(() => {
      if (!stepRef.current(1)) setPlaying(false);
    }, 550);
    return () => clearInterval(id);
  }, [playing, paused]);

  const tr = traces[t];
  const z = observations[t];
  const [lo, lf] = z === "none" ? [1, 1] : z === "occ" ? [sensor.hitRate, sensor.falseAlarmRate] : [1 - sensor.hitRate, 1 - sensor.falseAlarmRate];
  const bars: Record<string, { occ: number; free: number; caption: string; color: string }> = {
    prior: { occ: tr.prior, free: 1 - tr.prior, caption: "P(X_{t−1} | Z_1:t−1)", color: colors.ink2 },
    predict: { occ: tr.predicted, free: 1 - tr.predicted, caption: "Σ P(X_t|X_{t−1}) P(X_{t−1}|…)", color: colors.temporal },
    observe: { occ: tr.predicted, free: 1 - tr.predicted, caption: "prediction (awaiting Z_t)", color: colors.temporal },
    weight: { occ: lo, free: lf, caption: "likelihood P(Z_t | X_t)", color: colors.prob },
    normalize: { occ: tr.unnormOcc, free: tr.unnormFree, caption: "unnormalized product", color: colors.ink2 },
    posterior: { occ: tr.posterior, free: 1 - tr.posterior, caption: "P(X_t | Z_1:t)", color: colors.temporal },
  };
  const cur = bars[phases[phase].id];
  const barMax = phases[phase].id === "normalize" ? Math.max(tr.unnormOcc, tr.unnormFree, 1e-6) : 1;

  const shownT = phase === phases.length - 1 ? t : t - 1;
  const posteriorSeries = traces.slice(0, Math.max(0, shownT + 1)).map((s, i) => ({ x: i, y: s.posterior }));
  const memoryless = observations.slice(0, Math.max(0, shownT + 1)).map((zz, i) => ({
    x: i,
    y: zz === "none" ? 0.5 : zz === "occ" ? reliability : 1 - reliability,
  }));

  return (
    <div className="flex gap-6">
      <div className="w-[900px]">
        <div className="rounded-xl border border-line bg-panel/80 p-3">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-temporal">Posterior over time · one region</span>
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input type="checkbox" checked={showMemoryless} onChange={(e) => setShowMemoryless(e.target.checked)} />
              Compare memoryless (this frame only)
            </label>
          </div>
          <LineChart
            width={876}
            height={250}
            xDomain={[0, T - 1]}
            yDomain={[0, 1]}
            xTicks={[0, 4, 8, 12, 16, 20, 23]}
            yTicks={[0, 0.5, 1]}
            xLabel="time step t"
            yLabel="P(Occupied)"
            formatX={(v) => `${Math.round(v)}`}
            formatY={(v) => v.toFixed(2)}
            series={[
              ...(showMemoryless ? [{ key: "ml", label: "memoryless", color: colors.chartCollab, points: memoryless, dashed: true }] : []),
              { key: "post", label: "HMM posterior", color: colors.chartTemporal, points: posteriorSeries },
            ]}
            markers={posteriorSeries.length ? [{ x: shownT, y: traces[shownT].posterior, color: colors.temporal }] : []}
          >
            {({ x, y }) => (
              <g>
                {truth.map((occ, i) =>
                  occ ? <rect key={i} x={x(i - 0.5)} y={y(1)} width={x(1) - x(0)} height={y(0) - y(1)} fill={colors.ink} opacity={0.06} /> : null,
                )}
                <text x={x(11)} y={y(1) + 14} fill={colors.inkMuted} fontSize={11} textAnchor="middle" fontFamily="var(--font-mono)">
                  truly occupied
                </text>
                {observations.map((zz, i) => (
                  <g key={i} opacity={i <= t ? 1 : 0.18}>
                    {zz === "none" ? (
                      <circle cx={x(i)} cy={y(0) - 8} r={4} fill="none" stroke={colors.unknown} strokeWidth={1.5} />
                    ) : (
                      <rect x={x(i) - 3.5} y={y(0) - 14} width={7} height={11} rx={2} fill={zz === "occ" ? colors.sensor : colors.freeCell} stroke={zz === "free" ? colors.sensor : "none"} strokeOpacity={0.5} />
                    )}
                  </g>
                ))}
                <line x1={x(t)} x2={x(t)} y1={y(1)} y2={y(0)} stroke={colors.temporal} strokeOpacity={0.6} strokeDasharray="3 3" />
              </g>
            )}
          </LineChart>
          <div className="flex gap-5 px-1 text-[12px] text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[3px] w-4 rounded" style={{ background: colors.chartTemporal }} /> HMM posterior
            </span>
            {showMemoryless && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: colors.chartCollab }} /> memoryless P(Occ | Z_t)
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2 rounded-sm" style={{ background: colors.sensor }} /> Z = occ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2 rounded-sm border" style={{ background: colors.freeCell, borderColor: colors.sensor }} /> Z = free
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-[1.5px]" style={{ borderColor: colors.unknown }} /> missing
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line bg-panel/80 px-4 py-3">
          <div className="text-[22px]">
            <MathBlock tex={eqTex} display activeTerms={[...phases[phase].terms]} />
          </div>
          <div className="mt-1 flex gap-1">
            {phases.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPhase(i)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-[13px] transition-colors ${
                  i === phase ? "border-temporal bg-temporal/10 text-ink" : "border-line text-ink-3 hover:text-ink-2"
                }`}
              >
                {i + 1}. {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[15px] text-ink-2">{phases[phase].text}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <IconButton label="Start" onClick={() => { setT(0); setPhase(0); }}>
            <SkipBack size={15} />
          </IconButton>
          <IconButton label="Previous step" onClick={() => stepPhase(-1)}>
            <StepBack size={15} />
          </IconButton>
          <IconButton label={playing ? "Pause" : "Play"} onClick={() => setPlaying((v) => !v)} active={playing}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </IconButton>
          <IconButton label="Next step" onClick={() => stepPhase(1)}>
            <StepForward size={15} />
          </IconButton>
          <IconButton label="Next frame" onClick={() => { setT((v) => Math.min(T - 1, v + 1)); setPhase(phases.length - 1); }}>
            <SkipForward size={15} />
          </IconButton>
          <span className="ml-2 font-mono text-[15px] text-temporal">
            t = {t} · Z_t = {z === "none" ? "∅ missing" : z}
          </span>
        </div>

        <div className="rounded-xl border border-line bg-panel/80 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em]" style={{ color: cur.color }}>
              {phases[phase].label}
            </span>
            <span className="font-mono text-[12px] text-ink-3">{cur.caption}</span>
          </div>
          <div className="flex h-[128px] items-end justify-around gap-8 px-6">
            {(["free", "occ"] as const).map((k) => {
              const v = cur[k];
              return (
                <div key={k} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[15px] text-ink">{v.toFixed(3)}</span>
                  <div className="flex h-[88px] w-full items-end">
                    <motion.div
                      className="w-full rounded-t-md"
                      animate={{ height: `${Math.max(1.5, (v / barMax) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 180, damping: 22 }}
                      style={{ background: k === "occ" ? colors.prob : colors.freeCell, outline: k === "free" ? `1px solid ${colors.sensor}40` : undefined }}
                    />
                  </div>
                  <span className="text-[14px] text-ink-2">{k === "occ" ? "Occupied" : "Free"}</span>
                </div>
              );
            })}
          </div>
          {phases[phase].id === "weight" && z === "none" && (
            <p className="mt-2 text-[13px] text-temporal">Missing observation → equal likelihoods → posterior = prediction. Missing ≠ contradictory.</p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-panel/80 p-4">
          <div className="mb-2 flex justify-between font-mono text-[12px] uppercase tracking-[0.1em] text-temporal"><span>Transition matrix P(X_t | X_t−1)</span><button
              onClick={() => {
                setPSwitchFO(learned.pFreeToOcc);
                setPSwitchOF(learned.pOccToFree);
              }}
              className="rounded border border-consistent/50 px-1.5 py-0.5 normal-case tracking-normal text-consistent hover:bg-consistent/10"
              title="Transitions estimated on our calibration split (per 0.1 s frame) — research-data/measured/demoCContradictory/model_artifacts.json"
            >
              use learned transitions
            </button></div>
          <TransitionMatrix fo={pSwitchFO} of={pSwitchOF} />
          <div className="mt-3 space-y-2">
            <Slider label="P(Free → Occ)" value={pSwitchFO} min={0.0005} max={0.5} step={0.0005} onChange={setPSwitchFO} color={colors.temporal} format={(v) => (v < 0.01 ? v.toFixed(4) : v.toFixed(2))} />
            <Slider label="P(Occ → Free)" value={pSwitchOF} min={0.0005} max={0.5} step={0.0005} onChange={setPSwitchOF} color={colors.temporal} format={(v) => (v < 0.01 ? v.toFixed(4) : v.toFixed(3))} />
            <Slider label="Sensor reliability r" value={reliability} min={0.55} max={0.98} onChange={setReliability} color={colors.prob} />
          </div>
          
        </div>
      </div>
    </div>
  );
}

function TransitionMatrix({ fo, of }: { fo: number; of: number }) {
  const cells = [
    ["Free", "Free", 1 - fo],
    ["Free", "Occ", fo],
    ["Occ", "Free", of],
    ["Occ", "Occ", 1 - of],
  ] as const;
  return (
    <div className="grid grid-cols-[70px_1fr_1fr] gap-1 font-mono text-[13px]">
      <span />
      <span className="text-center text-ink-3">→ Free</span>
      <span className="text-center text-ink-3">→ Occ</span>
      {(["Free", "Occ"] as const).map((from) => (
        <div key={from} className="contents">
          <span className="self-center text-ink-3">{from}</span>
          {cells
            .filter((c) => c[0] === from)
            .map((c) => (
              <div
                key={c[1]}
                className="rounded-md py-1.5 text-center text-ink"
                style={{ background: `color-mix(in srgb, ${colors.temporal} ${Math.round(c[2] * 55)}%, ${colors.panel2})` }}
              >
                {c[2].toFixed(2)}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
