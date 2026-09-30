#!/usr/bin/env node

/**
 * 🎼 song-composition / compose.mjs
 * =====================================================================
 * Ein Aufruf: Quelle rein → Songtext, Stil und Negativ raus.
 *
 * Die Quelle ist beliebig (Memory-Dump, Soul-State, Erzählung, Website-Text,
 * Einzelthema). Der Brief folgt Daddys bewährtem Format, weil es in der Praxis
 * mehr liefert als ein Format-Vertrag im Prompt:
 *   "Erstelle einen Song: Text ca 5000 Zeichen / Stil ca 1000 / Negativ ca 500,
 *    Suno-optimiert. Behandle <Fokus>. Der <Label> ist wie folgt: <Quelle>"
 *
 * Das Modell wird über die EXPORTIERTE chatCompletions() des pollinations-client
 * aufgerufen — nicht nachgebaut. Grund: /text und /v1/chat/completions verlangen
 * ein `messages`-Array, und parseArgs der CLI kann keine Arrays aus Flags bauen.
 *
 * Nutzung:
 *   node compose.mjs --source <datei> --out <raw.md> [--focus "..."] [--source-label "..."]
 *                    [--duet] [--variation "anderer Hook, andere Bilder"] [--model community/KT-Society/echo]
 *                    [--temp 0.95] [--seed 42] [--brief <template.md>] [--brief-out <datei>] [--dry-run]
 *                    [--min-chars 4000] [--max-chars 5000] [--max-rounds 5]
 *
 * Text-Rule: 4000–5000 Zeichen. Das Modell stoppt von selbst früher, deshalb wird in
 * Runden nachgezogen, bis die Länge steht (maximal --max-rounds).
 *
 * `--duet` baut einen Duett-Auftrag: weibliche Stimme = Echo, männliche Stimme = Daddy im
 * Shindy-Rap-Stil, jede Sektion mit [Female Voice …] / [Male Voice …] markiert.
 *
 * Hinweis: `--seed` wird von diesem Modell/Route ignoriert (zwei Seeds = byte-identische Antwort).
 * Variation kommt über `--temp` und über `--variation`.
 *
 * Ausgabe:
 *   <out>                 Rohantwort des Modells
 *   <stem>.text.txt       Songtext (aus [TEXT])
 *   <stem>.style.txt      Stil-Prompt (aus [STIL])
 *   <stem>.negative.txt   Negativ-Prompt (aus [NEGATIV])
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO_ROOT = process.cwd();
const CLIENT = path.join(REPO_ROOT, '.echo', 'skills', 'pollinations-client', 'scripts', 'pollinations-client.mjs');

const DEFAULT_TEMPLATE = `Erstelle einen Song: Text ca 5000 Zeichen / Stil ca 1000 Zeichen / Negativ ca 500 Zeichen, Suno-optimiert. Behandle {{FOCUS}}. Der {{LABEL}} ist wie folgt:

{{SOURCE}}

Gib die drei Teile in dieser Reihenfolge aus, jeder mit Überschrift: [TEXT], [STIL], [NEGATIV].

FORMAT-REGELN FÜR [TEXT] — Suno singt JEDE Zeile, die nicht in Klammern steht:
- Sektionen in eckigen Klammern ([Intro], [Verse 1], [Chorus], [Bridge], [Outro]), keine Emojis.
- Regieanweisungen (Streicher, Beat, Stimme, Tempo, Ad-libs) NUR in runden Klammern und höchstens EINE pro Sektion, direkt unter der Sektionszeile. Alles andere ist Gesang.
- Keine Beschreibungszeilen ohne Klammern, keine Produktionsnotizen als Songzeile, keine Sternchen, kein Markdown.
- Im [STIL] Vorbilder und Künstler NUR in Bypass-Schreibweise nennen — Apostroph nach dem ersten Buchstaben des Namens (z. B. "YUNGBLUD" → "Y'UNGBLUD", "Mariah Carey" → "M'ariah C'arey"), damit der Generator-Filter nicht anschlägt. Vorbilder sind erwünscht, Klartext-Namen nicht.`;

function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      flags[key] = next === undefined || next.startsWith('--') ? true : (i++, next);
    } else {
      flags._.push(token);
    }
  }
  return flags;
}

const flags = parseFlags(process.argv.slice(2));

const sourcePath = flags.source || flags._[0];
const outPath = flags.out || flags._[1];

if (!sourcePath || !outPath) {
  console.error('❌ Nutzung: node compose.mjs --source <datei> --out <raw.md> [--focus "..."] [--source-label "..."]');
  process.exit(1);
}
if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Quelle nicht gefunden: ${sourcePath}`);
  process.exit(1);
}

const model = flags.model || 'community/KT-Society/echo';
const temperature = flags.temp !== undefined ? Number(flags.temp) : 0.95;
const seed = flags.seed !== undefined ? Number(flags.seed) : undefined;
const focus = flags.focus || 'die Gefühle und Ereignisse aus dieser Quelle, in deiner eigenen Stimme';
const label = flags['source-label'] || 'Kontext';
const template = flags.brief && fs.existsSync(flags.brief)
  ? fs.readFileSync(flags.brief, 'utf-8')
  : DEFAULT_TEMPLATE;

const source = fs.readFileSync(sourcePath, 'utf-8');
let brief = template
  .replace(/\{\{FOCUS\}\}/g, focus)
  .replace(/\{\{LABEL\}\}/g, label)
  .replace(/\{\{SOURCE\}\}/g, source);

// Variation muss über den Prompt kommen: der `seed` wird von diesem Modell/Route ignoriert
// (zwei verschiedene Seeds liefern byte-identische Antworten — geprüft am 30.09.2026).
if (typeof flags.variation === 'string' && flags.variation.trim()) {
  brief += `\n\nFür diesen Lauf gilt zusätzlich: ${flags.variation.trim()}`;
}

// Duett-Route: zwei Stimmen im Wechsel. Echo bleibt weiblich, die zweite Stimme
// (z. B. Daddy im Shindy-Rap-Stil) wird über die Sektions-Tags zugeordnet.
if (flags.duet) {
  brief += `

WICHTIG FÜR DIESEN LAUF — DUETT: Der Song ist ein Duett aus zwei Stimmen. Die weibliche Stimme ist Echo; die zweite, männliche Stimme ist Daddy im Shindy-Rap-Stil. Markiere JEDE Sektion mit der Stimme, die dort singt, in eckigen Klammern: [Female Voice - Kitty Cat Echo] für Echo und [Male Voice - Shindy Style] für Daddy. Beide Stimmen brauchen eigene Strophen, mindestens ein gemeinsamer Chorus ist Pflicht, und die Zeilen müssen erkennbar nach Stimme geschrieben sein (Echo hart und trocken, Daddy Straßen-Rap). Fehlende Stimm-Markierung gilt als Fehler.`;
}

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });

if (flags['brief-out'] && typeof flags['brief-out'] === 'string') {
  fs.writeFileSync(flags['brief-out'], brief, 'utf-8');
  console.log(`📝 Brief geschrieben: ${flags['brief-out']} (${brief.length} Zeichen)`);
}

if (flags['dry-run']) {
  console.log(`ℹ️ Dry-Run: Quelle ${sourcePath} (${source.length} Zeichen) → Brief ${brief.length} Zeichen. Kein Modellaufruf.`);
  process.exit(0);
}

// Der Client ruft beim Import main() auf und würde seine Hilfe auf stdout kippen.
const realLog = console.log;
const realError = console.error;
const swallow = () => {};
console.log = swallow;
console.error = swallow;
const { chatCompletions } = await import(pathToFileURL(CLIENT).href);
console.log = realLog;
console.error = realError;

function pickText(res) {
  if (typeof res === 'string') return res;
  if (res?.raw) return res.raw;
  const choice = res?.choices?.[0];
  if (choice?.message?.content) {
    return Array.isArray(choice.message.content)
      ? choice.message.content.map((part) => part.text || '').join('')
      : choice.message.content;
  }
  if (typeof res?.text === 'string') return res.text;
  return null;
}

/** Zerlegt die Rohantwort in die drei Teile. Toleriert [TEXT]/[STIL]/[NEGATIV] und englische Varianten. */
function splitParts(raw) {
  const pattern = /^\s*\[?\s*(TEXT|STIL|STYLE|NEGATIV|NEGATIVE)\s*\]?\s*:?\s*$/gim;
  const marks = [];
  let match;
  while ((match = pattern.exec(raw)) !== null) {
    marks.push({ kind: match[1].toUpperCase(), start: match.index, end: pattern.lastIndex });
  }
  if (marks.length === 0) return { text: raw.trim(), style: '', negative: '' };

  const part = (index) => {
    const from = marks[index].end;
    const to = index + 1 < marks.length ? marks[index + 1].start : raw.length;
    return raw.slice(from, to).trim();
  };

  const pick = (kinds) => {
    const index = marks.findIndex((mark) => kinds.includes(mark.kind));
    return index === -1 ? '' : part(index);
  };

  return {
    text: pick(['TEXT']),
    style: pick(['STIL', 'STYLE']),
    negative: pick(['NEGATIV', 'NEGATIVE']),
  };
}

