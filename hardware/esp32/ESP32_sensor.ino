#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>

// =========================
// WIFI CONFIG
// =========================
const char* ssid = "Claro-56b8";
const char* password = "126556001387";

// =========================
// MQTT CONFIG (HiveMQ Cloud)
// =========================
const char* mqtt_server = "e4c6720e18fa474387c0aefb41bed6b3.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;

const char* mqtt_username = "brandon";
const char* mqtt_password = "Brandon12a.";

// =========================
// SENSORES
// =========================
#define SOIL_PIN 34
#define DHTPIN 23
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int valorSeco = 2400;
int valorMojado = 1000;

// =========================
// TOPICS MQTT
// =========================
const char* topicHumedad = "agrosens/esp32_01/humedad";
const char* topicTemperatura = "agrosens/esp32_01/temperatura";

// =========================
// CERTIFICADO TLS (HiveMQ Recommended)
// =========================
static const char *root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----
)EOF";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ======================================================
// MQTT RECONNECT
// ======================================================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conectar a MQTT... ");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("Conectado!");
    } else {
      Serial.print("Fallo, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5s");
      delay(5000);
    }
  }
}

// ======================================================
// PUBLICAR MQTT
// ======================================================
void publish(const char* topic, String payload) {
  client.publish(topic, payload.c_str(), true);
  Serial.printf("Publicado [%s]: %s\n", topic, payload.c_str());
}

// ======================================================
// SETUP
// ======================================================
void setup() {
  Serial.begin(115200);

  dht.begin();
  analogReadResolution(12);

  Serial.printf("Conectando a WiFi %s\n", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println("\nWiFi conectado!");
  Serial.println(WiFi.localIP());

  espClient.setCACert(root_ca);
  client.setServer(mqtt_server, mqtt_port);
}

// ======================================================
// LOOP
// ======================================================
void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // HUMEDAD SUELO
  int lectura = analogRead(SOIL_PIN);
  int humedad = map(lectura, valorSeco, valorMojado, 0, 100);
  humedad = constrain(humedad, 0, 100);

  // TEMPERATURA
  float temp = dht.readTemperature();

  // PUBLICAR
  publish(topicHumedad, String(humedad));
  publish(topicTemperatura, isnan(temp) ? "0" : String(temp));

  delay(2000);
}


//📚 Librerías utilizadas en el ESP32 — Proyecto AgroSens (Documentación Oficial)

A continuación se listan las librerías empleadas en el firmware del ESP32 para la lectura de sensores, gestión de WiFi y comunicación MQTT segura con HiveMQ Cloud.

🧩 1. Adafruit Unified Sensor

Autor: Adafruit
Versión utilizada: 1.1.15
Descripción:
Framework base requerido por múltiples librerías de sensores de Adafruit. Proporciona una capa unificada para gestionar sensores, normalizar unidades y simplificar la obtención de valores.

🧩 2. DHT Sensor Library (Adafruit)

Autor: Adafruit
Versión utilizada: 1.4.6
Descripción:
Librería para sensores de temperatura y humedad DHT11, DHT22 y similares. Permite leer temperatura y humedad ambiental a través del protocolo digital utilizado por estos módulos.

🧩 3. MQTT (Arduino MQTT Client)

Autor: Joel Gaehwiler
Versión utilizada: 2.5.2
Descripción:
Cliente MQTT para Arduino compatible con múltiples plataformas. Incluye una implementación basada en lwMQTT y permite conectarse a brokers MQTT mediante TCP y WebSockets.
En AgroSens se utiliza para manejar mensajes MQTT en el ESP32 cuando se requieren funciones personalizadas.

🧩 4. PubSubClient

Autor: Nick O’Leary
Versión utilizada: 2.8
Descripción:
Cliente MQTT ligero diseñado para microcontroladores. Permite publicar y suscribirse a topics MQTT en brokers como HiveMQ Cloud.
Es la librería principal utilizada en este proyecto para la comunicación del ESP32 con la nube.

📌 Resumen funcional en el proyecto AgroSens
Librería	Función en el Proyecto
Adafruit Unified Sensor	Base para sensores Adafruit como DHT11/DHT22.
DHT Sensor Library	Lectura digital del sensor de temperatura DHT11.
MQTT (Joel Gaehwiler)	Cliente MQTT alternativo, útil para pruebas o usos especiales.
PubSubClient	Cliente MQTT principal para enviar datos a HiveMQ Cloud.
📦 Notas para documentación técnica

Todas las librerías fueron instaladas a través del Library Manager de Arduino IDE.

El ESP32 utiliza conexiones TLS (8883) para comunicación con el broker HiveMQ Cloud.

El DHT11 requiere la librería de Adafruit y el framework Unified Sensor para funcionar correctamente.

PubSubClient es compatible con el ESP32, pero depende de WiFiClientSecure para habilitar TLS.