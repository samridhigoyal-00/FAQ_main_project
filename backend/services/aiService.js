const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const { searchApprovedFAQs } = require('../utils/faqHelpers');

let genAI = null;
let model = null;

if (config.geminiApiKey && config.geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

const generateResponse = async (message, history) => {
  const relatedFaqs = await searchApprovedFAQs(message, 4);
  const contextBlock = relatedFaqs.length
    ? relatedFaqs.map((f, i) => `[FAQ ${i + 1}] Q: ${f.question}\nA: ${f.answer || 'N/A'}`).join('\n\n')
    : 'No matching FAQs in knowledge base.';

  if (!model) {
    const mockAnswer = relatedFaqs[0]
      ? `Based on our FAQ library:\n\n**${relatedFaqs[0].question}**\n${relatedFaqs[0].answer}\n\n(Add GEMINI_API_KEY in backend/.env for full AI responses.)`
      : `[Demo mode] You asked: "${message}"\n\nNo close FAQ match found.`;
      
    return { text: mockAnswer, relatedFaqs };
  }

  const systemPreamble = `You are a helpful student support assistant...
--- APPROVED FAQ CONTEXT ---
${contextBlock}
--- END CONTEXT ---`;

  let formattedHistory = [
    { role: 'user', parts: [{ text: systemPreamble }] }, 
    { role: 'model', parts: [{ text: 'Understood. I will use the FAQ context when helpful.' }] }
  ];

  if (Array.isArray(history)) {
    formattedHistory = formattedHistory.concat(
      history.slice(-8).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
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
    while (clean.length > 0 && clean[0].role !== 'user') {
      clean.shift();
    }
    while (clean.length > 0 && clean[clean.length - 1].role !== 'model') {
      clean.pop();
    }
    return clean;
  };

  formattedHistory = sanitizeHistory(formattedHistory);

  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: { maxOutputTokens: 1200 }
  });

  const result = await chat.sendMessage(message);
  return {
    text: (await result.response).text(),
    relatedFaqs
  };
};

module.exports = { generateResponse };