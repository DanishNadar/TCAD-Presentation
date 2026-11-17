"use client";
import { motion } from "motion/react";
import { UrbanIntersectionSimulation } from "@/components/viz/UrbanIntersectionSimulation";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { Legend } from "@/components/ui/Controls";

export function S01Opening() {
  return (
    <div className="absolute inset-0">
      <UrbanIntersectionSimulation mode="opening" width={1600} height={900} cinematic showLabels focusX={1110} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-void via-void/75 to-transparent" style={{ width: 860 }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />

      <div className="absolute left-16 top-20 w-[720px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6 font-mono text-[13px] uppercase tracking-[0.22em] text-ink-3"
        >
          CS 528 · Data Security &amp; Privacy · Illinois Institute of Technology
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[76px] font-semibold leading-[0.98] tracking-[-0.03em]"
        >
          When vehicles
          <br />
          <span className="text-sensor">share reality</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 text-[22px] leading-snug text-ink-2"
        >
          Data fabrication in collaborative vehicular perception — the CAD defense, and{" "}
          <span className="text-temporal">T-CAD</span>: a proposed temporal, probabilistic extension.
        </motion.p>
        <motion.blockquote
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2, duration: 0.9 }}
          className="mt-14 border-l-2 border-collab pl-6 font-display text-[32px] font-medium leading-tight text-ink"
        >
          What happens when an autonomous vehicle trusts what another vehicle sees?
        </motion.blockquote>
      </div>

      <div className="absolute bottom-14 left-16 flex items-center gap-6">
        <Legend
          items={[
            { color: "var(--color-sensor)", label: "EGO's own LiDAR field" },
            { color: "var(--color-collab)", label: "Shared by collaborating CAVs" },
            { color: "var(--color-ink-3)", label: "Occluded object", pattern: "dash" },
          ]}
        />
      </div>
      <div className="absolute right-6 top-12">
        <EvidenceBadge kind="illustrative" detail="2-D ray-cast world" />
      </div>
    </div>
  );
}
