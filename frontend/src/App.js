import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import { AuthProvider, useAuth } from './context/AuthContext';

function AppRoutes() {
  const { loading } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      <Navbar theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/add-faq" element={<PrivateRoute><AddFAQ /></PrivateRoute>} />
          <Route path="/my-submissions" element={<PrivateRoute><MySubmissions /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><AIChat /></PrivateRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;