/** JS mirror of the CSS semantic tokens (for canvas / SVG drawing). */
export const colors = {
  void: "#05070b",
  panel: "#0c1119",
  panel2: "#121926",
  line: "#1d2636",
  ink: "#e8edf5",
  ink2: "#a3adbd",
  inkMuted: "#6b7587",
  sensor: "#22d3ee",
  collab: "#4f8cff",
  prob: "#a78bfa",
  temporal: "#f5a524",
  anomaly: "#ff4d6d",
  consistent: "#34d399",
  unknown: "#5b6474",
  freeCell: "#123a44", // free space: dark, desaturated sensor tone
  // Chart-series steps (validated together: dark surface, CVD ΔE ≈ 30, contrast ≥ 3:1)
  chartCollab: "#4f8cff",
  chartTemporal: "#c47c08",
} as const;

export type SemanticColor = keyof typeof colors;

export function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Purple ramp for P(occupied): 0 → near-background, 1 → bright purple. */
export function beliefColor(p: number) {
  const a = [18, 25, 38];
  const b = [167, 139, 250];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * p));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
