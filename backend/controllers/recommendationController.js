const ParkingLot = require('../models/ParkingLot');

// @desc    Get smart parking recommendations
// @route   POST /api/recommendations
// @access  Public
const getRecommendations = async (req, res) => {
  try {
    const { userLat, userLng } = req.body;
    
    const parkingLots = await ParkingLot.find({ status: 'active' });
    
    if (parkingLots.length === 0) {
      return res.json([]);
    }

    // Weights for scoring
    const WEIGHT_AVAILABILITY = 0.40;
    const WEIGHT_DISTANCE = 0.30;
    const WEIGHT_PRICE = 0.20;
    const WEIGHT_OCCUPANCY = 0.10;

    // Helper: Haversine distance formula (in km)
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
      return R * c; // Distance in km
    };

    // Calculate max values for normalization
    let maxDistance = 0.01; // Avoid div by 0
    let maxPrice = 0.01;
    let maxAvailable = 0.01;

    const lotsWithStats = parkingLots.map(lot => {
      let distance = 0;
      if (userLat && userLng && lot.latitude && lot.longitude) {
        distance = getDistance(userLat, userLng, lot.latitude, lot.longitude);
      }
      if (distance > maxDistance) maxDistance = distance;
      if (lot.pricePerHour > maxPrice) maxPrice = lot.pricePerHour;
      if (lot.availableSlots > maxAvailable) maxAvailable = lot.availableSlots;
      
      const occupancy = ((lot.totalSlots - lot.availableSlots) / lot.totalSlots) * 100;

      return {
        ...lot._doc,
        distance,
        occupancy
      };
    });

    // Score calculation
    const scoredLots = lotsWithStats.map(lot => {
      // Normalize values (0 to 1)
      const normAvailability = lot.availableSlots / maxAvailable;
      const normDistance = 1 - (lot.distance / maxDistance); // Closer is better (1.0)
      const normPrice = 1 - (lot.pricePerHour / maxPrice); // Cheaper is better (1.0)
      const normOccupancy = 1 - (lot.occupancy / 100); // Lower occupancy is better (1.0)

      const score = (
        (normAvailability * WEIGHT_AVAILABILITY) +
        (normDistance * WEIGHT_DISTANCE) +
        (normPrice * WEIGHT_PRICE) +
        (normOccupancy * WEIGHT_OCCUPANCY)
      ) * 100;

      return {
        ...lot,
        recommendationScore: score.toFixed(1)
      };
    });

    // Sort alphabetically by name (serial basis)
    scoredLots.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    // Return all sorted lots
    res.json(scoredLots);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRecommendations
};
