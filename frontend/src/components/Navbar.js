import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {}
      <Link to={user ? '/dashboard' : '/'} className="navbar__brand">
        <span className="navbar__logo"></span>
        <span>
          Support<span className="gradient-text">Hub</span>
        </span>
      </Link>

      {}
      <div className="navbar__links">
        <Link
          to="/"
          className={`nav-link ${isActive('/') ? 'nav-link--active' : ''}`}
        >
          Help Center
        </Link>

        {user ? (
          <>
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'nav-link--active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/chat"
              className={`nav-link nav-link--ai ${isActive('/chat') ? 'nav-link--ai-active' : ''}`}
            >
              AI Chat 
            </Link>
            <Link
              to="/add-faq"
              className={`nav-link ${isActive('/add-faq') ? 'nav-link--active' : ''}`}
            >
              Add FAQ
            </Link>
            <Link
              to="/my-submissions"
              className={`nav-link ${isActive('/my-submissions') ? 'nav-link--active' : ''}`}
            >
              My Posts
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`nav-link nav-link--admin ${isActive('/admin') ? 'nav-link--admin-active' : ''}`}
              >
                Admin
              </Link>
            )}
            <button type="button" className="nav-link" onClick={logout} style={{ cursor: 'pointer' }}>
              Logout
            </button>
            <div className="navbar__avatar" title={user.name} aria-label={`Logged in as ${user.name}`}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <Link to="/login" className="btn-primary btn-sm">
            Sign In
          </Link>
        )}

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', color: 'var(--text-color)' }}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
