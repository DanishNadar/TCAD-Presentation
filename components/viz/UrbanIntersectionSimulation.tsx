"use client";
/**
 * 2.5D top-down intersection with ray-cast LiDAR visibility, occlusion,
 * collaborative links and (Scene 3/14) a synthetic fabricated object.
 */
import { useAnimationFrame } from "@/lib/sim/clock";
import {
  agentCorners,
  agentsAt,
  buildings,
  canSee,
  ghostObject,
  obstacleSegments,
  pointInPolygon,
  roads,
  visibility,
  worldHeight,
  worldWidth,
  type Agent,
  type Vec,
} from "@/lib/sim/world";
import { useCanvas } from "./useCanvas";
import { colors, withAlpha } from "./palette";

export type IntersectionMode = "opening" | "egoOnly" | "collab" | "fabricated" | "defended";

interface Props {
  mode: IntersectionMode;
  width: number;
  height: number;
  showGroundTruth?: boolean;
  cinematic?: boolean; // slow camera drift
  showLabels?: boolean;
  /** Screen x (px) where the intersection centre should sit; default = canvas centre. */
  focusX?: number;
}

export function UrbanIntersectionSimulation({
  mode,
  width,
  height,
  showGroundTruth = true,
  cinematic = false,
  showLabels = true,
  focusX,
}: Props) {
  const { ref, getContext } = useCanvas(width, height);

  useAnimationFrame((t) => {
    const ctx = getContext();
    if (!ctx) return;
    drawScene(ctx, t, { mode, width, height, showGroundTruth, cinematic, showLabels, focusX });
  });

  return (
    <canvas
      ref={ref}
      style={{ width, height }}
      role="img"
      aria-label={`Simulated intersection — ${mode} view. EGO vehicle approaches; one vehicle is occluded by a building.`}
    />
  );
}

interface DrawOpts extends Omit<Props, "mode"> {
  mode: IntersectionMode;
}

