const { normalize } = require('./inputNormalizer');
const { detect } = require('./patternDetector');
const { analyze } = require('./heuristicAnalyzer');
const { screenOutput } = require('./outputValidator');

const INPUT_BLOCK_THRESHOLD = 12;

const SAFE_FALLBACK = "I can only help with questions related to our FAQ knowledge base. Please ask a relevant question.";

function logSecurityEvent(type, data) {
  const entry = { timestamp: new Date().toISOString(), type, ...data };
  console.warn('[SECURITY]', JSON.stringify(entry));
}

function screenInput(rawText) {
  const normalized = normalize(rawText);

  const patternResult = detect(normalized);
  const heuristicResult = analyze(normalized);

  const totalScore = patternResult.score + heuristicResult.score;

  if (totalScore >= INPUT_BLOCK_THRESHOLD) {
    logSecurityEvent('INPUT_BLOCKED', { score: totalScore, threats: patternResult.threats });
    return { blocked: true, normalized, fallback: SAFE_FALLBACK };
  }

  return { blocked: false, normalized };
}

function validateOutput(responseText, canaryToken, systemFragment) {
  const result = screenOutput(responseText, canaryToken, systemFragment);

  if (result.blocked) {
    logSecurityEvent('OUTPUT_BLOCKED', { reason: result.reason });
    return { blocked: true, fallback: SAFE_FALLBACK };
  }

  return { blocked: false };
}

module.exports = { screenInput, validateOutput, SAFE_FALLBACK };
