const express = require('express');
const router = express.Router();
const { getSlotsByParkingId, updateSlotStatus } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:parkingId', getSlotsByParkingId);
router.put('/:id', protect, authorize('admin', 'operator'), updateSlotStatus);

module.exports = router;
