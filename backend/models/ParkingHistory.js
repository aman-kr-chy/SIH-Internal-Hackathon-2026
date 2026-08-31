const mongoose = require('mongoose');

const parkingHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSession',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'overstayed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingHistory', parkingHistorySchema);
