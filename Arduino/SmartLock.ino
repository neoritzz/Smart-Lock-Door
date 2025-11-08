#include <SPI.h>
#include <MFRC522.h>
#include <Preferences.h>
#include <WiFi.h>
#include <vector>
#include <PubSubClient.h> 
#include <WiFiClientSecure.h> 

// ===== PIN KONFIGURASI =====
#define SS_PIN 5 
#define RST_PIN 22 
#define RELAY1_PIN 2 
#define RELAY2_PIN 25 
#define RELAY3_PIN 26 
#define BUZZER_PIN 4 
#define RESET_BTN 15 

// ===== WiFi (opsional) =====
const char* ssid = "MTT WORKSHOP LT.2";
const char* password = "Tanyaangky";

// ===== KONFIGURASI MQTT =====
const char* mqttServer = "084e23b41bf7412481a138a15b69cec3.s1.eu.hivemq.cloud";
const int mqttPort = 8883; 
const char* mqttUser = "smartlock";
const char* mqttPassword = "1Q2w3e4r5t!!";
const char* clientID = "ESP32-SmartLock-3CH"; 

// Objek Klien MQTT
WiFiClientSecure espClient; 
PubSubClient mqttClient(espClient);


// ===== RFID & NVS =====
MFRC522 rfid(SS_PIN, RST_PIN);
Preferences preferences;

// ===============================================
// ===== MASTER CARDS (3 Master Admin) =====
byte fixedMaster1[] = {0x7C, 0xE3, 0x37, 0x03}; 
byte fixedMaster2[] = {0xAA, 0xBB, 0xCC, 0xDD}; 
byte fixedMaster3[] = {0x11, 0x22, 0x33, 0x44}; 

size_t master1Size = sizeof(fixedMaster1);
size_t master2Size = sizeof(fixedMaster2);
size_t master3Size = sizeof(fixedMaster3);

// ===== Database kartu (3 Vektor Terpisah) =====
std::vector<std::vector<byte>> users1; 
std::vector<std::vector<byte>> users2; 
std::vector<std::vector<byte>> users3; 

const size_t MAX_UID_SIZE = 7;
const int MAX_CARDS = 60;

// ===== Mode operasi (Status Admin per Relay) =====
int mode1 = 0; 
int mode2 = 0;
int mode3 = 0;

// ===== Door state (Timer per Relay) =====
unsigned long relay1CloseAt = 0;
unsigned long relay2CloseAt = 0;
unsigned long relay3CloseAt = 0;
const unsigned long OPEN_MS = 5000UL;

// ===== Reset button =====
unsigned long resetPressStart = 0;
const unsigned long RESET_HOLD_MS = 2000UL;

// ===== Deklarasi Fungsi (dijaga konsistensinya) =====
void connectWiFi();
void connectMQTT(); 
void mqttCallback(char* topic, byte* payload, unsigned int length); 
void publishRelayStatus(int relayNo, const char* status); 
void publishLog(const char* user, const char* action, int relayNo); 
void loadCards();
void saveCards();
bool checkUser(byte *uid, byte size, std::vector<std::vector<byte>> &cards);
bool isMaster(byte *uid, byte size, byte *fixedMaster, size_t masterSize);
void addUser(byte *uid, byte size, std::vector<std::vector<byte>> &cards);
void delUser(byte *uid, byte size, std::vector<std::vector<byte>> &cards);
void factoryReset();
void unlockRelay(int pin, unsigned long &timer, int relayNo);
void lockRelay(int pin, int relayNo); 
void printHex(byte *buffer, byte bufferSize);
void getUidHexString(byte *uid, byte size, char* output, size_t outputSize); // Fungsi baru untuk UID string
void beepUser();
void beepDenied();
void beepModeChange();

