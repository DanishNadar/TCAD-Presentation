"use client";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Grid3x3,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Waves,
  MonitorPlay,
  Keyboard,
} from "lucide-react";
import { scenes } from "@/components/scenes/registry";
import { motionSettings } from "@/lib/sim/clock";
import { StageContext, stageHeight, stageWidth } from "./StageContext";
import { PresenterNotes } from "./PresenterNotes";
import { SlideOverview } from "./SlideOverview";
import { PresenterView } from "./PresenterView";
import { IconButton } from "@/components/ui/Controls";

const channelName = "tcad-deck";

function indexFromHash(): number {
  if (typeof window === "undefined") return 0;
  const id = window.location.hash.replace(/^#\/?/, "");
  const i = scenes.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}

/** Keys pressed inside interactive controls must not change slides. */
function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-capture-keys]")) return true;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA" ||
    tag === "BUTTON" ||
    target.isContentEditable ||
    target.getAttribute("role") === "slider" ||
    target.getAttribute("role") === "radio"
  );
}

export function PresentationShell() {
  const [isPresenter, setIsPresenter] = useState(false);
  useEffect(() => {
    setIsPresenter(new URLSearchParams(window.location.search).has("presenter"));
  }, []);
  if (isPresenter) return <PresenterView channelName={channelName} />;
  return <Deck />;
}

