#!/usr/bin/env python3
"""
Agente BioEstoque para Nitgen Hamster DX
API HTTP para comunicação com o leitor biométrico

Requisitos:
- Python 3.7+
- Nitgen Hamster DX SDK
- Flask

Instalação:
pip install flask requests

Uso:
python agent.py
"""

from flask import Flask, request, jsonify
import json
import threading
import time
from datetime import datetime
import sys
import os

app = Flask(__name__)

# Configuração
AGENT_VERSION = "1.0.0"
DEVICE_MODEL = "Nitgen Hamster DX"
AGENT_PORT = 8080

# Estado do agente
agent_status = {
    "online": True,
    "device_connected": False,
    "last_capture": None,
    "captures_count": 0
}

# Mock database para perfis biométricos
biometric_profiles = []

class NitgenHamsterDX:
    """Classe de interface para o leitor Nitgen Hamster DX"""
    
    def __init__(self):
        self.connected = False
        self.device_info = {
            "model": DEVICE_MODEL,
            "serial": "DEMO-12345",
            "firmware": "1.0.0"
        }
    
    def connect(self):
        """Conecta ao leitor"""
        try:
            # Simulação de conexão - em produção, usar SDK Nitgen real
            time.sleep(1)
            self.connected = True
            agent_status["device_connected"] = True
            return True
        except Exception as e:
            print(f"Erro ao conectar: {e}")
            return False
    
    def disconnect(self):
        """Desconecta do leitor"""
        self.connected = False
        agent_status["device_connected"] = False
    
    def capture_fingerprint(self, timeout=10000):
        """Captura digital do leitor"""
        if not self.connected:
            return {"success": False, "error": "Leitor não conectado"}
        
        try:
            # Simulação de captura - em produção, usar SDK Nitgen real
            print("Capturando digital...")
            time.sleep(2)  # Simula tempo de captura
            
            # Gera FIR mock (em produção, usar SDK real)
            import base64
            import random
            
            fir_data = base64.b64encode(
                f"NITGEN_FIR_{datetime.now().isoformat()}_{random.randint(1000, 9999)}".encode()
            ).decode()
            
            quality = random.randint(70, 99)
            
            agent_status["last_capture"] = datetime.now().isoformat()
            agent_status["captures_count"] += 1
            
            return {
                "success": True,
                "fir": fir_data,
                "quality": quality,
                "timestamp": agent_status["last_capture"]
            }
            
        except Exception as e:
            return {"success": False, "error": f"Falha na captura: {str(e)}"}
    
    def verify_fingerprint(self, enrolled_fir, captured_fir):
        """Verificação 1:1 de digitais"""
        if not enrolled_fir or not captured_fir:
            return {"success": False, "matched": False, "error": "FIRs inválidos"}
        
        try:
            # Simulação de verificação - em produção, usar SDK Nitgen real
            time.sleep(1)
            
            # Simulação de matching (em produção, usar algoritmo real)
            import hashlib
            enrolled_hash = hashlib.md5(enrolled_fir.encode()).hexdigest()
            captured_hash = hashlib.md5(captured_fir.encode()).hexdigest()
            
            # Simula matching baseado em similaridade de hash
            matched = abs(hash(enrolled_hash) - hash(captured_hash)) < 1000000
            score = random.randint(80, 99) if matched else random.randint(20, 60)
            
            return {
                "success": True,
                "matched": matched,
                "score": score
            }
            
        except Exception as e:
            return {"success": False, "matched": False, "error": f"Erro na verificação: {str(e)}"}
    
    def identify_fingerprint(self, captured_fir, profiles):
        """Identificação 1:N de digitais"""
        if not captured_fir or not profiles:
            return {"success": False, "error": "Dados inválidos"}
        
        try:
            # Simulação de identificação - em produção, usar SDK Nitgen real
            time.sleep(1.5)
            
            best_match = None
            best_score = 0
            
            for profile in profiles:
                result = self.verify_fingerprint(profile["fir"], captured_fir)
                if result["success"] and result["matched"] and result["score"] > best_score:
                    best_match = profile["id"]
                    best_score = result["score"]
            
            if best_match:
                return {
                    "success": True,
                    "matched_id": best_match,
                    "score": best_score
                }
            else:
                return {
                    "success": True,
                    "matched_id": None,
                    "score": 0
                }
                
        except Exception as e:
            return {"success": False, "error": f"Erro na identificação: {str(e)}"}

