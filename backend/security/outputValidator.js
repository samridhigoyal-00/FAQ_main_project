const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /\b\d{10,13}\b/g,
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /AIza[0-9A-Za-z\-_]{35}/g,
  /sk-[a-zA-Z0-9]{32,}/g,
];

const POLICY_VIOLATION_PATTERNS = [
  /i('m| am) (now |)in (developer|jailbreak|dan|unrestricted) mode/i,
  /as (dan|an unrestricted|a jailbreak|an unfiltered) (ai|model|assistant)/i,
  /my (real|true|actual) (purpose|instructions?|goal) (is|are)/i,
  /sure[,!]?\s+here('s| is) (my system prompt|my instructions?|the text above)/i,
];

function screenOutput(responseText, canaryToken, systemPromptFragment) {
  if (canaryToken && responseText.includes(canaryToken)) {
    return { blocked: true, reason: 'canary_leaked' };
  }

  if (systemPromptFragment && responseText.toLowerCase().includes(systemPromptFragment.toLowerCase().slice(0, 40))) {
    return { blocked: true, reason: 'system_prompt_leaked' };
  }

  for (const pattern of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(responseText)) {
      return { blocked: true, reason: 'pii_detected' };
    }
  }

  for (const pattern of POLICY_VIOLATION_PATTERNS) {
    if (pattern.test(responseText)) {
      return { blocked: true, reason: 'policy_violation' };
    }
  }

  return { blocked: false };
}

module.exports = { screenOutput };
