// src/utils/mqttConnector.js
import { connect } from 'mqtt/dist/mqtt';

let client;

export const connectMQTT = () => {
  const broker = 'mqtt://192.168.20.9:1883'; // ← IP broker lokal kamu
  console.log('🔄 Menghubungkan ke MQTT broker...');

  client = connect(broker, {
    reconnectPeriod: 2000,
    connectTimeout: 5000,
    protocol: 'mqtt',
  });

  client.on('connect', () => {
    console.log('✅ MQTT Connected!');
  });

  client.on('error', (err) => {
    console.log('❌ MQTT Connection Error:', err.message);
  });

  client.on('message', (topic, message) => {
    console.log(`📩 Pesan dari ${topic}: ${message.toString()}`);
  });

  return client;
};

export const publishMessage = (topic, message) => {
  if (client && client.connected) {
    client.publish(topic, message.toString(), { qos: 0 });
    console.log(`📤 Pesan terkirim ke ${topic}: ${message}`);
  } else {
    console.log('⚠️ MQTT belum terkoneksi!');
  }
};
