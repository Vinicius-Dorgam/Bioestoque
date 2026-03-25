/**
 * BioEstoque Biometric Client - Node.js Backend Integration
 * Gerencia conexão com backend Node.js e reconexão automática
 */

class BiometricClient {
  constructor() {
    this.backendUrl = 'http://localhost:3000';
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.agentStatus = 'unknown';
    this.eventListeners = new Map();
    
    this.setupWebSocket();
    this.startStatusPolling();
  }

  setupWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:3000');
      
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
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
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

  startStatusPolling() {
    // Poll status every 10 seconds as fallback
    setInterval(async () => {
      if (!this.isConnected) {
        try {
          const status = await this.getAgentStatus();
          this.updateAgentStatus(status);
        } catch (error) {
          // Ignore polling errors when WebSocket is disconnected
        }
      }
    }, 10000);
  }

  async ensureAgentRunning() {
    try {
      const status = await this.getAgentStatus();
      
      if (!status.running) {
        console.log('🚀 Starting biometric agent...');
        const response = await fetch(`${this.backendUrl}/api/agent/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
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
          const status = await this.getAgentStatus();
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

  async getAgentStatus() {
    try {
      const response = await fetch(`${this.backendUrl}/api/agent/status`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('Failed to get agent status: ' + error.message);
    }
  }

  async captureFingerprint(options = {}) {
    await this.ensureAgentRunning();
    
    try {
      const response = await fetch(`${this.backendUrl}/api/biometric/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Capture failed');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Capture failed:', error);
      throw error;
    }
  }

  async verifyFingerprint(enrolledFir, capturedFir) {
    await this.ensureAgentRunning();
    
    try {
      const response = await fetch(`${this.backendUrl}/api/biometric/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrolled_fir: enrolledFir, captured_fir: capturedFir })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }

  async identifyFingerprint(capturedFir, profiles) {
    await this.ensureAgentRunning();
    
    try {
      const response = await fetch(`${this.backendUrl}/api/biometric/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captured_fir: capturedFir, profiles })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Identification failed');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Identification failed:', error);
      throw error;
    }
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

  // Utility methods
  isAgentOnline() {
    return this.agentStatus === 'online';
  }

  isBackendConnected() {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      backend: this.isConnected ? 'connected' : 'disconnected',
      agent: this.agentStatus,
      reconnectAttempts: this.reconnectAttempts
    };
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

// Export singleton instance
const biometricClient = new BiometricClient();
export default biometricClient;
