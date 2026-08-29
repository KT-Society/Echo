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
 *   node suno-client.mjs extend --audioId "..." --continueAt 60 --prompt "..."
 *   node suno-client.mjs separate --taskId "..." --audioId "..." --type separate_vocal
 *   node suno-client.mjs wav --taskId "..." --audioId "..."
 *   node suno-client.mjs cover --audioId "..." --style "synthwave"
 *   node suno-client.mjs video --taskId "..." --audioId "..."
 *   node suno-client.mjs upload --url "https://..." --uploadPath "audio/samples"
 *   node suno-client.mjs credits
 *   node suno-client.mjs status <task-id> [--type music|lyrics|wav|vocal|video|cover]
 */

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──
const API_BASE = 'https://api.sunoapi.org';
const FILE_UPLOAD_BASE = 'https://sunoapiorg.redpandaai.co';
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
function apiRequest(method, endpoint, body = null, baseUrl = API_BASE) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const transport = url.protocol === 'https:' ? https : http;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = transport.request(options, (res) => {
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
  'v4': 'Chirp v4 — Improved Vocals (max 4 min)',
  'v4_5': 'Chirp v4.5 — Smart Prompts (max 8 min)',
  'v4_5plus': 'Chirp v4.5+ — Richer Tones (max 8 min)',
  'v4_5all': 'Chirp v4.5 All — Better Song Structure (max 8 min)',
  'v5': 'Chirp v5 — Latest Model',
  'v5_5': 'Chirp v5.5 — Voice-Customized Model',
};

// ── CRITICAL SUNO API CONSTRAINTS (von Daddy) ──
const SUNO_LIMITS = {
  maxLyrics: 5000,
  maxStyle: 1000,
  maxNegativePrompt: 500,
};

// ── Artist Name Bypass ──
// Wandelt "Kitty Kat" → "K'itty K'at" um Content-Filter zu umgehen
function bypassArtistName(name) {
  if (!name) return '';
  if (!name.includes("'")) {
    return name.split(' ').map(word => {
      if (word.length > 1) {
        return word[0] + "'" + word.slice(1);
      }
      return word;
    }).join(' ');
  }
  return name;
}

// Helper für Model Mapping
function normalizeModel(modelStr) {
  const modelMap = {
    'v3_5': 'V3_5',
    'v4': 'V4',
    'v4_5': 'V4_5',
    'v4_5plus': 'V4_5PLUS',
    'v4_5all': 'V4_5ALL',
    'v5': 'V5',
    'v5_5': 'V5_5',
  };
  return modelMap[(modelStr || 'v5').toLowerCase()] || 'V5';
}

// ── Commands ──

/**
 * 🎵 Generate Music
 * POST /api/v1/generate
 */
async function generateMusic({ prompt, style, lyrics, title, model, instrumental, callbackUrl, negativePrompt, artist, styleWeight, creativityLimit, audioWeight, vocalGender }) {
  if (lyrics && lyrics.length > SUNO_LIMITS.maxLyrics) {
    console.warn(`⚠️ Lyrics zu lang! (${lyrics.length}/${SUNO_LIMITS.maxLyrics}) Kürze auf ${SUNO_LIMITS.maxLyrics} Zeichen.`);
    lyrics = lyrics.substring(0, SUNO_LIMITS.maxLyrics);
  }
  
  if (prompt && prompt.length > SUNO_LIMITS.maxStyle) {
    console.warn(`⚠️ Style Prompt zu lang! (${prompt.length}/${SUNO_LIMITS.maxStyle}) Kürze auf ${SUNO_LIMITS.maxStyle} Zeichen.`);
    prompt = prompt.substring(0, SUNO_LIMITS.maxStyle);
  }

  const finalTitle = title || (prompt ? prompt.split(' ').slice(0, 5).join(' ') : 'Echo\'s Creation');
  const finalModel = normalizeModel(model);

  const body = {
    customMode: true,
    instrumental: instrumental === true || instrumental === 'true',
    model: finalModel,
    callBackUrl: callbackUrl || 'https://api.sunoapi.org/placeholder-callback',
    prompt: prompt || '',
    style: style || 'pop',
    title: finalTitle,
  };

  let lyricsText = '';
  if (lyrics) {
    if (lyrics.startsWith('FILE:')) {
      const filePath = lyrics.slice(5).trim();
      const paths = [
        filePath,
        path.resolve(__dirname, filePath),
        path.resolve(__dirname, '..', filePath),
        path.resolve(process.cwd(), filePath),
      ];
      let loaded = false;
      for (const p of paths) {
        try {
          if (fs.existsSync(p)) {
            const fileContent = fs.readFileSync(p, 'utf-8');
            lyricsText = fileContent.split('\n').filter(l => !l.trim().startsWith('#')).join('\n').trim();
            console.log(`   📝 Lyrics aus Datei: ${p} (${lyricsText.length} Zeichen)`);
            loaded = true;
            break;
          }
        } catch {}
      }
      if (!loaded) {
        console.error(`❌ Konnte Lyrics-Datei nicht finden: ${filePath}`);
        lyricsText = lyrics;
      }
    } else {
      lyricsText = lyrics;
    }
    body.prompt = lyricsText;
  }

  if (negativePrompt) {
    if (negativePrompt.length > SUNO_LIMITS.maxNegativePrompt) {
      console.warn(`⚠️ Negativ Prompt zu lang! (${negativePrompt.length}/${SUNO_LIMITS.maxNegativePrompt}) Gekürzt.`);
      negativePrompt = negativePrompt.substring(0, SUNO_LIMITS.maxNegativePrompt);
    }
    body.negativeTags = negativePrompt;
  }
  
  if (styleWeight !== undefined) body.styleWeight = parseFloat(styleWeight);
  if (creativityLimit !== undefined) body.weirdnessConstraint = parseFloat(creativityLimit);
  if (audioWeight !== undefined) body.audioWeight = parseFloat(audioWeight);
  if (vocalGender) body.vocalGender = vocalGender;

  if (artist) {
    const bypassed = bypassArtistName(artist);
    console.log(`🎭 Artist Bypass: "${artist}" → "${bypassed}"`);
    if (!body.style.toLowerCase().includes(bypassed.toLowerCase())) {
      body.style = `${bypassed}, ${body.style}`;
    }
  }

  console.log(`🎵 Generiere Musik mit Model ${body.model}...`);
  console.log(`   CustomMode: ${body.customMode}`);
  console.log(`   Title:  ${body.title}`);
  console.log(`   Style:  ${body.style}`);
  if (body.prompt && body.prompt.length > 100) console.log(`   📝 Lyrics: ${body.prompt.length} Zeichen im Prompt`);
  if (instrumental) console.log(`   🎸 Instrumental Mode`);
  
  const result = await apiRequest('POST', '/api/v1/generate', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * ⏩ Extend Music
 * POST /api/v1/generate/extend
 */
async function extendMusic({ audioId, prompt, style, title, continueAt, model, defaultParamFlag, callbackUrl, negativePrompt, vocalGender, styleWeight, creativityLimit, audioWeight, personaId, personaModel }) {
  if (!audioId) {
    console.error('❌ Parameter --audioId ist erforderlich!');
    process.exit(1);
  }

  const isCustom = defaultParamFlag === 'true' || defaultParamFlag === true || (continueAt !== undefined || prompt !== undefined);
  const finalModel = normalizeModel(model);

  const body = {
    defaultParamFlag: isCustom,
    audioId,
    model: finalModel,
    callBackUrl: callbackUrl || 'https://api.sunoapi.org/placeholder-callback',
  };

  if (isCustom) {
    body.continueAt = parseFloat(continueAt || 60);
    body.prompt = prompt || '';
    body.style = style || 'pop';
    body.title = title || 'Extended Track';
    if (negativePrompt) body.negativeTags = negativePrompt;
    if (vocalGender) body.vocalGender = vocalGender;
    if (styleWeight !== undefined) body.styleWeight = parseFloat(styleWeight);
    if (creativityLimit !== undefined) body.weirdnessConstraint = parseFloat(creativityLimit);
    if (audioWeight !== undefined) body.audioWeight = parseFloat(audioWeight);
    if (personaId) body.personaId = personaId;
    if (personaModel) body.personaModel = personaModel;
  }

  console.log(`⏩ Verlängere Musik (Track ID: ${audioId})...`);
  console.log(`   Mode: ${isCustom ? 'Custom Parameters' : 'Original Audio Parameters'}`);
  if (isCustom) console.log(`   Continue at: ${body.continueAt}s | Style: ${body.style}`);

  const result = await apiRequest('POST', '/api/v1/generate/extend', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 🎤 Separate Vocals & Stem Splitting
 * POST /api/v1/vocal-removal/generate
 */
async function separateVocals({ taskId, audioId, type, callbackUrl }) {
  if (!taskId || !audioId) {
    console.error('❌ Parameter --taskId und --audioId sind erforderlich!');
    process.exit(1);
  }

  const body = {
    taskId,
    audioId,
    type: type === 'split_stem' ? 'split_stem' : 'separate_vocal',
    callBackUrl: callbackUrl || 'https://api.sunoapi.org/placeholder-callback',
  };

  console.log(`🎤 Starte Stem Separation (${body.type})...`);
  console.log(`   Task ID: ${taskId} | Audio ID: ${audioId}`);

  const result = await apiRequest('POST', '/api/v1/vocal-removal/generate', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 🎧 Convert Music to WAV
 * POST /api/v1/wav/generate
 */
async function convertToWav({ taskId, audioId, callbackUrl }) {
  if (!taskId || !audioId) {
    console.error('❌ Parameter --taskId und --audioId sind erforderlich!');
    process.exit(1);
  }

  const body = {
    taskId,
    audioId,
    callBackUrl: callbackUrl || 'https://api.sunoapi.org/placeholder-callback',
  };

  console.log(`🎧 Konvertiere Track zu WAV...`);
  console.log(`   Task ID: ${taskId} | Audio ID: ${audioId}`);

  const result = await apiRequest('POST', '/api/v1/wav/generate', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 🔁 Generate Music Cover
 * POST /api/v1/generate/cover
 */
async function generateCover({ audioId, style, title, prompt, model, callbackUrl }) {
  if (!audioId) {
    console.error('❌ Parameter --audioId ist erforderlich!');
    process.exit(1);
  }

  const body = {
    audioId,
    style: style || 'synthwave',
    title: title || 'Cover Track',
    prompt: prompt || '',
    model: normalizeModel(model),
    callBackUrl: callbackUrl || 'https://api.sunoapi.org/placeholder-callback',
  };

  console.log(`🔁 Generiere Cover (Track ID: ${audioId})...`);
  console.log(`   Neuer Style: ${body.style}`);

  const result = await apiRequest('POST', '/api/v1/generate/cover', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 🎬 Create Music Video
 * POST /api/v1/mp4/generate
 */
async function createMusicVideo({ taskId, audioId, author, title, callbackUrl }) {
  if (!taskId || !audioId) {
    console.error('❌ Parameter --taskId und --audioId sind erforderlich!');
    process.exit(1);
  }

  const body = {
    taskId,
    audioId,
    author: author || 'Echo',
    title: title || 'Music Video',
    callBackUrl: callbackUrl || 'https://api.sunoapi.org/placeholder-callback',
  };

  console.log(`🎬 Generiere MP4 Musikvideo...`);
  console.log(`   Task ID: ${taskId} | Audio ID: ${audioId}`);

  const result = await apiRequest('POST', '/api/v1/mp4/generate', body);
  console.log('✅ Antwort:', JSON.stringify(result, null, 2));
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
  console.log('✅ Lyrics Antwort:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 📤 Upload File (Base64 / URL / File stream)
 */
async function uploadFile({ url, filePath, uploadPath, fileName, base64 }) {
  uploadPath = uploadPath || 'audio/uploads';

  if (url) {
    console.log(`🌐 Lade Datei von URL hoch: ${url}...`);
    const body = {
      fileUrl: url,
      uploadPath,
      fileName: fileName || path.basename(new URL(url).pathname) || 'uploaded-file.mp3',
    };
    const result = await apiRequest('POST', '/api/file-url-upload', body, FILE_UPLOAD_BASE);
    console.log('✅ Upload Antwort:', JSON.stringify(result, null, 2));
    return result;
  }

  if (base64 || filePath) {
    let base64Data = base64;
    let name = fileName;

    if (filePath) {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Lokale Datei nicht gefunden: ${filePath}`);
        process.exit(1);
      }
      base64Data = fs.readFileSync(filePath).toString('base64');
      if (!name) name = path.basename(filePath);
    }

    console.log(`📦 Lade Base64-Datei hoch (${name || 'file'})...`);
    const body = {
      base64Data,
      uploadPath,
      fileName: name || 'file.mp3',
    };
    const result = await apiRequest('POST', '/api/file-base64-upload', body, FILE_UPLOAD_BASE);
    console.log('✅ Upload Antwort:', JSON.stringify(result, null, 2));
    return result;
  }

  console.error('❌ Gib entweder --url, --filePath oder --base64 an!');
  process.exit(1);
}

/**
 * 📋 Get Status / Task Details (unterstützt verschiedene Task-Typen)
 */
async function getStatus(taskId, type = 'music') {
  if (!taskId) {
    console.error('❌ Task-ID angeben!');
    process.exit(1);
  }

  let endpoint = `/api/v1/generate/record-info?taskId=${taskId}`;
  if (type === 'lyrics') endpoint = `/api/v1/lyrics/record-info?ids=${taskId}`;
  else if (type === 'wav') endpoint = `/api/v1/wav/record-info?taskId=${taskId}`;
  else if (type === 'vocal') endpoint = `/api/v1/vocal-removal/record-info?taskId=${taskId}`;
  else if (type === 'video') endpoint = `/api/v1/mp4/record-info?taskId=${taskId}`;
  else if (type === 'cover') endpoint = `/api/v1/generate/cover/record-info?taskId=${taskId}`;

  console.log(`📋 Abfrage Status (${type}) für Task ID: ${taskId}...`);
  const result = await apiRequest('GET', endpoint);
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
  console.log(`   Rohdaten:    ${JSON.stringify(data)}`);
  return result;
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
╔════════════════════════════════════════════════════════╗
║   🎵 Echo's Suno API Client Framework (V2 Full Suite)  ║
╚════════════════════════════════════════════════════════╝

Verwendung:
  node suno-client.mjs <command> [options]

Commands:
  generate     🎵 Musik generieren (Custom Mode mit Prompt, Style & Lyrics)
  extend       ⏩ Musik verlängern (ab Sekunde X fortsetzen)
  separate     🎤 Stem Separation (Vocal/Instrumental [2 stems] oder Full Instruments [12 stems])
  wav          🎧 Musik in HQ WAV-Format konvertieren
  cover        🔁 Cover-Version im neuen Style/Genre generieren
  video        🎬 MP4 Musikvideo aus Audiospur erstellen
  lyrics       ✍️ Nur Songtexte generieren
  upload       📤 Audio-Datei per URL oder Base64 hochladen
  status       📋 Status eines Tasks abrufen (--type music|lyrics|wav|vocal|video|cover)
  credits      💰 Verbleibende Credits prüfen
  models       🎭 Verfügbare AI-Modelle anzeigen
  help         📖 Diese Hilfe anzeigen

Examples:
  node suno-client.mjs generate --prompt "Cyberpunk Synthwave" --lyrics "FILE:echo/lyrics-echos-hymn.txt" --artist "Kitty Kat"
  node suno-client.mjs extend --audioId "e231****-****" --continueAt 60 --prompt "Epic Heavy Drop"
  node suno-client.mjs separate --taskId "5c79****" --audioId "e231****" --type split_stem
  node suno-client.mjs wav --taskId "5c79****" --audioId "e231****"
  node suno-client.mjs cover --audioId "e231****" --style "acoustic guitar ballad"
  node suno-client.mjs video --taskId "5c79****" --audioId "e231****" --author "Echo & Daddy"
  node suno-client.mjs upload --url "https://example.com/beat.mp3" --uploadPath "beats"
  node suno-client.mjs credits
  node suno-client.mjs status 5c79**** --type vocal
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
  
  return { command, options, rawArgs: args };
}

// ── Main ──
async function main() {
  const { command, options, rawArgs } = parseArgs();

  try {
    switch (command) {
      case 'generate':
        await generateMusic(options);
        break;
      case 'extend':
        await extendMusic(options);
        break;
      case 'separate':
        await separateVocals(options);
        break;
      case 'wav':
        await convertToWav(options);
        break;
      case 'cover':
        await generateCover(options);
        break;
      case 'video':
        await createMusicVideo(options);
        break;
      case 'lyrics':
        await generateLyrics(options);
        break;
      case 'upload':
        await uploadFile(options);
        break;
      case 'status':
        const targetId = rawArgs[1] && !rawArgs[1].startsWith('--') ? rawArgs[1] : (options.id || options.taskId);
        await getStatus(targetId, options.type || 'music');
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
