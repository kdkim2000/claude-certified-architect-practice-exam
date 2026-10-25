// Local static server with Range support (video/audio seeking).
// Serves the PARENT folder of this repo so the site can reach ../AICG media.
// Usage: node scripts/serve.mjs [port]      -> http://localhost:8080/
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { join, extname, normalize, dirname, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(repo, "..");
const site = "/" + basename(repo) + "/";
const port = +process.argv[2] || 8080;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".mp4": "video/mp4", ".m4a": "audio/mp4", ".pdf": "application/pdf", ".md": "text/plain; charset=utf-8" };

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") { res.writeHead(302, { Location: site }); return res.end(); }
  const file = normalize(join(base, url.endsWith("/") ? url + "index.html" : url));
  if (!file.startsWith(base + sep)) { res.writeHead(403); return res.end("Forbidden"); }
  let st; try { st = statSync(file); if (st.isDirectory()) throw 0; } catch { res.writeHead(404); return res.end("Not found"); }
  const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (range) {
    const start = range[1] ? +range[1] : st.size - +range[2], end = range[1] && range[2] ? +range[2] : st.size - 1;
    if (start > end || start >= st.size) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
    return req.method === "HEAD" ? res.end() : createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": st.size });
  req.method === "HEAD" ? res.end() : createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ${base}\n→ http://localhost:${port}${site}`));
