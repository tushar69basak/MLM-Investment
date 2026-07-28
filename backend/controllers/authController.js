const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretnexachainkey123', {
    expiresIn: '30d',
  });
};

// Generate random referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, email, mobileNumber, password, referralCode: referredByCode } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // 2. Resolve referrer if referredByCode is provided
    let referredBy = null;
    if (referredByCode) {
      const referrer = await User.findOne({ referralCode: referredByCode.toUpperCase().trim() });
      if (!referrer) {
        return res.status(400).json({ success: false, message: 'Invalid referral code' });
      }
      referredBy = referrer._id;
    }

    // 3. Generate a unique referral code for the new user
    let referralCode = '';
    let isUnique = false;
    while (!isUnique) {
      referralCode = 'NEXA' + generateReferralCode();
      const codeExists = await User.findOne({ referralCode });
      if (!codeExists) {
        isUnique = true;
      }
    }

    // 4. Create User
    const user = await User.create({
      fullName,
      email,
      mobileNumber,
      password,
      referralCode,
      referredBy,
      walletBalance: 0,
      totalRoiEarned: 0,
      totalLevelIncomeEarned: 0,
      accountStatus: 'Active',
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobileNumber: user.mobileNumber,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          walletBalance: user.walletBalance,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.accountStatus === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your account is suspended' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        walletBalance: user.walletBalance,
        totalRoiEarned: user.totalRoiEarned,
        totalLevelIncomeEarned: user.totalLevelIncomeEarned,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
