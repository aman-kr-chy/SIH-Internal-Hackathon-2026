const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const ParkingLot = require('../models/ParkingLot');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  try {
    const { parkingLotId, slotId, vehicleId, startTime, duration, email, phone } = req.body;
    
    // Validate inputs
    if (!parkingLotId || !slotId || !vehicleId || !startTime || !duration) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // 1. Verify Slot is AVAILABLE
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Slot is not available for reservation' });
    }

    // 2. Prevent Double Booking
    const existingReservation = await Reservation.findOne({
      slotId,
      status: 'active'
    });
    
    if (existingReservation) {
      return res.status(400).json({ message: 'Slot is already reserved' });
    }

    // 3. Calculate endTime and expected amount
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    
    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    // Check if user has active membership
    const Membership = require('../models/Membership');
    const activeMembership = await Membership.findOne({
      userId: req.user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    let expectedAmount = 0;
    if (!activeMembership) {
      expectedAmount = (duration / 60) * lot.pricePerHour;
      if (slot.type === 'premium') {
        expectedAmount = (duration / 60) * (lot.pricePerHour + 10);
      }
    }

    // 4. Create Reservation
    const reservation = await Reservation.create({
      userId: req.user._id,
      parkingLotId,
      slotId,
      vehicleId,
      startTime: start,
      endTime: end,
      amount: expectedAmount
    });

    // 5. Update Slot Status
    slot.status = 'RESERVED';
    slot.reservedBy = req.user._id;
    await slot.save();

    // 6. Update Parking Lot available slots
    lot.availableSlots -= 1;
    await lot.save();

    // 7. Emit Socket.io event
    req.io.emit('parkingStatusUpdated', {
      parkingId: parkingLotId,
      slotId: slot._id,
      slotNumber: slot.slotNumber,
      newStatus: 'RESERVED',
      timestamp: new Date()
    });

    // 8. Send Booking Email Confirmation
    const receiptEmail = email || req.user.email;
    const phoneDisplay = phone ? `<p style="margin: 5px 0;"><b>Mobile Number:</b> ${phone}</p>` : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #16a34a;">Booking Confirmed! ✅</h2>
        <p>Hi <b>${req.user.name}</b>,</p>
        <p>Your parking slot at Parul University has been successfully reserved.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><b>Location:</b> ${lot.name}</p>
          <p style="margin: 5px 0;"><b>Slot Number:</b> ${slot.slotNumber} ${slot.type === 'premium' ? '⭐' : ''}</p>
          <p style="margin: 5px 0;"><b>Start Time:</b> ${start.toLocaleString()}</p>
          <p style="margin: 5px 0;"><b>Duration:</b> ${duration} minutes</p>
          <p style="margin: 5px 0;"><b>Total Amount:</b> ₹${expectedAmount.toFixed(2)}</p>
          ${phoneDisplay}
        </div>
        <p>Thank you for using Parul Smart Parking.</p>
      </div>
    `;
    
    await sendEmail({
      email: receiptEmail,
      subject: `Booking Confirmed: Slot ${slot.slotNumber}`,
      html: emailHtml
    });

    // 9. Send SMS Confirmation (if phone is provided)
    if (phone) {
      const smsMessage = `Parul Smart Parking: Booking Confirmed! Slot: ${slot.slotNumber}. Duration: ${duration} mins. Total: Rs ${expectedAmount.toFixed(2)}.`;
      await sendSMS({ phone, message: smsMessage });
    }

    res.status(201).json(reservation);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's reservations
// @route   GET /api/reservations/my
// @access  Private
const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('parkingLotId', 'name address latitude longitude')
      .populate('slotId', 'slotNumber')
      .populate('vehicleId', 'vehicleNumber')
      .sort({ createdAt: -1 });
      
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Ensure it belongs to the user or admin
    if (reservation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Can only cancel active reservations' });
    }

    // Update reservation
    reservation.status = 'cancelled';
    await reservation.save();

    // Release Slot
    const slot = await ParkingSlot.findById(reservation.slotId);
    if (slot) {
      slot.status = 'AVAILABLE';
      slot.reservedBy = null;
      await slot.save();
      
      const lot = await ParkingLot.findById(reservation.parkingLotId);
      if(lot) {
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

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  cancelReservation
};
