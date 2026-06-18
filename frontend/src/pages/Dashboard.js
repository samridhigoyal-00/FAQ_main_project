// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faq/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="page page--narrow">
      {/* ── Header ── */}
      <header className="dash-header">
        <div>
          <h1>
            👋 Welcome back, <span className="gradient-text">{firstName}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px' }}>
            Here's your support platform overview.
          </p>
        </div>
        <span className="role-pill">{user?.role || 'student'}</span>
      </header>

      {/* ── Stats ── */}
      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-card" style={{ height: '90px' }} />)}
        </div>
      ) : stats && (
        <div className="stats-grid">
          <div className="stat-tile stat-tile--primary">
            <span className="stat-tile__icon">📚</span>
            <div>
              <p className="stat-tile__label">Published FAQs</p>
              <p className="stat-tile__value">{stats.approved || 0}</p>
            </div>
          </div>
          <div className="stat-tile stat-tile--warn">
            <span className="stat-tile__icon">⏳</span>
            <div>
              <p className="stat-tile__label">Pending Reviews</p>
              <p className="stat-tile__value">{stats.pending || 0}</p>
            </div>
          </div>
          <div className="stat-tile stat-tile--ai">
            <span className="stat-tile__icon">🤖</span>
            <div>
              <p className="stat-tile__label">AI Messages Left</p>
              <p className="stat-tile__value">
                {stats.aiRemaining || 0}
                <small style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-muted)' }}>
                  {' '}/ {stats.aiDailyLimit}
                </small>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="quick-grid">
        <Link to="/add-faq" className="quick-card hover-lift">
          <span>✍️</span>
          <h3>Submit FAQ</h3>
          <p>Contribute a question and answer to help the community.</p>
        </Link>
        <Link to="/my-submissions" className="quick-card hover-lift">
          <span>📋</span>
          <h3>My Submissions</h3>
          <p>Track the status of your submitted FAQs.</p>
        </Link>
        <Link to="/chat" className="quick-card quick-card--ai hover-lift">
          <span>💬</span>
          <h3>AI Chat Tutor</h3>
          <p>Get instant answers from our AI — available 24/7.</p>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="quick-card quick-card--admin hover-lift">
            <span>🛡️</span>
            <h3>Admin Panel</h3>
            <p>Review and manage all submitted FAQs.</p>
          </Link>
        )}
      </div>

      {/* ── Browse CTA ── */}
      <div className="cta-ai-banner">
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-heading)' }}>
          Looking for a specific answer?
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '18px', fontSize: '14px' }}>
          Browse the community knowledge base or ask the AI tutor for help.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-secondary">Browse FAQs</Link>
          <Link to="/chat" className="btn-primary">Ask AI Tutor →</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;