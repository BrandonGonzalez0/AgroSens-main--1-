@echo off
echo 🧪 Probando conectividad del sistema AgroSens...
echo.

echo 📡 1. Verificando backend (puerto 5000)...
curl -s http://localhost:5000/health
echo.
echo.

echo 📊 2. Enviando datos de prueba del sensor...
curl -X POST http://localhost:5000/api/sensors/v1/readings ^
  -H "Content-Type: application/json" ^
  -d "{\"deviceId\":\"ESP32-TEST-001\",\"humedad_suelo\":65.5,\"temperatura_aire\":22.3}"
echo.
echo.

echo 📱 3. Verificando dispositivos registrados...
curl -s http://localhost:5000/api/sensors/v1/devices
echo.
echo.

echo ✅ Prueba completada. Revisa el frontend en http://localhost:3000
pause