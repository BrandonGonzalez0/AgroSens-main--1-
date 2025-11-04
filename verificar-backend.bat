@echo off
echo Verificando estado del backend...
echo.

echo Probando conexion al backend en puerto 5000...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend funcionando correctamente
    curl -s http://localhost:5000/api/sensores/latest
) else (
    echo ✗ Backend NO responde en puerto 5000
    echo.
    echo Iniciando backend...
    cd backend
    start "Backend AgroSens" cmd /k "npm run dev"
    echo Backend iniciado. Espera 10 segundos y prueba de nuevo.
)

echo.
pause