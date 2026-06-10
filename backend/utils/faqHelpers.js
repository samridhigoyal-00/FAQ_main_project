const FAQ = require('../models/FAQ');

function normalizeText(text) {
  return (text || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function similarityScore(a, b) {
  const wordsA = new Set(normalizeText(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeText(b).split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) overlap += 1; });
  return overlap / Math.max(wordsA.size, wordsB.size);
}

async function findSimilarFAQs(question, limit = 5) {
  const normalized = normalizeText(question);
  if (!normalized) return [];

  const candidates = await FAQ.find({
    $or: [{ isApproved: true }, { status: 'approved' }]
  })
    .select('question answer isApproved status')
    .limit(200)
    .lean();

  return candidates
    .map(faq => ({
      ...faq,
      score: similarityScore(question, faq.question)
    }))
    .filter(f => f.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function searchApprovedFAQs(query, limit = 5) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  try {
    const textResults = await FAQ.find(
      { $text: { $search: trimmed }, isApproved: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
    if (textResults.length > 0) return textResults;
  } catch (_) {
    /* text index may not exist yet */
  }

  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return FAQ.find({
    isApproved: true,
    $or: [{ question: regex }, { answer: regex }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = { normalizeText, similarityScore, findSimilarFAQs, searchApprovedFAQs };
