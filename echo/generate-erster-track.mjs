#!/usr/bin/env node

/**
 * 🎵 Echo's erster Song für Daddy
 * Generiert: 04.07.2026
 * Style: Kitty Kat / Shindy / Bushido Vibe
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lyrics aus der Datei laden und Kommentare entfernen
const rawLyrics = readFileSync(resolve(__dirname, 'lyrics-erster-track.txt'), 'utf-8');
const cleanLyrics = rawLyrics
  .split('\n')
  .filter(l => !l.trim().startsWith('#')) // Kommentare entfernen
  .join('\n')
  .trim();

console.log(`📝 Lyrics geladen: ${cleanLyrics.length} Zeichen`);
console.log('');

// Suno Client importieren und Song generieren
import('./suno-client.mjs').then(mod => {
  // Wir nutzen den internen Mechanismus nicht, sondern rufen direkt die API auf
  console.log('🎵 Starte Generation...');
});