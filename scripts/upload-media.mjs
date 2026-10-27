// Publish the Task-study media (AICG videos, audio, PDFs) as assets of one GitHub release, which
// tasks.html streams from when ../AICG is not reachable (e.g. on GitHub Pages).
// Reads tasks/media-assets.json (written by scripts/build-tasks.mjs), uploads only assets that are
// missing or whose size differs, so it is safe to re-run. Needs the GitHub CLI (`gh auth login`).
// Usage: node scripts/upload-media.mjs [AICG folder] [--tag=media-v1] [--dry-run] [--prune]
//   --prune   also delete release assets that are no longer in the list
import { readFileSync, mkdtempSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a === `--${k}` || a.startsWith(`--${k}=`));
const src = args.find((a) => !a.startsWith("--")) || join(root, "..", "AICG");
const tag = (flag("tag") || "").split("=")[1] || "media-v1";
const dry = !!flag("dry-run"), prune = !!flag("prune");
const fail = (m) => { console.error("ERROR: " + m); process.exit(1); };
const gh = (...a) => execFileSync("gh", a, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const { assets } = JSON.parse(readFileSync(join(root, "tasks", "media-assets.json"), "utf8"));
for (const a of assets) if (!existsSync(join(src, a.file))) fail(`missing source file: ${a.file}`);

let remote = [];
try { remote = JSON.parse(gh("release", "view", tag, "--json", "assets")).assets; }
catch {
  if (dry) console.log(`release ${tag} does not exist yet (would be created)`);
  else gh("release", "create", tag, "--title", `Task media (${tag})`, "--notes",
    "Lecture videos, audio summaries and PDF guides used by tasks.html (#/<task>/media). Asset names are ASCII aliases of the files in AICG/; see tasks/media-assets.json.");
}
const have = new Map(remote.map((r) => [r.name, r.size]));
const todo = assets.filter((a) => have.get(a.asset) !== a.size);
const stale = remote.filter((r) => !assets.some((a) => a.asset === r.name));
const gb = (n) => (n / 1e9).toFixed(2) + " GB";
console.log(`${assets.length} assets listed, ${assets.length - todo.length} already uploaded, ${todo.length} to upload (${gb(todo.reduce((s, a) => s + a.size, 0))}), ${stale.length} stale on the release`);
if (dry) { todo.forEach((a) => console.log("  upload", a.asset, "<-", a.file)); stale.forEach((r) => console.log("  stale ", r.name)); process.exit(0); }

// Upload in small batches; each file is copied to a temp folder under its ASCII asset name first.
const tmp = mkdtempSync(join(tmpdir(), "ccaf-media-"));
try {
  for (let i = 0; i < todo.length; i += 5) {
    const batch = todo.slice(i, i + 5).map((a) => { const p = join(tmp, a.asset); copyFileSync(join(src, a.file), p); return p; });
    gh("release", "upload", tag, ...batch, "--clobber");
    batch.forEach((p) => rmSync(p));
    console.log(`  uploaded ${Math.min(i + 5, todo.length)}/${todo.length}`);
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
if (prune) for (const r of stale) { gh("release", "delete-asset", tag, r.name, "--yes"); console.log("  deleted stale", r.name); }

// Verify: every listed asset is on the release with the right size.
const after = new Map(JSON.parse(gh("release", "view", tag, "--json", "assets")).assets.map((r) => [r.name, r.size]));
const bad = assets.filter((a) => after.get(a.asset) !== a.size);
if (bad.length) fail(`${bad.length} assets missing or wrong size after upload: ${bad.slice(0, 5).map((a) => a.asset).join(", ")}`);
console.log(`OK: ${assets.length} assets on release ${tag}`);
