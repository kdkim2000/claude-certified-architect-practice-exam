// Convert the Korean-annotated mock-exam Markdown files into sets/<id>.js (+ sets/manifest.js).
// Usage: node scripts/build-sets.mjs [folder-with-md-files]   (default: parent folder of the repo)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(root, "..");

const SETS = [
  // Real-exam format: 6 official scenarios in one pool; each attempt draws 4 scenarios x 15 questions.
  { id: "practice-1", file: "실전테스트1.md", title: "실전 모의고사 1", sub: "Practice Exam 1 · 60 Questions" },
  { id: "practice-2", file: "실전테스트2.md", title: "실전 모의고사 2", sub: "Practice Exam 2 · 60 Questions" },
  { id: "practice-3", file: "실전테스트3.md", title: "실전 모의고사 3", sub: "Practice Exam 3 · 4 Scenarios · 60 Questions" },
  // Per-domain note files (Exam<k>_D1..D5.md, no key table). Counts are whatever the source exam had, so the
  // 16/11/12/12/9 weighting is not enforced; the expected per-domain counts are checked instead.
  // order "domain": D1..D5, renumbered Q1..Q60. order "original": the source exam's own Q numbers (1..60).
  { id: "practice-5", prefix: "Exam1", order: "domain", expect: [17, 11, 12, 12, 8], title: "실전 모의고사 5", sub: "Practice Exam 5 · 60 Questions · D1→D5 순서" },
  { id: "practice-6", prefix: "Exam2", order: "domain", expect: [16, 10, 12, 12, 10], title: "실전 모의고사 6", sub: "Practice Exam 6 · 60 Questions · D1→D5 순서" },
  // Real-exam format: 6 official scenarios in one pool; each attempt draws 4 scenarios x 15 questions,
  // with the domain totals fixed to the official weighting (target). count: null = any size, checked below.
  { id: "scenario-pool", file: "시나리오실전풀.md", title: "실전형 시나리오 모의고사", sub: "6개 시나리오 중 4개 무작위 · 60 Questions", count: null,
    pool: { draw: 4, per: 15, target: [16, 11, 12, 12, 9] }, menu: "실전형 시나리오 (6개 중 4개 무작위 · 60)" },
];
// The default set is the 60-question bank embedded in index.html (scripts/sync-bank.mjs), shown as 실전 모의고사 4.
const DEFAULT_MENU = { id: "default", title: "실전 모의고사 4 (60)", after: "practice-3" };
const META = {
  kind: "mock", timeLimitSec: 7200, passScaled: 720,
  domains: { 1: "Agentic Architecture & Orchestration", 2: "Tool Design & MCP Integration", 3: "Claude Code Configuration & Workflows", 4: "Prompt Engineering & Structured Output", 5: "Context Management & Reliability" },
  domainWeights: { 1: 27, 2: 18, 3: 20, 4: 20, 5: 15 },
  domainShort: { 1: "Agentic", 2: "Tools & MCP", 3: "Claude Code", 4: "Prompting", 5: "Context" },
};
const clean = (s) => s.replace(/^```.*$/gm, "").replace(/\*\*/g, "").replace(/\n{3,}/g, "\n\n").trim();
const fail = (m) => { console.error("ERROR: " + m); process.exit(1); };

// Source tables become "a — b" lines; separator rows are dropped.
const flat = (t) => t.split("\n").filter((l) => !/^\|[\s:|-]+\|?$/.test(l))
  .map((l) => /^\|.*\|$/.test(l.trim()) ? l.trim().slice(1, -1).split("|").map((c) => c.trim()).join(" — ") : l).join("\n");

// Drops what only made sense in the source notes: the note-taker's remarks, "(Exam1 D1 Q36 …)" cross-references to
// source question numbers, and "(이후 문장은 화면에서 잘림)" truncation marks.
const scrub = (t) => t.split("\n").filter((l) => !/제가/.test(l)).join("\n")
  .replace(/[ \t]*\((?:Exam\d|D\d Q)[^()]*\)/g, "").replace(/, Exam\d D\d Q\d+(?=\))/g, "").replace(/[ \t]*\(이후 [^()]*\)/g, "")
  .replace(/^[ \t]*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

function parseDomainFiles(set) {
  const all = [];
  for (let d = 1; d <= 5; d++) {
    const md = readFileSync(join(src, `${set.prefix}_D${d}.md`), "utf8").replace(/\r\n/g, "\n");
    const blocks = md.split(/^### Q(?=\d+\. )/m).slice(1);
    for (const b of blocks) {
      const n = +b.match(/^(\d+)\./)[1];
      const tag = `${set.id} D${d} Q${n}`;
      const body = b.split(/^## /m)[0].replace(/^---$/gm, "").replace(/\*\*시험 함정 패턴\*\*[\s\S]*$/, "");
      const qm = body.match(/\*\*Question\.\*\* ([\s\S]*?)\n\n- /);
      if (!qm) fail(`${tag}: no question`);
      const opts = [...body.matchAll(/^- (?:\*\*)?([A-D])\. (.*?)(?:\*\*)?( ✅)?$/gm)];
      if (opts.map((o) => o[1]).join("") !== "ABCD") fail(`${tag}: options ${opts.map((o) => o[1]).join("")}`);
      const marked = opts.filter((o) => o[3]);
      if (marked.length !== 1) fail(`${tag}: ${marked.length} answers marked`);
      const rest = body.slice(body.indexOf("\n> ", opts[3].index));
      const off = rest.split(/\n\n(?!>)/)[0];
      const official = off.split("\n").map((l) => l.replace(/^> ?/, "")).join("\n").replace(/^\s*\*\*Official explanation:\*\*\s*/, "");
      const korean = flat(rest.slice(off.length)).replace(/\*\*/g, "").replace(/\n{3,}/g, "\n\n").trim();
      const expl = scrub((korean ? korean + "\n\n" : "") + "[공식 해설 원문]\n" + official.replace(/\*\*/g, "").trim());
      all.push({ d, n, q: { domain: d, stem: qm[1].replace(/\*\*/g, "").trim(), options: opts.map((o) => o[2].trim()),
        answer: "ABCD".indexOf(marked[0][1]), explanation: expl } });
    }
  }
  const doms = [1, 2, 3, 4, 5].map((d) => all.filter((x) => x.d === d).length);
  if (doms.join("/") !== set.expect.join("/")) fail(`${set.id}: domain counts ${doms.join("/")} != ${set.expect.join("/")}`);
  const nums = all.map((x) => x.n).sort((a, b) => a - b);
  if (all.length !== 60 || nums.some((n, i) => n !== i + 1)) fail(`${set.id}: source Q numbers are not exactly 1..60`);
  if (set.order === "original") all.sort((a, b) => a.n - b.n);
  const qs = all.map((x, i) => ({ ...x.q, id: `${set.id}-${i + 1}` }));
  const dist = [0, 0, 0, 0]; qs.forEach((q) => dist[q.answer]++);
  console.log(`${set.id}: ${qs.length} questions, domains ${doms.join("/")}, answers ${dist.join("/")}`);
  return qs;
}

function parse(set) {
  if (set.prefix) return parseDomainFiles(set);
  const md = readFileSync(join(src, set.file), "utf8").replace(/\r\n/g, "\n");
  const body = md.split(/^## 정답표/m);
  const keyRows = [...(body[1] || "").matchAll(/Q(\d+) \| \*\*([A-D])\*\*/g)].reduce((o, m) => (o[+m[1]] = m[2], o), {});
  // scenario sections: [{name, intro, startIdx}]
  const parts = [...body[0].matchAll(/^## Part \d+ — Scenario: (.*)$/gm)].map((m) => {
    const rest = body[0].slice(m.index + m[0].length);
    const intro = rest.split(/^> 이 시나리오의 문항|^### Q/m)[0];
    const segs = m[1].split(" — ");
    return { idx: m.index, name: segs.length > 2 ? segs[1] : segs[segs.length - 1], intro: clean(intro).replace(/^---$/gm, "").trim() };
  });
  const qs = [];
  const re = /^### Q(\d+)\. `\[(D(\d)(?: · ([\d.]+))?)\]`\n([\s\S]*?)(?=^### Q|^## |(?![\s\S]))/gm;
  for (const m of body[0].matchAll(re)) {
    const n = +m[1];
    let blk = m[5].replace(/<!--.*?-->/g, "");
    const [main, det = ""] = blk.split(/<details>/);
    const first = main.search(/^\*\*A\.\*\* /m);
    if (first < 0) fail(`${set.id} Q${n}: no options`);
    const stem = clean(main.slice(0, first));
    const options = [...main.slice(first).matchAll(/^\*\*([A-D])\.\*\* (.*)$/gm)].map((o) => o[2].trim());
    if (options.length !== 4) fail(`${set.id} Q${n}: ${options.length} options`);
    const ans = det.match(/\*\*정답:\s*([A-D])\*\*/);
    if (!ans) fail(`${set.id} Q${n}: no answer`);
    const expl = clean(det.replace(/<summary>.*?<\/summary>/, "").replace(/<\/details>[\s\S]*/, "").replace(/\*\*정답:.*\*\*/, ""))
      .replace(/^해설 \(한국어\):\s*/, "");
    const q = { domain: +m[3], stem, options, answer: "ABCD".indexOf(ans[1]), explanation: expl, id: `${set.id}-${n}` };
    if (m[4]) q.task = m[4];
    const part = parts.filter((p) => p.idx < m.index).pop();
    if (part) { q.scenario = part.name; q.scenarioIntro = part.intro; }
    if (keyRows[n] !== ans[1]) fail(`${set.id} Q${n}: answer ${ans[1]} != key table ${keyRows[n]}`);
    qs.push({ n, q });
  }
  const count = set.count === null ? qs.length : set.count || 60;
  if (qs.length !== count || qs.some((x, i) => x.n !== i + 1)) fail(`${set.id}: expected Q1..Q${count}, got ${qs.length}`);
  if (set.count !== null) {
    const doms = [1, 2, 3, 4, 5].map((d) => qs.filter((x) => x.q.domain === d).length);
    if (doms.join("/") !== "16/11/12/12/9") fail(`${set.id}: domain counts ${doms.join("/")} != 16/11/12/12/9`);
  }
  const dist = [0, 0, 0, 0]; qs.forEach((x) => dist[x.q.answer]++);
  console.log(`${set.id}: ${qs.length} questions, answers ${dist.join("/")}, key table OK`);
  return qs.map((x) => x.q);
}

mkdirSync(join(root, "sets"), { recursive: true });
for (const set of SETS) {
  const data = { id: `cca-${set.id}`, title: set.title, subtitle: set.sub, ...META,
    note: "자체 제작 CCAR-F 연습 문제입니다(비공식). 문제·보기는 영어, 해설은 한국어. 이 도구의 점수식은 공식 채점과 다릅니다.",
    questions: parse(set) };
  if (set.pool) data.pool = set.pool;
  writeFileSync(join(root, "sets", `${set.id}.js`), "window.EXAM_DATA = " + JSON.stringify(data) + ";\n");
}
const manifest = [];
for (const s of SETS) {
  manifest.push({ id: s.id, title: s.menu || s.title + " (60)" });
  if (s.id === DEFAULT_MENU.after) manifest.push({ id: DEFAULT_MENU.id, title: DEFAULT_MENU.title });
}
writeFileSync(join(root, "sets", "manifest.js"), "window.EXAM_SETS = " + JSON.stringify(manifest, null, 1) + ";\n");
