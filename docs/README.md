# 🌱 AgroSens - Sistema Inteligente de Cultivos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Security](https://img.shields.io/badge/Security-Enhanced-red.svg)](./SECURITY_FIXES.md)

AgroSens es una aplicación web progresiva (PWA) que combina IoT, inteligencia artificial y análisis de datos para optimizar la agricultura de precisión. Permite monitorear condiciones del suelo, validar cultivos y recibir recomendaciones inteligentes.

## ✨ Características Principales

- 🌡️ **Monitoreo en Tiempo Real**: Sensores Arduino para pH, humedad y temperatura
- 🤖 **Análisis con IA**: Detección de plagas y evaluación de madurez de cultivos
- 📱 **PWA Completa**: Funciona offline con sincronización automática
- 🔒 **Seguridad Avanzada**: Protección CSRF, validación de entrada y rate limiting
- 📊 **Dashboard Interactivo**: Visualización de datos con gráficos en tiempo real
- 🌐 **Modo Offline**: Almacenamiento local con cola de sincronización
- 📸 **Análisis de Imágenes**: Captura y análisis de fotos de cultivos

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- MongoDB (opcional, funciona sin base de datos)
- Arduino con sensores (opcional, incluye datos simulados)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/agrosens.git
cd agrosens
```

2. **Instalar dependencias de seguridad**
```bash
# Windows
install-security-deps.bat

# Linux/Mac
chmod +x install-security-deps.sh
./install-security-deps.sh
```

3. **Configurar variables de entorno**
```bash
cd backend
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar la aplicación**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

5. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Arquitectura

```
AgroSens/
├── frontend/          # React PWA
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilidades y API client
│   │   └── data/          # Datos estáticos
├── backend/           # Node.js + Express API
│   ├── routes/            # Endpoints de API
│   ├── models/            # Modelos de MongoDB
│   ├── middleware/        # Middleware de seguridad
│   └── ml/               # Scripts de ML
└── docs/             # Documentación
```

## 🔧 Configuración

### Variables de Entorno

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/agrosens

# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Seguridad
SESSION_SECRET=tu-secreto-super-seguro
CSRF_SECRET=tu-secreto-csrf

# Límites
MAX_FILE_SIZE=2097152
RATE_LIMIT_MAX_REQUESTS=100
```

### Sensores Arduino

```cpp
// Código básico para sensores
void setup() {
  Serial.begin(9600);
}

void loop() {
  float ph = analogRead(A0) * (14.0/1023.0);
  float humidity = analogRead(A1) * (100.0/1023.0);
  float temperature = analogRead(A2) * (50.0/1023.0);
  
  Serial.print("pH:");
  Serial.print(ph);
  Serial.print(",Humidity:");
  Serial.print(humidity);
  Serial.print(",Temperature:");
  Serial.println(temperature);
  
  delay(5000);
}
```

## 🛡️ Seguridad

AgroSens implementa múltiples capas de seguridad:

- ✅ **Protección CSRF** con tokens seguros
- ✅ **Sanitización de entrada** contra XSS
- ✅ **Rate limiting** progresivo
- ✅ **Validación de archivos** con firmas
- ✅ **Headers de seguridad** completos
- ✅ **Prevención de path traversal**
- ✅ **Protección SSRF**

Ver [SECURITY_FIXES.md](./SECURITY_FIXES.md) para detalles completos.

## 📱 Funcionalidades

### Validación de Cultivos
- Ingreso manual o automático de datos de sensores
- Validación contra base de datos de cultivos
- Recomendaciones personalizadas

### Análisis con IA
- Detección de plagas en imágenes
- Evaluación de madurez de cultivos
- Generación de mapas de calor

### Dashboard de Telemetría
- Gráficos en tiempo real
- Estadísticas históricas
- Alertas automáticas

### Modo Offline
- Almacenamiento local de datos
- Cola de sincronización
- Funcionalidad completa sin conexión

## 🔌 API Endpoints

### Sensores
```
GET  /api/sensores/latest    # Última lectura
POST /api/sensores           # Nueva lectura
```

### Análisis IA
```
GET  /api/ia                 # Obtener análisis
POST /api/ia                 # Crear análisis
DELETE /api/ia/:id           # Eliminar análisis
```

### Cultivos
```
GET  /api/cultivos           # Lista de cultivos
GET  /api/cultivos/:id       # Cultivo específico
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Security tests
npm run security-audit
```

## 📦 Despliegue

### Producción

1. **Configurar variables de entorno**
```bash
NODE_ENV=production
SESSION_SECRET=secreto-super-seguro-produccion
MONGO_URI=mongodb://tu-servidor/agrosens
```

2. **Build y deploy**
```bash
cd frontend
npm run build

cd ../backend
npm start
```

### Docker

```dockerfile
# Dockerfile incluido en el proyecto
docker build -t agrosens .
docker run -p 5000:5000 agrosens
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Seguir las convenciones de código existentes
- Incluir tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Verificar que pasan todas las pruebas de seguridad

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- [Create React App](https://github.com/facebook/create-react-app) - Bootstrap del frontend
- [Express.js](https://expressjs.com/) - Framework del backend
- [MongoDB](https://www.mongodb.com/) - Base de datos
- [TensorFlow.js](https://www.tensorflow.org/js) - Machine Learning
- [Tailwind CSS](https://tailwindcss.com/) - Estilos
- [Framer Motion](https://www.framer.com/motion/) - Animaciones

## 📞 Soporte

- 📧 Email: soporte@agrosens.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/agrosens/issues)
- 📖 Documentación: [Wiki](https://github.com/tu-usuario/agrosens/wiki)
- 💬 Discusiones: [GitHub Discussions](https://github.com/tu-usuario/agrosens/discussions)

---

<div align="center">
  <p>Hecho con ❤️ para la agricultura del futuro</p>
  <p>
    <a href="#-agrosens---sistema-inteligente-de-cultivos">⬆️ Volver arriba</a>
  </p>
</div>