const { db } = require('../config/firebase');

const getAllFacilities = async (req, res) => {
  try {
    const { sport, location } = req.query;
    let query = db.collection('facilities').where('status', '==', 'active');

    if (sport) {
      query = query.where('sport_type', '==', sport);
    }

    const snapshot = await query.get();
    let facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (location) {
      facilities = facilities.filter(f => 
        f.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    facilities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(facilities);
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFacilityById = async (req, res) => {
  try {
    const facilityDoc = await db.collection('facilities').doc(req.params.id).get();
    
    if (!facilityDoc.exists) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    res.json({ id: facilityDoc.id, ...facilityDoc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getFacilityAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const snapshot = await db.collection('time_slots')
      .where('facility_id', '==', id)
      .where('date', '==', date)
      .get();

    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

    res.json(slots);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSportTypes = async (req, res) => {
  try {
    const snapshot = await db.collection('facilities').get();
    const sportTypes = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.sport_type) sportTypes.add(data.sport_type);
    });
    res.json(Array.from(sportTypes));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllFacilities,
  getFacilityById,
  getFacilityAvailability,
  getSportTypes
};
