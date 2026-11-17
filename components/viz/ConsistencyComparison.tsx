"use client";
/**
 * CAD consistency checks on a grid (Scene 5). Small per-vehicle maps on the
 * left, a large analysis map in the middle, equations + controls on the right.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cellMeters, cellXY, gridH, gridW, runCad, vehicles, buildingsGrid, type Scenario } from "@/lib/sim/cadGrid";
import { colors } from "./palette";
import { MathBlock, term } from "@/components/ui/MathBlock";
import { Legend, Segmented, Slider } from "@/components/ui/Controls";

const steps = [
  { id: 1, label: "Local maps", blurb: "Each vehicle labels space it observed as occupied (S_O) or free (S_F). Unobserved space is unknown — no evidence either way." },
  { id: 2, label: "Occ ↔ Occ", blurb: "A conflict is space one vehicle reports occupied while another directly observed it free." },
  { id: 3, label: "Merged map", blurb: "Conflicting regions are dropped from remote evidence; EGO's own observations are trusted." },
  { id: 4, label: "Perc ↔ Occ", blurb: "The fused perception output Y must agree with the merged map: boxes can't sit in free space; occupied space needs a box." },
] as const;

const equations: Record<number, string> = {
  1: `M^{(i)} = (${term("so", colors.sensor, "S_O^{(i)}")},\\; ${term("sf", "#7fb8c4", "S_F^{(i)}")}),\\quad i = 0,\\dots,N`,
  2: `${term("eps", colors.anomaly, "\\varepsilon_{occ}")} = \\bigcup_{i,j} ${term("so", colors.sensor, "S_O^{(i)}")} \\cap ${term("sf", "#7fb8c4", "S_F^{(j)}")}`,
  3: `S'_O = S_O^{(0)} \\cup \\Big(\\bigcup_{i\\ge1} S_O^{(i)} - ${term("eps", colors.anomaly, "\\varepsilon_{occ}")} - S_F^{(0)}\\Big)`,
  4: `${term("sp", colors.anomaly, "\\varepsilon_{spoof}")} = \\bigcup_{y\\in Y} y \\cap S'_F \\qquad ${term("rm", colors.anomaly, "\\varepsilon_{remove}")} = \\bigcup_{s\\in S'_O} s - Y`,
};

export function ConsistencyComparison() {
  const [step, setStep] = useState(1);
  const [scenario, setScenario] = useState<Scenario>("spoof");
  const [sigma, setSigma] = useState(2);
  const [noise, setNoise] = useState(true);
  const r = useMemo(() => runCad(scenario, sigma, noise), [scenario, sigma, noise]);

  const flaggedCells = new Set(r.components.filter((c) => c.flagged).flatMap((c) => c.cells));
  const ignoredCells = new Set(r.components.filter((c) => !c.flagged).flatMap((c) => c.cells));
  const flaggedCount = r.components.filter((c) => c.flagged).length;

  const bigCell = 27;
  return (
    <div className="flex gap-5">
      {/* per-vehicle local maps */}
      <div className="flex w-[282px] flex-col gap-2">
        {r.maps.map((m, i) => (
          <div key={i} className="rounded-lg border border-line bg-panel/80 p-1.5">
            <div className="mb-1 flex justify-between px-1 font-mono text-[12px]">
              <span style={{ color: i === 0 ? colors.sensor : colors.collab }}>{vehicles[i].label}</span>
              {scenario !== "benign" && vehicles[i].role === "attacker" && <span className="text-anomaly">attacker (synthetic)</span>}
            </div>
            <GridSvg cell={12} occ={m.occ} free={m.free} background={r.background} showVehicles={[i]} conflicts={step >= 2 ? new Set([...r.epsOcc].filter((c) => m.occ.has(c) || m.free.has(c))) : undefined} />
          </div>
        ))}
      </div>

      {/* analysis map */}
      <div className="flex w-[612px] shrink-0 flex-col">
        <div className="rounded-xl border border-line bg-panel/80 p-2">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">
              {step === 1 ? "All maps overlaid" : step === 2 ? "Conflicts ε_occ" : step === 3 ? "Merged map M′ (EGO trusted)" : "Merged map M′ vs. perception Y"}
            </span>
            <span className="font-mono text-[12px] text-ink-3">1 cell = {cellMeters}×{cellMeters} m</span>
          </div>
          <GridSvg
            cell={bigCell}
            occ={step >= 3 ? r.mergedOcc : new Set(r.maps.flatMap((m) => [...m.occ]))}
            free={step >= 3 ? r.mergedFree : new Set(r.maps.flatMap((m) => [...m.free]))}
            background={r.background}
            showVehicles={[0, 1, 2]}
            conflicts={step === 2 ? r.epsOcc : step === 4 ? new Set([...r.epsSpoof, ...r.epsRemove]) : undefined}
            flagged={flaggedCells}
            ignored={ignoredCells}
            boxes={step === 4 ? r.predictedBoxes : undefined}
            attackerIndex={scenario === "benign" ? -1 : 2}
          />
        </div>
        <div className="mt-3">
          <Legend
            items={[
              { color: colors.sensor, label: "Occupied (S_O)" },
              { color: colors.freeCell, label: "Free (S_F)" },
              { color: colors.unknown, label: "Unknown / unobserved", pattern: "hatch" },
              { color: "#1a2333", label: "Static background (HD map)" },
              { color: colors.anomaly, label: "Conflict ≥ σ (flagged)" },
              { color: colors.ink2, label: "Predicted box y ∈ Y", pattern: "outline" },
            ]}
          />
        </div>
      </div>

      {/* explanation + controls */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex gap-1" role="tablist" aria-label="CAD steps">
          {steps.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={step === s.id}
              onClick={() => setStep(s.id)}
              className={`flex-1 rounded-lg border px-2 py-2 text-left text-[13px] transition-colors ${
                step === s.id ? "border-collab bg-collab/10 text-ink" : "border-line text-ink-3 hover:text-ink-2"
              }`}
            >
              <div className="font-mono text-[11px]">STEP {s.id}</div>
              {s.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-line bg-panel/80 p-4"
          >
            <p className="text-[16px] leading-snug text-ink-2">{steps[step - 1].blurb}</p>
            <div className="mt-3 overflow-x-auto text-[17px]">
              <MathBlock tex={equations[step]} display activeTerms={step === 2 ? ["eps"] : step === 4 ? ["sp", "rm"] : []} />
            </div>
            <div className="font-mono text-[11px] text-ink-3">Zhang et al. 2024, Eq. {step === 1 ? "4–5 (notation)" : step === 2 ? "5" : step === 3 ? "6" : "7"}</div>
          </motion.div>
        </AnimatePresence>

        <div className="space-y-3 rounded-xl border border-line bg-panel/80 p-4">
          <Segmented<Scenario>
            ariaLabel="Scenario"
            value={scenario}
            onChange={setScenario}
            color={scenario === "benign" ? colors.consistent : colors.anomaly}
            size="sm"
            options={[
              { value: "benign", label: "Benign" },
              { value: "spoof", label: "Spoof (synthetic)" },
              { value: "remove", label: "Remove (synthetic)" },
            ]}
          />
          <Slider
            label="Area threshold σ (ignore smaller conflicts)"
            value={sigma}
            min={1}
            max={4}
            step={1}
            onChange={setSigma}
            color={colors.collab}
            format={(v) => `${v} cell${v > 1 ? "s" : ""} = ${v * cellMeters * cellMeters} m²`}
          />
          <label className="flex items-center gap-2 text-[14px] text-ink-2">
            <input type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} />
            Benign sensor noise on CAV-1 (one wrong cell)
          </label>
          <div className="flex items-center justify-between rounded-lg bg-panel-2 px-3 py-2 text-[15px]">
            <span className="text-ink-2">CAD alarms (components ≥ σ)</span>
            <span className="font-mono text-[18px]" style={{ color: flaggedCount ? colors.anomaly : colors.consistent }}>
              {flaggedCount}
            </span>
          </div>
          <p className="text-[13px] leading-snug text-ink-3">
            {scenario === "spoof" &&
              "Adaptive attacker: its own shared map claims the fabricated object is there — but EGO observed that space as free, so both ε_occ and ε_spoof fire."}
            {scenario === "remove" &&
              "Attacker suppresses object B in the fused output Y. CAV-1 still observed B as occupied, so S′_O − Y is non-empty (ε_remove). EGO alone could not see B."}
            {scenario === "benign" && "With σ = 1 the single noisy cell becomes a false alarm; σ ≥ 2 suppresses it. Thresholds trade false alarms against misses."}
          </p>
        </div>
      </div>
    </div>
  );
}

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function GridSvg({
  cell,
  occ,
  free,
  background,
  showVehicles,
  conflicts,
  flagged,
  ignored,
  boxes,
  attackerIndex = -1,
}: {
  cell: number;
  occ: Set<number>;
  free: Set<number>;
  background: Set<number>;
  showVehicles: number[];
  conflicts?: Set<number>;
  flagged?: Set<number>;
  ignored?: Set<number>;
  boxes?: Box[];
  attackerIndex?: number;
}) {
  const w = gridW * cell;
  const h = gridH * cell;
  const patternId = `hatch-${cell}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
          <rect width="6" height="6" fill="#0b0f16" />
          <line x1="0" y1="0" x2="0" y2="6" stroke={colors.unknown} strokeWidth="1.6" opacity="0.55" />
        </pattern>
      </defs>
      {Array.from({ length: gridW * gridH }).map((_, i) => {
        const { x, y } = cellXY(i);
        const isConflict = conflicts?.has(i);
        const isFlagged = flagged?.has(i);
        const isIgnored = ignored?.has(i);
        let fill = `url(#${patternId})`;
        if (background.has(i)) fill = "#1a2333";
        else if (occ.has(i)) fill = colors.sensor;
        else if (free.has(i)) fill = colors.freeCell;
        if (isConflict && (isFlagged || flagged === undefined)) fill = colors.anomaly;
        return (
          <rect
            key={i}
            x={x * cell + 0.5}
            y={y * cell + 0.5}
            width={cell - 1}
            height={cell - 1}
            rx={cell > 20 ? 3 : 1.5}
            fill={fill}
            style={{ transition: "fill 400ms" }}
            opacity={isConflict && isIgnored ? 0.55 : 1}
          >
            {isConflict && isFlagged && <animate attributeName="opacity" values="1;0.55;1" dur="1.4s" repeatCount="indefinite" />}
          </rect>
        );
      })}
      {/* ignored (below σ) conflicts get an outline */}
      {conflicts &&
        [...conflicts]
          .filter((i) => ignored?.has(i))
          .map((i) => {
            const { x, y } = cellXY(i);
            return (
              <rect key={`ig${i}`} x={x * cell + 2} y={y * cell + 2} width={cell - 4} height={cell - 4} rx={3} fill="none" stroke={colors.temporal} strokeDasharray="3 2" strokeWidth={1.5} />
            );
          })}
      {cell > 20 &&
        buildingsGrid.map((b) => (
          <text key={b.id} x={(b.x + b.w / 2) * cell} y={(b.y + b.h / 2) * cell} fill={colors.inkMuted} fontSize={12} textAnchor="middle" fontFamily="var(--font-mono)">
            building
          </text>
        ))}
      {boxes?.map((b) => (
        <motion.rect
          key={b.id}
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${(b.x + b.w / 2) * cell}px ${(b.y + b.h / 2) * cell}px` }}
          x={b.x * cell - 3}
          y={b.y * cell - 3}
          width={b.w * cell + 6}
          height={b.h * cell + 6}
          rx={5}
          fill="none"
          stroke={b.id === "G" ? colors.anomaly : colors.ink}
          strokeWidth={2}
          strokeDasharray={b.id === "G" ? "6 4" : undefined}
        />
      ))}
      {boxes && cell > 20 && (
        <>
          {boxes.some((b) => b.id === "G") && (
            <text x={9 * cell} y={10 * cell + 20} fill={colors.anomaly} fontSize={13} textAnchor="middle" fontFamily="var(--font-mono)">
              ε_spoof: box in free space
            </text>
          )}
          {!boxes.some((b) => b.id === "B") && (
            <text x={14 * cell} y={4 * cell + 22} fill={colors.anomaly} fontSize={13} textAnchor="middle" fontFamily="var(--font-mono)">
              ε_remove: occupied, no box
            </text>
          )}
        </>
      )}
      {showVehicles.map((vi) => {
        const v = vehicles[vi];
        const c = vi === 0 ? colors.sensor : vi === attackerIndex ? colors.anomaly : colors.collab;
        const cx = v.x * cell + cell / 2;
        const cy = v.y * cell + cell / 2;
        return (
          <g key={vi}>
            <circle cx={cx} cy={cy} r={cell * 0.42} fill={colors.void} stroke={c} strokeWidth={2} />
            <circle cx={cx} cy={cy} r={cell * 0.18} fill={c} />
            {cell > 20 && (
              <text x={cx} y={cy - cell * 0.7} fill={c} fontSize={12} textAnchor="middle" fontFamily="var(--font-mono)">
                {v.label.split(" ")[0]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
