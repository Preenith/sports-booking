const Facility = require('../models/Facility');
const TimeSlot = require('../models/TimeSlot');

const getAllFacilities = async (req, res) => {
  try {
    const { sport, location } = req.query;
    let query = { status: 'active' };

    if (sport) {
      query.sport_type = sport;
    }

    let facilities = await Facility.find(query);

    if (location) {
      facilities = facilities.filter(f => 
        f.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    facilities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Transform _id to id for frontend compatibility
    const transformedFacilities = facilities.map(f => ({
      ...f.toObject(),
      id: f._id.toString()
    }));
    
    res.json(transformedFacilities);
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const transformedFacility = {
      ...facility.toObject(),
      id: facility._id.toString()
    };

    res.json(transformedFacility);
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

    const slots = await TimeSlot.find({
      facility_id: id,
      date: date
    });

    slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

    res.json(slots);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSportTypes = async (req, res) => {
  try {
    const facilities = await Facility.find({ status: 'active' });
    const sportTypes = new Set();
    facilities.forEach(f => {
      if (f.sport_type) sportTypes.add(f.sport_type);
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
