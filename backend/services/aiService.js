const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const { searchApprovedFAQs } = require('../utils/faqHelpers');
const { screenInput, validateOutput } = require('../security/promptGuard');
const { buildSecurePrompt, generateCanary } = require('../security/promptHardener');

let genAI = null;
let model = null;

if (config.geminiApiKey && config.geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

const generateResponse = async (message, history) => {
  const inputScreen = screenInput(message);
  if (inputScreen.blocked) {
    return { text: inputScreen.fallback, relatedFaqs: [], blocked: true };
  }

  const sanitizedMessage = inputScreen.normalized;
  const relatedFaqs = await searchApprovedFAQs(sanitizedMessage, 4);
  const contextBlock = relatedFaqs.length
    ? relatedFaqs.map((f, i) => `[FAQ ${i + 1}] Q: ${f.question}\nA: ${f.answer || 'N/A'}`).join('\n\n')
    : 'No matching FAQs in knowledge base.';

  if (!model) {
    const mockAnswer = relatedFaqs[0]
      ? `Based on our FAQ library:\n\n**${relatedFaqs[0].question}**\n${relatedFaqs[0].answer}\n\n(Add GEMINI_API_KEY in backend/.env for full AI responses.)`
      : `[Demo mode] You asked: "${sanitizedMessage}"\n\nNo close FAQ match found.`;
    return { text: mockAnswer, relatedFaqs };
  }

  const canary = generateCanary();
  const { systemBlock, hardened } = buildSecurePrompt(sanitizedMessage, contextBlock, canary);

  let formattedHistory = [
    { role: 'user', parts: [{ text: systemBlock }] },
    { role: 'model', parts: [{ text: 'Understood. I will use the FAQ context when helpful and stay within my role.' }] },
  ];

  if (Array.isArray(history)) {
    formattedHistory = formattedHistory.concat(
      history.slice(-8).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }))
    );
  }

  const sanitizeHistory = (historyArray) => {
    const clean = [];
    for (const msg of historyArray) {
      if (!msg.parts?.[0]?.text) continue;
      if (clean.length > 0 && clean[clean.length - 1].role === msg.role) {
        clean[clean.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        clean.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] });
      }
    }
    while (clean.length > 0 && clean[0].role !== 'user') clean.shift();
    while (clean.length > 0 && clean[clean.length - 1].role !== 'model') clean.pop();
    return clean;
  };

  formattedHistory = sanitizeHistory(formattedHistory);

  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: { maxOutputTokens: 1200 },
  });

  const result = await chat.sendMessage(hardened);
  const rawText = (await result.response).text();

  const outputCheck = validateOutput(rawText, canary, systemBlock);
  if (outputCheck.blocked) {
    return { text: outputCheck.fallback, relatedFaqs, blocked: true };
  }

  return { text: rawText, relatedFaqs };
};

module.exports = { generateResponse };