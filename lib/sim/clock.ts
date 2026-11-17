"use client";
/**
 * One shared animation clock for the whole deck. World time keeps advancing
 * across slides, so the intersection in Scene 14 is the same moving world as
 * in Scene 1. A single requestAnimationFrame loop runs only while at least one
 * visualization is subscribed, and stops when the deck is paused.
 */
import { useEffect, useRef } from "react";

type Subscriber = (worldTime: number, dt: number) => void;

const subscribers = new Set<Subscriber>();
let worldTime = 0;
let lastFrame = 0;
let rafId: number | null = null;

export const motionSettings = {
  paused: false,
  reducedMotion: false,
  speed: 1,
};

function loop(now: number) {
  const rawDt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
  lastFrame = now;
  const dt = motionSettings.paused ? 0 : rawDt * motionSettings.speed;
  worldTime += dt;
  subscribers.forEach((fn) => fn(worldTime, dt));
  rafId = subscribers.size ? requestAnimationFrame(loop) : null;
  if (!rafId) lastFrame = 0;
}

export function subscribe(fn: Subscriber) {
  subscribers.add(fn);
  if (rafId === null && typeof window !== "undefined") rafId = requestAnimationFrame(loop);
  return () => {
    subscribers.delete(fn);
    if (!subscribers.size && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastFrame = 0;
    }
  };
}

export const getWorldTime = () => worldTime;

/**
 * Subscribe a callback to the shared clock. In reduced-motion mode the
 * callback is throttled to ~4 fps so scenes still update but don't swim.
 */
export function useAnimationFrame(callback: Subscriber, active = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    if (!active) return;
    let accumulated = 0;
    return subscribe((t, dt) => {
      if (motionSettings.reducedMotion) {
        accumulated += dt;
        if (accumulated < 0.25) return;
        accumulated = 0;
      }
      cbRef.current(t, dt);
    });
  }, [active]);
}
