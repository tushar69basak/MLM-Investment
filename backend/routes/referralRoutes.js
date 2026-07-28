const express = require('express');
const router = express.Router();
const { getDirectReferrals, getReferralTree } = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All referral routes are protected

router.get('/direct', getDirectReferrals);
router.get('/tree', getReferralTree);

module.exports = router;
