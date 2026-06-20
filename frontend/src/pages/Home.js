// frontend/src/pages/Home.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // FAQ Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);

      api
        .get('/faq', {
          params: {
            search,
            limit: 20
          }
        })
        .then((res) => setFaqs(res.data.faqs))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Search Suggestions
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/faq/search-suggest', {
          params: { q: search }
        });

        setSuggestions(res.data.results || []);
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="page page--narrow">
      <header
        style={{
          textAlign: 'center',
          margin: '3rem 0'
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: '1rem'
          }}
        >
          How can we help?
        </h1>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Search our community-driven knowledge base.
        </p>

        <div
          style={{
            position: 'relative',
            maxWidth: '600px',
            margin: '2rem auto 0'
          }}
        >
          <input
            type="search"
            className="input-field"
            placeholder="🔍 Search FAQs or ask AI..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
              }, 150);
            }}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              borderRadius: '30px'
            }}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '12px',
                marginTop: '5px',
                zIndex: 1000,
                textAlign: 'left',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              {suggestions.map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSearch(item.question);
                    setShowSuggestions(false);
                  }}
                >
                  🔍 {item.question}
                </div>
              ))}
            </div>
          )}
        </div>

        {search.trim() && (
          <div style={{ marginTop: '15px' }}>
            <Link to="/chat" className="btn-primary">
              🤖 Ask AI about "{search}"
            </Link>
          </div>
        )}
      </header>

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}
      >
        {loading ? (
          <div className="loading-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : faqs.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {faqs.map((faq) => (
              <article
                key={faq._id}
                className="admin-card hover-lift"
              >
                <h3>{faq.question}</h3>

                <p
                  style={{
                    marginTop: '8px',
                    color: 'var(--text-muted)'
                  }}
                >
                  {faq.answer}
                </p>

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '0.85rem',
                    color: 'var(--primary)'
                  }}
                >
                  ▲ {faq.upvotes?.length || 0} Upvotes
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            className="empty-state-card"
            style={{ textAlign: 'center' }}
          >
            <h2>No answers found</h2>

            <p>
              We couldn't find an exact match for your search.
            </p>

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}
            >
              {user ? (
                <>
                  <Link to="/chat" className="btn-primary">
                    Ask the AI Tutor
                  </Link>

                  <Link to="/add-faq" className="btn-ghost">
                    Submit a Question
                  </Link>
                </>
              ) : (
                <Link to="/login" className="btn-primary">
                  Log in to ask AI
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
