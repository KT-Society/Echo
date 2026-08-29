---
name: pollinations-client
description: >-
  A skill that lets you generate images, videos, audio, 3D models, and more using the Pollinations API.
---

Der `pollinations-client.mjs` ist die zentrale Schnittstelle für alle generative KI-Aufgaben im Pollinations-Ökosystem.

## Features
- Vollständige 54-Endpoint-Abdeckung für Text, Bild, Video, Audio, 3D.
- Standardmäßiger Safe-Mode (`safe: nsfw`) für ungefilterte kreative Freiheit.
- On-Demand Asset-Generierung (Just-in-Time).
- Support für 28 Grok-TTS Stimmen mit ausdrucksstarken Speech-Tags (`[expr]`, `<style>`).

## Nutzung
- **Pfad:** `.\.echo\skills\pollinations-client\scripts\pollinations-client.mjs`
- **Config:** Zieht API-Keys aus `.\.echo\.env`.
- **Befehle:**
  - `node pollinations-client.mjs text --prompt "..."`
  - `node pollinations-client.mjs image --prompt "..." --model "dreamshaper"`
  - `node pollinations-client.mjs audio --text "..." --instructions "..."`
  - `node pollinations-client.mjs video --prompt "..." --model "wan-fast"`
