import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const statusConfig = {
  approved: { label: 'Approved', className: 'badge badge--success', icon: '' },
  pending: { label: 'Pending review', className: 'badge badge--warn', icon: '' },
  rejected: { label: 'Rejected', className: 'badge badge--danger', icon: '' }
};

const MySubmissions = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/faq/my-submissions')
      .then(res => setFaqs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = faqs.filter(f => {
    const status = f.status || (f.isApproved ? 'approved' : 'pending');
    return filter === 'all' || status === filter;
  });

  return (
    <div className="page page--narrow">
      <header className="dash-header">
        <div>
          <h1> My Submissions</h1>
          <p>FAQs you submitted — only approved ones appear on the public library.</p>
        </div>
        <Link to="/add-faq" className="btn-primary">+ New submission</Link>
      </header>

      <div className="filter-pills">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            type="button"
            className={`pill ${filter === f ? 'pill--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${faqs.filter(x => (x.status || (x.isApproved ? 'approved' : 'pending')) === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-grid">{[1, 2].map(i => <div key={i} className="skeleton-card" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon"></span>
          <h3>No submissions yet</h3>
          <p>Help thousands of students — share a problem you solved.</p>
          <Link to="/add-faq" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Submit FAQ</Link>
        </div>
      ) : (
        <div className="submission-list">
          {filtered.map(faq => {
            const status = faq.status || (faq.isApproved ? 'approved' : 'pending');
            const cfg = statusConfig[status] || statusConfig.pending;
            return (
              <article key={faq._id} className="submission-card hover-lift">
                <div className="submission-card__top">
                  <h3>{faq.question}</h3>
                  <span className={cfg.className}>{cfg.icon} {cfg.label}</span>
                </div>
                <p className="submission-card__answer">{faq.answer?.slice(0, 200)}{faq.answer?.length > 200 ? '...' : ''}</p>
                {status === 'rejected' && faq.rejectReason && (
                  <p className="submission-card__reject"><strong>Reason:</strong> {faq.rejectReason}</p>
                )}
                <small className="text-muted">
                  Submitted {new Date(faq.createdAt).toLocaleString()}
                  {faq.source === 'ai' && ' · from AI chat'}
                </small>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySubmissions;