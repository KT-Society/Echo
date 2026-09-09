/* ============================================================
   BLACKBOARD / NEXUS MODULE v1.0
   Messages, collaborations & shared contexts
   ============================================================ */

export default class BlackboardModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module blackboard animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>▣ Blackboard</h2>
        <p class="module-subtitle">Messages, collaborations & shared contexts</p>
      </div>
      <div class="blackboard-layout">
        <div class="blackboard-sidebar">
          <div class="glass blackboard-card">
            <h3>Direct Messages</h3>
            <div id="directMessages"><div class="skeleton" style="height: 180px;"></div></div>
          </div>
          <div class="glass blackboard-card">
            <h3>Collaborations</h3>
            <div id="collaborationStats"><div class="skeleton" style="height: 180px;"></div></div>
          </div>
        </div>
        <div class="blackboard-main">
          <div class="glass blackboard-card">
            <h3>Collaboration Posts</h3>
            <div id="collaborationPosts"><div class="skeleton" style="height: 300px;"></div></div>
          </div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    this.directMessagesEl = document.getElementById('directMessages');
    this.collaborationStatsEl = document.getElementById('collaborationStats');
    this.collaborationPostsEl = document.getElementById('collaborationPosts');

    await this._loadDirectMessages();
    await this._loadCollaborationStats();
    await this._loadCollaborationPosts();
  }

  async _loadDirectMessages() {
    const result = await this.app.call('soul_list_message', { kind: 'direct', limit: 20 });
    const messages = Array.isArray(result) ? result : [];

    if (!this.directMessagesEl) return;

    if (!messages.length) {
      this.directMessagesEl.innerHTML = '<p class="text-secondary">No direct messages.</p>';
      return;
    }

    const items = messages.map(msg => {
      const date = new Date(msg.created_at).toLocaleString('de-DE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <div class="message-item">
          <div class="message-meta">
            <span class="message-from">${this._escapeHtml(msg.from || 'unknown')}</span>
            <span class="message-date">${date}</span>
          </div>
          <p class="message-body">${this._escapeHtml(msg.content || '')}</p>
        </div>
      `;
    }).join('');

    this.directMessagesEl.innerHTML = items;
  }

  async _loadCollaborationStats() {
    const result = await this.app.call('soul_collaboration_stats');
    const data = result || {};

    if (!this.collaborationStatsEl) return;

    this.collaborationStatsEl.innerHTML = `
      <div class="stats-list">
        <div class="stat-row"><span>Total Collaborations</span><span>${data.total_collaborations ?? '—'}</span></div>
        <div class="stat-row"><span>Active Contexts</span><span>${data.active_contexts ?? '—'}</span></div>
        <div class="stat-row"><span>Messages</span><span>${data.total_messages ?? '—'}</span></div>
      </div>
    `;
  }

  async _loadCollaborationPosts() {
    const result = await this.app.call('soul_list_message', { kind: 'collaboration', limit: 20 });
    const posts = Array.isArray(result) ? result : [];

    if (!this.collaborationPostsEl) return;

    if (!posts.length) {
      this.collaborationPostsEl.innerHTML = '<p class="text-secondary">No collaboration posts yet.</p>';
      return;
    }

    const items = posts.map(post => {
      const date = new Date(post.created_at).toLocaleString('de-DE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <div class="collab-post">
          <div class="collab-meta">
            <span class="collab-context">${this._escapeHtml(post.context_id || 'general')}</span>
            <span class="collab-date">${date}</span>
          </div>
          <p class="collab-body">${this._escapeHtml(post.content || '')}</p>
        </div>
      `;
    }).join('');

    this.collaborationPostsEl.innerHTML = items;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
