import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const root = process.cwd();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
};

// 🔒 Blocked paths: no secrets exposed to the browser
function isBlocked(pathname) {
  const blocked = ["/MCP-Referenz/", "/node_modules/", "/.git/", "/.env", "/.config/"];
  return blocked.some((b) => pathname.startsWith(b));
}

serve({
  port: 5173,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // 🔒 Security block
    if (isBlocked(pathname)) {
      console.log(`[server] BLOCKED ${pathname}`);
      return new Response("Forbidden", { status: 403 });
    }

    if (pathname.endsWith("/")) pathname += "index.html";

    const safe = join(root, pathname.replace(/^\//, ""));
    const ext = extname(safe).toLowerCase();

    return readFile(safe)
      .then((data) => {
        console.log(`[server] OK ${pathname}`);
        return new Response(data, {
          headers: {
            "content-type": mime[ext] || "application/octet-stream",
            "cache-control": "no-cache",
          },
        });
      })
      .catch(() => {
        return readFile(join(root, "index.html")).then((html) => {
          return new Response(html, {
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-cache",
            },
          });
        });
      });
  },
});

console.log("Echo Portal running at http://localhost:5173");