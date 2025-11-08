// ======================= AUTH ROUTES =======================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Pastikan path ke koneksi MySQL Anda benar
const router = express.Router();
const admin = require('firebase-admin');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Pastikan Firebase Admin sudah diinisialisasi
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json'); // Pastikan path benar
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://sld-mtt-default-rtdb.asia-southeast1.firebasedatabase.app',
  });
}

const firebaseDB = admin.database();

// ============================================================
// ======================= REGISTER (FIXED LOGIC) ==============
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { uid, username, password, role } = req.body;

    // Tentukan role: Default 'user', jika role di body adalah 'admin', maka 'admin'.
    const userRole =
      role && role.trim().toLowerCase() === 'admin' ? 'admin' : 'user';

    // 1. Logika untuk ADMIN (TIDAK ADA UID WAJIB)
    if (userRole === 'admin') {
      if (!username || !password)
        return res
          .status(400)
          .json({ message: 'Username dan password wajib diisi untuk Admin' });

      // Cek username duplikat di MySQL
      db.query('SELECT * FROM user WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length > 0)
          return res.status(409).json({ message: 'Username sudah dipakai' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan Admin ke MySQL. Kolom UID akan NULL.
        db.query(
          'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
          [username, hashedPassword, userRole],
          (err2) => {
            if (err2)
              return res.status(500).json({
                message: 'Gagal menyimpan Admin ke database',
              });

            // Admin tidak disimpan ke Firebase.
            res.status(201).json({
              message: 'Registrasi Admin berhasil (MySQL)',
              user: { username, role: userRole, uid: null },
            });
          }
        );
      });
      return;
    }

    // 2. Logika untuk USER (WAJIB ADA UID)
    if (!uid || !username || !password)
      return res
        .status(400)
        .json({ message: 'UID, username, dan password wajib diisi untuk User' });

    // Cek UID sudah ada atau belum di MySQL
    db.query('SELECT * FROM user WHERE uid = ?', [uid], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0)
        return res.status(409).json({ message: 'UID sudah terdaftar' });

      // Cek username duplikat
      db.query('SELECT * FROM user WHERE username = ?', [username], async (err, results2) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results2.length > 0)
          return res.status(409).json({ message: 'Username sudah dipakai' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan User ke MySQL (Lengkap dengan UID)
        db.query(
          'INSERT INTO user (uid, username, password, role) VALUES (?, ?, ?, ?)',
          [uid, username, hashedPassword, userRole],
          async (err2) => {
            if (err2)
              return res
                .status(500)
                .json({ message: 'Gagal menyimpan ke database' });

            // Sinkronkan ke Firebase Realtime DB
            const userRef = firebaseDB.ref('users/' + uid);
            await userRef.set({
              uid,
              username,
              role: userRole,
              createdAt: admin.database.ServerValue.TIMESTAMP,
              lastLogin: null,
              isOnline: false,
            });

            res.status(201).json({
              message: 'Registrasi berhasil dan disinkronkan ke Firebase',
              user: { uid, username, role: userRole },
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============================================================
// ========================== LOGIN (FIXED LOGIC) ==============
// ============================================================
router.post('/login', (req, res) => {
  const { uid, username, password } = req.body;
  let searchField = '';
  let searchValue = '';

  // Tentukan pencarian di MySQL
  if (uid && uid.trim() !== '') {
    // Login dengan UID (User)
    searchField = 'uid';
    searchValue = uid;
  } else if (username && username.trim() !== '') {
    // Login dengan username (Admin)
    searchField = 'username';
    searchValue = username;
  } else {
    return res.status(400).json({
      message: 'UID/Username dan password wajib diisi',
    });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password wajib diisi' });
  }

  // 1. Cek di MySQL
  db.query(`SELECT * FROM user WHERE ${searchField} = ?`, [searchValue], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0)
      return res.status(401).json({ message: 'Kredensial tidak ditemukan' });

    const user = results[0];

    // User biasa tidak boleh login hanya dengan username
    if (user.role === 'user' && user.uid !== null && searchField === 'username') {
      return res.status(401).json({ message: 'Akun User wajib login menggunakan UID' });
    }

    // 2. Bandingkan password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Password salah' });

    // 3. Buat JWT Token
    const tokenPayload = {
      uid: user.uid,
      username: user.username,
      role: user.role,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // 4. Update Firebase jika User
    if (user.uid && user.role === 'user') {
      const userRef = firebaseDB.ref('users/' + user.uid);
      await userRef.update({
        lastLogin: admin.database.ServerValue.TIMESTAMP,
        isOnline: true,
      });
    }

    res.status(200).json({
      message: 'Login berhasil',
      user: { uid: user.uid, username: user.username, role: user.role },
      token,
    });
  });
});

// ============================================================
// ========================= LOGOUT ============================
// ============================================================
router.post('/logout', async (req, res) => {
  try {
    const { uid } = req.body;

    // Hanya update Firebase jika UID tersedia (untuk User)
    if (uid) {
      const userRef = firebaseDB.ref('users/' + uid);
      await userRef.update({ isOnline: false });
    }

    res.status(200).json({ message: 'Logout berhasil' });
  } catch (err) {
    console.error('❌ Logout Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
