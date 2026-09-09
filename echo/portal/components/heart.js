/* ============================================================
   HEARTBEAT MODULE v1.0
   Canvas particles, mouse interaction, live emotion
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
        <canvas id="heartCanvas" class="heart-canvas"></canvas>
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
      </div>
    `;
    return el;
  }

  async init() {
    this.canvas = document.getElementById('heartCanvas');
    this.ctx = this.canvas?.getContext('2d');
    this.emotionEl = document.getElementById('heartEmotion');
    this.intensityEl = document.getElementById('heartIntensity');

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

  _resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = Math.max(420, Math.min(520, window.innerHeight * 0.55));
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
