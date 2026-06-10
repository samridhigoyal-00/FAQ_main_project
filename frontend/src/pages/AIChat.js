import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getAuthConfig } from '../api';

const AIChat = ({ user }) => {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your support assistant.\n\n• I search approved FAQs first\n• Then I help with any online platform problem\n\nWhat's troubling you today?`
    }
  ]);
  const [input, setInput] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [relatedFaqs, setRelatedFaqs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', isAnonymous: false });
  const [modalMessage, setModalMessage] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    api.get('/faq/chat/usage', getAuthConfig())
      .then(res => setUsage(res.data))
      .catch(() => {});
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQ && !sentInitial.current) {
      sentInitial.current = true;
      const fakeEvent = { preventDefault: () => {} };
      setInput(initialQ);
      setTimeout(() => sendMessage(initialQ, fakeEvent), 400);
    }
  }, [initialQ]);

  const sendMessage = async (text, e) => {
    if (e?.preventDefault) e.preventDefault();
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMessage = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setRelatedFaqs([]);

    try {
      const res = await api.post('/faq/chat', {
        message: msg,
        history: messages.slice(1)
      }, getAuthConfig());

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.text }]);
      if (res.data.relatedFaqs?.length) setRelatedFaqs(res.data.relatedFaqs);
      if (res.data.remaining !== undefined) {
        setUsage({
          used: res.data.limit - res.data.remaining,
          remaining: res.data.remaining,
          limit: res.data.limit
        });
      }
    } catch (err) {
      const msgText = err.response?.status === 429
        ? err.response.data.message
        : 'Sorry, something went wrong. Try again or browse FAQs on Home.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msgText}` }]);
    }
    setLoading(false);
  };

  const openSaveModal = (questionText, answerText) => {
    setFaqForm({ question: questionText, answer: answerText, isAnonymous: false });
    setModalMessage('');
    setIsModalOpen(true);
  };

  const handleSaveFAQ = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/faq/add', { ...faqForm, source: 'ai' }, getAuthConfig());
      setModalMessage('✅ Submitted for admin approval. Once approved, all students can use it!');
      setTimeout(() => setIsModalOpen(false), 2200);
    } catch (err) {
      if (err.response?.status === 409) {
        setModalMessage('⚠️ Similar FAQ exists. Search the library first.');
      } else {
        setModalMessage('❌ Could not save. Try again.');
      }
    }
    setModalLoading(false);
  };

  return (
    <div className="page chat-page">
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <h3>💡 Tips</h3>
          <ul>
            <li>Be specific about your error or page</li>
            <li>Check related FAQs below AI replies</li>
            <li>Save good answers to help 10k+ students</li>
          </ul>
          {usage && (
            <div className="usage-box">
              <p>AI quota today</p>
              <div className="usage-bar">
                <div
                  className="usage-bar__fill"
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                />
              </div>
              <small>{usage.remaining} of {usage.limit} left</small>
            </div>
          )}
          <Link to="/" className="btn-secondary" style={{ width: '100%', textAlign: 'center', marginTop: '16px' }}>
            ← Browse FAQs first
          </Link>
        </aside>

        <div className="chat-panel">
          <div className="chat-panel__header">
            <div className="chat-panel__title">
              <span className="chat-avatar">🤖</span>
              <div>
                <h2>AI Support</h2>
                <span className="chat-status">Online · FAQ-aware</span>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`chat-bubble-row ${isUser ? 'chat-bubble-row--user' : ''}`}>
                  {!isUser && <span className="chat-mini-avatar">🤖</span>}
                  <div className="chat-bubble-wrap">
                    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--bot'}`}>
                      <p>{msg.content}</p>
                    </div>
                    {!isUser && index > 0 && (
                      <button
                        type="button"
                        className="save-faq-link"
                        onClick={() => {
                          const prev = messages[index - 1];
                          openSaveModal(prev?.content || 'Student question', msg.content);
                        }}
                      >
                        💾 Save to FAQ library
                      </button>
                    )}
                  </div>
                  {isUser && (
                    <span className="chat-mini-avatar chat-mini-avatar--user">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="chat-bubble-row">
                <span className="chat-mini-avatar">🤖</span>
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {relatedFaqs.length > 0 && (
            <div className="related-faqs">
              <p>Related from FAQ library:</p>
              {relatedFaqs.map(f => (
                <Link key={f._id} to={`/?q=${encodeURIComponent(f.question)}`} className="related-faq-chip">
                  {f.question}
                </Link>
              ))}
            </div>
          )}

          <form className="chat-input-bar" onSubmit={e => sendMessage(null, e)}>
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe your problem..."
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Save solution for everyone</h3>
            <p className="text-muted">Admin will review before it goes public.</p>
            {modalMessage && <p className={`alert ${modalMessage.startsWith('✅') ? 'alert--success' : 'alert--warn'}`}>{modalMessage}</p>}
            <form onSubmit={handleSaveFAQ}>
              <label className="label">Question</label>
              <input className="input-field" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} required />
              <label className="label">Answer</label>
              <textarea className="input-field textarea" value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} required />
              <label className="checkbox-row">
                <input type="checkbox" checked={faqForm.isAnonymous} onChange={e => setFaqForm({ ...faqForm, isAnonymous: e.target.checked })} />
                Submit anonymously
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Submit for approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
