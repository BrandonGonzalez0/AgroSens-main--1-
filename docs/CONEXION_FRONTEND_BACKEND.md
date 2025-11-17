# 🔗 Conexión Frontend-Backend AgroSens

## 🚀 Inicio Rápido

### **Opción 1: Script Automático (Recomendado)**

**Windows:**
```bash
# Doble click en el archivo o ejecutar en terminal
start-dev.bat
```

**Linux/Mac:**
```bash
# Dar permisos y ejecutar
chmod +x start-dev.sh
./start-dev.sh
```

### **Opción 2: Manual**

**1. Instalar dependencias:**
```bash
# Raíz del proyecto
npm run install:all
```

**2. Iniciar ambos servidores:**
```bash
# Opción A: Ambos a la vez
npm run dev

# Opción B: Por separado
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend  
npm run frontend
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## ⚙️ Configuración

### **Variables de Entorno**

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/agrosens
SESSION_SECRET=tu-secreto-super-seguro
CSRF_SECRET=tu-secreto-csrf
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=AgroSens
```

## 🔧 Funcionalidades de Conexión

### **1. Detección Automática de Estado**
- ✅ **Servidor Conectado**: Verde - Todas las funciones disponibles
- 🟡 **Modo Local**: Amarillo - Funciona sin backend

### **2. Proxy de Desarrollo**
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

### **3. Cliente API Inteligente**
```javascript
// Detecta automáticamente si usar proxy o URL completa
const endpoint = isProduction ? 
  `${baseURL}/api/endpoint` : 
  '/api/endpoint';
```

### **4. Manejo de CSRF**
- Tokens automáticos para seguridad
- Reintentos automáticos si expira
- Fallback a localStorage si backend no disponible

## 📊 Indicadores de Estado

### **En la Interfaz:**
- **🟢 Servidor Conectado**: Backend funcionando correctamente
- **🟡 Modo Local**: Funcionando sin backend (datos locales)
- **🔴 Error**: Problema de conexión

### **En la Consola:**
```bash
🚀 Servidor en puerto 5000 (DB conectada)
🌐 Frontend: http://localhost:3000
📡 Backend: http://localhost:5000
```

## 🛠️ Resolución de Problemas

### **Error: ECONNREFUSED**
```bash
# Verificar que el backend esté corriendo
curl http://localhost:5000/health

# Si no responde, iniciar backend
cd backend && npm run dev
```

### **Error: Puerto en Uso**
```bash
# Cambiar puerto en .env
PORT=5001

# O matar proceso
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### **Error: Proxy**
```bash
# Verificar vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

## 📁 Estructura de Archivos

```
AgroSens/
├── frontend/
│   ├── .env                    # Config frontend
│   ├── vite.config.js         # Proxy config
│   └── src/
│       ├── utils/
│       │   ├── api.js         # Cliente API
│       │   └── connection.js  # Manager conexión
├── backend/
│   ├── .env                   # Config backend
│   ├── server.js             # Servidor principal
│   └── middleware/
│       └── csrf.js           # Protección CSRF
├── start-dev.bat             # Script Windows
├── start-dev.sh              # Script Linux/Mac
└── package.json              # Scripts principales
```

## 🔄 Flujo de Datos

```
Frontend (5173) → Proxy → Backend (5000) → MongoDB
     ↓              ↓           ↓
   React         Vite       Express
     ↓              ↓           ↓
  localStorage ← Fallback ← API Response
```

## 🧪 Testing de Conexión

### **1. Health Check**
```bash
curl http://localhost:5000/health
```

### **2. API Test**
```bash
curl http://localhost:5000/api/cultivos
```

### **3. CSRF Token**
```bash
curl -c cookies.txt http://localhost:5000/api/csrf-token
```

## 📱 Características Especiales

### **Modo Offline**
- Datos guardados en localStorage
- Sincronización automática al reconectar
- Notificaciones de estado

### **Mobile Compatibility**
- Detección automática de dispositivos móviles
- Datos simulados cuando Arduino no disponible
- PWA completa con funcionalidad offline

### **Seguridad**
- Protección CSRF automática
- Sanitización de entrada
- Rate limiting
- Headers de seguridad

## 🎯 Comandos Útiles

```bash
# Instalar todo
npm run install:all

# Desarrollo
npm run dev

# Solo backend
npm run backend

# Solo frontend  
npm run frontend

# Build producción
npm run build

# Ver logs
# Backend: Terminal donde corre
# Frontend: Consola del navegador
```

## 📞 Soporte

Si tienes problemas de conexión:

1. **Verificar puertos**: 5173 (frontend) y 5000 (backend)
2. **Revisar .env**: Variables correctas
3. **Comprobar proxy**: vite.config.js
4. **Ver logs**: Consola y terminal
5. **Reiniciar**: Ctrl+C y volver a ejecutar

La aplicación está diseñada para funcionar **con o sin backend**, así que siempre tendrás funcionalidad básica disponible.