# Instância global do leitor
hamster = NitgenHamsterDX()

# Rotas da API
@app.route('/status', methods=['GET'])
def get_status():
    """Verifica status do agente e dispositivo"""
    return jsonify({
        "online": agent_status["online"],
        "version": AGENT_VERSION,
        "device": DEVICE_MODEL if agent_status["device_connected"] else None,
        "device_connected": agent_status["device_connected"],
        "captures_count": agent_status["captures_count"],
        "last_capture": agent_status["last_capture"]
    })

@app.route('/capture', methods=['POST'])
def capture_fingerprint():
    """Captura digital do leitor"""
    try:
        data = request.get_json() or {}
        timeout = data.get('timeout', 10000)
        
        result = hamster.capture_fingerprint(timeout)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erro na API: {str(e)}"
        }), 500

@app.route('/verify', methods=['POST'])
def verify_fingerprint():
    """Verificação 1:1 de digitais"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Dados JSON ausentes"}), 400
        
        enrolled_fir = data.get('enrolled_fir')
        captured_fir = data.get('captured_fir')
        
        if not enrolled_fir or not captured_fir:
            return jsonify({
                "success": False,
                "matched": False,
                "error": "enrolled_fir e captured_fir são obrigatórios"
            }), 400
        
        result = hamster.verify_fingerprint(enrolled_fir, captured_fir)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "matched": False,
            "error": f"Erro na API: {str(e)}"
        }), 500

@app.route('/identify', methods=['POST'])
def identify_fingerprint():
    """Identificação 1:N de digitais"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Dados JSON ausentes"}), 400
        
        captured_fir = data.get('captured_fir')
        profiles = data.get('profiles', [])
        
        if not captured_fir:
            return jsonify({
                "success": False,
                "error": "captured_fir é obrigatório"
            }), 400
        
        result = hamster.identify_fingerprint(captured_fir, profiles)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erro na API: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check simples"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agent_version": AGENT_VERSION
    })

@app.route('/', methods=['GET'])
def index():
    """Página inicial com informações"""
    return jsonify({
        "name": "BioEstoque Agent",
        "version": AGENT_VERSION,
        "description": "Agente HTTP para leitor biométrico Nitgen Hamster DX",
        "endpoints": {
            "GET /status": "Status do agente e dispositivo",
            "POST /capture": "Capturar digital",
            "POST /verify": "Verificar 1:1",
            "POST /identify": "Identificar 1:N",
            "GET /health": "Health check"
        },
        "device": DEVICE_MODEL,
        "status": "online"
    })

def initialize_device():
    """Inicializa o dispositivo em background"""
    def init_thread():
        print("Conectando ao leitor Nitgen Hamster DX...")
        if hamster.connect():
            print("✅ Leitor conectado com sucesso!")
            print(f"   Modelo: {hamster.device_info['model']}")
            print(f"   Serial: {hamster.device_info['serial']}")
        else:
            print("❌ Falha ao conectar ao leitor")
            print("   Verifique se o dispositivo está conectado")
    
    # Inicia em thread separada para não bloquear
    thread = threading.Thread(target=init_thread)
    thread.daemon = True
    thread.start()

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 BioEstoque Agent - Nitgen Hamster DX")
    print("=" * 50)
    print(f"Versão: {AGENT_VERSION}")
    print(f"Dispositivo: {DEVICE_MODEL}")
    print(f"Porta: {AGENT_PORT}")
    print("=" * 50)
    
    # Inicializa o dispositivo
    initialize_device()
    
    try:
        # Inicia servidor HTTP
        app.run(
            host='0.0.0.0',
            port=AGENT_PORT,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Encerrando agente...")
        hamster.disconnect()
        print("✅ Agente encerrado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)
