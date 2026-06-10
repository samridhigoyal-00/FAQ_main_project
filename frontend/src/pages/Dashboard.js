import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getAuthConfig } from '../api';
import FAQList from '../components/FAQList';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api.get('/faq/stats', getAuthConfig())
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/faq', {
        params: { page, limit: 10, search: debouncedSearch, sort: 'newest' }
      });
      setFaqs(res.data.faqs);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="page page--narrow">
      <header className="dash-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p>Your help center — browse solved queries or get AI support.</p>
        </div>
        <span className="role-pill">{user?.role}</span>
      </header>

      <div className="stats-grid">
        <div className="stat-tile stat-tile--primary">
          <span className="stat-tile__icon">✅</span>
          <div>
            <p className="stat-tile__label">Approved solutions</p>
            <p className="stat-tile__value">{stats?.approvedFAQs ?? '—'}</p>
          </div>
        </div>
        <div className="stat-tile stat-tile--warn">
          <span className="stat-tile__icon">⏳</span>
          <div>
            <p className="stat-tile__label">Pending review</p>
            <p className="stat-tile__value">{stats?.pendingFAQs ?? '—'}</p>
          </div>
        </div>
        <div className="stat-tile stat-tile--ai">
          <span className="stat-tile__icon">🤖</span>
          <div>
            <p className="stat-tile__label">AI messages left today</p>
            <p className="stat-tile__value">
              {stats ? `${stats.aiRemaining}/${stats.aiDailyLimit}` : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="quick-grid">
        <Link to="/chat" className="quick-card quick-card--ai hover-lift">
          <span>🤖</span>
          <h3>AI Chat</h3>
          <p>Solve any platform problem with smart assistant</p>
        </Link>
        <Link to="/add-faq" className="quick-card hover-lift">
          <span>➕</span>
          <h3>Add FAQ</h3>
          <p>Share a solution — admin approves before publish</p>
        </Link>
        <Link to="/my-submissions" className="quick-card hover-lift">
          <span>📬</span>
          <h3>My Submissions</h3>
          <p>Track pending, approved & rejected FAQs</p>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="quick-card quick-card--admin hover-lift">
            <span>🛠️</span>
            <h3>Admin Panel</h3>
            <p>Approve, reject & analytics</p>
          </Link>
        )}
      </div>

      <section className="section-block">
        <div className="section-block__head">
          <h2>📚 Solved queries library</h2>
          <Link to="/" className="link-muted">View full page →</Link>
        </div>
        <input
          className="input-field"
          placeholder="Search approved solutions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="loading-grid">{[1, 2].map(i => <div key={i} className="skeleton-card" />)}</div>
        ) : (
          <FAQList faqs={faqs} search={debouncedSearch} onUpvote={fetchFaqs} compact />
        )}
        {pagination.totalPages > 1 && (
          <div className="pagination pagination--sm">
            <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span>{page}/{pagination.totalPages}</span>
            <button type="button" className="btn-ghost" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
