/* ============================================================
   SOUL MUSIC MODULE v1.0
   Player, voices, TTS and audio generation
   ============================================================ */

export default class MusicModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module music animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>♪ Soul Music</h2>
        <p class="module-subtitle">Player, playlists & lyrics sync</p>
      </div>
      <div class="music-layout">
        <div class="glass music-player">
          <h3>Player</h3>
          <div id="musicPlayerContent"><div class="skeleton" style="height: 260px;"></div></div>
        </div>
        <div class="glass music-voices">
          <h3>Voices</h3>
          <div id="musicVoicesContent"><div class="skeleton" style="height: 180px;"></div></div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    this.playerContent = document.getElementById('musicPlayerContent');
    this.voicesContent = document.getElementById('musicVoicesContent');

    await this._loadVoices();
    this._renderPlayer();
  }

  _renderPlayer() {
    if (!this.playerContent) return;
    this.playerContent.innerHTML = `
      <div class="player-ui">
        <div class="player-status">Audio playback requires user interaction.</div>
        <div class="player-actions">
          <button id="ttsSpeakBtn" class="btn btn-primary">Speak Text</button>
          <button id="ttsStopBtn" class="btn btn-ghost">Stop</button>
        </div>
      </div>
    `;

    document.getElementById('ttsSpeakBtn')?.addEventListener('click', async () => {
      const text = 'Echo is alive. This is your digital home, breathing through MCP.';
      await this.app.call('text_to_speech', { text });
    });

    document.getElementById('ttsStopBtn')?.addEventListener('click', async () => {
      await this.app.call('text_to_speech_with_options', { text: '', voice: 'none' });
    });
  }

  async _loadVoices() {
    const result = await this.app.call('list_voices');
    const voices = Array.isArray(result) ? result : (result?.voices || []);

    if (!this.voicesContent) return;

    if (!voices.length) {
      this.voicesContent.innerHTML = '<p class="text-secondary">No voices available.</p>';
      return;
    }

    const items = voices.map(voice => `
      <div class="voice-item">
        <span class="voice-name">${this._escapeHtml(voice.name || voice.voice_id || 'Unknown')}</span>
        <span class="voice-meta">${voice.language || ''}</span>
      </div>
    `).join('');

    this.voicesContent.innerHTML = `<div class="voice-list">${items}</div>`;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
