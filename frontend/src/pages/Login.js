import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import api, { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user, setUser, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const isExpired = params.get('expired') === 'true';

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleLocalAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (isRegistering) {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/dashboard', { replace: true });
      } else {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDev =
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '420px', margin: '60px auto', padding: '40px', background: 'var(--card-bg-color)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
        {}

        <h1 className="login-card__title" style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px' }}>
          Welcome to SupportHub
        </h1>

        {isExpired && (
          <div className="alert alert--warn" style={{ marginTop: '12px', marginBottom: '0' }}>
            Your session expired. Please log in again.
          </div>
        )}

        <p className="text-muted" style={{ marginTop: '12px', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
          {isExpired
            ? 'Sign in to continue where you left off.'
            : 'Sign in to ask questions, browse the knowledge base, and get AI-powered answers.'}
        </p>
        
        {error && (
          <div className="alert alert--error" style={{ marginBottom: '16px', color: '#d32f2f', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', fontSize: '14px', border: '1px solid #ffcdd2' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLocalAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ marginBottom: '0' }}
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            style={{ marginBottom: '0' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
            style={{ marginBottom: '0' }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isSubmitting ? 'Please wait...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-subtle)' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', marginLeft: '8px', fontSize: '14px' }}
          >
            {isRegistering ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 12px', fontSize: '13px', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {}
        <button
          type="button"
          id="google-login-btn"
          onClick={handleGoogleLogin}
          className="btn-google"
          style={{ width: '100%', marginTop: '0' }}
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

        <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-subtle)', lineHeight: '1.5', textAlign: 'center' }}>
          By continuing, you agree to our terms of service and privacy policy.
        </p>

        {}
        {isDev && (
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', textAlign: 'center' }}>
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