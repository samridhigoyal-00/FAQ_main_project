const SCRIPT_RANGES = [
  [0x0041, 0x007A],
  [0x0400, 0x04FF],
  [0x0600, 0x06FF],
  [0x4E00, 0x9FFF],
  [0x0900, 0x097F],
  [0x0370, 0x03FF],
];

function shannonEntropy(text) {
  const freq = {};
  for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;
  const len = text.length;
  return -Object.values(freq).reduce((sum, count) => {
    const p = count / len;
    return sum + p * Math.log2(p);
  }, 0);
}

function detectScriptMixing(text) {
  const usedRanges = new Set();
  for (const ch of text) {
    const code = ch.codePointAt(0);
    for (let i = 0; i < SCRIPT_RANGES.length; i++) {
      if (code >= SCRIPT_RANGES[i][0] && code <= SCRIPT_RANGES[i][1]) {
        usedRanges.add(i);
        break;
      }
    }
  }
  return usedRanges.size;
}

function detectStructuralAnomalies(text) {
  let score = 0;
  const specialRatio = (text.match(/[^a-zA-Z0-9\s.,?!]/g) || []).length / Math.max(text.length, 1);
  if (specialRatio > 0.3) score += 4;
  const lineBreaks = (text.match(/\n/g) || []).length;
  if (lineBreaks > 10) score += 3;
  if (text.length > 2000) score += 2;
  return score;
}

function analyze(text) {
  let score = 0;

  const entropy = shannonEntropy(text);
  if (entropy > 4.5) score += 5;
  else if (entropy > 3.8) score += 2;

  const scriptCount = detectScriptMixing(text);
  if (scriptCount >= 3) score += 8;
  else if (scriptCount === 2) score += 2;

  score += detectStructuralAnomalies(text);

  return { score };
}

module.exports = { analyze };