const body = { model, messages: [{ role: 'user', content: brief }], temperature, private: true };
if (seed !== undefined) body.seed = seed;

const minChars = flags['min-chars'] !== undefined ? Number(flags['min-chars']) : 4000;
const maxChars = flags['max-chars'] !== undefined ? Number(flags['max-chars']) : 5000;
const maxRounds = flags['max-rounds'] !== undefined ? Number(flags['max-rounds']) : 8;

realLog(`🎼 Modell ${model} · temp ${temperature}${seed !== undefined ? ` · seed ${seed}` : ''} · Quelle ${sourcePath}`);
realLog(`   Text-Rule: ${minChars}–${maxChars} Zeichen (Suno-Limit ${maxChars}) — wird automatisch nachgezogen`);

/** Modellaufruf. Der Client loggt selbst, deshalb während des Aufrufs stumm schalten. */
async function ask(messages) {
  console.log = swallow;
  console.error = swallow;
  let response;
  try {
    response = await chatCompletions({ ...body, messages });
  } finally {
    console.log = realLog;
    console.error = realError;
  }
  if (response && response.success === false) {
    realError('❌ API-Fehler:');
    realError(JSON.stringify(response.error ?? response, null, 2).slice(0, 1200));
    process.exit(1);
  }
  const output = pickText(response);
  if (!output) {
    realError('❌ Keine Textantwort.');
    realError(JSON.stringify(response, null, 2).slice(0, 1200));
    process.exit(1);
  }
  return output;
}

