import mqtt from 'mqtt';
import fs from 'fs';
import path from 'path';
import { setHumedadForDevice, setTemperaturaForDevice } from './services/mqtt_state.js';

// Configuración desde env o constantes proporcionadas
const MQTT_HOST = process.env.MQTT_HOST || 'e4c6720e18fa474387c0aefb41bed6b3.s1.eu.hivemq.cloud';
const MQTT_PORT = process.env.MQTT_PORT ? Number(process.env.MQTT_PORT) : 8883;
const MQTT_USER = process.env.MQTT_USER || 'brandon';
const MQTT_PASS = process.env.MQTT_PASS || 'Brandon12a.';

// Topics
// Suscribir con wildcard para soportar varios dispositivos dinámicamente
const TOPICS = [ 'agrosens/+/+' ];

// Certificado raíz ISRG Root X1 (Let\'s Encrypt) - provisto por el usuario
const ISRG_ROOT_X1 = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`;

// Build URL and options
const connectUrl = `mqtts://${MQTT_HOST}:${MQTT_PORT}`;

let client = null;

function isNumeric(val) {
  if (val === null || val === undefined) return false;
  return !Number.isNaN(Number(val));
}

function startClient() {
  console.log('Iniciando cliente MQTT hacia', connectUrl);

  const options = {
    username: MQTT_USER,
    password: MQTT_PASS,
    rejectUnauthorized: true,
    // ca: Buffer.from(ISRG_ROOT_X1) // mqtt library expects Buffer or string
    ca: ISRG_ROOT_X1,
    protocol: 'mqtts',
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000
  };

  client = mqtt.connect(connectUrl, options);

  client.on('connect', () => {
    console.log('MQTT conectado');
    TOPICS.forEach(t => client.subscribe(t, { qos: 1 }, (err) => {
      if (err) console.error('Error subscribe', t, err.message || err);
      else console.log('Subscribed to', t);
    }));
  });

  client.on('message', (topic, message) => {
    const payload = message.toString();
    console.log('MQTT <-', topic, payload);

    try {
      // topic format expected: agrosens/<deviceId>/<metric>
      const parts = topic.split('/');
      if (parts.length < 3) {
        console.warn('Topic con formato inesperado:', topic);
        return;
      }
      const deviceId = parts[1];
      const metric = parts[2];

      const num = Number(payload);
      if (!isNumeric(num)) {
        console.warn('Payload no numerico recibido en', topic, payload);
        return;
      }

      if (metric === 'humedad') {
        setHumedadForDevice(deviceId, num);
      } else if (metric === 'temperatura') {
        setTemperaturaForDevice(deviceId, num);
      } else {
        console.warn('Metric no soportada:', metric);
      }
    } catch (e) {
      console.error('Error procesando mensaje MQTT:', e.message || e);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err.message || err);
  });

  client.on('close', () => {
    console.warn('MQTT conexión cerrada, reconectando...');
  });

  client.on('reconnect', () => {
    console.log('MQTT reintentando conexión...');
  });
}

// Exponer para que server.js pueda importarlo y arrancarlo
export function startMQTTService() {
  try {
    startClient();
  } catch (e) {
    console.error('No se pudo iniciar servicio MQTT:', e.message || e);
  }
}

export function getClient() { return client; }

// Si este archivo se ejecuta directamente, arrancar cliente
if (process.argv[1] && process.argv[1].endsWith('mqtt_service.js')) {
  startMQTTService();
}
