// backend/routes/relay.js
const express = require('express');
const mqtt = require('mqtt');
const router = express.Router();

const MQTT_BROKER = 'mqtts://084e23b41bf7412481a138a15b69cec3.s1.eu.hivemq.cloud:8883';
const MQTT_USER = 'smartlock';
const MQTT_PASS = '1Q2w3e4r5t!!';
const MQTT_TOPIC_BASE = 'smartlock/relay';

const client = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASS,
});

client.on('connect', () => {
  console.log('✅ MQTT connected to broker');
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err);
});

router.post('/', (req, res) => {
  const { relay, state } = req.body;

  if (![1, 2, 3].includes(relay) || !['ON', 'OFF'].includes(state.toUpperCase()))
    return res.status(400).json({ error: 'Invalid relay number or state' });

  const topic = `${MQTT_TOPIC_BASE}/${relay}/control`;
  client.publish(topic, state.toUpperCase(), { qos: 1 }, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to send MQTT message' });
    console.log(`📡 MQTT sent: ${topic} → ${state}`);
    res.json({ success: true, message: `Relay ${relay} turned ${state}` });
  });
});

module.exports = router;
