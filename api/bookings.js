const { auth } = require('../backend/middleware/auth');
const { createBooking, getMyBookings } = require('../backend/controllers/bookingController');

const handleRequest = async (req, res) => {
  try {
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
    
    console.log('Bookings API:', req.method, path);
    
    const query = {};
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }
    req.query = query;
    
    // Parse body for POST requests
    let body = null;
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
      try {
        body = JSON.parse(req.body || '{}');
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON' });
      }
    }
    
    if (path === '/api/bookings' && req.method === 'POST') {
      req.body = body;
      await auth(req, res, async () => {
        await createBooking(req, res);
      });
    } else if (path === '/api/bookings/my' && req.method === 'GET') {
      await auth(req, res, async () => {
        await getMyBookings(req, res);
      });
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = handleRequest;
