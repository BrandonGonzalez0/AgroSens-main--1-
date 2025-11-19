@echo off
echo ========================================
echo      AGROSENS - INICIANDO BACKEND
echo ========================================
echo.

cd ..\..

echo Verificando backend...
if not exist "backend\package.json" (
    echo ERROR: No se encuentra backend/package.json
    echo Ejecuta primero: install-dependencies.bat
    pause
    exit /b 1
)

echo Verificando dependencias...
if not exist "backend\node_modules" (
    echo Instalando dependencias del backend...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
    cd ..
)

echo Verificando archivo .env...
if not exist "backend\.env" (
    echo Creando archivo .env desde .env.example...
    copy "backend\.env.example" "backend\.env" >nul
    echo ✅ Archivo .env creado
    echo.
    echo IMPORTANTE: Edita backend/.env con tus configuraciones
    echo Presiona cualquier tecla para continuar...
    pause >nul
)

echo.
echo Iniciando servidor backend en puerto 5000...
echo Presiona Ctrl+C para detener
echo.

cd backend
npm start