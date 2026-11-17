# T-CAD Presentation — Storyboard & Speaker Script

Generated from `lib/presenterNotes.ts`. Main deck target: **15:00** across 14 scenes.

| # | Scene | Target | Evidence |
|---|---|---|---|
| 1 | When Vehicles Share Reality | 0:45 | Illustrative |
| 2 | Why Collaborative Perception Exists | 0:55 | Illustrative + Recorded run |
| 3 | The Security Problem | 1:00 | Illustrative + Recorded run |
| 4 | The Original Research | 0:45 | Published |
| 5 | Understanding CAD | 1:25 | Published method · illustrative grid · measured |
| 6 | Published Results & Open Questions | 1:00 | Published |
| 7 | Introducing T-CAD | 1:00 | Measured (implemented) |
| 8 | Representing Uncertainty | 1:05 | Illustrative + Measured |
| 9 | Temporal Reasoning with an HMM | 1:30 | Illustrative + Measured + Recorded |
| 10 | Collaborative Probabilistic Fusion | 1:05 | Illustrative + Measured + Recorded |
| 11 | Anomaly Detection Over Time | 1:10 | Illustrative + Measured + Recorded |
| 12 | Implementation & Ablation (measured) | 1:15 | Measured |
| 13 | Evaluation: Measured Results | 1:15 | Measured |
| 14 | Conclusion & Future Work | 0:50 | Published + Measured |

---

## 1. When Vehicles Share Reality  
*0:45 (ends ≈ 0:45) · URL `#opening`*

**Learning objective.** Hook: collaboration extends what a car can see — and that creates a trust question.

**Visual.** Full-bleed 2.5D intersection; ray-cast LiDAR fields, sweep lines, V2V particle links; slow camera drift.

**Math.** —

**Talking points.**
- Cyan = EGO's own LiDAR field; blue = what other connected vehicles (CAVs) sense and share.
- The vehicle approaching from the left is hidden from EGO behind the building, but a collaborator can see it.
- Ask the question, don't answer it yet.

**Script.**

> Here's an intersection at night. The vehicle in cyan is our ego car. The cyan region is everything its LiDAR can actually see — notice the hard shadows the buildings cast. A car is approaching from the left, completely hidden behind that block. But the blue vehicles can see it, and they share what they see. That's collaborative perception: vehicles pooling sensor information so each one sees beyond its own line of sight. It's powerful. It also raises one question we'll spend the next fifteen minutes on: what happens when an autonomous vehicle trusts what another vehicle sees?

**Transition →** To answer that, first: why do vehicles collaborate at all?

## 2. Why Collaborative Perception Exists  
*0:55 (ends ≈ 1:40) · URL `#why-collab`*

**Learning objective.** Establish the benefit before the risk: occlusion and range limits are physical.

**Visual.** Split view of the same world: EGO-only vs collaborative; ground-truth toggle; ‘my simulation’ shows recorded occlusion replays (world + LiDAR).

**Math.** —

**Interaction.** Split / EGO only / Collaborative; then ‘my simulation (recorded)’ to show the same occlusion in our real simulator.

**Talking points.**
- Same scene, same instant — left: EGO alone; right: EGO + shared data.
- Limits: sensor range (~50 m maps in the paper), occlusion by buildings/vehicles, sparse returns at distance.
- Sharing levels: raw point clouds (early fusion), neural feature maps (intermediate), object boxes (late).
- Toggle 'ground truth' to show what EGO is missing.

**Script.**

> On the left is what the ego vehicle knows using only its own sensors. On the right is the same moment with collaboration. The hidden car on the left side is invisible to ego — dashed gray means it exists but ego cannot perceive it. With collaboration, it appears as a blue detection: ego now knows about it from someone else's sensor. Vehicles can share at three levels: raw LiDAR point clouds, which is early fusion; intermediate neural-network feature maps; or final object boxes, which is late fusion. The paper we study attacks all three. Either way, the benefit is real: occlusion and range are physical limits no single sensor can overcome.

**Transition →** But every one of those blue detections is information ego did not measure itself.

## 3. The Security Problem  
*1:00 (ends ≈ 2:40) · URL `#threat`*

**Learning objective.** Introduce data fabrication conceptually; land on the trust question.

