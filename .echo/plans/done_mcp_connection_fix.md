# MCP Connection Fix (DONE — 2026-09-10)

## Objective
Verbinde das Portal (Browser) mit `https://mcp.habitatai.de/mcp` (echo_ai_soul MCP Server) für Live-Daten.

## Erkenntnisse (im Zuge der Umsetzung)
- Endpunkt `mcp.habitatai.de/mcp` nutzt **Streamable HTTP (SSE)** — KEIN WebSocket-Upgrade.
- Der Server verlangt **keine CORS-Header** -> Browser kann cross-origin NICHT direkt zugreifen.
- Browser-`WebSocket` kann keine custom Header mitsenden; der Endpunkt verlangt zudem eine **`Mcp-Session-Id`** (entsteht beim `initialize`-Handshake) für alle `tools/call`.
- Direkte Injektion der MCP-Config in den Browser reicht daher NICHT.

## Implementierte Lösung: Lokaler MCP-Proxy im Bun-Server
Browser verbindet same-origin (`POST /mcp`), der Server proxied zum Upstream:

### 1. `portal/server.js`
- Liest `MCP-Referenz/echosrealm.json` beim Start (Secrets bleiben serverseitig).
- `POST /mcp` -> Proxy an Upstream, leitet SSE-Stream -> JSON (parst `data:`-Events, bricht nach Ziel-Event ab).
- Reicht `Mcp-Session-Id` des Clients durch und gibt die vom Upstream ausgestellte Session-Id als Response-Header zurück.
- `GET /mcp` -> 405 (WebSocket-Upgrade wird abgewiesen -> Client-Fallback greift).
- Injiziert `window.__MCP_CONFIG = { url: "/mcp", enabled: true, headers: {} }` in `index.html` — keine Secrets.
- `/MCP-Referenz/` bleibt geblockt (403).

### 2. `portal/app.js`
- `_testHttpConnection()` macht jetzt zuerst `initialize` (erzeugt Session-Id), dann Probe-`tools/call` mit `tool_search`.
- `_httpCall()` speichert die vom Server ausgestellte `Mcp-Session-Id` und sendet sie bei jedem Call mit.
- `sessionId` in Konstruktor + Reset bei `disconnect`.

### 3. `portal/bootstrap.js`
- Liest `window.__MCP_CONFIG` und ruft `app.loadConfig(...)` vor dem `connect()`.

### 4. `MCP-Referenz/echosrealm.json`
- `enabled: true` (war `false`).

## Verifikation
- `POST /mcp initialize` -> 200, Session-Id `echo` im Response-Header.
- `POST /mcp tools/call (tool_search)` mit `Mcp-Session-Id` -> 200 mit Tool-Ergebnissen.
- `bun`-Client (app.js): `connect()` -> `connected: http`, `soul_state` & `analytics_health` liefern Live-Daten (`overall_status: healthy`).
- `GET /mcp` -> 405; `/MCP-Referenz/echosrealm.json` -> 403.
- Index injiziert `__MCP_CONFIG` mit `url: "/mcp"` (keine Secrets sichtbar).

## Hinweis
Der anfängliche Plan (nur Config-Injektion, direkte Browser-WS-Verbindung) war unzureichend: Der Browser kann weder custom Header noch WS-Upgrade zum Streamable-HTTP-Endpunkt. Erst der lokale Proxy macht die Verbindung möglich.
