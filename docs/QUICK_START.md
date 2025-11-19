# 🚀 AgroSens - Guía de Inicio Rápido

> **¿Primera vez con AgroSens?** Esta guía te ayudará a tener el sistema funcionando en **menos de 10 minutos**.

## ⚡ Instalación Express (Recomendada)

### 📋 Prerrequisitos
- **Node.js 18+** ([Descargar aquí](https://nodejs.org/))
- **Git** ([Descargar aquí](https://git-scm.com/))
- **10 minutos de tiempo** ⏰

### 🔥 Instalación en 3 Pasos

#### **Paso 1: Clonar y Configurar**
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/agrosens.git
cd agrosens

# Hacer ejecutable el instalador (Linux/macOS)
chmod +x install-dependencies.sh
```

#### **Paso 2: Instalación Automática**

**Windows:**
```cmd
install-dependencies.bat
```

**Linux/macOS:**
```bash
./install-dependencies.sh
```

#### **Paso 3: Iniciar Aplicación**
```bash
npm run dev:all
```

### 🎉 ¡Listo!
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Credenciales por defecto:**
  - Admin: `admin@agrosens.cl` / `admin123`
  - Usuario: `agricultor@agrosens.cl` / `agricultor123`

---

## 🛠️ Instalación Manual (Alternativa)

Si prefieres control total sobre la instalación:

### **1. Instalar Dependencias**
```bash
# Raíz del proyecto
npm install

# Backend
cd backend
npm install
cd ..

# Frontend  
cd frontend
npm install
cd ..
```

### **2. Configurar Variables de Entorno**
```bash
# Copiar archivos de ejemplo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar backend/.env con tus configuraciones
```

### **3. Iniciar Servicios**
```bash
# Opción A: Todo junto
npm run dev:all

# Opción B: Por separado
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

---

## 🔧 Configuración Mínima

### **Variables Críticas** (`backend/.env`)
```env
# Base de datos (funciona sin MongoDB)
MONGO_URI=mongodb://localhost:27017/agrosens

# Seguridad (CAMBIAR en producción)
SESSION_SECRET=tu-secreto-super-seguro-aqui-min-32-chars
CSRF_SECRET=otro-secreto-diferente-para-csrf-tokens
JWT_SECRET=jwt-secreto-para-tokens-de-autenticacion

# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### **Generar Secretos Seguros**
```bash
# Ejecutar en terminal para generar secretos aleatorios
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('CSRF_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📱 Probar Funcionalidades

### **Sin Hardware (Modo Demo)**
El sistema funciona completamente sin sensores físicos:
- ✅ Datos simulados automáticos
- ✅ Análisis de IA con imágenes de prueba
- ✅ Dashboard interactivo
- ✅ Todas las funcionalidades disponibles

### **Con Hardware ESP32**
1. **Conectar sensores** según el diagrama en README.md
2. **Configurar WiFi** en `hardware/esp32/ESP32_sensor.ino`
3. **Subir firmware** con Arduino IDE
4. **Ver datos en tiempo real** en el dashboard

---

## 🧪 Verificar Instalación

### **Health Check**
```bash
# Verificar backend
curl http://localhost:5000/health

# Verificar frontend
curl http://localhost:5173
```

### **Respuesta Esperada Backend**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 45.123,
  "database": "connected"
}
```

### **Pruebas Rápidas**
```bash
# Ejecutar tests
npm test

# Verificar seguridad
npm run security:test

# Verificar linting
npm run lint
```

---

## 🚨 Solución de Problemas

### **Error: Puerto en uso**
```bash
# Cambiar puerto en backend/.env
PORT=5001

# O matar proceso existente
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

### **Error: MongoDB no conecta**
```bash
# Opción 1: Usar sin base de datos (modo local)
# El sistema funciona sin MongoDB

# Opción 2: Instalar MongoDB local
# Windows: https://www.mongodb.com/try/download/community
# Ubuntu: sudo apt install mongodb
# macOS: brew install mongodb-community

# Opción 3: Usar MongoDB Atlas (gratis)
# https://www.mongodb.com/atlas
```

### **Error: Dependencias**
```bash
# Limpiar cache y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Verificar versiones
node --version  # >= 18.0.0
npm --version   # >= 8.0.0
```

### **Error: Permisos (Linux/macOS)**
```bash
# Dar permisos a scripts
chmod +x install-dependencies.sh
chmod +x docs/scripts/test-security.sh

# Instalar dependencias globales con sudo si es necesario
sudo npm install -g concurrently
```

---

## 📚 Próximos Pasos

### **1. Explorar Funcionalidades**
- 🔍 **Análisis IA:** Sube fotos de plantas
- 📊 **Dashboard:** Ve métricas en tiempo real  
- 🌱 **Cultivos:** Gestiona tus plantaciones
- 📱 **PWA:** Instala como app móvil

### **2. Configurar Hardware**
- Ver guía completa en README.md sección "Hardware IoT"
- Comprar componentes (ESP32, sensores DHT11, pH)
- Seguir diagrama de conexiones

### **3. Personalizar Sistema**
- Modificar cultivos en `frontend/src/data/cultivos.json`
- Entrenar modelo IA personalizado
- Configurar alertas automáticas
- Integrar APIs externas

### **4. Desplegar en Producción**
- Configurar variables de entorno seguras
- Usar MongoDB Atlas o servidor propio
- Desplegar en Vercel, Netlify, Railway, etc.
- Configurar dominio y SSL

---

## 🆘 Soporte

### **Canales de Ayuda**
- 📖 **Documentación completa:** [README.md](./README.md)
- 🐛 **Reportar problemas:** [GitHub Issues](https://github.com/tu-usuario/agrosens/issues)
- 💬 **Preguntas:** [GitHub Discussions](https://github.com/tu-usuario/agrosens/discussions)
- 📧 **Email:** soporte@agrosens.com

### **FAQ Rápido**
**Q: ¿Necesito MongoDB?**  
A: No, funciona sin base de datos en modo local.

**Q: ¿Funciona en móviles?**  
A: Sí, es una PWA instalable en cualquier dispositivo.

**Q: ¿Puedo usar sin sensores?**  
A: Sí, incluye datos simulados para desarrollo.

**Q: ¿Es gratis?**  
A: Sí, licencia MIT completamente gratuita.

---

<div align="center">

**🌱 ¡Bienvenido a AgroSens!**

[📖 Ver documentación completa](./README.md) | [🚀 Empezar ahora](#-instalación-express-recomendada)

</div>