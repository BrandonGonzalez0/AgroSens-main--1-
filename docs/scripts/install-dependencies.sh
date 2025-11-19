#!/bin/bash

echo "========================================"
echo "   AGROSENS - INSTALADOR AUTOMATICO"
echo "========================================"
echo

echo "[1/6] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado"
    echo "Instalar con:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  O descargar desde: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js detectado: $(node --version)"

echo
echo "[2/6] Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm no está disponible"
    exit 1
fi
echo "✓ npm detectado: $(npm --version)"

echo
echo "[3/6] Instalando dependencias raíz..."
cd ../..
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Falló instalación raíz"
    exit 1
fi
echo "✓ Dependencias raíz instaladas"

echo
echo "[4/6] Instalando dependencias backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Falló instalación backend"
    exit 1
fi
echo "✓ Backend instalado"
cd ..

echo
echo "[5/6] Instalando dependencias frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Falló instalación frontend"
    exit 1
fi
echo "✓ Frontend instalado"
cd ..

echo
echo "[6/6] Configurando archivos de entorno..."
if [ ! -f "backend/.env" ]; then
    cp "backend/.env.example" "backend/.env"
    echo "✓ Archivo backend/.env creado"
else
    echo "✓ Archivo backend/.env ya existe"
fi

if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
    cp "frontend/.env.example" "frontend/.env"
    echo "✓ Archivo frontend/.env creado"
else
    echo "✓ Archivo frontend/.env configurado"
fi

echo
echo "========================================"
echo "       INSTALACIÓN COMPLETADA"
echo "========================================"
echo
echo "Próximos pasos:"
echo "1. Editar backend/.env con tus configuraciones"
echo "2. Ejecutar: npm run dev:all"
echo "3. Abrir: http://localhost:5173"
echo
echo "Para más información ver README.md"
echo