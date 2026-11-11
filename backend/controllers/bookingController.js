const { db, admin } = require('../config/firebase');

const generateBookingId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BK${timestamp}${random}`.toUpperCase();
};

const createBooking = async (req, res) => {
  try {
    const { facility_id, slot_id, booking_date, start_time, end_time } = req.body;

    if (!facility_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ message: 'All booking details are required' });
    }

    const booking_id = generateBookingId();
    let bookingRefId = null;

    await db.runTransaction(async (transaction) => {
      const facilityRef = db.collection('facilities').doc(facility_id);
      const facilityDoc = await transaction.get(facilityRef);

      if (!facilityDoc.exists || facilityDoc.data().status !== 'active') {
        throw new Error('Facility not available');
      }

      if (slot_id) {
        const slotRef = db.collection('time_slots').doc(slot_id);
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists) {
          throw new Error('Time slot not found');
        }

        const slotData = slotDoc.data();
        if (slotData.status !== 'available') {
          throw new Error('This slot is no longer available');
        }
      }

      const existingBookingQuery = db.collection('bookings')
        .where('facility_id', '==', facility_id)
        .where('booking_date', '==', booking_date);

      const existingBookingSnapshot = await existingBookingQuery.get();

      const conflictingBooking = existingBookingSnapshot.docs.find(
        doc => doc.data().start_time === start_time && doc.data().booking_status !== 'cancelled'
      );

      if (conflictingBooking) {
        throw new Error('This slot is already booked');
      }

      const amount = facilityDoc.data().price_per_hour;

      const bookingRef = db.collection('bookings').doc();
      bookingRefId = bookingRef.id;
      transaction.set(bookingRef, {
        booking_id,
        user_id: req.user.id,
        facility_id,
        slot_id: slot_id || null,
        booking_date,
        start_time,
        end_time,
        amount,
        booking_status: 'confirmed',
        payment_status: 'paid',
        created_at: new Date().toISOString()
      });

      if (slot_id) {
        const slotRef = db.collection('time_slots').doc(slot_id);
        transaction.update(slotRef, { status: 'booked' });
      }

      return bookingRefId;
    });

    const bookingDoc = await db.collection('bookings').doc(bookingRefId).get();
    const booking = { id: bookingDoc.id, ...bookingDoc.data() };

    const facilityDoc = await db.collection('facilities').doc(facility_id).get();
    const facility = { id: facilityDoc.id, ...facilityDoc.data() };

    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = { id: userDoc.id, ...userDoc.data() };
    delete user.password;

    res.status(201).json({
      message: 'Booking confirmed successfully',
      booking: {
        ...booking,
        facility_id: facility,
        user_id: user
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    if (error.message === 'Facility not available') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Time slot not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'This slot is no longer available' || error.message === 'This slot is already booked') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during booking' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.collection('bookings').where('user_id', '==', req.user.id);

    const snapshot = await query.get();
    let bookings = [];

    for (const doc of snapshot.docs) {
      const booking = { id: doc.id, ...doc.data() };
      
      const facilityDoc = await db.collection('facilities').doc(booking.facility_id).get();
      if (facilityDoc.exists) {
        booking.facility_id = { id: facilityDoc.id, ...facilityDoc.data() };
      }

      if (!status || booking.booking_status === status) {
        bookings.push(booking);
      }
    }

    bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(bookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const bookingDoc = await db.collection('bookings').doc(req.params.id).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = { id: bookingDoc.id, ...bookingDoc.data() };

    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

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

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    await db.runTransaction(async (transaction) => {
      const bookingRef = db.collection('bookings').doc(req.params.id);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }

      const booking = bookingDoc.data();

      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new Error('Access denied');
      }

      if (booking.booking_status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.booking_status === 'completed') {
        throw new Error('Cannot cancel completed booking');
      }

      transaction.update(bookingRef, {
        booking_status: 'cancelled',
        payment_status: 'refunded'
      });

      const slotRef = db.collection('time_slots').doc(booking.slot_id);
      transaction.update(slotRef, { status: 'available' });
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Booking is already cancelled' || error.message === 'Cannot cancel completed booking') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
