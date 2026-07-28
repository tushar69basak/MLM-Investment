const mongoose = require('mongoose');

const referralIncomeSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    level: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// We can add a compound index to help with checking duplicate level distribution for the same investment and date if needed,
// but the RoiHistory unique index is our primary idempotency boundary.
referralIncomeSchema.index({ investment: 1, recipient: 1, date: 1 });

const ReferralIncome = mongoose.model('ReferralIncome', referralIncomeSchema);
module.exports = ReferralIncome;
