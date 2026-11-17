"use client";
import { motion } from "motion/react";
import { scenes } from "@/components/scenes/registry";
import { sceneNotes } from "@/lib/presenterNotes";

export function SlideOverview({ current, onSelect, onClose }: { current: number; onSelect: (i: number) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 overflow-y-auto bg-void/92 p-12 backdrop-blur-md"
      onClick={onClose}
      data-capture-keys
    >
      <h2 className="mb-6 font-display text-[28px] font-semibold">Scenes</h2>
      <div className="grid grid-cols-5 gap-4" onClick={(e) => e.stopPropagation()}>
        {scenes.map((s, i) => {
          const n = sceneNotes.find((x) => x.id === s.id);
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelect(i)}
              className={`group flex h-[128px] flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                i === current ? "border-sensor bg-panel-2" : "border-line bg-panel hover:border-ink-3"
              }`}
            >
              <span className="font-mono text-[12px] tracking-[0.1em]" style={{ color: s.accent }}>
                {s.backup ? "BACKUP" : String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-[17px] font-medium leading-tight">{s.title}</span>
              <span className="font-mono text-[11px] text-ink-3">{n ? `${n.targetSeconds}s · #${s.id}` : `#${s.id}`}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
