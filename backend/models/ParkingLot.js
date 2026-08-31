const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: String,
  address: {
    type: String,
    required: true,
  },
  latitude: Number,
  longitude: Number,
  totalSlots: {
    type: Number,
    required: true,
  },
  availableSlots: {
    type: Number,
    required: true,
  },
  pricePerHour: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
