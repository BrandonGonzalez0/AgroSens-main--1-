@echo off
echo Iniciando Backend de AgroSens...
echo.

cd backend

echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    npm install
)

echo.
echo Iniciando servidor backend en puerto 5000...
npm run dev

pause