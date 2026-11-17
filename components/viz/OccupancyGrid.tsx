"use client";
import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/sim/clock";
import { OccupancySim, occH, occW, type OccupancyParams } from "@/lib/sim/occupancySim";
import { useCanvas } from "./useCanvas";
import { colors } from "./palette";

const cell = 11;
const panelW = occW * cell;
const panelH = occH * cell;

/** Diverging belief scale: free (teal) ← gray (0.5, uncertain) → occupied (purple). */
export function divergingBelief(p: number) {
  const free = [18, 58, 68];
  const mid = [52, 58, 70];
  const occ = [167, 139, 250];
  const [a, b, t] = p < 0.5 ? [free, mid, p / 0.5] : [mid, occ, (p - 0.5) / 0.5];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export interface CellInspection {
  x: number;
  y: number;
  truth: boolean;
  obs: string;
  belief: number;
  framesSinceSeen: number | null;
}

export function OccupancyGrid({ params, onStats }: { params: OccupancyParams; onStats?: (s: { ece: number; frame: number }) => void }) {
  const simRef = useRef<OccupancySim>(null as unknown as OccupancySim);
  if (!simRef.current) simRef.current = new OccupancySim();
  const truthC = useCanvas(panelW, panelH);
  const obsC = useCanvas(panelW, panelH);
  const beliefC = useCanvas(panelW, panelH);
  const lastStep = useRef(0);
  const [inspect, setInspect] = useState<CellInspection | null>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useAnimationFrame((t) => {
    const sim = simRef.current;
    if (t - lastStep.current < 0.15 && sim.frame > 0) return;
    lastStep.current = t;
    sim.step(t, paramsRef.current);
    draw();
    onStats?.({ ece: sim.ece, frame: sim.frame });
    const h = hoverRef.current;
    if (h) setInspect(readCell(sim, h.x, h.y));
  });

  function draw() {
    const sim = simRef.current;
    const tc = truthC.getContext();
    const oc = obsC.getContext();
    const bc = beliefC.getContext();
    if (!tc || !oc || !bc) return;
    for (const ctx of [tc, oc, bc]) {
      ctx.fillStyle = colors.void;
      ctx.fillRect(0, 0, panelW, panelH);
    }
    for (let y = 0; y < occH; y++) {
      for (let x = 0; x < occW; x++) {
        const c = y * occW + x;
        const px = x * cell + 0.5;
        const py = y * cell + 0.5;
        const s = cell - 1;
        tc.fillStyle = sim.truth[c] ? colors.ink : "#121926";
        tc.fillRect(px, py, s, s);
        const z = sim.obs[c];
        if (z === "none") {
          oc.fillStyle = "#0b0f16";
          oc.fillRect(px, py, s, s);
          oc.strokeStyle = "rgba(91,100,116,0.45)";
          oc.lineWidth = 1;
          oc.beginPath();
          oc.moveTo(px, py + s);
          oc.lineTo(px + s, py);
          oc.stroke();
        } else {
          oc.fillStyle = z === "occ" ? colors.sensor : colors.freeCell;
          oc.fillRect(px, py, s, s);
        }
        bc.fillStyle = divergingBelief(sim.belief[c]);
        bc.fillRect(px, py, s, s);
      }
    }
    for (const ctx of [tc, oc, bc]) {
      const e = sim.ego;
      ctx.fillStyle = colors.void;
      ctx.fillRect(e.x * cell - 1, e.y * cell - 1, cell + 2, cell + 2);
      ctx.strokeStyle = colors.sensor;
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x * cell + 1, e.y * cell + 1, cell - 2, cell - 2);
      const h = hoverRef.current;
      if (h) {
        ctx.strokeStyle = colors.temporal;
        ctx.lineWidth = 2;
        ctx.strokeRect(h.x * cell, h.y * cell, cell, cell);
      }
    }
  }

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * occW);
    const y = Math.floor(((e.clientY - r.top) / r.height) * occH);
    if (x < 0 || y < 0 || x >= occW || y >= occH) return;
    hoverRef.current = { x, y };
    setInspect(readCell(simRef.current, x, y));
    draw();
  };
  const onLeave = () => {
    hoverRef.current = null;
    setInspect(null);
    draw();
  };

  const panels = [
    { c: truthC, title: "Ground truth X_t", sub: "hidden — no vehicle has this", color: colors.ink2 },
    { c: obsC, title: "Observation Z_t", sub: "this frame only", color: colors.sensor },
    { c: beliefC, title: "Belief P(X_t = Occ | Z_1:t)", sub: "HMM forward filter", color: colors.prob },
  ];

  return (
    <div>
      <div className="flex gap-4">
        {panels.map((p) => (
          <figure key={p.title} className="rounded-xl border border-line bg-panel/80 p-2">
            <figcaption className="mb-1.5 flex items-baseline justify-between px-1">
              <span className="font-mono text-[13px]" style={{ color: p.color }}>
                {p.title}
              </span>
              <span className="text-[12px] text-ink-3">{p.sub}</span>
            </figcaption>
            <canvas
              ref={p.c.ref}
              style={{ width: panelW, height: panelH, cursor: "crosshair" }}
              onMouseMove={onMove}
              onMouseLeave={onLeave}
              aria-label={p.title}
            />
          </figure>
        ))}
      </div>
      <div className="mt-2 flex h-[22px] items-center gap-6 font-mono text-[13px] text-ink-2">
        {inspect ? (
          <>
            <span className="text-temporal">cell ({inspect.x}, {inspect.y})</span>
            <span>truth: {inspect.truth ? "Occupied" : "Free"}</span>
            <span>
              Z_t: <span style={{ color: inspect.obs === "none" ? colors.unknown : colors.sensor }}>{inspect.obs === "none" ? "no observation" : inspect.obs}</span>
            </span>
            <span style={{ color: colors.prob }}>P(Occ) = {inspect.belief.toFixed(3)}</span>
            <span className="text-ink-3">{inspect.framesSinceSeen === null ? "never observed" : `last observed ${inspect.framesSinceSeen} frames ago`}</span>
          </>
        ) : (
          <span className="text-ink-3">Hover any cell to inspect truth, observation and belief.</span>
        )}
      </div>
    </div>
  );
}

function readCell(sim: OccupancySim, x: number, y: number): CellInspection {
  const c = y * occW + x;
  return {
    x,
    y,
    truth: sim.truth[c] === 1,
    obs: sim.obs[c],
    belief: sim.belief[c],
    framesSinceSeen: sim.lastSeen[c] < 0 ? null : sim.frame - sim.lastSeen[c],
  };
}
