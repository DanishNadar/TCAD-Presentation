/**
 * Generates docs/SPEAKER_SCRIPT.md (storyboard + full script) and
 * docs/GLOSSARY.md from the same data the app uses, so they never drift.
 * Run: npm run docs
 */
import { writeFileSync } from "node:fs";
import { sceneNotes, totalTargetSeconds } from "../lib/presenterNotes";
import { glossary, qaItems } from "../lib/research/qaGlossary";

const storyboard: Record<string, { visual: string; math: string; evidence: string }> = {
  opening: { visual: "Full-bleed 2.5D intersection; ray-cast LiDAR fields, sweep lines, V2V particle links; slow camera drift.", math: "—", evidence: "Illustrative" },
  "why-collab": { visual: "Split view of the same world: EGO-only vs collaborative; ground-truth toggle; ‘my simulation’ shows recorded occlusion replays (world + LiDAR).", math: "—", evidence: "Illustrative + Recorded run" },
  threat: { visual: "Same world with a synthetic fabricated object inside EGO's observed free space; evidence table; recorded merged-occupancy replay of scenario C.", math: "—", evidence: "Illustrative + Recorded run" },
  paper: { visual: "Animated 3D paper sheet + three contribution cards; links to USENIX and arXiv.", math: "—", evidence: "Published" },
  cad: { visual: "Grid explainer (4 steps, scenario switch, σ slider) | Our implementation: CAD-conflict replay, fig05, paper→implementation fidelity table.", math: "Eq. 5–7 (ε_occ, merged map, ε_spoof / ε_remove)", evidence: "Published method · illustrative grid · measured" },
  results: { visual: "Headline tiles; Table 3 chart from published_cad_table3.csv (attack succ., IoU, AP drop, region detection, frame TPR/FPR).", math: "Metric definitions", evidence: "Published" },
  tcad: { visual: "Architecture build-up | As implemented (fig08, fig01) | Concept diagram (handoff SVG).", math: "—", evidence: "Measured (implemented)" },
  uncertainty: { visual: "Live grid: truth / observation / belief + ECE | Measured calibration: P(Z|X) by range, ECE table, fig15.", math: "Calibrated likelihood; missing-at-random", evidence: "Illustrative + Measured" },
  hmm: { visual: "Interactive filter (+ learned transitions) | Measured: fig12, fig20, per-family effects | Recorded: CAD-HMM replay + fig06.", math: "Forward filter with term-by-term highlighting", evidence: "Illustrative + Measured + Recorded" },
  fusion: { visual: "Interactive fusion | Measured: ρ, tempered vs naive AUROC, R7 FPR table, correlated-errors replay.", math: "∏ P(Z_i|X)^w_i", evidence: "Illustrative + Measured + Recorded" },
  anomaly: { visual: "Illustrative rolling score | Measured episodes: detection/delay/false-alarm table, T-CAD + ground-truth replays, fig14.", math: "A_i,t = −log P(Z_i,t | Z_−i,1:t)", evidence: "Illustrative + Measured + Recorded" },
  ablation: { visual: "ND…A5-LR selector driving the architecture; component matrix; measured AUROC/TPR/FPR with CIs and paired diffs.", math: "—", evidence: "Measured" },
  evaluation: { visual: "Endpoint-driven forest plot (8 metrics, CIs), component contributions, p95 runtime.", math: "Metric definitions", evidence: "Measured" },
  conclusion: { visual: "Return to the intersection with the fabricated object flagged; pipeline strip; three takeaways.", math: "—", evidence: "Published + Measured" },
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
let md = `# T-CAD Presentation — Storyboard & Speaker Script\n\n`;
md += `Generated from \`lib/presenterNotes.ts\`. Main deck target: **${fmt(totalTargetSeconds)}** across ${sceneNotes.length} scenes.\n\n`;
md += `| # | Scene | Target | Evidence |\n|---|---|---|---|\n`;
sceneNotes.forEach((n, i) => (md += `| ${i + 1} | ${n.title} | ${fmt(n.targetSeconds)} | ${storyboard[n.id]?.evidence ?? ""} |\n`));
md += `\n---\n`;
let cumulative = 0;
sceneNotes.forEach((n, i) => {
  cumulative += n.targetSeconds;
  const sb = storyboard[n.id];
  md += `\n## ${i + 1}. ${n.title}  \n*${fmt(n.targetSeconds)} (ends ≈ ${fmt(cumulative)}) · URL \`#${n.id}\`*\n\n`;
  md += `**Learning objective.** ${n.objective}\n\n`;
  md += `**Visual.** ${sb.visual}\n\n**Math.** ${sb.math}\n\n`;
  if (n.interaction) md += `**Interaction.** ${n.interaction}\n\n`;
  md += `**Talking points.**\n${n.points.map((p) => `- ${p}`).join("\n")}\n\n`;
  md += `**Script.**\n\n> ${n.script}\n\n**Transition →** ${n.transition}\n`;
});
md += `\n---\n\n## Backup: anticipated questions\n\n`;
qaItems.forEach((q) => (md += `### ${q.q}\n${q.a}\n\n`));
writeFileSync("docs/SPEAKER_SCRIPT.md", md);

let g = `# Glossary\n\n| Term | Definition |\n|---|---|\n`;
glossary.forEach((x) => (g += `| ${x.term} | ${x.def} |\n`));
writeFileSync("docs/GLOSSARY.md", g);
console.log("wrote docs/SPEAKER_SCRIPT.md and docs/GLOSSARY.md");
