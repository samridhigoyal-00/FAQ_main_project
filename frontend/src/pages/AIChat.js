import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ remaining: null, limit: null });
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/faq/chat/usage').then(res => setUsage(res.data)).catch(console.error);
    
    setMessages([{ role: 'assistant', content: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your AI Support Tutor. Ask me anything about the platform or your courses!` }]);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || usage.remaining === 0) return;

    const userMessage = { role: 'user', content: input };
    const chatHistory = [...messages, userMessage];
    
    setMessages(chatHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/faq/chat', { 
        message: userMessage.content, 
        history: messages.slice(-6) 
      });

      setMessages([...chatHistory, { role: 'assistant', content: res.data.text, relatedFaqs: res.data.relatedFaqs }]);
      setUsage({ remaining: res.data.remaining, limit: res.data.limit });
    } catch (err) {
      setMessages([...chatHistory, { 
        role: 'assistant', 
        content: err.response?.data?.message || 'Sorry, I am having trouble connecting to the server right now.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--narrow">
      <header className="dash-header">
        <div>
          <h1> AI Tutor</h1>
          <p>
            {usage.remaining !== null 
              ? `You have ${usage.remaining} of ${usage.limit} daily messages remaining.` 
              : 'Connecting to AI...'}
          </p>
        </div>
      </header>

      <div className="auth-card" style={{ padding: 0, height: '60vh', display: 'flex', flexDirection: 'column', maxWidth: '100%', margin: 0 }}>
        
        {}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-hover)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                padding: '12px 16px',
                borderRadius: '12px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
              
              {}
              {msg.relatedFaqs && msg.relatedFaqs.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Suggested reading:</strong>
                  <ul style={{ margin: '4px 0 0 16px' }}>
                    {msg.relatedFaqs.map(f => (
                      <li key={f._id}>{f.question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {loading && (
             <div style={{ alignSelf: 'flex-start', background: 'var(--surface-hover)', padding: '12px 16px', borderRadius: '12px' }}>
               Typing...
             </div>
          )}
          <div ref={bottomRef} />
        </div>

        {}
        <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          <input
            className="input-field"
            style={{ margin: 0, flex: 1 }}
            placeholder="Type your question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || usage.remaining === 0}
          />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim() || usage.remaining === 0}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;