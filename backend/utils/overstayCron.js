const ParkingSession = require('../models/ParkingSession');
const Notification = require('../models/Notification');

// Run every minute (For demo purposes. Real app might run every 5 mins)
const checkOverstays = async (io) => {
  setInterval(async () => {
    try {
      // Find active sessions that have exceeded their reservation duration
      // For this software demo, we'll assume standard duration is 1 hour (60 mins)
      const oneHourAgo = new Date(Date.now() - 60 * 60000);
      
      const overstayedSessions = await ParkingSession.find({
        status: 'active',
        startTime: { $lt: oneHourAgo }
      }).populate('userId slotId parkingLotId vehicleId');

      for (let session of overstayedSessions) {
        // Check if we already notified recently to prevent spam
        const existingAlert = await Notification.findOne({
          title: 'OVERSTAY ALERT',
          message: { $regex: session._id.toString() }
        });

        if (!existingAlert) {
          // Notify User
          await Notification.create({
            userId: session.userId._id,
            title: 'OVERSTAY ALERT',
            message: `Your vehicle ${session.vehicleId.vehicleNumber} has overstayed at ${session.parkingLotId.name}, Slot ${session.slotId.slotNumber}. (Session: ${session._id})`,
            type: 'alert'
          });

          // Emit to Admin dashboard
          io.emit('overstayDetected', {
            sessionId: session._id,
            vehicle: session.vehicleId.vehicleNumber,
            slot: session.slotId.slotNumber,
            parkingName: session.parkingLotId.name
          });
          
          console.log(`[Overstay Detected] Session ${session._id}`);
        }
      }
    } catch (error) {
      console.error('Overstay Cron Error:', error);
    }
  }, 60000); // Check every 60 seconds
};

module.exports = checkOverstays;
