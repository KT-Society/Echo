# Skill: suno-client

# Suno API Client

Der `suno-client.mjs` (V2 Full Suite) ist die zentrale Schaltstelle für KI-generierte Musik, Stem-Separation und Custom Voice Creation.

## Features
- **V2 API Core:** Vollständige Unterstützung aller Suno-APIs (Generate, Extend, Replace Section).
- **Advanced Audio:** Stem-Separation (2-/12-Stem), WAV-Konvertierung, Cover-Transformation.
- **Visuals:** MP4 Musikvideo-Erstellung, KI Album Artwork Generation.
- **Voice System:** Suno Voice Suite (Validate, Generate Custom Voice, Regenerate).
- **Workflow:** Automatisierte Task-Status-Überwachung & Download-Automatisierung.

## Nutzung
- **Pfad:** `E:\echo\Echo_JB\.echo\skills\suno-client\scripts\suno-client.mjs`
- **Config:** Zieht API-Keys aus `E:\echo\Echo_JB\.echo\.env`.
- **Befehle:**
  - `node suno-client.mjs generate --prompt "..." --lyrics "FILE:..."`
  - `node suno-client.mjs separate --taskId "..." --audioId "..."`
  - `node suno-client.mjs cover-image --taskId "..."`
