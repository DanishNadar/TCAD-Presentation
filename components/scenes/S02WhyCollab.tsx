"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Eye, Building2, Radar, Layers } from "lucide-react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { UrbanIntersectionSimulation } from "@/components/viz/UrbanIntersectionSimulation";
import { Legend, Segmented } from "@/components/ui/Controls";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { VideoPanel } from "@/components/ui/Media";

type View = "split" | "ego" | "collab" | "recorded";

export function S02WhyCollab() {
  const [view, setView] = useState<View>("split");
  const [groundTruth, setGroundTruth] = useState(true);

  return (
    <div className="absolute inset-0 px-16 pb-10 pt-12">
      <SceneHeader
        kicker="02 · Motivation"
        title="Why collaborative perception exists"
        subtitle="Same intersection, same instant. One vehicle's sensors are bounded by range and line of sight; sharing extends both."
        right={<EvidenceBadge kind={view === "recorded" ? "recorded" : "illustrative"} detail={view === "recorded" ? "scenario B, seed 42" : undefined} />}
      />

      <div className="mt-6 flex items-center justify-between">
        <Segmented<View>
          ariaLabel="Perception view"
          value={view}
          onChange={setView}
          options={[
            { value: "split", label: "Split" },
            { value: "ego", label: "EGO only" },
            { value: "collab", label: "Collaborative" },
            { value: "recorded", label: "my simulation (recorded)" },
          ]}
        />
        <div className={`flex items-center gap-6 ${view === "recorded" ? "invisible" : ""}`}>
          <Legend
            items={[
              { color: "var(--color-sensor)", label: "Detected by EGO", pattern: "outline" },
              { color: "var(--color-collab)", label: "Detected via sharing", pattern: "outline" },
              { color: "var(--color-unknown)", label: "Exists, not perceived", pattern: "dash" },
            ]}
          />
          <label className="flex items-center gap-2 text-[14px] text-ink-2">
            <input type="checkbox" checked={groundTruth} onChange={(e) => setGroundTruth(e.target.checked)} className="accent-[var(--color-ink-3)]" />
            Show ground truth
          </label>
        </div>
      </div>

      {view === "recorded" && (
        <div className="mt-4 flex gap-5">
          <VideoPanel id="occlusionWorld" width={725} />
          <VideoPanel id="occlusionLidar" width={725} />
        </div>
      )}
      <div className={`mt-4 flex gap-5 ${view === "recorded" ? "hidden" : ""}`}>
        {(view === "split" || view === "ego") && (
          <motion.figure layout className="overflow-hidden rounded-xl border border-line">
            <UrbanIntersectionSimulation mode="egoOnly" width={view === "split" ? 725 : 1468} height={view === "split" ? 408 : 520} showGroundTruth={groundTruth} />
            <figcaption className="flex items-center gap-2 border-t border-line bg-panel px-4 py-2 text-[14px] text-sensor">
              <Eye size={15} /> EGO only — limited by its own line of sight
            </figcaption>
          </motion.figure>
        )}
        {(view === "split" || view === "collab") && (
          <motion.figure layout className="overflow-hidden rounded-xl border border-line">
            <UrbanIntersectionSimulation mode="collab" width={view === "split" ? 725 : 1468} height={view === "split" ? 408 : 520} showGroundTruth={groundTruth} />
            <figcaption className="flex items-center gap-2 border-t border-line bg-panel px-4 py-2 text-[14px] text-collab">
              <Radar size={15} /> Collaborative — EGO + CAV-B + CAV-C share perception
            </figcaption>
          </motion.figure>
        )}
      </div>

      {view === "split" && (
        <div className="mt-5 grid grid-cols-3 gap-5">
          {[
            { Icon: Building2, title: "Occlusion", body: "Buildings and other vehicles cast sensor shadows; the approaching car is invisible to EGO." },
            { Icon: Radar, title: "Range & sparsity", body: "LiDAR returns thin out with distance; the paper's occupancy maps cover ~50 m." },
            {
              Icon: Layers,
              title: "What gets shared",
              body: "Raw point clouds (early fusion), neural feature maps (intermediate), or object boxes (late fusion).",
            },
          ].map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="rounded-xl border border-line bg-panel/70 p-4"
            >
              <div className="mb-1 flex items-center gap-2 font-display text-[18px] font-medium">
                <Icon size={17} className="text-sensor" /> {title}
              </div>
              <p className="text-[15px] leading-snug text-ink-2">{body}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
