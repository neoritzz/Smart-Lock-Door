// src/firebaseConfig.js

// Import fungsi dari SDK Firebase
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Konfigurasi Firebase (sama seperti di project kamu)
const firebaseConfig = {
  apiKey: "AIzaSyB70S_chIk9hiKNDx-daCtTcr4UdX-MPs4",
  authDomain: "sld-mtt.firebaseapp.com",
  databaseURL: "https://sld-mtt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sld-mtt",
  storageBucket: "sld-mtt.appspot.com", // ✅ gunakan .appspot.com
  messagingSenderId: "870865035831",
  appId: "1:870865035831:web:68e9e943616d5c09b415b2",
  measurementId: "G-SGF00VWMW7"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan Firebase
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Tidak perlu getAnalytics() di React Native / Expo
export { app, db, auth, storage };