// ===== Setup =====
void setup() {
    Serial.begin(115200);
    delay(100);

    // Inisialisasi pin I/O
    pinMode(RELAY1_PIN, OUTPUT);
    pinMode(RELAY2_PIN, OUTPUT);
    pinMode(RELAY3_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(RESET_BTN, INPUT_PULLUP);

    // Default terkunci (Relay HIGH = OFF/Kunci untuk sebagian besar modul)
    digitalWrite(RELAY1_PIN, HIGH);
    digitalWrite(RELAY2_PIN, HIGH);
    digitalWrite(RELAY3_PIN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);
    
    SPI.begin();
    rfid.PCD_Init();
    
    Serial.println(F("Menunggu stabilitas RFID..."));
    delay(2000); 

    preferences.begin("rfid3ch", false); 
    
    connectWiFi(); 
    connectMQTT(); // Koneksi MQTT akan mencoba kembali di loop
    loadCards();

    Serial.println(F("=== SMART DOOR LOCK 3 RELAY AKTIF ==="));
}

// ===== Main Loop =====
void loop() {
    // === 1. MQTT Maintenance ===
    if (WiFi.status() == WL_CONNECTED) {
        if (!mqttClient.connected()) {
            connectMQTT(); 
        } else {
            mqttClient.loop(); 
        }
    } else {
        // WiFi reconnect (dijaga konsistensi logika Anda)
        static unsigned long lastWiFiTry = 0;
        if (millis() - lastWiFiTry > 10000) {
            lastWiFiTry = millis();
            connectWiFi();
        }
    }
    
    // Handle auto-close
    if (relay1CloseAt != 0 && millis() >= relay1CloseAt) { lockRelay(RELAY1_PIN, 1); relay1CloseAt = 0; }
    if (relay2CloseAt != 0 && millis() >= relay2CloseAt) { lockRelay(RELAY2_PIN, 2); relay2CloseAt = 0; }
    if (relay3CloseAt != 0 && millis() >= relay3CloseAt) { lockRelay(RELAY3_PIN, 3); relay3CloseAt = 0; }

    // Reset button
    if (digitalRead(RESET_BTN) == LOW) {
        if (resetPressStart == 0) resetPressStart = millis();
        else if (millis() - resetPressStart >= RESET_HOLD_MS) {
            Serial.println("Factory reset dijalankan...");
            factoryReset();
            while (digitalRead(RESET_BTN) == LOW) delay(50);
            resetPressStart = 0;
        }
    } else {
        resetPressStart = 0;
    }

    // === 2. RFID check ===
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
        byte *uid = rfid.uid.uidByte;
        byte uidSize = rfid.uid.size;
        char uidString[MAX_UID_SIZE * 3 + 1]; 
        
        getUidHexString(uid, uidSize, uidString, sizeof(uidString)); // Konversi UID ke string
        Serial.print("UID Kartu:"); Serial.print(uidString); Serial.println();

        // ===== 1. MASTER CHECK (Masuk/Ganti Mode Admin) =====
        if (isMaster(uid, uidSize, fixedMaster1, master1Size)) {
            mode1 = (mode1 + 1) % 3; 
            Serial.printf("🔧 Master1 Mode: %s\n", (mode1 == 1 ? "REGISTER aktif." : (mode1 == 2 ? "DELETE aktif." : "NORMAL nonaktif."))); 
            beepModeChange();
        } else if (isMaster(uid, uidSize, fixedMaster2, master2Size)) {
            mode2 = (mode2 + 1) % 3;
            Serial.printf("🔧 Master2 Mode: %s\n", (mode2 == 1 ? "REGISTER aktif." : (mode2 == 2 ? "DELETE aktif." : "NORMAL nonaktif."))); 
            beepModeChange();
        } else if (isMaster(uid, uidSize, fixedMaster3, master3Size)) {
            mode3 = (mode3 + 1) % 3;
            Serial.printf("🔧 Master3 Mode: %s\n", (mode3 == 1 ? "REGISTER aktif." : (mode3 == 2 ? "DELETE aktif." : "NORMAL nonaktif."))); 
            beepModeChange();
        }
        // ===== 2. ADMIN MODE (Operasi Register/Delete) =====
        else if (mode1 != 0) { // Mode Admin 1 aktif
            if (mode1 == 1) { addUser(uid, uidSize, users1); } else { delUser(uid, uidSize, users1); }
        }
        else if (mode2 != 0) { // Mode Admin 2 aktif
            if (mode2 == 1) { addUser(uid, uidSize, users2); } else { delUser(uid, uidSize, users2); }
        }
        else if (mode3 != 0) { // Mode Admin 3 aktif
            if (mode3 == 1) { addUser(uid, uidSize, users3); } else { delUser(uid, uidSize, users3); }
        }
        // ===== 3. NORMAL ACCESS (Cek Kartu Akses) =====
        else if (checkUser(uid, uidSize, users1)) {
            unlockRelay(RELAY1_PIN, relay1CloseAt, 1);
            publishLog(uidString, "Unlocked by RFID", 1); 
        }
        else if (checkUser(uid, uidSize, users2)) {
            unlockRelay(RELAY2_PIN, relay2CloseAt, 2);
            publishLog(uidString, "Unlocked by RFID", 2); 
        }
        else if (checkUser(uid, uidSize, users3)) {
            unlockRelay(RELAY3_PIN, relay3CloseAt, 3);
            publishLog(uidString, "Unlocked by RFID", 3); 
        }
        // ===== 4. AKSES DITOLAK =====
        else {
            Serial.println("⚠️ Akses ditolak"); 
            beepDenied();
            publishLog(uidString, "Access Denied", 0); // Kirim log untuk akses ditolak
        }

        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
    }

    delay(10);
}

