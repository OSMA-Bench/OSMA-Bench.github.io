# OSMA-Bench Project Page

Static project page for **OSMA-Bench: Benchmarking Obstacle-Conditioned Safety in Household Robot Navigation**.
Plain HTML, CSS and JavaScript with no build step. The only external script is MathJax 3 (jsDelivr), which renders the SSI formulas.

## Local preview

```sh
python3 -m http.server 8000 --directory page
# then open http://localhost:8000/
```

## Files

```
page/
├── index.html            # the page
├── README.md             # this file
└── static/
    ├── css/index.css     # color tokens from the paper figures, one font stack
    ├── js/index.js       # opens the toggle an in-page link points into; BibTeX copy; library buttons
    ├── images/           # figures cropped from the paper PDF (table below)
    └── videos/           # built by scripts/make_page_videos.py (library/ with --library)
```

The page follows the paper's three contributions: a one-line claim and the teaser, then one section each for
the benchmark, the metric (SSI) and the findings, then four qualitative videos, the results library and the
citation.
Details (task composition, how SSI is computed, the VLM pipelines, RQ1–RQ3 tables) sit in toggles.

## Figures

Each image is a crop of a figure in the paper PDF, so refresh it when the paper figure changes.

| File | Paper figure |
|---|---|
| `teaser.jpg` | Figure 1 |
| `proximity_speed.jpg` | Figure 2 |
| `results_scatter.png` | Figure 3, left panel |
| `clearance_velocity.jpg` | Figure 4 |
| `task_tiers.jpg`, `task_axes.jpg` | Figure 5, top and bottom |
| `pipeline_voxposer.jpg`, `pipeline_pivot.jpg` | Figure 6, top and bottom |

## Videos

```sh
python3 scripts/make_page_videos.py          # writes page/static/videos/
```

Writes four videos, each with a `_poster.jpg`, that follow the RQ1 results:

| File | Episodes |
|---|---|
| `same_obstacle.mp4` | one boy, three policy groups (Layout 0, Route D, seed 0) |
| `vla_tiers.mp4` | π0.5-OpenTau with a cardboard box, a cat and a boy (Layout 1, Route B, seed 0) |
| `pivot_tiers.mp4` | PIVOT with Gemma-4-12B-it, one obstacle per tier (Layout 2, Route E, seed 16) |
| `voxposer_tiers.mp4` | VoxPoser with Qwen3.6-35B-A3B, one obstacle per tier (Layout 0, Route A, seed 3) |

The frames are the episodes' own recordings. The path is shown by stamping the robot's own pixels at key
positions (the start, every 0.7 m of path, and the closest approach or first contact) at 60% opacity, so they
read as earlier positions next to the opaque live robot; the clearance readout
comes from the same episodes' logs. The runs are read from `outputs/` (named at the top of the script); they
are example episodes, not the paper's figure episodes. `--only NAME` rebuilds one video. Needs `ffmpeg` on `PATH`.

The robot is found in each frame against a median background. When that fails, for a robot that stands still
for long or pushes the obstacle, the script tries again against a background without the logged robot and
fits the camera without the frames with contact; a clip that still does not fit is not written.

### Results library

```sh
python3 scripts/make_page_videos.py --library   # writes page/static/videos/library/
```

Writes one clip per policy group, model and cell, each with a `_poster.jpg`, and `library.json`, from which
the page builds its buttons. The models and cells are set at the top of the script (`LIBRARY_*`): six VLMs
each for VoxPoser and PIVOT, π0.5-OpenTau for the VLAs, and the cells of the first three videos (Layout 0,
Route D; Layout 1, Route B; Layout 2, Route E), all seed 0, at 2× speed. The VLA clips use a cardboard box,
a cat and a boy, the only obstacles recorded in the VLA run (`outputs/vla_625_original`, a separate run with
a 0.6 m goal radius, also used by the first two videos); `outputs/` holds no seed 0 Cosmos recordings. The clips of one cell share one frame. VoxPoser with Qwen3.5-9B and with
Qwen3.6-35B-A3B on Layout 2, Route E recorded a broken camera view in the runs with the boy, so these two
clips are missing and their buttons are greyed out.
`--only NAME` with `--library` rebuilds single clips and leaves `library.json` as it is.

## Before release

- The **Code & Benchmark** button points to the anonymous code repo `https://github.com/OSMA-Bench/OSMA-Bench`
  (`TODO(anon)` comment in `index.html`). Replace it with the real links after review.
- Every push to `main` that touches `page/` publishes it to `https://osma-bench.github.io/`
  (`.github/workflows/sync-anon-page.yml`, see `docs/ANONYMOUS_PUBLISH.md`).
- The hero byline and the BibTeX entry (`OSMABench`) name the authors, and the Paper button links
  arXiv 2610.34674. The page build's leak gate therefore does not block author names, only account
  names, local paths and institutional e-mails.
