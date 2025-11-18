// Servicio de estado compartido para valores MQTT
// Ahora soporta almacenamiento por dispositivo/topic (ej. 'esp32_01')
const state = {
  // deviceMap[deviceId] = { humedad: { value, timestamp }, temperatura: { value, timestamp } }
  deviceMap: {},
  // últimos globales
  last: {
    humedad: { value: null, timestamp: null },
    temperatura: { value: null, timestamp: null }
  }
};

function nowISO() { return new Date().toISOString(); }

export function setHumedadForDevice(deviceId, value) {
  if (!state.deviceMap[deviceId]) state.deviceMap[deviceId] = {};
  state.deviceMap[deviceId].humedad = { value, timestamp: nowISO() };
  state.last.humedad = { value, timestamp: nowISO() };
}

export function setTemperaturaForDevice(deviceId, value) {
  if (!state.deviceMap[deviceId]) state.deviceMap[deviceId] = {};
  state.deviceMap[deviceId].temperatura = { value, timestamp: nowISO() };
  state.last.temperatura = { value, timestamp: nowISO() };
}

export function getHumedad(deviceId) {
  if (deviceId && state.deviceMap[deviceId] && state.deviceMap[deviceId].humedad) {
    return state.deviceMap[deviceId].humedad;
  }
  return state.last.humedad;
}

export function getTemperatura(deviceId) {
  if (deviceId && state.deviceMap[deviceId] && state.deviceMap[deviceId].temperatura) {
    return state.deviceMap[deviceId].temperatura;
  }
  return state.last.temperatura;
}

export function getTodo(deviceId) {
  return {
    humedad: getHumedad(deviceId),
    temperatura: getTemperatura(deviceId)
  };
}

export default state;
