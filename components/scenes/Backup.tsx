"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge, evidenceMeta, type EvidenceKind } from "@/components/ui/EvidenceBadge";
import { qaItems, glossary } from "@/lib/research/qaGlossary";
import { references } from "@/lib/research/sources";
import { colors } from "@/components/viz/palette";

const tagColor = { method: colors.prob, assumption: colors.temporal, evaluation: colors.consistent, limits: colors.anomaly };

export function SQa() {
  const [open, setOpen] = useState(0);
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader kicker="Backup · Q&A" accent="var(--color-ink-3)" title="Anticipated questions" />
      <div className="mt-6 flex gap-6">
        <div className="grid w-[640px] grid-cols-2 content-start gap-2" data-capture-keys>
          {qaItems.map((item, i) => (
            <button
              key={item.q}
              onClick={() => setOpen(i)}
              className={`rounded-lg border px-3 py-2.5 text-left text-[15px] transition-colors ${
                open === i ? "border-ink-3 bg-panel-2 text-ink" : "border-line bg-panel/60 text-ink-2 hover:text-ink"
              }`}
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: tagColor[item.tag] }} />
              {item.q}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={open}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 rounded-2xl border border-line bg-panel/80 p-7"
          >
            <div className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: tagColor[qaItems[open].tag] }}>
              {qaItems[open].tag}
            </div>
            <h2 className="mt-2 font-display text-[32px] font-semibold leading-tight">{qaItems[open].q}</h2>
            <p className="mt-4 text-[20px] leading-relaxed text-ink-2">{qaItems[open].a}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function SGlossary() {
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader kicker="Backup · Glossary" accent="var(--color-ink-3)" title="Glossary" />
      <div className="mt-6 grid grid-cols-3 gap-x-8 gap-y-3">
        {glossary.map((g) => (
          <div key={g.term} className="border-b border-line pb-2">
            <div className="font-mono text-[14px] text-sensor">{g.term}</div>
            <div className="text-[14px] leading-snug text-ink-2">{g.def}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {(Object.keys(evidenceMeta) as EvidenceKind[]).map((k) => (
          <div key={k} className="flex items-center gap-2 text-[13px] text-ink-3">
            <EvidenceBadge kind={k} /> {evidenceMeta[k].hint}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SReferences() {
  return (
    <div className="absolute inset-0 px-16 pb-8 pt-12">
      <SceneHeader kicker="Backup · References & attribution" accent="var(--color-ink-3)" title="References" />
      <ol className="mt-6 space-y-2.5">
        {references.map((r, i) => (
          <li key={r.key} className="flex gap-4 text-[14.5px] leading-snug">
            <span className="w-6 shrink-0 font-mono text-ink-3">[{i + 1}]</span>
            <div>
              <span className="text-ink">{r.full}</span>{" "}
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-collab hover:underline">
                  link <ExternalLink size={12} />
                </a>
              )}
              <div className="text-[13px] text-ink-3">{r.role}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-[1300px] text-[13px] leading-snug text-ink-3">
        Published numbers were verified on 2026-11-16 against arXiv:2309.12955v2 and on 2026-11-17 against research-data/published/*.csv (Table 3, Abstract, §6.4).
        “Our measured experiment” numbers come from the T-CAD repository's logged results (research-data/measured/, synthetic simulator, 45 test scenarios) and
        are not comparable to the paper. Replay videos were recorded with the repository's own scripts. Grid, intersection and score demos are in-browser
        illustrations.
      </p>
    </div>
  );
}
