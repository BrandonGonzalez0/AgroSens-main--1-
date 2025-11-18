import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testSensorAPI() {
  console.log('🧪 Probando API de sensores...\n');

  // 1. Verificar salud del servidor
  try {
    const health = await fetch(`${BASE_URL}/health`);
    const healthData = await health.json();
    console.log('✅ Servidor:', healthData);
  } catch (err) {
    console.error('❌ Servidor no responde:', err.message);
    return;
  }

  // 2. Enviar datos de prueba del sensor de humedad
  console.log('\n📡 Enviando datos de sensor de humedad...');
  try {
    const sensorData = {
      deviceId: 'ESP32-TEST-001',
      humedad_suelo: 65.5,
      temperatura_aire: 22.3,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${BASE_URL}/api/sensors/v1/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sensorData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Datos enviados:', result);
    } else {
      const error = await response.text();
      console.error('❌ Error enviando datos:', error);
    }
  } catch (err) {
    console.error('❌ Error de red:', err.message);
  }

  // 3. Verificar dispositivos registrados
  console.log('\n📋 Verificando dispositivos...');
  try {
    const devices = await fetch(`${BASE_URL}/api/sensors/v1/devices`);
    const devicesData = await devices.json();
    console.log('📱 Dispositivos encontrados:', JSON.stringify(devicesData, null, 2));
  } catch (err) {
    console.error('❌ Error obteniendo dispositivos:', err.message);
  }

  // 4. Obtener última lectura
  console.log('\n📊 Obteniendo última lectura...');
  try {
    const latest = await fetch(`${BASE_URL}/api/sensors/v1/devices/ESP32-TEST-001/latest`);
    if (latest.ok) {
      const latestData = await latest.json();
      console.log('📈 Última lectura:', JSON.stringify(latestData, null, 2));
    } else {
      console.log('ℹ️ No hay lecturas para este dispositivo');
    }
  } catch (err) {
    console.error('❌ Error obteniendo lectura:', err.message);
  }
}

testSensorAPI();