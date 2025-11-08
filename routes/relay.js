// routes/relay.js
const express = require('express');
const mqtt = require('mqtt');
const router = express.Router();

// ===== Konfigurasi MQTT Broker =====
// Gunakan broker lokal atau public broker
const MQTT_BROKER = 'mqtt://broker.hivemq.com'; // bisa juga mqtt://192.168.1.100
const MQTT_TOPIC = 'smartlock/esp32/relay';

// ===== Inisialisasi MQTT Client =====
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ MQTT connected to broker:', MQTT_BROKER);
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err);
});

// ===== Endpoint untuk kontrol relay =====
router.post('/', (req, res) => {
  const { relay, state } = req.body;

  if (![1, 2, 3].includes(relay) || !['on', 'off'].includes(state)) {
    return res.status(400).json({ error: 'Invalid relay number or state' });
  }

  const message = JSON.stringify({ relay, state });

  client.publish(MQTT_TOPIC, message, { qos: 1 }, (err) => {
    if (err) {
      console.error('MQTT publish error:', err);
      return res.status(500).json({ error: 'Failed to send MQTT message' });
    }

    console.log(`📡 MQTT sent: ${message}`);
    res.json({ success: true, message: `Relay ${relay} turned ${state}` });
  });
});

module.exports = router;
