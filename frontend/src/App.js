import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import api from './api';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddFAQ from './pages/AddFAQ';
import MySubmissions from './pages/MySubmissions';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import AuthSuccess from './pages/AuthSuccess';
import AIChat from './pages/AIChat';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/current-user', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading Support Hub...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess setUser={setUser} />} />
          <Route path="/dashboard" element={<PrivateRoute user={user}><Dashboard user={user} /></PrivateRoute>} />
          <Route path="/add-faq" element={<PrivateRoute user={user}><AddFAQ user={user} /></PrivateRoute>} />
          <Route path="/my-submissions" element={<PrivateRoute user={user}><MySubmissions /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute user={user}><AdminPanel user={user} /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute user={user}><AIChat user={user} /></PrivateRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
