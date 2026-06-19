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
      {}
      <header className="dash-header">
        <div>
          <h1>
            Welcome back, <span className="gradient-text">{firstName}</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px' }}>
            Here's your support platform overview.
          </p>
        </div>
        <span className="role-pill">{user?.role || 'student'}</span>
      </header>

      {}
      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-card" style={{ height: '50px' }} />)}
        </div>
      ) : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Published FAQs</span>
            <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-heading)' }}>{stats.approved || 0}</span>
          </div>
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Pending Reviews</span>
            <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-heading)' }}>{stats.pending || 0}</span>
          </div>
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>AI Messages Left</span>
            <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-heading)' }}>
              {stats.aiRemaining || 0} <span style={{ fontSize: '14px', color: 'var(--text-subtle)' }}>/ {stats.aiDailyLimit}</span>
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '44px' }}>
        <Link to="/add-faq" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-lift">
          <span style={{ fontSize: '15px', fontWeight: '500' }}>Submit FAQ</span>
          <span style={{ color: 'var(--text-subtle)' }}>→</span>
        </Link>
        <Link to="/my-submissions" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-lift">
          <span style={{ fontSize: '15px', fontWeight: '500' }}>My Submissions</span>
          <span style={{ color: 'var(--text-subtle)' }}>→</span>
        </Link>
        <Link to="/chat" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-lift">
          <span style={{ fontSize: '15px', fontWeight: '500' }}>AI Chat Tutor</span>
          <span style={{ color: 'var(--text-subtle)' }}>→</span>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-lift">
            <span style={{ fontSize: '15px', fontWeight: '500' }}>Admin Panel</span>
            <span style={{ color: 'var(--text-subtle)' }}>→</span>
          </Link>
        )}
      </div>

      {}
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