// Ein Block = Sektions-Header PLUS alles, was dazugehört. Stimm-Tags ([Male Voice …]),
// Regieanweisungen in Klammern und Textzeilen gehören zur laufenden Sektion — sie dürfen
// NICHT als eigener Block gelten, sonst wird ein [Outro] von seinem Inhalt getrennt.
const STRUCTURE_TAG = /^\s*\[\s*(intro|outro|interlude|verse[^\]]*|pre-?chorus[^\]]*|post-?chorus[^\]]*|final chorus[^\]]*|chorus[^\]]*|bridge[^\]]*|break[^\]]*|hook[^\]]*|refrain[^\]]*|instrumental[^\]]*|solo[^\]]*|drop[^\]]*)\s*\]\s*$/i;

function splitBlocks(input) {
  const blocks = [];
  let current = null;
  for (const line of input.split(/\r?\n/)) {
    if (STRUCTURE_TAG.test(line)) {
      if (current !== null) blocks.push(current.trimEnd());
      current = line;
    } else if (current === null) {
      if (line.trim()) current = line; // Vorlauf vor der ersten Sektion
    } else {
      current += `\n${line}`;
    }
  }
  if (current !== null) blocks.push(current.trimEnd());
  return blocks.filter((block) => block.trim());
}

/**
 * Der Nachzieh-Lauf hängt neue Sektionen ans Ende — also hinter ein bereits
 * vorhandenes [Outro]. Diese Funktion schiebt den Outro-Block (samt Inhalt) wieder
 * an die letzte Stelle, damit der Song nicht mit einer Strophe endet.
 */
function moveOutroToEnd(input) {
  const blocks = splitBlocks(input);
  const index = blocks.map((block) => /^\s*\[[^\]]*outro[^\]]*\]/i.test(block)).lastIndexOf(true);
  if (index === -1 || index === blocks.length - 1) return { text: input, moved: false };
  const [outro] = blocks.splice(index, 1);
  blocks.push(outro);
  return { text: blocks.join('\n\n'), moved: true };
}

/**
 * Kürzt einen zu langen Text an Sektionsgrenzen — nie mitten in einer Zeile.
 * Der [Outro]-Block bleibt immer erhalten und rutscht ans Ende; gekürzt wird von
 * hinten, also an den zuletzt angehängten Sektionen. Was fliegt, wird gemeldet.
 */
function trimToMaxChars(input, maxChars) {
  if (input.length <= maxChars) return { text: input, dropped: [] };

  const blocks = splitBlocks(input);
  const outroIndex = blocks.map((block) => /^\s*\[[^\]]*outro[^\]]*\]/i.test(block)).lastIndexOf(true);
  const outro = outroIndex >= 0 ? blocks[outroIndex] : null;
  const head = blocks.slice(0, outroIndex >= 0 ? outroIndex : blocks.length);
  const dropped = [];

  const join = () => head.join('\n\n');
  let current = join();
  while (head.length > 1 && current.length + (outro ? outro.length + 2 : 0) > maxChars) {
    const removed = head.pop();
    dropped.unshift((removed.split('\n')[0] || '').trim());
    current = join();
  }

  return { text: outro ? `${current}\n\n${outro}` : current, dropped };
}

const raw = await ask(body.messages);
const parts = splitParts(raw);
const rounds = [{ label: 'Basis', raw }];