**Visual.** Same world with a synthetic fabricated object inside EGO's observed free space; evidence table; recorded merged-occupancy replay of scenario C.

**Math.** —

**Interaction.** Benign → Fabricated report; then ‘my simulation’ shows the merged map turning red when cav00's phantom report arrives (6.5–9.4 s).

**Talking points.**
- Synthetic illustration only — we model the *effect* of a fabricated report, not any mechanism.
- Threat model (paper): an insider participant sends crafted data; goal is to spoof or remove objects in the victim's perception.
- Key observation for defense: EGO's own LiDAR says that region is free space.
- Consequences in the paper: hard brakes or increased collision risk.

**Script.**

> Now suppose one participant is malicious or compromised. In this synthetic illustration, CAV-B's shared data makes ego's perception report an object directly ahead — in red. Nothing is there. In the paper's threat model the attacker is an insider, a legitimate participant who sends crafted perception data, and the goal is either to spoof a nonexistent object, causing a hard brake, or to remove a real object, raising collision risk. We are not showing how that's done — only what the victim sees. And notice the important detail: ego's own LiDAR scanned that region and saw free space. The evidence disagrees. So the question becomes: how can the receiving vehicle determine which shared observations are trustworthy?

**Transition →** That's exactly the question Zhang and colleagues tackled at USENIX Security 2024.

## 4. The Original Research  
*0:45 (ends ≈ 3:25) · URL `#paper`*

**Learning objective.** Credit the authors; state the paper's three contributions.

**Visual.** Animated 3D paper sheet + three contribution cards; links to USENIX and arXiv.

**Math.** —

**Talking points.**
- Zhang, Jin, Zhu, Sun, Zhang, Chen, Mao — Michigan, UC Irvine, Google. USENIX Security 2024, pp. 6309–6326.
- Contribution 1: real-time data-fabrication attacks on early and intermediate fusion (ray casting; adversarial optimization), zero-delay scheduling.
- Contribution 2: Adv-OPV2V benchmark + real-world MCity tests.
- Contribution 3: CAD — Collaborative Anomaly Detection.

**Script.**

> This is the paper our project builds on: On Data Fabrication in Collaborative Vehicular Perception, by Qingzhao Zhang and colleagues at Michigan, UC Irvine and Google, published at USENIX Security 2024. It makes three contributions. First, it shows realistic, real-time fabrication attacks against early and intermediate fusion — the attacker prepares each frame's attack during the previous LiDAR cycle, so there's no noticeable delay. Second, it builds a benchmark, Adv-OPV2V, and validates on real vehicles at the MCity test facility. Third — the part we extend — it proposes CAD, Collaborative Anomaly Detection. All the published numbers you'll see are theirs, not ours.

**Transition →** Let's look at how CAD actually works.

## 5. Understanding CAD  
*1:25 (ends ≈ 4:50) · URL `#cad`*

**Learning objective.** Teach both consistency checks precisely, using the paper's set notation.

**Visual.** Grid explainer (4 steps, scenario switch, σ slider) | Our implementation: CAD-conflict replay, fig05, paper→implementation fidelity table.

**Math.** Eq. 5–7 (ε_occ, merged map, ε_spoof / ε_remove)

**Interaction.** Steps 1→4; Benign / Spoof / Remove; drag σ. Then ‘Our implementation’: recorded CAD-conflict replay + fig05 (8.2 m² occupancy + 2.8 m² spoof = 11.0 m² > 10.0 m² threshold).

**Talking points.**
- Each vehicle builds an occupancy map M = (S_O, S_F): occupied and free regions; everything else is unknown.
- Maps are synchronized to one timestamp using tracking (CAD already uses motion).
- Check 1 — Occ↔Occ (Eq. 5): ε_occ = ∪ S_O^(i) ∩ S_F^(j). Someone says occupied where someone else says free.
- Merged map (Eq. 6): conflicts removed; EGO's own map is trusted.
- Check 2 — Perc↔Occ (Eq. 7): ε_spoof = predicted boxes ∩ merged free space; ε_remove = merged occupied space not covered by any box.
- Conflicts smaller than σ thresholds are ignored — slide the threshold.

**Script.**

