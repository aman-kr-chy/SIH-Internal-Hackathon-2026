const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');

// Global simulation state
let isSimulationRunning = false;
let simulationInterval = null;
let simulationSpeed = 5000; // default 5 seconds

// Helper to get random item from array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// @desc    Start simulation
// @route   POST /api/simulation/start
// @access  Private/Admin
const startSimulation = async (req, res) => {
  try {
    if (isSimulationRunning) {
      return res.status(400).json({ message: 'Simulation is already running' });
    }

    if (req.body.speed) {
      simulationSpeed = req.body.speed;
    }

    isSimulationRunning = true;

    simulationInterval = setInterval(async () => {
      try {
        // Pick a random slot that is not RESERVED (we don't randomly un-reserve driver spots)
        // Wait, for realistic demo, we can toggle between AVAILABLE and OCCUPIED
        const slots = await ParkingSlot.find({ status: { $in: ['AVAILABLE', 'OCCUPIED'] } });
        
        if (slots.length > 0) {
          const randomSlot = getRandomItem(slots);
          
          const oldStatus = randomSlot.status;
          const newStatus = oldStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
          
          randomSlot.status = newStatus;
          await randomSlot.save();

          // Update ParkingLot available count
          const lot = await ParkingLot.findById(randomSlot.parkingLotId);
          if (lot) {
            if (newStatus === 'OCCUPIED') lot.availableSlots -= 1;
            if (newStatus === 'AVAILABLE') lot.availableSlots += 1;
            await lot.save();
          }

          // Emit the event to all clients
          req.io.emit('parkingStatusUpdated', {
            parkingId: randomSlot.parkingLotId,
            slotId: randomSlot._id,
            slotNumber: randomSlot.slotNumber,
            oldStatus,
            newStatus,
            timestamp: new Date()
          });

          console.log(`[Simulation] Slot ${randomSlot.slotNumber} changed to ${newStatus}`);
        }
      } catch (err) {
        console.error('Simulation error:', err.message);
      }
    }, simulationSpeed);

    res.json({ message: 'Simulation started', speed: simulationSpeed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pause simulation
// @route   POST /api/simulation/pause
// @access  Private/Admin
const pauseSimulation = async (req, res) => {
  try {
    if (!isSimulationRunning) {
      return res.status(400).json({ message: 'Simulation is not running' });
    }

    clearInterval(simulationInterval);
    isSimulationRunning = false;

    res.json({ message: 'Simulation paused' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset simulation (make all slots AVAILABLE)
// @route   POST /api/simulation/reset
// @access  Private/Admin
const resetSimulation = async (req, res) => {
  try {
    if (isSimulationRunning) {
      clearInterval(simulationInterval);
      isSimulationRunning = false;
    }

    // Set all slots to AVAILABLE
    await ParkingSlot.updateMany({}, { $set: { status: 'AVAILABLE', reservedBy: null, currentSessionId: null } });

    // Update all parking lots available slots to match total
    const lots = await ParkingLot.find({});
    for (let lot of lots) {
      lot.availableSlots = lot.totalSlots;
      await lot.save();
    }

    req.io.emit('simulationReset', { timestamp: new Date() });

    res.json({ message: 'Simulation reset. All slots are now AVAILABLE.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startSimulation,
  pauseSimulation,
  resetSimulation
};
