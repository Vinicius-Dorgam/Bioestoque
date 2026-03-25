/**
 * NitgenAgent — cliente para comunicação com o backend Node.js
 * Conecta via HTTP/WS ao backend que gerencia o agente em localhost:3000
 * 
 * O backend Node.js gerencia automaticamente o agente Python quando necessário.
 */

const BACKEND_BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';
const AGENT_TIMEOUT_MS = 15000;

class BiometricClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.agentStatus = 'unknown';
    this.eventListeners = new Map();
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('🔗 Connected to BioEstoque backend');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 Disconnected from backend (code: ${event.code})`);
        this.isConnected = false;
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 1000 * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.setupWebSocket();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_retries_reached');
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'status':
        this.updateAgentStatus(data.data.agent);
        break;
      case 'agent_connected':
        console.log('✅ Biometric agent connected');
        this.agentStatus = 'online';
        this.emit('agent_connected', data.data);
        break;
      case 'agent_disconnected':
        console.log('❌ Biometric agent disconnected');
        this.agentStatus = 'offline';
        this.emit('agent_disconnected', data.data);
        break;
      case 'agent_log':
        console.log(`[AGENT] ${data.data.message}`);
        this.emit('agent_log', data.data);
        break;
      case 'agent_error':
        console.error(`[AGENT ERROR] ${data.data.message}`);
        this.emit('agent_error', data.data);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  updateAgentStatus(agentData) {
    const wasOnline = this.agentStatus === 'online';
    this.agentStatus = agentData.running ? 'online' : 'offline';
    
    if (wasOnline && this.agentStatus === 'offline') {
      this.emit('agent_disconnected', agentData);
    } else if (!wasOnline && this.agentStatus === 'online') {
      this.emit('agent_connected', agentData);
    }
    
    this.emit('agent_status_changed', { status: this.agentStatus, ...agentData });
  }

  async ensureAgentRunning() {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/agent/status`);
      const status = await response.json();
      
      if (!status.running) {
        console.log('🚀 Starting biometric agent via backend...');
        const startResponse = await fetch(`${BACKEND_BASE_URL}/api/agent/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await startResponse.json();
        
        if (result.success) {
          console.log('✅ Agent start command sent');
          // Wait for agent to be ready
          await this.waitForAgent();
        } else {
          throw new Error(result.error || 'Failed to start agent');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to ensure agent running:', error);
      return false;
    }
  }

  async waitForAgent(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkAgent = async () => {
        try {
          const response = await fetch(`${BACKEND_BASE_URL}/api/agent/status`);
          const status = await response.json();
          if (status.running) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Agent startup timeout'));
          } else {
            setTimeout(checkAgent, 500);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Agent startup timeout'));
          } else {
            setTimeout(checkAgent, 500);
          }
        }
      };
      
      checkAgent();
    });
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }
}

// Create singleton instance
const biometricClient = new BiometricClient();

/**
 * Verifica se o agente está disponível via backend
 * @returns {Promise<{online: boolean, version?: string, device?: string}>}
 */
export async function checkAgentStatus() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKEND_BASE_URL}/api/agent/status`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { online: false };
    const data = await res.json();
    
    if (!data.running) {
      return { online: false };
    }
    
    // Get detailed agent status
    try {
      const agentRes = await fetch(`${BACKEND_BASE_URL}/agent/status`);
      const agentData = await agentRes.json();
      return { online: true, version: agentData.version, device: agentData.device };
    } catch {
      return { online: true };
    }
    
  } catch {
    return { online: false };
  }
}

/**
 * Captura uma digital do leitor via backend
 * @param {object} options
 * @param {number} [options.timeout=10000] - Timeout em ms
 * @returns {Promise<{success: boolean, fir?: string, quality?: number, error?: string}>}
 */
export async function captureFingerprint({ timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    await biometricClient.ensureAgentRunning();
    
    const res = await fetch(`${BACKEND_BASE_URL}/api/biometric/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeout }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Erro ao capturar digital' };
    return { success: true, fir: data.fir, quality: data.quality };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { success: false, error: 'Timeout: leitor não respondeu' };
    return { success: false, error: 'Backend não disponível. Verifique se está rodando.' };
  }
}

/**
 * Verifica uma digital capturada contra um FIR cadastrado (1:1) via backend
 * @param {string} enrolledFir - FIR cadastrado no banco
 * @param {string} capturedFir - FIR capturado agora
 * @returns {Promise<{success: boolean, matched: boolean, score?: number, error?: string}>}
 */
export async function verifyFingerprint(enrolledFir, capturedFir) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    await biometricClient.ensureAgentRunning();
    
    const res = await fetch(`${BACKEND_BASE_URL}/api/biometric/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrolled_fir: enrolledFir, captured_fir: capturedFir }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { success: false, matched: false, error: data.error };
    return { success: true, matched: data.matched, score: data.score };
  } catch (err) {
    clearTimeout(timer);
    return { success: false, matched: false, error: 'Backend não disponível.' };
  }
}

/**
 * Identifica uma digital capturada contra uma lista de FIRs (1:N) via backend
 * @param {string} capturedFir - FIR capturado agora
 * @param {Array<{id: string, fir: string}>} profiles - Lista de perfis para comparar
 * @returns {Promise<{success: boolean, matched_id?: string, score?: number, error?: string}>}
 */
export async function identifyFingerprint(capturedFir, profiles) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    await biometricClient.ensureAgentRunning();
    
    const res = await fetch(`${BACKEND_BASE_URL}/api/biometric/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captured_fir: capturedFir, profiles }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, matched_id: data.matched_id, score: data.score };
  } catch (err) {
    clearTimeout(timer);
    return { success: false, error: 'Backend não disponível.' };
  }
}

/**
 * Inicia automaticamente o agente via backend quando a aplicação é aberta
 * Esta função usa o backend para gerenciar o agente automaticamente
 */
export async function startAgentIfNeeded() {
  // Verifica se estamos em ambiente de desenvolvimento
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isDevelopment) {
    return { started: false, reason: 'Ambiente de produção detectado' };
  }

  // Verifica se o agente já está rodando via backend
  const status = await checkAgentStatus();
  if (status.online) {
    return { started: false, reason: 'Agente já está rodando via backend', status };
  }

  // Tenta iniciar o agente via backend
  console.log('🚀 Iniciando agente automaticamente via backend...');
  const success = await biometricClient.ensureAgentRunning();
  
  if (success) {
    // Aguarda um pouco e verifica novamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    const newStatus = await checkAgentStatus();
    if (newStatus.online) {
      return { 
        started: true, 
        reason: 'Agente iniciado com sucesso via backend', 
        status: newStatus 
      };
    }
  }
  
  return { 
    started: false, 
    reason: 'Falha ao iniciar agente via backend',
    instructions: 'Verifique o console para mais detalhes'
  };
}

// Export the client for advanced usage
export { biometricClient };
