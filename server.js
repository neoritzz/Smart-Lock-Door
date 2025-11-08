// backend/server.js
require('./mqttBridge'); // Jalankan bridge otomatis

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const relayRoutes = require('./routes/relay');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/relay', relayRoutes);

app.get('/', (req, res) => {
  res.send('Smart Lock API and MQTT Bridge is Running!');
});

app.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`🚀 Server running on http://192.168.20.8:${PORT}`);
  console.log(`======================================`);
  console.log(`✅ Auth API (MySQL) Loaded`);
  console.log(`✅ Relay API (MQTT) Loaded`);
  console.log(`🔥 Firebase Sync (via mqttBridge) is ACTIVE.`);
});
