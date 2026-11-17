"use client";
import katex from "katex";
import { useMemo } from "react";

/**
 * KaTeX renderer. `trust` is enabled only for \htmlClass so equation terms
 * can be highlighted in sync with visualizations (class "eq-term t-<id>").
 */
export function MathBlock({
  tex,
  display = false,
  activeTerms = [],
  className = "",
}: {
  tex: string;
  display?: boolean;
  activeTerms?: string[];
  className?: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        trust: (ctx) => ctx.command === "\\htmlClass",
        strict: false,
      }),
    [tex, display],
  );
  // Active terms get "is-active"; the rest dim so the eye follows the visual step.
  return (
    <span
      className={`math-scope ${className}`}
      data-active={activeTerms.join(" ")}
      ref={(el) => {
        if (!el) return;
        el.querySelectorAll<HTMLElement>(".eq-term").forEach((node) => {
          const on = activeTerms.some((t) => node.classList.contains(`t-${t}`));
          node.classList.toggle("is-active", on);
          node.style.opacity = activeTerms.length && !on ? "0.45" : "1";
        });
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Helper: wrap a TeX fragment as a highlightable, colored term. */
export const term = (id: string, color: string, body: string) =>
  `\\htmlClass{eq-term t-${id}}{\\color{${color}}{${body}}}`;
