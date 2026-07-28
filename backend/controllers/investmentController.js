const Investment = require('../models/Investment');
const User = require('../models/User');

// Predefined investment plans
const PLANS = {
  Basic: { dailyRoiPercentage: 1.0, durationDays: 100 },
  Premium: { dailyRoiPercentage: 1.5, durationDays: 120 },
  VIP: { dailyRoiPercentage: 2.0, durationDays: 150 },
};

// @desc    Create a new investment
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res) => {
  const { amount, planName } = req.body;

  try {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid investment amount' });
    }

    // Validate plan
    const plan = PLANS[planName];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    // Fetch user and verify wallet balance
    const user = await User.findById(req.user._id);
    if (user.walletBalance < parsedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // Deduct from wallet and save user
    user.walletBalance -= parsedAmount;
    await user.save();

    // Create investment
    const investment = await Investment.create({
      user: user._id,
      amount: parsedAmount,
      planName,
      startDate,
      endDate,
      dailyRoiPercentage: plan.dailyRoiPercentage,
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment,
      newWalletBalance: user.walletBalance,
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user investments
// @route   GET /api/investments
// @access  Private
const getUserInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: investments });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate wallet deposit (Testing helper)
// @route   POST /api/investments/deposit
// @access  Private
const simulateDeposit = async (req, res) => {
  const { amount } = req.body;

  try {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid deposit amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.walletBalance += parsedAmount;
    await user.save();

    res.json({
      success: true,
      message: `Successfully deposited $${parsedAmount.toFixed(2)} to wallet`,
      data: {
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error('Deposit simulation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInvestment,
  getUserInvestments,
  simulateDeposit,
  PLANS, // export plans for checking in tests
};
