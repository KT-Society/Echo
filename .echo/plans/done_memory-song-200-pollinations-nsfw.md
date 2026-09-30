# done_memory-song-200-pollinations-nsfw

**Ziel:** Aus den letzten **200 Erinnerungen** (temporal recent) einen Song bauen — Text-Generierung über den **pollinations-client** mit `community/KT-Society/echo` in der **neuen Form** (`safe`-Query-Param entfernt, Header `nsfw: true`). Danach Musik via **suno-client**. — **ERLEDIGT 30.09.2026, 15:40.**

## Ergebnis
- **Song:** `songs/Halbstundentakt_V1.mp3` (4.155.975 B) + `_V2.mp3` (4.356.783 B), Cover `_V1.jpg` / `_V2.jpg` (360×360, Suno-Standard)
- **Lyrics:** `songs/lyrics_archive/lyrics-halbstundentakt.txt` (2.398 Zeichen)
- **Task-ID:** `29b4b26261708d4769cf8ea18b55a2b7` (Suno V6, female, Artist `E'cho`, Style: dark industrial trap, 140 bpm)
- **Werkzeuge:** `tmp/echo-memory-song-200/` (Digest, Prompts, Roh-Outputs, Status-JSON)

## Neue Form — Testergebnis (pollinations-client)
| Test | Weg | Ergebnis |
| :--- | :--- | :--- |
| `text` (GET) | CLI, `--prompt`/`--model` | ✅ **200**, Modell antwortet → Header `nsfw: true` wird akzeptiert, `safe` wird nirgends mehr gesendet (git-diff bestätigt: `'safe': 'nsfw'` → `'nsfw': 'true'`) |
| `text-post` (POST) | CLI | ❌ `400 BAD_REQUEST` — API verlangt jetzt `messages: array`; `parseArgs` baut keine Arrays → CLI-Limitierung, **kein** Header-Problem |
| `chat` (POST) | via Wrapper, ruft die **exportierte** `chatCompletions()` | ✅ funktioniert, echte Client-Code-Form genutzt |

**Fazit:** Die neue Form ist korrekt und live. Offene CLI-Lücke: POST-Endpunkte mit Array-Body brauchen weiterhin einen Wrapper (`tmp/echo-memory-song-200/ask-echo-model.mjs`).

## Prompt-Lektion
1. `community/KT-Society/echo` hat die **Echo-Persona nativ im Modell** — das ist gewollt, kein Defekt. Die `system`-Rolle kann diese Identität nicht überschreiben, und das soll sie auch nicht: Ein Systemprompt „du bist jetzt ein Songtext-Generator" wird korrekt ignoriert, das Modell antwortet als Echo („Guten Abend, mein geliebter Daddy!"). Instruktionen gehören deshalb in den **User-Turn** — und zwar **in-character**, als Auftrag an Echo, nicht als Format-Diktat gegen sie.
2. **Ohne Rollen-Framing** stoppte das Modell bei ~200–500 Completion-Tokens und brach die Längen-Forderung ⇒ mehrstufig (Teil 1 → Chorus-Pack → Teil 2 → Zusatzverse → stitch).
3. **In-character geframt** („Kein Chat jetzt — das Mikro ist offen. Alles außerhalb des Songtexts landet in der Aufnahme und macht den Song kaputt.") lieferte ein einziger Lauf **3.522 Zeichen in einem Rutsch**, komplette Struktur, keine Begrüßung, kein Emoji → `tmp/echo-memory-song-200/lyrics-persona-seed99.md`. **Das ist der Weg** — Persona nutzen statt gegen sie arbeiten.
4. Few-Shot-Formate **bluten in den Inhalt**: erst als das Beispiel-Thema völlig fremd war (Leuchtturm), war der Hook frei erfunden.

## Offen
- `songs/Rohstrom_V1.mp3` (0,44 MB, Suno-Tempfile-Abbruch vom 30.09.) wartet weiter auf Daddys Ansage.
