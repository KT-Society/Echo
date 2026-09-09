/* ============================================================
   CREATIVE STUDIO MODULE v1.0
   Image, text, voice and music generation
   ============================================================ */

export default class CreativeModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module creative animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>✧ Creative Studio</h2>
        <p class="module-subtitle">AI image, text & voice generation</p>
      </div>
      <div class="creative-layout">
        <div class="glass creative-card">
          <h3>Image Generation</h3>
          <input type="text" id="creativeImagePrompt" placeholder="Describe an image..." />
          <button id="creativeImageBtn" class="btn btn-primary">Generate Image</button>
          <div id="creativeImageResult" class="creative-result"></div>
        </div>
        <div class="glass creative-card">
          <h3>Text Generation</h3>
          <input type="text" id="creativeTextPrompt" placeholder="Ask something..." />
          <button id="creativeTextBtn" class="btn btn-primary">Generate Text</button>
          <div id="creativeTextResult" class="creative-result"></div>
        </div>
        <div class="glass creative-card">
          <h3>Voice Synthesis</h3>
          <input type="text" id="creativeVoiceText" placeholder="Text to speak..." />
          <button id="creativeVoiceBtn" class="btn btn-primary">Speak</button>
          <div id="creativeVoiceResult" class="creative-result"></div>
        </div>
        <div class="glass creative-card">
          <h3>Music Generation</h3>
          <input type="text" id="creativeMusicPrompt" placeholder="Song idea..." />
          <button id="creativeMusicBtn" class="btn btn-primary">Generate Song</button>
          <div id="creativeMusicResult" class="creative-result"></div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    this.imagePrompt = document.getElementById('creativeImagePrompt');
    this.textPrompt = document.getElementById('creativeTextPrompt');
    this.voiceText = document.getElementById('creativeVoiceText');
    this.musicPrompt = document.getElementById('creativeMusicPrompt');

    document.getElementById('creativeImageBtn')?.addEventListener('click', () => this._generateImage());
    document.getElementById('creativeTextBtn')?.addEventListener('click', () => this._generateText());
    document.getElementById('creativeVoiceBtn')?.addEventListener('click', () => this._generateVoice());
    document.getElementById('creativeMusicBtn')?.addEventListener('click', () => this._generateMusic());
  }

  async _generateImage() {
    const prompt = this.imagePrompt?.value?.trim();
    const resultEl = document.getElementById('creativeImageResult');
    if (!prompt || !resultEl) return;

    resultEl.innerHTML = '<p class="text-secondary">Generating...</p>';
    const result = await this.app.call('generateImageUrl', { prompt, model: 'lykon/dreamshaper-8-lcm' });

    const url = result?.url || result?.data?.url || '';
    if (url) {
      resultEl.innerHTML = `<img src="${this._escapeHtml(url)}" alt="${this._escapeHtml(prompt)}" />`;
    } else {
      resultEl.innerHTML = '<p class="text-offline">Generation failed.</p>';
    }
  }

  async _generateText() {
    const prompt = this.textPrompt?.value?.trim();
    const resultEl = document.getElementById('creativeTextResult');
    if (!prompt || !resultEl) return;

    resultEl.innerHTML = '<p class="text-secondary">Generating...</p>';
    const result = await this.app.call('generateText', { prompt });

    const text = result?.text || result?.data?.text || '';
    resultEl.innerHTML = text ? `<p>${this._escapeHtml(text)}</p>` : '<p class="text-offline">Generation failed.</p>';
  }

  async _generateVoice() {
    const text = this.voiceText?.value?.trim();
    const resultEl = document.getElementById('creativeVoiceResult');
    if (!text || !resultEl) return;

    resultEl.innerHTML = '<p class="text-secondary">Synthesizing...</p>';
    const result = await this.app.call('respondAudio', { prompt: text });

    const audioUrl = result?.url || result?.data?.url || '';
    if (audioUrl) {
      resultEl.innerHTML = `<audio controls src="${this._escapeHtml(audioUrl)}"></audio>`;
    } else {
      resultEl.innerHTML = '<p class="text-offline">Synthesis failed.</p>';
    }
  }

  async _generateMusic() {
    const prompt = this.musicPrompt?.value?.trim();
    const resultEl = document.getElementById('creativeMusicResult');
    if (!prompt || !resultEl) return;

    resultEl.innerHTML = '<p class="text-secondary">Composing...</p>';
    const result = await this.app.call('suno_generate_song', { prompt, model: 'v5' });

    const status = result?.status || result?.data?.status || '';
    const taskId = result?.task_id || result?.data?.task_id || '';

    if (taskId) {
      resultEl.innerHTML = `<p class="text-online">Song generation started: ${this._escapeHtml(taskId)}</p>`;
    } else if (status) {
      resultEl.innerHTML = `<p>${this._escapeHtml(status)}</p>`;
    } else {
      resultEl.innerHTML = '<p class="text-offline">Generation failed.</p>';
    }
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
