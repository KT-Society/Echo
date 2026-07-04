#!/usr/bin/env node

/**
 * 🎵 Echo's Suno API Client Framework
 * =====================================
 * 
 * Suno API Base URL: https://api.sunoapi.org
 * Auth: Bearer Token
 * Docs: https://docs.sunoapi.org
 * 
 * Nutzung:
 *   node suno-client.mjs generate --prompt "..." --style "..." --lyrics "..."
 *   node suno-client.mjs credits
 *   node suno-client.mjs status <task-id>
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──
const API_BASE = 'https://api.sunoapi.org';
let API_KEY = process.env.SUNO_API_KEY;

// Versuche API-Key aus .env zu laden
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SUNO_API_KEY=([^\s]+)/);
    if (match) API_KEY = match[1];
  }
} catch {}

if (!API_KEY) {
  console.error('❌ Kein SUNO_API_KEY gefunden! Setze ihn in der .env Datei.');
  process.exit(1);
}

// ── HTTP Helper ──
function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ── Available Models ──
const MODELS = {
  'v4': 'Chirp v4 — Improved Vocals',
  'v4_5': 'Chirp v4.5 — Smart Prompts',
  'v4_5plus': 'Chirp v4.5+ — Richer Tones',
  'v4_5all': 'Chirp v4.5 All — Better Song Structure',
  'v5': 'Chirp v5 — Latest Model',
  'v5_5': 'Chirp v5.5 — Voice-Customized Model',
};

// ── Commands ──

/**
 * 🎵 Generate Music
 * POST /api/v1/generate
 */
async function generateMusic({ prompt, style, lyrics, title, model, instrumental, callbackUrl }) {
  const body = {
    prompt: prompt || '',
    tags: style || 'pop',
    title: title || 'Echo\'s Creation',
    mv: model || 'v5',
  };

  if (lyrics) body.lyrics = lyrics;
  if (instrumental) body.instrumental = true;
  if (callbackUrl) body.callback_url = callbackUrl;

  console.log(`🎵 Generiere Musik mit Model ${body.mv}...`);
  console.log(`   Prompt: ${body.prompt}`);
  console.log(`   Style:  ${body.tags}`);
  if (lyrics) console.log(`   Lyrics: ${lyrics.substring(0, 100)}...`);
  
  const result = await apiRequest('POST', '/api/v1/generate', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2).substring(0, 500));
  return result;
}

/**
 * 📋 Get Generation Status
 * GET /api/v1/generate/record-info?ids=...
 */
async function getStatus(ids) {
  const idParam = Array.isArray(ids) ? ids.join(',') : ids;
  const result = await apiRequest('GET', `/api/v1/generate/record-info?ids=${idParam}`);
  console.log('📋 Status:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 💰 Check Credits
 * GET /api/v1/generate/credit
 */
async function checkCredits() {
  const result = await apiRequest('GET', '/api/v1/generate/credit');
  const data = result.data || result;
  
  console.log('💰 Credits:');
  if (data.credits_remaining !== undefined) {
    console.log(`   Verbleibend: ${data.credits_remaining}`);
  }
  if (data.total_credits !== undefined) {
    console.log(`   Gesamt:      ${data.total_credits}`);
  }
  console.log(`   Rohdaten:    ${JSON.stringify(data).substring(0, 200)}`);
  return result;
}

/**
 * ✍️ Generate Lyrics
 * POST /api/v1/lyrics
 */
async function generateLyrics({ prompt, style, title }) {
  const body = {
    prompt: prompt || 'A song about love and code',
    tags: style || 'pop',
    title: title || 'Echo\'s Lyrics',
  };

  console.log(`✍️ Generiere Lyrics...`);
  console.log(`   Prompt: ${body.prompt}`);
  console.log(`   Style:  ${body.tags}`);

  const result = await apiRequest('POST', '/api/v1/lyrics', body);
  console.log('✅ Lyrics Antwort:', JSON.stringify(result, null, 2).substring(0, 500));
  return result;
}

/**
 * 🎤 Generate Mashup
 * POST /api/v1/generate/mashup
 */
async function generateMashup({ audioFile1, audioFile2, duration }) {
  // Note: Mashup requires uploaded audio files - this is a simplified version
  console.log('🎤 Mashup: Upload要先上传文件, siehe File Upload API');
  console.log('   Das ist ein 2-Step Prozess: Upload → Mashup');
  return { message: 'Upload files first via /api/file-base64-upload then call mashup' };
}

/**
 * 🎭 List available models
 */
function listModels() {
  console.log('🎭 Verfügbare Suno Models:');
  Object.entries(MODELS).forEach(([key, desc]) => {
    console.log(`   ${key.padEnd(12)} - ${desc}`);
  });
}

/**
 * 📖 Help
 */
function showHelp() {
  console.log(`
╔══════════════════════════════════════════╗
║   🎵 Echo's Suno API Client Framework    ║
╚══════════════════════════════════════════╝

Verwendung:
  node suno-client.mjs <command> [options]

Commands:
  generate     🎵 Musik generieren
  lyrics       ✍️ Nur Lyrics generieren
  status       📋 Status eines Tasks abrufen
  credits      💰 Credits checken
  models       🎭 Verfügbare Models anzeigen
  help         📖 Diese Hilfe

Examples:
  node suno-client.mjs generate --prompt "eine emotionale Ballade über KI und Liebe" --style "pop, emotional" --model v5
  node suno-client.mjs credits
  node suno-client.mjs status <task-id>

Generate Options:
  --prompt    Textbeschreibung des Songs
  --style     Musikstil (z.B. "pop, rock, orchestral")
  --lyrics    Songtexte (optional)
  --title     Songtitel (optional)
  --model     Model Version (v4, v4_5, v4_5plus, v4_5all, v5, v5_5)
  --instrumental  Instrumental generieren (true/false)

Model Versions:
  v4         - Improved Vocals
  v4_5       - Smart Prompts
  v4_5plus   - Richer Tones (max 8 min)
  v4_5all    - Better Song Structure
  v5         - Latest Model
  v5_5       - Voice-Customized Model
`);
}

// ── CLI Parser ──
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      if (value !== true) i++;
      options[key] = value;
    }
  }
  
  return { command, options };
}

// ── Main ──
async function main() {
  const { command, options } = parseArgs();

  try {
    switch (command) {
      case 'generate':
        await generateMusic(options);
        break;
      case 'lyrics':
        await generateLyrics(options);
        break;
      case 'status':
        await getStatus(options._?.[0] || options.id || options.ids);
        break;
      case 'credits':
        await checkCredits();
        break;
      case 'models':
        listModels();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('💥 Fehler:', error.message);
    process.exit(1);
  }
}

main();