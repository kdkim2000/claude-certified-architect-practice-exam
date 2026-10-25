# Claude Certified Architect – Foundations (CCAR-F): Practice Exam + Study Site

An unofficial study site for the Anthropic **Claude Certified Architect – Foundations** certification (exam code **CCAR-F**).
This fork extends the original single-file practice exam (60 questions) into **four ways to prepare**:

| Mode | Page | What it is |
|---|---|---|
| 📝 **Mock exams** | [`index.html`](index.html) | Timed / study-mode exams. The original 60 questions plus 4 extra 60-question sets (`?set=…`). |
| 📚 **Study by section** | [`study.html`](study.html) | 18 course chapters (S02–S19): lecture notes, exam-level supplements, cheat sheets, 20 practice questions each (360). |
| 🎯 **Study by Task Statement** | [`tasks.html`](tasks.html) | The 30 official Task Statements (1.1–5.6): notes, exam traps, build-exercise checklists, 98 practice scenarios, infographics, local video/audio. |
| ⚠️ **Exam traps digest** | `tasks.html#/traps` | "In the Exam" + "Exam Traps" of all 30 tasks on one filterable page. |

Live site (GitHub Pages): **https://kdkim2000.github.io/claude-certified-architect-practice-exam/**

> **Unofficial practice material.** Not affiliated with, endorsed by, or sponsored by Anthropic. See [Disclaimer](#disclaimer).
> **About the format.** The real CCAR-F also has multiple-response items and picks four of six scenarios per sitting; the mock exams here do neither. The score is this tool's own formula (`100 + 900 × correct ÷ total`, 720 as a practice reference), not Anthropic's scoring.

---

## Contents

1. [Quick start](#quick-start)
2. [Features](#features)
3. [Repository layout](#repository-layout)
4. [Local build guide](#local-build-guide)
5. [Local media (video / audio / PDF)](#local-media-video--audio--pdf)
6. [Deploy to GitHub Pages](#deploy-to-github-pages)
7. [Adding or updating content](#adding-or-updating-content)
8. [Troubleshooting](#troubleshooting)
9. [Credits, disclaimer, license](#credits-disclaimer-license)

---

## Quick start

The repository already contains the generated data (`sets/`, `study/`, `tasks/`), so you only need a static file server — **no build is required just to use the site**.

```bash
git clone https://github.com/kdkim2000/claude-certified-architect-practice-exam.git
cd claude-certified-architect-practice-exam
node scripts/serve.mjs          # http://localhost:8080/   (or: python -m http.server 8080)
```

`index.html` alone also works by double-click, but the study pages and extra sets load files via `<script src>`/`fetch`, so use a server for the full experience.

Requirements for *using* the site: a browser, and (optionally) Node.js ≥ 18 for `scripts/serve.mjs`.

---

## Features

### Mock exams (`index.html`)
- **Study mode** (check each answer, timer pauses) and **Exam mode** (timed, feedback only after submit).
- 100–1000 scaled score, per-domain breakdown, review with explanations, flags, resume via `localStorage`.
- **Question sets** – pick from the selector on the start screen or open `?set=<id>`:

  | id | Set | Notes |
  |---|---|---|
  | *(none)* | Built-in 60 questions | original upstream bank |
  | `scenario-a`, `scenario-b` | Scenario mock A / B | 4 scenarios × 15 questions, shared scenario text shown above each question |
  | `practice-1`, `practice-2` | Practice exam 1 / 2 | 60 questions each, domain-balanced |

  Each set keeps its own progress (`localStorage` key `cca_exam_v2_<set id>`).

### Study by section (`study.html`)
Per chapter: **강의 노트 → 시험 대비 보충 → Cheat Sheet → 예상문제(20)**. Dashboard with progress per chapter, per-section "read" checkboxes, cross-chapter **wrong-answer review**, flags, and full-text **search** with highlight. State key: `cca_study_v1`.

### Study by Task Statement (`tasks.html`)
Per task (1.1–5.6): **학습 노트 · 연습 시나리오 · 미디어**. Read tracking, interactive *Build Exercise* checklists, 98 exam-style scenarios with explanations, links to the related section notes and related tasks, the traps digest, search, and the task's infographic. State key: `cca_tasks_v1`.

All progress lives in the browser's `localStorage`; nothing is sent anywhere. The pages make no external network requests (Markdown is rendered by the vendored `vendor/marked.min.js`, marked v12, MIT).

---

## Repository layout

```
claude-certified-architect-practice-exam/
├─ index.html                 mock-exam app (inline built-in set, loads sets/*.js on ?set=)
├─ study.html                 section-based study site
├─ tasks.html                 Task-Statement study site
├─ sets/                      GENERATED  mock-exam sets + manifest.js
├─ study/                     GENERATED  18 chapters (Sxx.js) + manifest.js
├─ tasks/                     GENERATED  30 tasks (Tx_y.js) + manifest.js + img/*.webp
├─ vendor/marked.min.js       Markdown renderer (vendored, no CDN)
├─ questions/ccar-f.md        upstream question bank in Markdown
├─ scripts/
│  ├─ sync-bank.mjs           upstream: regenerate index.html data + questions/ccar-f.md from a JSON bank
│  ├─ build-sets.mjs          mock-exam Markdown      -> sets/
│  ├─ build-study.mjs         section study notes     -> study/
│  ├─ build-tasks.mjs         AICG Task notes + media -> tasks/
│  ├─ png2webp.py             AICG infographics PNG   -> tasks/img/*.webp   (Pillow)
│  └─ serve.mjs               local static server with Range support (serves the parent folder)
└─ .github/workflows/pages.yml   auto-deploy to GitHub Pages on push to main
```

`sets/`, `study/`, `tasks/` are **generated — do not edit them by hand**; change the source Markdown and rebuild.

---

## Local build guide

Rebuilding is only needed when the **source content changes**. The source files are *not* in this repository; the build scripts read them from a **content folder next to the repo**.

### 1. Prerequisites

| Tool | Needed for | Notes |
|---|---|---|
| Node.js ≥ 18 | all `build-*.mjs`, `serve.mjs` | no npm packages are used |
| Python 3 + [Pillow](https://pypi.org/project/pillow/) | `png2webp.py` only | `pip install pillow` |
| A modern browser | viewing | Chrome/Edge/Firefox |

### 2. Expected folder layout

Scripts default to paths relative to the repository, i.e. the repo sits **inside** the content folder:

```
CCAR-F2/                                  <- "content folder" (parent of the repo)
├─ 시나리오모의고사A.md  시나리오모의고사B.md  실전테스트1.md  실전테스트2.md     -> build-sets
├─ CCAR-F_D1_S02_..._notes.md … CCAR-F_D5_S19_..._notes.md   (18 files)      -> build-study
├─ AICG/                                  <- Task content (30 *.md + media)   -> build-tasks
│    ├─ 1.1_Agentic-Loops_EN.md … 5.6_…_EN.md                (30 files)
│    └─ 1-1_….mp4 / .m4a / .pdf / .png …
└─ claude-certified-architect-practice-exam/   <- this repository
```

You can also pass any folder as the first argument (see below).

### 3. Naming rules the scripts rely on

| Content | Pattern | Example |
|---|---|---|
| Mock-exam Markdown | fixed names listed in `scripts/build-sets.mjs` | `시나리오모의고사A.md` |
| Section notes | `CCAR-F_D<d>_S<nn>_<Title>_notes.md` | `CCAR-F_D1_S02_Agentic-Architecture-Foundations_notes.md` |
| Task notes | `<d>.<t>_<Slug>_EN.md` | `1.1_Agentic-Loops_EN.md` |
| Task media | `[(s)]<d>-<t>_<name>.<ext>` (`mp4`, `m4a`, `pdf`, `png`) | `1-1_CCAR-F_Agentic Loops.mp4`, `(s)5-3_….mp4` |

`(s)` marks a short/summary variant. `Claude Certified Architect –Foundations.pdf` (the official exam guide) is recognized and deliberately **not** treated as a task file.

### 4. Build commands

Run from the repository root. Every script **fails with exit code 1** if content would be lost or malformed, so a green run is a coverage check.

```bash
# --- mock-exam sets  (reads the 4 mock-exam .md files in the content folder) ---
node scripts/build-sets.mjs                       # default: parent folder
node scripts/build-sets.mjs "E:/NotebookLM/CCAR-F2"
#   checks: 60 questions, 4 options, answers 15/15/15/15, matches the answer-key table

# --- section study notes (18 chapters) ---
node scripts/build-study.mjs
#   checks: 18 chapters, 20 questions each, 4 options, heading counts source == output

# --- Task Statement site (30 tasks + media index) ---
python scripts/png2webp.py "E:/NotebookLM/CCAR-F2/AICG"     # infographics first (needs Pillow)
node scripts/build-tasks.mjs "E:/NotebookLM/CCAR-F2/AICG"
#   checks: exactly 30 tasks (1.1–5.6), title id == filename id, every scenario has 4 options + answer,
#           heading counts, EVERY media file maps to a task (unknown/unmapped files are errors)
```

Typical successful output ends with lines such as `OK: 18 chapters, 360 questions` and `OK: 30 tasks, 98 scenario questions, 113 media items mapped`.

### 5. Run and verify locally

```bash
node scripts/serve.mjs            # serves the PARENT folder, opens site at http://localhost:8080/claude-certified-architect-practice-exam/
node scripts/serve.mjs 9000       # other port
```

Smoke test checklist:

- `/` → mock exam start screen with the **문제셋** dropdown (5 sets) and links to study modes.
- `/?set=scenario-a` → "시나리오 모의고사 A", scenario text visible above questions.
- `/study.html` → 18 chapter cards; open a chapter → 4 tabs; solve a question.
- `/tasks.html` → 30 task cards; open a task → note / practice / media tabs; `#/traps` shows 30 boxes.

`python -m http.server` also works for everything except seeking inside videos (no Range support) and reaching `../AICG` media.

---

## Local media (video / audio / PDF)

The Task mode can play the lecture videos, audio summaries and PDF guides that sit in `AICG/` — but they total ≈ 2.4 GB, so they are **never committed or deployed** (only the compressed infographics, ≈ 3.5 MB, are).

- Start the site with **`node scripts/serve.mjs`** (it serves the parent folder, so `../AICG/…` is reachable and Range requests work).
- Open `tasks.html#/<task>/media` (e.g. `#/1.1/media`): the page probes `../AICG/…`; if reachable it shows ▶ play / open buttons, otherwise it shows a note that the files are local-only (this is what visitors see on GitHub Pages).

---

## Deploy to GitHub Pages

`.github/workflows/pages.yml` runs on every push to `main` (and manually via **Actions → Run workflow**). It copies only these into the artifact and deploys it:

`index.html`, `study.html`, `tasks.html`, `sets/`, `study/`, `tasks/`, `vendor/`

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions** (or `gh api -X POST repos/<user>/<repo>/pages -f build_type=workflow`). Without this the workflow fails at *configure-pages* with "Get Pages site failed … Not Found".

The workflow does **not** regenerate data: run the build scripts locally and commit `sets/`, `study/`, `tasks/` before pushing. All asset paths are relative, so the project sub-path (`/<repo>/`) works unchanged.

Pre-push sanity check (the repo must stay small, no media):

```bash
git status -s
git ls-files | xargs du -ch | tail -1     # should be a few MB
```

---

## Adding or updating content

| I want to… | Do this |
|---|---|
| Fix a typo / question in a mock-exam `.md` | edit the `.md` → `node scripts/build-sets.mjs` → commit `sets/` |
| Edit a section note or its quiz | edit `CCAR-F_D*_S*_notes.md` → `node scripts/build-study.mjs` → commit `study/` |
| Edit a Task note/scenario | edit `AICG/<d>.<t>_*_EN.md` → `node scripts/build-tasks.mjs` → commit `tasks/` |
| Add/replace an infographic | put `<d>-<t>_*.png` in `AICG/` → `python scripts/png2webp.py` → `node scripts/build-tasks.mjs` → commit `tasks/` |
| Add a video/audio/PDF | drop it in `AICG/` following the naming rule → `node scripts/build-tasks.mjs` (updates the manifest; the file itself stays local) |
| Add a **new mock-exam set** | add an entry to `SETS` in `scripts/build-sets.mjs` (file name, id, title) → rebuild → `sets/manifest.js` lists it automatically |
| Update the upstream 60-question bank | `node scripts/sync-bank.mjs path/to/cca-mock-exam.json` (`--check` to verify only) — rewrites `index.html` data and `questions/ccar-f.md` |

Markdown format expected by the converters:

- **Mock sets**: `### Qn. \`[D1 · 1.1]\`` → stem → `**A.** … **D.**` → `<details>` with `**정답: X**`, `해설`, `오답 분석`; scenario sets add `## Part n — Scenario: …` headers and an intro paragraph.
- **Section notes**: `# Part 1` / `# Part 2` / `# Exam Cheat Sheet` / `# Sample Quiz` with `### Qn.` + `**Option A**` blocks + `**Answer: X**`.
- **Task notes**: `# Task Statement D.T — Title`, `## n. …` sections (including *In the Exam* and *Exam Traps*), `## n. Practice Scenarios` with `### Scenario n` (`**A.**…`, `**Answer: X**`), `## n. Build Exercise Checklist` (numbered list).

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `ERROR: expected 18 notes files` / `expected 30 markdown files` | wrong content folder — pass it explicitly as the first argument |
| `ERROR: media file does not match naming rule / known task: …` | a file in `AICG/` breaks `[(s)]D-T_name.ext`; rename it (or, if it is not task media, add it to the exclusion check in `build-tasks.mjs`) |
| `ERROR: missing tasks/img/D-T.webp (run scripts/png2webp.py)` | run `png2webp.py` before `build-tasks.mjs` |
| `ModuleNotFoundError: No module named 'PIL'` | `pip install pillow` |
| `ERROR: … answer X != key table Y` (build-sets) | the answer in a question differs from the answer-key table in the same `.md`; fix the source |
| Study/Task pages are blank when opened by double-click | use `node scripts/serve.mjs` (browsers restrict `fetch`/scripts on `file://`) |
| Media tab says "배포본에는 없습니다" locally | you are not using `scripts/serve.mjs`, or `AICG/` is not the repo's sibling folder |
| Progress disappeared | `localStorage` is per browser profile/origin (`localhost:8080` ≠ the Pages URL); private windows don't persist |
| Pages workflow: "Get Pages site failed" | enable Pages with source **GitHub Actions** (see above) |

---

## Credits, disclaimer, license

- Upstream project: **[Szymon Paluch](https://szymonpaluch.com)** — original 60-question CCAR-F practice exam, [`questions/ccar-f.md`](questions/ccar-f.md), and `scripts/sync-bank.mjs` (upstream: [hculap/claude-certified-architect-practice-exam](https://github.com/hculap/claude-certified-architect-practice-exam), also available at [szymonpaluch.com](https://szymonpaluch.com/claude-certified-architect-practice-exam)). The built-in 60 questions are original work written from the publicly available exam guide.
- Fork additions (extra sets, study modes, build scripts, Pages deployment): content derived from the maintainer's own study notes and the `AICG` materials; the question text in those sets is separate from the upstream bank.
- **Disclaimer.** This is **unofficial practice material**, not affiliated with, endorsed by, or sponsored by Anthropic. It contains no leaked, copied or reconstructed items from Anthropic's exam, and practising here does not guarantee any exam outcome. The official Exam Guide is **not** reproduced here. "Claude" is a trademark of Anthropic.
- **License.** [MIT](LICENSE) © 2026 Szymon Paluch (upstream). The vendored `vendor/marked.min.js` is marked v12 © Christopher Jeffrey, MIT.
