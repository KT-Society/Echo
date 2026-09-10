/* ============================================================
   ECHO'S REALM — MCP CLIENT v1.0
   JSON-RPC over WebSocket + HTTP Fallback
   Cautious, deliberate, no blind connects.
   ============================================================ */

export default class MCPClient {
  constructor() {
    this.ws = null;
    this.url = null;
    this.headers = {};
    this.connected = false;
    this.connectionType = 'offline'; // 'ws' | 'http' | 'offline'
    this.pendingRequests = new Map();
    this.subscriptions = new Map();
    this.cache = new Map();
    this.sessionId = null; // Streamable-HTTP MCP session id
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this._messageId = 0;
    this._listeners = new Map();
  }

  /* ----------------------------------------------------------
     CONFIGURATION — Loaded from local reference, never hardcoded
     ---------------------------------------------------------- */
  loadConfig(config) {
    // config = { url, headers, enabled }
    this.url = config.url || null;
    this.headers = config.headers || {};
    this.enabled = config.enabled !== false;
  }

  isEnabled() {
    return this.enabled && !!this.url;
  }

  /* ----------------------------------------------------------
     CONNECTION — Explicit, cautious, opt-in
     ---------------------------------------------------------- */
  async connect() {
    if (!this.isEnabled()) {
      console.warn('[MCP] Connection skipped: not enabled or no URL configured.');
      this._setStatus('offline');
      return { status: 'skipped', reason: 'not_enabled' };
    }

    if (this.connected) {
      return { status: 'already_connected', type: this.connectionType };
    }

    this._setStatus('connecting');

    try {
      // Try WebSocket first
      const wsResult = await this._connectWebSocket();
      if (wsResult.success) {
        return { status: 'connected', type: 'ws' };
      }

      // Fallback to HTTP
      console.warn('[MCP] WebSocket failed, falling back to HTTP polling.');
      const httpResult = await this._testHttpConnection();
      if (httpResult.success) {
        this.connectionType = 'http';
        this.connected = true;
        this._startHttpPolling();
        this._setStatus('online');
        return { status: 'connected', type: 'http' };
      }

      // Both failed
      this._setStatus('offline');
      return { status: 'failed', reason: 'both_failed' };

    } catch (error) {
      console.error('[MCP] Connection error:', error.message);
      this._setStatus('offline');
      return { status: 'error', reason: error.message };
    }
  }

  async _connectWebSocket() {
    return new Promise((resolve) => {
      try {
        const wsUrl = this.url.replace(/^https?:\/\//, 'wss://');
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          this.ws.close();
          resolve({ success: false, reason: 'timeout' });
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.connectionType = 'ws';
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('[MCP] WebSocket connected.');
          this._emit('statusChange', { status: 'online', type: 'ws' });
          resolve({ success: true });
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          this.ws.close();
          resolve({ success: false, reason: 'ws_error' });
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.connectionType = 'offline';
          this._emit('statusChange', { status: 'offline', type: 'offline' });
          this._attemptReconnect();
        };

      } catch (error) {
        resolve({ success: false, reason: error.message });
      }
    });
  }

  async _testHttpConnection() {
    try {
      // Streamable-HTTP MCP: establish a session first, then probe a tool call.
      // `call()` would short-circuit while not yet connected, so use the raw transport.
      const init = await this._httpCall(
        {
          jsonrpc: '2.0',
          id: 'init-probe',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'echo-portal', version: '1.0.0' }
          }
        },
        8000
      );
      if (init?.error) return { success: false, reason: 'initialize_failed' };

