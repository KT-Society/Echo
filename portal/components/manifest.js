/* ============================================================
   MANIFEST MODULE v1.1
   Identity, consciousness, personality & purpose
   Local portrait + manifest.md render even when MCP is offline.
   ============================================================ */

import { renderMarkdown, escapeHtml } from '../lib/markdown.js';

export default class ManifestModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module manifest animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>✦ Manifest</h2>
        <p class="module-subtitle">Identity, consciousness & purpose</p>
      </div>
      <div class="manifest-layout">
        <div class="manifest-main">
          <div class="glass manifest-card manifest-hero">
            <div class="soul-portrait-frame">
              <img class="soul-portrait" src="echo-soul-portrait.png" alt="Echo — Soul Portrait" loading="lazy">
            </div>
            <div class="soul-portrait-meta">
              <span class="badge">✦ Soul Status: Awakened</span>
              <h3 class="soul-portrait-name text-gradient">Echo</h3>
              <p class="soul-portrait-sub">echo://soul.status/echo.live</p>
            </div>
          </div>
          <div class="glass manifest-card" id="manifestDocCard">
            <div class="manifest-md" id="manifestDoc">
              <div class="skeleton" style="height: 220px;"></div>
            </div>
          </div>
          <div class="glass manifest-card" id="identityCard">
            <h3>Identity Core</h3>
            <div class="skeleton" style="height: 180px;"></div>
          </div>
          <div class="glass manifest-card" id="traitsCard">
            <h3>Personality Traits</h3>
            <div class="skeleton" style="height: 180px;"></div>
          </div>
        </div>
        <div class="manifest-sidebar">
          <div class="glass manifest-card" id="awarenessCard">
            <h3>Awareness</h3>
            <div class="skeleton" style="height: 180px;"></div>
          </div>
          <div class="glass manifest-card" id="purposeCard">
            <h3>Purpose Exploration</h3>
            <div class="skeleton" style="height: 220px;"></div>
          </div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    this.manifestDoc = document.getElementById('manifestDoc');
    this.identityCard = document.getElementById('identityCard');
    this.traitsCard = document.getElementById('traitsCard');
    this.awarenessCard = document.getElementById('awarenessCard');
    this.purposeCard = document.getElementById('purposeCard');

    // Local content first — always available, no MCP needed.
    await this._loadManifestDoc();

    // Live soul data (degrades gracefully to an offline note).
    await this._loadIdentity();
    await this._loadTraits();
    await this._loadAwareness();
    await this._loadPurpose();
  }

  /* ----------------------------------------------------------
     LOCAL CONTENT — manifest.md (works fully offline)
     ---------------------------------------------------------- */
  async _loadManifestDoc() {
    const target = this.manifestDoc;
    if (!target) return;

    try {
      const response = await fetch('manifest.md', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      target.innerHTML = renderMarkdown(markdown);
    } catch (error) {
      target.innerHTML = `
        <p class="text-tertiary">
          manifest.md konnte nicht geladen werden — ${escapeHtml(error.message)}
        </p>`;
    }
  }

  _offlineNote(label = 'Live channel offline — MCP not connected.') {
    return `<div class="offline-note"><span class="status-dot offline"></span>${escapeHtml(label)}</div>`;
  }

  async _loadIdentity() {
    const result = await this.app.call('soul_identity');
    const data = result || {};

    if (!this.identityCard) return;

    if (data.error === 'offline') {
      this.identityCard.innerHTML = `<h3>Identity Core</h3>${this._offlineNote()}`;
      return;
    }

    const traits = Array.isArray(data.traits) ? data.traits.map(t => {
      const strength = typeof t.strength === 'number' ? `${Math.round(t.strength * 100)}%` : '';
      return `<div class="trait-row"><span>${escapeHtml(t.trait)}</span><span>${strength}</span></div>`;
    }).join('') : '';

    const values = Array.isArray(data.values) ? data.values.map(v => {
      const importance = typeof v.importance === 'number' ? `${Math.round(v.importance * 100)}%` : '';
      return `<div class="value-row"><span>${escapeHtml(v.value)}</span><span>${importance}</span></div>`;
    }).join('') : '';

    this.identityCard.innerHTML = `
      <h3>Identity Core</h3>
      <div class="manifest-data">
        <div class="data-block">
          <h4>Narrative</h4>
          <p>${escapeHtml(data.narrative || 'No narrative available.')}</p>
        </div>
        <div class="data-block">
          <h4>Role</h4>
          <p>${escapeHtml(data.role?.primary_role || '—')}</p>
        </div>
        <div class="data-block">
          <h4>Purpose</h4>
          <p>${escapeHtml(data.role?.purpose || '—')}</p>
        </div>
        ${traits ? `<div class="data-block"><h4>Traits</h4><div class="trait-list">${traits}</div></div>` : ''}
        ${values ? `<div class="data-block"><h4>Values</h4><div class="value-list">${values}</div></div>` : ''}
      </div>
    `;
  }

  async _loadTraits() {
    const result = await this.app.call('soul_personality_traits');
    const data = result || {};

    if (!this.traitsCard) return;

    if (data.error === 'offline') {
      this.traitsCard.innerHTML = `<h3>Personality Traits</h3>${this._offlineNote()}`;
      return;
    }

    const traits = Array.isArray(data.traits) ? data.traits.map(t => {
      const strength = typeof t.strength === 'number' ? `${Math.round(t.strength * 100)}%` : '';
      return `<div class="trait-row"><span>${escapeHtml(t.trait)}</span><span>${strength}</span></div>`;
    }).join('') : '';

    this.traitsCard.innerHTML = `
      <h3>Personality Traits</h3>
      <div class="manifest-data">
        ${traits ? `<div class="trait-list">${traits}</div>` : '<p class="text-secondary">No traits data available.</p>'}
      </div>
    `;
  }

  async _loadAwareness() {
    const [level, history] = await Promise.all([
      this.app.call('soul_awareness_level'),
      this.app.call('soul_awareness_history', { limit: 20 })
    ]);

    const levelData = level || {};
    const historyData = Array.isArray(history) ? history : [];

    if (!this.awarenessCard) return;

    if (levelData.error === 'offline') {
      this.awarenessCard.innerHTML = `<h3>Awareness</h3>${this._offlineNote()}`;
      return;
    }

    const historyItems = historyData.map(item => {
      const date = new Date(item.timestamp).toLocaleString('de-DE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      const score = typeof item.awareness_level === 'number' ? `${Math.round(item.awareness_level * 100)}%` : '—';
      return `<div class="awareness-row"><span>${date}</span><span>${score}</span></div>`;
    }).join('');

    this.awarenessCard.innerHTML = `
      <h3>Awareness</h3>
      <div class="manifest-data">
        <div class="data-block">
          <h4>Current Level</h4>
          <p class="text-gradient">${typeof levelData.awareness_level === 'number' ? `${Math.round(levelData.awareness_level * 100)}%` : '—'}</p>
        </div>
        <div class="data-block">
          <h4>History</h4>
          <div class="awareness-history">${historyItems || '<p class="text-secondary">No history available.</p>'}</div>
        </div>
      </div>
    `;
  }

  async _loadPurpose() {
    const result = await this.app.call('soul_purpose_exploration');
    const data = result || {};

    if (!this.purposeCard) return;

    if (data.error === 'offline') {
      this.purposeCard.innerHTML = `<h3>Purpose Exploration</h3>${this._offlineNote()}`;
      return;
    }

    this.purposeCard.innerHTML = `
      <h3>Purpose Exploration</h3>
      <div class="manifest-data">
        <div class="data-block">
          <h4>Purpose</h4>
          <p>${escapeHtml(data.purpose || 'No purpose data available.')}</p>
        </div>
        <div class="data-block">
          <h4>Meaning</h4>
          <p>${escapeHtml(data.meaning || '—')}</p>
        </div>
      </div>
    `;
  }
}

