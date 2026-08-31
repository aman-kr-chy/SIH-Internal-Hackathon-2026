const express = require('express');
const router = express.Router();
const { createReservation, getMyReservations, cancelReservation } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createReservation);
  
router.get('/my', protect, getMyReservations);

router.put('/:id/cancel', protect, cancelReservation);

module.exports = router;
