// mqttBridge.js - Jembatan Komunikasi Backend
const mqtt = require('mqtt');
const admin = require('firebase-admin');
const colors = require('colors'); 

// --- CONFIG WIFI & MQTT (Sesuaikan dengan data Anda) ---
const MQTT_BROKER = "mqtts://084e23b41bf7412481a138a15b69cec3.s1.eu.hivemq.cloud:8883";
const MQTT_USER = "smartlock";
const MQTT_PASS = "1Q2w3e4r5t!!";
// Topics yang didengarkan oleh Bridge (dari ESP32)
const STATUS_TOPIC = "smartlock/relay/+/status"; 
const LOG_TOPIC = "smartlock/logs";              

// --- FIREBASE ADMIN ---
// Pastikan file serviceAccountKey.json ada di direktori yang sama
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sld-mtt-default-rtdb.asia-southeast1.firebasedatabase.app", 
});
const db = admin.database();

// --- MQTT CLIENT ---
const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASS,
  // Opsi tambahan untuk MQTTs/WSS:
  protocol: 'mqtts', // Pastikan menggunakan protokol aman
  rejectUnauthorized: false, // Digunakan jika tidak menggunakan CA Certificate (berisiko, hanya untuk development)
  reconnectPeriod: 3000,
  connectTimeout: 10000
});

// =========================================================
// ======= LISTENER KONTROL APLIKASI (FB -> MQTT) =======
// =========================================================
function setupAppControlListener(client) {
    const appCommandRef = db.ref('smartLock/appCommands');

    // Mendengarkan SETIAP ENTRI BARU (Perintah dari Aplikasi Mobile)
    appCommandRef.on('child_added', (snapshot) => {
        const newCommand = snapshot.val();
        const commandKey = snapshot.key;
        
        console.log(`\n🚨 [FIREBASE] NEW APP COMMAND DETECTED: ${commandKey}`.red);
        
        if (newCommand && typeof newCommand.relay === 'number' && typeof newCommand.value === 'number') {
            const { relay, value } = newCommand;
            
            // Topic yang didengarkan oleh ESP32: smartlock/relay/{id}/control
            const mqttTopic = `smartlock/relay/${relay}/control`; 
            const payload = value === 1 ? 'ON' : 'OFF'; 

            console.log(`📤 Firebase Command -> MQTT: ${mqttTopic} = ${payload}`.yellow);

            // 1. Kirim perintah melalui MQTT ke ESP32
            client.publish(mqttTopic, payload, { qos: 1, retain: false }, (err) => {
                if (err) console.error("❌ MQTT Publish Error:", err);
                else console.log(`✅ MQTT command published successfully.`);
            });

            // 2. Hapus log perintah dari Firebase (MENCEGAH LOOPING!)
            snapshot.ref.remove()
                .then(() => console.log(`✅ Command ${commandKey} removed after processing.`.green))
                .catch(error => console.error("❌ Error removing command:", error.message));
        } else {
            console.warn(`⚠️ [FIREBASE] Command log tidak valid atau tidak lengkap: ${commandKey}`);
            snapshot.ref.remove(); // Hapus command tidak valid juga
        }
    }, (errorObject) => {
        console.error("❌ The app control read failed: " + errorObject.code);
    });
    
    console.log('✅ Listening for mobile app commands on smartLock/appCommands'.yellow);
}

// --- MQTT -> Firebase (Status Balik dan Log ESP32) ---
mqttClient.on('message', (topic, message) => {
  const payload = message.toString();
  console.log(`📩 [MQTT] ${topic}: ${payload}`.gray);

  // 1. HANDLE STATUS BALIK (smartlock/relay/{id}/status)
  if (topic.match(/^smartlock\/relay\/\d+\/status$/)) {
    const parts = topic.split('/');
    const relayId = parts[2];

    // Normalisasi payload ke boolean yang dibaca RN
    const normalized = (payload.trim().toUpperCase() === 'ON') ? true : false;

    // Tulis status ke jalur yang digunakan oleh RN UI (smartLock/relayStatus/relay{N})
    const fbPath = `smartLock/relayStatus/relay${relayId}`;
    db.ref(fbPath).set(normalized)
      .then(() => console.log(`🔥 Firebase set ${fbPath} = ${normalized}`.magenta))
      .catch(err => console.error('❌ Firebase write error:', err.message || err));
  }

  // 2. HANDLE LOGS RFID/Lainnya (smartlock/logs)
  if (topic === LOG_TOPIC) {
    try {
      const logData = JSON.parse(payload);
      logData.timestamp = admin.database.ServerValue.TIMESTAMP;
      // Simpan log ke jalur yang dibaca oleh RN UI
      db.ref('smartLock/activityLogs').push(logData) 
        .then(() => console.log('📝 New RFID log saved to Firebase.'.cyan));
    } catch (e) {
      console.error('❌ Invalid JSON payload in LOG_TOPIC:', payload);
    }
  }
});

mqttClient.on('connect', () => {
  console.log('✅ MQTT Bridge Connected!'.green);
  mqttClient.subscribe([STATUS_TOPIC, LOG_TOPIC], (err) => {
    if (!err) {
      console.log('📡 Subscribed to status and log topics.');
    }
  });
  setupAppControlListener(mqttClient);
});

mqttClient.on('error', (err) => console.error('❌ MQTT Error:', err.message || err));

// Tambahkan event handler untuk koneksi ulang
mqttClient.on('reconnect', () => console.log('🔄 Reconnecting to MQTT...'.yellow));
mqttClient.on('close', () => console.log('🔴 MQTT connection closed.'.red));

module.exports = { mqttClient };