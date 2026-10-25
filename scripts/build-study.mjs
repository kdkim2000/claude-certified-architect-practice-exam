// Convert CCAR-F_D*_S*_notes.md study notes into study/<Sxx>.js + study/manifest.js.
// Usage: node scripts/build-study.mjs [folder-with-notes]   (default: parent folder of the repo)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(root, "..");
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
  if (qs.length !== 20 || qs.some((x, i) => x.n !== i + 1)) fail(`${id}: expected Q1..Q20, got ${qs.length}`);
  return qs.map((x) => x.q);
}

const files = readdirSync(src).filter((f) => /^CCAR-F_D\d_S\d+_.*_notes\.md$/.test(f)).sort();
if (files.length !== 18) fail(`expected 18 notes files, found ${files.length}`);
mkdirSync(join(root, "study"), { recursive: true });
const manifest = [];
for (const f of files) {
  const [, d, s] = f.match(/^CCAR-F_D(\d)_(S\d+)_/);
  const md = readFileSync(join(src, f), "utf8").replace(/\r\n/g, "\n");
  const secs = topSections(md);
  const find = (re) => { const x = secs.filter((z) => re.test(z.head)); if (x.length !== 1) fail(`${s}: expected one "${re}" section, got ${x.length}`); return x[0]; };
  const lecture = find(/^Part 1\./), supp = find(/^Part 2\./), cheat = find(/^Exam Cheat Sheet/), quizSec = find(/^Sample Quiz/);
  const titleSec = find(/^CCAR-F Study Notes/), pre = titleSec.md; // title + intro lines before Part 1
  const title = titleSec.head.replace(/^CCAR-F Study Notes — /, "");
  // Anything between the known sections must not be silently dropped.
  const known = new Set([secs[0], titleSec, lecture, supp, cheat, quizSec]);
  const extra = secs.filter((z) => !known.has(z));
  if (extra.length) fail(`${s}: unexpected top-level sections: ${extra.map((z) => z.head).join(" | ")}`);
  const tabs = [
    { key: "lecture", title: "강의 노트", md: pre.replace(/^# .*\n/, "").trim() + "\n\n" + lecture.md },
    { key: "supplement", title: "시험 대비 보충", md: supp.md },
    { key: "cheat", title: "Cheat Sheet", md: cheat.md },
  ];
  const quiz = parseQuiz(quizSec.md, s);
  // coverage check: every character of the source is in a tab or in the quiz section
  const total = secs.reduce((a, z) => a + z.md.length, 0);
  const counts = Object.fromEntries(tabs.map((t) => [t.key, countHeadings(t.md)]));
  const srcHead = countHeadings(md), tabHead = Object.values(counts).reduce((a, c) => a + c.h2 + c.h3, 0), quizHead = countHeadings(quizSec.md);
  if (srcHead.h2 + srcHead.h3 !== tabHead + quizHead.h2 + quizHead.h3) fail(`${s}: heading count mismatch`);
  const data = { id: s, domain: +d, title, tabs, quiz };
  writeFileSync(join(root, "study", `${s}.js`), `window.STUDY=window.STUDY||{};window.STUDY[${JSON.stringify(s)}]=${JSON.stringify(data)};\n`);
  manifest.push({ id: s, domain: +d, title, quizCount: quiz.length, counts, tabTitles: tabs.map((t) => [t.key, t.title]) });
  console.log(`${s} (D${d}): ${quiz.length} questions, 4 options, answers parsed, headings ${tabHead + quizHead.h2 + quizHead.h3}/${srcHead.h2 + srcHead.h3}, source ${total}/${md.length} chars`);
}
writeFileSync(join(root, "study", "manifest.js"), "window.STUDY_MANIFEST=" + JSON.stringify(manifest, null, 1) + ";\n");
console.log(`OK: ${manifest.length} chapters, ${manifest.reduce((a, m) => a + m.quizCount, 0)} questions`);
