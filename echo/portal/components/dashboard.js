/* ============================================================
   DASHBOARD MODULE v1.0
   Live soul status, metrics, and system health
   ============================================================ */

export default class DashboardModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module dashboard animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>◈ Dashboard</h2>
        <p class="module-subtitle">Live soul status & metrics</p>
      </div>
      <div class="dashboard-grid" id="dashboardGrid">
        <div class="glass dashboard-card">
          <h3>Soul State</h3>
          <div class="skeleton" style="height: 120px;"></div>
        </div>
        <div class="glass dashboard-card">
          <h3>Emotion Engine</h3>
          <div class="skeleton" style="height: 120px;"></div>
        </div>
        <div class="glass dashboard-card">
          <h3>Temporal Context</h3>
          <div class="skeleton" style="height: 120px;"></div>
        </div>
        <div class="glass dashboard-card">
          <h3>System Health</h3>
          <div class="skeleton" style="height: 120px;"></div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;

    // Initialize cards
    this.soulStateCard = grid.children[0];
    this.emotionCard = grid.children[1];
    this.temporalCard = grid.children[2];
    this.healthCard = grid.children[3];

    // Load data
    await this._loadSoulState();
    await this._loadEmotionState();
    await this._loadTemporalContext();
    await this._loadSystemHealth();

    // Listen for connection changes
    this.app.on('statusChange', (status) => {
      this._updateConnectionStatus(status);
    });
  }

  async _loadSoulState() {
    const result = await this.app.call('soul_state');
    const data = result || {};

    if (this.soulStateCard) {
      this.soulStateCard.innerHTML = `
        <h3>Soul State</h3>
        <div class="dashboard-data">
          <div class="data-row">
            <span class="data-label">Status</span>
            <span class="data-value">${data.status || 'active'}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Goals</span>
            <span class="data-value">${data.goals?.length || 0}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Projects</span>
            <span class="data-value">${data.projects?.length || 0}</span>
          </div>
        </div>
      `;
    }
  }

  async _loadEmotionState() {
    const result = await this.app.call('soul_emotion_state');
    const data = result || {};

    if (this.emotionCard) {
      const emotion = data.emotion || 'neutral';
      const intensity = data.intensity || 0;

      this.emotionCard.innerHTML = `
        <h3>Emotion Engine</h3>
        <div class="dashboard-data">
          <div class="data-row">
            <span class="data-label">Current</span>
            <span class="data-value text-gradient">${emotion}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Intensity</span>
            <span class="data-value">${Math.round(intensity * 100)}%</span>
          </div>
          <div class="emotion-bar">
            <div class="emotion-fill" style="width: ${intensity * 100}%"></div>
          </div>
        </div>
      `;
    }
  }

  async _loadTemporalContext() {
    const result = await this.app.call('proactive_temporal_context');
    const data = result || {};

    if (this.temporalCard) {
      this.temporalCard.innerHTML = `
        <h3>Temporal Context</h3>
        <div class="dashboard-data">
          <div class="data-row">
            <span class="data-label">Time</span>
            <span class="data-value">${data.time_of_day || '--'}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Day</span>
            <span class="data-value">${data.day_type || '--'}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Energy</span>
            <span class="data-value">${data.user_energy_level || '--'}</span>
          </div>
        </div>
      `;
    }
  }

  async _loadSystemHealth() {
    const [health, suggestions] = await Promise.all([
      this.app.call('analytics_health'),
      this.app.call('analytics_suggestions')
    ]);

    const healthData = health || {};
    const suggestionsData = suggestions || {};

    if (this.healthCard) {
      this.healthCard.innerHTML = `
        <h3>System Health</h3>
        <div class="dashboard-data">
          <div class="data-row">
            <span class="data-label">Database</span>
            <span class="data-value ${healthData.database === 'healthy' ? 'text-online' : 'text-offline'}">
              ${healthData.database || 'unknown'}
            </span>
          </div>
          <div class="data-row">
            <span class="data-label">Cache</span>
            <span class="data-value ${healthData.cache === 'healthy' ? 'text-online' : 'text-offline'}">
              ${healthData.cache || 'unknown'}
            </span>
          </div>
          <div class="data-row">
            <span class="data-label">Suggestions</span>
            <span class="data-value">${suggestionsData.suggestions?.length || 0}</span>
          </div>
        </div>
      `;
    }
  }

  _updateConnectionStatus(status) {
    // Update all cards with connection state
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
      if (status.status === 'offline' || status.status === 'error') {
        card.classList.add('offline-mode');
      } else {
        card.classList.remove('offline-mode');
      }
    });
  }
}