> CAD's core insight is geometric. Every vehicle turns its LiDAR into an occupancy map with two sets: S-O, space it saw occupied, and S-F, space it saw free. Anything not observed is unknown — unknown is the absence of evidence, not evidence. Using tracking, CAD aligns all maps to the same timestamp. Then two checks. First, occupancy-to-occupancy: if one vehicle claims a cell is occupied and another directly observed it as free, that's a conflict — equation 5. The conflicts are removed when the maps are merged, with ego's own observations trusted — equation 6. Second, perception-to-occupancy: the final perception output, the boxes, should agree with the merged map. A box sitting in confirmed free space is a spoofing anomaly; confirmed occupied space with no box is a removal anomaly — equation 7. Tiny conflicts are ignored using area thresholds sigma, which trade false alarms against misses. Notice what is not here: a vote. CAD doesn't count heads; it looks for geometric contradictions.

**Transition →** So how well does it work?

## 6. Published Results & Open Questions  
*1:00 (ends ≈ 5:50) · URL `#results`*

**Learning objective.** Report the paper's numbers precisely with their definitions; motivate the gap.

**Visual.** Headline tiles; Table 3 chart from published_cad_table3.csv (attack succ., IoU, AP drop, region detection, frame TPR/FPR).

**Math.** Metric definitions

**Interaction.** Switch metric: attack success, IoU, AP drop, region detection, frame TPR/FPR. Hover bars for the full Table 3 row. All values come from published_cad_table3.csv.

**Talking points.**
- Attacks: > 86% success on Adv-OPV2V (86.0–99.3% per Table 3).
- CAD: abstract reports 91.5% of attacks detected at ≈3% FPR in simulation.
- Table 3: region-level detection 80.8–83.8%; frame-level TPR ≈ 80% (spoof) vs. 38–43% (remove) because frame-level counts benign faults.
- One row (RC-Early-Remove) has FPR 5.6% — so 'below 3%' is not universal.
- CAD already uses time for synchronization; the decision is per frame.

**Script.**

> These are the paper's results, not ours. The attacks succeed over 86% of the time on the simulated benchmark. CAD, per the abstract, detects 91.5% of attacks with about a 3% false-positive rate. Two careful notes. The 91.5% aggregate isn't derived in a table; Table 3 shows region-level detection between about 81 and 84%, and frame-level true-positive rates near 80% for spoofing but only 38 to 43% for removal, because frame-level counting includes benign perception faults. And one row has a 5.6% false-positive rate. CAD does use time — it tracks objects to synchronize maps — but each consistency decision is made on one frame. CAD also needs a benign vehicle to observe the attacked region at that moment. That leads to our question: what changes when perception evidence evolves over time?

**Transition →** That question is the starting point for T-CAD.

## 7. Introducing T-CAD  
*1:00 (ends ≈ 6:50) · URL `#tcad`*

**Learning objective.** Show the extension as additions to — not replacements of — CAD.

**Visual.** Architecture build-up | As implemented (fig08, fig01) | Concept diagram (handoff SVG).

**Math.** —

**Interaction.** Step the build-up; then ‘As implemented’ (fig08, fig01) and ‘Concept diagram’ (handoff SVG).

**Talking points.**
- Blue/cyan = CAD design (our CAD-inspired re-implementation is A0). Purple/amber = T-CAD additions.
- Calibration: P(Z|X) per 10 m range bin, fit on a calibration split.
- Fusion: leave-one-out posterior, tempered by measured error correlation ρ ≈ 0.68.
- HMM: learned transitions P(F→O) ≈ 0.0009, P(O→F) ≈ 0.063 per 0.1 s.
- Decision: A5 rule (strong CAD OR A4) or A5-LR logistic regression.
- All implemented and measured — on a synthetic simulator, not Adv-OPV2V.

**Script.**

> Here's our extension, T-CAD — Temporal Collaborative Anomaly Detection. The blue and cyan pipeline is CAD's design; we re-implemented it as our baseline, A0. We add four purple and amber modules. Calibration replaces hard free-or-occupied labels with likelihoods fitted per range bin. Fusion combines the other vehicles' evidence, tempered because their errors turn out to be strongly correlated. A hidden Markov model carries belief through time. And a leave-one-out score asks how surprising each vehicle's report is given everyone else. Finally, a decision layer — either an interpretable rule or a logistic regression — makes the call. All of this is now implemented and evaluated, but only in our own synthetic simulator. The ‘As implemented’ tab shows the repository's architecture.

