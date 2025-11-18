#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración del servidor AgroSens
const char* serverURL = "http://192.168.1.100:5000/api/sensors/v1/readings";  // Cambia por tu IP local

// Pin donde está conectado AOUT del sensor
#define SENSOR_PIN 34  

// Valores de calibración (ajústalos según tu prueba)
int valorSeco = 3000;    // Lectura en tierra completamente seca
int valorMojado = 1200;  // Lectura en tierra muy húmeda

// ID único del dispositivo
String deviceId = "ESP32-HUMEDAD-001";

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("Iniciando Sensor de Humedad AgroSens v2.0...");
  
  // Conectar a WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  int lectura = analogRead(SENSOR_PIN);

  // Convertir la lectura a porcentaje (0% a 100%)
  int humedad = map(lectura, valorSeco, valorMojado, 0, 100);
  
  // Limitar valores a 0–100%
  humedad = constrain(humedad, 0, 100);

  Serial.print("Valor ADC: ");
  Serial.print(lectura);
  Serial.print(" | Humedad: ");
  Serial.print(humedad);
  Serial.println("%");

  // Enviar datos al servidor AgroSens
  if (WiFi.status() == WL_CONNECTED) {
    enviarDatos(humedad);
  } else {
    Serial.println("WiFi desconectado, reintentando...");
    WiFi.reconnect();
  }

  delay(5000);  // Enviar cada 5 segundos
}

void enviarDatos(int humedad) {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  // Crear JSON con los datos
  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["humedad_suelo"] = humedad;
  doc["timestamp"] = millis();  // Timestamp simple

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("Enviando: ");
  Serial.println(jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Respuesta servidor: ");
    Serial.println(response);
    
    if (httpResponseCode == 201) {
      Serial.println("✅ Datos enviados correctamente");
    } else {
      Serial.print("⚠️ Código de respuesta: ");
      Serial.println(httpResponseCode);
    }
  } else {
    Serial.print("❌ Error en la conexión: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}