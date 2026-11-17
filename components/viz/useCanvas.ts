"use client";
import { useEffect, useRef } from "react";
import { useStage } from "@/components/shell/StageContext";

/**
 * Sizes a canvas for the current stage scale × device pixel ratio and
 * returns a ref plus a getter for a 2D context already scaled to logical px.
 */
export function useCanvas(width: number, height: number) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { scale } = useStage();
  const ratioRef = useRef(1);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * scale));
    ratioRef.current = ratio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }, [width, height, scale]);

  const getContext = () => {
    const canvas = ref.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(ratioRef.current, 0, 0, ratioRef.current, 0, 0);
    return ctx;
  };

  return { ref, getContext };
}