**Transition →** Step one is representing uncertainty explicitly.

## 8. Representing Uncertainty  
*1:05 (ends ≈ 7:55) · URL `#uncertainty`*

**Learning objective.** Separate hidden state, observation, and belief; show calibration vs. overconfidence.

**Visual.** Live grid: truth / observation / belief + ECE | Measured calibration: P(Z|X) by range, ECE table, fig15.

**Math.** Calibrated likelihood; missing-at-random

**Interaction.** Raise noise with assumed reliability high → ECE jumps. Then ‘Measured calibration’: real P(occ|Occ) falls from 0.75 at 0–10 m to 0.03 at 40–50 m; calibration cuts ECE ~5× (0.0016 vs 0.0077).

**Talking points.**
- Hidden state X ∈ {Free, Occupied}. Unknown is NOT a third state — it's missing evidence.
- Three panels: ground truth (hidden), current observation Z_t, inferred belief P(X_t = Occ | Z_1:t).
- Assumed reliability vs. actual noise: if the model assumes 0.97 but the sensor is 80% accurate, belief is overconfident → ECE rises.
- Occlusion and dropout create gray cells; belief there drifts toward the prior instead of snapping.

**Script.**

> Here's the same idea on a grid. Left: the true occupancy, which no vehicle actually knows. Middle: what the sensor reports this frame — cyan is occupied, dark is free, hatched gray is no observation, because it's occluded or dropped. Right: the model's belief that each cell is occupied, in purple. The key distinction: unknown is not a third physical state. A cell is either free or occupied; unknown means we lack evidence. Now watch calibration. If I raise the observation noise but leave the model's assumed reliability high, the belief becomes confidently wrong — the expected calibration error goes up. If the assumed reliability matches reality, confidence is honest. That's the purpose of calibrated likelihoods: confidence should mean something.

**Transition →** Now let's zoom into a single cell and watch belief evolve over time.

## 9. Temporal Reasoning with an HMM  
*1:30 (ends ≈ 9:25) · URL `#hmm`*

**Learning objective.** Walk the forward-filter recursion term by term.

**Visual.** Interactive filter (+ learned transitions) | Measured: fig12, fig20, per-family effects | Recorded: CAD-HMM replay + fig06.

**Math.** Forward filter with term-by-term highlighting

**Interaction.** Step phases; click ‘use learned transitions’. ‘Measured’: fig12 real belief traces + per-family effect (removal +0.104). ‘Recorded replay’: CAD-HMM view under transient ghosts.

**Talking points.**
- Phases: prior → predict (transition) → observe → weight by likelihood → normalize → posterior.
- Transition matrix encodes how fast cells change. Low switching = strong memory.
- Missing observation: likelihood is flat, so the posterior equals the prediction.
- Memory is double-edged: smooths noise, but delays recognizing real change.

**Script.**

> One cell, over time. The amber curve is the posterior probability that it's occupied. Let me step through one update. We start from the previous belief. The transition model predicts how the cell might have changed — that's the sum over previous states. A new observation arrives. We weight each hypothesis by how likely that observation is under it — the likelihood. We normalize so probabilities sum to one. That's the posterior, and it becomes the next prior. Watch the formula: each highlighted term is the step on screen. Two behaviors to notice. When the observation is missing — gray — the likelihood is flat, so belief just follows the prediction; missing is not contradiction. And when the true state flips, the belief lags a few frames. If I lower the switching probability, the model trusts history more — noise gets smoothed, but real changes are recognized later. That tradeoff will matter for detection delay.

**Transition →** That's one sensor. Collaboration means several vehicles report on the same region.

## 10. Collaborative Probabilistic Fusion  
*1:05 (ends ≈ 10:30) · URL `#fusion`*

**Learning objective.** Show product-of-likelihoods fusion and its independence assumption failing.

**Visual.** Interactive fusion | Measured: ρ, tempered vs naive AUROC, R7 FPR table, correlated-errors replay.

**Math.** ∏ P(Z_i|X)^w_i

