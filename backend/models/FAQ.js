const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdBy: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  reportedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String },
  createdBy: { type: String },
  createdById: { type: String },
  upvotes: { type: [String], default: [] },
  isAnonymous: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectReason: { type: String, default: '' },
  replies: [replySchema],
  reports: [reportSchema],
  viewCount: { type: Number, default: 0 },
  source: { type: String, enum: ['student', 'admin', 'ai'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ isApproved: 1, createdAt: -1 });
faqSchema.index({ createdById: 1, status: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
