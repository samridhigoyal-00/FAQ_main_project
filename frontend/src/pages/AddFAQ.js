import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getAuthConfig } from '../api';

const AddFAQ = ({ user }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [checking, setChecking] = useState(false);

  const checkDuplicate = async () => {
    if (question.trim().length < 8) return;
    setChecking(true);
    try {
      const res = await api.post('/faq/check-duplicate', { question }, getAuthConfig());
      setSimilar(res.data.similar || []);
    } catch {
      setSimilar([]);
    }
    setChecking(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      await api.post('/faq/add', { question, answer, isAnonymous }, getAuthConfig());
      setMessage(
        user?.role === 'admin'
          ? '✅ Published! All students can see this FAQ now.'
          : '✅ Submitted! Admin will approve before it appears in the library.'
      );
      setQuestion('');
      setAnswer('');
      setSimilar([]);
      setIsAnonymous(false);
    } catch (err) {
      setIsError(true);
      if (err.response?.status === 409) {
        setSimilar(err.response.data.similar || []);
        setMessage('⚠️ Very similar FAQ already exists. Consider upvoting the existing one.');
      } else {
        setMessage('❌ Could not submit. Check connection and try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="page page--narrow">
      <div className="form-card hover-lift">
        <h1>➕ Share a solution</h1>
        <p className="text-muted">
          Help fellow students. {user?.role !== 'admin' && 'Your FAQ stays hidden until admin approves.'}
        </p>

        {message && (
          <div className={`alert ${isError ? 'alert--warn' : 'alert--success'}`}>{message}</div>
        )}

        {similar.length > 0 && (
          <div className="similar-box">
            <p><strong>Similar existing FAQs:</strong></p>
            <ul>
              {similar.map(s => (
                <li key={s._id}>
                  <Link to={`/?q=${encodeURIComponent(s.question)}`}>{s.question}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="label">Problem / Question</label>
          <input
            className="input-field"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onBlur={checkDuplicate}
            placeholder="e.g. Cannot submit assignment on portal"
            required
          />
          {checking && <small className="text-muted">Checking duplicates...</small>}

          <label className="label">Step-by-step solution</label>
          <textarea
            className="input-field textarea"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write clear steps so others can follow..."
            required
          />

          <label className="checkbox-row">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            🕵️ Hide my name (anonymous)
          </label>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Submitting...' : user?.role === 'admin' ? 'Publish FAQ' : 'Submit for approval'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/my-submissions" className="link-muted">View my submissions →</Link>
        </p>
      </div>
    </div>
  );
};

export default AddFAQ;
