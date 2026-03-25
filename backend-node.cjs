const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Polyfill for fetch in Node.js - MUST be at global scope
const { fetch, Request, Response } = require('node-fetch');
global.fetch = fetch;
global.Request = Request;
global.Response = Response;

class BioEstoqueBackend {
  constructor() {
    // Store fetch in class property to avoid scope issues
    this.fetch = require('node-fetch').default;
    
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.agentProcess = null;
    this.startTime = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:3000', 'http://127.0.0.1:5174'],
      credentials: true
    }));
    
    // Logging
    this.app.use(morgan('combined'));
    
    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        agent: {
          running: this.agentProcess !== null,
          pid: this.agentProcess?.pid,
          uptime: this.agentProcess ? Date.now() - this.startTime : 0
        }
      });
    });

    // Agent management
    this.app.get('/api/agent/status', (req, res) => {
      res.json({
        running: this.agentProcess !== null,
        pid: this.agentProcess?.pid,
        uptime: this.agentProcess ? Date.now() - this.startTime : 0,
        url: 'http://localhost:8080'
      });
    });

    this.app.post('/api/agent/start', async (req, res) => {
      try {
        await this.startAgent();
        res.json({ success: true, message: 'Agent started successfully' });
      } catch (error) {
        console.error('Failed to start agent:', error);
        res.json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/agent/stop', async (req, res) => {
      try {
        await this.stopAgent();
        res.json({ success: true, message: 'Agent stopped successfully' });
      } catch (error) {
        console.error('Failed to stop agent:', error);
        res.json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/agent/restart', async (req, res) => {
      try {
        await this.stopAgent();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.startAgent();
        res.json({ success: true, message: 'Agent restarted successfully' });
      } catch (error) {
        console.error('Failed to restart agent:', error);
        res.json({ success: false, error: error.message });
      }
    });

    // Biometric operations (proxy to agent)
    this.app.post('/api/biometric/capture', this.handleCapture.bind(this));
    this.app.post('/api/biometric/verify', this.handleVerify.bind(this));
    this.app.post('/api/biometric/identify', this.handleIdentify.bind(this));

    // Serve static React app
    this.app.use(express.static(path.join(__dirname, 'dist')));
    
    // Direct proxy to agent (fallback)
    this.app.use('/agent', this.proxyToAgent.bind(this));
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
      
      // Send current status
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          agent: {
            running: this.agentProcess !== null,
            pid: this.agentProcess?.pid
          }
        }
      }));
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async startAgent() {
    if (this.agentProcess) {
      console.log('Agent already running');
      return;
    }

    return new Promise((resolve, reject) => {
      console.log('Starting biometric agent...');
      
      // Try to start Python agent first (existing)
      this.agentProcess = spawn('python', ['agent.py'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      this.startTime = Date.now();

      this.agentProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[AGENT] ${output}`);
          
          // Broadcast to WebSocket clients
          this.broadcast({
            type: 'agent_log',
            data: { message: output, timestamp: Date.now() }
          });
        }
      });

      this.agentProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.error(`[AGENT ERROR] ${output}`);
          
          this.broadcast({
            type: 'agent_error',
            data: { message: output, timestamp: Date.now() }
          });
        }
      });

      this.agentProcess.on('close', (code) => {
        console.log(`Agent process exited with code ${code}`);
        this.agentProcess = null;
        this.startTime = null;
        
        this.broadcast({
          type: 'agent_disconnected',
          data: { code, timestamp: Date.now() }
        });
      });

      this.agentProcess.on('error', (error) => {
        console.error('Agent process error:', error);
        this.agentProcess = null;
        this.startTime = null;
        reject(error);
      });

      // Wait a bit and check if started successfully
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:8080/status');
          if (response.ok) {
            console.log('✅ Agent started successfully');
            this.broadcast({
              type: 'agent_connected',
              data: { pid: this.agentProcess.pid, timestamp: Date.now() }
            });
            resolve();
          } else {
            reject(new Error('Agent failed to respond'));
          }
        } catch (error) {
          reject(new Error('Agent not responding'));
        }
      }, 3000);
    });
  }

  async stopAgent() {
    if (!this.agentProcess) {
      console.log('Agent not running');
      return;
    }

    return new Promise((resolve) => {
      console.log('Stopping agent...');
      
      this.agentProcess.on('close', () => {
        console.log('✅ Agent stopped');
        resolve();
      });

      this.agentProcess.kill('SIGTERM');
      
      // Force kill if doesn't stop
      setTimeout(() => {
        if (this.agentProcess) {
          this.agentProcess.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  async handleCapture(req, res) {
    if (!this.agentProcess) {
      return res.json({ success: false, error: 'Agent not running' });
    }

    try {
      const result = await this.proxyRequest('POST', '/capture', req.body);
      res.json(result);
    } catch (error) {
      console.error('Capture failed:', error);
      res.json({ success: false, error: error.message });
    }
  }

  async handleVerify(req, res) {
    if (!this.agentProcess) {
      return res.json({ success: false, error: 'Agent not running' });
    }

    try {
      const result = await this.proxyRequest('POST', '/verify', req.body);
      res.json(result);
    } catch (error) {
      console.error('Verify failed:', error);
      res.json({ success: false, error: error.message });
    }
  }

  async handleIdentify(req, res) {
    if (!this.agentProcess) {
      return res.json({ success: false, error: 'Agent not running' });
    }

    try {
      const result = await this.proxyRequest('POST', '/identify', req.body);
      res.json(result);
    } catch (error) {
      console.error('Identify failed:', error);
      res.json({ success: false, error: error.message });
    }
  }

  async proxyToAgent(req, res) {
    if (!this.agentProcess) {
      return res.status(503).json({ error: 'Agent not running' });
    }

    try {
      const agentPath = req.path.replace('/agent', '');
      const result = await this.proxyRequest(req.method, agentPath, req.body);
      res.json(result);
    } catch (error) {
      console.error('Proxy failed:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async proxyRequest(method, path, body) {
    // Use class fetch property to avoid scope issues
    const url = `http://localhost:8080${path}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await this.fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Agent responded with ${response.status}`);
    }
    
    return data;
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  start(port = 3000) {
    this.server.listen(port, () => {
      console.log('='.repeat(60));
      console.log('🚀 BioEstoque Backend Server');
      console.log('='.repeat(60));
      console.log(`🌐 Server running on http://localhost:${port}`);
      console.log('📡 WebSocket enabled');
      console.log('🔧 Agent management enabled');
      console.log('📱 React app served');
      console.log('='.repeat(60));
      
      // Auto-start agent
      this.startAgent().catch(error => {
        console.error('Failed to auto-start agent:', error);
      });
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      this.stopAgent().then(() => {
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      this.stopAgent().then(() => {
        process.exit(0);
      });
    });
  }
}

// Start the backend
const backend = new BioEstoqueBackend();
backend.start(3000);
