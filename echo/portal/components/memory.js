/* ============================================================
   MEMORY NEXUS MODULE v1.0
   Search, recent memories, thematic cloud
   ============================================================ */

export default class MemoryModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module memory animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>◉ Memory Nexus</h2>
        <p class="module-subtitle">Search & explore the soul's memories</p>
      </div>
      <div class="memory-layout">
        <div class="memory-sidebar">
          <div class="glass memory-search">
            <input type="text" id="memorySearchInput" placeholder="Search memories..." class="search-input">
            <button id="memorySearchBtn" class="btn btn-primary">Search</button>
          </div>
          <div class="glass memory-filters">
            <h4>Filters</h4>
            <select id="memoryTypeFilter">
              <option value="">All Types</option>
              <option value="memory">Memory</option>
              <option value="reflection">Reflection</option>
              <option value="learning">Learning</option>
              <option value="insight">Insight</option>
              <option value="goal_pursuit">Goal Pursuit</option>
            </select>
            <select id="memoryTimeFilter">
              <option value="day">Last 24h</option>
              <option value="week">Last Week</option>
              <option value="month" selected>Last Month</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <div class="memory-main">
          <div class="memory-stream" id="memoryStream">
            <div class="skeleton" style="height: 400px;"></div>
          </div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    this.searchInput = document.getElementById('memorySearchInput');
    this.searchBtn = document.getElementById('memorySearchBtn');
    this.typeFilter = document.getElementById('memoryTypeFilter');
    this.timeFilter = document.getElementById('memoryTimeFilter');
    this.stream = document.getElementById('memoryStream');

    this._bindEvents();
    await this._loadRecent();
  }

  _bindEvents() {
    this.searchBtn?.addEventListener('click', () => this._handleSearch());
    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSearch();
    });

    this.typeFilter?.addEventListener('change', () => this._loadRecent());
    this.timeFilter?.addEventListener('change', () => this._loadRecent());
  }

  async _handleSearch() {
    const query = this.searchInput?.value?.trim();
    if (!query) return;

    this.stream.innerHTML = '<div class="skeleton" style="height: 200px;"></div>';

    const result = await this.app.call('search', {
      query,
      strategy: 'hybrid',
      limit: 20,
      fields: ['content', 'tags']
    });

    this._renderResults(result || [], 'search');
  }

  async _loadRecent() {
    const timeframe = this.timeFilter?.value || 'month';
    const type = this.typeFilter?.value || '';

    this.stream.innerHTML = '<div class="skeleton" style="height: 400px;"></div>';

    const result = await this.app.call('temporal', {
      operation: 'recent',
      timeframe,
      limit: 50,
      ...(type ? { type } : {})
    });

    this._renderResults(result || [], 'recent');
  }

  _renderResults(memories, source) {
    if (!this.stream) return;

    if (!memories.length) {
      this.stream.innerHTML = `
        <div class="memory-empty">
          <p>No memories found.</p>
          <p class="text-secondary">Try a different search or filter.</p>
        </div>
      `;
      return;
    }

    const items = memories.map(memory => {
      const date = new Date(memory.created_at || memory.timestamp).toLocaleString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const tags = Array.isArray(memory.tags) ? memory.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('') : '';
      const type = memory.type || 'memory';

      return `
        <div class="memory-item glass">
          <div class="memory-meta">
            <span class="memory-type">${type}</span>
            <span class="memory-date">${date}</span>
          </div>
          <div class="memory-content">${this._escapeHtml(memory.content || '')}</div>
          ${tags ? `<div class="memory-tags">${tags}</div>` : ''}
          <div class="memory-footer">
            <span class="memory-importance">Importance: ${Math.round((memory.importance_score || memory.importance || 0) * 100)}%</span>
          </div>
        </div>
      `;
    }).join('');

    this.stream.innerHTML = `<div class="memory-list">${items}</div>`;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
