const { auth } = require('../backend/middleware/auth');
const { getDashboardStats } = require('../backend/controllers/adminController');

const handleRequest = async (req, res) => {
  try {
    // Check environment variables
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;
    const searchParams = url.searchParams;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    console.log('Admin API:', req.method, path);
    
    if (path === '/api/admin/dashboard' && req.method === 'GET') {
      const query = {};
      for (const [key, value] of searchParams.entries()) {
        query[key] = value;
      }
      req.query = query;
      await auth(req, res, async () => {
        await getDashboardStats(req, res);
      });
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Admin error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = handleRequest;