**Interaction.** Toggle ‘V3 relays V2’. Then ‘Measured + replay’: ρ = 0.68; naive independence lowers A2 AUROC 0.865 → 0.851; R7 shows fusion raises benign false alarms vs CAD.

**Talking points.**
- Independent sources: log-odds add — each vehicle shifts belief by log(r/(1−r)).
- Missing report contributes nothing (flat likelihood).
- Correlated mode: V3 relays V2's view. Naive product double-counts → overconfident.
- Tempering correlated sources (weights summing to 1 per correlated group) is one conservative fix; covariance intersection is the classic alternative.

**Script.**

> Three vehicles report on the same region, each with its own reliability. If their errors are independent, fusion is simple: multiply the likelihoods — in log-odds, just add each vehicle's evidence. A missing report adds nothing. But that independence assumption is easy to break. Switch on the correlated mode: V3's report is effectively a copy of V2's — say it's relayed, or they share the same viewpoint. Naive fusion counts it twice, and the belief becomes far more confident than the real information justifies. In an adversarial setting that's dangerous: duplicated or colluding reports can push belief further than they should. The correlation-aware version tempers the correlated group so it counts once. We don't claim this solves correlation — estimating which sources are correlated is itself an open problem we must evaluate.

**Transition →** Fused belief over time gives us a way to score each vehicle.

## 11. Anomaly Detection Over Time  
*1:10 (ends ≈ 11:40) · URL `#anomaly`*

**Learning objective.** Show the leave-one-out score, threshold tradeoffs, and detection delay — honestly.

**Visual.** Illustrative rolling score | Measured episodes: detection/delay/false-alarm table, T-CAD + ground-truth replays, fig14.

**Math.** A_i,t = −log P(Z_i,t | Z_−i,1:t)

**Interaction.** Illustrative: switch scoring mode, drag τ, set k. Then ‘Measured episodes’: event table + T-CAD / ground-truth replays + fig13/fig14.

**Talking points.**
- A_{i,t} = −log P(Z_{i,t} | Z_{−i,1:t}): surprise of vehicle i given the others and history.
- Synthetic episode: V1 benign glitch (t≈7), V3 fabricates (t=16–27), genuine object arrives (t=41) seen first by V2.
- Per-frame (CAD-like) vs. temporal scoring. Temporal catches fabrication even when others are occluded…
- …but also flags the honest first observer of a real arrival — a temporal false-positive mode.
- Persistence k: require k consecutive alarms — fewer false alarms, longer delay.

**Script.**

> Here's the scoring idea on a teaching example. For each vehicle we ask: given everyone else's reports and the history, how surprising is this report? Around frame 7, V1 has a benign glitch. From frame 16, V3 fabricates. At frame 41 a real object arrives and only V2 sees it first. Temporal scoring keeps flagging V3 even when others are occluded — but it also flags honest V2 at 41. Drag the threshold and persistence to see the false-alarm versus delay tradeoff. Now the measured view. Across 60 contradictory episodes in our test split, CAD catches 98%, as do A4 and A5, with temporal configurations paying about a tenth of a second — one frame — of extra delay. On 576 benign fault episodes, a quarter to over a third raise at least one alarm. The replay shows the T-CAD view: all three peers flag cav00 during its phantom.

**Transition →** How did each configuration actually perform? That's our ablation.

## 12. Implementation & Ablation (measured)  
*1:15 (ends ≈ 12:55) · URL `#ablation`*

**Learning objective.** Explain A0–A5 and be explicit about status.

**Visual.** ND…A5-LR selector driving the architecture; component matrix; measured AUROC/TPR/FPR with CIs and paired diffs.

**Math.** —

**Interaction.** Click ND…A5-LR; each button shows its AUROC; the detail card shows CIs and paired differences vs A0.

**Talking points.**
- Configurations exactly as in src/tcad/models/tcad.py; all scored on the same recorded test observations.
- A1/A2/A3 alone < A0 (AUROC 0.832 / 0.865 / 0.862 vs 0.911).
- A4 vs A2 +0.048 AUROC [0.033, 0.067], 5/5 seeds: fusion and time are complementary.
- A4/A5 vs A0: inconclusive. A5-LR: 0.970 AUROC, TPR 0.90 vs 0.52 at ~5% FPR.
- Abstention never triggered; A5-LR may learn simulator regularities.

