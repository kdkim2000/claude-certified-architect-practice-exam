# Claude Certified Architect – Foundations (CCAR-F): Practice Exam + Study Site

An unofficial Korean-language study site for the Anthropic **Claude Certified Architect – Foundations** certification (exam code **CCAR-F**). It grew from a single 60-question practice exam into four study areas and five mock exams.

**Live site (GitHub Pages): https://kdkim2000.github.io/claude-certified-architect-practice-exam/**

> **Unofficial practice material.** Not affiliated with, endorsed by, or sponsored by Anthropic. See [Credits, disclaimer, license](#credits-disclaimer-license).

---

## Contents

1. [What's on the site](#whats-on-the-site)
2. [About the exam format](#about-the-exam-format)
3. [Quick start](#quick-start)
4. [Pages in detail](#pages-in-detail)
5. [Repository layout](#repository-layout)
6. [Local build guide](#local-build-guide)
7. [Media hosting (video / audio / PDF)](#media-hosting-video--audio--pdf)
8. [Deploy to GitHub Pages](#deploy-to-github-pages)
9. [Adding or updating content](#adding-or-updating-content)
10. [Troubleshooting](#troubleshooting)
11. [Credits, disclaimer, license](#credits-disclaimer-license)

---

## What's on the site

Every page shares one top menu (`nav.js`), in this order, with a second row of page-specific links:

| Menu | Page | What it is | Sub-menu |
|---|---|---|---|
| 📚 **섹션별 학습** | [`study.html`](study.html) | 18 course chapters (S02–S19): lecture notes, exam supplements, cheat sheets, 20 practice questions each (**360**) | 🏠 홈 · ❌ 오답 복습 |
| 🎯 **Task별 학습** | [`tasks.html`](tasks.html) | The 30 official Task Statements (1.1–5.6): notes, *In the Exam* / *Exam Traps*, build-exercise checklists, **98** practice scenarios, 30 infographics and **141** videos, audio summaries and PDF guides (streamed online) | 🏠 홈 · ⚠️ 시험 함정 모음 · ❌ 오답 복습 |
| 📘 **가이드 학습** | [`guide.html`](guide.html) | 13 technology units + 1 hands-on unit, with Korean notes, exam points and 5 check questions per unit (**65**). The home page covers the exam format, out-of-scope topics and a study plan | 🏠 홈 · ❌ 오답 복습 |
| 📝 **모의고사** | [`index.html`](index.html) | Five 60-question mock exams (below), each with study and exam modes | 실전 1 · 실전 2 · 실전 3 · 실전 4 · 실전형 시나리오 |

The menu is hidden while a mock exam is in progress; the exam's **🚪 나가기** button saves the attempt and brings it back.

### Mock exams

| Menu | URL | Questions | Format |
|---|---|---|---|
| 실전 모의고사 1 | `index.html?set=practice-1` | 60 | fixed set, Korean explanations |
| 실전 모의고사 2 | `index.html?set=practice-2` | 60 | fixed set, Korean explanations |
| 실전 모의고사 3 | `index.html?set=practice-3` | 60 | fixed set, 4 scenarios × 15. New questions on the checkpoints tested by the community study guide's sample and practice questions |
| 실전 모의고사 4 | `index.html` (default) | 60 | the upstream bank (`questions/ccar-f.md`), English and 🇰🇷 Korean explanations |
| 실전형 시나리오 | `index.html?set=scenario-pool` | 60 drawn from 169 | **real-exam draw**: 4 of the 6 official scenarios at random, 15 questions each |

Shared across all sets:

- Every question is single-answer with 4 options, as in the official exam.
- Every attempt has exactly the official domain weighting: **D1 16 · D2 11 · D3 12 · D4 12 · D5 9** (27 / 18 / 20 / 20 / 15 %). For the scenario pool, per-domain counts are picked on each draw to meet it.
- Answer letters are balanced, and the correct option is not given away by its length: it is the longest option in 15–28 % of questions per set (about the 25 % of chance).

---

## About the exam format

Per the official Exam Guide:

- Questions are scenario-based and single-answer: one correct option and three distractors.
- Each sitting presents 4 scenarios drawn at random from 6:
  - Customer Support Resolution Agent
  - Code Generation with Claude Code
  - Multi-Agent Research System
  - Developer Productivity with Claude
  - Claude Code for Continuous Integration
  - Structured Data Extraction
- Results are reported on a 100–1,000 scale with 720 to pass. Unanswered questions count as wrong, and there is no penalty for guessing.

This site's score is its own formula (`100 + 900 × correct ÷ total`, 720 as a practice reference), not Anthropic's scoring. The community study guide mentions 8 scenarios; this site follows the official 6.

---

## Quick start

The repository already contains all generated data, so **no build is needed to use the site**; any static server works:

```bash
git clone https://github.com/kdkim2000/claude-certified-architect-practice-exam.git
cd claude-certified-architect-practice-exam
node scripts/serve.mjs          # http://localhost:8080/claude-certified-architect-practice-exam/
```

`index.html` also opens by double-click, but the study pages and the other sets load files with `<script src>`/`fetch`, so use a server for everything else. Requirements: a browser and, for `serve.mjs`, Node.js ≥ 18.

---

## Pages in detail

### 📝 모의고사 — `index.html`
- **Study mode**: check each answer; the timer pauses while the explanation shows. **Exam mode**: timed, with feedback only after you submit.
- Question palette, flags and keyboard shortcuts: `A`–`D` / `1`–`4` to answer, `←` / `→` to move, `F` to flag.
- **🚪 나가기** leaves an attempt; answers and remaining time are kept, and **Resume** continues it, also after a reload.
- Results: scaled score, per-domain bars, and a full review with explanations.
- **실전형 시나리오** draws a new combination on every start. Above each question it shows "Scenario *k* of 4" and that scenario's description, and it defaults to exam mode.
- Each set keeps its own progress in `localStorage` (`cca_exam_v2_<set id>`).

### 📚 섹션별 학습 — `study.html`
- Each chapter has four tabs: **강의 노트 → 시험 대비 보충 → Cheat Sheet → 예상문제 (20)**.
- The dashboard shows progress per chapter, and a checkbox per section marks it as read.
- Also: cross-chapter wrong-answer review, flags, and full-text search with highlighting.
- State key: `cca_study_v1`.

### 🎯 Task별 학습 — `tasks.html`
- Each task has three tabs:
  - **학습 노트**: What You Need to Know, In the Exam, Exam Traps, and a build-exercise checklist.
  - **연습 시나리오**: practice questions with explanations.
  - **미디어**: the infographic plus videos, audio summaries and PDF guides.
- Links lead to the related section notes and related tasks.
- `#/traps` collects the traps of all 30 tasks on one filterable page.
- Media plays from local files when run with `serve.mjs`, otherwise it streams from GitHub Releases (see [Media hosting](#media-hosting-video--audio--pdf)).
- State key: `cca_tasks_v1`.

### 📘 가이드 학습 — `guide.html`

| Unit | Topic | Unit | Topic |
|---|---|---|---|
| G01 | Claude API basics: request structure, roles, `stop_reason`, system prompt, context window | G08 | Task decomposition: fixed pipelines, adaptive decomposition, multi-pass review |
| G02 | Tools and `tool_use`: definitions, `tool_choice`, JSON Schema, syntax vs semantic errors | G09 | Escalation and human-in-the-loop: triggers, patterns, structured handoff, confidence calibration |
| G03 | Claude Agent SDK: agentic loop, `AgentDefinition`, hub-and-spoke, `Task`, hooks | G10 | Multi-agent error handling: categories, anti-patterns, structured subagent errors, coverage annotations |
| G04 | MCP: servers, configuration scopes, `isError`, resources | G11 | Production context management: case-facts block, trimming, position-aware input, scratchpads, state persistence |
| G05 | Claude Code configuration: CLAUDE.md hierarchy, `@import`, `.claude/rules/`, commands and skills, plan mode, `/compact`, `/memory`, CLI in CI/CD, `fork_session` | G12 | Provenance: attribution loss, conflicting data, dates, rendering by content type |
| G06 | Advanced prompting: few-shot, explicit criteria, chaining, interview pattern, validation/retry, self-correction | G13 | Claude Code built-in tools: tool choice, incremental investigation, Read + Write when Edit fails |
| G07 | Message Batches API: when to use it, `custom_id`, failure handling, SLA planning | G14 | Hands-on: four practice projects as step checklists (no quiz) |

- Each unit has three tabs: **학습 노트**, **시험 포인트·함정** (correct patterns, traps, related Task links, official docs) and **확인 문제** (5 questions).
- Also: progress tracking, wrong-answer review and search.
- State key: `cca_guide_v1`.

Apart from the media streams, the pages make no external requests; Markdown is rendered by the vendored `vendor/marked.min.js`. All progress stays in the browser's `localStorage`.

---

## Repository layout

```
claude-certified-architect-practice-exam/
├─ index.html                 mock-exam app (embedded 실전 모의고사 4; loads sets/*.js on ?set=)
├─ study.html                 섹션별 학습
├─ tasks.html                 Task별 학습
├─ guide.html                 가이드 학습
├─ nav.js                     shared top menu for all pages
├─ sets/                      GENERATED  practice-1..3, scenario-pool + manifest.js
├─ study/                     GENERATED  18 chapters (Sxx.js) + manifest.js
├─ tasks/                     GENERATED  30 tasks (Tx_y.js) + manifest.js + media-assets.json + img/*.webp
├─ guide/                     GENERATED  14 units (Gxx.js) + manifest.js
├─ questions/ccar-f.md        GENERATED  실전 모의고사 4 in Markdown (from the JSON bank)
├─ vendor/marked.min.js       Markdown renderer (vendored, no CDN)
├─ scripts/
│  ├─ sync-bank.mjs           JSON bank       -> index.html data + questions/ccar-f.md
│  ├─ build-sets.mjs          mock-exam .md   -> sets/      (checks 16/11/12/12/9)
│  ├─ build-study.mjs         section notes   -> study/
│  ├─ build-tasks.mjs         AICG notes+media-> tasks/
│  ├─ build-guide.mjs         가이드학습/*.md -> guide/
│  ├─ png2webp.py             AICG infographics PNG -> tasks/img/*.webp (Pillow)
│  ├─ upload-media.mjs        AICG media -> GitHub release media-v1 (gh CLI)
│  └─ serve.mjs               local static server with Range support (serves the parent folder)
└─ .github/workflows/pages.yml   deploys to GitHub Pages on every push to main
```

Everything marked GENERATED is rebuilt from source files; **do not edit it by hand**. The repository is about 7 MB; media is never committed.

---

## Local build guide

Rebuild only when **source content changes**. Source files are *not* in this repository; the scripts read them from the **content folder that contains the repo**.

### 1. Prerequisites

| Tool | Needed for | Notes |
|---|---|---|
| Node.js ≥ 18 | all `*.mjs` scripts | no npm packages |
| Python 3 + [Pillow](https://pypi.org/project/pillow/) | `png2webp.py` only | `pip install pillow` |
| GitHub CLI (`gh auth login`) | `upload-media.mjs` only | |

### 2. Expected folder layout

```
<content folder>/                         <- parent of the repo
├─ 실전테스트1.md  실전테스트2.md  실전테스트3.md  시나리오실전풀.md   -> build-sets
├─ CCAR-F_D1_S02_..._notes.md … CCAR-F_D5_S19_..._notes.md (18 files)  -> build-study
├─ 가이드학습/G00_home.md, G01_….md … G14_….md                          -> build-guide
├─ AICG/                                  <- Task content                 -> build-tasks, upload-media
│    ├─ 1.1_Agentic-Loops_EN.md … 5.6_…_EN.md   (30 notes)
│    └─ [(s)]1-1_….mp4 / .m4a / .pdf / .png …   (media; (s) = short summary version)
└─ claude-certified-architect-practice-exam/   <- this repository
```

Each script also accepts the folder as its first argument.

### 3. Naming rules the scripts rely on

| Content | Pattern | Example |
|---|---|---|
| Mock-exam Markdown | fixed names in `SETS` of `scripts/build-sets.mjs` | `실전테스트3.md` |
| Section notes | `CCAR-F_D<d>_S<nn>_<Title>_notes.md` | `CCAR-F_D1_S02_Agentic-Architecture-Foundations_notes.md` |
| Guide units | `G<nn>_<slug>.md` in `가이드학습/` (`G00` = home page) | `G05_claude-code-config-workflows.md` |
| Task notes | `<d>.<t>_<Slug>_EN.md` | `1.1_Agentic-Loops_EN.md` |
| Task media | `[(s)]<d>-<t>_<name>.<ext>` (`mp4`, `m4a`, `pdf`, `png`) | `1-1_CCAR-F_Agentic Loops.mp4` |

`Claude Certified Architect –Foundations.pdf` (the official exam guide) is recognised and deliberately **not** treated as task media.

### 4. Build commands

Run from the repository root. Every script **exits with code 1** if content would be lost or malformed, so a clean run doubles as a check.

```bash
node scripts/build-sets.mjs      # 4 sets; checks options, answer-key table, fixed sets = 60 at exactly 16/11/12/12/9
node scripts/build-study.mjs     # 18 chapters x 20 questions; heading counts source == output
node scripts/build-guide.mjs     # 14 units; required sections, 5 questions x 4 options with an answer
python scripts/png2webp.py ../AICG      # infographics first (Pillow)
node scripts/build-tasks.mjs ../AICG    # 30 tasks; every media file must map to a task
node scripts/sync-bank.mjs <bank.json>  # 실전 모의고사 4 (add --check to verify only)
```

Typical endings:
- `OK: 18 chapters, 360 questions`
- `OK: 14 units, 65 questions`
- `OK: 30 tasks, 98 scenario questions, 171 media items mapped`

### 5. Run and verify locally

```bash
node scripts/serve.mjs           # http://localhost:8080/claude-certified-architect-practice-exam/
node scripts/serve.mjs 9000      # other port
```

Smoke test:

- The top menu shows four items on every page, with the current one highlighted.
- `/` opens 실전 모의고사 4. The **문제셋** dropdown lists 실전 1–4 and 실전형 시나리오.
- `/?set=scenario-pool`: every start draws a new combination of 4 scenarios, and each question shows "Scenario *k* of 4".
- During an exam, **🚪 나가기** returns to the start screen, and **Resume** continues the attempt.
- `/study.html`, `/tasks.html` and `/guide.html`: open a card, switch tabs, and answer a question.
- `/tasks.html#/1.1/media` shows "로컬 파일 재생" locally and "온라인 스트리밍 (GitHub Releases)" on Pages.

`python -m http.server` also works, but without Range requests (no seeking in local videos) and without access to `../AICG`.

---

## Media hosting (video / audio / PDF)

The Task pages use 141 media files from `AICG/`: 60 videos, 52 audio summaries and 29 PDF guides, about 2.9 GB in total and each under 60 MB. That is too large for the repository and for GitHub Pages (1 GB site limit), so they are **published as assets of the GitHub release [`media-v1`](https://github.com/kdkim2000/claude-certified-architect-practice-exam/releases/tag/media-v1)**. Only the compressed infographics (≈ 3.6 MB) are in the repository.

- **Where the page plays from.** The media tab first probes `../AICG/…`.
  - If it is reachable (local run with `serve.mjs`), the page plays the local files.
  - Otherwise (GitHub Pages), it streams the release assets. Videos and audio stream with seeking, PDFs are offered as downloads, and a file that fails to play turns into a download link.
- **Asset names.** GitHub mangles non-ASCII names, so each file gets a stable ASCII alias: `<task>_<kind>_<first 8 hex of sha1(source name)>.<ext>`, e.g. `1-1_video_54c6aef5.mp4`. `build-tasks.mjs` writes the alias into `tasks/manifest.js` and into the upload list `tasks/media-assets.json`.
- **Publishing or updating media**

  ```bash
  node scripts/build-tasks.mjs ../AICG              # refresh manifest + media-assets.json
  node scripts/upload-media.mjs ../AICG --dry-run   # what would be uploaded
  node scripts/upload-media.mjs ../AICG --prune     # upload new/changed files, delete unlisted ones
  ```

  The upload is safe to re-run: it skips assets already present with the same size and verifies every size at the end. Renaming a source file changes its alias, so upload again and commit the rebuilt `tasks/` files together.

---

## Deploy to GitHub Pages

`.github/workflows/pages.yml` runs on every push to `main` (or manually via **Actions → Run workflow**). It deploys only these files:

`index.html`, `study.html`, `tasks.html`, `guide.html`, `nav.js`, `sets/`, `study/`, `tasks/`, `guide/`, `vendor/`

When you add a new top-level page or folder, add it to the workflow's copy step too; otherwise it returns 404 on Pages.

- One-time setup: **Settings → Pages → Source: GitHub Actions**.
- The workflow does **not** rebuild data. Run the build scripts locally and commit the generated folders before pushing.
- All paths are relative, so the `/<repo>/` sub-path works unchanged.

---

## Adding or updating content

| I want to… | Do this |
|---|---|
| Fix a question in 실전 1–3 or the scenario pool | edit the `.md` in the content folder → `node scripts/build-sets.mjs` → commit `sets/` |
| Add a new mock-exam set | add an entry to `SETS` in `scripts/build-sets.mjs` (id, file, title; `count: null` + `pool` for a scenario pool) → rebuild. Add a menu link in `nav.js` |
| Update 실전 모의고사 4 | edit the JSON bank → `node scripts/sync-bank.mjs <bank.json>` → commit `index.html` and `questions/ccar-f.md` |
| Edit a section note or its quiz | edit `CCAR-F_D*_S*_notes.md` → `node scripts/build-study.mjs` → commit `study/` |
| Edit a guide unit | edit `가이드학습/Gnn_*.md` → `node scripts/build-guide.mjs` → commit `guide/` |
| Edit a Task note or scenario | edit `AICG/<d>.<t>_*_EN.md` → `node scripts/build-tasks.mjs` → commit `tasks/` |
| Add or replace an infographic | put `<d>-<t>_*.png` in `AICG/` → `png2webp.py` → `build-tasks.mjs` → commit `tasks/` |
| Add a video, audio file or PDF | drop it in `AICG/` (naming rule above) → `build-tasks.mjs` → `upload-media.mjs --prune` → commit `tasks/` |

Markdown formats the converters expect:

- **Mock sets**:
  - `### Qn. \`[D1 · 1.1]\`` → stem → `**A.** … **D.**` → `<details>` containing `**정답: X**` and the Korean explanation.
  - Scenario sets add `## Part n — Scenario: Scenario k — <name>` followed by the scenario description.
  - Every file ends with an answer-key table.
- **Section notes**:
  - Top-level sections `# Part 1` / `# Part 2` / `# Exam Cheat Sheet` / `# Sample Quiz`.
  - Questions as `### Qn.` + `**Option A**` blocks + `**Answer: X**`.
- **Guide units**:
  - Top-level sections `# 가이드 학습 — Gnn. <title>`, `# 학습 노트`, `# 시험 포인트` and optionally `# 확인 문제`.
  - The quiz has 5 questions in the section-note format.
  - `G00_home.md` feeds the guide home page.
- **Task notes**:
  - `# Task Statement D.T — Title`, then `## n. …` sections, including *In the Exam* and *Exam Traps*.
  - `## n. Practice Scenarios` holds `### Scenario n` blocks.
  - `## n. Build Exercise Checklist` is a numbered list.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `ERROR: … domain counts x/x/x/x/x != 16/11/12/12/9` | a fixed mock set lost the official weighting; fix the domains in the source `.md` |
| `ERROR: … answer X != key table Y` | an answer differs from the answer-key table in the same `.md` |
| `ERROR: expected 18 notes files` / `expected one "…" section` | wrong content folder or a malformed heading; pass the folder explicitly or fix the heading |
| `ERROR: media file does not match naming rule / known task` | a file in `AICG/` breaks `[(s)]D-T_name.ext`; rename it |
| `ERROR: missing tasks/img/D-T.webp` | run `png2webp.py` before `build-tasks.mjs` |
| A new page or folder is 404 on Pages | add it to the copy step in `.github/workflows/pages.yml` |
| Media tab plays nothing online | run `upload-media.mjs --dry-run`: assets may be missing or renamed; then upload and commit `tasks/` |
| Pages are blank when opened by double-click | use `node scripts/serve.mjs` (`file://` blocks `fetch`/scripts) |
| Progress disappeared | `localStorage` is per browser profile and origin (`localhost:8080` ≠ the Pages URL) |

---

## Credits, disclaimer, license

- **Upstream project.** [Szymon Paluch](https://szymonpaluch.com) wrote the original 60-question practice exam (실전 모의고사 4), [`questions/ccar-f.md`](questions/ccar-f.md) and `scripts/sync-bank.mjs`. Upstream repository: [hculap/claude-certified-architect-practice-exam](https://github.com/hculap/claude-certified-architect-practice-exam). Its options were rebalanced here so that answer length gives nothing away, and Korean explanations were added.
- **Community study guide.** 가이드 학습 and 실전 모의고사 3 follow the topic structure and the checkpoints of [paullarionov/claude-certified-architect](https://github.com/paullarionov/claude-certified-architect). That repository states no license, so none of its text, code or questions is reproduced: the notes and questions were written from scratch, and a script checked that no run of 8 or more words matches the guide.
- **Fork content.** The study notes, Task material and the other mock sets come from the maintainer's own notes and the `AICG` materials.
- **Disclaimer.** This is **unofficial practice material**, not affiliated with, endorsed by, or sponsored by Anthropic. It contains no leaked, copied or reconstructed items from Anthropic's exam, and practising here guarantees no exam outcome. The official Exam Guide is **not** reproduced. "Claude" is a trademark of Anthropic.
- **License.** [MIT](LICENSE) © 2026 Szymon Paluch (upstream). The vendored `vendor/marked.min.js` is marked v12 © Christopher Jeffrey, MIT.
