const Membership = require('../models/Membership');

// Pricing logic (in INR)
const MEMBERSHIP_PRICES = {
  1: 500,
  2: 900,
  3: 1200
};

// @desc    Purchase a membership
// @route   POST /api/memberships
// @access  Private
const purchaseMembership = async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (![1, 2, 3].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type. Must be 1, 2, or 3 months.' });
    }

    // Check if user already has an active membership
    const existingActive = await Membership.findOne({ 
      userId: req.user._id, 
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingActive) {
      return res.status(400).json({ message: 'You already have an active membership pass.' });
    }

    const price = MEMBERSHIP_PRICES[planType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planType);

    const membership = await Membership.create({
      userId: req.user._id,
      planType,
      startDate,
      endDate,
      pricePaid: price,
      status: 'active'
    });

    res.status(201).json(membership);
  } catch (error) {
    console.error('Error purchasing membership:', error);
    res.status(500).json({ message: 'Server error while purchasing membership' });
  }
};

// @desc    Get user's current membership
// @route   GET /api/memberships/my
// @access  Private
const getMyMembership = async (req, res) => {
  try {
    const membership = await Membership.findOne({ 
      userId: req.user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!membership) {
      return res.status(200).json({ active: false });
    }

    res.status(200).json({ active: true, membership });
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ message: 'Server error while fetching membership' });
  }
};

module.exports = {
  purchaseMembership,
  getMyMembership
};
