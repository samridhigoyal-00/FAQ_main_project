// frontend/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth(); // Context aware!
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      // Public route, no authentication needed, but smart API handles it fine!
      api.get('/faq', { params: { search, limit: 20, sort: 'upvotes' } })
        .then(res => setFaqs(res.data.faqs))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300); // 300ms debounce on typing

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="page page--narrow">
      <header style={{ textAlign: 'center', margin: '3rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How can we help?</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Search our community-driven knowledge base.</p>
        
        <input
          type="search"
          className="input-field"
          style={{ maxWidth: '600px', margin: '2rem auto 0', padding: '1rem', fontSize: '1.1rem', borderRadius: '30px' }}
          placeholder="🔍 Search for questions, errors, or topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {loading ? (
          <div className="loading-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : faqs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map(faq => (
              <article key={faq._id} className="admin-card hover-lift">
                <h3>{faq.question}</h3>
                <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{faq.answer}</p>
<div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <button
    onClick={async () => {
      if (!user) return alert('Please login to upvote');
      try {
        const res = await api.post(`/faq/${faq._id}/upvote`);
        setFaqs(prev => prev.map(f =>
          f._id === faq._id ? { ...f, upvotes: res.data.upvotes } : f
        ));
      } catch (err) {
        console.error(err);
      }
    }}
    style={{
      background: 'none',
      border: `1px solid ${faq.upvotes?.includes(user?.id) ? 'var(--primary)' : 'var(--border)'}`,
      color: faq.upvotes?.includes(user?.id) ? 'var(--primary)' : 'var(--text-muted)',
      borderRadius: '20px',
      padding: '4px 12px',
      cursor: user ? 'pointer' : 'default',
      fontSize: '0.85rem',
      fontWeight: '600',
      transition: 'all 0.2s'
    }}
  >
    ▲ {faq.upvotes?.length || 0}
  </button>
  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
    {faq.upvotes?.length === 1 ? '1 upvote' : `${faq.upvotes?.length || 0} upvotes`}
  </span>
</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card" style={{ textAlign: 'center' }}>
            <h2>No answers found</h2>
            <p>We couldn't find an exact match for your search.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {user ? (
                <>
                  <Link to="/chat" className="btn-primary">Ask the AI Tutor</Link>
                  <Link to="/add-faq" className="btn-ghost">Submit a Question</Link>
                </>
              ) : (
                <Link to="/login" className="btn-primary">Log in to ask AI</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;