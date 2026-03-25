#!/usr/bin/env python3
"""
Backend server for BioEstoque with integrated agent management
This server provides both the web application and agent management
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import threading
import time
import requests
import sys
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Agent management
agent_process = None
agent_status = {
    'running': False,
    'pid': None,
    'start_time': None,
    'url': 'http://localhost:8080'
}

def check_agent_running():
    """Check if agent is already running"""
    try:
        response = requests.get(f"{agent_status['url']}/status", timeout=3)
        return response.status_code == 200
    except:
        return False

def start_agent():
    """Start the Nitgen agent"""
    global agent_process, agent_status
    
    if agent_status['running']:
        return True
    
    try:
        script_dir = Path(__file__).parent
        agent_script = script_dir / 'agent.py'
        
        if not agent_script.exists():
            print(f"❌ agent.py not found at {agent_script}")
            return False
        
        print("🚀 Starting Nitgen agent...")
        
        # Start agent in background
        if sys.platform == 'win32':
            agent_process = subprocess.Popen([
                sys.executable, str(agent_script)
            ], creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
        else:
            agent_process = subprocess.Popen([
                sys.executable, str(agent_script)
            ], start_new_session=True)
        
        # Wait for agent to start
        time.sleep(3)
        
        # Check if started successfully
        if check_agent_running():
            agent_status['running'] = True
            agent_status['pid'] = agent_process.pid
            agent_status['start_time'] = time.time()
            print("✅ Agent started successfully!")
            return True
        else:
            print("❌ Failed to start agent")
            return False
            
    except Exception as e:
        print(f"❌ Error starting agent: {e}")
        return False

def stop_agent():
    """Stop the Nitgen agent"""
    global agent_process, agent_status
    
    if not agent_status['running']:
        return True
    
    try:
        if agent_process:
            agent_process.terminate()
            agent_process.wait(timeout=5)
        
        agent_status['running'] = False
        agent_status['pid'] = None
        agent_status['start_time'] = None
        print("✅ Agent stopped")
        return True
        
    except Exception as e:
        print(f"❌ Error stopping agent: {e}")
        return False

# Backend API routes
@app.route('/api/agent/status')
def get_agent_status():
    """Get agent status"""
    is_running = check_agent_running()
    return jsonify({
        'running': is_running,
        'pid': agent_status['pid'],
        'start_time': agent_status['start_time'],
        'url': agent_status['url']
    })

@app.route('/api/agent/start', methods=['POST'])
def start_agent_endpoint():
    """Start agent endpoint"""
    success = start_agent()
    return jsonify({
        'success': success,
        'message': 'Agent started successfully' if success else 'Failed to start agent'
    })

@app.route('/api/agent/stop', methods=['POST'])
def stop_agent_endpoint():
    """Stop agent endpoint"""
    success = stop_agent()
    return jsonify({
        'success': success,
        'message': 'Agent stopped successfully' if success else 'Failed to stop agent'
    })

@app.route('/api/agent/restart', methods=['POST'])
def restart_agent_endpoint():
    """Restart agent endpoint"""
    stop_agent()
    time.sleep(1)
    success = start_agent()
    return jsonify({
        'success': success,
        'message': 'Agent restarted successfully' if success else 'Failed to restart agent'
    })

# Serve static files (React app)
@app.route('/')
@app.route('/<path:path>')
def serve_react(path=None):
    """Serve React application"""
    build_dir = Path(__file__).parent / 'dist'
    
    if path is None:
        # Serve index.html for root
        return send_from_directory(build_dir, 'index.html')
    
    # Try to serve requested file
    file_path = build_dir / path
    if file_path.exists():
        return send_from_directory(build_dir, path)
    
    # Fallback to index.html for React Router
    return send_from_directory(build_dir, 'index.html')

# Proxy agent requests
@app.route('/agent/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_agent(path):
    """Proxy requests to the agent"""
    if not check_agent_running():
        return jsonify({'error': 'Agent not running'}), 503
    
    try:
        url = f"{agent_status['url']}/{path}"
        
        if request.method == 'GET':
            response = requests.get(url, params=request.args)
        elif request.method == 'POST':
            response = requests.post(url, json=request.get_json())
        elif request.method == 'PUT':
            response = requests.put(url, json=request.get_json())
        elif request.method == 'DELETE':
            response = requests.delete(url)
        
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def main():
    """Main function to start the backend server"""
    print("=" * 60)
    print("🚀 BioEstoque Backend Server")
    print("=" * 60)
    print("📦 Serving React application")
    print("🔧 Managing Nitgen agent")
    print("🌐 Starting server...")
    
    # Auto-start agent
    print("\n🤖 Auto-starting Nitgen agent...")
    if start_agent():
        print("✅ Agent ready!")
    else:
        print("⚠️  Agent failed to start - will be available manually")
    
    print(f"\n🌐 Backend server starting on port 3000")
    print(f"📱 React app: http://localhost:3000")
    print(f"🔧 Agent API: http://localhost:3000/agent/*")
    print(f"⚙️  Agent management: http://localhost:3000/api/agent/*")
    print("=" * 60)
    
    try:
        app.run(host='0.0.0.0', port=3000, debug=False)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down backend...")
        stop_agent()
        print("✅ Backend stopped")

if __name__ == '__main__':
    main()
