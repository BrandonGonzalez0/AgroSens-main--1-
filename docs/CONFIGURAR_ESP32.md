# 🔧 Configuración del Sensor ESP32 para AgroSens

## 📋 Materiales Necesarios
- ESP32 DevKit
- Sensor de humedad capacitivo
- Cables jumper
- Protoboard (opcional)

## 🔌 Conexiones
```
Sensor de Humedad → ESP32
VCC → 3.3V
GND → GND  
AOUT → GPIO 34
```

## ⚙️ Configuración del Código

1. **Abrir Arduino IDE**
2. **Instalar librerías necesarias:**
   - WiFi (incluida en ESP32)
   - HTTPClient (incluida en ESP32)
   - ArduinoJson (instalar desde Library Manager)

3. **Configurar WiFi en el código:**
   ```cpp
   const char* ssid = "TU_NOMBRE_WIFI";
   const char* password = "TU_PASSWORD_WIFI";
   ```

4. **Configurar IP del servidor:**
   ```cpp
   // Cambiar por la IP de tu computadora
   const char* serverURL = "http://192.168.1.XXX:5000/api/sensors/v1/readings";
   ```

## 🌐 Encontrar tu IP Local

### Windows:
```cmd
ipconfig
```
Buscar "Dirección IPv4" en tu adaptador de red activo.

### Linux/Mac:
```bash
ifconfig
```

## 🚀 Pasos para Probar

1. **Iniciar el backend de AgroSens:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Subir el código al ESP32**

3. **Abrir Serial Monitor (115200 baud)**

4. **Verificar conexión WiFi y envío de datos**

5. **Ejecutar script de prueba:**
   ```cmd
   probar-sensor.bat
   ```

6. **Abrir frontend y ver datos:**
   - Ir a http://localhost:3000
   - Hacer clic en "📡 Sensores"
   - Verificar que aparece "ESP32-HUMEDAD-001"

## 🔍 Solución de Problemas

### ❌ ESP32 no se conecta a WiFi
- Verificar nombre y contraseña de WiFi
- Asegurar que WiFi es 2.4GHz (no 5GHz)
- Verificar que ESP32 está en rango

### ❌ No aparecen datos en AgroSens
- Verificar que backend está corriendo en puerto 5000
- Comprobar IP del servidor en el código
- Revisar Serial Monitor para errores HTTP

### ❌ Lecturas de humedad incorrectas
- Calibrar valores `valorSeco` y `valorMojado`
- Probar sensor en tierra seca y húmeda
- Ajustar valores según lecturas ADC

## 📊 Calibración del Sensor

1. **Tierra seca:** Anotar valor ADC → usar como `valorSeco`
2. **Tierra húmeda:** Anotar valor ADC → usar como `valorMojado`
3. **Actualizar código con nuevos valores**

## ✅ Funcionamiento Correcto

Deberías ver en Serial Monitor:
```
Iniciando Sensor de Humedad AgroSens v2.0...
WiFi conectado!
IP: 192.168.1.XXX
Valor ADC: 2100 | Humedad: 65%
Enviando: {"deviceId":"ESP32-HUMEDAD-001","humedad_suelo":65}
✅ Datos enviados correctamente
```

Y en AgroSens:
- Sensor aparece como "🟢 Activo"
- Muestra última lectura de humedad
- Se actualiza cada 5 segundos