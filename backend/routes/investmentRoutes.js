const express = require('express');
const router = express.Router();
const { createInvestment, getUserInvestments, simulateDeposit } = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All investment routes are protected

router.post('/', createInvestment);
router.get('/', getUserInvestments);
router.post('/deposit', simulateDeposit);

module.exports = router;
