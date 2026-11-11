const { db } = require('../config/firebase');

const getDashboardStats = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').where('role', '==', 'user').get();
    const totalUsers = usersSnapshot.size;

    const facilitiesSnapshot = await db.collection('facilities').get();
    const totalFacilities = facilitiesSnapshot.size;

    const today = new Date().toISOString().split('T')[0];
    const allBookingsSnapshot = await db.collection('bookings').get();
    
    const todayBookings = allBookingsSnapshot.docs.filter(
      doc => doc.data().booking_date === today && doc.data().booking_status === 'confirmed'
    ).length;

    const upcomingBookings = allBookingsSnapshot.docs.filter(
      doc => doc.data().booking_date >= today && doc.data().booking_status === 'confirmed'
    ).length;

    const confirmedBookings = allBookingsSnapshot.docs.filter(
      doc => doc.data().booking_status === 'confirmed'
    );
    
    let totalRevenue = 0;
    confirmedBookings.forEach(doc => {
      totalRevenue += doc.data().amount || 0;
    });
    
    const sportCounts = {};
    for (const doc of confirmedBookings) {
      const booking = doc.data();
      const facilityDoc = await db.collection('facilities').doc(booking.facility_id).get();
      if (facilityDoc.exists) {
        const sport = facilityDoc.data().sport_type;
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      }
    }
    
    const bookingsBySport = Object.entries(sportCounts)
      .map(([sport, count]) => ({ _id: sport, count }))
      .sort((a, b) => b.count - a.count);

    const facilityUsage = {};
    for (const doc of confirmedBookings) {
      const booking = doc.data();
      const facilityDoc = await db.collection('facilities').doc(booking.facility_id).get();
      if (facilityDoc.exists) {
        const facilityId = booking.facility_id;
        const facilityName = facilityDoc.data().name;
        if (!facilityUsage[facilityId]) {
          facilityUsage[facilityId] = { _id: facilityId, facilityName, bookings: 0 };
        }
        facilityUsage[facilityId].bookings++;
      }
    }
    
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
    const snapshot = await db.collection('users').where('role', '==', 'user').get();
    let users = snapshot.docs.map(doc => {
      const user = { id: doc.id, ...doc.data() };
      delete user.password;
      return user;
    });

    if (search) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentStatus = userDoc.data().status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    await userRef.update({ status: newStatus });

    const updatedDoc = await userRef.get();
    const user = { id: updatedDoc.id, ...updatedDoc.data() };
    delete user.password;

    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllFacilitiesAdmin = async (req, res) => {
  try {
    const snapshot = await db.collection('facilities').get();
    const facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    facilities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

    const facilityRef = await db.collection('facilities').add({
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
      status: 'active',
      created_at: new Date().toISOString()
    });

    const facilityDoc = await facilityRef.get();
    const facility = { id: facilityRef.id, ...facilityDoc.data() };

    res.status(201).json({ message: 'Facility created successfully', facility });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateFacility = async (req, res) => {
  try {
    const facilityRef = db.collection('facilities').doc(req.params.id);
    const facilityDoc = await facilityRef.get();

    if (!facilityDoc.exists) {
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

    const updateData = {};
    if (name) updateData.name = name;
    if (sport_type) updateData.sport_type = sport_type;
    if (location) updateData.location = location;
    if (description) updateData.description = description;
    if (price_per_hour) updateData.price_per_hour = price_per_hour;
    if (image !== undefined) updateData.image = image;
    if (facilities_available !== undefined) updateData.facilities_available = facilities_available;
    if (rules !== undefined) updateData.rules = rules;
    if (status) updateData.status = status;

    await facilityRef.update(updateData);

    const updatedDoc = await facilityRef.get();
    const facility = { id: facilityRef.id, ...updatedDoc.data() };

    res.json({ message: 'Facility updated successfully', facility });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFacility = async (req, res) => {
  try {
    const facilityRef = db.collection('facilities').doc(req.params.id);
    const facilityDoc = await facilityRef.get();

    if (!facilityDoc.exists) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    await facilityRef.update({ status: 'inactive' });

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

    const existingSlotSnapshot = await db.collection('time_slots')
      .where('facility_id', '==', facility_id)
      .where('date', '==', date)
      .where('start_time', '==', start_time)
      .get();

    if (!existingSlotSnapshot.empty) {
      return res.status(400).json({ message: 'Slot already exists for this time' });
    }

    const slotRef = await db.collection('time_slots').add({
      facility_id,
      date,
      start_time,
      end_time,
      status: 'available',
      created_at: new Date().toISOString()
    });

    const slotDoc = await slotRef.get();
    const slot = { id: slotRef.id, ...slotDoc.data() };

    res.status(201).json({ message: 'Time slot created successfully', slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTimeSlot = async (req, res) => {
  try {
    const slotRef = db.collection('time_slots').doc(req.params.id);
    const slotDoc = await slotRef.get();

    if (!slotDoc.exists) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    const { status } = req.body;
    if (status) {
      await slotRef.update({ status });
    }

    const updatedDoc = await slotRef.get();
    const slot = { id: slotRef.id, ...updatedDoc.data() };

    res.json({ message: 'Time slot updated successfully', slot });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, date, facility } = req.query;
    let query = db.collection('bookings');

    const snapshot = await query.get();
    let bookings = [];

    for (const doc of snapshot.docs) {
      const booking = { id: doc.id, ...doc.data() };
      
      let include = true;
      if (status && booking.booking_status !== status) include = false;
      if (date && booking.booking_date !== date) include = false;
      if (facility && booking.facility_id !== facility) include = false;

      if (include) {
        const facilityDoc = await db.collection('facilities').doc(booking.facility_id).get();
        if (facilityDoc.exists) {
          booking.facility_id = { id: facilityDoc.id, ...facilityDoc.data() };
        }

        const userDoc = await db.collection('users').doc(booking.user_id).get();
        if (userDoc.exists) {
          const user = { id: userDoc.id, ...userDoc.data() };
          delete user.password;
          booking.user_id = user;
        }

        bookings.push(booking);
      }
    }

    bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const bookingRef = db.collection('bookings').doc(req.params.id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { booking_status, payment_status } = req.body;
    const updateData = {};
    if (booking_status) updateData.booking_status = booking_status;
    if (payment_status) updateData.payment_status = payment_status;

    await bookingRef.update(updateData);

    const updatedDoc = await bookingRef.get();
    const booking = { id: bookingRef.id, ...updatedDoc.data() };

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
