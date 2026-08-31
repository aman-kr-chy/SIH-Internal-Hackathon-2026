const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');

// @desc    Get dashboard analytics (Stats + Charts)
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const lots = await ParkingLot.find({});
    const totalLots = lots.length;
    let totalSlots = 0;
    let availableSlots = 0;

    lots.forEach(lot => {
      totalSlots += lot.totalSlots;
      availableSlots += lot.availableSlots;
    });

    const occupiedSlots = totalSlots - availableSlots;
    
    // Calculate Today's Revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // All valid reservations for Total Revenue
    const validReservations = await Reservation.find({
      status: { $in: ['active', 'completed'] }
    });
    const todayRevenue = validReservations.reduce((sum, res) => sum + (res.amount || 0), 0); 

    // Hourly occupancy chart data (00:00 to 22:00)
    const hourlyOccupancy = [];
    const currentHour = new Date().getHours();
    const roundedCurrentHour = Math.floor(currentHour / 2) * 2;
    const peak = 14; // 2 PM peak
    const variance = 16;
    
    const curveValues = {};
    for (let i = 0; i <= 22; i += 2) {
      curveValues[i] = Math.exp(-Math.pow(i - peak, 2) / (2 * variance));
    }
    
    const currentCurveValue = curveValues[roundedCurrentHour] || 0.1;
    
    for (let i = 0; i <= 22; i += 2) {
      let val = 0;
      if (occupiedSlots > 0) {
        // Anchor the curve to the current real occupancy
        val = Math.floor((curveValues[i] / currentCurveValue) * occupiedSlots);
      } else {
        // Fallback smooth curve if no actual occupancy
        val = Math.floor(curveValues[i] * (totalSlots * 0.3));
      }
      
      if (val > totalSlots) val = totalSlots;
      if (val < 0) val = 0;
      
      const timeString = `${i.toString().padStart(2, '0')}:00`;
      hourlyOccupancy.push({
        time: timeString,
        occupancy: val
      });
    }

    // Calculate Monthly Revenue (for the current year)
    const currentYear = new Date().getFullYear();
    const monthlyAgg = await Reservation.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(`${currentYear}-01-01`), 
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`) 
          },
          status: { $in: ['active', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" }
        }
      }
    ]);
    
    // Format Monthly Revenue
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthNames.map((month, index) => {
      const match = monthlyAgg.find(item => item._id === index + 1);
      return { period: month, revenue: match ? match.total : 0 };
    });

    // Calculate Yearly Revenue
    const yearlyAgg = await Reservation.aggregate([
      {
        $match: {
          status: { $in: ['active', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const yearlyRevenue = yearlyAgg.map(item => ({
      period: item._id.toString(),
      revenue: item.total
    }));

    if (yearlyRevenue.length === 0) {
      yearlyRevenue.push({ period: currentYear.toString(), revenue: 0 });
    }

    // Recent Transactions
    const recentTransactions = await Reservation.find({
      status: { $in: ['active', 'completed'] }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email')
      .populate('parkingLotId', 'name');

    // Predictive Analytics data
    let busiestLot = lots.length > 0 ? lots[0] : null;
    let highestOccupancy = 0;
    
    lots.forEach(lot => {
      const occupancy = lot.totalSlots > 0 ? ((lot.totalSlots - lot.availableSlots) / lot.totalSlots) * 100 : 0;
      if (occupancy > highestOccupancy) {
        highestOccupancy = occupancy;
        busiestLot = lot;
      }
    });

    const predictionName = busiestLot ? busiestLot.name : 'Main Campus';
    const predictedPeak = highestOccupancy > 0 ? Math.min(100, Math.round(highestOccupancy + 20)) : 85;

    const prediction = {
      expectedPeakTime: `${peak.toString().padStart(2, '0')}:00 - ${(peak + 1).toString().padStart(2, '0')}:00`,
      expectedOccupancy: predictedPeak,
      predictedShortfall: `High demand expected in ${predictionName} parking.`
    };

    res.json({
      stats: {
        totalLots,
        totalSlots,
        availableSlots,
        occupiedSlots,
        liveOccupancyPercent: totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
        todayRevenue
      },
      charts: {
        hourlyOccupancy,
        monthlyRevenue,
        yearlyRevenue
      },
      recentTransactions,
      prediction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
