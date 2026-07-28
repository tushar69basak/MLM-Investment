const cron = require('node-cron');
const { distributeDailyRoi } = require('./roiService');

const initCronJobs = () => {
  console.log('[Cron Service] Initializing scheduler...');

  // Run every day at 12:00 AM (00:00)
  // Pattern: minute hour day-of-month month day-of-week
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Service] Running scheduled Daily ROI Job...');
    try {
      const result = await distributeDailyRoi(new Date());
      console.log(`[Cron Service] Daily ROI distribution completed:`, result);
    } catch (error) {
      console.error('[Cron Service] Scheduled job failed:', error);
    }
  });

  console.log('[Cron Service] Scheduled Daily ROI Job configured for 12:00 AM daily.');
};

module.exports = {
  initCronJobs,
};
