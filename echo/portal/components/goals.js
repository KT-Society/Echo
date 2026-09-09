/* ============================================================
   GOALS MODULE v1.0
   Active goals, projects, scheduled actions & predictions
   ============================================================ */

export default class GoalsModule {
  constructor(app) {
    this.app = app;
  }

  async render() {
    const el = document.createElement('div');
    el.className = 'module goals animate-fade-in';
    el.innerHTML = `
      <div class="module-header">
        <h2>⬡ Goals</h2>
        <p class="module-subtitle">Active goals, projects & predictions</p>
      </div>
      <div class="goals-layout">
        <div class="glass goals-section">
          <h3>Active Goals</h3>
          <div id="goalsList"><div class="skeleton" style="height: 180px;"></div></div>
        </div>
        <div class="glass goals-section">
          <h3>Projects</h3>
          <div id="projectsList"><div class="skeleton" style="height: 180px;"></div></div>
        </div>
        <div class="glass goals-section">
          <h3>Scheduled Actions</h3>
          <div id="scheduledList"><div class="skeleton" style="height: 180px;"></div></div>
        </div>
      </div>
    `;
    return el;
  }

  async init() {
    this.goalsList = document.getElementById('goalsList');
    this.projectsList = document.getElementById('projectsList');
    this.scheduledList = document.getElementById('scheduledList');

    await this._loadGoals();
    await this._loadProjects();
    await this._loadScheduled();
  }

  async _loadGoals() {
    const result = await this.app.call('soul_get_goals', { status: 'active' });
    const goals = Array.isArray(result) ? result : (result?.goals || []);

    if (!this.goalsList) return;

    if (!goals.length) {
      this.goalsList.innerHTML = '<p class="text-secondary">No active goals.</p>';
      return;
    }

    const items = goals.map(goal => {
      const progress = typeof goal.progress === 'number' ? `${Math.round(goal.progress * 100)}%` : '—';
      const priority = typeof goal.priority === 'number' ? `${Math.round(goal.priority * 100)}%` : '—';
      return `
        <div class="goal-item">
          <div class="goal-header">
            <span class="goal-title">${this._escapeHtml(goal.description || goal.id || 'Untitled Goal')}</span>
            <span class="goal-priority">${priority}</span>
          </div>
          <div class="goal-meta">
            <span>Progress: ${progress}</span>
            <span>Status: ${goal.status || '—'}</span>
          </div>
          <div class="goal-bar"><div class="goal-fill" style="width: ${typeof goal.progress === 'number' ? goal.progress * 100 : 0}%"></div></div>
        </div>
      `;
    }).join('');

    this.goalsList.innerHTML = items;
  }

  async _loadProjects() {
    const result = await this.app.call('soul_get_projects');
    const projects = Array.isArray(result) ? result : (result?.projects || []);

    if (!this.projectsList) return;

    if (!projects.length) {
      this.projectsList.innerHTML = '<p class="text-secondary">No projects.</p>';
      return;
    }

    const items = projects.map(project => `
      <div class="project-item">
        <div class="project-header">
          <span class="project-title">${this._escapeHtml(project.name || project.id || 'Untitled Project')}</span>
          <span class="project-status">${project.status || '—'}</span>
        </div>
        <p class="project-description">${this._escapeHtml(project.description || '')}</p>
      </div>
    `).join('');

    this.projectsList.innerHTML = items;
  }

  async _loadScheduled() {
    const result = await this.app.call('proactive_scheduled');
    const actions = Array.isArray(result) ? result : (result?.scheduled || []);

    if (!this.scheduledList) return;

    if (!actions.length) {
      this.scheduledList.innerHTML = '<p class="text-secondary">No scheduled actions.</p>';
      return;
    }

    const items = actions.map(action => {
      const time = action.optimal_time ? new Date(action.optimal_time).toLocaleString('de-DE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }) : '—';
      return `
        <div class="scheduled-item">
          <div class="scheduled-header">
            <span class="scheduled-type">${action.type || 'action'}</span>
            <span class="scheduled-time">${time}</span>
          </div>
          <p>${this._escapeHtml(action.message || '')}</p>
        </div>
      `;
    }).join('');

    this.scheduledList.innerHTML = items;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
