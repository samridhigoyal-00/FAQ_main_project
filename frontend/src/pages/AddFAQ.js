import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AddFAQ = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const checkDuplicates = async () => {
    if (!formData.question.trim() || formData.question.length < 10) return;
    try {
      const res = await api.post('/faq/check-duplicate', { question: formData.question });
      if (res.data.hasDuplicate) {
        setDuplicateWarning(res.data.similar);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Duplicate check failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/faq/add', formData);
      navigate('/my-submissions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit FAQ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--narrow">
      <header className="dash-header">
        <div>
          <h1> Submit a new FAQ</h1>
          <p>Help your fellow students by documenting a solution.</p>
        </div>
      </header>

      {error && <div className="alert alert--danger">{error}</div>}

      <form className="auth-card" onSubmit={handleSubmit} style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
        <div className="input-group">
          <label>Question / Problem</label>
          <input
            className="input-field"
            placeholder="e.g. How do I fix the MongoDB connection error?"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            onBlur={checkDuplicates}
            required
            minLength={10}
          />
        </div>

        {duplicateWarning && (
          <div className="alert alert--warn">
            <strong>️ Similar FAQs found:</strong>
            <ul style={{ margin: '8px 0 0 16px', fontSize: '0.9rem' }}>
              {duplicateWarning.slice(0, 2).map((faq, i) => (
                <li key={i}>{faq.question}</li>
              ))}
            </ul>
            <p style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>Make sure your question isn't already answered before submitting!</p>
          </div>
        )}

        <div className="input-group" style={{ marginTop: '1rem' }}>
          <label>Answer / Solution</label>
          <textarea
            className="input-field textarea"
            placeholder="Explain the step-by-step solution here..."
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            required
            rows={6}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} disabled={loading}>
          {loading ? 'Submitting...' : (user?.role === 'admin' ? 'Publish Directly' : 'Submit for Approval')}
        </button>
      </form>
    </div>
  );
};

export default AddFAQ;