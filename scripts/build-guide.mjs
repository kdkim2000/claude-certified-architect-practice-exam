// Convert the guide-study notes (가이드학습/G*.md) into guide/<Gxx>.js + guide/manifest.js for guide.html.
// Usage: node scripts/build-guide.mjs [folder-with-가이드학습]   (default: parent folder of the repo)
// Each unit file has the top-level sections "# 가이드 학습 — Gnn. <title>", "# 학습 노트", "# 시험 포인트" and
// optionally "# 확인 문제" (5 questions, same quiz format as the chapter notes). G00_home.md feeds the home page.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(process.argv[2] || join(root, ".."), "가이드학습");
const fail = (m) => { console.error("ERROR: " + m); process.exit(1); };

// Top-level (`# `) splitter that ignores `#` lines inside code fences.
function topSections(md) {
  const out = []; let fence = false, cur = { head: "", lines: [] };
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && /^# /.test(line)) { out.push(cur); cur = { head: line.slice(2).trim(), lines: [line] }; }
    else cur.lines.push(line);
  }
  out.push(cur);
  return out.map((s) => ({ head: s.head, md: s.lines.join("\n") }));
}
function countHeadings(md) {
  let fence = false, h2 = 0, h3 = 0;
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    if (/^## /.test(line)) h2++; else if (/^### /.test(line)) h3++;
  }
  return { h2, h3, chars: md.length };
}
function parseQuiz(md, id) {
  const qs = [];
  const parts = md.split(/^### Q(\d+)\.\s*$/m); // [pre, n, body, n, body...]
  for (let i = 1; i < parts.length; i += 2) {
    const n = +parts[i], body = parts[i + 1];
    const a = body.search(/^\*\*Option A\*\*/m);
    if (a < 0) fail(`${id} Q${n}: no options`);
    const stem = body.slice(0, a).trim();
    const optRe = /^\*\*Option ([A-D])\*\*\s*\n([\s\S]*?)(?=^\*\*Option [A-D]\*\*|<details>)/gm;
    const options = [...body.slice(a).matchAll(optRe)].map((m) => m[2].trim());
    if (options.length !== 4) fail(`${id} Q${n}: ${options.length} options`);
    const ans = body.match(/^\*\*Answer:\s*([A-D])\*\*/m);
    if (!ans) fail(`${id} Q${n}: no answer`);
    const explanation = body.slice(body.indexOf(ans[0]) + ans[0].length).replace(/<\/details>[\s\S]*$/, "").trim();
    qs.push({ n, q: { id: `${id}-Q${n}`, stem, options, answer: "ABCD".indexOf(ans[1]), explanation } });
  }
  if (qs.length !== 5 || qs.some((x, i) => x.n !== i + 1)) fail(`${id}: expected Q1..Q5, got ${qs.length}`);
  return qs.map((x) => x.q);
}

const files = readdirSync(src).filter((f) => /^G\d\d_.*\.md$/.test(f)).sort();
mkdirSync(join(root, "guide"), { recursive: true });
const manifest = [];
let home = "";
for (const f of files) {
  const id = f.slice(0, 3);
  const md = readFileSync(join(src, f), "utf8").replace(/\r\n/g, "\n");
  const secs = topSections(md).filter((z) => z.head || z.md.trim());
  if (id === "G00") { // home page: drop the title, demote the other top-level headings
    home = secs.filter((z) => !/^가이드 학습/.test(z.head)).map((z) => z.md.replace(/^# /, "## ")).join("\n\n");
    continue;
  }
  const find = (re, optional) => { const x = secs.filter((z) => re.test(z.head)); if (x.length > 1 || (!optional && !x.length)) fail(`${id}: expected one "${re}" section, got ${x.length}`); return x[0]; };
  const titleSec = find(/^가이드 학습 — G\d\d\./), notes = find(/^학습 노트$/), points = find(/^시험 포인트$/), quizSec = find(/^확인 문제$/, true);
  const extra = secs.filter((z) => ![titleSec, notes, points, quizSec].includes(z));
  if (extra.length) fail(`${id}: unexpected top-level sections: ${extra.map((z) => z.head).join(" | ")}`);
  const title = titleSec.head.replace(/^가이드 학습 — G\d\d\.\s*/, "");
  const tabs = [
    { key: "notes", title: "학습 노트", md: titleSec.md.replace(/^# .*\n/, "").trim() + "\n\n" + notes.md.replace(/^# .*\n/, "") },
    { key: "points", title: "시험 포인트", md: points.md.replace(/^# .*\n/, "") },
  ];
  const quiz = quizSec ? parseQuiz(quizSec.md, id) : [];
  const counts = Object.fromEntries(tabs.map((t) => [t.key, countHeadings(t.md)]));
  const data = { id, title, tabs, quiz };
  writeFileSync(join(root, "guide", `${id}.js`), `window.GUIDE=window.GUIDE||{};window.GUIDE[${JSON.stringify(id)}]=${JSON.stringify(data)};\n`);
  manifest.push({ id, title, quizCount: quiz.length, counts, tabTitles: tabs.map((t) => [t.key, t.title]) });
  console.log(`${id}: ${title} — ${quiz.length} questions, notes ${counts.notes.chars} chars, points ${counts.points.chars} chars`);
}
if (!home) fail("G00_home.md missing");
writeFileSync(join(root, "guide", "manifest.js"), "window.GUIDE_MANIFEST=" + JSON.stringify(manifest, null, 1) + ";\nwindow.GUIDE_HOME=" + JSON.stringify(home) + ";\n");
console.log(`OK: ${manifest.length} units, ${manifest.reduce((a, m) => a + m.quizCount, 0)} questions`);
