const User = require('../models/User');
const Investment = require('../models/Investment');
const RoiHistory = require('../models/RoiHistory');
const ReferralIncome = require('../models/ReferralIncome');

// @desc    Get dashboard stats and logs
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Calculate user's total investment amount across all statuses
    const investments = await Investment.find({ user: user._id });
    const totalInvestments = investments.reduce((acc, inv) => acc + inv.amount, 0);

    // 2. Calculate current active daily ROI yield rate
    const activeInvestments = investments.filter(inv => inv.status === 'Active');
    const dailyRoiRate = activeInvestments.reduce((acc, inv) => {
      return acc + (inv.amount * (inv.dailyRoiPercentage / 100));
    }, 0);

    // 3. Fetch history lists
    const roiHistory = await RoiHistory.find({ user: user._id })
      .sort({ date: -1 })
      .limit(50);

    const referralIncomeHistory = await ReferralIncome.find({ recipient: user._id })
      .populate('referrer', 'fullName email referralCode')
      .populate('investment', 'planName amount')
      .sort({ date: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        stats: {
          totalInvestments: Number(totalInvestments.toFixed(2)),
          dailyRoiRate: Number(dailyRoiRate.toFixed(2)),
          totalRoiEarned: user.totalRoiEarned,
          totalLevelIncomeEarned: user.totalLevelIncomeEarned,
          walletBalance: user.walletBalance,
        },
        logs: {
          investments,
          roiHistory,
          referralIncomeHistory,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
