// Build sets/ko/<set>.js from the Korean translation + detailed-explanation sources.
// Usage: node scripts/build-ko.mjs [folder-with-sources]   (default: <parent of the repo>/실전해설보강)
// Source: <folder>/<set>.json = [{ id, h, stemKo, optionsKo[4], detail }], one file per mock exam
//   (practice-1, practice-2, practice-3, default = 실전 4, practice-5, practice-6, practice-7).
// `h` is the first 8 hex of sha1(stem) of the question it was written for; the build fails if the question
// text has changed since, so a stale translation never ships next to a different question.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(root, "..", "실전해설보강");
const KEYS = ["practice-1", "practice-2", "practice-3", "default", "practice-5", "practice-6", "practice-7"];
const fail = (m) => { console.error("ERROR: " + m); process.exit(1); };
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);

function questionsOf(key) {
  const file = key === "default" ? join(root, "index.html") : join(root, "sets", key + ".js");
  const line = readFileSync(file, "utf8").split("\n").find((l) => l.startsWith("window.EXAM_DATA = "));
  if (!line) fail(`${key}: no EXAM_DATA in ${file}`);
  const w = {}; new Function("window", line)(w);
  return w.EXAM_DATA.questions;
}

mkdirSync(join(root, "sets", "ko"), { recursive: true });
for (const key of KEYS) {
  const f = join(src, key + ".json");
  if (!existsSync(f)) fail(`missing ${f}`);
  const items = JSON.parse(readFileSync(f, "utf8"));
  const qs = questionsOf(key);
  const byId = new Map(items.map((x) => [x.id, x]));
  if (byId.size !== items.length) fail(`${key}: duplicate ids`);
  const out = {};
  for (const q of qs) {
    const x = byId.get(q.id);
    if (!x) fail(`${key}: no entry for ${q.id}`);
    if (x.h !== hash(q.stem)) fail(`${key} ${q.id}: question text changed since the translation was written`);
    if (typeof x.stemKo !== "string" || x.stemKo.length < 10) fail(`${q.id}: stemKo`);
    if (!Array.isArray(x.optionsKo) || x.optionsKo.length !== 4 || x.optionsKo.some((o) => typeof o !== "string" || !o.trim())) fail(`${q.id}: optionsKo`);
    if (typeof x.detail !== "string" || !/📌/.test(x.detail) || !/✅/.test(x.detail)) fail(`${q.id}: detail sections`);
    out[q.id] = { s: x.stemKo.trim(), o: x.optionsKo.map((o) => o.trim()), d: x.detail.trim() };
  }
  if (items.length !== qs.length) fail(`${key}: ${items.length} entries for ${qs.length} questions`);
  writeFileSync(join(root, "sets", "ko", key + ".js"), "window.EXAM_KO=Object.assign(window.EXAM_KO||{}," + JSON.stringify(out) + ");\n");
  console.log(`${key}: ${qs.length} questions with Korean translation + detail`);
}
