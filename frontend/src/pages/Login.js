// frontend/src/pages/Login.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isExpired = params.get('expired') === 'true';

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const isDev =
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Icon */}
        <div className="login-card__icon">💬</div>

        <h1 className="login-card__title" style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
          Welcome to SupportHub
        </h1>

        {isExpired && (
          <div className="alert alert--warn" style={{ marginTop: '12px', marginBottom: '0' }}>
            ⚠️ Your session expired. Please log in again.
          </div>
        )}

        <p className="text-muted" style={{ marginTop: '12px', marginBottom: '32px', fontSize: '15px', lineHeight: '1.6' }}>
          {isExpired
            ? 'Sign in to continue where you left off.'
            : 'Sign in to ask questions, browse the knowledge base, and get AI-powered answers.'}
        </p>

        {/* Google Sign-in */}
        <button
          id="google-login-btn"
          onClick={handleGoogleLogin}
          className="btn-google"
          style={{ fontSize: '15px', fontWeight: '600' }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="Google"
            width="20"
            height="20"
            style={{ background: '#fff', borderRadius: '50%', padding: '2px' }}
          />
          Continue with Google
        </button>

        <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-subtle)', lineHeight: '1.5' }}>
          By continuing, you agree to our terms of service and privacy policy.
        </p>

        {/* Dev-only bypass */}
        {isDev && (
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
              Local Testing Only
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`${API_BASE}/auth/bypass`} className="btn-ghost" style={{ flex: 1, fontSize: '13px', textAlign: 'center' }}>
                Admin Bypass
              </a>
              <a href={`${API_BASE}/auth/bypass-student`} className="btn-ghost" style={{ flex: 1, fontSize: '13px', textAlign: 'center' }}>
                Student Bypass
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;