**Script.**

> This is the ablation as implemented. A0 is our CAD-inspired baseline. A1 adds calibrated likelihoods, A2 Bayesian leave-one-out fusion, A3 a per-source HMM — each isolating one idea. A4 combines fusion and the HMM, A5 adds the rule-based decision layer, and A5-LR a learned logistic layer. Selecting a configuration lights up its modules and shows its measured AUROC, TPR and FPR with confidence intervals. The honest pattern: A1 to A3 on their own are worse than CAD. Fusion plus HMM, A4, recovers to CAD's level, and A5 matches it — the differences are inside the confidence intervals. Only A5-LR clearly beats CAD, and because it is learned, it may be exploiting regularities of my simulation.

**Transition →** So what will we measure, and what would count as an improvement?

## 13. Evaluation: Measured Results  
*1:15 (ends ≈ 14:10) · URL `#evaluation`*

**Learning objective.** Present measured results with CIs, denominators and scope; no comparison to the paper's numbers.

**Visual.** Endpoint-driven forest plot (8 metrics, CIs), component contributions, p95 runtime.

**Math.** Metric definitions

**Interaction.** Switch metrics (AUROC, AUPRC, TPR, FPR, frame-level); hover a row for its CI and denominator.

**Talking points.**
- Endpoint /results/tcad-results.json (schema 1.0) ← research-data/measured via import script.
- AUROC: A0 0.911, A4 0.913, A5 0.909, A5-LR 0.970 (95% CIs on hover).
- Frozen-threshold TPR: A0 0.52, A5 0.51, A5-LR 0.90 at FPR ≈ 0.05.
- p95 runtime 28 ms (A0) → 89 ms (A5-LR).
- Not comparable to the paper: different data, attacks, denominators.

**Script.**

> These are our measured results, loaded from the results endpoint. Forty-five held-out scenarios, about eighty thousand report assessments, 4.4 percent of them contradictory, with thresholds frozen on a separate validation split and 95 percent scenario-bootstrap intervals. On AUROC, CAD scores 0.911; the full interpretable T-CAD rule 0.909 — no difference. At the frozen threshold, TPR is about 52 percent for both at a 5 percent false-positive rate. The logistic decision layer reaches 0.970 and 90 percent TPR at the same false-positive rate. The component table shows where value comes from: fusion and the HMM help each other, calibration alone hurts. Runtime stays under 100 milliseconds at the 95th percentile. And please note: this is my simulation, not Adv-OPV2V — these numbers are not comparable to the paper's 91.5 percent.

**Transition →** Let me bring it back to the intersection.

## 14. Conclusion & Future Work  
*0:50 (ends ≈ 15:00) · URL `#conclusion`*

**Learning objective.** Three takeaways; state the measured result and its scope honestly.

**Visual.** Return to the intersection with the fabricated object flagged; pipeline strip; three takeaways.

**Math.** —

**Talking points.**
- 1. Collaboration extends awareness but imports trust problems.
- 2. CAD detects fabrication through geometric consistency (published).
- 3. Simulator study: A4/A5 ≈ CAD overall; HMM helps for removal/missing data; only A5-LR clearly wins — confirm on real data.
- Future: implement A1–A5, reproduce A0, run the protocol, handle correlation, longer sequences.

**Script.**

> Back at our intersection, with the defense overlaid and the fabricated object flagged. Three takeaways. One: collaborative perception genuinely improves awareness, but it imports a trust problem. Two: the original CAD work shows that geometric consistency between vehicles' occupancy maps detects most fabrication attacks in simulation. Three: in our own simulator study, adding calibrated fusion and temporal reasoning matched CAD overall and helped most for removal and missing data; only a learned decision layer clearly outperformed it — something we still need to confirm on real data such as Adv-OPV2V. Trustworthy collaborative perception requires understanding not only what vehicles report, but how that evidence agrees across vehicles and evolves over time. Thank you — I'm happy to take questions.

**Transition →** → Q&A backup slides, glossary, references.

---

## Backup: anticipated questions

### Why use an HMM?
Occupancy is a latent state observed through noisy, sometimes missing sensors — exactly the HMM setting. The forward filter is exact for a two-state cell, cheap (a few multiplies per cell per frame), and its parameters (transition and sensor models) are interpretable and can be fit from labeled data. Alternatives (particle filters, learned recurrent models) are more flexible but harder to calibrate and audit.

