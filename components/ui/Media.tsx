"use client";
/**
 * Media building blocks: recorded simulator videos and measured figure plates.
 * Videos autoplay muted/looped, pause with the deck's global pause, and do not
 * autoplay in reduced-motion mode. Figures open in a lightbox on click.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { useStage } from "@/components/shell/StageContext";
import { assetPath, videoCatalog, type VideoId } from "@/lib/research/media";
import { SourceNote } from "./EvidenceBadge";

export function VideoPanel({
  id,
  width,
  caption = true,
  className = "",
}: {
  id: VideoId;
  width: number;
  caption?: boolean;
  className?: string;
}) {
  const v = videoCatalog[id];
  const ref = useRef<HTMLVideoElement>(null);
  const { paused, reducedMotion } = useStage();
  const [playing, setPlaying] = useState(!reducedMotion);
  const [failed, setFailed] = useState(false);
  const height = Math.round((width * 960) / 1600);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing && !paused) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, paused]);

  return (
    <figure className={`overflow-hidden rounded-xl border border-line bg-panel/90 ${className}`} style={{ width }}>
      <div className="group relative" style={{ width, height }}>
        {failed ? (
          <div className="flex h-full items-center justify-center text-[14px] text-ink-3">Video unavailable: {v.file}</div>
        ) : (
          <video
            ref={ref}
            src={assetPath(`/videos/${v.file}`)}
            poster={assetPath(`/videos/${v.poster}`)}
            muted
            loop
            playsInline
            preload="metadata"
            width={width}
            height={height}
            onError={() => setFailed(true)}
            className="block h-full w-full object-cover"
            aria-label={v.title}
          />
        )}
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute bottom-2 left-2 rounded-md bg-void/75 p-1.5 text-ink opacity-70 transition-opacity hover:opacity-100"
        >
          {playing && !paused ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="absolute left-2 top-2 rounded bg-void/75 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#2dd4bf]">
          recorded · {v.scenario}
        </span>
      </div>
      {caption && (
        <figcaption className="border-t border-line px-3 py-2">
          <div className="text-[13.5px] leading-snug text-ink">{v.title}</div>
          <SourceNote kind="recordedReplay" source={v.source} className="mt-0.5" />
        </figcaption>
      )}
    </figure>
  );
}

export function FigurePlate({
  file,
  title,
  source,
  width,
  maxHeight,
  kind = "measuredPlot",
}: {
  file: string;
  title: string;
  source: string;
  width: number;
  maxHeight?: number;
  kind?: "measuredPlot" | "redrawn" | "paperFigure";
}) {
  const [open, setOpen] = useState(false);
  const src = assetPath(file.startsWith("/") ? file : `/figures/${file}`);
  return (
    <>
      <figure className="overflow-hidden rounded-xl border border-line bg-panel/90" style={{ width }}>
        <button onClick={() => setOpen(true)} className="group relative block w-full bg-white" aria-label={`Enlarge: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title} className="block w-full object-contain" style={{ maxHeight }} loading="lazy" />
          <span className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 size={14} />
          </span>
        </button>
        <figcaption className="border-t border-line px-3 py-2">
          <div className="text-[13.5px] leading-snug text-ink">{title}</div>
          <SourceNote kind={kind} source={source} className="mt-0.5" />
        </figcaption>
      </figure>
      <Lightbox open={open} onClose={() => setOpen(false)} src={src} title={title} />
    </>
  );
}

/** Compact thumbnail that opens the same lightbox (figure gallery). */
export function FigureThumb({ file, title, kind, width, height }: { file: string; title: string; kind: string; width: number; height: number }) {
  const [open, setOpen] = useState(false);
  const src = assetPath(file.startsWith("/") ? file : `/figures/${file}`);
  // Concept diagrams are dark vector art: give them a matching backdrop instead of white letterbox bars.
  const dark = kind === "concept";
  const tone = kind === "measured" ? "text-consistent" : kind === "illustrative" ? "text-prob" : kind === "concept" ? "text-temporal" : "text-ink-2";
  return (
    <>
      <button onClick={() => setOpen(true)} className="group overflow-hidden rounded-lg border border-line bg-panel/90 text-left hover:border-ink-3" style={{ width }} aria-label={`Open figure: ${title}`}>
        <div className={`flex items-center justify-center ${dark ? "bg-[#0a1626]" : "bg-white"}`} style={{ height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title} className="h-full w-full object-contain" loading="lazy" />
        </div>
        <div className="px-2 py-1">
          <div className={`font-mono text-[10px] uppercase tracking-[0.08em] ${tone}`}>{kind === "measured" ? "measured plot" : kind === "illustrative" ? "illustrative (calibrated params)" : kind === "concept" ? "redrawn conceptual diagram" : "architecture diagram"}</div>
          <div className="truncate text-[12px] text-ink">{title}</div>
        </div>
      </button>
      <Lightbox open={open} onClose={() => setOpen(false)} src={src} title={title} dark={dark} />
    </>
  );
}

function Lightbox({ open, onClose, src, title, dark = false }: { open: boolean; onClose: () => void; src: string; title: string; dark?: boolean }) {
  // Vector diagrams scale cleanly, so fill the viewport instead of showing them at their intrinsic size.
  const vector = src.toLowerCase().endsWith(".svg");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-8"
          onClick={onClose}
          data-capture-keys
        >
          <div className={`relative max-h-full max-w-full rounded-lg p-3 ${dark ? "bg-[#0a1626]" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={title} className={vector ? "block h-[86vh] w-[92vw] object-contain" : "max-h-[86vh] max-w-[92vw] object-contain"} />
            <button onClick={onClose} aria-label="Close" className="absolute -right-3 -top-3 rounded-full bg-void p-1.5 text-ink">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
