const { getAllFacilities, getSportTypes, getFacilityById, getFacilityAvailability } = require('../backend/controllers/facilityController');

const handleRequest = async (req, res) => {
  try {
    // Vercel passes the full URL without the domain
    const fullUrl = req.url || '';
    console.log('Full URL:', fullUrl);
    
    // Split path and query string
    const [path, queryString] = fullUrl.split('?');
    
    console.log('Parsed path:', path);
    console.log('Query string:', queryString);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Parse query params
    const query = {};
    if (queryString) {
      const params = new URLSearchParams(queryString);
      for (const [key, value] of params.entries()) {
        query[key] = value;
      }
    }
    
    // Match routes
    const isFacilitiesRoute = path === '/api/facilities';
    const isSportsRoute = path === '/api/facilities/sports';
    const isFacilityById = path.match(/^\/api\/facilities\/[^\/?]+$/);
    const isAvailability = path.match(/^\/api\/facilities\/[^\/?]+\/availability$/);
    
    console.log('Route checks:', { isFacilitiesRoute, isSportsRoute, isFacilityById, isAvailability });
    
    if (isFacilitiesRoute && req.method === 'GET') {
      console.log('Matching: /api/facilities GET');
      req.query = query;
      await getAllFacilities(req, res);
    } else if (isSportsRoute && req.method === 'GET') {
      console.log('Matching: /api/facilities/sports GET');
      await getSportTypes(req, res);
    } else if (isFacilityById && req.method === 'GET') {
      console.log('Matching: /api/facilities/:id GET');
      const id = path.split('/')[3];
      req.params = { id };
      req.query = query;
      await getFacilityById(req, res);
    } else if (isAvailability && req.method === 'GET') {
      console.log('Matching: /api/facilities/:id/availability GET');
      const id = path.split('/')[3];
      req.params = { id };
      req.query = query;
      await getFacilityAvailability(req, res);
    } else {
      console.log('No route matched');
      res.status(404).json({ message: 'Route not found', path, method: req.method });
    }
  } catch (error) {
    console.error('Facilities error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = handleRequest;
