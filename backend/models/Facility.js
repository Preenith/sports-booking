const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sport_type: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price_per_hour: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  facilities_available: {
    type: String,
    required: true
  },
  rules: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  review_count: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Facility', facilitySchema);
