// =======================================
// 🔧 Load .env sebelum apapun
require('dotenv').config();

// =======================================
// 🔥 Jalankan MQTT Bridge (Firebase Sync)
require('./mqttBridge');

// =======================================
// 🧱 Import package utama
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// =======================================
// 🧩 Import route API
const authRoutes = require('./routes/auth');
const relayRoutes = require('./routes/relay');
const paymentRoutes = require('./routes/payment');

// =======================================
// ⚙️ Inisialisasi express
const app = express();
const PORT = process.env.PORT || 3000;

// =======================================
// 🧰 Middleware
app.use(cors());
app.use(bodyParser.json());

// =======================================
// 🌐 Route utama
app.use('/api/auth', authRoutes);     // MySQL Auth API
app.use('/api/relay', relayRoutes);   // MQTT Relay API
app.use('/api/payment', paymentRoutes); // Midtrans Payment API

// =======================================
// 🔍 Root endpoint
app.get('/', (req, res) => {
  res.send('✅ Smart Lock API + Firebase + Midtrans + MQTT is Running!');
});

// =======================================
// 🚀 Jalankan server
app.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`🚀 Server running on http://192.168.20.19:${PORT}`);
  console.log(`======================================`);
  console.log(`✅ Auth API (MySQL) Loaded`);
  console.log(`✅ Relay API (MQTT) Loaded`);
  console.log(`✅ Payment API (Midtrans) Loaded`);
  console.log(`🔥 Firebase Sync (via mqttBridge) is ACTIVE`);
});
