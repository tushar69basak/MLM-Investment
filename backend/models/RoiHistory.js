const mongoose = require('mongoose');

const roiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      default: 'Credited',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce database-level uniqueness for daily ROI per investment.
// By saving the date normalized to YYYY-MM-DD 00:00:00, this prevents
// duplicate records for the same day.
roiHistorySchema.index({ investment: 1, date: 1 }, { unique: true });

const RoiHistory = mongoose.model('RoiHistory', roiHistorySchema);
module.exports = RoiHistory;
