"use client";
import type { ReactNode } from "react";

/** Labeled range slider (keyboard accessible; deck navigation ignores it). */
export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  color = "var(--color-ink)",
  format = (v: number) => v.toFixed(2),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  format?: (v: number) => string;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block select-none" title={hint}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono text-[14px]" style={{ color }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={
          {
            "--slider-color": color,
            background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--color-line) ${pct}%)`,
          } as React.CSSProperties
        }
        aria-label={label}
      />
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  color = "var(--color-collab)",
  size = "md",
  ariaLabel,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  color?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg border border-line bg-panel p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-md font-medium transition-colors ${size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-1.5 text-[14px]"}`}
            style={{
              color: active ? "var(--color-void)" : "var(--color-ink-2)",
              background: active ? color : "transparent",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconButton({
  onClick,
  label,
  children,
  active = false,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-[13px] transition-colors disabled:opacity-30 ${
        active ? "border-ink-3 bg-panel-2 text-ink" : "border-line bg-panel text-ink-2 hover:text-ink hover:border-ink-3"
      }`}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
  title,
  accent,
  right,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  accent?: string;
  right?: ReactNode;
}) {
  return (
    <div className={`relative rounded-xl border border-line bg-panel/80 backdrop-blur-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2">
            {accent && <span className="h-2 w-2 rounded-full" style={{ background: accent }} />}
            {title}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string; pattern?: "hatch" | "dash" | "outline" }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 rounded-[3px] ${i.pattern === "hatch" ? "hatch-unknown" : ""}`}
            style={
              i.pattern === "outline" || i.pattern === "dash"
                ? { border: `1.5px ${i.pattern === "dash" ? "dashed" : "solid"} ${i.color}` }
                : i.pattern === "hatch"
                  ? { border: `1px solid ${i.color}` }
                  : { background: i.color }
            }
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
