// Convert the Korean-annotated mock-exam Markdown files into sets/<id>.js (+ sets/manifest.js).
// Usage: node scripts/build-sets.mjs [folder-with-md-files]   (default: parent folder of the repo)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(root, "..");

const SETS = [
  { id: "scenario-a", file: "시나리오모의고사A.md", title: "시나리오 모의고사 A", sub: "Scenario Mock A · 60 Questions" },
  { id: "scenario-b", file: "시나리오모의고사B.md", title: "시나리오 모의고사 B", sub: "Scenario Mock B · 60 Questions" },
  { id: "practice-1", file: "실전테스트1.md", title: "실전 모의고사 1", sub: "Practice Exam 1 · 60 Questions" },
  { id: "practice-2", file: "실전테스트2.md", title: "실전 모의고사 2", sub: "Practice Exam 2 · 60 Questions" },
];
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
  if (qs.length !== 60 || qs.some((x, i) => x.n !== i + 1)) fail(`${set.id}: expected Q1..Q60, got ${qs.length}`);
  const dist = [0, 0, 0, 0]; qs.forEach((x) => dist[x.q.answer]++);
  console.log(`${set.id}: ${qs.length} questions, answers ${dist.join("/")}, key table OK`);
  return qs.map((x) => x.q);
}

mkdirSync(join(root, "sets"), { recursive: true });
for (const set of SETS) {
  const data = { id: `cca-${set.id}`, title: set.title, subtitle: set.sub, ...META,
    note: "자체 제작 CCAR-F 연습 문제입니다(비공식). 문제·보기는 영어, 해설은 한국어. 이 도구의 점수식은 공식 채점과 다릅니다.",
    questions: parse(set) };
  writeFileSync(join(root, "sets", `${set.id}.js`), "window.EXAM_DATA = " + JSON.stringify(data) + ";\n");
}
const manifest = [{ id: "default", title: "기본 · Official-style Practice (60)" }, ...SETS.map((s) => ({ id: s.id, title: s.title + " (60)" }))];
writeFileSync(join(root, "sets", "manifest.js"), "window.EXAM_SETS = " + JSON.stringify(manifest, null, 1) + ";\n");
