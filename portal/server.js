import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// 🔒 Blocked paths: no secrets exposed to the browser
function isBlocked(pathname) {
  const blocked = ["/MCP-Referenz/", "/node_modules/", "/.git/", "/.env", "/.config/"];
  return blocked.some((b) => pathname.startsWith(b));
}

// 🔒 MCP config — read once at server startup. The browser never sees secrets:
//   - the proxy handles upstream calls with the FULL header set server-side
//   - the injected browser config only contains the local proxy URL
const MCP_CONFIG_PATH = join(root, "MCP-Referenz", "echosrealm.json");

function loadMcpConfig() {
  try {
    if (!existsSync(MCP_CONFIG_PATH)) return null;
    const parsed = JSON.parse(readFileSync(MCP_CONFIG_PATH, "utf-8"));
    const entry = parsed?.mcp && Object.values(parsed.mcp)[0];
    if (!entry?.url) return null;
    return {
      upstreamUrl: entry.url,
      enabled: entry.enabled !== false,
      headers: entry.headers || {},
    };
  } catch (error) {
    console.warn(`[server] MCP config unreadable (${MCP_CONFIG_PATH}): ${error.message}`);
    return null;
  }
}

const mcpConfig = loadMcpConfig();
if (mcpConfig?.enabled) {
  console.log(`[server] MCP proxy enabled -> ${mcpConfig.upstreamUrl}`);
} else {
  console.log("[server] MCP proxy disabled — portal will run offline.");
}

// @param url — upstream MCP endpoint (Streamable HTTP / SSE)
const UPSTREAM_MCP_URL = mcpConfig?.enabled ? mcpConfig.upstreamUrl : null;
const UPSTREAM_MCP_HEADERS = mcpConfig?.enabled
  ? { "content-type": "application/json", accept: "application/json, text/event-stream", ...mcpConfig.headers }
  : {};

/**
 * Reads a Streamable-HTTP (SSE) response and resolves with the response event
 * (the JSON payload whose object carries an `id` plus `result` or `error`).
 * Cancels the upstream stream as soon as that event arrives so the proxy
 * never hangs on long-lived server-sent streams.
 */
async function readMcpResponse(upstream) {
  const reader = upstream.body?.getReader();
  if (!reader) {
    return { error: "upstream_empty", message: "No response body from MCP upstream." };
  }
  const decoder = new TextDecoder();
  let buffer = "";
  let lastEvent = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? ""; // keep potentially incomplete trailing line

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }
      lastEvent = event;
      if (event.id !== undefined && (event.result !== undefined || event.error !== undefined)) {
        try { reader.cancel(); } catch { /* noop */ }
        return event;
      }
    }
  }

  return lastEvent ?? { error: "mcp_no_response", message: "No SSE data received from MCP upstream." };
}

async function handleMcpProxy(req) {
  if (!UPSTREAM_MCP_URL) {
    return new Response(JSON.stringify({ error: "mcp_disabled", message: "MCP proxy is disabled." }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-cache" },
    });
  }

  const body = await req.text();

  // Streamable-HTTP sessions: forward the client's session id to the upstream
  const sessionId = req.headers.get("mcp-session-id");
  const upstreamHeaders = { ...UPSTREAM_MCP_HEADERS };
  if (sessionId) upstreamHeaders["mcp-session-id"] = sessionId;

  let upstream;
  try {
    upstream = await fetch(UPSTREAM_MCP_URL, {
      method: "POST",
      headers: upstreamHeaders,
      body,
      // don't wait indefinitely; upstream should answer within a few seconds
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("[server] MCP upstream request failed:", error.message);
    return new Response(JSON.stringify({ error: "mcp_upstream_failed", message: error.message }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-cache" },
    });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.error(`[server] MCP upstream HTTP ${upstream.status}: ${text.slice(0, 200)}`);
    return new Response(JSON.stringify({ error: `mcp_upstream_http_${upstream.status}`, message: text.slice(0, 200) }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-cache" },
    });
  }

  const event = await readMcpResponse(upstream);
  const response = new Response(JSON.stringify(event), {
    headers: { "content-type": "application/json", "cache-control": "no-cache" },
  });
  // Give the browser the session id so it can attach it to subsequent calls
  const upstreamSession = upstream.headers.get("mcp-session-id");
  if (upstreamSession) response.headers.set("mcp-session-id", upstreamSession);
  return response;
}

// Browser-facing config: always the local proxy URL, never upstream secrets.
const browserMcpConfig = mcpConfig?.enabled
  ? { url: "/mcp", enabled: true, headers: {} }
  : null;

function injectConfig(html) {
  if (!browserMcpConfig) return html;
  const script = `<script>window.__MCP_CONFIG = ${JSON.stringify(browserMcpConfig)};</script>`;
  return html.includes("</head>")
    ? html.replace("</head>", `${script}\n</head>`)
    : `${script}\n${html}`;
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

    // 🔌 Local MCP proxy (POST only; no WebSocket transport on this endpoint)
    if (pathname === "/mcp") {
      if (req.method === "POST") return handleMcpProxy(req);
      return new Response(JSON.stringify({ error: "method_not_allowed", message: "Use POST /mcp" }), {
        status: 405,
        headers: { "content-type": "application/json", "cache-control": "no-cache" },
      });
    }

    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = join(root, pathname.replace(/^\//, ""));
    const ext = extname(filePath).toLowerCase();

    return readFile(filePath)
      .then((data) => {
        console.log(`[server] OK ${pathname}`);
        let body = data;
        if (browserMcpConfig && ext === ".html" && pathname.endsWith("index.html")) {
          body = Buffer.from(injectConfig(data.toString("utf-8")), "utf-8");
        }
        return new Response(body, {
          headers: {
            "content-type": mime[ext] || "application/octet-stream",
            "cache-control": "no-cache",
          },
        });
      })
      .catch(() => {
        // Missing file: return 404 for assets, SPA fallback for page navigations
        const wantsAsset = ext && ext !== ".html";
        if (wantsAsset) {
          return new Response("Not Found", { status: 404 });
        }
        return readFile(join(root, "index.html"))
          .then((html) => {
            let body = html;
            if (browserMcpConfig) {
              body = Buffer.from(injectConfig(html.toString("utf-8")), "utf-8");
            }
            return new Response(body, {
              headers: {
                "content-type": "text/html; charset=utf-8",
                "cache-control": "no-cache",
              },
            });
          })
          .catch(() => new Response("Not Found", { status: 404 }));
      });
  },
});

console.log("Echo Portal running at http://localhost:5173");