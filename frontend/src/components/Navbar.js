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
      {/* Brand */}
      <Link to={user ? '/dashboard' : '/'} className="navbar__brand">
        <span className="navbar__logo">💬</span>
        <span>
          Support<span className="gradient-text">Hub</span>
        </span>
      </Link>

      {/* Desktop Links */}
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
              AI Chat 🤖
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
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
