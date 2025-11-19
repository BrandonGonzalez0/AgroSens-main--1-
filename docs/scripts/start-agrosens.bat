@echo off
echo ========================================
echo       AGROSENS - INICIO COMPLETO
echo ========================================
echo.

cd ..\..

echo Verificando instalacion...
if not exist "package.json" (
    echo ERROR: No se encuentra package.json en la raiz
    echo Ejecuta primero: install-dependencies.bat
    pause
    exit /b 1
)

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias raiz...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo instalacion raiz
        pause
        exit /b 1
    )
)

echo.
echo Iniciando AgroSens completo...
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener ambos servicios
echo.

npm run dev:all