// ===================================
// ===== FUNGSI JARINGAN & MQTT (REVISI) =====
// ===================================

void connectWiFi() {
    Serial.print("Menghubungkan ke WiFi: ");
    Serial.println(ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        delay(300);
        Serial.print(".");
        retry++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi terhubung!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nGagal konek WiFi.");
    }
}

void connectMQTT() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Tidak bisa konek MQTT, WiFi terputus.");
        return;
    }
    
    // Setup TLS/SSL
    espClient.setInsecure(); 
    Serial.println("Warning: Using insecure connection (No root CA set).");
    
    mqttClient.setServer(mqttServer, mqttPort);
    mqttClient.setCallback(mqttCallback);

    Serial.print("Menghubungkan ke MQTT...");
    if (mqttClient.connect(clientID, mqttUser, mqttPassword)) {
        Serial.println("terhubung!");
        
        // SUBSCRIBE ke topik KONTROL
        mqttClient.subscribe("smartlock/relay/1/control");
        mqttClient.subscribe("smartlock/relay/2/control");
        mqttClient.subscribe("smartlock/relay/3/control");
        Serial.println("Subscribed ke topik kontrol R1, R2, R3.");
        
        // PUBLISH status awal ke topik STATUS
        publishRelayStatus(1, (digitalRead(RELAY1_PIN) == LOW) ? "ON" : "OFF");
        publishRelayStatus(2, (digitalRead(RELAY2_PIN) == LOW) ? "ON" : "OFF");
        publishRelayStatus(3, (digitalRead(RELAY3_PIN) == LOW) ? "ON" : "OFF");
        return; 
    } else {
        Serial.print("gagal, rc=");
        Serial.print(mqttClient.state());
        Serial.println(". Mencoba lagi di loop.");
    }
}

// FUNGSI CALLBACK (REVISI LOGIKA KONTROL)
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    Serial.print("📩 MQTT Message: ");
    Serial.print(topic);
    Serial.print(" -> ");

    // Baca payload ke String
    String command = "";
    for (unsigned int i = 0; i < length; i++) {
        command += (char)payload[i];
    }
    Serial.println(command);

    command.trim();
    command.toUpperCase();

    int relayNo = 0;
    // Tentukan Relay mana yang dituju
    if (strstr(topic, "smartlock/relay/1/control") != NULL) relayNo = 1;
    else if (strstr(topic, "smartlock/relay/2/control") != NULL) relayNo = 2;
    else if (strstr(topic, "smartlock/relay/3/control") != NULL) relayNo = 3;

    if (relayNo == 0) return; // Topik tidak dikenali
    
    // --- LOGIKA KONTROL RELAY ---
    if (command == "ON") {
        switch (relayNo) {
            case 1: unlockRelay(RELAY1_PIN, relay1CloseAt, 1); break; // Mengaktifkan Relay 1
            case 2: unlockRelay(RELAY2_PIN, relay2CloseAt, 2); break; // Mengaktifkan Relay 2
            case 3: unlockRelay(RELAY3_PIN, relay3CloseAt, 3); break; // Mengaktifkan Relay 3
        }
    } else if (command == "OFF") {
        switch (relayNo) {
            case 1: lockRelay(RELAY1_PIN, 1); break; // Menonaktifkan Relay 1
            case 2: lockRelay(RELAY2_PIN, 2); break;
            case 3: lockRelay(RELAY3_PIN, 3); break;
        }
    }
}

// FUNGSI PUBLISH STATUS
// Status yang dikirim adalah string "ON" atau "OFF"
void publishRelayStatus(int relayNo, const char* status) {
    // Topik yang DITERBITKAN: smartlock/relay/X/status
    String topic = "smartlock/relay/" + String(relayNo) + "/status";
    if (mqttClient.connected()) {
        mqttClient.publish(topic.c_str(), status);
        Serial.printf("📤 MQTT Status R%d: %s\n", relayNo, status);
    }
}

