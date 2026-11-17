"use client";
import { useEffect, useRef, useState } from "react";
import { scenes } from "@/components/scenes/registry";
import { backupNotes, sceneNotes, totalTargetSeconds } from "@/lib/presenterNotes";
import { fmt, useTicker } from "./PresenterNotes";

/**
 * Separate presenter window (open with S). Synced to the audience deck via
 * BroadcastChannel; navigating here drives the main deck.
 */
export function PresenterView({ channelName }: { channelName: string }) {
  const [index, setIndex] = useState(0);
  const [deckStart, setDeckStart] = useState(() => Date.now());
  const [slideStart, setSlideStart] = useState(() => Date.now());
  const chRef = useRef<BroadcastChannel | null>(null);
  const now = useTicker();

  useEffect(() => {
    const ch = new BroadcastChannel(channelName);
    chRef.current = ch;
    ch.onmessage = (e) => {
      if (e.data?.type === "state") {
        setIndex((prev) => {
          if (prev !== e.data.index) setSlideStart(Date.now());
          return e.data.index;
        });
        if (e.data.deckStart) setDeckStart(e.data.deckStart);
      }
    };
    ch.postMessage({ type: "hello" });
    const onKey = (ev: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(ev.key)) {
        ev.preventDefault();
        ch.postMessage({ type: "goto", index: indexRef.current + 1 });
      }
      if (["ArrowLeft", "PageUp"].includes(ev.key)) ch.postMessage({ type: "goto", index: indexRef.current - 1 });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      ch.close();
      window.removeEventListener("keydown", onKey);
    };
  }, [channelName]);
  const indexRef = useRef(index);
  indexRef.current = index;

  const scene = scenes[index];
  const next = scenes[index + 1];
  const notes = sceneNotes.find((n) => n.id === scene.id);
  const elapsed = (now - slideStart) / 1000;

  return (
    <div className="h-screen overflow-y-auto bg-void p-8 text-ink" style={{ overflow: "auto" }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-mono text-[13px] text-ink-3">
            {index + 1} / {scenes.length} · next: {next ? next.title : "—"}
          </div>
          <h1 className="font-display text-[34px] font-semibold">{scene.title}</h1>
        </div>
        <div className="text-right font-mono">
          <div className={`text-[30px] ${notes && elapsed > notes.targetSeconds ? "text-anomaly" : "text-sensor"}`}>{fmt(elapsed)}</div>
          <div className="text-[14px] text-ink-3">
            target {notes ? fmt(notes.targetSeconds) : "—"} · total {fmt((now - deckStart) / 1000)} / {fmt(totalTargetSeconds)}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button className="rounded border border-line px-3 py-1" onClick={() => chRef.current?.postMessage({ type: "goto", index: index - 1 })}>
              ◀ Prev
            </button>
            <button className="rounded border border-line px-3 py-1" onClick={() => chRef.current?.postMessage({ type: "goto", index: index + 1 })}>
              Next ▶
            </button>
          </div>
        </div>
      </div>
      {notes ? (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="mb-3 text-[18px] text-temporal">{notes.objective}</p>
            <ul className="space-y-2 text-[18px]">
              {notes.points.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
            {notes.interaction && <p className="mt-4 text-[16px] text-prob">Demo: {notes.interaction}</p>}
          </div>
          <div>
            <p className="text-[19px] leading-relaxed text-ink-2">{notes.script}</p>
            <p className="mt-4 text-[16px] italic text-ink-3">→ {notes.transition}</p>
          </div>
        </div>
      ) : (
        <p className="text-[18px] text-ink-2">{backupNotes[scene.id]?.script}</p>
      )}
    </div>
  );
}
