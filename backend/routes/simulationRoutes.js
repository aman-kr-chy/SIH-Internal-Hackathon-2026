const express = require('express');
const router = express.Router();
const { startSimulation, pauseSimulation, resetSimulation } = require('../controllers/simulationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/start', protect, authorize('admin'), startSimulation);
router.post('/pause', protect, authorize('admin'), pauseSimulation);
router.post('/reset', protect, authorize('admin'), resetSimulation);

module.exports = router;
