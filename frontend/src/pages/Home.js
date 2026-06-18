import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const FAQItem = ({ faq, highlight }) => {
  const [open, setOpen] = useState(false);

  const hl = (text) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  return (
    <article className={`faq-card${open ? ' faq-card--open' : ''}`}>
      <button className="faq-card__header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="faq-card__question">{hl(faq.question)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
            ▲ {faq.upvotes?.length || 0}
          </span>
          <span className={`faq-card__toggle-icon ${open ? 'open' : ''}`}>
            {open ? '−' : '+'}
          </span>
        </div>
      </button>
      {open && (
        <div className="faq-card__body">
          <p className="faq-card__answer">{hl(faq.answer)}</p>
          <div className="faq-card__footer">
            <span>{faq.createdBy || 'Community'}</span>
            <span>{faq.replies?.length || 0} replies</span>
            {faq.createdAt && (
              <span>{new Date(faq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [faqs, setFaqs]     = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/faq', { params: { search, limit: 30 } })
        .then(res => setFaqs(res.data.faqs || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="page page--narrow">
      {}
      <header className="hero" style={{ position: 'relative' }}>
        <span className="hero__badge">Community Knowledge Base</span>
        <h1 className="hero__title">
          Frequently Asked Questions
        </h1>
        <p className="hero__subtitle">
          Browse community-sourced answers, or ask our AI tutor for personalised guidance.
        </p>

        <div className="search-hero">
          <input
            id="faq-search"
            type="search"
            className="search-hero__input"
            placeholder="Search for questions, topics, errors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
            style={{ paddingLeft: '20px' }}
          />
          {user && (
            <Link to="/chat" className="btn-primary search-hero__btn">
              Ask AI
            </Link>
          )}
        </div>
      </header>

      {}
      <section>
        <div className="toolbar">
          <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--text-heading)' }}>
            {search
              ? `Results for "${search}"`
              : 'All Questions'}
          </h2>
          {!loading && (
            <span className="toolbar__count">{faqs.length} answer{faqs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4].map(n => <div key={n} className="skeleton-card" />)}
          </div>
        ) : faqs.length > 0 ? (
          <div className="faq-list">
            {faqs.map(faq => (
              <FAQItem key={faq._id} faq={faq} highlight={search} />
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>No answers found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              We couldn't find an exact match for "<strong>{search}</strong>".
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {user ? (
                <>
                  <Link to="/chat" className="btn-primary">Ask the AI Tutor</Link>
                  <Link to="/add-faq" className="btn-secondary">Submit a Question</Link>
                </>
              ) : (
                <Link to="/login" className="btn-primary">Log in to ask AI</Link>
              )}
            </div>
          </div>
        )}

        {}
        {!user && !loading && faqs.length > 0 && (
          <div className="cta-ai-banner" style={{ marginTop: '40px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Didn't find what you needed?
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '18px', fontSize: '14px' }}>
              Log in to chat with our AI tutor or submit your own question.
            </p>
            <Link to="/login" className="btn-primary">Get Started →</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;