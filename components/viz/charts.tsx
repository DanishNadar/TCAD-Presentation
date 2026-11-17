"use client";
/**
 * Small SVG chart primitives following the deck's dataviz rules:
 * thin marks, rounded data-ends at the value end, recessive grid,
 * per-mark hover tooltips, text in ink tokens (never series color).
 */
import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { colors } from "./palette";

export interface BarDatum {
  key: string;
  label: string;
  value: number | null;
  color: string;
  muted?: boolean;
  note?: string;
}

/** Horizontal bar chart (0–max), labels left, values right. */
export function HBarChart({
  data,
  max = 100,
  width = 640,
  rowHeight = 36,
  unit = "%",
  labelWidth = 170,
  marker,
  decimals = 1,
}: {
  data: BarDatum[];
  max?: number;
  width?: number;
  rowHeight?: number;
  unit?: string;
  labelWidth?: number;
  marker?: { value: number; label: string };
  decimals?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const plotW = width - labelWidth - 70;
  const height = data.length * rowHeight + 28;
  const x = (v: number) => labelWidth + (v / max) * plotW;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  return (
    <div className="relative">
      <svg width={width} height={height} role="img" aria-label="Bar chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={height - 22} stroke={colors.line} strokeWidth={1} />
            <text x={x(t)} y={height - 6} fill={colors.inkMuted} fontSize={12} textAnchor="middle" fontFamily="var(--font-mono)">
              {Number.isInteger(t) ? t : t.toFixed(max <= 1 ? 2 : t < 10 ? 1 : 0)}
              {unit}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const y = i * rowHeight + 6;
          const bh = rowHeight - 14;
          const w = d.value === null ? 0 : Math.max(2, x(d.value) - labelWidth);
          return (
            <g key={d.key} onMouseEnter={() => setHover(d.key)} onMouseLeave={() => setHover(null)} style={{ cursor: "default" }}>
              <rect x={0} y={y - 4} width={width} height={rowHeight - 4} fill={hover === d.key ? "rgba(255,255,255,0.035)" : "transparent"} />
              <text x={labelWidth - 12} y={y + bh / 2 + 5} fill={d.muted ? colors.inkMuted : colors.ink} fontSize={14} textAnchor="end" fontFamily="var(--font-mono)">
                {d.label}
              </text>
              {d.value === null ? (
                <text x={labelWidth + 6} y={y + bh / 2 + 5} fill={colors.inkMuted} fontSize={13} fontFamily="var(--font-mono)">
                  n/a
                </text>
              ) : (
                <>
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: d.muted ? 0.4 : 1 }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    d={roundedRightBar(labelWidth, y, w, bh, 4)}
                    fill={d.color}
                  />
                  <text x={labelWidth + w + 8} y={y + bh / 2 + 5} fill={d.muted ? colors.inkMuted : colors.ink} fontSize={14} fontFamily="var(--font-mono)">
                    {d.value.toFixed(decimals)}
                    {unit}
                  </text>
                </>
              )}
            </g>
          );
        })}
        {marker && (
          <g>
            <line x1={x(marker.value)} x2={x(marker.value)} y1={0} y2={height - 22} stroke={colors.ink2} strokeDasharray="4 3" strokeWidth={1.5} />
            <text x={x(marker.value) + (marker.value / max > 0.75 ? -4 : 4)} y={10} fill={colors.ink2} fontSize={12} textAnchor={marker.value / max > 0.75 ? "end" : "start"} fontFamily="var(--font-mono)">
              {marker.label}
            </text>
          </g>
        )}
      </svg>
      {hover && data.find((d) => d.key === hover)?.note && (
        <div className="pointer-events-none absolute right-0 top-0 max-w-[280px] rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] text-ink-2 shadow-xl">
          {data.find((d) => d.key === hover)!.note}
        </div>
      )}
    </div>
  );
}

