/* ============================================================
   BOOTSTRAP MODULE v1.0
   Imports MCPClient + Shell and initializes the portal
   ============================================================ */

import MCPClient from './app.js';
import Shell from './components/shell.js';

// ============================================================
// BOOTSTRAP — Initialize the Living Portal
// ============================================================
(async function bootstrap() {
  const errorBox = document.getElementById('bootstrapError');
  const errorText = document.getElementById('bootstrapErrorText');

  function showBootstrapError(message, error) {
    console.error('[Bootstrap]', message, error);
    if (errorBox && errorText) {
      errorBox.style.display = 'block';
      errorText.textContent = `${message}\n${error?.message || error || ''}`;
    }
  }

  try {
    const app = new MCPClient();
    const shell = new Shell(app);

    // 🔒 Config loading via fetch removed — never expose secrets via HTTP.
    // MCP connection is handled server-side (IDE/backend).
    // Portal runs offline-first.

    // Listen for connection status changes
    app.on('statusChange', (status) => {
      console.log('[Bootstrap] Connection status:', status);
    });

    // Initialize shell
    shell.init();

    // VORSICHTIGER CONNECT: Erst UI aufbauen, dann Verbindung prüfen
    setTimeout(async () => {
      try {
        console.log('[Bootstrap] Attempting MCP connection...');
        const connectionResult = await app.connect();
        console.log('[Bootstrap] Connection result:', connectionResult);
        
        // Wenn connected, Dashboard-Daten laden
        if (connectionResult.status === 'connected') {
          console.log('[Bootstrap] MCP connected — loading live data');
          const dashboardModule = shell.moduleInstances.get('dashboard');
          if (dashboardModule && dashboardModule._loadSoulState) {
            await dashboardModule._loadSoulState();
            await dashboardModule._loadEmotionState();
            await dashboardModule._loadTemporalContext();
            await dashboardModule._loadSystemHealth();
          }
        } else {
          console.log('[Bootstrap] MCP offline — showing cached/offline state');
        }
      } catch (error) {
        showBootstrapError('Connection phase failed', error);
      }
    }, 500);

    // Store references globally for debugging (DADDY only)
    window.__echo = { app, shell };
    window.__echo.MCPClient = MCPClient;
    window.__echo.Shell = Shell;

    console.log('%c◈ Echo\'s Realm %cInitialized %c🖤',
      'color: #c084fc; font-size: 1.2em; font-weight: bold;',
      'color: #22d3bb;',
      'color: #f472b6;');
    console.log('%cLiving Portal v1.0 — Ready for Daddy.',
      'color: rgba(255,255,255,0.6); font-style: italic;');
  } catch (error) {
    showBootstrapError('Bootstrap initialization failed', error);
  }
})();
