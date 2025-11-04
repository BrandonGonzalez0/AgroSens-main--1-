@echo off
echo Iniciando AgroSens...
echo.

echo Verificando dependencias...
cd frontend
if not exist node_modules (
    echo Instalando dependencias del frontend...
    npm install
)

cd ..\backend
if not exist node_modules (
    echo Instalando dependencias del backend...
    npm install
)

echo.
echo Iniciando servidores...
echo.

start "Backend AgroSens" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

start "Frontend AgroSens" cmd /k "cd /d %~dp0frontend && npm run start"

echo.
echo AgroSens se está iniciando...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul