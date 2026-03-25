import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AgentStatusBadge from '../components/biometric/AgentStatusBadge';
import {
  Terminal, Download, CheckCircle2, Circle, Cpu, Usb,
  Code2, ChevronDown, ChevronRight, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CODE_AGENT = `# =============================================================
#  BioEstoque — Agente Local Nitgen Hamster DX
#  Requisitos: Python 3.8+, eNBSP SDK instalado
#  Instalar dependências: pip install flask flask-cors
# =============================================================

from flask import Flask, jsonify, request
from flask_cors import CORS
import ctypes, os, base64, json

app = Flask(__name__)
CORS(app, origins=["*"])   # Em produção, restrinja para seu domínio

# ---------------------------------------------------------------
# Caminho para a DLL do SDK Nitgen (eNBSP SDK deve estar instalado)
# ---------------------------------------------------------------
SDK_PATH = r"C:\\Program Files\\NITGEN\\eNBSP SDK\\NBioBSPDll.dll"

try:
    nbiobsp = ctypes.WinDLL(SDK_PATH)
    SDK_AVAILABLE = True
except Exception as e:
    print(f"[AVISO] SDK Nitgen não encontrado: {e}")
    SDK_AVAILABLE = False

DEVICE_HANDLE = None

def open_device():
    global DEVICE_HANDLE
    if not SDK_AVAILABLE:
        return False
    try:
        handle = ctypes.c_ulong(0)
        ret = nbiobsp.NBioBSP_OpenDevice(ctypes.byref(handle), 0)
        if ret == 0:
            DEVICE_HANDLE = handle
            return True
        return False
    except:
        return False

def close_device():
    global DEVICE_HANDLE
    if DEVICE_HANDLE and SDK_AVAILABLE:
        nbiobsp.NBioBSP_CloseDevice(DEVICE_HANDLE)
        DEVICE_HANDLE = None

# ---------------------------------------------------------------
@app.route("/status", methods=["GET"])
def status():
    device_ok = open_device()
    return jsonify({
        "online": True,
        "sdk": SDK_AVAILABLE,
        "device": "Nitgen Hamster DX" if device_ok else None,
        "version": "1.0.0"
    })

# ---------------------------------------------------------------
@app.route("/capture", methods=["POST"])
def capture():
    """Captura uma digital e retorna o FIR em base64"""
    if not SDK_AVAILABLE:
        return jsonify({"error": "SDK Nitgen não instalado"}), 503

    if not open_device():
        return jsonify({"error": "Leitor não encontrado. Verifique conexão USB."}), 503

    try:
        # Estrutura FIR do SDK
        fir_size = ctypes.c_ulong(0)
        nbiobsp.NBioBSP_GetFIRSize(DEVICE_HANDLE, ctypes.byref(fir_size))

        fir_buffer = (ctypes.c_ubyte * fir_size.value)()
        quality = ctypes.c_ubyte(0)

        timeout_ms = request.json.get("timeout", 10000)
        ret = nbiobsp.NBioBSP_Capture(
            DEVICE_HANDLE,
            fir_buffer, fir_size,
            ctypes.byref(quality),
            ctypes.c_ulong(timeout_ms)
        )

        if ret != 0:
            return jsonify({"error": f"Falha na captura (código {ret})"}), 400

        fir_b64 = base64.b64encode(bytes(fir_buffer)).decode("utf-8")
        return jsonify({"fir": fir_b64, "quality": int(quality.value)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------
@app.route("/verify", methods=["POST"])
def verify():
    """Verificação 1:1 — compara enrolled_fir com captured_fir"""
    if not SDK_AVAILABLE:
        return jsonify({"error": "SDK não disponível"}), 503

    body = request.json
    enrolled_b64 = body.get("enrolled_fir")
    captured_b64 = body.get("captured_fir")

    if not enrolled_b64 or not captured_b64:
        return jsonify({"error": "FIRs não fornecidos"}), 400

    try:
        enrolled  = base64.b64decode(enrolled_b64)
        captured  = base64.b64decode(captured_b64)

        enrolled_buf  = (ctypes.c_ubyte * len(enrolled))(*enrolled)
        captured_buf  = (ctypes.c_ubyte * len(captured))(*captured)
        matched = ctypes.c_bool(False)
        score   = ctypes.c_ulong(0)

        nbiobsp.NBioBSP_VerifyFIR(
            enrolled_buf, ctypes.c_ulong(len(enrolled)),
            captured_buf, ctypes.c_ulong(len(captured)),
            ctypes.byref(matched), ctypes.byref(score)
        )

        return jsonify({"matched": bool(matched.value), "score": int(score.value)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------
@app.route("/identify", methods=["POST"])
def identify():
    """Identificação 1:N — encontra o perfil que bate com a digital"""
    if not SDK_AVAILABLE:
        return jsonify({"error": "SDK não disponível"}), 503

    body = request.json
    captured_b64 = body.get("captured_fir")
    profiles = body.get("profiles", [])

    if not captured_b64 or not profiles:
        return jsonify({"error": "Dados insuficientes"}), 400

    try:
        captured = base64.b64decode(captured_b64)
        captured_buf = (ctypes.c_ubyte * len(captured))(*captured)

        best_id    = None
        best_score = 0
        THRESHOLD  = 3000   # ajuste conforme necessidade

        for p in profiles:
            enrolled = base64.b64decode(p["fir"])
            enrolled_buf = (ctypes.c_ubyte * len(enrolled))(*enrolled)
            matched = ctypes.c_bool(False)
            score   = ctypes.c_ulong(0)

            nbiobsp.NBioBSP_VerifyFIR(
                enrolled_buf, ctypes.c_ulong(len(enrolled)),
                captured_buf, ctypes.c_ulong(len(captured)),
                ctypes.byref(matched), ctypes.byref(score)
            )

            if bool(matched.value) and int(score.value) > best_score:
                best_score = int(score.value)
                best_id    = p["id"]

        if best_id:
            return jsonify({"matched_id": best_id, "score": best_score})
        else:
            return jsonify({"matched_id": None, "score": 0})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------------
if __name__ == "__main__":
    print("=== BioEstoque Agente Nitgen ===")
    print("Iniciando na porta 8080...")
    app.run(host="127.0.0.1", port=8080, debug=False)
`;

function CodeBlock({ code, language = 'python' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 bg-slate-700 hover:bg-slate-600 text-slate-200"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function Step({ number, title, children, done }) {
  const [open, setOpen] = useState(number === 1);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
          done ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
        )}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : number}
        </div>
        <span className="font-semibold text-sm flex-1">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function AgentSetup() {
  const [agentOnline, setAgentOnline] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuração do Agente Nitgen</h1>
          <p className="text-muted-foreground mt-1">Integração com o leitor Nitgen Hamster DX via agente local</p>
        </div>
        <AgentStatusBadge onStatusChange={setAgentOnline} />
      </div>

      {/* Status */}
      <Card className={cn("border-2", agentOnline ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50")}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", agentOnline ? "bg-green-500 animate-pulse" : "bg-amber-500")} />
            <p className={cn("text-sm font-semibold", agentOnline ? "text-green-800" : "text-amber-800")}>
              {agentOnline ? "Agente detectado em localhost:8080 — Leitor pronto para uso!" : "Agente não detectado em localhost:8080"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Arquitetura */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" /> Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-center">
            {[
              { icon: Usb, label: 'Hamster DX\n(USB)' },
              { arrow: true },
              { icon: Terminal, label: 'Agente Python\n(localhost:8080)' },
              { arrow: true },
              { icon: Code2, label: 'BioEstoque\n(navegador)' },
            ].map((item, i) =>
              item.arrow ? (
                <span key={i} className="text-muted-foreground text-xl">→</span>
              ) : (
                <div key={i} className="flex flex-col items-center gap-1.5 bg-muted rounded-xl px-4 py-3 min-w-[90px]">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs whitespace-pre-line leading-tight text-muted-foreground">{item.label}</span>
                </div>
              )
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            O agente roda localmente no computador com o leitor conectado e expõe uma API HTTP para o app.
          </p>
        </CardContent>
      </Card>

      {/* Passos de instalação */}
      <div className="space-y-3">
        <h2 className="font-semibold text-base">Guia de instalação (Windows)</h2>

        <Step number={1} title="Instale o SDK eNBSP da Nitgen">
          <p className="text-sm text-muted-foreground">
            Baixe e instale o <strong>eNBSP SDK 4.x</strong> no computador com o leitor conectado.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a href="http://www.nitgen.com/eng/support/sdk.html" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 rounded-lg text-xs">
                <Download className="h-3.5 w-3.5" /> Site Nitgen (SDK)
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Após instalar, a DLL <code className="bg-muted px-1 rounded">NBioBSPDll.dll</code> ficará em
            <code className="bg-muted px-1 rounded ml-1">C:\Program Files\NITGEN\eNBSP SDK\</code>
          </p>
        </Step>

        <Step number={2} title="Instale Python 3.8+ e as dependências">
          <CodeBlock language="bash" code={`# Verifique se Python está instalado
python --version

# Instale as dependências
pip install flask flask-cors`} />
        </Step>

        <Step number={3} title="Salve e execute o script do agente">
          <p className="text-xs text-muted-foreground mb-2">
            Copie o código abaixo, salve como <code className="bg-muted px-1 rounded">nitgen_agent.py</code> e execute:
          </p>
          <CodeBlock code={CODE_AGENT} />
          <CodeBlock language="bash" code={`# Execute o agente
python nitgen_agent.py

# Saída esperada:
# === BioEstoque Agente Nitgen ===
# Iniciando na porta 8080...`} />
        </Step>

        <Step number={4} title="Inicie automaticamente com o Windows (opcional)">
          <p className="text-sm text-muted-foreground">
            Para iniciar o agente automaticamente, crie um arquivo <code className="bg-muted px-1 rounded">iniciar_agente.bat</code>:
          </p>
          <CodeBlock language="bash" code={`@echo off
cd /d "C:\\caminho\\para\\seu\\script"
start /min python nitgen_agent.py`} />
          <p className="text-xs text-muted-foreground">
            Coloque o atalho deste .bat na pasta Inicializar do Windows:
            <code className="bg-muted px-1 rounded ml-1">shell:startup</code>
          </p>
        </Step>

        <Step number={5} title="Verifique a conexão">
          <p className="text-sm text-muted-foreground">
            Após iniciar o agente com o leitor conectado, o status acima deve mostrar <Badge className="bg-green-100 text-green-700 text-xs">Leitor conectado</Badge>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Você também pode testar manualmente acessando: <code className="bg-muted px-1 rounded">http://localhost:8080/status</code>
          </p>
        </Step>
      </div>

      {/* Endpoints da API */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" /> Endpoints da API local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { method: 'GET',  path: '/status',   desc: 'Verifica se o agente e o leitor estão ativos' },
            { method: 'POST', path: '/capture',  desc: 'Captura uma digital e retorna o template FIR' },
            { method: 'POST', path: '/verify',   desc: 'Verificação 1:1 entre dois templates FIR' },
            { method: 'POST', path: '/identify', desc: 'Identificação 1:N contra lista de perfis' },
          ].map(ep => (
            <div key={ep.path} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant={ep.method === 'GET' ? 'secondary' : 'default'} className="text-xs font-mono shrink-0">
                {ep.method}
              </Badge>
              <code className="text-xs font-mono text-primary shrink-0">{ep.path}</code>
              <p className="text-xs text-muted-foreground">{ep.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}