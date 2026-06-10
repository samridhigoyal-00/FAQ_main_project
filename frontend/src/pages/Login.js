import React from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api';

const Login = () => {
  return (
    <div className="login-page">
      <div className="login-card hover-lift">
        <div className="login-card__icon">💬</div>
        <h1>Welcome to <span className="gradient-text">SupportHub</span></h1>
        <p className="text-muted">Sign in to ask AI, browse FAQs, and help 10,000+ students.</p>
        <a href={`${API_BASE}/auth/google`} className="btn-google">
          <img src="https://www.google.com/favicon.ico" alt="" width="20" height="20" />
          Continue with Google
        </a>
        <span className="login-divider">dev mode</span>
        <a href={`${API_BASE}/auth/bypass`} className="btn-secondary btn-block">Admin dev login</a>
        <a href={`${API_BASE}/auth/bypass-student`} className="btn-ghost btn-block">Student dev login</a>
        <Link to="/" className="link-muted" style={{ display: 'block', marginTop: '24px' }}>← Browse FAQs without login</Link>
      </div>
    </div>
  );
};

export default Login;
