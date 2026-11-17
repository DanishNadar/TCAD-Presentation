"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { CadArchitecture, componentExplanations } from "@/components/viz/CadArchitecture";
import { Legend } from "@/components/ui/Controls";
import type { ComponentId } from "@/lib/research/implementationStatus";
import { colors } from "@/components/viz/palette";
import { Segmented } from "@/components/ui/Controls";
import { FigurePlate } from "@/components/ui/Media";
import { measuredFigureSource } from "@/lib/research/media";
import { SourceNote } from "@/components/ui/EvidenceBadge";
import { assetPath } from "@/lib/research/media";

type View = "build" | "implemented" | "diagram";

const cadCore: ComponentId[] = ["occupancy", "sync", "occCheck", "percCheck"];
const buildOrder: { add: ComponentId | null; title: string; color: string }[] = [
  { add: null, title: "Original CAD", color: colors.collab },
  { add: "calibration", title: "+ Evidence calibration", color: colors.prob },
  { add: "fusion", title: "+ Probabilistic fusion", color: colors.prob },
  { add: "hmm", title: "+ Temporal state estimation", color: colors.temporal },
  { add: "scoring", title: "+ Anomaly scoring", color: colors.temporal },
  { add: "decision", title: "+ Decision layer", color: colors.anomaly },
];

export function S07Tcad() {
  const [view, setView] = useState<View>("build");
  const [stage, setStage] = useState(0);
  const [focus, setFocus] = useState<ComponentId | "obs" | null>(null);
  const enabled = useMemo(
    () => new Set<ComponentId>([...cadCore, ...(buildOrder.slice(1, stage + 1).map((b) => b.add) as ComponentId[])]),
    [stage],
  );
  const shown = focus ?? buildOrder[stage].add ?? "occCheck";

  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader
        kicker="07 · Our extension"
        accent="var(--color-temporal)"
        title={
          <>
            Introducing <span className="text-temporal">T-CAD</span>
          </>
        }
        subtitle="Temporal Collaborative Anomaly Detection: keep every CAD component; add calibrated uncertainty, multi-vehicle fusion, temporal inference and a leave-one-out anomaly score."
        right={
          <div className="flex flex-col items-end gap-2">
            <Segmented<View>
              size="sm"
              ariaLabel="Architecture view"
              value={view}
              onChange={setView}
              color={colors.temporal}
              options={[
                { value: "build", label: "Build-up" },
                { value: "implemented", label: "As implemented" },
                { value: "diagram", label: "Concept diagram" },
              ]}
            />
            <EvidenceBadge kind="measured" detail="implemented & evaluated in my simulation" />
          </div>
        }
      />
      {view === "implemented" && (
        <div className="mt-6 flex gap-5">
          <FigurePlate
            file="fig08_tcad_architecture.png"
            title="T-CAD evidence combination as implemented (A0 → A5 / A5-LR)"
            source={measuredFigureSource("fig08_tcad_architecture", "architectural")}
            width={900}
            kind="redrawn"
          />
          <FigurePlate
            file="fig01_system_architecture.png"
            title="Module and data-flow architecture of the T-CAD repository (simulator → sensors → perception → V2V → models)"
            source={measuredFigureSource("fig01_system_architecture", "architectural")}
            width={555}
            kind="redrawn"
          />
        </div>
      )}
      {view === "diagram" && (
        <figure className="mx-auto mt-6 w-[1080px] overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/diagrams/cad_tcad_architecture.svg")} alt="From CAD to proposed T-CAD — conceptual diagram" className="block w-full" />
          <figcaption className="border-t border-line bg-panel px-3 py-2">
            <SourceNote kind="redrawn" source="research-data/diagrams/cad_tcad_architecture.svg (handoff package, wording updated to measured status; editable diagram, not an experimental artifact)" />
          </figcaption>
        </figure>
      )}
      <div className={view === "build" ? "" : "hidden"}>

      <div className="mt-5 flex items-center gap-2">
        {buildOrder.map((b, i) => (
          <button
            key={b.title}
            onClick={() => {
              setStage(i);
              setFocus(null);
            }}
            className="rounded-lg border px-3 py-1.5 text-[14px] transition-colors"
            style={{
              borderColor: i <= stage ? b.color : "var(--color-line)",
              color: i <= stage ? "var(--color-ink)" : "var(--color-ink-3)",
              background: i === stage ? `color-mix(in srgb, ${b.color} 14%, transparent)` : "transparent",
            }}
          >
            {b.title}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <CadArchitecture enabled={enabled} focus={shown} onSelect={(id) => setFocus(id as ComponentId)} />
      </div>

      <div className="mt-3 flex items-start gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={shown}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 rounded-xl border border-line bg-panel/80 px-5 py-4 text-[18px] leading-snug text-ink-2"
          >
            {componentExplanations[shown]}
          </motion.div>
        </AnimatePresence>
        <div className="w-[420px] space-y-2 pt-1">
          <Legend
            items={[
              { color: colors.sensor, label: "Occupancy evidence (CAD)" },
              { color: colors.collab, label: "Collaborative checks (CAD)" },
              { color: colors.prob, label: "Probabilistic (T-CAD)" },
              { color: colors.temporal, label: "Temporal (T-CAD)" },
              { color: colors.anomaly, label: "Decision" },
            ]}
          />
          <p className="text-[13px] text-ink-3">Click any module for its role. All modules are implemented; results come from our synthetic simulator (Scenes 12–13).</p>
        </div>
      </div>
      </div>
    </div>
  );
}
