const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log('Admin API:', req.method, req.url);
  next();
});

const { auth } = require('../backend/middleware/auth');
const { getDashboardStats } = require('../backend/controllers/adminController');

const handleRequest = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname + url.search;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    console.log('Admin API:', req.method, path);
    
    if (path === '/api/admin/dashboard' && req.method === 'GET') {
      await auth(req, res, async () => {
        await getDashboardStats(req, res);
      });
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = (req, res) => {
  return handleRequest(req, res);
};
