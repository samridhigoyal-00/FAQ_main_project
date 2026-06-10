import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getAuthConfig } from '../api';

const FAQList = ({
  faqs,
  search = '',
  showReport = true,
  showUpvote = true,
  emptyMessage = 'No FAQs found.',
  onUpvote,
  compact = false
}) => {
  const [openId, setOpenId] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  const token = localStorage.getItem('token');

  const highlightText = (text, word) => {
    if (!word?.trim()) return text;
    const regex = new RegExp(`(${word.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = String(text).split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
        )}
      </span>
    );
  };

  const handleUpvote = async (faqId) => {
    if (!token) {
      alert('Please log in to upvote.');
      return;
    }
    try {
      await api.post(`/faq/${faqId}/upvote`, {}, getAuthConfig());
      onUpvote?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReport = async (faqId) => {
    if (!token) return;
    try {
      await api.post(`/faq/${faqId}/report`, { reason: reportReason || 'Incorrect or unhelpful' }, getAuthConfig());
      setReportMsg('Report submitted. Thank you.');
      setTimeout(() => {
        setReportingId(null);
        setReportMsg('');
        setReportReason('');
      }, 2000);
    } catch {
      setReportMsg('Could not submit report.');
    }
  };

  const trackView = (id) => {
    api.post(`/faq/${id}/view`).catch(() => {});
  };

  if (!faqs?.length) {
    return (
      <div className="empty-state-card">
        <span className="empty-icon">🔍</span>
        <h3>No results</h3>
        <p>{emptyMessage}</p>
        <Link to="/chat" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
          Ask AI instead →
        </Link>
      </div>
    );
  }

  return (
    <div className={`faq-list ${compact ? 'faq-list--compact' : ''}`}>
      {faqs.map(faq => {
        const isOpen = openId === faq._id;
        let upvoted = false;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            upvoted = faq.upvotes?.includes(payload.id);
          } catch (_) {}
        }

        return (
          <article
            key={faq._id}
            className={`faq-card hover-lift ${isOpen ? 'faq-card--open' : ''}`}
          >
            <button
              type="button"
              className="faq-card__header"
              onClick={() => {
                const next = isOpen ? null : faq._id;
                setOpenId(next);
                if (next) trackView(faq._id);
              }}
            >
              <span className={`faq-card__chevron ${isOpen ? 'open' : ''}`}>▶</span>
              <span className="faq-card__question">{highlightText(faq.question, search)}</span>
              <div className="faq-card__meta" onClick={e => e.stopPropagation()}>
                {showUpvote && (
                  <button
                    type="button"
                    className={`upvote-btn ${upvoted ? 'upvote-btn--active' : ''}`}
                    onClick={() => handleUpvote(faq._id)}
                  >
                    ▲ {faq.upvotes?.length || 0}
                  </button>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="faq-card__body">
                <div className="faq-card__answer-label">💡 Solution</div>
                <p className="faq-card__answer">{highlightText(faq.answer || 'No answer yet.', search)}</p>
                <div className="faq-card__footer">
                  <span>
                    {faq.isAnonymous ? 'Anonymous student' : faq.createdBy || 'Community'}
                  </span>
                  <span>{new Date(faq.createdAt).toLocaleDateString()}</span>
                  {faq.viewCount > 0 && <span>{faq.viewCount} views</span>}
                </div>
                {showReport && token && (
                  <div className="faq-card__actions">
                    {reportingId === faq._id ? (
                      <div className="report-box">
                        <input
                          className="input-field"
                          placeholder="Why is this wrong? (optional)"
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                        />
                        <button type="button" className="btn-sm btn-danger" onClick={() => handleReport(faq._id)}>Submit</button>
                        <button type="button" className="btn-sm btn-ghost" onClick={() => setReportingId(null)}>Cancel</button>
                        {reportMsg && <span className="text-success">{reportMsg}</span>}
                      </div>
                    ) : (
                      <button type="button" className="btn-sm btn-ghost" onClick={() => setReportingId(faq._id)}>
                        ⚠️ Report wrong answer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default FAQList;
