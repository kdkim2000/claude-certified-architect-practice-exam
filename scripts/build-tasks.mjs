// Convert the AICG Task Statement study notes (D.T_*_EN.md) + media index into tasks/T<D>_<T>.js and tasks/manifest.js.
// Usage: node scripts/build-tasks.mjs [AICG folder]   (default: ../AICG next to the repo)
// Infographics must be converted first:  python scripts/png2webp.py <AICG folder>
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(root, "..", "AICG");
const fail = (m) => { console.error("ERROR: " + m); process.exit(1); };

const COUNTS = { 1: 7, 2: 5, 3: 6, 4: 6, 5: 6 }; // official Task Statements per domain
const WEIGHT = { 1: 27, 2: 18, 3: 20, 4: 20, 5: 15 };
const EXPECTED = Object.entries(COUNTS).flatMap(([d, n]) => Array.from({ length: n }, (_, i) => `${d}.${i + 1}`));
const files = readdirSync(src);

// ---------- media (naming rule: [(s)]D-T_name.ext) ----------
const KIND = { mp4: "video", m4a: "audio", pdf: "pdf", png: "image" };
const media = Object.fromEntries(EXPECTED.map((id) => [id, { video: [], audio: [], pdf: [], image: null }]));
const skipped = [];
for (const f of files) {
  const ext = (f.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
  if (ext === "md") continue;
  if (!KIND[ext]) { fail(`unknown file type: ${f}`); }
  if (/^Claude Certified Architect/.test(f)) { skipped.push(f); continue; } // official Exam Guide: local link only, not a task
  const m = f.match(/^(?:\((\w+)\))?(\d)-(\d)_(.+)\.[a-z0-9]+$/i);
  if (!m || !media[`${m[2]}.${m[3]}`]) fail(`media file does not match naming rule / known task: ${f}`);
  const id = `${m[2]}.${m[3]}`;
  if (ext === "png") { media[id].image = `tasks/img/${m[2]}-${m[3]}.webp`; if (!existsSync(join(root, media[id].image))) fail(`missing ${media[id].image} (run scripts/png2webp.py)`); continue; }
  media[id][KIND[ext]].push({ file: f, label: m[4].replace(/_/g, " "), variant: m[1] || "", mb: Math.round(statSync(join(src, f)).size / 1048576) });
}

// ---------- markdown ----------
function splitH2(md) { // fence-aware split on "## "
  const out = []; let fence = false, cur = { head: "", lines: [] };
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && /^## /.test(line)) { out.push(cur); cur = { head: line.slice(3).trim(), lines: [line] }; } else cur.lines.push(line);
  }
  out.push(cur);
  return out.map((s) => ({ head: s.head, md: s.lines.join("\n") }));
}
function countHeadings(md) {
  let fence = false, h2 = 0, h3 = 0;
  for (const line of md.split("\n")) { if (/^```/.test(line)) { fence = !fence; continue; } if (fence) continue; if (/^## /.test(line)) h2++; else if (/^### /.test(line)) h3++; }
  return { h2, h3 };
}
function parseScenarios(md, id) {
  const parts = md.split(/^### Scenario (\d+)\s*$/m), out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const n = +parts[i], b = parts[i + 1];
    const a = b.search(/^\*\*A\.\*\* /m); if (a < 0) fail(`${id} scenario ${n}: no options`);
    const options = [...b.slice(a).matchAll(/^\*\*([A-D])\.\*\* (.*)$/gm)].map((m) => m[2].trim());
    if (options.length !== 4) fail(`${id} scenario ${n}: ${options.length} options`);
    const ans = b.match(/\*\*Answer:\s*([A-D])\.?\*\*\.?/); if (!ans) fail(`${id} scenario ${n}: no answer`);
    const explanation = b.slice(b.indexOf(ans[0]) + ans[0].length).replace(/<\/details>[\s\S]*$/, "").trim();
    out.push({ id: `${id}-S${n}`, stem: b.slice(0, a).trim(), options, answer: "ABCD".indexOf(ans[1]), explanation });
  }
  if (out.length < 2) fail(`${id}: only ${out.length} scenarios`);
  return out;
}

const mdFiles = files.filter((f) => f.endsWith(".md")).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
if (mdFiles.length !== 30) fail(`expected 30 markdown files, found ${mdFiles.length}`);
mkdirSync(join(root, "tasks"), { recursive: true });
const manifest = []; let totalScen = 0;
const seen = new Set();
for (const f of mdFiles) {
  const nm = f.match(/^(\d)\.(\d)_(.+)_EN\.md$/); if (!nm) fail(`markdown file does not match naming rule: ${f}`);
  const id = `${nm[1]}.${nm[2]}`; if (!EXPECTED.includes(id)) fail(`unknown task id ${id}`); seen.add(id);
  const md = readFileSync(join(src, f), "utf8").replace(/\r\n/g, "\n");
  const secs = splitH2(md);
  const head = secs[0].md; // title, domain line, Related quote
  const t = head.match(/^# Task Statement (\d\.\d) — (.+)$/m); if (!t || t[1] !== id) fail(`${f}: title id mismatch (${t && t[1]})`);
  const relLine = (head.match(/Related:.*$/m) || [""])[0];
  const related = { sections: [...new Set([...relLine.matchAll(/CCAR-F_(S\d+)/g)].map((m) => m[1]))],
    tasks: [...new Set([...relLine.matchAll(/\b([1-5])\.([1-7])\b/g)].map((m) => `${m[1]}.${m[2]}`))].filter((x) => x !== id && EXPECTED.includes(x)) };
  const find = (re) => secs.slice(1).filter((s) => re.test(s.head));
  const scen = find(/^(\d+\.\s*)?Practice Scenarios/), chk = find(/^(\d+\.\s*)?Build Exercise Checklist/);
  if (scen.length !== 1 || chk.length !== 1) fail(`${f}: need exactly one Practice Scenarios and one Build Exercise Checklist section`);
  const scenarios = parseScenarios(scen[0].md, id); totalScen += scenarios.length;
  const items = [...chk[0].md.matchAll(/^\d+\.\s+(.*)$/gm)].map((m) => m[1].trim());
  if (!items.length) fail(`${f}: empty checklist`);
  const checklistNote = chk[0].md.split("\n").filter((l) => !/^## |^\d+\.\s/.test(l)).join("\n").trim();
  const noteSecs = [head, ...secs.slice(1).filter((s) => s !== scen[0] && s !== chk[0]).map((s) => s.md)];
  const note = noteSecs.join("\n").replace(/^# .*\n/, "").trim();
  const trapSec = find(/Exam Traps/), examSec = find(/^(\d+\.\s*)?In the Exam/);
  const check = countHeadings(md), got = countHeadings(note), gs = countHeadings(scen[0].md), gc = countHeadings(chk[0].md);
  if (check.h2 + check.h3 !== got.h2 + got.h3 + gs.h2 + gs.h3 + gc.h2 + gc.h3) fail(`${f}: heading count mismatch`);
  const data = { id, domain: +nm[1], title: t[2].trim(), note, related, traps: trapSec.map((s) => s.md).join("\n\n"), inExam: examSec.map((s) => s.md).join("\n\n"),
    scenarios, checklist: items, checklistNote };
  writeFileSync(join(root, "tasks", `T${nm[1]}_${nm[2]}.js`), `window.TASKS=window.TASKS||{};window.TASKS[${JSON.stringify(id)}]=${JSON.stringify(data)};\n`);
  const m = media[id];
  manifest.push({ id, domain: +nm[1], title: data.title, slug: nm[3], file: f, related, scenarioCount: scenarios.length, checklistCount: items.length,
    counts: got, media: m });
  console.log(`${id} ${data.title.slice(0, 44).padEnd(44)} scen=${scenarios.length} chk=${items.length} h=${got.h2}/${got.h3} media: v${m.video.length} a${m.audio.length} p${m.pdf.length} i${m.image ? 1 : 0}`);
}
if (seen.size !== 30) fail("not all 30 tasks present");
writeFileSync(join(root, "tasks", "manifest.js"), `window.TASK_WEIGHTS=${JSON.stringify(WEIGHT)};window.TASK_MANIFEST=${JSON.stringify(manifest, null, 1)};\n`);
console.log(`OK: 30 tasks, ${totalScen} scenario questions, ${manifest.reduce((a, m) => a + m.media.video.length + m.media.audio.length + m.media.pdf.length + (m.media.image ? 1 : 0), 0)} media items mapped; skipped (not a task): ${skipped.join(", ") || "-"}`);
