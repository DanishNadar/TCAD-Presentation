"use client";
import { motion } from "motion/react";
import { UrbanIntersectionSimulation } from "@/components/viz/UrbanIntersectionSimulation";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { colors } from "@/components/viz/palette";

const takeaways = [
  { n: "1", color: colors.sensor, text: "Collaborative perception improves awareness — and imports a trust problem." },
  { n: "2", color: colors.collab, text: "CAD (Zhang et al., 2024) detects fabrication through geometric consistency between vehicles' occupancy maps." },
  { n: "3", color: colors.temporal, text: "Our T-CAD simulator study: fused temporal evidence (A4/A5) matches CAD overall and helps most on removal and missing data; only a learned decision layer clearly wins — still to be shown on real data." },
];

/** Compact, projector-legible pipeline strip overlaid on the world. */
const pipeline = [
  { label: "Observations", origin: "input", color: colors.collab },
  { label: "Occupancy maps", origin: "CAD", color: colors.sensor },
  { label: "Sync", origin: "CAD", color: colors.sensor },
  { label: "Consistency checks", origin: "CAD", color: colors.collab },
  { label: "Calibration", origin: "T-CAD", color: colors.prob },
  { label: "Fusion", origin: "T-CAD", color: colors.prob },
  { label: "Temporal HMM", origin: "T-CAD", color: colors.temporal },
  { label: "Anomaly score", origin: "T-CAD", color: colors.temporal },
  { label: "Decision", origin: "T-CAD", color: colors.anomaly },
];

export function S14Conclusion() {
  return (
    <div className="absolute inset-0">
      <UrbanIntersectionSimulation mode="defended" width={1600} height={900} cinematic focusX={1150} />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[900px] bg-gradient-to-r from-void via-void/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[330px] bg-gradient-to-t from-void via-void/90 to-transparent" />

      <div className="absolute left-16 top-12 w-[640px]">
        <div className="mb-2 font-mono text-[13px] uppercase tracking-[0.18em] text-temporal">14 · Conclusion</div>
        <h1 className="font-display text-[46px] font-semibold leading-[1.05] tracking-[-0.02em]">Trust, checked across vehicles and over time</h1>
        <div className="mt-6 space-y-3">
          {takeaways.map((t, i) => (
            <motion.div
              key={t.n}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.25 }}
              className="flex gap-4 rounded-xl border border-line bg-panel/80 p-4 backdrop-blur-sm"
            >
              <span className="font-display text-[30px] font-semibold leading-none" style={{ color: t.color }}>
                {t.n}
              </span>
              <span className="text-[18px] leading-snug text-ink">{t.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute right-6 top-12 flex gap-2">
        <EvidenceBadge kind="published" detail="CAD" />
        <EvidenceBadge kind="measured" detail="T-CAD (simulator)" />
      </div>

      {/* defensive pipeline overlay */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="absolute left-16 right-16 top-[590px] flex items-center"
        aria-label="Defensive analysis pipeline"
      >
        {pipeline.map((p, i) => (
          <div key={p.label} className="flex flex-1 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4 + i * 0.09 }}
              className="flex-1 rounded-lg border bg-panel/90 px-2.5 py-2 backdrop-blur-sm"
              style={{ borderColor: p.color }}
            >
              <div className="font-mono text-[10.5px] tracking-[0.08em]" style={{ color: p.color }}>
                {p.origin}
              </div>
              <div className="text-[14px] leading-tight text-ink">{p.label}</div>
            </motion.div>
            {i < pipeline.length - 1 && (
              <div className="relative h-[2px] w-5 shrink-0 overflow-hidden" style={{ background: `${p.color}55` }}>
                <motion.div
                  className="absolute top-0 h-full w-2"
                  style={{ background: p.color }}
                  animate={{ left: ["-30%", "110%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12, ease: "linear" }}
                />
              </div>
            )}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.9 }}
        className="absolute bottom-16 left-16 right-16"
      >
        <blockquote className="max-w-[1250px] border-l-2 border-temporal pl-6 font-display text-[29px] font-medium leading-snug">
          Trustworthy collaborative perception requires understanding not only what vehicles report, but how that evidence agrees across vehicles and
          evolves over time.
        </blockquote>
        <p className="mt-3 pl-6 text-[15px] text-ink-3">
          Measured on a synthetic simulator (45 test scenarios) — not comparable to the paper's Adv-OPV2V numbers. Next: Adv-OPV2V replay, longer sequences,
          adaptive temporally consistent attacks. · Questions → backup slides
        </p>
      </motion.div>
    </div>
  );
}
