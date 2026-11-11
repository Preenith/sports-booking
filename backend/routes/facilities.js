const express = require('express');
const router = express.Router();
const {
  getAllFacilities,
  getFacilityById,
  getFacilityAvailability,
  getSportTypes
} = require('../controllers/facilityController');

router.get('/', getAllFacilities);
router.get('/sports', getSportTypes);
router.get('/:id', getFacilityById);
router.get('/:id/availability', getFacilityAvailability);

module.exports = router;