// FUNGSI PUBLISH LOG AKTIVITAS
// Tambahkan waktu dan tanggal agar log di Firebase lengkap
void publishLog(const char* user, const char* action, int relayNo) {
    if (!mqttClient.connected()) return;

    // Asumsi: Kita hanya mengirim status dan user
    // Bridge (server) akan menambahkan waktu, tanggal, dan Device name dari sisi server/firebase.

    // Relay name (Device)
    String deviceName = "Relay " + String(relayNo);
    if (relayNo == 0) deviceName = "N/A"; // Untuk Access Denied

    // Status / Aksi
    String statusAction = String(action);
    if (relayNo != 0) {
      statusAction += " R" + String(relayNo);
    }
    
    // Payload JSON yang DIKIRIM ESP32
    // Kirim data mentah, biarkan bridge menambahkan timestamp
    String payload = "{";
    payload += "\"device\":\"" + deviceName + "\","; // Misal: Relay 1
    payload += "\"user\":\"" + String(user) + "\","; // UID Hex Strin
    payload += "\"status\":" + statusAction + "\""; // Misal: Unlocked by RFID R1
    payload += "}";

    mqttClient.publish("smartlock/logs", payload.c_str());
    Serial.print("📤 MQTT Log: "); Serial.println(payload);
}

// ===================================
// ===== FUNGSI HELPER (PERBAIKAN) =====
// ===================================

// Fungsi untuk mengkonversi UID byte array menjadi Hex String
void getUidHexString(byte *uid, byte size, char* output, size_t outputSize) {
    String hexStr = "";
    for (int i = 0; i < size; i++) {
        if (uid[i] < 0x10) hexStr += "0";
        // Menggunakan HEX untuk konversi ke heksadesimal
        hexStr += String(uid[i], HEX);
        if (i < size - 1) hexStr += " "; // Tambahkan spasi pemisah
    }
    
    // Perbaikan: Panggil toUpperCase() yang mengembalikan void
    hexStr.toUpperCase();
    
    // Kemudian panggil toCharArray()
    hexStr.toCharArray(output, outputSize);
}

void printHex(byte *buffer, byte bufferSize) {
    for (byte i = 0; i < bufferSize; i++) {
        if (buffer[i] < 0x10) Serial.print(" 0");
        else Serial.print(" ");
        Serial.print(buffer[i], HEX);
    }
}

// ===================================
// ===== FUNGSI AKSES & RELAY (DIJAGA KONSISTENSINYA) =====
// ===================================

bool checkUser(byte *uid, byte size, std::vector<std::vector<byte>> &cards) {
    for (auto &c : cards) if (c.size() == size && memcmp(c.data(), uid, size) == 0) return true;
    return false;
}

bool isMaster(byte *uid, byte size, byte *fixedMaster, size_t masterSize) {
    if (size != masterSize) return false;
    return memcmp(uid, fixedMaster, masterSize) == 0;
}

void addUser(byte *uid, byte size, std::vector<std::vector<byte>> &cards) {
    for (auto &c : cards) if (c.size() == size && memcmp(c.data(), uid, size) == 0) {
        Serial.println("⚠️ Kartu sudah terdaftar");
        beepDenied();
        return;
    }
    if (cards.size() >= MAX_CARDS) {
        Serial.println("⚠️ Kapasitas penuh.");
        beepDenied();
        return;
    }
    cards.push_back(std::vector<byte>(uid, uid + size));
    saveCards();
    Serial.println("✅ Kartu user berhasil ditambahkan");
    beepUser();
    delay(100); 
}

void delUser(byte *uid, byte size, std::vector<std::vector<byte>> &cards) {
    for (int i = 0; i < (int)cards.size(); i++) {
        if (cards[i].size() == size && memcmp(cards[i].data(), uid, size) == 0) {
            cards.erase(cards.begin() + i);
            saveCards();
            Serial.println("✅ Kartu berhasil dihapus");
            beepUser();
            delay(100); 
            return;
        }
    }
    Serial.println("⚠️ Kartu tidak ditemukan");
    beepDenied();
}

void unlockRelay(int pin, unsigned long &timer, int relayNo) {
    digitalWrite(pin, LOW); // Aktifkan Relay (Buka Pintu)
    timer = millis() + OPEN_MS;
    Serial.printf("✅ AKSES DITERIMA — Pintu Relay %d Terbuka.\n", relayNo);
    beepUser();
    
    publishRelayStatus(relayNo, "ON"); 
}

