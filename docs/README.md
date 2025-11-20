# 🌱 AgroSens - Sistema de Monitoreo Agrícola Inteligente

Sistema completo de monitoreo agrícola con sensores IoT, análisis de IA y gestión de cultivos en tiempo real.

## 🚀 Características Principales

- **📊 Monitoreo en Tiempo Real**: Sensores de humedad, temperatura, pH y más
- **🤖 Análisis con IA**: Detección de plagas y enfermedades usando TensorFlow
- **📱 PWA Completa**: Funciona offline en móviles y escritorio
- **🌐 API REST**: Backend robusto con MongoDB
- **🔒 Seguridad**: Autenticación, CSRF, rate limiting
- **📍 Geolocalización**: Mapeo GPS de cultivos
- **⚡ Tiempo Real**: MQTT para datos instantáneos

## 🛠️ Tecnologías

### Frontend
- **React 18** + **Vite**
- **TailwindCSS** para estilos
- **TensorFlow.js** para IA
- **PWA** con service workers
- **Recharts** para gráficos

### Backend
- **Node.js** + **Express**
- **MongoDB** con Mongoose
- **MQTT** para IoT
- **JWT** + **bcrypt** para auth
- **Helmet** + **CORS** para seguridad

### Hardware
- **ESP32** con sensores
- **Arduino IDE** compatible
- **MQTT** para comunicación

## 📦 Instalación Rápida

### Opción 1: Script Automático (Recomendado)

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Opción 2: Manual

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/agrosens.git
cd agrosens

# 2. Instalar dependencias
npm run install:all

# 3. Configurar variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Iniciar desarrollo
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/agrosens
SESSION_SECRET=tu-secreto-super-seguro
CSRF_SECRET=tu-secreto-csrf
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=AgroSens
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **API Docs**: http://localhost:5000/api

## 📡 API Endpoints

### Sensores
```bash
POST /api/sensors/v1/readings          # Guardar lecturas
GET  /api/sensors/v1/devices           # Listar dispositivos
GET  /api/sensors/v1/devices/:id/latest # Última lectura
```

### Cultivos
```bash
GET    /api/cultivos                   # Listar cultivos
POST   /api/cultivos                   # Crear cultivo
PUT    /api/cultivos/:id               # Actualizar cultivo
DELETE /api/cultivos/:id               # Eliminar cultivo
```

### IA y Análisis
```bash
POST /api/ia/analyze-image             # Análisis de imagen
GET  /api/ia/models                    # Modelos disponibles
```

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Frontend + Backend
npm run frontend         # Solo frontend
npm run backend          # Solo backend

# Instalación
npm run install:all      # Instalar todo

# Producción
npm run build           # Build frontend
npm start              # Iniciar producción

# Utilidades
npm run seed:users      # Crear usuarios de prueba
npm run hash:password   # Generar hash de contraseña
```

## 📱 Uso del Sistema

### 1. Configurar Sensores
```json
{
  "deviceId": "sensor-001",
  "humedad_suelo": 65.5,
  "temperatura_aire": 24.3,
  "humedad_aire": 78.2,
  "ph_suelo": 6.8
}
```

### 2. Crear Cultivos
- Acceder a la sección "Cultivos"
- Agregar nuevo cultivo con ubicación GPS
- Configurar alertas y umbrales

### 3. Análisis con IA
- Tomar foto de planta
- El sistema detecta automáticamente plagas/enfermedades
- Recibir recomendaciones de tratamiento

## 🔒 Seguridad

- **Autenticación JWT** con refresh tokens
- **Protección CSRF** automática
- **Rate limiting** (120 req/min)
- **Sanitización** de entrada
- **Headers de seguridad** con Helmet
- **Validación** de datos con Validator

## 📊 Monitoreo

### Métricas Disponibles
- Humedad del suelo (%)
- Temperatura del aire (°C)
- Humedad del aire (%)
- pH del suelo
- Estado de conexión de sensores

### Alertas Automáticas
- Niveles críticos de humedad
- Temperaturas extremas
- Desconexión de sensores
- Detección de plagas

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E
npm run test:e2e
```

## 📁 Estructura del Proyecto

```
AgroSens/
├── frontend/           # React PWA
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── utils/      # Utilidades y API
│   │   └── hooks/      # Custom hooks
├── backend/            # Node.js API
│   ├── models/         # Modelos MongoDB
│   ├── routes/         # Rutas API
│   ├── middleware/     # Middlewares
│   └── services/       # Servicios
├── hardware/           # Código Arduino
│   └── esp32/          # Sketches ESP32
├── docs/              # Documentación
└── scripts/           # Scripts de utilidad
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

### Problemas Comunes

**Error de conexión:**
```bash
# Verificar servicios
curl http://localhost:5000/health
```

**Puerto ocupado:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Contacto

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/agrosens/issues)
- **Documentación**: [/docs](./docs/)
- **Wiki**: [GitHub Wiki](https://github.com/tu-usuario/agrosens/wiki)

## 🎯 Roadmap

- [ ] Dashboard avanzado con métricas
- [ ] Integración con más sensores
- [ ] App móvil nativa
- [ ] Machine Learning mejorado
- [ ] API GraphQL
- [ ] Notificaciones push
- [ ] Exportación de datos
- [ ] Multi-idioma

---

**⭐ Si te gusta el proyecto, dale una estrella en GitHub!**

Desarrollado con ❤️ para la agricultura inteligente
