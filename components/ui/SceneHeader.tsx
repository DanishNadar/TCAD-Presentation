"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function SceneHeader({
  kicker,
  title,
  subtitle,
  right,
  accent = "var(--color-sensor)",
}: {
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-2 flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          <span className="h-px w-8" style={{ background: accent }} />
          {kicker}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-2 max-w-[1000px] text-[19px] leading-snug text-ink-2"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {right && <div className="shrink-0 pt-1">{right}</div>}
    </div>
  );
}
