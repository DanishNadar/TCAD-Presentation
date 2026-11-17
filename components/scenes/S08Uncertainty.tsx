"use client";
import { useState } from "react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { OccupancyGrid, divergingBelief } from "@/components/viz/OccupancyGrid";
import { Legend, Slider } from "@/components/ui/Controls";
import { MathBlock, term } from "@/components/ui/MathBlock";
import { colors } from "@/components/viz/palette";
import type { OccupancyParams } from "@/lib/sim/occupancySim";
import { Segmented } from "@/components/ui/Controls";
import { MeasuredCalibration } from "@/components/viz/MeasuredCalibration";

export function S08Uncertainty() {
  const [p, setP] = useState<OccupancyParams>({
    noise: 0.12,
    missing: 0.1,
    assumedReliability: 0.88,
    occlusion: 1,
    pFreeToOcc: 0.06,
    pOccToFree: 0.2,
  });
  const [stats, setStats] = useState({ ece: 0, frame: 0 });
  const [mode, setMode] = useState<"demo" | "measured">("demo");
  const set = (k: keyof OccupancyParams) => (v: number) => setP((prev) => ({ ...prev, [k]: v }));
  const actualReliability = 1 - p.noise;
  const mismatch = p.assumedReliability - actualReliability;

  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="08 · Contribution A — probabilistic evidence"
        accent="var(--color-prob)"
        title="Representing uncertainty explicitly"
        subtitle={
          <>
            Hidden state <span className="font-mono text-ink">X ∈ {"{Free, Occupied}"}</span>. <span className="text-ink">Unknown is not a third state</span> — it is
            missing evidence. Confidence should match how often it is right.
          </>
        }
        right={
          <div className="flex flex-col items-end gap-2">
            <Segmented
              size="sm"
              ariaLabel="Scene mode"
              value={mode}
              onChange={setMode}
              color={mode === "demo" ? colors.prob : colors.consistent}
              options={[
                { value: "demo", label: "Live demo" },
                { value: "measured", label: "Measured calibration" },
              ]}
            />
            {mode === "demo" ? <EvidenceBadge kind="illustrative" /> : <EvidenceBadge kind="measured" detail="calibration split + test cells" />}
          </div>
        }
      />

      <div className="mt-5">
        <OccupancyGrid params={p} onStats={setStats} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Legend
          items={[
            { color: colors.ink, label: "Truly occupied" },
            { color: colors.sensor, label: "Observed occupied" },
            { color: colors.freeCell, label: "Observed free" },
            { color: colors.unknown, label: "No observation", pattern: "hatch" },
          ]}
        />
        <div className="flex items-center gap-2 text-[13px] text-ink-2">
          <span>belief:</span>
          <span>Free</span>
          <span className="h-3 w-40 rounded" style={{ background: `linear-gradient(to right, ${[0, 0.25, 0.5, 0.75, 1].map((v) => divergingBelief(v)).join(",")})` }} />
          <span>Occupied</span>
          <span className="text-ink-3">(gray = uncertain, 0.5)</span>
        </div>
      </div>

      {mode === "measured" && (
        <div className="mt-4">
          <MeasuredCalibration />
        </div>
      )}
      <div className={`mt-4 grid grid-cols-[1fr_1fr_430px] gap-5 ${mode === "measured" ? "hidden" : ""}`}>
        <div className="space-y-3 rounded-xl border border-line bg-panel/80 p-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-sensor">World (actual)</div>
          <Slider label="Observation noise (actual flip rate)" value={p.noise} min={0} max={0.35} onChange={set("noise")} color={colors.sensor} />
          <Slider label="Missing evidence (dropout)" value={p.missing} min={0} max={0.6} onChange={set("missing")} color={colors.unknown} />
          <Slider label="Occlusion (parked trucks)" value={p.occlusion} min={0} max={3} step={1} onChange={set("occlusion")} color={colors.unknown} format={(v) => `${v}`} />
        </div>
        <div className="space-y-3 rounded-xl border border-line bg-panel/80 p-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-prob">Model (assumed)</div>
          <Slider
            label="Assumed sensor reliability r"
            value={p.assumedReliability}
            min={0.55}
            max={0.99}
            onChange={set("assumedReliability")}
            color={colors.prob}
            hint="The filter's belief about P(correct reading)"
          />
          <div className="flex items-baseline justify-between rounded-lg bg-panel-2 px-3 py-2">
            <span className="text-[14px] text-ink-2">actual reliability 1 − noise</span>
            <span className="font-mono text-[15px] text-sensor">{actualReliability.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between rounded-lg bg-panel-2 px-3 py-2">
            <span className="text-[14px] text-ink-2">Calibration error (ECE, 10 bins)</span>
            <span className="font-mono text-[20px]" style={{ color: stats.ece > 0.1 ? colors.anomaly : colors.consistent }}>
              {stats.ece.toFixed(3)}
            </span>
          </div>
          <p className="text-[13px] leading-snug" style={{ color: Math.abs(mismatch) > 0.06 ? colors.temporal : colors.inkMuted }}>
            {mismatch > 0.06
              ? "Model is overconfident: it trusts readings more than they deserve → confidently wrong cells."
              : mismatch < -0.06
                ? "Model is underconfident: belief moves slowly and stays near 0.5."
                : "Assumed ≈ actual reliability: confidence is honest."}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panel/80 p-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">Calibrated likelihood</div>
          <div className="mt-2 text-[16px]">
            <MathBlock
              display
              tex={`P(Z{=}\\text{occ}\\mid X) = \\begin{cases} ${term("r", colors.prob, "r")} & X=\\text{Occ}\\\\ 1-${term("r", colors.prob, "r")} & X=\\text{Free}\\end{cases}`}
            />
            <MathBlock display tex={`P(Z{=}\\varnothing \\mid X{=}\\text{Occ}) = P(Z{=}\\varnothing \\mid X{=}\\text{Free})`} />
          </div>
          <p className="text-[13px] leading-snug text-ink-3">
            Missing-at-random assumption: a missing reading leaves belief to the transition model. In T-CAD, r would be fit per vehicle, range and
            occlusion from labeled data — here it is one slider.
          </p>
        </div>
      </div>
    </div>
  );
}