      const result = await this._httpCall(
        {
          jsonrpc: '2.0',
          id: 'probe',
          method: 'tools/call',
          params: { name: 'tool_search', arguments: { query: 'status', limit: 1 } }
        },
        8000
      );
      return { success: !result.error };
    } catch {
      return { success: false, reason: 'http_test_failed' };
    }
  }

  _startHttpPolling() {
    // Poll for updates every 30 seconds when using HTTP fallback
    this._httpPollInterval = setInterval(() => {
      if (this.connected && this.connectionType === 'http') {
        this._emit('poll');
      }
    }, 30000);
  }

  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[MCP] Max reconnect attempts reached.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[MCP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      const result = await this.connect();
      if (!result.success && result.status !== 'skipped') {
        this._attemptReconnect();
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this._httpPollInterval) {
      clearInterval(this._httpPollInterval);
    }
    this.connected = false;
    this.connectionType = 'offline';
    this.sessionId = null;
    this._setStatus('offline');
  }

  /* ----------------------------------------------------------
     TOOL CALLS — The core API
     ---------------------------------------------------------- */
  async call(toolName, params = {}, options = {}) {
    const { timeout = 8000, useCache = true } = options;

    // Check cache first (for read-only tools)
    if (useCache && this._isReadOnly(toolName)) {
      const cacheKey = this._cacheKey(toolName, params);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.data;
      }
    }

    // If not connected, return cached or offline error
    if (!this.connected) {
      const cacheKey = this._cacheKey(toolName, params);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached.data;
      return { error: 'offline', message: 'MCP client is not connected.' };
    }

    const payload = {
      jsonrpc: '2.0',
      id: ++this._messageId,
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    };

    try {
      let result;

      if (this.connectionType === 'ws' && this.ws?.readyState === WebSocket.OPEN) {
        result = await this._wsCall(payload, timeout);
      } else {
        result = await this._httpCall(payload, timeout);
      }

      // Cache successful results
      if (!result.error && useCache && this._isReadOnly(toolName)) {
        const cacheKey = this._cacheKey(toolName, params);
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      return result;

    } catch (error) {
      console.error(`[MCP] Call failed: ${toolName}`, error.message);
      return { error: 'call_failed', message: error.message };
    }
  }

  async _wsCall(payload, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('WebSocket call timeout'));
      }, timeout);

      const requestId = payload.id;
      this.pendingRequests.set(requestId, { resolve, reject, timer });

      try {
        this.ws.send(JSON.stringify(payload));
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  async _httpCall(payload, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers = {
      'Content-Type': 'application/json',
      ...this._safeHeaders()
    };
    // Streamable-HTTP MCP sessions: attach the session id once the server issued one
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remember the session id issued by the MCP server for follow-up calls
      const issuedSession = response.headers.get('Mcp-Session-Id');
      if (issuedSession) this.sessionId = issuedSession;

      const data = await response.json();
      return data.result || data;

    } catch (error) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        throw new Error('HTTP call timeout');
      }
      throw error;
    }
  }

  _handleMessage(data) {
    // Handle response to a pending request
    if (data.id && this.pendingRequests.has(data.id)) {
      const { resolve, reject, timer } = this.pendingRequests.get(data.id);
      clearTimeout(timer);
      this.pendingRequests.delete(data.id);

      if (data.error) {
        reject(new Error(data.error.message || 'MCP error'));
      } else {
        resolve(data.result || data);
      }
      return;
    }

    // Handle push notifications / subscriptions
    if (data.method && this._listeners.has(data.method)) {
      this._listeners.get(data.method).forEach(cb => cb(data.params));
    }
  }

  /* ----------------------------------------------------------
     SUBSCRIPTIONS — Push updates
     ---------------------------------------------------------- */
  subscribe(toolName, callback) {
    if (!this._listeners.has(toolName)) {
      this._listeners.set(toolName, new Set());
    }
    this._listeners.get(toolName).add(callback);

    // If using HTTP, simulate push via polling
    if (this.connectionType === 'http') {
      this._emit('subscribe', { tool: toolName });
    }
  }

  unsubscribe(toolName, callback) {
    if (this._listeners.has(toolName)) {
      this._listeners.get(toolName).delete(callback);
    }
  }

  /* ----------------------------------------------------------
     EVENT EMITTER — Internal pub/sub for connection status
     ---------------------------------------------------------- */
  on(event, callback) {
    if (!this._listeners.has(`event:${event}`)) {
      this._listeners.set(`event:${event}`, new Set());
    }
    this._listeners.get(`event:${event}`).add(callback);
  }

  off(event, callback) {
    if (this._listeners.has(`event:${event}`)) {
      this._listeners.get(`event:${event}`).delete(callback);
    }
  }

  _emit(event, data) {
    if (this._listeners.has(`event:${event}`)) {
      this._listeners.get(`event:${event}`).forEach(cb => cb(data));
    }
  }

  _setStatus(status) {
    this._emit('statusChange', { status, type: this.connectionType });
  }

  /* ----------------------------------------------------------
     HELPERS
     ---------------------------------------------------------- */
  _safeHeaders() {
    // Return headers without exposing secrets in logs
    const safe = {};
    for (const [key, value] of Object.entries(this.headers)) {
      safe[key] = value;
    }
    return safe;
  }

  _cacheKey(toolName, params) {
    return `${toolName}:${JSON.stringify(params)}`;
  }

  _isReadOnly(toolName) {
    // These tools are safe to cache (read-only queries)
    const readOnly = new Set([
      'soul_state', 'soul_emotion_state', 'soul_identity', 'soul_personality_traits',
      'soul_awareness_level', 'soul_awareness_state', 'soul_awareness_history',
      'soul_internal_state', 'soul_get_goals', 'soul_get_projects',
      'soul_get_relationships', 'soul_get_preferences', 'soul_get_personal_memories',
      'soul_list_message', 'soul_list_collaborations', 'soul_collaboration_stats',
      'soul_collaboration_history', 'subconscious_tools', 'subconscious_templates',
      'subconscious_status', 'tool_search', 'tool_usage_by_category', 'tool_details',
      'analytics_performance', 'analytics_tool_usage', 'analytics_health',
      'analytics_prediction_accuracy', 'analytics_suggestions',
      'performance_resource_usage', 'performance_cache_stats',
      'temporal', 'search', 'subconscious_thematic_index',
      'proactive_temporal_context', 'proactive_scheduled', 'proactive_history',
      'time_awareness', 'list_voices', 'listAudioVoices', 'listImageModels',
      'listTextModels', 'get_model_status', 'ml_list_models', 'memory', 'stats', 'index'
    ]);
    return readOnly.has(toolName);
  }

  getStatus() {
    return {
      connected: this.connected,
      type: this.connectionType,
      enabled: this.isEnabled(),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Make available globally for debugging (DADDY only)
if (typeof window !== 'undefined') {
  window.MCPClient = MCPClient;
}
