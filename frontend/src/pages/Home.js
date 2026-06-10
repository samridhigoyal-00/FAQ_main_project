import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import FAQList from '../components/FAQList';

const Home = () => {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const q = params.get('q');
    if (q) setSearch(q);
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/faq', {
        params: { page, limit: 12, search: debouncedSearch, sort: sortBy }
      });
      setFaqs(res.data.faqs);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    api.get('/faq/search-suggest', { params: { q: debouncedSearch } })
      .then(res => setSuggestions(res.data.results || []))
      .catch(() => setSuggestions([]));
  }, [debouncedSearch]);

  const askAI = () => {
    const q = search.trim();
    navigate(q ? `/chat?q=${encodeURIComponent(q)}` : '/chat');
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__badge">Student Support Platform</div>
        <h1 className="hero__title">
          Find answers <span className="gradient-text">fast</span>
        </h1>
        <p className="hero__subtitle">
          Step 1: Search solved problems from the community. Step 2: Still stuck? Ask our AI assistant.
        </p>

        <div className="search-hero">
          <span className="search-hero__icon">🔍</span>
          <input
            className="search-hero__input"
            type="text"
            placeholder="Describe your problem (login, assignment, portal...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="button" className="btn-primary search-hero__btn" onClick={() => setDebouncedSearch(search)}>
            Search
          </button>
        </div>

        {suggestions.length > 0 && debouncedSearch.length >= 2 && (
          <div className="suggest-dropdown">
            {suggestions.map(s => (
              <button
                key={s._id}
                type="button"
                className="suggest-item"
                onClick={() => setSearch(s.question)}
              >
                {s.question}
              </button>
            ))}
          </div>
        )}

        <div className="hero__actions">
          <button type="button" className="btn-secondary" onClick={askAI}>
            🤖 Ask AI instead
          </button>
          {isLoggedIn ? (
            <Link to="/add-faq" className="btn-ghost">➕ Contribute a solution</Link>
          ) : (
            <Link to="/login" className="btn-ghost">Login to contribute</Link>
          )}
        </div>
      </section>

      <section className="method-cards">
        <div className="method-card method-card--faq">
          <span className="method-card__num">1</span>
          <h3>Browse FAQs</h3>
          <p>Approved answers from students & admins — free & instant.</p>
        </div>
        <div className="method-card method-card--ai">
          <span className="method-card__num">2</span>
          <h3>AI Assistant</h3>
          <p>Any online platform problem — uses FAQ knowledge + Gemini.</p>
        </div>
      </section>

      <div className="toolbar">
        <p className="toolbar__count">
          {loading ? 'Loading...' : `${pagination.total} approved solution(s)`}
        </p>
        <select className="select-field" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="upvotes">Most helpful</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : (
        <>
          <FAQList
            faqs={faqs}
            search={debouncedSearch}
            onUpvote={fetchFaqs}
            emptyMessage={
              debouncedSearch
                ? `No FAQ match for "${debouncedSearch}". Try AI for a custom answer.`
                : 'No approved FAQs yet. Be the first to contribute!'
            }
          />
          {!loading && faqs.length === 0 && debouncedSearch && (
            <div className="cta-ai-banner">
              <p>Couldn't find your answer in the library?</p>
              <button type="button" className="btn-primary" onClick={askAI}>
                Solve with AI →
              </button>
            </div>
          )}
        </>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Previous
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button
            type="button"
            className="btn-ghost"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
