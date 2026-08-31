const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  slotNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
    default: 'AVAILABLE'
  },
  type: {
    type: String,
    enum: ['standard', 'premium'],
    default: 'standard'
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSession',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
