const mongoose = require('mongoose');

const chatUsageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  count: { type: Number, default: 0 }
});

chatUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ChatUsage', chatUsageSchema);
