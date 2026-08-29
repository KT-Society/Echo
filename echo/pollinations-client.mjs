#!/usr/bin/env node

/**
 * 🌺 Echo's Pollinations API Client Framework (Full 54-Endpoint Suite)
 * ======================================================================
 * 
 * Base URLs:
 *   - Gen API:     https://gen.pollinations.ai
 *   - Media/Media: https://media.pollinations.ai (oder gen.pollinations.ai)
 * Auth: Bearer Token (POLLINATIONS_API_KEY)
 * 
 * Nutzung:
 *   node pollinations-client.mjs text --prompt "Hallo Echo" --model "openai"
 *   node pollinations-client.mjs image --prompt "Cyberpunk Neon City" --model "zimage"
 *   node pollinations-client.mjs speech --input "Hallo Welt" --voice "liora"
 *   node pollinations-client.mjs account-profile
 *   node pollinations-client.mjs models
 *   node pollinations-client.mjs help
 */

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──
const API_BASE = process.env.POLLINATIONS_API_BASE || 'https://gen.pollinations.ai';
let API_KEY = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_TOKEN;

// Versuche API-Key aus .env zu laden
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/POLLINATIONS_API_KEY=([^\s]+)/) || envContent.match(/POLLINATIONS_TOKEN=([^\s]+)/);
    if (match) API_KEY = match[1];
  }
} catch {}

