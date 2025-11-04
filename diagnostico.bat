@echo off
echo ========================================
echo DIAGNOSTICO DE AGROSENS
echo ========================================
echo.

echo Verificando estructura de archivos...
echo.

echo Frontend:
if exist "frontend\src\App.jsx" (echo ✓ App.jsx existe) else (echo ✗ App.jsx NO existe)
if exist "frontend\src\index.js" (echo ✓ index.js existe) else (echo ✗ index.js NO existe)
if exist "frontend\src\main.jsx" (echo ✓ main.jsx existe) else (echo ✗ main.jsx NO existe)
if exist "frontend\index.html" (echo ✓ index.html existe) else (echo ✗ index.html NO existe)
if exist "frontend\package.json" (echo ✓ package.json existe) else (echo ✗ package.json NO existe)
if exist "frontend\vite.config.js" (echo ✓ vite.config.js existe) else (echo ✗ vite.config.js NO existe)

echo.
echo Backend:
if exist "backend\server.js" (echo ✓ server.js existe) else (echo ✗ server.js NO existe)
if exist "backend\package.json" (echo ✓ package.json existe) else (echo ✗ package.json NO existe)

echo.
echo Verificando Node.js...
node --version 2>nul && echo ✓ Node.js instalado || echo ✗ Node.js NO instalado

echo.
echo Verificando npm...
npm --version 2>nul && echo ✓ npm instalado || echo ✗ npm NO instalado

echo.
echo Verificando dependencias del frontend...
cd frontend
if exist "node_modules" (echo ✓ node_modules existe) else (echo ✗ node_modules NO existe - ejecutar: npm install)

echo.
echo Verificando dependencias del backend...
cd ..\backend
if exist "node_modules" (echo ✓ node_modules existe) else (echo ✗ node_modules NO existe - ejecutar: npm install)

echo.
echo ========================================
echo SOLUCION RECOMENDADA:
echo ========================================
echo 1. Ejecutar: install-security-deps.bat
echo 2. Ejecutar: start-agrosens.bat
echo 3. Abrir: http://localhost:3000
echo ========================================
echo.
pause