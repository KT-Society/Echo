# MCP Connection Fix Plan

## Objective
Fix the MCP client connection so the portal can load live data from `https://mcp.habitatai.de/mcp`.

## Problem
- Portal loads fine, but MCP client stays offline
- `bootstrap.js` intentionally removed config fetching for security
- No MCP config file exists in the project
- Server blocks `/MCP-Referenz/` paths, so even if config existed there, browser couldn't fetch it
- `app.loadConfig()` is never called → `app.url` is null → `isEnabled()` returns false → connection skipped

## Solution Architecture
Server-side config injection: The Bun server reads the MCP config file server-side and injects it as a global JS variable into `index.html` before serving. The browser never fetches secrets via HTTP; they're embedded at page load time.

## Steps

### 1. Create MCP config file
- Path: `E:\echosrealm\MCP-Referenz\echosrealm.json`
- Content: MCP server URL and headers (no secrets if possible, or safe headers)
- Server must be able to read this file, but it should NOT be exposed to browser requests (already blocked)

### 2. Update `E:\echosrealm\portal\server.js`
- Read `MCP-Referenz/echosrealm.json` at server startup
- Inject config as `<script>window.__MCP_CONFIG = {...}</script>` into `index.html` before serving
- Keep `/MCP-Referenz/` blocked in `isBlocked()` so config is never served as static file
- Cache the config in memory (read once at startup)

### 3. Update `E:\echosrealm\portal\bootstrap.js`
- After creating `MCPClient`, read `window.__MCP_CONFIG`
- Call `app.loadConfig(window.__MCP_CONFIG)` before attempting connection
- If no config found, show clear error in UI instead of silently staying offline

### 4. Verify connection
- Restart Bun server
- Reload `http://localhost:5173/index.html`
- Check console for `[MCP] WebSocket connected.` or HTTP fallback success
- Verify dashboard cards show live data instead of offline errors

## Files to Modify
- `E:\echosrealm\MCP-Referenz\echosrealm.json` (new)
- `E:\echosrealm\portal\server.js`
- `E:\echosrealm\portal\bootstrap.js`

## Rollback
- If config injection causes issues, revert server.js and bootstrap.js changes
- Config file can be safely deleted if not needed
