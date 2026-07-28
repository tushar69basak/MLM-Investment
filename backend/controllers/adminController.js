const { distributeDailyRoi } = require('../services/roiService');
const Investment = require('../models/Investment');
const RoiHistory = require('../models/RoiHistory');
const ReferralIncome = require('../models/ReferralIncome');
const User = require('../models/User');

// @desc    Trigger daily ROI distribution manually (Testing utility)
// @route   POST /api/admin/trigger-roi
// @access  Public (for development/testing evaluation)
const triggerRoiDistribution = async (req, res) => {
  try {
    const { date } = req.body;
    
    // Parse target date if provided, otherwise default to current date
    const targetDate = date ? new Date(date) : new Date();
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const result = await distributeDailyRoi(targetDate);
    
    res.json({
      success: true,
      message: `Daily ROI processing completed for ${targetDate.toISOString().slice(0, 10)}`,
      data: result,
    });
  } catch (error) {
    console.error('Trigger ROI error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset all sandbox transactions & investments (Testing utility)
// @route   POST /api/admin/reset-sandbox
// @access  Public (for development/testing evaluation)
const resetSandbox = async (req, res) => {
  try {
    // 1. Delete all transactions and investments
    await Investment.deleteMany({});
    await RoiHistory.deleteMany({});
    await ReferralIncome.deleteMany({});
    
    // 2. Reset user balances and statistics to zero
    // 2. Delete all users except admin accounts to keep database fresh
    await User.deleteMany({ role: { $ne: 'admin' } });

    res.json({
      success: true,
      message: 'All sandbox database logs cleared and user balances reset to $0.',
    });
  } catch (error) {
    console.error('Reset sandbox error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin panel system statistics & directory lists
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin Only)
const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Fetch system-wide counts and aggregates
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    const investments = await Investment.find({})
      .populate('user', 'fullName email referralCode')
      .sort({ createdAt: -1 });

    const totalPrincipal = investments.reduce((acc, inv) => acc + inv.amount, 0);
    const totalActivePrincipal = investments
      .filter(inv => inv.status === 'Active')
      .reduce((acc, inv) => acc + inv.amount, 0);

    const roiLogs = await RoiHistory.find({})
      .populate('user', 'fullName email')
      .populate('investment', 'planName amount')
      .sort({ date: -1 });
    const totalRoiPaid = roiLogs.reduce((acc, log) => acc + log.amount, 0);

    const referralIncomes = await ReferralIncome.find({})
      .populate('recipient', 'fullName email')
      .populate('referrer', 'fullName email')
      .sort({ date: -1 });
    const totalCommissionsPaid = referralIncomes.reduce((acc, log) => acc + log.amount, 0);

    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPrincipal: Number(totalPrincipal.toFixed(2)),
          totalActivePrincipal: Number(totalActivePrincipal.toFixed(2)),
          totalRoiPaid: Number(totalRoiPaid.toFixed(2)),
          totalCommissionsPaid: Number(totalCommissionsPaid.toFixed(2)),
        },
        users,
        investments,
        roiLogs,
        referralIncomes,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend or activate a user account
// @route   POST /api/admin/toggle-user-status/:userId
// @access  Private (Admin Only)
const toggleUserStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot modify administrator accounts' });
    }

    // Toggle status
    user.accountStatus = user.accountStatus === 'Active' ? 'Suspended' : 'Active';
    await user.save();

    res.json({
      success: true,
      message: `User account has been successfully ${user.accountStatus.toLowerCase()}`,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  triggerRoiDistribution,
  resetSandbox,
  getAdminDashboardStats,
  toggleUserStatus,
};
