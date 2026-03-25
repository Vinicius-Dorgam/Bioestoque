#!/usr/bin/env python3
"""
Auto-start script para BioEstoque Agent
Este script inicia automaticamente o agente Python quando a aplicação é aberta
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_agent_running():
    """Verifica se o agente já está rodando"""
    try:
        response = requests.get('http://localhost:8080/status', timeout=3)
        return response.status_code == 200
    except:
        return False

def start_agent():
    """Inicia o agente Python"""
    script_dir = Path(__file__).parent
    agent_script = script_dir / 'agent.py'
    
    if not agent_script.exists():
        print(f"❌ Arquivo agent.py não encontrado em {script_dir}")
        return False
    
    try:
        print("🚀 Iniciando agente BioEstoque...")
        print(f"📂 Script: {agent_script}")
        
        # Inicia o agente em background
        if sys.platform == 'win32':
            # Windows
            subprocess.Popen([
                sys.executable, str(agent_script)
            ], creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
        else:
            # Linux/Mac
            subprocess.Popen([
                sys.executable, str(agent_script)
            ], start_new_session=True)
        
        # Espera um pouco para o agente iniciar
        time.sleep(3)
        
        # Verifica se iniciou com sucesso
        if check_agent_running():
            print("✅ Agente iniciado com sucesso!")
            print("🌐 Servidor rodando em http://localhost:8080")
            return True
        else:
            print("❌ Falha ao iniciar o agente")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao iniciar agente: {e}")
        return False

if __name__ == '__main__':
    print("=" * 50)
    print("🔧 BioEstoque Agent Auto-Start")
    print("=" * 50)
    
    # Verifica se já está rodando
    if check_agent_running():
        print("✅ Agente já está rodando!")
        print("🌐 Servidor disponível em http://localhost:8080")
    else:
        print("🔍 Agente não detectado, tentando iniciar...")
        success = start_agent()
        
        if success:
            print("\n🎉 Agente pronto para uso!")
            print("📱 Abra o BioEstoque no navegador para começar")
        else:
            print("\n❌ Não foi possível iniciar o agente automaticamente")
            print("📋 Inicie manualmente:")
            print("   python agent.py")
    
    print("=" * 50)
