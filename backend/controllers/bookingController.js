const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');

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

    const facility = await Facility.findById(facility_id);
    if (!facility || facility.status !== 'active') {
      return res.status(404).json({ message: 'Facility not available' });
    }

    if (slot_id) {
      const slot = await TimeSlot.findById(slot_id);
      if (!slot) {
        return res.status(404).json({ message: 'Time slot not found' });
      }
      if (slot.status !== 'available') {
        return res.status(409).json({ message: 'This slot is no longer available' });
      }
    }

    const existingBooking = await Booking.findOne({
      facility_id,
      booking_date,
      start_time,
      booking_status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'This slot is already booked' });
    }

    const booking_id = generateBookingId();
    const total_amount = facility.price_per_hour;

    const booking = await Booking.create({
      booking_id,
      user_id: req.user._id,
      facility_id,
      slot_id: slot_id || null,
      booking_date,
      start_time,
      end_time,
      total_amount,
      booking_status: 'confirmed',
      payment_status: 'completed'
    });

    if (slot_id) {
      await TimeSlot.findByIdAndUpdate(slot_id, { status: 'booked' });
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('facility_id')
      .populate('user_id', '-password');

    res.status(201).json({
      message: 'Booking confirmed successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error during booking' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user_id: req.user._id };

    if (status) {
      query.booking_status = status;
    }

    const bookings = await Booking.find(query)
      .populate('facility_id')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('facility_id')
      .populate('user_id', '-password');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.booking_status = 'cancelled';
    booking.payment_status = 'refunded';
    await booking.save();

    if (booking.slot_id) {
      await TimeSlot.findByIdAndUpdate(booking.slot_id, { status: 'available' });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
