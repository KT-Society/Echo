/* ============================================================
   GOALS MODULE — Placeholder
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
      <div class="goals-list">
        <div class="skeleton" style="height: 200px;"></div>
      </div>
    `;
    return el;
  }

  async init() {
    console.log('[Goals] Module initialized (stub)');
  }
}
