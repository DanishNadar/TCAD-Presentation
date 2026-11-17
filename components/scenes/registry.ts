import type { ComponentType } from "react";
import { S01Opening } from "./S01Opening";
import { S02WhyCollab } from "./S02WhyCollab";
import { S03Threat } from "./S03Threat";
import { S04Paper } from "./S04Paper";
import { S05Cad } from "./S05Cad";
import { S06Results } from "./S06Results";
import { S07Tcad } from "./S07Tcad";
import { S08Uncertainty } from "./S08Uncertainty";
import { S09Hmm } from "./S09Hmm";
import { S10Fusion } from "./S10Fusion";
import { S11Anomaly } from "./S11Anomaly";
import { S12Ablation } from "./S12Ablation";
import { S13Evaluation } from "./S13Evaluation";
import { S14Conclusion } from "./S14Conclusion";
import { SQa, SGlossary, SReferences } from "./Backup";
import { SRobustness, SResearchQuestions, SFigureGallery, SReplays } from "./BackupMeasured";

export interface SceneDef {
  id: string; // also the URL hash: /#cad
  title: string;
  accent: string;
  backup?: boolean;
  component: ComponentType;
}

export const scenes: SceneDef[] = [
  { id: "opening", title: "When Vehicles Share Reality", accent: "var(--color-sensor)", component: S01Opening },
  { id: "why-collab", title: "Why Collaborative Perception Exists", accent: "var(--color-sensor)", component: S02WhyCollab },
  { id: "threat", title: "The Security Problem", accent: "var(--color-anomaly)", component: S03Threat },
  { id: "paper", title: "The Original Research", accent: "var(--color-collab)", component: S04Paper },
  { id: "cad", title: "Understanding CAD", accent: "var(--color-collab)", component: S05Cad },
  { id: "results", title: "Published Results & Open Questions", accent: "var(--color-collab)", component: S06Results },
  { id: "tcad", title: "Introducing T-CAD", accent: "var(--color-temporal)", component: S07Tcad },
  { id: "uncertainty", title: "Representing Uncertainty", accent: "var(--color-prob)", component: S08Uncertainty },
  { id: "hmm", title: "Temporal Reasoning with an HMM", accent: "var(--color-temporal)", component: S09Hmm },
  { id: "fusion", title: "Collaborative Probabilistic Fusion", accent: "var(--color-prob)", component: S10Fusion },
  { id: "anomaly", title: "Anomaly Detection Over Time", accent: "var(--color-anomaly)", component: S11Anomaly },
  { id: "ablation", title: "Implementation & Ablation (measured)", accent: "var(--color-temporal)", component: S12Ablation },
  { id: "evaluation", title: "Evaluation: Measured Results", accent: "var(--color-consistent)", component: S13Evaluation },
  { id: "conclusion", title: "Conclusion & Future Work", accent: "var(--color-temporal)", component: S14Conclusion },
  { id: "robustness", title: "Robustness Sweeps (measured)", accent: "var(--color-consistent)", backup: true, component: SRobustness },
  { id: "research-questions", title: "Research Questions (measured)", accent: "var(--color-consistent)", backup: true, component: SResearchQuestions },
  { id: "figures", title: "Figure Gallery", accent: "var(--color-consistent)", backup: true, component: SFigureGallery },
  { id: "replays", title: "Simulator Replays", accent: "#2dd4bf", backup: true, component: SReplays },
  { id: "qa", title: "Q&A Backup", accent: "var(--color-ink-3)", backup: true, component: SQa },
  { id: "glossary", title: "Glossary", accent: "var(--color-ink-3)", backup: true, component: SGlossary },
  { id: "references", title: "References", accent: "var(--color-ink-3)", backup: true, component: SReferences },
];
