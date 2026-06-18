const FAQ = require('../models/FAQ');


function getSimilarityScore(a, b) {
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) intersection++;
  }
  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}

async function findSimilarFAQs(question, limit = 5) {
  const trimmed = (question || '').trim();
  if (!trimmed) return [];

  let candidates = [];
  try {
    candidates = await FAQ.find(
      {
        $text: { $search: trimmed },
        $or: [{ isApproved: true }, { status: 'approved' }]
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20) // Fetch more candidates for re-ranking
      .lean();
  } catch (_err) {
    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    candidates = await FAQ.find(
      { $or: [{ isApproved: true }, { status: 'approved' }], question: regex },
      {}
    ).limit(20).lean();
  }

  if (!candidates.length) return [];

  return candidates
    .map(faq => ({ ...faq, score: getSimilarityScore(trimmed, faq.question) }))
    .filter(faq => faq.score > 0)
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

module.exports = { findSimilarFAQs, searchApprovedFAQs, getSimilarityScore };