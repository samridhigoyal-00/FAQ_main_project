const FAQ = require('../models/FAQ');
const ChatUsage = require('../models/ChatUsage');
const { findSimilarFAQs } = require('../utils/faqHelpers');

function syncStatus(faq) {
  if (faq.status === 'rejected') faq.isApproved = false;
  else if (faq.status === 'approved' || faq.isApproved) { faq.status = 'approved'; faq.isApproved = true; }
  else { faq.status = 'pending'; faq.isApproved = false; }
  return faq;
}

const getApprovedFAQs = async (page, limit, search, sort) => {
  const skip = (page - 1) * limit;
  const filter = { isApproved: true, status: { $ne: 'rejected' } };
  let faqs, total;

  if (search) {
    try {
      const textFilter = { ...filter, $text: { $search: search } };
      total = await FAQ.countDocuments(textFilter);
      faqs = await FAQ.find(textFilter, { score: { $meta: 'textScore' } }).sort(sort === 'upvotes' ? { upvotes: -1 } : { score: { $meta: 'textScore' } }).skip(skip).limit(limit);
    } catch {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const regexFilter = { ...filter, $or: [{ question: regex }, { answer: regex }] };
      total = await FAQ.countDocuments(regexFilter);
      faqs = await FAQ.find(regexFilter).sort(sort === 'upvotes' ? { upvotes: -1 } : { createdAt: -1 }).skip(skip).limit(limit);
    }
  } else {
    total = await FAQ.countDocuments(filter);
    faqs = await FAQ.find(filter).sort(sort === 'upvotes' ? { upvotes: -1 } : { createdAt: -1 }).skip(skip).limit(limit);
  }
  return { faqs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const getSearchSuggestions = async (query) => {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return await FAQ.find({ isApproved: true, question: regex }, { question: 1, _id: 1 }).limit(5);
};

const checkDuplicate = async (question) => findSimilarFAQs(question, 5);

const getUserSubmissions = async (userId, userName) => {
  const faqs = await FAQ.find({
    $or: [ { createdById: userId }, { createdBy: userName, createdById: { $exists: false } } ]
  }).sort({ createdAt: -1 });
  return faqs.map(syncStatus);
};

const addFaq = async (data, user) => {
  const isAdminUser = user.role === 'admin';
  const faq = new FAQ({
    question: data.question.trim(),
    answer: data.answer?.trim() || '',
    isAnonymous: data.isAnonymous || false,
    createdBy: user.name,
    createdById: String(user.id),
    isApproved: isAdminUser,
    status: isAdminUser ? 'approved' : 'pending',
    source: data.source || (isAdminUser ? 'admin' : 'student')
  });
  return await faq.save();
};

const getStats = async () => {
  const [approved, pending, rejected, totalReplies, totalReports] = await Promise.all([
    FAQ.countDocuments({ isApproved: true }),
    FAQ.countDocuments({ status: 'pending', isApproved: false }),
    FAQ.countDocuments({ status: 'rejected' }),
    FAQ.aggregate([{ $project: { n: { $size: { $ifNull: ['$replies', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }]),
    FAQ.aggregate([{ $project: { n: { $size: { $ifNull: ['$reports', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }])
  ]);
  return { approved, pending, rejected, totalReplies: totalReplies[0]?.total || 0, totalReports: totalReports[0]?.total || 0 };
};

const getAdminAnalytics = async (todayKey) => {
  const [approved, pending, rejected, bySource, topUpvoted, recentReports] = await Promise.all([
    FAQ.countDocuments({ isApproved: true }),
    FAQ.countDocuments({ status: 'pending' }),
    FAQ.countDocuments({ status: 'rejected' }),
    FAQ.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    FAQ.find({ isApproved: true }).sort({ upvotes: -1 }).limit(5).select('question upvotes'),
    FAQ.find({ 'reports.0': { $exists: true } }).sort({ updatedAt: -1 }).limit(10).select('question reports')
  ]);

  const aiToday = await ChatUsage.aggregate([ { $match: { date: todayKey } }, { $group: { _id: null, total: { $sum: '$count' } } } ]);
  return { approved, pending, rejected, bySource, topUpvoted, recentReports, aiMessagesToday: aiToday[0]?.total || 0 };
};

const getAllFaqsForAdmin = async () => {
  const faqs = await FAQ.find().sort({ createdAt: -1 });
  return faqs.map(syncStatus);
};

const approveFaq = async (id) => {
  const faq = await FAQ.findById(id);
  if (!faq) return null;
  faq.isApproved = true; faq.status = 'approved'; faq.rejectReason = '';
  return await faq.save();
};

const rejectFaq = async (id, reason) => {
  const faq = await FAQ.findById(id);
  if (!faq) return null;
  faq.isApproved = false; faq.status = 'rejected'; faq.rejectReason = (reason || 'Does not meet quality guidelines.').trim();
  return await faq.save();
};

const reportFaq = async (id, reason, reportedBy) => {
  const faq = await FAQ.findById(id);
  if (!faq) return null;
  const alreadyReported = faq.reports.some(r => r.reportedBy === reportedBy);
  if (alreadyReported) return { alreadyReported: true };
  faq.reports.push({ reason: (reason || 'Incorrect or unhelpful').trim(), reportedBy });
  return await faq.save();
};

const incrementView = async (id) => FAQ.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

const upvoteFaq = async (id, userId) => {
  const faq = await FAQ.findById(id);
  if (!faq) return null;
  const index = faq.upvotes.indexOf(userId);
  if (index === -1) faq.upvotes.push(userId); else faq.upvotes.splice(index, 1);
  return await faq.save();
};

const editFaq = async (id, data) => FAQ.findByIdAndUpdate(
  id,
  { question: data.question.trim(), answer: (data.answer || '').trim() },
  { new: true, runValidators: true }
);
const deleteFaq = async (id) => FAQ.findByIdAndDelete(id);

module.exports = {
  getApprovedFAQs, getSearchSuggestions, checkDuplicate, getUserSubmissions, addFaq,
  getStats, getAdminAnalytics, getAllFaqsForAdmin, approveFaq, rejectFaq, reportFaq,
  incrementView, upvoteFaq, editFaq, deleteFaq
};