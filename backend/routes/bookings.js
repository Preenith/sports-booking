const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
} = require('../controllers/bookingController');

router.post('/', auth, createBooking);
router.get('/my', auth, getMyBookings);
router.get('/:id', auth, getBookingById);
router.delete('/:id', auth, cancelBooking);

module.exports = router;
