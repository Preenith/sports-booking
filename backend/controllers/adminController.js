const User = require('../models/User');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const TimeSlot = require('../models/TimeSlot');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalFacilities = await Facility.countDocuments();

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = await Booking.countDocuments({
      booking_date: today,
      booking_status: 'confirmed'
    });

    const upcomingBookings = await Booking.countDocuments({
      booking_date: { $gte: today },
      booking_status: 'confirmed'
    });

    const confirmedBookings = await Booking.find({ booking_status: 'confirmed' })
      .populate('facility_id');

    let totalRevenue = 0;
    const sportCounts = {};
    const facilityUsage = {};

    confirmedBookings.forEach(booking => {
      totalRevenue += booking.total_amount || 0;
      
      if (booking.facility_id) {
        const sport = booking.facility_id.sport_type;
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;

        const facilityId = booking.facility_id._id.toString();
        const facilityName = booking.facility_id.name;
        if (!facilityUsage[facilityId]) {
          facilityUsage[facilityId] = { _id: facilityId, facilityName, bookings: 0 };
        }
        facilityUsage[facilityId].bookings++;
      }
    });

    const bookingsBySport = Object.entries(sportCounts)
      .map(([sport, count]) => ({ _id: sport, count }))
      .sort((a, b) => b.count - a.count);

    const facilityUsageArray = Object.values(facilityUsage)
      .sort((a, b) => b.bookings - a.bookings);

    res.json({
      totalUsers,
      totalFacilities,
      todayBookings,
      upcomingBookings,
      totalRevenue,
      bookingsBySport,
      facilityUsage: facilityUsageArray
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json({ message: 'User status updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllFacilitiesAdmin = async (req, res) => {
  try {
    const facilities = await Facility.find().sort({ createdAt: -1 });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createFacility = async (req, res) => {
  try {
    const {
      name,
      sport_type,
      location,
      description,
      price_per_hour,
      image,
      facilities_available,
      rules
    } = req.body;

    if (!name || !sport_type || !location || !description || !price_per_hour) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const facility = await Facility.create({
      name,
      sport_type,
      location,
      description,
      price_per_hour,
      image: image || '',
      facilities_available: facilities_available || '',
      rules: rules || '',
      rating: 4.5,
      review_count: 0,
      status: 'active'
    });

    res.status(201).json({ message: 'Facility created successfully', facility });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const {
      name,
      sport_type,
      location,
      description,
      price_per_hour,
      image,
      facilities_available,
      rules,
      status
    } = req.body;

    if (name) facility.name = name;
    if (sport_type) facility.sport_type = sport_type;
    if (location) facility.location = location;
    if (description) facility.description = description;
    if (price_per_hour) facility.price_per_hour = price_per_hour;
    if (image !== undefined) facility.image = image;
    if (facilities_available !== undefined) facility.facilities_available = facilities_available;
    if (rules !== undefined) facility.rules = rules;
    if (status) facility.status = status;

    await facility.save();

    res.json({ message: 'Facility updated successfully', facility });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    facility.status = 'inactive';
    await facility.save();

    res.json({ message: 'Facility deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createTimeSlot = async (req, res) => {
  try {
    const { facility_id, date, start_time, end_time } = req.body;

    if (!facility_id || !date || !start_time || !end_time) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingSlot = await TimeSlot.findOne({
      facility_id,
      date,
      start_time
    });

    if (existingSlot) {
      return res.status(400).json({ message: 'Slot already exists for this time' });
    }

    const slot = await TimeSlot.create({
      facility_id,
      date,
      start_time,
      end_time,
      status: 'available'
    });

    res.status(201).json({ message: 'Time slot created successfully', slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTimeSlot = async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    const { status } = req.body;
    if (status) {
      slot.status = status;
      await slot.save();
    }

    res.json({ message: 'Time slot updated successfully', slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, date, facility } = req.query;
    let query = {};

    if (status) query.booking_status = status;
    if (date) query.booking_date = date;
    if (facility) query.facility_id = facility;

    const bookings = await Booking.find(query)
      .populate('facility_id')
      .populate('user_id', '-password')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { booking_status, payment_status } = req.body;
    if (booking_status) booking.booking_status = booking_status;
    if (payment_status) booking.payment_status = payment_status;

    await booking.save();

    res.json({ message: 'Booking status updated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllFacilitiesAdmin,
  createFacility,
  updateFacility,
  deleteFacility,
  createTimeSlot,
  updateTimeSlot,
  getAllBookingsAdmin,
  updateBookingStatus
};
