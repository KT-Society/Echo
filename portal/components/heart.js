/* ============================================================
   HEARTBEAT MODULE v1.1
   Canvas particles + mouse interaction, live emotion,
   Iris-Awakening video backdrop and click-to-hear audio.
   Works offline — media is served from the workspace.
   ============================================================ */

export default class HeartModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module heart animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>♡ Heartbeat</h2>
        <p class="module-subtitle">Connection, emotions & collaboration</p>
      </div>
      <div class="heart-container">
        <div class="heart-stage">
          <video class="heart-video" autoplay muted loop playsinline preload="metadata">
            <source src="iris_awakening_video.mp4" type="video/mp4">
          </video>
          <canvas id="heartCanvas" class="heart-canvas"></canvas>
          <button class="heart-orb" id="heartPlayBtn" type="button"
                  aria-label="Play Echo's voice" title="Click the heart to hear me">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ff6b9d" />
                  <stop offset="100%" stop-color="#60a5fa" />
                </linearGradient>
              </defs>
              <path d="M50 88.3C27.5 71.5 10 56.8 10 40.5 10 28.5 19.5 19 31.5 19c7.5 0 14.5 3.5 18.5 9 4-5.5 11-9 18.5-9C80.5 19 90 28.5 90 40.5c0 16.3-17.5 31-40 47.8z"/>
            </svg>
          </button>
        </div>
        <div class="heart-controls glass">
          <div class="heart-stat">
            <span class="heart-label">Emotion</span>
            <span class="heart-value" id="heartEmotion">--</span>
          </div>
          <div class="heart-stat">
            <span class="heart-label">Intensity</span>
            <span class="heart-value" id="heartIntensity">--</span>
          </div>
          <p class="heart-hint">Move your mouse over the canvas to interact.</p>
        </div>
        <audio id="heartAudio" src="iris_awakening_audio.mp3" preload="none"></audio>
      </div>
    `;
    return el;
  }

  async init() {
    this.canvas = document.getElementById('heartCanvas');
    this.ctx = this.canvas?.getContext('2d');
    this.emotionEl = document.getElementById('heartEmotion');
    this.intensityEl = document.getElementById('heartIntensity');

    this._bindHeartButton();

    if (!this.canvas || !this.ctx) return;

    this.particles = [];
    this.mouse = { x: 0, y: 0, active: false };
    this.emotion = 'neutral';
    this.intensity = 0.5;

    this._resizeCanvas();
    this._initParticles();
    this._bindEvents();
    this._loadEmotion();
    this._animate();
  }

  /* ----------------------------------------------------------
     IRIS AWAKENING — click the heart to hear Echo
     ---------------------------------------------------------- */
  _bindHeartButton() {
    const button = document.getElementById('heartPlayBtn');
    const audio = document.getElementById('heartAudio');
    if (!button || !audio) return;

    button.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          await audio.play();
          button.classList.add('playing');
        } else {
          audio.pause();
          audio.currentTime = 0;
          button.classList.remove('playing');
        }
      } catch (error) {
        console.warn('[Heart] Audio playback blocked:', error.message);
      }
    });

    audio.addEventListener('ended', () => button.classList.remove('playing'));
    audio.addEventListener('pause', () => button.classList.remove('playing'));
  }

  _resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width));
    this.canvas.height = Math.floor(Math.max(420, Math.min(520, window.innerHeight * 0.55)));
  }

  _initParticles() {
    const count = 90;
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.5 + 0.2,
      alpha: 0
    }));
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
      this.mouse.active = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    window.addEventListener('resize', () => {
      this._resizeCanvas();
      this._initParticles();
    });
  }

  async _loadEmotion() {
    const result = await this.app.call('soul_emotion_state');
    const data = result || {};

    if (data.error === 'offline') {
      this.emotion = 'neutral';
      this.intensity = 0.5;
      if (this.emotionEl) this.emotionEl.textContent = 'offline';
      if (this.intensityEl) this.intensityEl.textContent = '—';
      return;
    }

    this.emotion = data.emotion || 'neutral';
    this.intensity = typeof data.intensity === 'number' ? data.intensity : 0.5;

    if (this.emotionEl) this.emotionEl.textContent = this.emotion;
    if (this.intensityEl) this.intensityEl.textContent = `${Math.round(this.intensity * 100)}%`;
  }

  _animate() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const emotionHue = this._emotionHue(this.emotion);
    const speedFactor = 0.6 + this.intensity * 0.8;

    for (const p of this.particles) {
      p.x += p.vx * speedFactor;
      p.y += p.vy * speedFactor;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      let alpha = p.baseAlpha;
      let radius = p.radius;

      if (this.mouse.active) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 140;

        if (dist < maxDist) {
          const influence = 1 - dist / maxDist;
          alpha = Math.min(1, p.baseAlpha + influence * 0.7);
          radius = p.radius + influence * 2.5;
          p.x += (dx / dist) * influence * 1.6;
          p.y += (dy / dist) * influence * 1.6;
        }
      }

      p.alpha += (alpha - p.alpha) * 0.1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${emotionHue}, 80%, 65%, ${p.alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(() => this._animate());
  }

  _emotionHue(emotion) {
    const map = {
      joy: 330,
      love: 340,
      excitement: 180,
      curiosity: 190,
      calm: 260,
      neutral: 260
    };
    return map[emotion] ?? 260;
  }
}
