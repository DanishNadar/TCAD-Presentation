"use client";
/**
 * CAD → T-CAD architecture. Used in Scene 7 (progressive build), Scene 12
 * (ablation configurations) and Scene 14 (overlay). Information particles
 * flow along enabled edges; disabled modules are ghosted.
 */
import { motion } from "motion/react";
import { pipelineComponents, statusMeta, type ComponentId } from "@/lib/research/implementationStatus";
import { colors } from "./palette";
import { useStage } from "@/components/shell/StageContext";

type NodeId = ComponentId | "obs";

interface NodeLayout {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
}

const H = 74;
const layout: NodeLayout[] = [
  { id: "obs", x: 0, y: 178, w: 175, h: H },
  { id: "occupancy", x: 200, y: 178, w: 185, h: H },
  { id: "sync", x: 410, y: 178, w: 190, h: H },
  { id: "occCheck", x: 660, y: 40, w: 220, h: H },
  { id: "percCheck", x: 910, y: 40, w: 220, h: H },
  { id: "calibration", x: 600, y: 318, w: 160, h: H },
  { id: "fusion", x: 775, y: 318, w: 160, h: H },
  { id: "hmm", x: 950, y: 318, w: 160, h: H },
  { id: "scoring", x: 1125, y: 318, w: 165, h: H },
  { id: "decision", x: 1300, y: 178, w: 170, h: H },
];

const edges: [NodeId, NodeId][] = [
  ["obs", "occupancy"],
  ["occupancy", "sync"],
  ["sync", "occCheck"],
  ["occCheck", "percCheck"],
  ["percCheck", "decision"],
  ["sync", "calibration"],
  ["calibration", "fusion"],
  ["fusion", "hmm"],
  ["hmm", "scoring"],
  ["scoring", "decision"],
];

export const componentExplanations: Record<NodeId, string> = {
  obs: "Local LiDAR plus data shared by other CAVs (raw points, feature maps or boxes, depending on fusion level).",
  occupancy: "Each vehicle converts its own LiDAR into free / occupied regions; unobserved space stays unknown. (CAD, §5.3)",
  sync: "Tracking + point-cloud registration estimate motion so all maps describe the same instant. (CAD)",
  occCheck: "ε_occ: space one vehicle says is occupied while another directly saw it free. (CAD Eq. 5)",
  percCheck: "ε_spoof / ε_remove: boxes in free space, or occupied space with no box. (CAD Eq. 7)",
  calibration: "Calibrated likelihoods P(Z|X) per 10 m range bin, fit on a separate calibration split (e.g. P(occ|Occ) = 0.75 at 0–10 m, 0.03 at 40–50 m). Implemented: observationModel.py.",
  fusion: "Leave-one-agent-out fused posterior, tempered by the measured inter-source error correlation ρ ≈ 0.68 so shared errors are not double-counted. Implemented: bayesianFusion.py.",
  hmm: "Forward filter with learned transitions (P(F→O) ≈ 0.0009, P(O→F) ≈ 0.063 per 0.1 s); missing reports add no factor. Implemented: occupancyHmm.py, cadHmm.py.",
  scoring: "Evidence score of reporter i against the others' (temporal) posterior — the implemented form of A = −log P(Z_i | Z_−i). Implemented: anomalyScoring.py.",
  decision: "A5: strong CAD alert OR A4 alert, abstain without corroboration. A5-LR: L2 logistic regression on evidence features. Thresholds fixed on validation at FPR ≤ 5%.",
};

const colorFor = (id: NodeId) => {
  if (id === "obs") return colors.collab;
  const c = pipelineComponents.find((p) => p.id === id)!;
  return colors[c.color as keyof typeof colors] as string;
};

