// Index the NotebookLM explanation videos of the mock exams: <root>/t<N>_notebook_sources/(t<N>)NN_<label>.mp4
// -> sets/exam-videos.js (read by index.html) + sets/exam-media-assets.json (read by scripts/upload-media.mjs).
// t1..t9 = mock exams 1..9 (4 is the "default" set). Video NN explains questions 10*(NN-1)+1 .. 10*NN
// (same 10-question chunks as the (tN)CCAR-F_..._1-10.md sources). Exams without videos are simply left out,
// so this can be re-run whenever more videos are produced.
// Usage: node scripts/build-exam-videos.mjs [root folder holding the t*_notebook_sources folders]
//        (default: the parent folder of this repo)
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = process.argv[2] || join(repo, "..");
const fail = (m) => { console.error("ERROR: " + m); process.exit(1); };
const RELEASE = "https://github.com/kdkim2000/claude-certified-architect-practice-exam/releases/download/media-v1/";
// Only the published mock exams (1-6). Add 7.. here when those exams and their videos ship.
const SET_OF = { 1: "practice-1", 2: "practice-2", 3: "practice-3", 4: "default", 5: "practice-5", 6: "practice-6" };
const QUESTIONS = 60, CHUNK = 10, CHUNKS = QUESTIONS / CHUNK;
// GitHub mangles non-ASCII asset names, so the release copy gets an ASCII alias that stays stable while the file name does.
const assetName = (n, nn, f) => `exam-t${n}-${nn}_${createHash("sha1").update(f).digest("hex").slice(0, 8)}.mp4`;

const videos = {}, assets = [];
for (const n of Object.keys(SET_OF)) {
  const dir = `t${n}_notebook_sources`;
  if (!existsSync(join(root, dir))) continue;
  const rows = [];
  for (const f of readdirSync(join(root, dir)).sort()) {
    if (!/\.mp4$/i.test(f)) continue;
    const m = f.match(new RegExp(`^\\(t${n}\\)(\\d{2})_(.+)\\.mp4$`, "i"));
    if (!m) fail(`${dir}/${f}: does not match (t${n})NN_<label>.mp4`);
    const nn = m[1], idx = +nn;
    if (idx < 1 || idx > CHUNKS) fail(`${dir}/${f}: NN must be 01..0${CHUNKS}`);
    if (rows.some((r) => r.n === idx)) fail(`${dir}: two videos for chunk ${nn}`);
    const size = statSync(join(root, dir, f)).size;
    const asset = assetName(n, nn, f);
    rows.push({ n: idx, from: (idx - 1) * CHUNK + 1, to: idx * CHUNK, label: m[2].replace(/_/g, " ").trim(), dir, file: f, asset, size, mb: Math.round(size / 1048576) });
    assets.push({ asset, dir, file: f, size });
  }
  if (rows.length) videos[SET_OF[n]] = rows.sort((a, b) => a.n - b.n);
}
if (new Set(assets.map((a) => a.asset)).size !== assets.length) fail("duplicate asset names");

writeFileSync(join(repo, "sets", "exam-videos.js"),
  `window.EXAM_VIDEO_REMOTE=${JSON.stringify(RELEASE)};window.EXAM_VIDEOS=${JSON.stringify(videos)};\n`);
writeFileSync(join(repo, "sets", "exam-media-assets.json"), JSON.stringify({ release: RELEASE, assets }, null, 1) + "\n");
for (const [id, rows] of Object.entries(videos)) console.log(id.padEnd(11), rows.map((r) => `${r.from}-${r.to}`).join(" "), `(${rows.length}/${CHUNKS} videos, ${rows.reduce((s, r) => s + r.mb, 0)} MB)`);
console.log(`OK: ${assets.length} exam videos in ${Object.keys(videos).length} sets, ${(assets.reduce((s, a) => s + a.size, 0) / 1e9).toFixed(2)} GB`);
