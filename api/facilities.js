const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log('Facilities API:', req.method, req.url);
  next();
});

const { getAllFacilities, getSportTypes, getFacilityById, getFacilityAvailability } = require('../backend/controllers/facilityController');

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
    
    console.log('Facilities API:', req.method, path);
    
    if (path === '/api/facilities' && (req.method === 'GET' || req.method === 'OPTIONS')) {
      await getAllFacilities(req, res);
    } else if (path === '/api/facilities/sports' && (req.method === 'GET' || req.method === 'OPTIONS')) {
      await getSportTypes(req, res);
    } else if (path.match(/^\/api\/facilities\/[^\/]+$/)) {
      const id = path.split('/')[3];
      req.params = { id };
      await getFacilityById(req, res);
    } else if (path.match(/^\/api\/facilities\/[^\/]+\/availability$/)) {
      const id = path.split('/')[3];
      req.params = { id };
      await getFacilityAvailability(req, res);
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Facilities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = (req, res) => {
  return handleRequest(req, res);
};

module.exports = (req, res) => {
  app(req, res);
};
