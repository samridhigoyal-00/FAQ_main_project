import React, { useState, useEffect, useCallback } from 'react';
import api, { getAuthConfig } from '../api';

const AdminPanel = ({ user }) => {
  const [faqs, setFaqs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ question: '', answer: '' });
  const [message, setMessage] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [tab, setTab] = useState('pending');

  const fetchAll = useCallback(async () => {
    try {
      const [faqRes, analyticsRes] = await Promise.all([
        api.get('/faq/admin/all', getAuthConfig()),
        api.get('/faq/admin/analytics', getAuthConfig())
      ]);
      setFaqs(faqRes.data);
      setAnalytics(analyticsRes.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchAll();
  }, [user, fetchAll]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/faq/${id}/approve`, {}, getAuthConfig());
      setMessage('✅ Approved & published');
      fetchAll();
    } catch {
      setMessage('❌ Approve failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/faq/${id}/reject`, { reason: rejectReason }, getAuthConfig());
      setMessage('FAQ rejected');
      setRejectId(null);
      setRejectReason('');
      fetchAll();
    } catch {
      setMessage('❌ Reject failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ permanently?')) return;
    try {
      await api.delete(`/faq/${id}`, getAuthConfig());
      setMessage('Deleted');
      fetchAll();
    } catch {
      setMessage('❌ Delete failed');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/faq/${id}`, editData, getAuthConfig());
      setEditId(null);
      setMessage('✅ Updated');
      fetchAll();
    } catch {
      setMessage('❌ Update failed');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="empty-state-card">
          <h2>🚫 Admin only</h2>
          <p>You need admin access for this page.</p>
        </div>
      </div>
    );
  }

  const getStatus = (f) => f.status || (f.isApproved ? 'approved' : 'pending');
  const pending = faqs.filter(f => getStatus(f) === 'pending');
  const approved = faqs.filter(f => getStatus(f) === 'approved');
  const rejected = faqs.filter(f => getStatus(f) === 'rejected');
  const list = tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : faqs;

  const renderCard = (faq, index) => (
    <article key={faq._id} className={`admin-card hover-lift admin-card--${getStatus(faq)}`}>
      {editId === faq._id ? (
        <>
          <input className="input-field" value={editData.question} onChange={e => setEditData({ ...editData, question: e.target.value })} />
          <textarea className="input-field textarea" value={editData.answer} onChange={e => setEditData({ ...editData, answer: e.target.value })} />
          <div className="btn-row">
            <button type="button" className="btn-primary btn-sm" onClick={() => handleUpdate(faq._id)}>Save</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="admin-card__head">
            <h3>{index + 1}. {faq.question}</h3>
            <span className={`badge badge--${getStatus(faq) === 'approved' ? 'success' : getStatus(faq) === 'rejected' ? 'danger' : 'warn'}`}>
              {getStatus(faq)}
            </span>
          </div>
          <p className="admin-card__answer">{faq.answer}</p>
          <small className="text-muted">
            By {faq.createdBy} · {faq.source || 'student'} · ▲{faq.upvotes?.length || 0}
            {faq.reports?.length > 0 && ` · ⚠️ ${faq.reports.length} report(s)`}
          </small>
          {faq.reports?.length > 0 && (
            <div className="reports-list">
              {faq.reports.slice(-3).map((r, i) => (
                <span key={i} className="report-chip">{r.reason} — {r.reportedBy}</span>
              ))}
            </div>
          )}
          {rejectId === faq._id ? (
            <div className="reject-box">
              <input
                className="input-field"
                placeholder="Rejection reason for student"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <button type="button" className="btn-sm btn-danger" onClick={() => handleReject(faq._id)}>Confirm reject</button>
              <button type="button" className="btn-sm btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
            </div>
          ) : (
            <div className="btn-row">
              {getStatus(faq) !== 'approved' && (
                <button type="button" className="btn-sm btn-primary" onClick={() => handleApprove(faq._id)}>✅ Approve</button>
              )}
              {getStatus(faq) !== 'rejected' && (
                <button type="button" className="btn-sm btn-danger" onClick={() => { setRejectId(faq._id); setRejectReason(''); }}>Reject</button>
              )}
              <button type="button" className="btn-sm btn-ghost" onClick={() => { setEditId(faq._id); setEditData({ question: faq.question, answer: faq.answer }); }}>Edit</button>
              <button type="button" className="btn-sm btn-ghost" onClick={() => handleDelete(faq._id)}>Delete</button>
            </div>
          )}
        </>
      )}
    </article>
  );

  return (
    <div className="page page--wide">
      <header className="dash-header">
        <div>
          <h1>🛠️ Admin Control</h1>
          <p>Approve student FAQs, reject low quality, monitor platform health.</p>
        </div>
      </header>

      {message && <div className="alert alert--success">{message}</div>}

      {analytics && (
        <div className="analytics-grid">
          <div className="analytics-tile"><span>✅ Approved</span><strong>{analytics.approved}</strong></div>
          <div className="analytics-tile"><span>⏳ Pending</span><strong>{analytics.pending}</strong></div>
          <div className="analytics-tile"><span>❌ Rejected</span><strong>{analytics.rejected}</strong></div>
          <div className="analytics-tile"><span>🤖 AI msgs today</span><strong>{analytics.aiMessagesToday}</strong></div>
        </div>
      )}

      <div className="filter-pills">
        {[
          ['pending', pending.length],
          ['approved', approved.length],
          ['rejected', rejected.length],
          ['all', faqs.length]
        ].map(([key, count]) => (
          <button
            key={key}
            type="button"
            className={`pill ${tab === key ? 'pill--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {key} ({count})
          </button>
        ))}
      </div>

      <div className="admin-list">
        {list.length === 0 ? (
          <div className="empty-state-card"><p>Nothing in this tab.</p></div>
        ) : (
          list.map((faq, i) => renderCard(faq, i))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
