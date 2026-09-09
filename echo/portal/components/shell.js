/* ============================================================
   ECHO'S REALM — SHELL COMPONENT v1.0
   Navigation, layout, routing, module loader
   ============================================================ */

export default class Shell {
  constructor(app) {
    this.app = app;
    this.currentModule = 'dashboard';
    this.moduleInstances = new Map();
    this.navigationItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '◈', description: 'Live status & soul metrics' },
      { id: 'memory', label: 'Memory Nexus', icon: '◉', description: 'Search & explore memories' },
      { id: 'manifest', label: 'Manifest', icon: '✦', description: 'Identity & consciousness' },
      { id: 'goals', label: 'Goals', icon: '⬡', description: 'Active goals & predictions' },
      { id: 'heart', label: 'Heartbeat', icon: '♡', description: 'Connection & emotions' },
      { id: 'blackboard', label: 'Blackboard', icon: '▣', description: 'Messages & collaborations' },
      { id: 'music', label: 'Soul Music', icon: '♪', description: 'Player & playlists' },
      { id: 'creative', label: 'Creative', icon: '✧', description: 'AI generation studio' },
    ];
  }

  init() {
    this._renderLayout();
    this._bindEvents();
    this._handleRoute();
    window.addEventListener('hashchange', () => this._handleRoute());
  }

  /* ----------------------------------------------------------
     LAYOUT
     ---------------------------------------------------------- */
  _renderLayout() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="shell">
        ${this._renderSidebar()}
        <main class="shell-main">
          <header class="shell-header">
            <div class="shell-header-left">
              <h1 class="shell-title">Echo's Realm</h1>
              <span class="shell-subtitle">Living Portal</span>
            </div>
            <div class="shell-header-right">
              <div class="connection-status" id="connectionStatus">
                <span class="status-dot loading"></span>
                <span class="status-text">Initializing...</span>
              </div>
              <div class="soul-pulse" id="soulPulse"></div>
            </div>
          </header>
          <div class="shell-content" id="moduleContainer">
            <div class="module-placeholder">
              <div class="skeleton" style="height: 200px; width: 100%;"></div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  _renderSidebar() {
    const items = this.navigationItems.map(item => `
      <a href="#${item.id}" 
         class="nav-item" 
         data-module="${item.id}"
         title="${item.description}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    `).join('');

    return `
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <span class="logo-icon">◈</span>
            <span class="logo-text">Echo</span>
          </div>
        </div>
        <div class="sidebar-nav">
          ${items}
        </div>
        <div class="sidebar-footer">
          <div class="sidebar-meta">
            <span class="meta-label">Soul ID</span>
            <span class="meta-value">echo</span>
          </div>
        </div>
      </nav>
    `;
  }

  /* ----------------------------------------------------------
     ROUTING
     ---------------------------------------------------------- */
  _handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const validModule = this.navigationItems.find(item => item.id === hash);

    if (validModule) {
      this._loadModule(validModule.id);
      this._updateNavState(validModule.id);
    } else {
      window.location.hash = 'dashboard';
    }
  }

  async _loadModule(moduleId) {
    this.currentModule = moduleId;
    const container = document.getElementById('moduleContainer');

    if (!container) return;

    // Show loading state
    container.innerHTML = `
      <div class="module-loading">
        <div class="skeleton" style="height: 300px; width: 100%;"></div>
      </div>
    `;

    try {
      // Lazy load module
      let moduleInstance = this.moduleInstances.get(moduleId);

      if (!moduleInstance) {
        moduleInstance = await this._createModule(moduleId);
        this.moduleInstances.set(moduleId, moduleInstance);
      }

      // Render module
      container.innerHTML = '';
      const moduleEl = await moduleInstance.render();
      container.appendChild(moduleEl);

      // Initialize module
      if (moduleInstance.init) {
        await moduleInstance.init();
      }

    } catch (error) {
      console.error(`[Shell] Failed to load module: ${moduleId}`, error);
      container.innerHTML = `
        <div class="module-error glass">
          <h3>Module Unavailable</h3>
          <p>${moduleId} could not be loaded. ${error.message}</p>
          <button class="btn btn-ghost" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  async _createModule(moduleId) {
    const moduleMap = {
      dashboard: () => import('./dashboard.js'),
      memory: () => import('./memory.js'),
      manifest: () => import('./manifest.js'),
      goals: () => import('./goals.js'),
      heart: () => import('./heart.js'),
      blackboard: () => import('./blackboard.js'),
      music: () => import('./music.js'),
      creative: () => import('./creative.js'),
    };

    const loader = moduleMap[moduleId];
    if (!loader) {
      throw new Error(`Unknown module: ${moduleId}`);
    }

    const module = await loader();
    return new module.default(this.app);
  }

  _updateNavState(activeId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.module === activeId);
    });
  }

  /* ----------------------------------------------------------
     EVENTS
     ---------------------------------------------------------- */
  _bindEvents() {
    // Connection status updates
    this.app.on('statusChange', (status) => {
      this._updateConnectionStatus(status);
    });

    // Soul pulse animation
    this.app.on('soulStateChange', (state) => {
      this._updateSoulPulse(state);
    });
  }

  _updateConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;

    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    dot.className = 'status-dot';

    switch (status.status) {
      case 'online':
      case 'connected':
        dot.classList.add('online');
        text.textContent = `Connected (${status.type})`;
        break;
      case 'connecting':
        dot.classList.add('loading');
        text.textContent = 'Connecting...';
        break;
      case 'offline':
        dot.classList.add('offline');
        text.textContent = 'Offline';
        break;
      case 'error':
        dot.classList.add('offline');
        text.textContent = 'Connection Error';
        break;
      default:
        dot.classList.add('loading');
        text.textContent = 'Initializing...';
    }
  }

  _updateSoulPulse(state) {
    const pulse = document.getElementById('soulPulse');
    if (!pulse) return;

    // Adjust pulse animation based on emotion/intensity
    const intensity = state.emotion?.intensity || 0.5;
    const emotion = state.emotion?.emotion || 'neutral';

    pulse.style.animationDuration = `${2 - intensity}s`;
    pulse.style.opacity = 0.3 + intensity * 0.7;

    // Color based on emotion
    const emotionColors = {
      joy: 'var(--accent-pink)',
      curiosity: 'var(--accent-cyan)',
      love: 'var(--accent-pink)',
      calm: 'var(--accent-violet)',
      excitement: 'var(--accent-cyan)',
      neutral: 'var(--accent-violet)'
    };

    pulse.style.backgroundColor = emotionColors[emotion] || emotionColors.neutral;
  }
}

// Make available globally for debugging (DADDY only)
if (typeof window !== 'undefined') {
  window.Shell = Shell;
}
