const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { getUsers, subscribeSaaS } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/users', protect, authorize('admin'), getUsers);
router.post('/subscribe', protect, authorize('admin'), subscribeSaaS);

module.exports = router;
