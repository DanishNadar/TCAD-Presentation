# T-CAD — Interactive Research Presentation (CS 528, IIT)

An interactive Next.js presentation covering **data fabrication in collaborative vehicular
perception**: the CAD defense from Zhang et al. (USENIX Security 2024), and our proposed
**T-CAD** temporal/probabilistic extension.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → ./out
```

## Deploy (Vercel)

Import the repo in Vercel and use the defaults. The project uses `output: "export"`, so
`./out` can also be served from any static host or opened offline (`npx serve out`). For
a sub-path host, set `NEXT_PUBLIC_BASE_PATH=/your-path`.

## Presenting

| Key | Action |
|---|---|
| → / Space / PgDn, ← / Shift+Space / PgUp | Next / previous scene |
| 1–9, 0 | Jump to scene 1–10 |
| O | Slide overview |
| N | Presenter-notes drawer (script, talking points, timers) |
| S | Open a separate **presenter window**, synced to the deck (put it on your laptop screen) |
| P / R / M | Pause simulations / reset scene / reduced motion |
| F | Fullscreen |

Scenes have URL hashes (`/#cad`, `/#hmm`, …). Arrow keys inside sliders adjust the slider
and don't change slides. The stage is a fixed 1600×900 canvas scaled to fit, so the layout
is identical on any projector.

## Evidence labels

Every number, figure, video and simulation is tagged **Published — Zhang et al. (2024)**,
**Our measured experiment** (T-CAD synthetic simulator, 45 test scenarios), **Recorded
simulator run** (replay videos), **Illustrative simulation**, or **Proposed / not yet
measured**. See `docs/RESEARCH_CONTENT_MAP.md` for the row-level provenance of every number.

## Research data

```
research-data/published/   Zhang et al. 2024 Table 3 + headline metrics (CSV), results schema
research-data/measured/    T-CAD repository results (last complete run, snake_case names)
research-data/diagrams/    editable concept diagrams (SVG)
```

`python3 scripts/import_research_data.py` converts these into
`lib/research/data/*.generated.json` and the Scene 13 endpoint
`public/results/tcad-results.json`. Re-run it after replacing the measured results, then rebuild.

Primary sources: [USENIX paper](https://www.usenix.org/conference/usenixsecurity24/presentation/zhang-qingzhao) ·
[arXiv](https://arxiv.org/abs/2309.12955) · [authors' code & Adv-OPV2V](https://github.com/zqzqz/AdvCollaborativePerception).

## Updating project status

- `lib/research/implementationStatus.ts`: component status (published / implemented / measured / illustrative / proposed) and the ablation matrix
- `lib/research/publishedResults.ts`: verified paper numbers
- `lib/presenterNotes.ts`: script and notes; run `npm run docs` to regenerate `docs/SPEAKER_SCRIPT.md`

## Structure

```
app/                     Next.js entry (static)
components/shell/        PresentationShell, notes, overview, presenter window
components/scenes/       14 scenes + Q&A, glossary, references
components/viz/          Intersection sim, CAD grid, occupancy grid, HMM, fusion, anomaly, architecture, charts
lib/sim/                 Pure simulation logic (seeded, deterministic)
lib/research/            Sources, published + measured data modules, media catalog, status, Q&A
public/videos, figures   Recorded simulator replays (MP4 + posters), repository figures (PNG)
docs/                    Content map, speaker script, glossary, results schema
```