### Why not rely exclusively on CAD?
We keep CAD — T-CAD adds to it. CAD's decision is per frame and needs a benign observer at that instant; frame-level removal TPR is 38–43% in the paper. In my simulation, adding the HMM to fused evidence helps most exactly there: removal +0.104 AUROC, missing observations +0.032 (A4 vs A2). Overall, though, A4/A5 are statistically indistinguishable from our CAD baseline (AUROC 0.913 / 0.909 vs 0.911).

### What assumptions does probabilistic fusion make?
The product of likelihoods assumes vehicles' observation errors are conditionally independent given the true state, and that each likelihood model is calibrated. Both can fail: shared viewpoints, relayed data, or colluding attackers create correlation; miscalibrated sensors create over- or under-confidence.

### How is sensor uncertainty represented?
As likelihoods P(Z | X) per vehicle and cell, parameterized by reliability that should depend on range, occlusion, point density and sensor type. In the deck it's one slider; in the implementation it would be fit on held-out labeled data and checked with ECE / reliability diagrams.

### What happens when observations are correlated?
Naive fusion double-counts the shared information and becomes overconfident (Scene 10). Mitigations: temper correlated groups (weights summing to 1), covariance-intersection-style conservative fusion, or modeling the dependence explicitly. Identifying which sources are correlated is itself an open problem.

### How are missing observations handled?
Missing reports contribute no factor, so the posterior follows the transition prediction — missing is not contradiction. Measured: in the missing-observations family the HMM improves AUROC by +0.043 (A3 vs A1). But using unobserved-cell memory as if it were evidence collapses A3 to AUROC 0.697 — memory must not be treated as observation. If missingness is adversarial, the assumption breaks.

### What causes false positives?
Measured: benign faults in the reporter raise FPR from ~4.8% (clean) to 9–13% for calibrated/fused configs (A0 stays 4.6%); 25–38% of benign fault episodes trigger at least one alarm. Localization error is the worst case (A0 FPR 3.5% → 47% at σ = 0.4 m). Moving traffic at 8 m/s raises A4's FPR to 7.9% vs A0 5.5% — the temporal prior contradicting genuine change.

### How is detection latency measured?
Seconds from the first contradictory frame to the first alert, over 60 contradictory episodes, with misses counted separately. Measured mean delay: A0 0.33 s, A3 0.43 s, A4 0.42 s, A5 0.39 s, A5-LR 0.06 s (median 0.0–0.3 s). Temporal configs pay ~0.1 s — about one frame — for their memory.

### What is the computational overhead?
Measured p95 per ego frame (Python, ARM64 laptop, 27,000 frames): A0 28 ms, A3 54 ms, A4 62 ms, A5 70 ms, A5-LR 89 ms; ≥ 99.7% of frames under 100 ms. HMM state adds ~2.7 MB. Not directly comparable to the paper's 92 ms, which includes map transmission on different hardware.

### What do the ablation studies demonstrate?
On my simulation: A1, A2 and A3 alone are worse than CAD (AUROC 0.832 / 0.865 / 0.862 vs 0.911). Combining fusion with the HMM recovers it (A4 vs A2 +0.048 [0.033, 0.067], 5/5 seeds). A4 and A5 vs A0 are inconclusive. Only A5-LR wins clearly (0.970, TPR 0.90 vs 0.52 at ~5% FPR) — and may exploit simulator regularities.

### What are the limitations of the proposed approach?
Our results come from a 2-D synthetic simulator with bounded message-level contradictions, not Adv-OPV2V or real attacks; A0 is CAD-inspired, not the authors' code. HMM hurts for 0.1–0.3 s contradictions; abstention never triggered; A5-LR may learn simulator artefacts. Plus the usual: correlated sources, adaptive temporally consistent attackers, localization error, and no detection without a benign observer.

### What would need to change before real-world deployment?
Real-sensor calibration, validation on real multi-vehicle data, handling of localization and timing errors, rigorous runtime bounds on automotive hardware, integration with attacker identification and response, and safety-case evidence. This is a research prototype, not a safety solution.

