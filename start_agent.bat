@echo off
echo ========================================
echo 🚀 BioEstoque Agent Auto-Start
echo ========================================
echo.

REM Verifica se o agente já está rodando
curl -s http://localhost:8080/status >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Agente já está rodando!
    echo 🌐 Servidor disponível em http://localhost:8080
) else (
    echo 🔍 Agente não detectado, tentando iniciar...
    echo.
    
    REM Verifica se Python está instalado
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python não encontrado. Por favor, instale Python 3.7+
        pause
        exit /b 1
    )
    
    REM Verifica se as dependências estão instaladas
    echo 📦 Verificando dependências...
    python -c "import flask" 2>nul
    if %errorlevel% neq 0 (
        echo 📦 Instalando dependências...
        pip install flask requests
    )
    
    REM Inicia o agente
    echo 🚀 Iniciando agente BioEstoque...
    start "BioEstoque Agent" cmd /k "python agent.py"
    
    REM Espera um pouco para o agente iniciar
    timeout /t 3 /nobreak >nul
    
    REM Verifica se iniciou com sucesso
    curl -s http://localhost:8080/status >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Agente iniciado com sucesso!
        echo 🌐 Servidor rodando em http://localhost:8080
        echo.
        echo 🎉 Agente pronto para uso!
        echo 📱 Abra o BioEstoque no navegador para começar
    ) else (
        echo ❌ Falha ao iniciar o agente
        echo.
        echo 📋 Inicie manualmente:
        echo    python agent.py
    )
)

echo.
echo ========================================
echo Pressione qualquer tecla para sair...
pause >nul