function roundedRightBar(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x} Z`;
}

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
  step?: boolean;
}

/** Generic line chart with crosshair tooltip. */
export function LineChart({
  series,
  width,
  height,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  xTicks,
  yTicks,
  children,
  formatX = (v) => v.toFixed(2),
  formatY = (v) => v.toFixed(2),
  markers,
}: {
  series: LineSeries[];
  width: number;
  height: number;
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  xTicks: number[];
  yTicks: number[];
  children?: (scale: { x: (v: number) => number; y: (v: number) => number }) => ReactNode;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  markers?: { x: number; y: number; color: string; label?: string }[];
}) {
  const m = { l: yLabel ? 60 : 46, r: 14, t: 10, b: 36 };
  const pw = width - m.l - m.r;
  const ph = height - m.t - m.b;
  const x = (v: number) => m.l + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * pw;
  const y = (v: number) => m.t + ph - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * ph;
  const [hoverX, setHoverX] = useState<number | null>(null);

  const path = (s: LineSeries) =>
    s.points
      .map((p, i) => {
        if (i === 0) return `M${x(p.x)},${y(p.y)}`;
        return s.step ? `H${x(p.x)} V${y(p.y)}` : `L${x(p.x)},${y(p.y)}`;
      })
      .join(" ");

  const nearest = (s: LineSeries, xv: number) => s.points.reduce((a, b) => (Math.abs(b.x - xv) < Math.abs(a.x - xv) ? b : a), s.points[0]);

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const scale = r.width / width;
          const px = (e.clientX - r.left) / scale;
          if (px < m.l || px > width - m.r) return setHoverX(null);
          setHoverX(xDomain[0] + ((px - m.l) / pw) * (xDomain[1] - xDomain[0]));
        }}
        onMouseLeave={() => setHoverX(null)}
        role="img"
        aria-label={`Line chart: ${series.map((s) => s.label).join(", ")}`}
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke={colors.line} />
            <text x={m.l - 8} y={y(t) + 4} fill={colors.inkMuted} fontSize={12} textAnchor="end" fontFamily="var(--font-mono)">
              {formatY(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={x(t)} y={height - m.b + 18} fill={colors.inkMuted} fontSize={12} textAnchor="middle" fontFamily="var(--font-mono)">
            {formatX(t)}
          </text>
        ))}
        {xLabel && (
          <text x={m.l + pw / 2} y={height - 2} fill={colors.ink2} fontSize={12} textAnchor="middle">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text x={12} y={m.t + ph / 2} fill={colors.ink2} fontSize={12} textAnchor="middle" transform={`rotate(-90 12 ${m.t + ph / 2})`}>
            {yLabel}
          </text>
        )}
        {children?.({ x, y })}
        {series.map((s) => (
          <path key={s.key} d={path(s)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "5 4" : undefined} strokeLinejoin="round" />
        ))}
        {markers?.map((mk, i) => (
          <g key={i}>
            <circle cx={x(mk.x)} cy={y(mk.y)} r={5} fill={mk.color} stroke={colors.void} strokeWidth={2} />
            {mk.label && (
              <text x={x(mk.x) + 8} y={y(mk.y) - 8} fill={colors.ink} fontSize={12} fontFamily="var(--font-mono)">
                {mk.label}
              </text>
            )}
          </g>
        ))}
        {hoverX !== null && (
          <g pointerEvents="none">
            <line x1={x(hoverX)} x2={x(hoverX)} y1={m.t} y2={m.t + ph} stroke={colors.ink2} strokeDasharray="3 3" />
            {series.map((s) => {
              const p = nearest(s, hoverX);
              return <circle key={s.key} cx={x(p.x)} cy={y(p.y)} r={4} fill={s.color} stroke={colors.void} strokeWidth={2} />;
            })}
          </g>
        )}
      </svg>
      {hoverX !== null && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-lg border border-line bg-panel-2/95 px-3 py-2 font-mono text-[12px] shadow-xl">
          {series.map((s) => {
            const p = nearest(s, hoverX);
            return (
              <div key={s.key} className="flex items-center gap-2 text-ink">
                <span className="inline-block h-[3px] w-3 rounded" style={{ background: s.color }} />
                {s.label}: {formatX(p.x)} → {formatY(p.y)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface ForestRow {
  key: string;
  label: string;
  sub?: string;
  est: number;
  lo: number;
  hi: number;
  color: string;
  emphasis?: boolean;
  note?: string;
}

/**
 * Horizontal point-and-interval chart for measured metrics with 95% CIs.
 * A reference line (e.g. A0 estimate) helps read "overlaps baseline" at a glance.
 */
export function ForestPlot({
  rows,
  domain,
  width,
  rowHeight = 34,
  labelWidth = 210,
  format = (v: number) => v.toFixed(3),
  reference,
  axisLabel,
}: {
  rows: ForestRow[];
  domain: [number, number];
  width: number;
  rowHeight?: number;
  labelWidth?: number;
  format?: (v: number) => string;
  reference?: { value: number; label: string };
  axisLabel?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const valueW = 74;
  const plotW = width - labelWidth - valueW - 8;
  const height = rows.length * rowHeight + 34;
  const x = (v: number) => labelWidth + ((v - domain[0]) / (domain[1] - domain[0])) * plotW;
  const ticks = Array.from({ length: 5 }, (_, i) => domain[0] + ((domain[1] - domain[0]) * i) / 4);
  const hovered = rows.find((r) => r.key === hover);
  return (
    <div className="relative">
      <svg width={width} height={height} role="img" aria-label={`Interval chart${axisLabel ? `: ${axisLabel}` : ""}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={height - 26} stroke={colors.line} />
            <text x={x(t)} y={height - 10} fill={colors.inkMuted} fontSize={11.5} textAnchor="middle" fontFamily="var(--font-mono)">
              {format(t)}
            </text>
          </g>
        ))}
        {reference && (
          <g>
            <line x1={x(reference.value)} x2={x(reference.value)} y1={0} y2={height - 26} stroke={colors.ink2} strokeDasharray="4 3" />
          </g>
        )}
        {rows.map((r, i) => {
          const cy = i * rowHeight + rowHeight / 2 + 2;
          return (
            <g key={r.key} onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}>
              <rect x={0} y={cy - rowHeight / 2} width={width} height={rowHeight} fill={hover === r.key ? "rgba(255,255,255,0.04)" : "transparent"} />
              <text x={labelWidth - 12} y={cy + 1} fill={r.emphasis ? colors.ink : colors.ink2} fontSize={13.5} textAnchor="end" fontFamily="var(--font-mono)">
                {r.label}
              </text>
              {r.sub && (
                <text x={labelWidth - 12} y={cy + 14} fill={colors.inkMuted} fontSize={10.5} textAnchor="end">
                  {r.sub}
                </text>
              )}
              <motion.line
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                x1={x(r.lo)}
                x2={x(r.hi)}
                y1={cy}
                y2={cy}
                stroke={r.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeOpacity={0.55}
              />
              <motion.circle
                initial={{ cx: x(domain[0]), opacity: 0 }}
                animate={{ cx: x(r.est), opacity: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 20, delay: i * 0.05 }}
                cy={cy}
                r={6}
                fill={r.color}
                stroke={colors.void}
                strokeWidth={2}
              />
              <text x={width - valueW + 6} y={cy + 4} fill={colors.ink} fontSize={13} fontFamily="var(--font-mono)">
                {format(r.est)}
              </text>
            </g>
          );
        })}
        {reference && (
          <text x={x(reference.value) + 4} y={height - 30} fill={colors.ink2} fontSize={11} fontFamily="var(--font-mono)">
            {reference.label}
          </text>
        )}
      </svg>
      {hovered && (
        <div className="pointer-events-none absolute right-0 top-0 max-w-[300px] rounded-lg border border-line bg-panel-2 px-3 py-2 font-mono text-[12px] text-ink-2 shadow-xl">
          <div className="text-ink">{hovered.label}: {format(hovered.est)}</div>
          95% CI [{format(hovered.lo)}, {format(hovered.hi)}]
          {hovered.note && <div className="mt-1 font-sans text-[12px]">{hovered.note}</div>}
        </div>
      )}
    </div>
  );
}
