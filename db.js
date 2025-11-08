// backend/db.js
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // ganti sesuai MySQL kamu
  database: 'sld',
});

connection.connect(err => {
  if (err) throw err;
  console.log('✅ Connected to MySQL DB');
});

module.exports = connection;
