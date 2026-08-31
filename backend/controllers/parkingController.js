const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');

// @desc    Get all parking lots
// @route   GET /api/parking
// @access  Public
const getParkingLots = async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({ status: 'active' });
    res.json(parkingLots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get parking lots belonging to logged in operator
// @route   GET /api/parking/my-lots
// @access  Private
const getMyParkingLots = async (req, res) => {
  try {
    let query = { status: 'active' };
    
    if (req.user.role !== 'admin') {
      if (req.user.email === 'operator1@smartparking.com') {
        // Staff should only see lots created by the Subscription Admin
        const subscriptionAdmin = await User.findOne({ email: 'operator@smartparking.com' });
        if (subscriptionAdmin) {
          query.owner = subscriptionAdmin._id;
        } else {
          query.owner = req.user._id; // Fallback
        }
      } else {
        // Other operators only see their own lots
        query.owner = req.user._id;
      }
    }
    
    const parkingLots = await ParkingLot.find(query);
    res.json(parkingLots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single parking lot by ID
// @route   GET /api/parking/:id
// @access  Public
const getParkingLotById = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);
    if (parkingLot) {
      res.json(parkingLot);
    } else {
      res.status(404).json({ message: 'Parking lot not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a parking lot
// @route   POST /api/parking
// @access  Private/Admin
const createParkingLot = async (req, res) => {
  try {
    const { name, description, address, latitude, longitude, totalSlots, pricePerHour } = req.body;

    const parkingLot = await ParkingLot.create({
      name,
      description,
      address,
      latitude,
      longitude,
      totalSlots,
      availableSlots: totalSlots,
      pricePerHour,
      owner: req.user._id
    });

    const slotsToInsert = [];
    const prefixMatch = parkingLot.name.match(/^(P\d+)/);
    const prefix = prefixMatch ? prefixMatch[1] : 'S'; // 'S' for Slot if no prefix
    
    for (let i = 1; i <= totalSlots; i++) {
      slotsToInsert.push({
        parkingLotId: parkingLot._id,
        slotNumber: `${prefix}-${i}`,
        status: 'AVAILABLE',
        type: 'standard'
      });
    }
    await ParkingSlot.insertMany(slotsToInsert);

    res.status(201).json(parkingLot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a parking lot
// @route   PUT /api/parking/:id
// @access  Private/Admin
const updateParkingLot = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);

    if (parkingLot) {
      parkingLot.name = req.body.name || parkingLot.name;
      parkingLot.description = req.body.description || parkingLot.description;
      parkingLot.address = req.body.address || parkingLot.address;
      parkingLot.latitude = req.body.latitude || parkingLot.latitude;
      parkingLot.longitude = req.body.longitude || parkingLot.longitude;
      parkingLot.totalSlots = req.body.totalSlots || parkingLot.totalSlots;
      parkingLot.pricePerHour = req.body.pricePerHour || parkingLot.pricePerHour;
      parkingLot.status = req.body.status || parkingLot.status;

      const updatedParkingLot = await parkingLot.save();
      res.json(updatedParkingLot);
    } else {
      res.status(404).json({ message: 'Parking lot not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a parking lot
// @route   DELETE /api/parking/:id
// @access  Private/Admin
const deleteParkingLot = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findByIdAndDelete(req.params.id);

    if (parkingLot) {
      res.json({ message: 'Parking lot removed' });
    } else {
      res.status(404).json({ message: 'Parking lot not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getParkingLots,
  getMyParkingLots,
  getParkingLotById,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot
};
