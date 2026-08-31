const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all slots for a parking lot
// @route   GET /api/slots/:parkingId
// @access  Public
const getSlotsByParkingId = async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ parkingLotId: req.params.parkingId });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update slot status
// @route   PUT /api/slots/:id
// @access  Private/Operator/Admin
const updateSlotStatus = async (req, res) => {
  try {
    const { status, customerName, customerEmail, hours, totalAmount } = req.body;
    const slot = await ParkingSlot.findById(req.params.id);

    if (slot) {
      const oldStatus = slot.status;
      slot.status = status;
      const updatedSlot = await slot.save();
      
      // Update ParkingLot available count if status changed between AVAILABLE and OCCUPIED/RESERVED
      if (oldStatus !== status) {
        const lot = await ParkingLot.findById(slot.parkingLotId);
        if (lot) {
          if (oldStatus === 'AVAILABLE' && (status === 'OCCUPIED' || status === 'RESERVED')) {
            lot.availableSlots -= 1;
          } else if ((oldStatus === 'OCCUPIED' || oldStatus === 'RESERVED') && status === 'AVAILABLE') {
            lot.availableSlots += 1;
          }
          await lot.save();
          
          // Send Confirmation Email if booking details exist
          if (status === 'OCCUPIED' && customerEmail) {
            try {
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
                  <h2 style="color: #2563eb;">Booking Confirmed</h2>
                  <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
                  <p>Your parking slot has been successfully booked via Walk-in at <strong>${lot.name}</strong>.</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                    <h3 style="margin-top: 0;">Receipt Details</h3>
                    <p style="margin: 5px 0;"><strong>Slot Number:</strong> ${slot.slotNumber}</p>
                    <p style="margin: 5px 0;"><strong>Duration:</strong> ${hours} hour(s)</p>
                    <p style="margin: 5px 0;"><strong>Total Paid:</strong> ₹${totalAmount}</p>
                  </div>
                  <p>Thank you for parking with us!</p>
                </div>
              `;
              
              await sendEmail({
                email: customerEmail,
                subject: 'Parking Walk-in Booking Confirmation',
                html: emailHtml
              });
            } catch (emailErr) {
              console.error('Failed to send booking email:', emailErr);
            }
          }
        }
      }
      
      // Emit socket event for realtime update
      req.io.emit('parkingStatusUpdated', {
        parkingId: slot.parkingLotId,
        slotId: slot._id,
        slotNumber: slot.slotNumber,
        newStatus: slot.status,
        timestamp: new Date()
      });

      res.json(updatedSlot);
    } else {
      res.status(404).json({ message: 'Slot not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSlotsByParkingId,
  updateSlotStatus
};