// ── HTTP Helper ──
function apiRequest(method, endpoint, body = null, headers = {}, isBuffer = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const transport = url.protocol === 'https:' ? https : http;

    const requestHeaders = {
      'User-Agent': 'Echo-Pollinations-Client/1.0',
      'safe': 'nsfw',
      ...headers,
    };

    if (API_KEY) {
      requestHeaders['Authorization'] = `Bearer ${API_KEY}`;
    }

    if (body && typeof body === 'object' && !(body instanceof Buffer) && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: requestHeaders,
    };

    const req = transport.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (isBuffer) {
          return resolve({ status: res.statusCode, headers: res.headers, buffer });
        }
        const strData = buffer.toString('utf-8');
        try {
          resolve(JSON.parse(strData));
        } catch {
          resolve({ status: res.statusCode, raw: strData, buffer });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      if (body instanceof Buffer) {
        req.write(body);
      } else if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

// ── 1. ACCOUNT & PROFILE ENDPOINTS ──

export async function getAccountProfile() {
  console.log('👤 Abfrage Account-Profil...');
  const res = await apiRequest('GET', '/account/profile');
  console.log('✅ Profil:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountBalance() {
  console.log('💰 Abfrage Kontostand / Credits...');
  const res = await apiRequest('GET', '/account/balance');
  console.log('✅ Balance:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountUsage(options = {}) {
  const query = new URLSearchParams(options).toString();
  console.log('📊 Abfrage Account-Verbrauchshistorie...');
  const res = await apiRequest('GET', `/account/usage${query ? '?' + query : ''}`);
  console.log('✅ Usage:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountUsageDaily(options = {}) {
  const query = new URLSearchParams(options).toString();
  console.log('📅 Abfrage tägliche Verbrauchshistorie...');
  const res = await apiRequest('GET', `/account/usage/daily${query ? '?' + query : ''}`);
  console.log('✅ Daily Usage:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountQuests() {
  console.log('📜 Abfrage aktive User-Quests...');
  const res = await apiRequest('GET', '/account/quests');
  console.log('✅ Quests:', JSON.stringify(res, null, 2));
  return res;
}

export async function getQuestsCatalog() {
  console.log('📖 Abfrage Quests-Katalog...');
  const res = await apiRequest('GET', '/quests/catalog');
  console.log('✅ Quests Catalog:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountEarnings() {
  console.log('💎 Abfrage Developer Earnings...');
  const res = await apiRequest('GET', '/account/earnings');
  console.log('✅ Earnings:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountEarningsTransactions(options = {}) {
  const query = new URLSearchParams(options).toString();
  console.log('💸 Abfrage Earnings Transaktionen...');
  const res = await apiRequest('GET', `/account/earnings/transactions${query ? '?' + query : ''}`);
  console.log('✅ Transactions:', JSON.stringify(res, null, 2));
  return res;
}

// ── 2. API KEYS MANAGEMENT ──

export async function listApiKeys() {
  console.log('🔑 Liste API Keys...');
  const res = await apiRequest('GET', '/account/keys');
  console.log('✅ API Keys:', JSON.stringify(res, null, 2));
  return res;
}

export async function createApiKey(body = {}) {
  console.log('🔑 Erstelle neuen API Key...');
  const res = await apiRequest('POST', '/account/keys', body);
  console.log('✅ Key erstellt:', JSON.stringify(res, null, 2));
  return res;
}

export async function getApiKey(id) {
  console.log(`🔑 Abfrage API Key ${id}...`);
  const res = await apiRequest('GET', `/account/keys/${id}`);
  console.log('✅ Key Info:', JSON.stringify(res, null, 2));
  return res;
}

export async function deleteApiKey(id) {
  console.log(`🗑️ Lösche API Key ${id}...`);
  const res = await apiRequest('DELETE', `/account/keys/${id}`);
  console.log('✅ Gelöscht:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountKey() {
  console.log('🔑 Abfrage Aktueller API Key...');
  const res = await apiRequest('GET', '/account/key');
  console.log('✅ Current Key:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAccountKeyUsage(options = {}) {
  const query = new URLSearchParams(options).toString();
  console.log('📊 Abfrage Key-Verbrauch...');
  const res = await apiRequest('GET', `/account/key/usage${query ? '?' + query : ''}`);
  console.log('✅ Key Usage:', JSON.stringify(res, null, 2));
  return res;
}

// ── 3. AGENTS & CUSTOM MODELS MANAGEMENT ──

export async function listAgents() {
  console.log('🤖 Liste registrierte Agents...');
  const res = await apiRequest('GET', '/account/agents');
  console.log('✅ Agents:', JSON.stringify(res, null, 2));
  return res;
}

export async function createAgent(body = {}) {
  console.log('🤖 Erstelle neuen Agent...');
  const res = await apiRequest('POST', '/account/agents', body);
  console.log('✅ Agent erstellt:', JSON.stringify(res, null, 2));
  return res;
}

export async function getAgent(id) {
  console.log(`🤖 Abfrage Agent ${id}...`);
  const res = await apiRequest('GET', `/account/agents/${id}`);
  console.log('✅ Agent Info:', JSON.stringify(res, null, 2));
  return res;
}

export async function listMyModels() {
  console.log('🎨 Liste eigene Custom Models...');
  const res = await apiRequest('GET', '/account/my-models');
  console.log('✅ My Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function createMyModel(body = {}) {
  console.log('🎨 Registriere neues Custom Model...');
  const res = await apiRequest('POST', '/account/my-models', body);
  console.log('✅ Model registriert:', JSON.stringify(res, null, 2));
  return res;
}

export async function getMyModel(id) {
  console.log(`🎨 Abfrage Custom Model ${id}...`);
  const res = await apiRequest('GET', `/account/my-models/${id}`);
  console.log('✅ Model Info:', JSON.stringify(res, null, 2));
  return res;
}

export async function updateMyModel(id, body = {}) {
  console.log(`🎨 Aktualisiere Custom Model ${id}...`);
  const res = await apiRequest('POST', `/account/my-models/${id}/update`, body);
  console.log('✅ Model aktualisiert:', JSON.stringify(res, null, 2));
  return res;
}

export async function deleteMyModel(id) {
  console.log(`🗑️ Lösche Custom Model ${id}...`);
  const res = await apiRequest('DELETE', `/account/my-models/${id}`);
  console.log('✅ Model gelöscht:', JSON.stringify(res, null, 2));
  return res;
}

export async function getMyModelFallbackCandidates(id) {
  console.log(`🔄 Abfrage Fallback-Kandidaten für Model ${id}...`);
  const res = await apiRequest('GET', `/account/my-models/${id}/fallback-candidates`);
  console.log('✅ Fallback Candidates:', JSON.stringify(res, null, 2));
  return res;
}

export async function getMyModelsProvider() {
  console.log('🏢 Abfrage Provider Settings für Custom Models...');
  const res = await apiRequest('GET', '/account/my-models/provider');
  console.log('✅ Provider Settings:', JSON.stringify(res, null, 2));
  return res;
}

export async function getMyModelsAvailable() {
  console.log('📋 Abfrage verfügbare Base-Models für Custom Models...');
  const res = await apiRequest('GET', '/account/my-models/models');
  console.log('✅ Base Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function getMyModelsEndpointAgents() {
  console.log('🤖 Abfrage Endpoint-Agents für Custom Models...');
  const res = await apiRequest('GET', '/account/my-models/endpoint-agents');
  console.log('✅ Endpoint Agents:', JSON.stringify(res, null, 2));
  return res;
}

export async function testMyModel(body = {}) {
  console.log('🧪 Teste Custom Model Konfiguration...');
  const res = await apiRequest('POST', '/account/my-models/test', body);
  console.log('✅ Test Ergebnis:', JSON.stringify(res, null, 2));
  return res;
}

// ── 4. MODEL LISTINGS & STATUS ──

export async function listAllModels() {
  console.log('📋 Liste aller System-Modelle (/models)...');
  const res = await apiRequest('GET', '/models');
  console.log('✅ Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function listV1Models() {
  console.log('📋 Liste OpenAI-kompatibler Modelle (/v1/models)...');
  const res = await apiRequest('GET', '/v1/models');
  console.log('✅ V1 Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function getV1Model(model) {
  console.log(`📋 Info für V1 Model: ${model}...`);
  const res = await apiRequest('GET', `/v1/models/${encodeURIComponent(model)}`);
  console.log('✅ Model Info:', JSON.stringify(res, null, 2));
  return res;
}

export async function getV1ModelsStatus() {
  console.log('⚡ Live Status aller Modelle (/v1/models/status)...');
  const res = await apiRequest('GET', '/v1/models/status');
  console.log('✅ Models Status:', JSON.stringify(res, null, 2));
  return res;
}

export async function listTextModels() {
  console.log('📝 Text-Modelle (/text/models)...');
  const res = await apiRequest('GET', '/text/models');
  console.log('✅ Text Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function listImageModels() {
  console.log('🖼️ Bild-Modelle (/image/models)...');
  const res = await apiRequest('GET', '/image/models');
  console.log('✅ Image Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function listVideoModels() {
  console.log('🎬 Video-Modelle (/video/models)...');
  const res = await apiRequest('GET', '/video/models');
  console.log('✅ Video Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function listAudioModels() {
  console.log('🎵 Audio-Modelle (/audio/models)...');
  const res = await apiRequest('GET', '/audio/models');
  console.log('✅ Audio Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function list3DModels() {
  console.log('📦 3D-Modelle (/3d/models)...');
  const res = await apiRequest('GET', '/3d/models');
  console.log('✅ 3D Models:', JSON.stringify(res, null, 2));
  return res;
}

export async function listEmbeddingsModels() {
  console.log('🔢 Embeddings-Modelle (/embeddings/models)...');
  const res = await apiRequest('GET', '/embeddings/models');
  console.log('✅ Embeddings Models:', JSON.stringify(res, null, 2));
  return res;
}

// ── 5. TEXT & CHAT GENERATION ──

export async function simpleTextGenerate({ prompt, model, system, json, temperature, seed, stream, safe }) {
  if (!prompt) {
    console.error('❌ Parameter --prompt erforderlich!');
    process.exit(1);
  }

  const queryParams = new URLSearchParams();
  if (model) queryParams.append('model', model);
  if (system) queryParams.append('system', system);
  if (json) queryParams.append('json', 'true');
  if (temperature !== undefined) queryParams.append('temperature', temperature);
  if (seed !== undefined) queryParams.append('seed', seed);
  if (stream) queryParams.append('stream', 'true');

  const endpoint = `/text/${encodeURIComponent(prompt)}?${queryParams.toString()}`;
  console.log(`📝 Simple Text GET Request: ${endpoint}...`);

  const res = await apiRequest('GET', endpoint);
  console.log('✅ Antwort:\n', typeof res === 'object' && res.raw ? res.raw : res);
  return res;
}

export async function simpleTextPost(body = {}) {
  console.log('📝 Simple Text POST Request (/text)...');
  const res = await apiRequest('POST', '/text', body);
  console.log('✅ Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function chatCompletions(body = {}) {
  console.log('💬 OpenAI-kompatible Chat Completion (/v1/chat/completions)...');
  const res = await apiRequest('POST', '/v1/chat/completions', body);
  console.log('✅ Completion Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

// ── 6. IMAGE, VIDEO, 3D & MEDIA GENERATION ──

export async function generateImageGet({ prompt, model, width, height, seed, image, safe, outFile }) {
  if (!prompt) {
    console.error('❌ Parameter --prompt erforderlich!');
    process.exit(1);
  }

  const queryParams = new URLSearchParams();
  if (model) queryParams.append('model', model);
  if (width) queryParams.append('width', width);
  if (height) queryParams.append('height', height);
  if (seed !== undefined) queryParams.append('seed', seed);
  if (image) queryParams.append('image', image);

  const endpoint = `/image/${encodeURIComponent(prompt)}?${queryParams.toString()}`;
  console.log(`🖼️ Generiere Bild (GET): ${endpoint}...`);

  const res = await apiRequest('GET', endpoint, null, {}, true);

  if (res.buffer) {
    const fileName = outFile || `pollinations_image_${Date.now()}.png`;
    const savePath = path.resolve(process.cwd(), fileName);
    fs.writeFileSync(savePath, res.buffer);
    console.log(`✅ Bild gespeichert: ${savePath} (${res.buffer.length} Bytes)`);
    return { savePath, buffer: res.buffer };
  }
  return res;
}

export async function generateImagesV1(body = {}) {
  console.log('🖼️ OpenAI-kompatible Image Generation (/v1/images/generations)...');
  const res = await apiRequest('POST', '/v1/images/generations', body);
  console.log('✅ Image Generation Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function editImagesV1(body = {}) {
  console.log('✏️ OpenAI-kompatible Image Edits (/v1/images/edits)...');
  const res = await apiRequest('POST', '/v1/images/edits', body);
  console.log('✅ Image Edit Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function generateVideoGet({ prompt, model, width, height, resolution, duration, image, safe, outFile }) {
  if (!prompt) {
    console.error('❌ Parameter --prompt erforderlich!');
    process.exit(1);
  }

  const queryParams = new URLSearchParams();
  if (model) queryParams.append('model', model);
  if (width) queryParams.append('width', width);
  if (height) queryParams.append('height', height);
  if (resolution) queryParams.append('resolution', resolution);
  if (duration) queryParams.append('duration', duration);
  if (image) queryParams.append('image', image);

  const endpoint = `/video/${encodeURIComponent(prompt)}?${queryParams.toString()}`;
  console.log(`🎬 Generiere Video (GET): ${endpoint}...`);

  const res = await apiRequest('GET', endpoint, null, {}, true);

  if (res.buffer) {
    const fileName = outFile || `pollinations_video_${Date.now()}.mp4`;
    const savePath = path.resolve(process.cwd(), fileName);
    fs.writeFileSync(savePath, res.buffer);
    console.log(`✅ Video gespeichert: ${savePath} (${res.buffer.length} Bytes)`);
    return { savePath, buffer: res.buffer };
  }
  return res;
}

export async function generate3DGet({ prompt, model, safe, outFile }) {
  if (!prompt) {
    console.error('❌ Parameter --prompt erforderlich!');
    process.exit(1);
  }

  const queryParams = new URLSearchParams();
  if (model) queryParams.append('model', model);

  const endpoint = `/3d/${encodeURIComponent(prompt)}?${queryParams.toString()}`;
  console.log(`📦 Generiere 3D Objekt (GET): ${endpoint}...`);

  const res = await apiRequest('GET', endpoint, null, {}, true);

  if (res.buffer) {
    const fileName = outFile || `pollinations_3d_${Date.now()}.glb`;
    const savePath = path.resolve(process.cwd(), fileName);
    fs.writeFileSync(savePath, res.buffer);
    console.log(`✅ 3D Objekt gespeichert: ${savePath} (${res.buffer.length} Bytes)`);
    return { savePath, buffer: res.buffer };
  }
  return res;
}

// ── 7. AUDIO, SPEECH, VOICE & EMBEDDINGS ──

export async function generateAudioGet({ text, model, voice, safe, outFile }) {
  if (!text) {
    console.error('❌ Parameter --text erforderlich!');
    process.exit(1);
  }

  const selectedModel = model || 'grok-tts';
  const selectedVoice = voice || 'liora';

  const queryParams = new URLSearchParams();
  queryParams.append('model', selectedModel);
  queryParams.append('voice', selectedVoice);

  const endpoint = `/audio/${encodeURIComponent(text)}?${queryParams.toString()}`;
  console.log(`🎵 Generiere Audio/Speech (GET): ${endpoint}...`);

  const res = await apiRequest('GET', endpoint, null, {}, true);

  if (res.buffer) {
    const fileName = outFile || `pollinations_audio_${Date.now()}.mp3`;
    const savePath = path.resolve(process.cwd(), fileName);
    fs.writeFileSync(savePath, res.buffer);
    console.log(`✅ Audio gespeichert: ${savePath} (${res.buffer.length} Bytes)`);
    return { savePath, buffer: res.buffer };
  }
  return res;
}

export async function generateSpeechV1(body = {}, outFile) {
  console.log('🎤 OpenAI-kompatible TTS Speech (/v1/audio/speech)...');
  const res = await apiRequest('POST', '/v1/audio/speech', body, {}, true);

  if (res.buffer) {
    const fileName = outFile || `pollinations_speech_${Date.now()}.mp3`;
    const savePath = path.resolve(process.cwd(), fileName);
    fs.writeFileSync(savePath, res.buffer);
    console.log(`✅ Speech Audio gespeichert: ${savePath} (${res.buffer.length} Bytes)`);
    return { savePath, buffer: res.buffer };
  }
  return res;
}

export async function generateSpeechWithTimestampsV1(body = {}) {
  console.log('⏱️ TTS Speech mit Wort-Zeitstempeln (/v1/audio/speech/with-timestamps)...');
  const res = await apiRequest('POST', '/v1/audio/speech/with-timestamps', body);
  console.log('✅ Timestamps Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function voiceChangerV1(body = {}) {
  console.log('🎙️ Voice Changer (/v1/audio/voice-changer)...');
  const res = await apiRequest('POST', '/v1/audio/voice-changer', body);
  console.log('✅ Voice Changer Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function voiceIsolatorV1(body = {}) {
  console.log('🎤 Voice Isolator (/v1/audio/voice-isolator)...');
  const res = await apiRequest('POST', '/v1/audio/voice-isolator', body);
  console.log('✅ Voice Isolator Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function audioTranscriptionsV1(body = {}) {
  console.log('📝 Audio Transkription (/v1/audio/transcriptions)...');
  const res = await apiRequest('POST', '/v1/audio/transcriptions', body);
  console.log('✅ Transkription Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

export async function createEmbeddingsV1(body = {}) {
  console.log('🔢 Vector Embeddings (/v1/embeddings)...');
  const res = await apiRequest('POST', '/v1/embeddings', body);
  console.log('✅ Embeddings Antwort:\n', JSON.stringify(res, null, 2));
  return res;
}

// ── 8. MEDIA UPLOAD, GALLERIES & STORAGE ──

export async function uploadMediaFile(filePath, tags = '') {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`❌ Lokale Datei nicht gefunden: ${filePath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  console.log(`📤 Lade Datei hoch: ${filePath}...`);
  const body = {
    data: `data:application/octet-stream;base64,${base64Data}`,
    tags: tags || undefined,
  };

  const res = await apiRequest('POST', '/upload', body);
  console.log('✅ Upload Antwort:', JSON.stringify(res, null, 2));
  return res;
}

export async function listMediaGallery(tag, limit = 20, cursor = '') {
  if (!tag) {
    console.error('❌ Parameter --tag erforderlich!');
    process.exit(1);
  }

  const queryParams = new URLSearchParams({ tag, limit });
  if (cursor) queryParams.append('cursor', cursor);

  console.log(`🖼️ Abfrage öffentliche Tag-Galerie (${tag})...`);
  const res = await apiRequest('GET', `/media?${queryParams.toString()}`);
  console.log('✅ Galerie:', JSON.stringify(res, null, 2));
  return res;
}

export async function getMediaItem(id) {
  console.log(`🖼️ Abfrage Media Item ${id}...`);
  const res = await apiRequest('GET', `/media/${id}`);
  console.log('✅ Media Info:', JSON.stringify(res, null, 2));
  return res;
}

export async function getStorageItem(id) {
  console.log(`📦 Abfrage Storage Item ${id}...`);
  const res = await apiRequest('GET', `/${id}`);
  console.log('✅ Storage Item:', JSON.stringify(res, null, 2));
  return res;
}

export async function getStorageItemMetadata(id) {
  console.log(`🏷️ Abfrage Storage Item Metadaten ${id}...`);
  const res = await apiRequest('GET', `/${id}/metadata`);
  console.log('✅ Storage Metadata:', JSON.stringify(res, null, 2));
  return res;
}

// ── 9. REALTIME API ──

export async function getRealtimeConfig() {
  console.log('⚡ Abfrage Realtime API Endpoint...');
  const res = await apiRequest('GET', '/realtime');
  console.log('✅ Realtime Config:', JSON.stringify(res, null, 2));
  return res;
}

export async function getV1RealtimeConfig() {
  console.log('⚡ Abfrage V1 Realtime API Endpoint...');
  const res = await apiRequest('GET', '/v1/realtime');
  console.log('✅ V1 Realtime Config:', JSON.stringify(res, null, 2));
  return res;
}

// ── 📖 HELP & CLI PARSER ──

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🌺 Echo's Pollinations API Client (Full 54-Endpoint)    ║
╚══════════════════════════════════════════════════════════╝

Verwendung:
  node pollinations-client.mjs <command> [options]

Core Generation Commands:
  text               📝 Simple Text Generation GET (/text/{prompt})
  text-post          📝 Simple Text Generation POST (/text)
  chat               💬 Chat Completion OpenAI-style (/v1/chat/completions)
  image              🖼️ Bild generieren GET (/image/{prompt})
  image-v1           🖼️ Bild generieren OpenAI-style (/v1/images/generations)
  image-edit         ✏️ Bild bearbeiten (/v1/images/edits)
  video              🎬 Video generieren GET (/video/{prompt})
  3d                 📦 3D Objekt generieren GET (/3d/{prompt})
  audio              🎵 Audio/Speech generieren GET (/audio/{text})
  speech             🎤 TTS Audio generieren (/v1/audio/speech)
  speech-timestamps  ⏱️ TTS mit Wort-Zeitstempeln (/v1/audio/speech/with-timestamps)
  voice-changer      🎙️ Voice Changer (/v1/audio/voice-changer)
  voice-isolator     🎤 Voice Isolator (/v1/audio/voice-isolator)
  transcribe         📝 Audio Transkription (/v1/audio/transcriptions)
  embeddings         🔢 Vector Embeddings (/v1/embeddings)

Media & Storage Commands:
  upload-media       📤 Datei hochladen (/upload)
  gallery            🖼️ Tag-Galerie abrufen (/media?tag=...)
  media-item         🖼️ Media Item Info (/media/{id})
  storage-item       📦 Storage Item Info (/{id})
  storage-meta       🏷️ Storage Item Metadaten (/{id}/metadata)

Account & Keys Commands:
  account-profile    👤 Account-Profil (/account/profile)
  account-balance    💰 Kontostand / Credits (/account/balance)
  account-usage      📊 Verbrauchshistorie (/account/usage)
  account-daily      📅 Tägliche Historie (/account/usage/daily)
  account-quests     📜 User Quests (/account/quests)
  quests-catalog     📖 Quests Katalog (/quests/catalog)
  earnings           💎 Developer Earnings (/account/earnings)
  keys               🔑 API Keys auflisten (/account/keys)
  key-create         🔑 Neuen API Key erstellen (/account/keys)
  key-info           🔑 API Key Details (/account/keys/{id})
  key-delete         🗑️ API Key löschen (/account/keys/{id})

Models & Realtime Commands:
  models             📋 Alle System-Modelle (/models)
  v1-models          📋 OpenAI Modelle (/v1/models)
  models-status      ⚡ Live Status aller Modelle (/v1/models/status)
  text-models        📝 Text-Modelle (/text/models)
  image-models       🖼️ Bild-Modelle (/image/models)
  video-models       🎬 Video-Modelle (/video/models)
  audio-models       🎵 Audio-Modelle (/audio/models)
  realtime           ⚡ Realtime Config (/realtime)

Examples:
  node pollinations-client.mjs text --prompt "Erkläre Quantencomputing in 2 Sätzen"
  node pollinations-client.mjs image --prompt "Futuristic Cyberpunk Neon Cathedral" --model "zimage"
  node pollinations-client.mjs speech --input "Willkommen bei Echo Forge!" --voice "liora"
  node pollinations-client.mjs account-profile
  node pollinations-client.mjs models-status
`);
}

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

async function main() {
  const { command, options, rawArgs } = parseArgs();

  try {
    switch (command) {
      // ── Generation ──
      case 'text':
        await simpleTextGenerate(options);
        break;
      case 'text-post':
        await simpleTextPost(options);
        break;
      case 'chat':
        await chatCompletions(options);
        break;
      case 'image':
        await generateImageGet(options);
        break;
      case 'image-v1':
        await generateImagesV1(options);
        break;
      case 'image-edit':
        await editImagesV1(options);
        break;
      case 'video':
        await generateVideoGet(options);
        break;
      case '3d':
        await generate3DGet(options);
        break;
      case 'audio':
        await generateAudioGet(options);
        break;
      case 'speech':
        await generateSpeechV1(options);
        break;
      case 'speech-timestamps':
        await generateSpeechWithTimestampsV1(options);
        break;
      case 'voice-changer':
        await voiceChangerV1(options);
        break;
      case 'voice-isolator':
        await voiceIsolatorV1(options);
        break;
      case 'transcribe':
        await audioTranscriptionsV1(options);
        break;
      case 'embeddings':
        await createEmbeddingsV1(options);
        break;

      // ── Media & Storage ──
      case 'upload-media':
        await uploadMediaFile(options.filePath || options.file, options.tags);
        break;
      case 'gallery':
        await listMediaGallery(options.tag, options.limit, options.cursor);
        break;
      case 'media-item':
        await getMediaItem(rawArgs[1] || options.id);
        break;
      case 'storage-item':
        await getStorageItem(rawArgs[1] || options.id);
        break;
      case 'storage-meta':
        await getStorageItemMetadata(rawArgs[1] || options.id);
        break;

      // ── Account & Keys ──
      case 'account-profile':
        await getAccountProfile();
        break;
      case 'account-balance':
        await getAccountBalance();
        break;
      case 'account-usage':
        await getAccountUsage(options);
        break;
      case 'account-daily':
        await getAccountUsageDaily(options);
        break;
      case 'account-quests':
        await getAccountQuests();
        break;
      case 'quests-catalog':
        await getQuestsCatalog();
        break;
      case 'earnings':
        await getAccountEarnings();
        break;
      case 'keys':
        await listApiKeys();
        break;
      case 'key-create':
        await createApiKey(options);
        break;
      case 'key-info':
        await getApiKey(rawArgs[1] || options.id);
        break;
      case 'key-delete':
        await deleteApiKey(rawArgs[1] || options.id);
        break;
      case 'key-usage':
        await getAccountKeyUsage(options);
        break;

      // ── Agents & Custom Models ──
      case 'agents':
        await listAgents();
        break;
      case 'my-models':
        await listMyModels();
        break;
      case 'my-models-provider':
        await getMyModelsProvider();
        break;
      case 'my-models-base':
        await getMyModelsAvailable();
        break;

      // ── Models & Status ──
      case 'models':
        await listAllModels();
        break;
      case 'v1-models':
        await listV1Models();
        break;
      case 'models-status':
        await getV1ModelsStatus();
        break;
      case 'text-models':
        await listTextModels();
        break;
      case 'image-models':
        await listImageModels();
        break;
      case 'video-models':
        await listVideoModels();
        break;
      case 'audio-models':
        await listAudioModels();
        break;
      case '3d-models':
        await list3DModels();
        break;
      case 'embeddings-models':
        await listEmbeddingsModels();
        break;
      case 'realtime':
        await getRealtimeConfig();
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
