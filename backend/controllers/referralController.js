const User = require('../models/User');

// Recursive helper to build multi-level referral tree
const buildReferralTree = async (userId, currentDepth = 1, maxDepth = 3) => {
  try {
    const children = await User.find({ referredBy: userId }).select(
      'fullName email mobileNumber referralCode walletBalance totalRoiEarned totalLevelIncomeEarned accountStatus createdAt'
    );

    const nodes = [];
    for (const child of children) {
      const node = child.toObject();
      node.level = currentDepth;

      // If we haven't reached max depth, find children's children recursively
      if (currentDepth < maxDepth) {
        node.referrals = await buildReferralTree(child._id, currentDepth + 1, maxDepth);
      } else {
        node.referrals = [];
      }
      nodes.push(node);
    }
    return nodes;
  } catch (error) {
    console.error('Error building referral tree at depth', currentDepth, error);
    return [];
  }
};

// @desc    Fetch direct referrals (Level 1)
// @route   GET /api/referrals/direct
// @access  Private
const getDirectReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id }).select(
      'fullName email mobileNumber referralCode walletBalance totalRoiEarned totalLevelIncomeEarned accountStatus createdAt'
    );
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Get direct referrals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch complete referral tree (nested up to 3 levels)
// @route   GET /api/referrals/tree
// @access  Private
const getReferralTree = async (req, res) => {
  try {
    const tree = await buildReferralTree(req.user._id, 1, 3);
    res.json({ success: true, data: tree });
  } catch (error) {
    console.error('Get referral tree error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDirectReferrals,
  getReferralTree,
};
