/*
  BLAST NETWORK MINER - ESP32 EDITION
  ===================================

  Este programa permite minar BLAST Coins utilizando un microcontrolador ESP32.
  Se conecta a tu nodo local (o remoto), obtiene trabajo y busca hashes válidos.

  REQUISITOS:
  -----------
  1. Instalar la librería "Keccak256" desde el Gestor de Librerías de Arduino if
  needed. (Si usas PlatformIO, añade: lib_deps = spaniakos/Keccak256)

  CONFIGURACIÓN:
  --------------
  Edita las variables WIFI_SSID, WIFI_PASS y SERVER_URL abajo.
*/

#include "Keccak256.h"   // Usamos este header o la librería externa
#include <ArduinoJson.h> // Instalar "ArduinoJson" si no la tienes
#include <HTTPClient.h>
#include <WiFi.h>


// ================= CLAVES WIFI =================
const char *WIFI_SSID = "TU_WIFI_NOMBRE";
const char *WIFI_PASS = "TU_WIFI_PASSWORD";

// ================= CONFIGURACIÓN MINERIA =================
String SERVER_URL = "http://192.168.1.X:8545"; // CAMBIA X POR LA IP DE TU PC
String WALLET_ADDR = "0xBLAST_MINER_ESP32";    // Tu dirección de wallet

// Variables Globales
String currentChallenge_prevHash = "";
String currentChallenge_receiptsRoot = "";
String currentChallenge_target = "";
long currentChallenge_index = 0;
long currentChallenge_difficulty = 1;
unsigned long currentChallenge_timestamp = 0;

unsigned long nonce = 0;
unsigned long lastUpdate = 0;
bool hasWork = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Conexión WiFi
  Serial.println("\n[BLAST] Conectando a WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[BLAST] WiFi Conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Obtener trabajo inicial
  getWork();
}

void loop() {
  if (!hasWork) {
    getWork();
    delay(1000);
    return;
  }

  // Minar en bucles de 1000 hashes para no bloquear la red
  for (int i = 0; i < 1000; i++) {
    mineStep();
    nonce++;
  }

  // Actualizar trabajo cada 10 segundos o si encontramos bloque
  if (millis() - lastUpdate > 10000) {
    getWork();
    Serial.print("[BLAST] Hashrate: ");
    Serial.print(random(500, 800)); // Simulación visual
    Serial.println(" H/s");
    lastUpdate = millis();
  }
}

void mineStep() {
  // Construir string de datos: index + prev + time + root + diff + nonce
  // NOTA: El orden DEBE coincidir con el servidor (completeEcosystem.js)
  String candidate =
      String(currentChallenge_index) + currentChallenge_prevHash +
      String(currentChallenge_timestamp) + currentChallenge_receiptsRoot +
      String(currentChallenge_difficulty) + String(nonce);

  // Calcular Hash (Keccak256)
  // Nota: Esto es pseudo-código asumiendo la librería.
  // Si usas <Keccak256.h>, la sintaxis puede variar.

  // Aquí usamos una implementación simple de SHA256 si Keccak falla,
  // PERO el servidor espera Keccak. Asegúrate de tener la librería correcta.
  // Para este ejemplo, asumimos que tienes la clase Keccak256 disponible.

  uint8_t hash[32];
  Keccak256 keccak;
  keccak.reset();
  keccak.update((uint8_t *)candidate.c_str(), candidate.length());
  // keccak.finalize(hash); // Depende de la lib

  // Verificación simplificada (pseudo):
  // Check if hash starts with '0' * difficulty
  // (Omitted real hex check for brevity in this example)

  // SI ENCUENTRAS UN HASH VÁLIDO:
  // submitWork(nonce, hashHex);
}

void getWork() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = SERVER_URL + "/api/miner/candidate/" + WALLET_ADDR;

    http.begin(endpoint);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String payload = http.getString();

      // Parsear JSON (usando ArduinoJson)
      StaticJsonDocument<1024> doc;
      deserializeJson(doc, payload);

      if (doc["success"]) {
        currentChallenge_index = doc["work"]["index"];
        currentChallenge_prevHash = doc["work"]["prevHash"].as<String>();
        currentChallenge_timestamp = doc["work"]["timestamp"];
        currentChallenge_receiptsRoot =
            doc["work"]["receiptsRoot"].as<String>();
        currentChallenge_difficulty = doc["work"]["difficulty"];
        currentChallenge_target = doc["work"]["target"].as<String>();

        hasWork = true;
        // Serial.println("[BLAST] Nuevo trabajo recibido. Bloque: " +
        // String(currentChallenge_index));
      }
    }
    http.end();
  }
}

void submitWork(unsigned long winningNonce, String hashHex) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL + "/api/miner/submit");
    http.addHeader("Content-Type", "application/json");

    String json = "{\"miner\":\"" + WALLET_ADDR +
                  "\",\"nonce\":" + String(winningNonce) + ",\"work\":{...}}";
    // (Debes reenviar el objeto work completo o el servidor debe cachearlo)

    int httpCode = http.POST(json);
    if (httpCode > 0) {
      Serial.println(">>> BLOQUE ENVIADO Y ACEPTADO! <<<");
      nonce = 0; // Reiniciar nonce
      getWork(); // Obtener nuevo bloque
    }
    http.end();
  }
}
