const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { db } = require('./config/firebase');

const app = express();

db.collection('users').get().then(() => {
  console.log('Firebase Connected');
}).catch(err => {
  console.error('Firebase connection error:', err);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
