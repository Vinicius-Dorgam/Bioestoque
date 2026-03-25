# Agente BioEstoque para Nitgen Hamster DX

Este agente Python permite que o aplicativo BioEstoque se comunique com o leitor biométrico Nitgen Hamster DX via USB.

## 🏗️ Arquitetura

```
Hamster DX (USB) → Agente Python (localhost:8080) → BioEstoque (navegador)
```

O agente roda localmente no computador com o leitor conectado e expõe uma API HTTP para o aplicativo web.

## 📋 Requisitos

- Python 3.7 ou superior
- Leitor biométrico Nitgen Hamster DX
- Drivers do dispositivo instalados
- Conexão USB disponível

## 🚀 Instalação

### 1. Instalar dependências Python

```bash
pip install -r requirements.txt
```

Ou manualmente:
```bash
pip install flask requests
```

### 2. Conectar o leitor

- Conecte o Nitgen Hamster DX a uma porta USB
- Verifique se os drivers estão instalados
- Confirme se o dispositivo é reconhecido pelo sistema

### 3. Iniciar o agente

```bash
python agent.py
```

O agente irá iniciar na porta `8080` e tentar conectar ao leitor automaticamente.

## 🛠️ Configuração

### Porta padrão

Para usar uma porta diferente, edite o arquivo `agent.py`:

```python
AGENT_PORT = 8080  # Altere para a porta desejada
```

### Modo Produção (SDK Nitgen Real)

O agente atualmente usa simulação para demonstração. Para usar com o SDK Nitgen real:

1. Instale o SDK Nitgen fornecido pelo fabricante
2. Substitua os métodos simulados na classe `NitgenHamsterDX`
3. Use as funções reais do SDK para captura e verificação

## 📡 API Endpoints

### GET `/status`
Verifica status do agente e dispositivo

**Response:**
```json
{
  "online": true,
  "version": "1.0.0",
  "device": "Nitgen Hamster DX",
  "device_connected": true,
  "captures_count": 5,
  "last_capture": "2024-03-25T18:00:00"
}
```

### POST `/capture`
Captura digital do leitor

**Request:**
```json
{
  "timeout": 10000
}
```

**Response:**
```json
{
  "success": true,
  "fir": "base64_encoded_fir_data",
  "quality": 85,
  "timestamp": "2024-03-25T18:00:00"
}
```

### POST `/verify`
Verificação 1:1 de digitais

**Request:**
```json
{
  "enrolled_fir": "base64_fir_cadastrado",
  "captured_fir": "base64_fir_capturado"
}
```

**Response:**
```json
{
  "success": true,
  "matched": true,
  "score": 92
}
```

### POST `/identify`
Identificação 1:N de digitais

**Request:**
```json
{
  "captured_fir": "base64_fir_capturado",
  "profiles": [
    {"id": "user1", "fir": "base64_fir_user1"},
    {"id": "user2", "fir": "base64_fir_user2"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "matched_id": "user1",
  "score": 88
}
```

### GET `/health`
Health check simples

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-25T18:00:00",
  "agent_version": "1.0.0"
}
```

## 🔧 Integração com BioEstoque

O aplicativo BioEstoque já está configurado para se comunicar com o agente em `localhost:8080`. 

Para usar o agente real:

1. Inicie o agente Python: `python agent.py`
2. O BioEstoque detectará automaticamente o agente online
3. As funcionalidades biométricas funcionarão com hardware real

## 🐛 Troubleshooting

### Leitor não é detectado

1. Verifique a conexão USB
2. Confirme se os drivers estão instalados
3. Teste em outra porta USB
4. Verifique se o dispositivo aparece no Gerenciador de Dispositivos

### Erro de permissão

- No Linux/Mac: pode ser necessário executar com `sudo`
- No Windows: execute como Administrador

### Porta em uso

```bash
# Verificar se a porta 8080 está em uso
netstat -an | grep 8080

# Matar processo usando a porta (Linux/Mac)
sudo fuser -k 8080/tcp
```

### Conflito com firewall

Adicione exceção para o Python ou porta 8080 no firewall do sistema.

## 📝 Desenvolvimento

### Estrutura do código

- `NitgenHamsterDX`: Classe principal de interface com o hardware
- `app.py`: Servidor Flask com endpoints HTTP
- Métodos simulados para demonstração
- Fácil integração com SDK Nitgen real

### Testando localmente

```bash
# Testar status
curl http://localhost:8080/status

# Testar captura
curl -X POST http://localhost:8080/capture \
  -H "Content-Type: application/json" \
  -d '{"timeout": 5000}'
```

## 🔐 Segurança

- O agente roda apenas em localhost
- Sem exposição externa por padrão
- Dados biométricos são transmitidos como base64
- Em produção, considere criptografia adicional

## 📞 Suporte

Para problemas com:
- **Hardware**: Contate o suporte Nitgen
- **Software**: Abra issue no repositório BioEstoque
- **Instalação**: Verifique a documentação do fabricante
