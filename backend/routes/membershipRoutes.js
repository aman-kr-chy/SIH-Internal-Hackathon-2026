const express = require('express');
const router = express.Router();
const { purchaseMembership, getMyMembership } = require('../controllers/membershipController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, purchaseMembership);
router.get('/my', protect, getMyMembership);

module.exports = router;
