@echo off
echo ========================================
echo     AGROSENS - INICIANDO FRONTEND
echo ========================================
echo.

cd ..\..

echo Verificando frontend...
if not exist "frontend\package.json" (
    echo ERROR: No se encuentra frontend/package.json
    echo Ejecuta primero: install-dependencies.bat
    pause
    exit /b 1
)

echo Verificando dependencias...
if not exist "frontend\node_modules" (
    echo Instalando dependencias del frontend...
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
    cd ..
)

echo Verificando archivo .env...
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        echo Creando archivo .env desde .env.example...
        copy "frontend\.env.example" "frontend\.env" >nul
        echo ✅ Archivo .env creado
    ) else (
        echo ✅ Frontend no requiere .env (opcional)
    )
)

echo.
echo Iniciando servidor frontend en puerto 5173...
echo Abrira automaticamente en: http://localhost:5173
echo Presiona Ctrl+C para detener
echo.

cd frontend
npm run dev