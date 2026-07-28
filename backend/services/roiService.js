const User = require('../models/User');
const Investment = require('../models/Investment');
const RoiHistory = require('../models/RoiHistory');
const ReferralIncome = require('../models/ReferralIncome');

/**
 * Distributes daily ROI and processes referral level incomes for all active investments.
 * This function is fully idempotent and can be run multiple times safely.
 * @param {Date} targetDate The date for which to process the ROI (defaults to today)
 * @returns {Promise<{processedCount: number, skippedCount: number}>}
 */
const distributeDailyRoi = async (targetDate = new Date()) => {
  // 1. Normalize date to midnight UTC to ensure uniqueness per day
  const dateKey = new Date(targetDate);
  dateKey.setUTCHours(0, 0, 0, 0);

  console.log(`[ROI service] Starting daily ROI distribution for date key: ${dateKey.toISOString().slice(0, 10)}`);

  // 2. Fetch all active investments
  const activeInvestments = await Investment.find({ status: 'Active' }).populate('user');
  
  let processedCount = 0;
  let skippedCount = 0;

  for (const investment of activeInvestments) {
    try {
      const owner = investment.user;
      if (!owner) {
        console.warn(`[ROI service] Investment ${investment._id} has no associated user. Skipping.`);
        continue;
      }

      // Check if user account is active
      if (owner.accountStatus !== 'Active') {
        console.log(`[ROI service] Owner of investment ${investment._id} is suspended. Skipping daily ROI.`);
        continue;
      }

      // 3. Expiration Check
      // If today is past or equal to the investment's end date, mark it as completed
      const today = new Date();
      if (new Date(investment.endDate) <= today) {
        investment.status = 'Completed';
        await investment.save();
        console.log(`[ROI service] Investment ${investment._id} has matured. Marked status as Completed.`);
        continue;
      }

      // 4. Calculate ROI amount
      const roiAmount = Number((investment.amount * (investment.dailyRoiPercentage / 100)).toFixed(2));

      // 5. Try to insert RoiHistory to enforce IDEMPOTENCY
      // If an entry already exists for { investment, date: dateKey }, it will throw a unique key error
      let roiRecord;
      try {
        roiRecord = new RoiHistory({
          user: owner._id,
          investment: investment._id,
          amount: roiAmount,
          date: dateKey,
          status: 'Credited',
        });
        await roiRecord.save();
      } catch (err) {
        // Check for MongoDB Duplicate Key error (code 11000)
        if (err.code === 11000) {
          console.log(`[ROI service] ROI already credited for investment ${investment._id} on this date. Skipping.`);
          skippedCount++;
          continue;
        }
        throw err; // Rethrow other database errors
      }

      // 6. Update Owner's Wallet Balance and Total ROI
      owner.walletBalance = Number((owner.walletBalance + roiAmount).toFixed(2));
      owner.totalRoiEarned = Number((owner.totalRoiEarned + roiAmount).toFixed(2));
      await owner.save();

      // 7. Update Investment record tracking
      investment.lastRoiProcessedDate = dateKey;
      await investment.save();

      console.log(`[ROI service] Credited daily ROI $${roiAmount} to user ${owner.fullName} (${owner.email})`);

      // 8. Traverse Referral Hierarchy (Up to 3 levels)
      // Level 1: 10%, Level 2: 5%, Level 3: 3%
      let currentParentId = owner.referredBy;
      const commissionRates = { 1: 0.10, 2: 0.05, 3: 0.03 };

      for (let level = 1; level <= 3; level++) {
        if (!currentParentId) break;

        const parent = await User.findById(currentParentId);
        if (!parent) break;

        // Skip credit if parent user is suspended
        if (parent.accountStatus === 'Active') {
          const rate = commissionRates[level];
          const levelIncomeAmount = Number((roiAmount * rate).toFixed(2));

          if (levelIncomeAmount > 0) {
            // Credit parent wallet
            parent.walletBalance = Number((parent.walletBalance + levelIncomeAmount).toFixed(2));
            parent.totalLevelIncomeEarned = Number((parent.totalLevelIncomeEarned + levelIncomeAmount).toFixed(2));
            await parent.save();

            // Store ReferralIncome log
            await ReferralIncome.create({
              recipient: parent._id,
              referrer: owner._id,
              level,
              amount: levelIncomeAmount,
              investment: investment._id,
              date: dateKey,
            });

            console.log(
              `[ROI service] Level ${level} Referral Income: Credited $${levelIncomeAmount} to parent ${parent.fullName} from user ${owner.fullName}`
            );
          }
        }

        // Move up to the next parent in the chain
        currentParentId = parent.referredBy;
      }

      processedCount++;
    } catch (error) {
      console.error(`[ROI service] Error processing investment ${investment._id}:`, error);
      // Continue to next investment even if one fails
    }
  }

  console.log(`[ROI service] Finished daily ROI. Processed: ${processedCount}, Skipped (Idempotent): ${skippedCount}`);
  return { processedCount, skippedCount };
};

module.exports = {
  distributeDailyRoi,
};
