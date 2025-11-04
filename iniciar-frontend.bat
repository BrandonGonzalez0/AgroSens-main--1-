@echo off
echo Iniciando Frontend de AgroSens...
echo.

cd frontend

echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    npm install
)

echo.
echo Iniciando aplicacion frontend en puerto 3000...
npm start

pause