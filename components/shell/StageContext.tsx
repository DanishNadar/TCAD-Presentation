"use client";
import { createContext, useContext } from "react";

export interface StageInfo {
  scale: number; // CSS scale of the 1600×900 stage
  reducedMotion: boolean;
  paused: boolean;
  resetToken: number; // increments when the presenter presses R
}

export const StageContext = createContext<StageInfo>({ scale: 1, reducedMotion: false, paused: false, resetToken: 0 });
export const useStage = () => useContext(StageContext);

export const stageWidth = 1600;
export const stageHeight = 900;