function drawScene(ctx: CanvasRenderingContext2D, t: number, o: DrawOpts) {
  const { width, height, mode } = o;
  const collaborative = mode !== "egoOnly";
  const fabricated = mode === "fabricated" || mode === "defended";

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.void;
  ctx.fillRect(0, 0, width, height);

  // Camera: fit world, optional slow drift.
  const baseScale = Math.min(width / worldWidth, height / worldHeight);
  const zoom = o.cinematic ? 1.08 + 0.04 * Math.sin(t * 0.13) : 1;
  const s = baseScale * zoom;
  const cx = (o.focusX !== undefined ? 80 : worldWidth / 2) + (o.cinematic ? 3 * Math.sin(t * 0.09) : 0);
  const cy = worldHeight / 2 + (o.cinematic ? 2 * Math.cos(t * 0.11) : 0);
  ctx.save();
  ctx.translate(o.focusX ?? width / 2, height / 2);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  const px = 1 / s; // one screen pixel in world units

  drawGround(ctx, px);

  const agents = agentsAt(t);
  const ego = agents[0];
  const sensing = agents.filter((a) => a.role === "ego" || (collaborative && a.role === "cav"));
  const egoVisibility = visibility(ego, obstacleSegments(agents, [ego.id]));

  // Visibility fields
  for (const a of sensing) {
    const vis = a.id === "ego" ? egoVisibility : visibility(a, obstacleSegments(agents, [a.id]), undefined, 180);
    const color = a.id === "ego" ? colors.sensor : colors.collab;
    const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 50);
    grad.addColorStop(0, withAlpha(color, a.id === "ego" ? 0.42 : 0.26));
    grad.addColorStop(1, withAlpha(color, a.id === "ego" ? 0.1 : 0.05));
    ctx.fillStyle = grad;
    tracePoly(ctx, vis.polygon);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color, 0.6);
    ctx.lineWidth = 1.2 * px;
    ctx.stroke();

    // LiDAR returns + rotating sweep
    const sweep = (t * 2.4 + a.x * 0.03) % (Math.PI * 2);
    ctx.fillStyle = withAlpha(color, 0.9);
    vis.hits.forEach((h, k) => {
      if (!h.hit) return;
      const ang = (k / vis.hits.length) * Math.PI * 2;
      const age = (sweep - ang + Math.PI * 2) % (Math.PI * 2);
      const alpha = 0.25 + 0.75 * Math.max(0, 1 - age / 2.5);
      ctx.globalAlpha = alpha;
      ctx.fillRect(h.p.x - 0.45, h.p.y - 0.45, 0.9, 0.9);
    });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.lineWidth = 1.5 * px;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    const reach = vis.polygon[Math.floor((sweep / (Math.PI * 2)) * vis.polygon.length) % vis.polygon.length];
    ctx.lineTo(reach.x, reach.y);
    ctx.stroke();
  }

  // Conflict region (fabricated object inside EGO's observed free space)
  if (fabricated) {
    const conflict = agentCorners(ghostObject).some((c) => pointInPolygon(c, egoVisibility.polygon));
    if (conflict) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.fillStyle = withAlpha(colors.anomaly, 0.12 + 0.18 * pulse);
      ctx.beginPath();
      ctx.arc(ghostObject.x, ghostObject.y, 5.5 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBuildings(ctx, px);

  // Who perceives what?
  const perceivers = collaborative ? sensing : [ego];
  for (const a of agents) {
    if (a.role === "parked") {
      drawVehicle(ctx, a, colors.unknown, 0.55, px);
      continue;
    }
    const seenByEgo = a.id === "ego" || canSee(ego, a, agents);
    const seenBySomeone = seenByEgo || perceivers.some((p) => p.id !== a.id && canSee(p, a, agents));
    const isSensing = sensing.includes(a);
    if (a.role === "pedestrian") {
      ctx.fillStyle = seenBySomeone ? colors.ink : withAlpha(colors.ink, 0.25);
      ctx.beginPath();
      ctx.arc(a.x, a.y, 0.6, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const bodyColor = a.id === "ego" ? colors.sensor : a.role === "cav" ? colors.collab : colors.inkMuted;
    drawVehicle(ctx, a, bodyColor, seenBySomeone || isSensing || o.showGroundTruth ? 1 : 0, px);

    // Detection boxes in EGO's (possibly shared) perception
    if (a.id !== "ego" && a.role !== "cav") {
      if (seenByEgo) drawBox(ctx, a, colors.sensor, px, false);
      else if (seenBySomeone && collaborative) drawBox(ctx, a, colors.collab, px, false);
      else if (o.showGroundTruth) drawBox(ctx, a, colors.unknown, px, true);
    }
    if (o.showLabels && a.role === "hidden") {
      const tag = seenByEgo ? "visible to EGO" : seenBySomeone && collaborative ? "seen via collaboration" : "hidden from EGO";
      const tagColor = seenByEgo ? colors.sensor : seenBySomeone && collaborative ? colors.collab : colors.inkMuted;
      drawLabel(ctx, a.x, a.y - 4, tag, tagColor, px);
    }
  }

  // Collaborative links with flowing particles
  if (collaborative) {
    for (const a of sensing) {
      if (a.id === "ego") continue;
      const d = Math.hypot(a.x - ego.x, a.y - ego.y);
      if (d > 110) continue;
      const isAttackerLink = fabricated && a.id === "cavB";
      const linkColor = isAttackerLink ? colors.anomaly : colors.collab;
      ctx.strokeStyle = withAlpha(linkColor, 0.35);
      ctx.setLineDash([2 * px * 3, 3 * px * 3]);
      ctx.lineWidth = 1.2 * px;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(ego.x, ego.y);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let k = 0; k < 5; k++) {
        const f = (t * 0.6 + k / 5) % 1;
        ctx.fillStyle = withAlpha(linkColor, 0.9 * Math.sin(f * Math.PI));
        ctx.beginPath();
        ctx.arc(a.x + (ego.x - a.x) * f, a.y + (ego.y - a.y) * f, 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Fabricated object (synthetic illustration)
  if (fabricated) {
    const flagged = mode === "defended";
    ctx.globalAlpha = flagged ? 0.45 : 0.85 + 0.15 * Math.sin(t * 6);
    drawBox(ctx, ghostObject, colors.anomaly, px, true, 2);
    ctx.globalAlpha = 1;
    if (flagged) {
      ctx.strokeStyle = colors.anomaly;
      ctx.lineWidth = 2 * px;
      ctx.beginPath();
      ctx.moveTo(ghostObject.x - 2.5, ghostObject.y - 2.5);
      ctx.lineTo(ghostObject.x + 2.5, ghostObject.y + 2.5);
      ctx.moveTo(ghostObject.x + 2.5, ghostObject.y - 2.5);
      ctx.lineTo(ghostObject.x - 2.5, ghostObject.y + 2.5);
      ctx.stroke();
    }
    if (o.showLabels) {
      if (flagged) drawLabel(ctx, ghostObject.x, ghostObject.y + 7.5, "flagged: box ∩ free space (ε_spoof)", colors.anomaly, px);
      else drawLabel(ctx, ghostObject.x + 10, ghostObject.y - 1, "shared report: object here", colors.anomaly, px, "left");
      if (!flagged) drawLabel(ctx, ghostObject.x + 10, ghostObject.y + 3.2, "EGO's own LiDAR: free space", colors.sensor, px, "left");
    }
  }

  if (o.showLabels) {
    for (const a of sensing) drawLabel(ctx, a.x, a.y + 5.2, a.label, a.id === "ego" ? colors.sensor : fabricated && a.id === "cavB" ? colors.anomaly : colors.collab, px);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
function tracePoly(ctx: CanvasRenderingContext2D, poly: Vec[]) {
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

function drawGround(ctx: CanvasRenderingContext2D, px: number) {
  const { vertical: v, horizontal: h } = roads;
  ctx.fillStyle = "#0a0e15";
  ctx.fillRect(-40, -40, worldWidth + 80, worldHeight + 80);
  // sidewalks
  ctx.fillStyle = "#101622";
  ctx.fillRect(v.x - 3, -40, v.w + 6, worldHeight + 80);
  ctx.fillRect(-40, h.y - 3, worldWidth + 80, h.h + 6);
  // asphalt
  ctx.fillStyle = "#0d121b";
  ctx.fillRect(v.x, -40, v.w, worldHeight + 80);
  ctx.fillRect(-40, h.y, worldWidth + 80, h.h);
  // lane markings
  ctx.strokeStyle = "#2a3446";
  ctx.lineWidth = 0.25;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(v.x + v.w / 2, -40);
  ctx.lineTo(v.x + v.w / 2, h.y - 4);
  ctx.moveTo(v.x + v.w / 2, h.y + h.h + 4);
  ctx.lineTo(v.x + v.w / 2, worldHeight + 40);
  ctx.moveTo(-40, h.y + h.h / 2);
  ctx.lineTo(v.x - 4, h.y + h.h / 2);
  ctx.moveTo(v.x + v.w + 4, h.y + h.h / 2);
  ctx.lineTo(worldWidth + 40, h.y + h.h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // crosswalks
  ctx.fillStyle = "#18202e";
  for (let k = 0; k < 8; k++) {
    ctx.fillRect(v.x + 0.6 + k * 2, h.y - 3.4, 1.1, 2.8);
    ctx.fillRect(v.x + 0.6 + k * 2, h.y + h.h + 0.6, 1.1, 2.8);
    ctx.fillRect(v.x - 3.4, h.y + 0.6 + k * 2, 2.8, 1.1);
    ctx.fillRect(v.x + v.w + 0.6, h.y + 0.6 + k * 2, 2.8, 1.1);
  }
  // stop line for EGO
  ctx.fillStyle = "#2f3a4f";
  ctx.fillRect(v.x + v.w / 2, h.y + h.h + 4, v.w / 2, 0.5);
  void px;
}

function drawBuildings(ctx: CanvasRenderingContext2D, px: number) {
  for (const b of buildings) {
    const ox = -0.05 * b.height;
    const oy = -0.08 * b.height;
    // side faces (oblique extrusion)
    ctx.fillStyle = "#121a27";
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.h);
    ctx.lineTo(b.x + ox, b.y + b.h + oy);
    ctx.lineTo(b.x + ox, b.y + oy);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0f1622";
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + ox, b.y + oy);
    ctx.lineTo(b.x + b.w + ox, b.y + oy);
    ctx.lineTo(b.x + b.w, b.y);
    ctx.closePath();
    ctx.fill();
    // footprint (what actually occludes sensors)
    ctx.fillStyle = "#151e2d";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // roof
    const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    g.addColorStop(0, "#1e2a3d");
    g.addColorStop(1, "#141c2a");
    ctx.fillStyle = g;
    ctx.fillRect(b.x + ox, b.y + oy, b.w, b.h);
    ctx.strokeStyle = "#2a3850";
    ctx.lineWidth = px;
    ctx.strokeRect(b.x + ox, b.y + oy, b.w, b.h);
    // lit windows on the roof grid
    ctx.fillStyle = "rgba(245,165,36,0.22)";
    for (let i = 3; i < b.w - 2; i += 4)
      for (let j = 3; j < b.h - 2; j += 4) if (((i * 7 + j * 13 + b.height) % 5) === 0) ctx.fillRect(b.x + ox + i, b.y + oy + j, 1, 1);
  }
}

function drawVehicle(ctx: CanvasRenderingContext2D, a: Agent, color: string, alpha: number, px: number) {
  if (alpha <= 0) return;
  const c = agentCorners(a);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = withAlpha(color, 0.9);
  tracePoly(ctx, c);
  ctx.fill();
  ctx.strokeStyle = "#05070b";
  ctx.lineWidth = px;
  ctx.stroke();
  // headlight cone
  if (a.role !== "parked") {
    const fx = Math.cos(a.heading);
    const fy = Math.sin(a.heading);
    const g = ctx.createRadialGradient(a.x + fx * 2.4, a.y + fy * 2.4, 0, a.x + fx * 2.4, a.y + fy * 2.4, 9);
    g.addColorStop(0, "rgba(255,240,200,0.18)");
    g.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(a.x + fx * 2.4, a.y + fy * 2.4);
    ctx.arc(a.x + fx * 2.4, a.y + fy * 2.4, 9, a.heading - 0.35, a.heading + 0.35);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBox(ctx: CanvasRenderingContext2D, a: Agent, color: string, px: number, dashed: boolean, width = 1.5) {
  const grown = { ...a, length: a.length + 1.2, width: a.width + 1.2 };
  ctx.strokeStyle = color;
  ctx.lineWidth = width * px;
  if (dashed) ctx.setLineDash([4 * px, 3 * px]);
  tracePoly(ctx, agentCorners(grown));
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  px: number,
  align: CanvasTextAlign = "center",
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(px, px);
  ctx.font = "500 13px 'JetBrains Mono Variable', ui-monospace, monospace";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width;
  const bx = align === "center" ? -w / 2 - 6 : align === "left" ? -6 : -w - 6;
  ctx.fillStyle = "rgba(5,7,11,0.78)";
  ctx.fillRect(bx, -10, w + 12, 20);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
