@echo off
echo 🧪 Probando sistema de sensores AgroSens...
echo.

echo 📡 1. Verificando backend...
curl -s http://localhost:5000/health
echo.
echo.

echo 💧 2. Enviando datos de sensor de humedad...
curl -X POST http://localhost:5000/api/sensors/v1/readings ^
  -H "Content-Type: application/json" ^
  -d "{\"deviceId\":\"ESP32-HUMEDAD-001\",\"humedad_suelo\":75}"
echo.
echo.

echo 📱 3. Verificando dispositivos...
curl -s http://localhost:5000/api/sensors/v1/devices
echo.
echo.

echo 📊 4. Obteniendo última lectura...
curl -s http://localhost:5000/api/sensors/v1/devices/ESP32-HUMEDAD-001/latest
echo.
echo.

echo ✅ Prueba completada. 
echo 👉 Abre http://localhost:3000 y haz clic en "Sensores"
pause