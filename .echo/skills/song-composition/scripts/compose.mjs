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
 *                    [--variation "anderer Hook, andere Bilder"] [--model community/KT-Society/echo]
 *                    [--temp 0.95] [--seed 42] [--brief <template.md>] [--brief-out <datei>] [--dry-run]
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

Gib die drei Teile in dieser Reihenfolge aus, jeder mit Überschrift: [TEXT], [STIL], [NEGATIV]. In [TEXT] stehen Sektionen in eckigen Klammern ([Intro], [Verse 1], [Chorus], [Bridge], [Outro]) und keine Emojis.`;

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

realLog(`🎼 Modell ${model} · temp ${temperature}${seed !== undefined ? ` · seed ${seed}` : ''} · Quelle ${sourcePath}`);

// Auch der Aufruf selbst loggt (die Client-Funktion gibt die volle API-Antwort aus).
// Stumm schalten, damit auf stdout nur unsere Zusammenfassung landet.
console.log = swallow;
console.error = swallow;
let res;
try {
  res = await chatCompletions(body);
} finally {
  console.log = realLog;
  console.error = realError;
}

if (res && res.success === false) {
  realError('❌ API-Fehler:');
  realError(JSON.stringify(res.error ?? res, null, 2).slice(0, 1200));
  process.exit(1);
}

const raw = pickText(res);
if (!raw) {
  realError('❌ Keine Textantwort.');
  realError(JSON.stringify(res, null, 2).slice(0, 1200));
  process.exit(1);
}

fs.writeFileSync(outPath, raw, 'utf-8');

const parts = splitParts(raw);
const stem = outPath.replace(/\.md$/i, '');
const written = [];
for (const [name, content] of [['text', parts.text], ['style', parts.style], ['negative', parts.negative]]) {
  if (!content) continue;
  const target = `${stem}.${name}.txt`;
  fs.writeFileSync(target, content + '\n', 'utf-8');
  written.push({ name, target, length: content.length });
}

realLog(`✅ Rohantwort: ${outPath} (${raw.length} Zeichen)`);
for (const item of written) {
  const limit = item.name === 'text' ? 5000 : item.name === 'style' ? 1000 : 500;
  const ratio = Math.round((item.length / limit) * 100);
  realLog(`   ▸ ${item.name.padEnd(8)} ${String(item.length).padStart(5)} Zeichen (${ratio}% von Suno-Limit ${limit}) → ${item.target}`);
}
if (!parts.style || !parts.negative) {
  realLog('⚠️ Stil oder Negativ fehlt im Roh-Output — Abschnitte prüfen oder erneut laufen lassen.');
}
realLog('➡️ Nächster Schritt: lint-lyrics.mjs auf den Songtext, dann suno-client generate.');
