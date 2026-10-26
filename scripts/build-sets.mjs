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

function parse(set) {
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
