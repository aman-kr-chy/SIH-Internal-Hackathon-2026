const ParkingSession = require('../models/ParkingSession');
const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingHistory = require('../models/ParkingHistory');
const ParkingLot = require('../models/ParkingLot');

// @desc    Start parking session
// @route   POST /api/sessions/start
// @access  Private
const startSession = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Reservation is not active' });
    }

    const slot = await ParkingSlot.findById(reservation.slotId);
    if (!slot || slot.status !== 'RESERVED') {
      return res.status(400).json({ message: 'Slot is not reserved or unavailable' });
    }

    // 1. Create Session
    const session = await ParkingSession.create({
      userId: req.user._id,
      parkingLotId: reservation.parkingLotId,
      slotId: reservation.slotId,
      vehicleId: reservation.vehicleId,
      reservationId: reservation._id,
      startTime: new Date()
    });

    // 2. Update Slot Status
    slot.status = 'OCCUPIED';
    slot.currentSessionId = session._id;
    await slot.save();

    // 3. Emit Event
    req.io.emit('parkingStatusUpdated', {
      parkingId: slot.parkingLotId,
      slotId: slot._id,
      slotNumber: slot.slotNumber,
      newStatus: 'OCCUPIED',
      timestamp: new Date()
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End parking session
// @route   POST /api/sessions/end
// @access  Private
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const session = await ParkingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Session is already completed' });
    }

    // Calculate duration and amount
    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const durationMinutes = Math.ceil(durationMs / 60000);
    
    const lot = await ParkingLot.findById(session.parkingLotId);
    // minimum charge for 1 hour if less than 60 mins
    const chargeDuration = durationMinutes > 60 ? durationMinutes : 60;
    const finalAmount = (chargeDuration / 60) * (lot ? lot.pricePerHour : 0);

    // Update session
    session.endTime = endTime;
    session.duration = durationMinutes;
    session.amount = finalAmount;
    session.status = 'completed';
    await session.save();

    // Release Slot
    const slot = await ParkingSlot.findById(session.slotId);
    if (slot) {
      slot.status = 'AVAILABLE';
      slot.reservedBy = null;
      slot.currentSessionId = null;
      await slot.save();
      
      if (lot) {
        lot.availableSlots += 1;
        await lot.save();
      }

      req.io.emit('parkingStatusUpdated', {
        parkingId: slot.parkingLotId,
        slotId: slot._id,
        slotNumber: slot.slotNumber,
        newStatus: 'AVAILABLE',
        timestamp: new Date()
      });
    }

    // Update Reservation status
    if (session.reservationId) {
      const reservation = await Reservation.findById(session.reservationId);
      if (reservation) {
        reservation.status = 'completed';
        await reservation.save();
      }
    }

    // Save History
    await ParkingHistory.create({
      userId: session.userId,
      parkingLotId: session.parkingLotId,
      slotId: session.slotId,
      vehicleId: session.vehicleId,
      sessionId: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      amountPaid: finalAmount,
      status: 'completed'
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current session
// @route   GET /api/sessions/current
// @access  Private
const getCurrentSession = async (req, res) => {
  try {
    const session = await ParkingSession.findOne({ userId: req.user._id, status: 'active' })
      .populate('parkingLotId', 'name address')
      .populate('slotId', 'slotNumber')
      .populate('vehicleId', 'vehicleNumber');
      
    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startSession,
  endSession,
  getCurrentSession
};
