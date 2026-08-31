const express = require('express');
const router = express.Router();
const { startSession, endSession, getCurrentSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startSession);
router.post('/end', protect, endSession);
router.get('/current', protect, getCurrentSession);

module.exports = router;
