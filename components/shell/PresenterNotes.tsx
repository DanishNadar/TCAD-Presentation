"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { backupNotes, sceneNotes, totalTargetSeconds } from "@/lib/presenterNotes";

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function useTicker(ms = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Slide-in drawer with talking points, script and timers. */
export function PresenterNotes({
  sceneId,
  slideStart,
  deckStart,
  onClose,
}: {
  sceneId: string;
  slideStart: number;
  deckStart: number;
  onClose: () => void;
}) {
  const now = useTicker();
  const notes = sceneNotes.find((n) => n.id === sceneId);
  const backup = backupNotes[sceneId];
  const elapsed = (now - slideStart) / 1000;
  const over = notes && elapsed > notes.targetSeconds;

  return (
    <motion.aside
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 260 }}
      className="absolute bottom-0 left-0 right-0 z-30 max-h-[46%] overflow-y-auto border-t border-line bg-panel/95 px-8 pb-16 pt-5 backdrop-blur-md"
      aria-label="Presenter notes"
      data-capture-keys
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-3">Presenter notes</span>
          <span className="font-display text-[20px] font-semibold">{notes?.title ?? backup?.title}</span>
        </div>
        <div className="flex items-center gap-5 font-mono text-[14px]">
          {notes && (
            <span className={over ? "text-anomaly" : "text-ink-2"}>
              slide {fmt(elapsed)} / {fmt(notes.targetSeconds)}
            </span>
          )}
          <span className="text-ink-3">
            total {fmt((now - deckStart) / 1000)} / {fmt(totalTargetSeconds)}
          </span>
          <button onClick={onClose} aria-label="Close notes" className="text-ink-3 hover:text-ink">
            <X size={18} />
          </button>
        </div>
      </div>
      {notes ? (
        <div className="grid grid-cols-[1fr_1.25fr] gap-8">
          <div>
            <p className="mb-2 text-[14px] text-temporal">{notes.objective}</p>
            <ul className="space-y-1.5 text-[14px] leading-snug text-ink">
              {notes.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-ink-3">•</span>
                  {p}
                </li>
              ))}
            </ul>
            {notes.interaction && <p className="mt-3 text-[13px] text-prob">Demo: {notes.interaction}</p>}
          </div>
          <div>
            <p className="text-[15px] leading-relaxed text-ink-2">{notes.script}</p>
            <p className="mt-3 text-[13px] italic text-ink-3">Transition → {notes.transition}</p>
          </div>
        </div>
      ) : (
        <p className="text-[15px] text-ink-2">{backup?.script}</p>
      )}
    </motion.aside>
  );
}