export function CadArchitecture({
  enabled,
  focus,
  onSelect,
  showStatus = false,
  width = 1470,
}: {
  enabled: Set<ComponentId>;
  focus?: NodeId | null;
  onSelect?: (id: NodeId) => void;
  showStatus?: boolean;
  width?: number;
}) {
  const { reducedMotion, paused } = useStage();
  const isOn = (id: NodeId) => id === "obs" || id === "decision" || enabled.has(id);
  const scale = width / 1470;
  const height = 448 * scale;
  const decisionLabel = enabled.has("decision")
    ? "Combined decision"
    : enabled.has("percCheck")
      ? "Alarm"
      : "No detection";
  const decisionSub = enabled.has("decision")
    ? "conflicts ⊕ score"
    : enabled.has("scoring")
      ? "area ≥ σ ∨ A > τ"
      : enabled.has("percCheck")
        ? "conflict area ≥ σ"
        : "attack passes";

  const nodeById = (id: NodeId) => layout.find((n) => n.id === id)!;

  const edgePath = (a: NodeLayout, b: NodeLayout) => {
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <svg width={width} height={height} viewBox="0 0 1470 448" role="img" aria-label="CAD and T-CAD pipeline architecture">
      {/* region labels */}
      <text x={660} y={22} fill={colors.collab} fontSize={13} fontFamily="var(--font-mono)" letterSpacing="0.1em">
        CAD CONSISTENCY CHECKS · PUBLISHED METHOD, OUR RE-IMPLEMENTATION
      </text>
      <text x={600} y={442} fill={colors.prob} fontSize={13} fontFamily="var(--font-mono)" letterSpacing="0.1em" opacity={enabled.has("calibration") ? 1 : 0.35}>
        T-CAD PROBABILISTIC + TEMPORAL BRANCH · IMPLEMENTED & MEASURED IN my simulation
      </text>

      {edges.map(([from, to]) => {
        const on = isOn(from) && isOn(to);
        const a = nodeById(from);
        const b = nodeById(to);
        const d = edgePath(a, b);
        const c = colorFor(to === "decision" ? from : to);
        return (
          <g key={`${from}-${to}`} opacity={on ? 1 : 0.12}>
            <path d={d} fill="none" stroke={c} strokeOpacity={0.45} strokeWidth={2} />
            {on && !reducedMotion && !paused &&
              [0, 1, 2].map((k) => (
                <circle key={k} r={3.2} fill={c}>
                  <animateMotion dur="2.4s" begin={`${k * 0.8}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))}
          </g>
        );
      })}

      {layout.map((n) => {
        const on = isOn(n.id);
        const c = colorFor(n.id);
        const comp = pipelineComponents.find((p) => p.id === n.id);
        const isFocus = focus === n.id;
        const label = n.id === "obs" ? "Observations" : n.id === "decision" ? decisionLabel : comp!.label;
        const sub = n.id === "obs" ? "LiDAR + shared data" : n.id === "decision" ? decisionSub : comp!.sub;
        const origin =
          n.id === "obs" ? "INPUT" : n.id === "decision" ? (enabled.has("decision") ? "T-CAD" : enabled.has("percCheck") ? "CAD" : "—") : comp!.origin === "cad" ? "CAD" : "T-CAD";
        return (
          <motion.g
            key={n.id}
            initial={false}
            animate={{ opacity: on ? 1 : 0.22 }}
            transition={{ duration: 0.5 }}
            onClick={() => onSelect?.(n.id)}
            style={{ cursor: onSelect ? "pointer" : "default" }}
          >
            {isFocus && <rect x={n.x - 5} y={n.y - 5} width={n.w + 10} height={n.h + 10} rx={14} fill="none" stroke={c} strokeOpacity={0.5} strokeWidth={6} />}
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={n.h}
              rx={11}
              fill={colors.panel}
              stroke={c}
              strokeWidth={isFocus ? 2.5 : 1.5}
              strokeDasharray={on ? undefined : "5 4"}
            />
            <rect x={n.x} y={n.y} width={5} height={n.h} rx={2} fill={c} />
            <text x={n.x + 16} y={n.y + 22} fill={c} fontSize={11} fontFamily="var(--font-mono)" letterSpacing="0.08em">
              {origin}
            </text>
            <text x={n.x + 16} y={n.y + 43} fill={colors.ink} fontSize={15.5} fontFamily="var(--font-display)" fontWeight={500}>
              {label}
            </text>
            <text x={n.x + 16} y={n.y + 62} fill={colors.ink2} fontSize={11.5} fontFamily="var(--font-mono)">
              {sub}
            </text>
            {showStatus && comp && (n.id !== "decision" || enabled.has("decision")) && (
              <g>
                <rect x={n.x} y={n.y + n.h + 6} width={n.w} height={20} rx={10} fill={colors.void} stroke={colors[statusMeta[comp.status].tone as keyof typeof colors]} strokeOpacity={0.6} />
                <text x={n.x + n.w / 2} y={n.y + n.h + 20} fill={colors[statusMeta[comp.status].tone as keyof typeof colors]} fontSize={11} textAnchor="middle" fontFamily="var(--font-mono)">
                  {statusMeta[comp.status].label}
                </text>
              </g>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
