# Results endpoint (`/results/tcad-results.json`)

Scene 13 loads this file at runtime. Contract: `research-data/published/tcad-results.schema.json`
(schemaVersion `"1.0"`), extended with `"A5-LR"` as a configuration, plus `level`, `denominator`
and `ci95` (per-metric `[low, high]`).

- `status: "measured"` with experiments → measured dashboard (forest plot with CIs).
- `status: "awaiting_measurements"` or an empty/malformed file → "Awaiting verified measurements".

Generate it from logged results; never write it by hand:

```bash
python3 scripts/import_research_data.py   # reads research-data/measured/confidence_intervals.csv etc.
npm run build
```

Each experiment records `runId`, `sourceFile`, `hardware`, `nScenarios` and the denominator
(rows / positives / negatives), as the brief requires.
