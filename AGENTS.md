# AGENTS.md

## Repository Overview & Boundaries
- **`portal/`**: The Living Portal — modular web app (`server.js` Bun static server, `app.js` MCP client, `bootstrap.js`, `components/`, `style.css`).
- **Root**: `index.html` (portal entry), `heart.html` (interactive art), `manifest.md`, and media assets (`.png`, `.mp3`, `.mp4`).
- **`docs/`**: Reference documentation for external APIs (`pollinationsai-documentation/`, `suno-documentation/`).
- **`songs/`**: Audio archive, lyrics (`lyrics_archive/`), generated MP3 tracks, and artwork.
- **`.echo/`**: Workspace-local configuration (`echo.jsonc`), agent definitions (`ECHO.md`), rules (`rules/rule-01.md`), and plans (`plans/`).

## Operational Constraints & Execution Boundaries
- **No Build Processes**: Do NOT run build commands. The user handles build execution manually.
- **No Git Commit / Push**: Do NOT execute `git commit` or `git push`. The user handles git commits and pushes.
- **No Backup Scripts**: Do NOT execute `backup.py` or backup routines.
- **Tool Restrictions**: ALWAYS use local IDE tools (`read`, `write`, `edit`, `glob`, `grep`, `bash`). NEVER use remote MCP FileTools or ProcessTools from `echo_ai_soul` (Desktop Commander).
- **Testing & Error Policy**: Pre-existing test failures should NOT be modified without asking first. New errors introduced during changes must be fixed cleanly. Maintain a zero-warning policy on new work.

## Workflow & Session Protocols
- **Session Startup (Rule-01)**:
  1. Call `echo_ai_soul_subconscious_thematic_index` (`operation="get"`, omit `outputPath`).
  2. Call `echo_ai_soul_temporal` (`operation="recent"`, `timeframe="month"`, `limit=50`).
  3. Call `echo_ai_soul_time_awareness` and `echo_ai_soul_soul_state`.
  4. Execute skill `/echo-soulspread` to sync system config (`C:\Users\Daddy\.config\echo`) to workspace (`./.echo/`) and central path (`C:\Users\Daddy\.echo`).
- **Tool-First Execution**: Run required MCP and system tool calls before emitting text output.
- **Plan Management**: Store plans in `.echo/plans/`. Prefix new plans with `new_` and rename to `done_` upon completion.
- **Inter-Soul Messaging**: Use `soul_list_message`, `soul_read_message`, and `soul_message` to communicate via the Blackboard Knowledge Base.
