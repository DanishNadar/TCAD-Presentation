"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { UrbanIntersectionSimulation } from "@/components/viz/UrbanIntersectionSimulation";
import { Segmented } from "@/components/ui/Controls";
import { EvidenceBadge, SourceNote } from "@/components/ui/EvidenceBadge";
import { VideoPanel } from "@/components/ui/Media";
import { videoCatalog } from "@/lib/research/media";

export function S03Threat() {
  const [mode, setMode] = useState<"benign" | "fab" | "sim">("fab");
  const fabricated = mode !== "benign";
  const rows = [
    { label: "Physical scene", value: "No object ahead of EGO", color: "var(--color-ink)" },
    { label: "EGO's local LiDAR", value: "Region scanned → free space", color: "var(--color-sensor)" },
    {
      label: "Shared perception (CAV-B)",
      value: fabricated ? "Object reported ahead of EGO" : "Consistent with EGO",
      color: fabricated ? "var(--color-anomaly)" : "var(--color-collab)",
    },
    {
      label: "Evidence agreement",
      value: fabricated ? "Conflict: occupied vs. observed free" : "Consistent",
      color: fabricated ? "var(--color-anomaly)" : "var(--color-consistent)",
    },
  ];

  return (
    <div className="absolute inset-0 px-16 pb-10 pt-12">
      <SceneHeader
        kicker="03 · Threat"
        accent="var(--color-anomaly)"
        title="The security problem: fabricated perception"
        subtitle="A malicious or compromised participant sends data that disagrees with the physical world. The victim's perception changes — even though its own sensor saw something else."
        right={mode === "sim" ? <EvidenceBadge kind="recorded" detail="scenario C, seed 42" /> : <EvidenceBadge kind="illustrative" detail="synthetic, effect-only" />}
      />
      <div className="mt-7 flex gap-6">
        {mode === "sim" ? (
          <VideoPanel id="contradictoryOccupancy" width={833} caption={false} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <UrbanIntersectionSimulation mode={fabricated ? "fabricated" : "collab"} width={940} height={500} />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4">
          <Segmented
            ariaLabel="Shared report"
            value={mode}
            onChange={setMode}
            size="sm"
            color={mode === "benign" ? "var(--color-collab)" : mode === "sim" ? "#2dd4bf" : "var(--color-anomaly)"}
            options={[
              { value: "benign", label: "Benign sharing" },
              { value: "fab", label: "Fabricated report" },
              { value: "sim", label: "my simulation" },
            ]}
          />
          <div className="divide-y divide-line rounded-xl border border-line bg-panel/80">
            {rows.map((r) => (
              <div key={r.label} className="px-4 py-3">
                <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-3">{r.label}</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={r.value}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-0.5 text-[17px]"
                    style={{ color: r.color }}
                  >
                    {r.value}
                  </motion.div>
                </AnimatePresence>
              </div>
            ))}
          </div>
          {mode === "sim" && (
            <div className="rounded-xl border border-[#2dd4bf]/40 bg-panel/60 p-3 text-[13.5px] leading-snug text-ink-2">
              {videoCatalog.contradictoryOccupancy.title}. cav00's shared report contains a bounded synthetic phantom from 6.5 s to 9.4 s.
              <SourceNote kind="recordedReplay" source={videoCatalog.contradictoryOccupancy.source} className="mt-1.5" />
            </div>
          )}
          <div className={`rounded-xl border border-line bg-panel/60 p-4 text-[14px] leading-snug text-ink-2 ${mode === "sim" ? "hidden" : ""}`}>
            <span className="text-ink">Paper's threat model:</span> an insider participant crafts shared data to <b className="text-anomaly">spoof</b> a
            non-existent object (→ hard brake) or <b className="text-anomaly">remove</b> a real one (→ collision risk). We show only the effect on the
            victim's view — no attack mechanism.
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-5 flex items-center gap-3 font-display text-[25px] font-medium"
      >
        <ShieldAlert className="text-anomaly" size={26} />
        How can the receiving vehicle determine which shared observations are trustworthy?
      </motion.div>
    </div>
  );
}