function Deck() {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [notesOpen, setNotesOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [deckStart] = useState(() => Date.now());
  const [slideStart, setSlideStart] = useState(() => Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // --- initial state from URL hash + OS reduced-motion preference
  useEffect(() => {
    setIndex(indexFromHash());
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onHash = () => setIndex(indexFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // --- stage scaling to fit any viewport at 16:9
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / stageWidth, window.innerHeight / stageHeight));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // --- mirror settings into the animation clock
  useEffect(() => {
    motionSettings.paused = paused;
    motionSettings.reducedMotion = reducedMotion;
  }, [paused, reducedMotion]);

  const goTo = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(scenes.length - 1, i));
    setIndex(clamped);
    setSlideStart(Date.now());
    const id = scenes[clamped].id;
    if (window.location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  }, []);

  // --- presenter-window sync
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(channelName);
    channelRef.current = ch;
    ch.onmessage = (e) => {
      if (e.data?.type === "goto") goTo(e.data.index);
      if (e.data?.type === "hello") ch.postMessage({ type: "state", index: indexRef.current, deckStart });
    };
    return () => ch.close();
  }, [goTo, deckStart]);
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
    channelRef.current?.postMessage({ type: "state", index, deckStart });
  }, [index, deckStart]);

  // --- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const interactive = isInteractiveTarget(e.target);
      const k = e.key;
      if (k === "Escape") {
        setOverviewOpen(false);
        setHelpOpen(false);
        return;
      }
      if (interactive && !["PageDown", "PageUp"].includes(k)) return;
      if (k === "ArrowRight" || k === "PageDown" || (k === " " && !e.shiftKey)) {
        e.preventDefault();
        goTo(indexRef.current + 1);
      } else if (k === "ArrowLeft" || k === "PageUp" || (k === " " && e.shiftKey)) {
        e.preventDefault();
        goTo(indexRef.current - 1);
      } else if (k === "Home") goTo(0);
      else if (k === "End") goTo(scenes.length - 1);
      else if (k === "f" || k === "F") toggleFullscreen();
      else if (k === "n" || k === "N") setNotesOpen((v) => !v);
      else if (k === "o" || k === "O" || k === "g" || k === "G") setOverviewOpen((v) => !v);
      else if (k === "p" || k === "P") setPaused((v) => !v);
      else if (k === "m" || k === "M") setReducedMotion((v) => !v);
      else if (k === "r" || k === "R") setResetToken((v) => v + 1);
      else if (k === "?" || k === "h" || k === "H") setHelpOpen((v) => !v);
      else if (k === "s" || k === "S") openPresenterWindow();
      else if (/^[0-9]$/.test(k)) {
        // 1–9 jump to scenes 1–9, 0 jumps to scene 10
        goTo(k === "0" ? 9 : parseInt(k, 10) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  // --- auto-hide chrome when the mouse is idle
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setChromeVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setChromeVisible(false), 2800);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  const scene = scenes[index];
  const SceneComponent = scene.component;
  const mainCount = scenes.filter((s) => !s.backup).length;
  const stageInfo = useMemo(() => ({ scale, reducedMotion, paused, resetToken }), [scale, reducedMotion, paused, resetToken]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <StageContext.Provider value={stageInfo}>
        <div className="fixed inset-0 flex items-center justify-center bg-void">
          <div
            className="stage-vignette relative overflow-hidden bg-void"
            style={{ width: stageWidth, height: stageHeight, transform: `scale(${scale})`, transformOrigin: "center center", flex: "none" }}
          >
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
            <AnimatePresence initial={false}>
              <motion.section
                key={`${scene.id}-${resetToken}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.012, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.992, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${scenes.length}: ${scene.title}`}
              >
                <SceneComponent />
              </motion.section>
            </AnimatePresence>

            {/* progress */}
            <div className="absolute left-0 right-0 top-0 flex h-[3px] gap-[2px] px-[2px]" aria-hidden>
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  tabIndex={-1}
                  onClick={() => goTo(i)}
                  className="h-full flex-1 rounded-full transition-colors"
                  style={{
                    background: i <= index ? (s.backup ? "var(--color-ink-3)" : "var(--color-sensor)") : "var(--color-line)",
                    opacity: s.backup ? 0.6 : 1,
                  }}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute right-6 top-4 font-mono text-[12px] tracking-[0.1em] text-ink-3">
              {scene.backup ? "BACKUP" : `${String(index + 1).padStart(2, "0")} / ${mainCount}`} · CS 528 · T-CAD
            </div>
            {paused && (
              <div className="pointer-events-none absolute left-6 top-4 font-mono text-[12px] tracking-[0.1em] text-temporal">⏸ SIMULATIONS PAUSED</div>
            )}

            {/* control bar */}
            <motion.nav
              aria-label="Presentation controls"
              animate={{ opacity: chromeVisible || notesOpen ? 1 : 0, y: chromeVisible || notesOpen ? 0 : 8 }}
              className="absolute bottom-4 right-5 z-40 flex items-center gap-1.5"
            >
              <IconButton label="Previous (←)" onClick={() => goTo(index - 1)} disabled={index === 0}>
                <ChevronLeft size={16} />
              </IconButton>
              <IconButton label="Next (→ / Space)" onClick={() => goTo(index + 1)} disabled={index === scenes.length - 1}>
                <ChevronRight size={16} />
              </IconButton>
              <span className="mx-1 h-5 w-px bg-line" />
              <IconButton label={paused ? "Resume simulations (P)" : "Pause simulations (P)"} onClick={() => setPaused((v) => !v)} active={paused}>
                {paused ? <Play size={15} /> : <Pause size={15} />}
              </IconButton>
              <IconButton label="Reset scene (R)" onClick={() => setResetToken((v) => v + 1)}>
                <RotateCcw size={15} />
              </IconButton>
              <IconButton label={`Reduced motion ${reducedMotion ? "on" : "off"} (M)`} onClick={() => setReducedMotion((v) => !v)} active={reducedMotion}>
                <Waves size={15} />
              </IconButton>
              <span className="mx-1 h-5 w-px bg-line" />
              <IconButton label="Presenter notes (N)" onClick={() => setNotesOpen((v) => !v)} active={notesOpen}>
                <NotebookPen size={15} />
              </IconButton>
              <IconButton label="Presenter window (S)" onClick={openPresenterWindow}>
                <MonitorPlay size={15} />
              </IconButton>
              <IconButton label="Slide overview (O)" onClick={() => setOverviewOpen((v) => !v)} active={overviewOpen}>
                <Grid3x3 size={15} />
              </IconButton>
              <IconButton label="Keyboard shortcuts (?)" onClick={() => setHelpOpen((v) => !v)} active={helpOpen}>
                <Keyboard size={15} />
              </IconButton>
              <IconButton label="Fullscreen (F)" onClick={toggleFullscreen}>
                <Expand size={15} />
              </IconButton>
            </motion.nav>

            <AnimatePresence>
              {notesOpen && <PresenterNotes sceneId={scene.id} slideStart={slideStart} deckStart={deckStart} onClose={() => setNotesOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
              {overviewOpen && (
                <SlideOverview
                  current={index}
                  onSelect={(i) => {
                    goTo(i);
                    setOverviewOpen(false);
                  }}
                  onClose={() => setOverviewOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>{helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}</AnimatePresence>
          </div>
        </div>
      </StageContext.Provider>
    </MotionConfig>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function openPresenterWindow() {
  const url = `${window.location.pathname}?presenter${window.location.hash}`;
  window.open(url, "tcad-presenter", "width=1100,height=760");
}

const shortcuts: [string, string][] = [
  ["→ / Space / PgDn", "Next scene"],
  ["← / Shift+Space / PgUp", "Previous scene"],
  ["1–9, 0", "Jump to scene 1–10"],
  ["Home / End", "First / last"],
  ["O or G", "Slide overview"],
  ["N", "Presenter notes drawer"],
  ["S", "Open synced presenter window"],
  ["P", "Pause / resume all simulations"],
  ["R", "Reset current scene"],
  ["M", "Reduced motion"],
  ["F", "Fullscreen"],
  ["Esc", "Close overlays"],
];

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-[560px] rounded-2xl border border-line bg-panel p-7" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-[24px] font-semibold">Keyboard shortcuts</h2>
        <dl className="grid grid-cols-[220px_1fr] gap-y-2 text-[15px]">
          {shortcuts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-mono text-sensor">{k}</dt>
              <dd className="text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[13px] text-ink-3">Arrow keys inside sliders and buttons operate the control, not the deck.</p>
      </div>
    </motion.div>
  );
}
