const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

router.get('/dashboard', adminAuth, getDashboardStats);
router.get('/users', adminAuth, getAllUsers);
router.put('/users/:id/status', adminAuth, toggleUserStatus);
router.get('/facilities', adminAuth, getAllFacilitiesAdmin);
router.post('/facilities', adminAuth, createFacility);
router.put('/facilities/:id', adminAuth, updateFacility);
router.delete('/facilities/:id', adminAuth, deleteFacility);
router.post('/slots', adminAuth, createTimeSlot);
router.put('/slots/:id', adminAuth, updateTimeSlot);
router.get('/bookings', adminAuth, getAllBookingsAdmin);
router.put('/bookings/:id/status', adminAuth, updateBookingStatus);

module.exports = router;
