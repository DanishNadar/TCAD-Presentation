# Glossary

| Term | Definition |
|---|---|
| CAV | Connected and autonomous vehicle. |
| Collaborative perception | Vehicles share sensor-derived information to perceive beyond their own line of sight. |
| Early / intermediate / late fusion | Sharing raw point clouds / neural feature maps / final object boxes. |
| Data fabrication | A participant sends crafted perception data to spoof or remove objects in a victim's perception. |
| Spoofing / removal | Creating a non-existent object / hiding a real one in the victim's perception output. |
| Occupancy map | Labels space as occupied, free, or unknown (unobserved). |
| CAD | Collaborative Anomaly Detection (Zhang et al., 2024): geometric consistency checks between shared occupancy maps and perception output. |
| ε_occ, ε_spoof, ε_remove | CAD's conflict regions: occupied-vs-free between vehicles; boxes in free space; occupied space without a box. |
| σ thresholds | Minimum conflict area for CAD to raise an alarm. |
| T-CAD | Our extension (implemented; measured on my simulation): calibration, probabilistic fusion, temporal HMM inference, leave-one-out scoring, decision layer. |
| Hidden state X_t | The true occupancy of a region at time t (Free or Occupied); never observed directly. |
| Observation Z_t | A sensor reading (occ / free) or the absence of one (∅). |
| HMM | Hidden Markov model: latent state with Markov transitions and state-dependent observations. |
| Forward filter | Recursive computation of P(X_t | Z_1:t): predict, weight by likelihood, normalize. |
| Likelihood P(Z | X) | How probable a reading is if the state were X. |
| Log-odds | log(p/(1−p)); independent evidence adds in log-odds. |
| Calibration / ECE | Confidence matches frequency; Expected Calibration Error averages |accuracy − confidence| over bins. |
| Leave-one-out score | A_i,t = −log P(Z_i,t | Z_−i,1:t): surprise of vehicle i given all others. |
| TPR / FPR | True-positive rate (detected attacks / attacks); false-positive rate (alarms on benign / benign). |
| Detection delay | Frames between attack onset and first alarm. |
| Ablation | Removing or adding one component at a time to measure its contribution. |
| A5-LR | T-CAD with an L2-regularised logistic-regression decision layer (plus strong-CAD override); best measured result, possibly simulator-specific. |
| AUROC / AUPRC | Threshold-free ranking quality (ROC) / precision–recall area; AUPRC matters when positives are rare (4.4% here). |
| Frozen threshold | Decision threshold chosen on the validation split (FPR ≤ 5%) and never re-tuned on test. |
| Scenario bootstrap CI | 95% interval from resampling whole test scenarios, so correlated rows inside a scenario don't shrink the CI. |
| ρ (rho) | Measured correlation between sources' observation errors (≈ 0.68); used to temper fusion. |
| Recorded simulator run | A replay rendered from my simulation's recorded trace — a demonstration, not a metric. |
