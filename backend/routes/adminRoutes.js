const express = require('express');
const router = express.Router();
const { 
  triggerRoiDistribution, 
  resetSandbox, 
  getAdminDashboardStats, 
  toggleUserStatus 
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public sandbox trigger routes for dev testing / CLI E2E tests
router.post('/trigger-roi', triggerRoiDistribution);
router.post('/reset-sandbox', resetSandbox);

// Secured admin directory and controls (Requires Admin Authentication)
router.get('/dashboard-stats', protect, isAdmin, getAdminDashboardStats);
router.post('/toggle-user-status/:userId', protect, isAdmin, toggleUserStatus);

module.exports = router;
