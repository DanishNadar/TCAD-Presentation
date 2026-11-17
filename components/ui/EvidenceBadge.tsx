import { BookOpen, FlaskConical, Sparkles, ClipboardList, Clapperboard } from "lucide-react";

/**
 * Information categories (labels as specified in the implementation brief).
 * Every scene that shows a number, figure, video or simulation carries one.
 *  - published    : reported by Zhang et al. (2024)
 *  - measured     : our T-CAD experiment (synthetic simulator, logged results)
 *  - recorded     : a replay recorded from our simulator — a demonstration, not a metric
 *  - illustrative : in-browser teaching simulation
 *  - proposed     : planned, not yet measured
 */
export type EvidenceKind = "published" | "measured" | "recorded" | "illustrative" | "proposed";

const meta: Record<EvidenceKind, { label: string; color: string; Icon: typeof BookOpen; hint: string }> = {
  published: { label: "Published — Zhang et al. (2024)", color: "var(--color-collab)", Icon: BookOpen, hint: "Reported by the original authors, USENIX Security 2024 — not our measurement" },
  measured: { label: "Our measured experiment", color: "var(--color-consistent)", Icon: FlaskConical, hint: "Logged results of our T-CAD implementation on our synthetic simulator (45 test scenarios)" },
  recorded: { label: "Recorded simulator run", color: "#2dd4bf", Icon: Clapperboard, hint: "Replay rendered from our simulator's recorded trace — a demonstration, not a metric" },
  illustrative: { label: "Illustrative simulation", color: "var(--color-prob)", Icon: Sparkles, hint: "Synthetic, in-browser — explains a concept, proves nothing" },
  proposed: { label: "Proposed / not yet measured", color: "var(--color-ink-3)", Icon: ClipboardList, hint: "Planned, not yet executed" },
};

export function EvidenceBadge({ kind, detail }: { kind: EvidenceKind; detail?: string }) {
  const m = meta[kind];
  return (
    <span
      title={m.hint}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.08em]"
      style={{ color: m.color, borderColor: `color-mix(in srgb, ${m.color} 45%, transparent)`, background: `color-mix(in srgb, ${m.color} 9%, transparent)` }}
    >
      <m.Icon size={13} strokeWidth={2} aria-hidden />
      {m.label}
      {detail && <span className="normal-case tracking-normal text-ink-2">· {detail}</span>}
    </span>
  );
}

export const evidenceMeta = meta;

/** Graphic-kind caption required under every research graphic. */
export type GraphicKind = "redrawn" | "paperFigure" | "measuredPlot" | "publishedChart" | "recordedReplay" | "interactive";
const graphicLabel: Record<GraphicKind, string> = {
  redrawn: "Redrawn conceptual diagram",
  paperFigure: "Original paper figure",
  measuredPlot: "Measured plot (our experiment)",
  publishedChart: "Redrawn chart of published data",
  recordedReplay: "Recorded simulator replay",
  interactive: "Interactive illustration",
};

export function SourceNote({ kind, source, className = "" }: { kind?: GraphicKind; source: string; className?: string }) {
  return (
    <p className={`font-mono text-[11px] leading-snug text-ink-3 ${className}`}>
      {kind && <span className="text-ink-2">{graphicLabel[kind]} · </span>}
      Source: {source}
    </p>
  );
}