void lockRelay(int pin, int relayNo) {
    digitalWrite(pin, HIGH); // Nonaktifkan Relay (Kunci Pintu)
    Serial.printf("🔒 RELAY: LOCK (HIGH) — Pintu Relay %d Terkunci.\n", relayNo);
    
    // Batalkan auto-close timer agar perintah LOCK dari MQTT permanen
    switch (relayNo) {
        case 1: relay1CloseAt = 0; break;
        case 2: relay2CloseAt = 0; break;
        case 3: relay3CloseAt = 0; break;
    }
    
    publishRelayStatus(relayNo, "OFF"); 
}

void factoryReset() {
    users1.clear(); users2.clear(); users3.clear();
    saveCards();
    Serial.println("Factory reset selesai. Semua kartu user dihapus.");
    for (int i=0;i<3;i++){
        digitalWrite(BUZZER_PIN, HIGH);
        delay(120);
        digitalWrite(BUZZER_PIN, LOW);
        delay(80);
    }
}

void loadCards() {
    // ... (Logika NVS loadCards yang sudah benar)
    users1.clear(); users2.clear(); users3.clear();
    
    // Memuat data untuk users1
    int c1 = preferences.getInt("u1_count", 0);
    for (int i = 0; i < c1; i++) {
        String key = "u1_" + String(i);
        int len = preferences.getInt(("u1_len" + String(i)).c_str(), 0);
        if (len > 0 && len <= (int)MAX_UID_SIZE) {
            byte buf[MAX_UID_SIZE];
            preferences.getBytes(key.c_str(), buf, len);
            users1.push_back(std::vector<byte>(buf, buf + len));
        }
    }

    // Memuat data untuk users2
    int c2 = preferences.getInt("u2_count", 0);
    for (int i = 0; i < c2; i++) {
        String key = "u2_" + String(i);
        int len = preferences.getInt(("u2_len" + String(i)).c_str(), 0);
        if (len > 0 && len <= (int)MAX_UID_SIZE) {
            byte buf[MAX_UID_SIZE];
            preferences.getBytes(key.c_str(), buf, len);
            users2.push_back(std::vector<byte>(buf, buf + len));
        }
    }

    // Memuat data untuk users3
    int c3 = preferences.getInt("u3_count", 0);
    for (int i = 0; i < c3; i++) {
        String key = "u3_" + String(i);
        int len = preferences.getInt(("u3_len" + String(i)).c_str(), 0);
        if (len > 0 && len <= (int)MAX_UID_SIZE) {
            byte buf[MAX_UID_SIZE];
            preferences.getBytes(key.c_str(), buf, len);
            users3.push_back(std::vector<byte>(buf, buf + len));
        }
    }

    Serial.printf("User cards loaded: R1=%d, R2=%d, R3=%d\n", users1.size(), users2.size(), users3.size());
}

void saveCards() {
    // ... (Logika NVS saveCards yang sudah benar)
    preferences.clear(); // Hapus semua data lama

    // Simpan users1
    preferences.putInt("u1_count", users1.size());
    for (int i = 0; i < users1.size(); i++) {
        String key = "u1_" + String(i);
        preferences.putInt(("u1_len" + String(i)).c_str(), users1[i].size());
        preferences.putBytes(key.c_str(), users1[i].data(), users1[i].size());
    }

    // Simpan users2
    preferences.putInt("u2_count", users2.size());
    for (int i = 0; i < users2.size(); i++) {
        String key = "u2_" + String(i);
        preferences.putInt(("u2_len" + String(i)).c_str(), users2[i].size());
        preferences.putBytes(key.c_str(), users2[i].data(), users2[i].size());
    }

    // Simpan users3
    preferences.putInt("u3_count", users3.size());
    for (int i = 0; i < users3.size(); i++) {
        String key = "u3_" + String(i);
        preferences.putInt(("u3_len" + String(i)).c_str(), users3[i].size());
        preferences.putBytes(key.c_str(), users3[i].data(), users3[i].size());
    }
}

void beepUser() {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(220);
    digitalWrite(BUZZER_PIN, LOW);
}
void beepDenied() {
    for (int i=0;i<3;i++){
        digitalWrite(BUZZER_PIN, HIGH);
        delay(80);
        digitalWrite(BUZZER_PIN, LOW);
        delay(60);
    }
}
void beepModeChange() {
    for (int i = 0; i < 3; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(60);
        digitalWrite(BUZZER_PIN, LOW);
        delay(60);
    }
}