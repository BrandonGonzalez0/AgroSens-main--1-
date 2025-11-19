@echo off
echo ========================================
echo    AGROSENS - INSTALADOR AUTOMATICO
echo ========================================
echo.

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js detectado

echo.
echo [2/6] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no esta disponible
    pause
    exit /b 1
)
echo ✓ npm detectado

echo.
echo [3/6] Instalando dependencias raiz...
cd ..\..
npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo instalacion raiz
    pause
    exit /b 1
)
echo ✓ Dependencias raiz instaladas

echo.
echo [4/6] Instalando dependencias backend...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo instalacion backend
    pause
    exit /b 1
)
echo ✓ Backend instalado
cd ..

echo.
echo [5/6] Instalando dependencias frontend...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo instalacion frontend
    pause
    exit /b 1
)
echo ✓ Frontend instalado
cd ..

echo.
echo [6/6] Configurando archivos de entorno...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo ✓ Archivo backend/.env creado
) else (
    echo ✓ Archivo backend/.env ya existe
)

if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env" >nul 2>&1
    echo ✓ Archivo frontend/.env creado
) else (
    echo ✓ Archivo frontend/.env ya existe
)

echo.
echo ========================================
echo        INSTALACION COMPLETADA
echo ========================================
echo.
echo Proximos pasos:
echo 1. Editar backend/.env con tus configuraciones
echo 2. Ejecutar: npm run dev:all
echo 3. Abrir: http://localhost:5173
echo.
echo Para mas informacion ver README.md
echo.
pause