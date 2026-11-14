const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  facility_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
