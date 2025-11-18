import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import fetch from 'node-fetch';

// Puerta de enlace serial -> API de Agrosens
// Detecta puertos COM/USB, escucha líneas (JSON o CSV simple) y reenvía a /api/sensors/v1/readings

const API_BASE = process.env.AGROSENS_API_URL || 'http://localhost:5000';
const BAUD_RATE = process.env.AGROSENS_BAUD ? Number(process.env.AGROSENS_BAUD) : 115200;

async function listPorts() {
  try {
    const ports = await SerialPort.list();
    return ports;
  } catch (err) {
    console.error('Error listando puertos serial:', err);
    return [];
  }
}

function tryParseLine(line) {
  line = line.trim();
  if (!line) return null;
  // Intentar JSON primero
  try {
    const j = JSON.parse(line);
    return j;
  } catch (e) {
    // No es JSON. Intentar CSV simple: key1:val1,key2:val2 or val1,val2
    // Ejemplo soportado: humedad_suelo:23,temperatura_aire:24
    try {
      const obj = {};
      if (line.includes(':')) {
        const parts = line.split(',');
        for (const p of parts) {
          const [k, v] = p.split(':').map(s => s && s.trim());
          if (k) obj[k] = isFinite(v) ? Number(v) : v;
        }
        return obj;
      } else if (line.includes(',')) {
        // Si sólo valores numericos, mapear a humedad_suelo
        const vals = line.split(',').map(s => s.trim()).filter(Boolean);
        if (vals.length === 1) return { humedad_suelo: Number(vals[0]) };
        if (vals.length >= 2) return { humedad_suelo: Number(vals[0]), temperatura_aire: Number(vals[1]) };
      }
    } catch (e2) {
      return null;
    }
  }
  return null;
}

async function attachToPort(portInfo) {
  const path = portInfo.path || portInfo.comName || portInfo.vendorId || 'unknown';
  console.log(`Abrir puerto ${path} (baud=${BAUD_RATE})`);
  const port = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false });

  port.open(err => {
    if (err) {
      console.error(`No se pudo abrir ${path}:`, err.message);
      return;
    }
    console.log(`Puerto abierto: ${path}`);
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', async (line) => {
    console.log(`[${path}] <-`, line.trim());
    const parsed = tryParseLine(line);
    if (!parsed) {
      console.log('Linea no reconocida, saltando');
      return;
    }
    // Construir payload: intentar incluir deviceId basado en port
    const payload = { deviceId: portInfo.serialNumber || portInfo.productId || `LOCAL-${path}`, timestamp: new Date().toISOString(), ...parsed };

    try {
      const res = await fetch(`${API_BASE}/api/sensors/v1/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        console.log(`Enviado a API: ${JSON.stringify(payload)}`);
      } else {
        console.error('API respondió error:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Error enviando a API:', err.message);
    }
  });

  port.on('error', (err) => console.error(`Error en puerto ${path}:`, err.message));
  port.on('close', () => console.log(`Puerto cerrado: ${path}`));
}

async function start() {
  console.log('Iniciando serial bridge...');
  const ports = await listPorts();
  if (!ports || ports.length === 0) {
    console.log('No se encontraron puertos serial. Conecta el Arduino y vuelve a intentar.');
    return;
  }

  console.log('Puertos encontrados:');
  ports.forEach(p => console.log(` - ${p.path || p.comName}  ${p.manufacturer ? `(${p.manufacturer})` : ''} ${p.vendorId ? `VID:${p.vendorId}` : ''} ${p.productId ? `PID:${p.productId}` : ''}`));

  // Intentar abrir todos los puertos que parezcan dispositivos USB/COM
  for (const p of ports) {
    // Filtrado básico: en Windows suele ser COM*, en Unix /dev/ttyUSB o /dev/ttyACM
    const candidate = String(p.path || p.comName || '').toLowerCase();
    if (candidate.includes('com') || candidate.includes('tty') || p.vendorId || p.productId) {
      attachToPort(p);
    }
  }
}

start().catch(err => console.error('Fatal serial bridge error:', err));
