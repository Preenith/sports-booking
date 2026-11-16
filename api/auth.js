const { register, login } = require('../backend/controllers/authController');

const handleRequest = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    console.log('Auth API:', req.method, path);
    
    // Parse body for POST requests
    let body = null;
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
      try {
        body = JSON.parse(req.body || '{}');
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON' });
      }
    }
    
    if (path === '/api/auth/register' && req.method === 'POST') {
      req.body = body;
      await register(req, res);
    } else if (path === '/api/auth/login' && req.method === 'POST') {
      req.body = body;
      await login(req, res);
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = handleRequest;