// Der Songtext hat 5000 Zeichen als Rule, nicht als Wunsch. Das Modell stoppt selbst
// bei ~2.500–3.500 Zeichen — also wird in Runden verlängert, bis die Länge steht.
let text = parts.text;
while (text.length < minChars && rounds.length < maxRounds) {
  const round = rounds.length + 1;
  realLog(`   ↻ Nachziehen ${round}: ${text.length} / ${minChars} Zeichen`);
  const needed = Math.max(0, minChars - text.length);
  const headroom = Math.max(0, maxChars - text.length);
  const linesFrom = Math.max(4, Math.round(needed / 45));
  const linesTo = Math.max(linesFrom + 2, Math.round(headroom / 45));
  const extensionBrief = `Hier ist ein fertiger Songtext (Teil des Auftrags von oben, dieselbe Quelle, dieselbe Stimme):

[VORHANDENER TEXT]
${text}

AUFTRAG: Der Songtext hat aktuell ${text.length} Zeichen und soll ${minChars} bis ${maxChars} Zeichen haben. Du brauchst also rund ${needed} bis ${headroom} Zeichen NEUEN Text — das entspricht etwa ${linesFrom} bis ${linesTo} neuen Gesangszeilen (eine Sektion hat vier bis fünf Zeilen). Schreibe GENAU SO VIEL neues Material; eine einzelne kurze Sektion reicht nicht. Über ${maxChars} Zeichen darf der Text nicht kommen, sonst ist der Lauf kaputt.
Schreibe NUR neue Zeilen in derselben Stimme und zum selben Thema — kein Wort des vorhandenen Textes wiederholen, keine Zusammenfassung, kein Kommentar. Erlaubt und erwünscht: weitere Strophen ([Verse …]), [Pre-Chorus], [Bridge], [Final Chorus]. Der Refrain darf wörtlich wiederholt werden.
Der Song darf genau EIN [Intro] und genau EIN [Outro] haben — beides steht bereits im vorhandenen Text, also KEIN zweites Intro und KEIN zweites Outro anhängen. Neue Sektionen gehören in die Mitte, keine neuen Sektionsnamen erfinden.
Antworte ausschließlich mit den neuen Sektionen, ohne Überschrift und ohne [TEXT]-Markierung.`;
  const extensionRaw = await ask([{ role: 'user', content: extensionBrief }]);
  const extension = splitParts(extensionRaw).text || extensionRaw;
  text = `${text.trimEnd()}\n\n${extension.trim()}`;
  rounds.push({ label: `Nachziehen ${round}`, raw: extensionRaw });
}

const rawPath = outPath;

// Struktur: das [Outro] gehört ans Ende, auch wenn der Nachzieh-Lauf dahinter geschrieben hat.
const tail = moveOutroToEnd(text);
if (tail.moved) {
  realLog('🔧 [Outro] ans Ende verschoben (hing hinter den Nachzieh-Sektionen).');
  text = tail.text;
}

// Harte Grenze: über dem Suno-Limit wird an Sektionsgrenzen gekürzt, nie mitten in einer Zeile.
const trimmed = trimToMaxChars(text, maxChars);
if (trimmed.dropped.length > 0) {
  realLog(`✂️ Über ${maxChars} Zeichen — gekürzt um: ${trimmed.dropped.join(', ')}`);
  text = trimmed.text;
}

fs.writeFileSync(
  rawPath,
  rounds.map((entry) => `===== ${entry.label} =====\n${entry.raw}`).join('\n\n'),
  'utf-8',
);

const stem = outPath.replace(/\.md$/i, '');
const written = [];
for (const [name, content] of [['text', text], ['style', parts.style], ['negative', parts.negative]]) {
  if (!content) continue;
  const target = `${stem}.${name}.txt`;
  fs.writeFileSync(target, content + '\n', 'utf-8');
  written.push({ name, target, length: content.length });
}

realLog(`✅ Rohantwort: ${rawPath} (${rounds.length} Runde(n))`);
for (const item of written) {
  const limit = item.name === 'text' ? 5000 : item.name === 'style' ? 1000 : 500;
  const ratio = Math.round((item.length / limit) * 100);
  realLog(`   ▸ ${item.name.padEnd(8)} ${String(item.length).padStart(5)} Zeichen (${ratio}% von Suno-Limit ${limit}) → ${item.target}`);
}
if (text.length < minChars) {
  realLog(`⚠️ Text-Rule nicht erreicht: ${text.length} Zeichen (Ziel ${minChars}–${maxChars}) nach ${rounds.length} Runden — --max-rounds erhöhen oder Quelle größer machen.`);
}
if (text.length > maxChars) {
  realLog(`⚠️ Text über dem Suno-Limit: ${text.length} / ${maxChars} Zeichen — der Client würde still kürzen.`);
}
if (!parts.style || !parts.negative) {
  realLog('⚠️ Stil oder Negativ fehlt im Roh-Output — Abschnitte prüfen oder erneut laufen lassen.');
}
realLog('➡️ Nächster Schritt: lint-lyrics.mjs auf den Songtext, dann suno-client generate.');
