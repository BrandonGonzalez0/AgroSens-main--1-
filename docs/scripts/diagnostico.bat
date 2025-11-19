@echo off
echo ========================================
echo    AGROSENS - DIAGNOSTICO DEL SISTEMA
echo ========================================
echo.

echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no esta instalado
    echo    Descarga desde: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

echo.
echo [2/8] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no esta disponible
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm: %%i
)

echo.
echo [3/8] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Python no detectado (opcional para IA)
) else (
    for /f "tokens=*" %%i in ('python --version') do echo ✅ Python: %%i
)

echo.
echo [4/8] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Git no detectado (opcional)
) else (
    for /f "tokens=*" %%i in ('git --version') do echo ✅ Git instalado
)

echo.
echo [5/8] Verificando archivos del proyecto...
cd ..\..
if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json no encontrado
)

if exist "backend\package.json" (
    echo ✅ backend/package.json encontrado
) else (
    echo ❌ backend/package.json no encontrado
)

if exist "frontend\package.json" (
    echo ✅ frontend/package.json encontrado
) else (
    echo ❌ frontend/package.json no encontrado
)

echo.
echo [6/8] Verificando archivos de configuracion...
if exist "backend\.env" (
    echo ✅ backend/.env encontrado
) else (
    echo ⚠️  backend/.env no encontrado (usar .env.example)
)

if exist "backend\.env.example" (
    echo ✅ backend/.env.example encontrado
) else (
    echo ❌ backend/.env.example no encontrado
)

echo.
echo [7/8] Verificando dependencias instaladas...
if exist "node_modules" (
    echo ✅ node_modules raiz encontrado
) else (
    echo ⚠️  node_modules raiz no encontrado
)

if exist "backend\node_modules" (
    echo ✅ backend/node_modules encontrado
) else (
    echo ⚠️  backend/node_modules no encontrado
)

if exist "frontend\node_modules" (
    echo ✅ frontend/node_modules encontrado
) else (
    echo ⚠️  frontend/node_modules no encontrado
)

echo.
echo [8/8] Verificando puertos disponibles...
netstat -an | find ":5000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 5000 en uso (backend)
) else (
    echo ✅ Puerto 5000 disponible
)

netstat -an | find ":5173" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 5173 en uso (frontend)
) else (
    echo ✅ Puerto 5173 disponible
)

echo.
echo ========================================
echo           DIAGNOSTICO COMPLETO
echo ========================================
echo.
echo Si hay errores (❌), instala los componentes faltantes
echo Si hay advertencias (⚠️), revisa la documentacion
echo.
pause