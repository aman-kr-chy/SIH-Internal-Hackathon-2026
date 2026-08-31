const express = require('express');
const router = express.Router();
const {
  getParkingLots,
  getMyParkingLots,
  getParkingLotById,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot
} = require('../controllers/parkingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-lots', protect, authorize('operator', 'admin'), getMyParkingLots);

router.route('/')
  .get(getParkingLots)
  .post(protect, authorize('admin', 'operator'), createParkingLot);

router.route('/:id')
  .get(getParkingLotById)
  .put(protect, authorize('admin', 'operator'), updateParkingLot)
  .delete(protect, authorize('admin', 'operator'), deleteParkingLot);

module.exports = router;
