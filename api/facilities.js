const { getAllFacilities, getSportTypes, getFacilityById, getFacilityAvailability } = require('../backend/controllers/facilityController');

const handleRequest = async (req, res) => {
  try {
    // Parse the full URL properly for Vercel
    const fullUrl = req.url;
    console.log('Full URL:', fullUrl);
    
    // Vercel passes the full URL with /api prefix, so we need to parse it correctly
    const path = req.url.split('?')[0];
    const queryString = req.url.split('?')[1] || '';
    
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
    
    console.log('Final path:', path);
    console.log('Query:', query);
    
    if (path === '/api/facilities' && req.method === 'GET') {
      req.query = query;
      await getAllFacilities(req, res);
    } else if (path === '/api/facilities/sports' && req.method === 'GET') {
      await getSportTypes(req, res);
    } else if (path.match(/^\/api\/facilities\/([^\/?]+)$/)) {
      const id = path.split('/')[3];
      req.params = { id };
      req.query = query;
      await getFacilityById(req, res);
    } else if (path.match(/^\/api\/facilities\/([^\/?]+)\/availability$/)) {
      const id = path.split('/')[3];
      req.params = { id };
      req.query = query;
      await getFacilityAvailability(req, res);
    } else {
      console.log('No route matched for path:', path);
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    console.error('Facilities error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = handleRequest;
