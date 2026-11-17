"use client";
import { useState } from "react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { AnomalyScoreTimeline } from "@/components/viz/AnomalyScoreTimeline";
import { MeasuredEvents } from "@/components/viz/MeasuredEvents";
import { Segmented } from "@/components/ui/Controls";
import { colors } from "@/components/viz/palette";

export function S11Anomaly() {
  const [mode, setMode] = useState<"illustrative" | "measured">("illustrative");
  return (
    <div className="absolute inset-0 px-16 pb-6 pt-10">
      <SceneHeader
        kicker="11 · Contribution C — anomaly scoring"
        accent="var(--color-anomaly)"
        title="Anomaly detection over time"
        subtitle="Leave-one-vehicle-out: how surprising is vehicle i's report, given everyone else and the past? Left: teaching simulation. Right toggle: what our implementation measured."
        right={
          <div className="flex flex-col items-end gap-2">
            <Segmented
              size="sm"
              ariaLabel="Anomaly view"
              value={mode}
              onChange={setMode}
              color={mode === "illustrative" ? colors.prob : colors.consistent}
              options={[
                { value: "illustrative", label: "Illustrative score" },
                { value: "measured", label: "Measured episodes" },
              ]}
            />
            {mode === "illustrative" ? <EvidenceBadge kind="illustrative" detail="synthetic sequences" /> : <EvidenceBadge kind="measured" detail="+ recorded replay" />}
          </div>
        }
      />
      <div className={`mt-4 ${mode === "illustrative" ? "" : "hidden"}`}>
        <AnomalyScoreTimeline />
      </div>
      {mode === "measured" && (
        <div className="mt-4">
          <MeasuredEvents />
        </div>
      )}
    </div>
  );
}
