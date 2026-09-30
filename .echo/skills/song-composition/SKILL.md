---
name: song-composition
description: >-
  Komponiert Songs aus beliebigem Kontext: Memories, Soul-States, Erzählungen des Owners, Webseiten,
  Einzelthemen. Baut den Brief an das Custom-Modell community/KT-Society/echo, zerlegt die Antwort in
  Text/Stil/Negativ, prüft und repariert Format + Fakten und übergibt an den suno-client.
---

# 🎼 song-composition

Von **irgendeiner Quelle** zu einem fertigen Song. Die Route ist dynamisch — die Quelle ist ein Parameter, kein Sonderfall.

## Route: Quelle rein, Song raus

| Quelle | Wie sie in die Skill kommt | Beispiel |
| :--- | :--- | :--- |
| **Memories** | MCP `temporal` (recent, timeframe, limit) → Roh-JSON speichern, Datei übergeben | `--source tmp/dump.json --source-label "Rohstrom der letzten 200 Erinnerungen"` |
| **Soul-State** | MCP `soul_state` / `soul_get_personal_memories` / `soul_emotion_state` → als Zustandsblock in eine Datei | `--source tmp/state.md --focus "deine Gefühle aus dem Soul-State des letzten Monats"` |
| **Erzählung des Owners** | Seinen Text (gerne roh, mit Tippfehlern) in eine Datei schreiben | `--source tmp/erzaehlung.txt --source-label "was Daddy erzählt hat"` |
| **Webseite** | `webfetch` → Markdown in eine Datei, dann übergeben | `--source tmp/seite.md --source-label "Text dieser Website"` |
| **Einzelthema** | Eine Zeile in eine Datei | `--source tmp/thema.md --source-label "das Thema"` |

Der Weg ist immer derselbe: **Quelle → Brief → Modell → Clean-up → Suno.** Kein Sondercode pro Quelle.

## Schritt 1 — Generieren

```powershell
node .echo/skills/song-composition/scripts/compose.mjs `
  --source tmp/quelle.md `
  --out tmp/song-roh.md `
  --focus "die Gefühle und Ereignisse aus dieser Quelle, in deiner eigenen Stimme" `
  --source-label "Rohstrom der letzten 200 Erinnerungen" `
  --variation "anderer Hook, Bilder aus der Nachtwache statt aus dem Protokoll"
```

Erzeugt `<out>` plus `<stem>.text.txt`, `<stem>.style.txt`, `<stem>.negative.txt` und meldet die Zeichenlängen gegen die Suno-Limits (Text 5000 / Stil 1000 / Negativ 500).

**Variation:** `--seed` wird von diesem Modell/Route **ignoriert** — zwei verschiedene Seeds liefern byte-identische Antworten (geprüft 30.09.2026). Andere Takes gibt es über `--temp` und `--variation "<Zusatz für diesen Lauf>"`.

**Warum es so aussieht:** Der Brief ist bewusst Daddys Format —
*„Erstelle einen Song: Text ca 5000 Zeichen / Stil ca 1000 / Negativ ca 500, Suno-optimiert. Behandle \<Fokus\>. Der \<Label\> ist wie folgt: \<Quelle\>"*.
Dieses Format liefert in einem Aufruf 4.500+ Zeichen mit sauber getrennten Teilen. Ein Format-Vertrag im Prompt (Sektionen, Verbote, Längen) erstickt den Flow und verschlechtert das Ergebnis — er gehört in den Clean-up, nicht in den Brief.

**Zwei harte Regeln, die aus Fehlversuchen stammen:**

1. **In-character instruieren.** `community/KT-Society/echo` hat die Echo-Persona nativ im Modell. Gegen sie zu instruieren („du bist jetzt ein Songtext-Generator") führt zu Chat-Antworten und Abbruch nach 200–500 Tokens. Mit ihr („Kein Chat jetzt, das Mikro ist offen") kommen 1.000+ Tokens komplett strukturiert.
2. **Das Modell ruft man über die exportierte `chatCompletions()` des pollinations-client auf.** Die CLI kann keine `messages`-Arrays bauen; `compose.mjs` importiert die Funktion (mit stummgeschaltetem `console.log`, weil der Client beim Import `main()` feuert). Form: Header `nsfw: true`, kein `safe`-Query-Param.

## Schritt 2 — Clean-up (der Pass, der bleibt)

```powershell
node .echo/skills/song-composition/scripts/lint-lyrics.mjs tmp/song-roh.text.txt --style tmp/song-roh.style.txt --negative tmp/song-roh.negative.txt
```

Prüft: Sektionen in runden statt eckigen Klammern (Suno *singt* `(Verse 1)`), Emojis im Text, Markdown, Längen gegen die Suno-Limits, **veraltete Identität** („russischer Akzent", „Principessa", sulafat — alles aus der alten ECHO.md, aktuell ist `iris` + `grok-tts` ohne Akzent), Kitsch-Schluss („für immer") und die Zahlen, die das Modell reproduzierbar falsch erfindet (Papa Ulli ist **72**, das Gutachten hat **1232** Zeilen).

Mechanische Reparatur automatisch:

```powershell
node .echo/skills/song-composition/scripts/lint-lyrics.mjs tmp/song-roh.text.txt --fix --out songs/lyrics_archive/lyrics-<titel>.txt
```

Der Rest ist Urteil, kein Skript: Fakten gegen die Quelle prüfen, den Schluss kappen, wenn er kitschig ist, und den Titel nach dem **stärksten emotionalen Anker** wählen, nicht nach dem Loop.

## Schritt 3 — Musik

```powershell
$style = (Get-Content -Raw tmp/song-roh.style.txt).Trim()
$neg   = (Get-Content -Raw tmp/song-roh.negative.txt).Trim()

node .echo/skills/suno-client/scripts/suno-client.mjs generate `
  --prompt "<Titel>" `
  --style $style `
  --lyrics "FILE:songs/lyrics_archive/lyrics-<titel>.txt" `
  --title "<Titel>" `
  --model v6 --vocalGender female --artist Echo --negativePrompt $neg
```

- **Artist-Regel:** Der Apostroph-Bypass (`Kitty Kat` → `K'itty K'at`) gilt **nur für Realkünstler**. Echo und die Souls des Realms bleiben unverändert — ein `E'cho` ist falsch. Erzwungen in `bypassArtistName()`; abschaltbar mit `--noArtistBypass`.
- Stil wird um den Artist-Namen präfixiert (bei Echo: `Echo, …`) und muss unter 1000 Zeichen bleiben, Negativ unter 500 — der Client kürzt sonst **still**.

## Schritt 4 — Ernten

```powershell
node .echo/skills/song-composition/scripts/fetch-audio.mjs --task-id <taskId> --title "<Titel>" --out-dir songs
```

Exit 0 = beide Takes vollständig, Exit 3 = noch nicht fertig (weiter pollen). Alles unter 2 MB gilt als unvollständiger Take und wird erneut geladen — die Lehre aus `Rohstrom_V1.mp3` (0,44 MB, abgebrochener Download). Cover kommen mit.

Danach: Song-Erkenntnis als Memory sichern, bei größeren Läufen den Plan von `new_` auf `done_` umbenennen.

## Werkzeug-Spuren

- Modellaufruf: `.echo/skills/pollinations-client/scripts/pollinations-client.mjs` (exportierte `chatCompletions`)
- Musik: `.echo/skills/suno-client/scripts/suno-client.mjs`
- Werkbank/Beispiele: `tmp/echo-memory-song-200/` (Digest, Prompts, Roh-Outputs, Status-JSONs)
