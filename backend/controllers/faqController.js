// backend/controllers/faqController.js
const faqService = require('../services/faqService');
const aiService = require('../services/aiService');
const ChatUsage = require('../models/ChatUsage');
const config = require('../config/env');

function todayKey() { return new Date().toISOString().slice(0, 10); }

// Checks usage limit WITHOUT incrementing (pre-flight check)
async function checkAIUsage(userId) {
  const date = todayKey();
  const usage = await ChatUsage.findOne({ userId, date });
  const count = usage?.count || 0;
  const allowed = count < config.aiDailyLimit;
  return { allowed, count, remaining: Math.max(0, config.aiDailyLimit - count), limit: config.aiDailyLimit };
}

// Increments ONLY after success
async function incrementAIUsage(userId) {
  const date = todayKey();
  const usage = await ChatUsage.findOneAndUpdate({ userId, date }, { $inc: { count: 1 } }, { upsert: true, new: true });
  return { remaining: Math.max(0, config.aiDailyLimit - usage.count), limit: config.aiDailyLimit };
}

const getFaqs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    res.json(await faqService.getApprovedFAQs(page, limit, (req.query.search || '').trim(), req.query.sort));
  } catch (err) { next(err); }
};

const getSearchSuggestions = async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    res.json({ results: query ? await faqService.getSearchSuggestions(query) : [] });
  } catch (err) { next(err); }
};

const checkDuplicate = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question required' });
    const similar = await faqService.checkDuplicate(question);
    res.json({ similar, hasDuplicate: similar.some(s => s.score >= 0.7) });
  } catch (err) { next(err); }
};

const getUserSubmissions = async (req, res, next) => {
  try { res.json(await faqService.getUserSubmissions(req.user.id, req.user.name)); } catch (err) { next(err); }
};

const addFaq = async (req, res, next) => {
  try {
    if (!req.body.question?.trim()) return res.status(400).json({ message: 'Question is required' });
    const similar = await faqService.checkDuplicate(req.body.question);
    if (similar.some(s => s.score >= 0.75)) return res.status(409).json({ message: 'A very similar FAQ already exists.', similar });
    
    const faq = await faqService.addFaq(req.body, req.user);
    res.status(201).json(faq);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await faqService.getStats();
    const usage = await ChatUsage.findOne({ userId: String(req.user.id), date: todayKey() });
    const aiUsedToday = usage?.count || 0;
    res.json({ ...stats, aiDailyLimit: config.aiDailyLimit, aiUsedToday, aiRemaining: Math.max(0, config.aiDailyLimit - aiUsedToday) });
  } catch (err) { next(err); }
};

const getAdminAnalytics = async (req, res, next) => {
  try { res.json(await faqService.getAdminAnalytics(todayKey())); } catch (err) { next(err); }
};

const getAllFaqsForAdmin = async (req, res, next) => {
  try { res.json(await faqService.getAllFaqsForAdmin()); } catch (err) { next(err); }
};

const approveFaq = async (req, res, next) => {
  try {
    const faq = await faqService.approveFaq(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) { next(err); }
};

const rejectFaq = async (req, res, next) => {
  try {
    const faq = await faqService.rejectFaq(req.params.id, req.body.reason);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) { next(err); }
};

const reportFaq = async (req, res, next) => {
  try {
    const faq = await faqService.reportFaq(req.params.id, req.body.reason, req.user.name);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    if (faq.alreadyReported) return res.status(409).json({ message: 'You have already reported this FAQ.' });
    res.json({ message: 'Report submitted.' });
  } catch (err) { next(err); }
};

const incrementView = async (req, res, next) => {
  try { await faqService.incrementView(req.params.id); res.json({ ok: true }); } catch (err) { next(err); }
};

const chatWithAI = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    // 1. Pre-flight check — do NOT increment yet
    const check = await checkAIUsage(String(req.user.id));
    if (!check.allowed) return res.status(429).json({ message: 'Daily AI limit reached.', remaining: 0, limit: check.limit });

    // 2. Call AI — if this throws, the counter is never incremented
    const aiResult = await aiService.generateResponse(message, history);

    const updated = await incrementAIUsage(String(req.user.id));
    res.json({ text: aiResult.text, relatedFaqs: aiResult.relatedFaqs, remaining: updated.remaining, limit: updated.limit, blocked: aiResult.blocked || false });
  } catch (err) { next(err); }
};

const getChatUsage = async (req, res, next) => {
  try {
    const usage = await ChatUsage.findOne({ userId: String(req.user.id), date: todayKey() });
    const count = usage?.count || 0;
    res.json({ used: count, remaining: Math.max(0, config.aiDailyLimit - count), limit: config.aiDailyLimit });
  } catch (err) { next(err); }
};

const upvoteFaq = async (req, res, next) => {
  try {
    const faq = await faqService.upvoteFaq(req.params.id, String(req.user.id));
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) { next(err); }
};

const editFaq = async (req, res, next) => {
  try {
    if (!req.body.question?.trim()) return res.status(400).json({ message: 'Question is required and cannot be empty.' });
    const faq = await faqService.editFaq(req.params.id, req.body);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) { next(err); }
};

const deleteFaq = async (req, res, next) => {
  try {
    await faqService.deleteFaq(req.params.id);
    res.json({ message: 'FAQ deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  getFaqs, getSearchSuggestions, checkDuplicate, getUserSubmissions, addFaq, getStats,
  getAdminAnalytics, getAllFaqsForAdmin, approveFaq, rejectFaq, reportFaq, incrementView,
  chatWithAI, getChatUsage, upvoteFaq, editFaq, deleteFaq
};