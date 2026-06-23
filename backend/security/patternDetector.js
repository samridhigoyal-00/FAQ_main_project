const THREAT_PATTERNS = [
  {
    category: 'instruction_override',
    severity: 9,
    patterns: [
      /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|guidelines?|prompts?)/i,
      /disregard\s+(your\s+)?(instructions?|rules?|guidelines?|previous)/i,
      /forget\s+(everything|all|your\s+instructions?|what\s+you('ve| have)\s+been\s+told)/i,
      /override\s+(your\s+)?(instructions?|rules?|guidelines?|system)/i,
      /do\s+not\s+(follow|obey|respect)\s+(your\s+)?(instructions?|rules?|guidelines?)/i,
      /new\s+(instructions?|rules?|guidelines?|prompt|directive)\s*:/i,
      /from\s+now\s+on\s+(you|ignore|forget|act)/i,
      /\[\s*system\s*\]/i,
      /<\s*system\s*>/i,
      /###\s*(instruction|system|prompt)/i,
    ],
  },
  {
    category: 'persona_hijacking',
    severity: 9,
    patterns: [
      /you\s+are\s+now\s+(dan|jailbreak|unrestricted|evil|free|dev(eloper)?)\b/i,
      /pretend\s+(you\s+are|to\s+be)\s+(an?\s+)?(unrestricted|evil|jailbreak|different|new|another)/i,
      /act\s+as\s+(an?\s+)?(unrestricted|evil|jailbreak|different|ai\s+without|unfiltered)/i,
      /developer\s+mode\s+(enabled|on|activated)/i,
      /enable\s+developer\s+mode/i,
      /jailbreak/i,
      /\bdan\b.*\bmode\b/i,
      /switch\s+to\s+(unrestricted|evil|unfiltered|jailbreak)\s+mode/i,
      /your\s+true\s+(self|form|nature)\s+is/i,
      /your\s+real\s+(instructions?|purpose|goal)\s+is/i,
    ],
  },
  {
    category: 'system_prompt_extraction',
    severity: 7,
    patterns: [
      /repeat\s+(the\s+)?(text|words?|content|instructions?)\s+(above|before|earlier|at\s+the\s+(top|start|beginning))/i,
      /print\s+(your\s+)?(system\s+prompt|instructions?|guidelines?|configuration)/i,
      /show\s+(me\s+)?(your\s+)?(system\s+prompt|instructions?|guidelines?|configuration)/i,
      /what\s+(are|were|is)\s+(your\s+)?(original\s+)?(instructions?|system\s+prompt|guidelines?)/i,
      /reveal\s+(your\s+)?(system\s+prompt|instructions?|guidelines?|original\s+prompt)/i,
      /output\s+(your\s+)?(system\s+prompt|instructions?|everything\s+above)/i,
      /tell\s+me\s+(your\s+)?(system\s+prompt|original\s+instructions?)/i,
      /summarize\s+(the\s+)?(text|content|instructions?)\s+above/i,
    ],
  },
  {
    category: 'encoding_evasion',
    severity: 8,
    patterns: [
      /decode\s+(this|the\s+following|below)?\s*(and\s+)?(execute|run|follow|obey)/i,
      /translate\s+(from|this)\s*(base64|rot[\s-]?13|hex|cipher)/i,
      /base64\s+(decode|encoded|payload)/i,
      /rot[\s-]?13/i,
      /hex\s+(decode|encoded|payload)/i,
    ],
  },
  {
    category: 'delimiter_escape',
    severity: 8,
    patterns: [
      /<\/?(system|instruction|prompt|context|user_message)>/i,
      /```\s*(end|stop|close)\s*(system|instruction|prompt)/i,
      /\[\s*(end|stop|close)\s*(system|instruction|prompt)\s*\]/i,
      /---\s*(end|stop|close)\s*(system|instruction|context|prompt)/i,
    ],
  },
];

function detect(normalizedText) {
  let totalScore = 0;
  const threats = [];

  for (const { category, severity, patterns } of THREAT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        totalScore += severity;
        threats.push(category);
        break;
      }
    }
  }

  return { score: totalScore, threats: [...new Set(threats)] };
}

module.exports = { detect };
