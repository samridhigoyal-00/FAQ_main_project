const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FAQ = require('../models/FAQ');
const ChatUsage = require('../models/ChatUsage');
const { findSimilarFAQs, searchApprovedFAQs } = require('../utils/faqHelpers');

const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || '40', 10);

const isAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

function syncStatus(faq) {
  if (faq.status === 'rejected') {
    faq.isApproved = false;
  } else if (faq.status === 'approved' || faq.isApproved) {
    faq.status = 'approved';
    faq.isApproved = true;
  } else {
    faq.status = 'pending';
    faq.isApproved = false;
  }
  return faq;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function checkAndIncrementAIUsage(userId) {
  const date = todayKey();
  const usage = await ChatUsage.findOneAndUpdate(
    { userId, date },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  if (usage.count > AI_DAILY_LIMIT) {
    await ChatUsage.updateOne({ userId, date }, { $inc: { count: -1 } });
    return { allowed: false, remaining: 0, limit: AI_DAILY_LIMIT };
  }
  return {
    allowed: true,
    remaining: Math.max(0, AI_DAILY_LIMIT - usage.count),
    limit: AI_DAILY_LIMIT
  };
}

// GET approved FAQs with pagination & search
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const search = (req.query.search || '').trim();
    const sort = req.query.sort === 'upvotes' ? 'upvotes' : 'newest';
    const skip = (page - 1) * limit;

    const filter = { isApproved: true, status: { $ne: 'rejected' } };

    let faqs;
    let total;

    if (search) {
      try {
        const textFilter = { ...filter, $text: { $search: search } };
        total = await FAQ.countDocuments(textFilter);
        faqs = await FAQ.find(textFilter, { score: { $meta: 'textScore' } })
          .sort(sort === 'upvotes' ? { upvotes: -1 } : { score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit);
      } catch {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const regexFilter = {
          ...filter,
          $or: [{ question: regex }, { answer: regex }]
        };
        total = await FAQ.countDocuments(regexFilter);
        faqs = await FAQ.find(regexFilter)
          .sort(sort === 'upvotes' ? { upvotes: -1 } : { createdAt: -1 })
          .skip(skip)
          .limit(limit);
      }
    } else {
      total = await FAQ.countDocuments(filter);
      faqs = await FAQ.find(filter)
        .sort(sort === 'upvotes' ? { upvotes: -1 } : { createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    res.json({
      faqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET quick search suggestions (approved only)
router.get('/search-suggest', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ results: [] });
    const results = await searchApprovedFAQs(q, 6);
    res.json({ results });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST check duplicate before submit
router.post('/check-duplicate', isAuth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question required' });
    const similar = await findSimilarFAQs(question, 5);
    res.json({ similar, hasDuplicate: similar.some(s => s.score >= 0.7) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET my submissions
router.get('/my-submissions', isAuth, async (req, res) => {
  try {
    const faqs = await FAQ.find({
      $or: [
        { createdById: req.user.id },
        { createdBy: req.user.name, createdById: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.json(faqs.map(f => syncStatus(f)));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add FAQ
router.post('/add', isAuth, async (req, res) => {
  try {
    const { question, answer, isAnonymous, source } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question is required' });

    const similar = await findSimilarFAQs(question, 3);
    if (similar.some(s => s.score >= 0.75)) {
      return res.status(409).json({
        message: 'A very similar FAQ already exists. Please search before submitting.',
        similar
      });
    }

    const isAdminUser = req.user.role === 'admin';
    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer?.trim() || '',
      isAnonymous: isAnonymous || false,
      createdBy: req.user.name,
      createdById: String(req.user.id),
      isApproved: isAdminUser,
      status: isAdminUser ? 'approved' : 'pending',
      source: source || (isAdminUser ? 'admin' : 'student')
    });
    res.json(faq);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET stats (aggregated)
router.get('/stats', isAuth, async (req, res) => {
  try {
    const [approved, pending, rejected, totalReplies, totalReports] = await Promise.all([
      FAQ.countDocuments({ isApproved: true }),
      FAQ.countDocuments({ status: 'pending', isApproved: false }),
      FAQ.countDocuments({ status: 'rejected' }),
      FAQ.aggregate([{ $project: { n: { $size: { $ifNull: ['$replies', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }]),
      FAQ.aggregate([{ $project: { n: { $size: { $ifNull: ['$reports', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }])
    ]);

    const date = todayKey();
    let aiUsageToday = 0;
    if (req.user.id) {
      const usage = await ChatUsage.findOne({ userId: String(req.user.id), date });
      aiUsageToday = usage?.count || 0;
    }

    res.json({
      approvedFAQs: approved,
      pendingFAQs: pending,
      rejectedFAQs: rejected,
      totalReplies: totalReplies[0]?.total || 0,
      totalReports: totalReports[0]?.total || 0,
      aiDailyLimit: AI_DAILY_LIMIT,
      aiUsedToday: aiUsageToday,
      aiRemaining: Math.max(0, AI_DAILY_LIMIT - aiUsageToday)
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET admin analytics
router.get('/admin/analytics', isAdmin, async (req, res) => {
  try {
    const [approved, pending, rejected, bySource, topUpvoted, recentReports] = await Promise.all([
      FAQ.countDocuments({ isApproved: true }),
      FAQ.countDocuments({ status: 'pending' }),
      FAQ.countDocuments({ status: 'rejected' }),
      FAQ.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      FAQ.find({ isApproved: true }).sort({ upvotes: -1 }).limit(5).select('question upvotes'),
      FAQ.find({ 'reports.0': { $exists: true } }).sort({ updatedAt: -1 }).limit(10).select('question reports')
    ]);

    const today = todayKey();
    const aiToday = await ChatUsage.aggregate([
      { $match: { date: today } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);

    res.json({
      approved,
      pending,
      rejected,
      bySource,
      topUpvoted,
      recentReports,
      aiMessagesToday: aiToday[0]?.total || 0
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all for admin
router.get('/admin/all', isAdmin, async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.json(faqs.map(f => syncStatus(f)));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST approve
router.post('/:id/approve', isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    faq.isApproved = true;
    faq.status = 'approved';
    faq.rejectReason = '';
    await faq.save();
    res.json(faq);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST reject
router.post('/:id/reject', isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    faq.isApproved = false;
    faq.status = 'rejected';
    faq.rejectReason = (req.body.reason || 'Does not meet quality guidelines.').trim();
    await faq.save();
    res.json(faq);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST report FAQ
router.post('/:id/report', isAuth, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    faq.reports.push({
      reason: (req.body.reason || 'Incorrect or unhelpful').trim(),
      reportedBy: req.user.name
    });
    await faq.save();
    res.json({ message: 'Report submitted. Admin will review.' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST increment view
router.post('/:id/view', async (req, res) => {
  try {
    await FAQ.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST AI chat with RAG + rate limit
router.post('/chat', isAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const usage = await checkAndIncrementAIUsage(String(req.user.id));
    if (!usage.allowed) {
      return res.status(429).json({
        message: `Daily AI limit reached (${AI_DAILY_LIMIT}/day). Try browsing FAQs or come back tomorrow.`,
        remaining: 0,
        limit: AI_DAILY_LIMIT
      });
    }

    const relatedFaqs = await searchApprovedFAQs(message, 4);
    const contextBlock = relatedFaqs.length
      ? relatedFaqs.map((f, i) => `[FAQ ${i + 1}] Q: ${f.question}\nA: ${f.answer || 'N/A'}`).join('\n\n')
      : 'No matching FAQs in knowledge base.';

    const systemPreamble = `You are a helpful student support assistant for an online learning platform.
Use the following approved FAQ knowledge when relevant. If an FAQ answers the question, prefer that answer and mention it came from the community FAQ library.
If unsure, give clear step-by-step guidance. Be concise and friendly.

--- APPROVED FAQ CONTEXT ---
${contextBlock}
--- END CONTEXT ---`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      const mockAnswer = relatedFaqs[0]
        ? `Based on our FAQ library:\n\n**${relatedFaqs[0].question}**\n${relatedFaqs[0].answer}\n\n(Add GEMINI_API_KEY in backend/.env for full AI responses.)`
        : `[Demo mode] You asked: "${message}"\n\nNo close FAQ match found. Add GEMINI_API_KEY for intelligent answers. Meanwhile, try searching the FAQ library on the home page.`;
      return res.json({
        text: mockAnswer,
        relatedFaqs,
        remaining: usage.remaining,
        limit: usage.limit
      });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let formattedHistory = [{ role: 'user', parts: [{ text: systemPreamble }] }, { role: 'model', parts: [{ text: 'Understood. I will use the FAQ context when helpful.' }] }];
    if (Array.isArray(history)) {
      formattedHistory = formattedHistory.concat(
        history.slice(-8).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }))
      );
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: { maxOutputTokens: 1200 }
    });

    const result = await chat.sendMessage(message);
    const responseText = (await result.response).text();

    res.json({
      text: responseText,
      relatedFaqs,
      remaining: usage.remaining,
      limit: usage.limit
    });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ message: 'Error communicating with AI', error: err.message });
  }
});

// GET AI usage remaining
router.get('/chat/usage', isAuth, async (req, res) => {
  const date = todayKey();
  const usage = await ChatUsage.findOne({ userId: String(req.user.id), date });
  const count = usage?.count || 0;
  res.json({
    used: count,
    remaining: Math.max(0, AI_DAILY_LIMIT - count),
    limit: AI_DAILY_LIMIT
  });
});

router.post('/:id/upvote', isAuth, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    const userId = String(req.user.id);
    const index = faq.upvotes.indexOf(userId);
    if (index === -1) faq.upvotes.push(userId);
    else faq.upvotes.splice(index, 1);
    await faq.save();
    res.json(faq);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { question, answer } = req.body;
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer },
      { new: true }
    );
    res.json(faq);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'FAQ deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
